import { useEffect, useRef } from 'react';
import { performanceTracker } from '../midi/PerformanceTracker';
import { GrooveData } from '../types';
import { logger } from '../utils/logger';

/** Minimal interface for the GrooveEngine anchor. Avoids importing the full class. */
interface EngineAnchor {
  getPlayStartPerformanceTime(): number | null;
}

/**
 * Hook that bridges playback, MIDI events, and PerformanceTracker.
 *
 * Enables/disables tracking based on playback state and tracking toggle.
 * Listens for MIDI hits and analyzes them with PerformanceTracker.
 * Dispatches 'midi-tracking-hit' events with analysis results.
 *
 * @param engine - Optional GrooveEngine (or compatible anchor) whose
 *   getPlayStartPerformanceTime() provides the audio-start clock anchor.
 *   Falls back to performance.now() when absent or anchor is null.
 */
export function useMIDITracking(
  trackingEnabled: boolean,
  isPlaying: boolean,
  groove: GrooveData,
  currentPosition: number,
  engine?: EngineAnchor | null
) {
  const playStartTimeRef = useRef<number | null>(null);
  const lastStateRef = useRef<{ isPlaying: boolean; trackingEnabled: boolean }>({
    isPlaying: false,
    trackingEnabled: false,
  });

  // Enable/disable tracker based on playback state
  useEffect(() => {
    const lastState = lastStateRef.current;
    const shouldEnable = isPlaying && trackingEnabled;
    const wasEnabled = lastState.isPlaying && lastState.trackingEnabled;

    // Only enable if transitioning from disabled to enabled
    if (shouldEnable && !wasEnabled) {
      // Prefer the audio-start anchor from GrooveEngine (captured at the exact instant
      // play() was called), so PerformanceTracker uses the same clock as MIDI events.
      // Fall back to performance.now() when engine is absent or anchor is not yet set.
      const engineAnchor = engine?.getPlayStartPerformanceTime?.() ?? null;
      playStartTimeRef.current = engineAnchor ?? performance.now();
      // Pass full GrooveData (includes division, swing, timeSignature)
      performanceTracker.enable(groove, playStartTimeRef.current);
    }
    // Only disable if transitioning from enabled to disabled
    else if (!shouldEnable && wasEnabled) {
      performanceTracker.disable();
      playStartTimeRef.current = null;
    }

    lastStateRef.current = { isPlaying, trackingEnabled };
  }, [isPlaying, trackingEnabled, groove]);

  // Sync tempo changes mid-session (for auto speed-up support)
  useEffect(() => {
    if (isPlaying && trackingEnabled) {
      performanceTracker.setTempo(groove.tempo);
    }
  }, [groove.tempo, isPlaying, trackingEnabled]);

  // Sync groove pattern changes mid-session (for live editing during playback — #121)
  // Uses updateGroove so stats/startTime are preserved (no reset).
  useEffect(() => {
    if (isPlaying && trackingEnabled) {
      performanceTracker.updateGroove(groove);
    }
  }, [groove, isPlaying, trackingEnabled]);

  // Listen for MIDI hits and analyze them
  useEffect(() => {
    if (!trackingEnabled || !isPlaying || !playStartTimeRef.current) return;

    const handleMIDIHit = (event: CustomEvent) => {
      const { voice, timestamp } = event.detail;

      // Analyze the hit using PerformanceTracker (now includes timingErrorMs and step-level quantization)
      const analysis = performanceTracker.analyzeHit(voice, timestamp);

      if (analysis) {
        // Debug: Log timing calculation
        logger.log(`⏱️ Timing: error=${analysis.timingErrorMs.toFixed(1)}ms, accuracy=${analysis.timingAccuracy}%, overall=${analysis.overall}%, tempo=${groove.tempo}BPM`);

        // Debug: Clearer format for timing analysis (0=slow, 50=on-time, 100=fast)
        const quarterBeatMs = (60 / groove.tempo) * 1000 / 4;
        const accuracy = Math.max(-100, Math.min(100, (analysis.timingErrorMs / quarterBeatMs) * 100));
        const rangeScore = ((accuracy + 100) / 200) * 100;
        logger.log(`timing-debug: error=${analysis.timingErrorMs.toFixed(1)}ms, score=${rangeScore.toFixed(0)} (0=slow, 50=on-time, 100=fast)`);

        // Get performed BPM (actual tempo from drummer's hits)
        const performedBpm = performanceTracker.getPerformedBpm();

        // Dispatch tracking event with analysis results
        window.dispatchEvent(new CustomEvent('midi-tracking-hit', {
          detail: {
            voice,
            position: currentPosition,
            analysis,  // { timingAccuracy, noteAccuracy, overall, feedback, timingErrorMs }
            timingError: analysis.timingErrorMs, // Signed error in ms (negative=slow, positive=fast)
            tempo: groove.tempo, // Pass actual tempo for accurate scaling
            performedBpm, // Actual BPM from drummer's hits (null if not yet estimated)
          }
        }));
      }
    };

    window.addEventListener('midi-note-hit', handleMIDIHit as EventListener);
    return () => window.removeEventListener('midi-note-hit', handleMIDIHit as EventListener);
  }, [trackingEnabled, isPlaying, currentPosition, groove.tempo]);

  return null; // Purely side-effects hook
}
