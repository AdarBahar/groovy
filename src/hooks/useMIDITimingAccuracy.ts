import { useState, useEffect, useRef } from 'react';

/**
 * useMIDITimingAccuracy
 *
 * Tracks real-time MIDI timing accuracy from 'midi-tracking-hit' events.
 * Accumulates scores during playback and calculates average when playback stops.
 *
 * Returns:
 * - timingAccuracy: Current timing accuracy (-100 to +100)
 * - isTracking: Whether actively recording hit events
 * - averageScore: Average timing score from last playback session (0-100)
 * - showingAverage: Whether displaying the average (persists until play starts or tracking disabled)
 */
export function useMIDITimingAccuracy(isPlaying: boolean = true, trackingEnabled: boolean = false) {
  const [timingAccuracy, setTimingAccuracy] = useState(0);
  const [isTracking, setIsTracking] = useState(false);
  const [averageScore, setAverageScore] = useState<number | null>(null);
  const [showingAverage, setShowingAverage] = useState(false);

  const resetTimerRef = useRef<number | null>(null);
  const scoresRef = useRef<number[]>([]);
  const wasPlayingRef = useRef(isPlaying);

  // Handle playback state changes
  useEffect(() => {
    // Detect transition from playing to stopped
    if (wasPlayingRef.current && !isPlaying && scoresRef.current.length > 0) {
      // Calculate and display average
      const sum = scoresRef.current.reduce((a, b) => a + b, 0);
      const avg = Math.round(sum / scoresRef.current.length);

      // Convert from -100 to +100 scale to 0 to 100 (where 50 is perfect)
      const displayScore = Math.max(0, Math.min(100, 50 + avg / 2));

      setAverageScore(displayScore);
      setShowingAverage(true);
      setTimingAccuracy(0);
      setIsTracking(false);

      console.log(`📊 Playback stopped. Average timing: ${avg.toFixed(1)}, display score: ${displayScore.toFixed(0)}`);

      // Clear scores for next session
      scoresRef.current = [];

      // Clear any existing reset timer
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }
    }

    // Detect transition from stopped to playing - clear the average
    if (!wasPlayingRef.current && isPlaying && showingAverage) {
      setShowingAverage(false);
      setAverageScore(null);
    }

    wasPlayingRef.current = isPlaying;
  }, [isPlaying, showingAverage]);

  // Handle tracking disabled - clear the average
  useEffect(() => {
    if (!trackingEnabled && showingAverage) {
      setShowingAverage(false);
      setAverageScore(null);
    }
  }, [trackingEnabled, showingAverage]);

  useEffect(() => {
    const handleTrackingHit = (event: CustomEvent) => {
      const { analysis, timingError, tempo } = event.detail;

      setIsTracking(true);

      // Clear any existing reset timer when hit is recorded (user is actively playing)
      if (resetTimerRef.current) {
        clearTimeout(resetTimerRef.current);
      }

      // Use signed timing error if available (in milliseconds)
      // Then normalize to -100 to +100 scale
      if (typeof timingError === 'number' && tempo) {
        // timingError is signed: negative = slow, positive = fast
        // A quarter beat is the max tolerance (from PerformanceTracker)
        // Quarter beat in ms = (60 / tempo) * 1000 / 4
        const beatDurationMs = (60 / tempo) * 1000;
        const quarterBeatMs = beatDurationMs / 4;

        // Scale: -quarterBeatMs to +quarterBeatMs becomes -100 to +100
        const scaledAccuracy = Math.max(-100, Math.min(100, (timingError / quarterBeatMs) * 100));
        const rounded = Math.round(scaledAccuracy);

        // Debug: Log scaling calculation
        console.log(`📊 Timing Accuracy: error=${timingError.toFixed(1)}ms, quarterBeat=${quarterBeatMs.toFixed(1)}ms, scaled=${scaledAccuracy.toFixed(1)}, rounded=${rounded}`);

        setTimingAccuracy(rounded);

        // Accumulate score for average calculation
        scoresRef.current.push(rounded);
      } else if (analysis && typeof analysis.timingAccuracy === 'number') {
        // Fallback: convert accuracy (0-100) to offset scale
        // This loses directional information, so we'll default to neutral
        const offsetFromPerfect = 100 - analysis.timingAccuracy; // 0 to 100
        const scaledOffset = offsetFromPerfect * 2 - 100; // -100 to +100
        setTimingAccuracy(Math.round(scaledOffset));
        scoresRef.current.push(Math.round(scaledOffset));
      }
    };

    window.addEventListener('midi-tracking-hit', handleTrackingHit as EventListener);

    return () => {
      window.removeEventListener('midi-tracking-hit', handleTrackingHit as EventListener);
    };
  }, []);

  return {
    timingAccuracy,
    isTracking,
    averageScore,
    showingAverage,
  };
}
