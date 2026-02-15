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

  // Enable/disable tracker based on playback state
  useEffect(() => {
    if (isPlaying && trackingEnabled) {
      // Start tracking
      playStartTimeRef.current = Date.now();
      const pattern = groove.measures[0]; // TODO: Handle multi-measure patterns
      performanceTracker.enable(pattern, groove.tempo, playStartTimeRef.current);
    } else {
      // Stop tracking
      performanceTracker.disable();
      playStartTimeRef.current = null;
    }
  }, [isPlaying, trackingEnabled, groove]);

  // Listen for MIDI hits and analyze them
  useEffect(() => {
    if (!trackingEnabled || !isPlaying) return;

    const handleMIDIHit = (event: CustomEvent) => {
      const { voice, timestamp } = event.detail;

      // Analyze the hit using PerformanceTracker
      const analysis = performanceTracker.analyzeHit(voice, timestamp);

      if (analysis) {
        // Dispatch tracking event with analysis results
        window.dispatchEvent(new CustomEvent('midi-tracking-hit', {
          detail: {
            voice,
            position: currentPosition,
            analysis,  // { timingAccuracy, noteAccuracy, overall, feedback }
          }
        }));
      }
    };

    window.addEventListener('midi-note-hit', handleMIDIHit as EventListener);
    return () => window.removeEventListener('midi-note-hit', handleMIDIHit as EventListener);
  }, [trackingEnabled, isPlaying, currentPosition]);

  return null; // Purely side-effects hook
}
