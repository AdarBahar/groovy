import { useState, useEffect } from 'react';

/**
 * useMIDIPerformedBpm
 *
 * Tracks the actual BPM being played by the drummer (detected from MIDI hits).
 * Uses EWMA smoothing to estimate tempo drift relative to the metronome.
 *
 * Returns:
 * - performedBpm: Detected BPM from drummer hits (null if not yet estimated or drift too large)
 * - isTracking: Whether actively recording hit events
 */
export function useMIDIPerformedBpm(isPlaying: boolean = true, trackingEnabled: boolean = false) {
  const [performedBpm, setPerformedBpm] = useState<number | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  useEffect(() => {
    // Clear BPM when playback stops
    if (!isPlaying) {
      setPerformedBpm(null);
      setIsTracking(false);
      return;
    }

    if (!trackingEnabled) {
      setPerformedBpm(null);
      setIsTracking(false);
      return;
    }

    const handleTrackingHit = (event: CustomEvent) => {
      const { performedBpm: bpm } = event.detail;
      setIsTracking(true);

      if (typeof bpm === 'number') {
        setPerformedBpm(bpm);
      } else if (bpm === null) {
        // Insufficient data or large drift detected
        setPerformedBpm(null);
      }
    };

    window.addEventListener('midi-tracking-hit', handleTrackingHit as EventListener);

    return () => {
      window.removeEventListener('midi-tracking-hit', handleTrackingHit as EventListener);
    };
  }, [isPlaying, trackingEnabled]);

  return {
    performedBpm,
    isTracking,
  };
}
