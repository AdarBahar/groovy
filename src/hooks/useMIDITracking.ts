import { useEffect, useRef } from 'react';
import { performanceTracker } from '../midi/PerformanceTracker';
import { GrooveData } from '../types';

/**
 * Hook that bridges playback, MIDI events, and PerformanceTracker.
 *
 * Enables/disables tracking based on playback state and tracking toggle.
 * Listens for MIDI hits and analyzes them with PerformanceTracker.
 * Dispatches 'midi-tracking-hit' events with analysis results.
 */
export function useMIDITracking(
  trackingEnabled: boolean,
  isPlaying: boolean,
  groove: GrooveData,
  currentPosition: number
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
      // Use performance.now() to match MIDI event timestamps
      playStartTimeRef.current = performance.now();
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

  // Listen for MIDI hits and analyze them
  useEffect(() => {
    if (!trackingEnabled || !isPlaying || !playStartTimeRef.current) return;

    const handleMIDIHit = (event: CustomEvent) => {
      const { voice, timestamp } = event.detail;

      // Analyze the hit using PerformanceTracker (now includes timingErrorMs and step-level quantization)
      const analysis = performanceTracker.analyzeHit(voice, timestamp);

      if (analysis) {
        // Debug: Log timing calculation
        console.log(`⏱️ Timing: error=${analysis.timingErrorMs.toFixed(1)}ms, accuracy=${analysis.timingAccuracy}%, overall=${analysis.overall}%, tempo=${groove.tempo}BPM`);

        // Debug: Clearer format for timing analysis (0=slow, 50=on-time, 100=fast)
        const quarterBeatMs = (60 / groove.tempo) * 1000 / 4;
        const accuracy = Math.max(-100, Math.min(100, (analysis.timingErrorMs / quarterBeatMs) * 100));
        const rangeScore = ((accuracy + 100) / 200) * 100;
        console.log(`timing-debug: error=${analysis.timingErrorMs.toFixed(1)}ms, score=${rangeScore.toFixed(0)} (0=slow, 50=on-time, 100=fast)`);

        // Dispatch tracking event with analysis results
        window.dispatchEvent(new CustomEvent('midi-tracking-hit', {
          detail: {
            voice,
            position: currentPosition,
            analysis,  // { timingAccuracy, noteAccuracy, overall, feedback, timingErrorMs }
            timingError: analysis.timingErrorMs, // Signed error in ms (negative=slow, positive=fast)
            tempo: groove.tempo, // Pass actual tempo for accurate scaling
          }
        }));
      }
    };

    window.addEventListener('midi-note-hit', handleMIDIHit as EventListener);
    return () => window.removeEventListener('midi-note-hit', handleMIDIHit as EventListener);
  }, [trackingEnabled, isPlaying, currentPosition, groove.tempo]);

  return null; // Purely side-effects hook
}
