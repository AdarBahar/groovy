/**
 * Pure performance grading functions — extracted from PerformanceTracker.
 * All functions are stateless and accept required values as parameters.
 */

import { DrumVoice } from '../types';
import { GroovePattern } from './PerformanceTracker';

/**
 * Calculate signed timing error and absolute error.
 * Spec Section 5: Quantize to nearest offset in beat grid.
 *
 * @param posInBeat - ms elapsed within the current beat (elapsedMs % beatDurMs)
 * @param beatDurMs - duration of one beat in ms
 * @param beatOffsets - swing-aware grid offsets within one beat
 */
export function calculateTimingError(
  posInBeat: number,
  beatDurMs: number,
  beatOffsets: number[]
): { errorMs: number; absError: number } {
  let minDist = Infinity;
  let nearestOffset = 0;
  for (const offset of beatOffsets) {
    const dist = Math.abs(posInBeat - offset);
    if (dist < minDist) {
      minDist = dist;
      nearestOffset = offset;
    }
  }
  // Also consider next-beat downbeat: a hit just before the downbeat reports a small
  // negative error instead of a large late error (e.g. posInBeat=490, beatDurMs=500 → -10ms)
  const nextDownbeatDist = Math.abs(posInBeat - beatDurMs);
  if (nextDownbeatDist < minDist) {
    nearestOffset = beatDurMs;
  }

  const errorMs = posInBeat - nearestOffset; // signed: negative=slow, positive=fast
  return { errorMs, absError: Math.abs(errorMs) };
}

/**
 * Calculate timing accuracy with tempo-aware thresholds.
 * Spec Section 6: Use tempo-aware grading bands.
 *
 * @param absError - absolute timing error in ms
 * @param beatDurMs - duration of one beat in ms (for tempo-aware scaling)
 */
export function calculateTimingAccuracy(absError: number, beatDurMs: number): number {
  const acceptWindow = Math.min(90, beatDurMs * 0.18);
  const onTimeMs = Math.min(25, beatDurMs * 0.05);

  if (absError > acceptWindow) return 0;       // Miss
  if (absError <= onTimeMs) return 100;         // Perfect
  if (absError <= onTimeMs * 2) return 75;      // Good
  if (absError <= acceptWindow * 0.55) return 50; // Fair
  return 25;                                    // Poor
}

/**
 * Check if the hit note matches the loaded pattern at the current step.
 *
 * @param grooveVoice - Voice that was hit
 * @param currentStep - Current step index (wraps across all measures)
 * @param loadedPattern - Flattened groove pattern
 */
export function checkNoteAccuracy(
  grooveVoice: DrumVoice,
  currentStep: number,
  loadedPattern: GroovePattern | null
): number {
  if (!loadedPattern?.voices) return 50; // No pattern, can't verify

  const voicePattern = loadedPattern.voices[grooveVoice];
  if (!voicePattern || voicePattern.length === 0) return 30; // Voice not in pattern

  const stepInMeasure = currentStep % voicePattern.length;
  return voicePattern[stepInMeasure] ? 80 : 30; // On-step vs wrong position
}

/**
 * Get performance feedback message for an overall accuracy score.
 */
export function getFeedback(accuracy: number): string {
  if (accuracy >= 90) return 'Perfect!';
  if (accuracy >= 75) return 'Great!';
  if (accuracy >= 60) return 'Good';
  if (accuracy >= 40) return 'Keep trying';
  return 'Miss';
}
