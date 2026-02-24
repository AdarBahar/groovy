/**
 * PerformanceTracker - Real-time Performance Analysis
 *
 * Tracks performance metrics when playing along with loaded groove patterns.
 * Analyzes timing accuracy (proximity to beat) and note accuracy (correct voice hit).
 *
 * Converted from /docs/groovy-midi-transfer/midi/performance-tracker.js
 */

import { DrumVoice } from '../types';

export interface PerformanceStats {
  totalHits: number;
  accurateHits: number;
  timingErrors: number[];
  averageAccuracy: number;
}

export interface HitAnalysis {
  timingAccuracy: number; // 0-100
  noteAccuracy: number; // 0-100
  overall: number; // 0-100
  feedback: string;
}

export interface TimeSignature {
  beats: number;
  noteValue: 4 | 8 | 16;
}

export interface GroovePattern {
  voices?: Record<DrumVoice, boolean[]>;
  division?: number; // 4, 8, 12, 16, 24, 32, 48
  timeSignature?: TimeSignature;
  [key: string]: any;
}

const MAX_TIMING_ERRORS = 500;

class PerformanceTracker {
  private enabled: boolean = false;
  private loadedPattern: GroovePattern | null = null;
  private startTime: number | null = null;
  private tempo: number = 120;
  private division: number = 8; // Steps per measure
  private timeSignature: TimeSignature = { beats: 4, noteValue: 4 };
  private stats: PerformanceStats = {
    totalHits: 0,
    accurateHits: 0,
    timingErrors: [],
    averageAccuracy: 0,
  };

  /**
   * Enable performance tracking with a loaded groove pattern
   * @param pattern - Parsed groove pattern with voices
   * @param tempo - BPM (beats per minute)
   * @param startTime - Performance start timestamp from performance.now() (ms relative to performance.timeOrigin)
   *                    Must match the clock source used for hit timestamps (typically event.timeStamp from MIDI events)
   *                    Issue #90: Standardized on performance.now() instead of Date.now()
   */
  enable(pattern: GroovePattern, tempo: number, startTime: number): void {
    // Validate tempo (Issue #94)
    if (!tempo || tempo <= 0) {
      console.warn('PerformanceTracker: Invalid tempo. Must be positive number.');
      return;
    }

    // Validate pattern has required timing metadata (Issue #97)
    if (!pattern.division || !pattern.timeSignature?.beats || !pattern.timeSignature?.noteValue) {
      console.warn('PerformanceTracker: Pattern missing required timing metadata (division, timeSignature.beats, timeSignature.noteValue). Step-accurate timing unavailable.');
      return;
    }

    this.loadedPattern = pattern;
    this.tempo = tempo;
    this.division = pattern.division!;
    this.timeSignature = pattern.timeSignature!;
    this.startTime = startTime;
    this.enabled = true;
    this.resetStats();
    console.log('Performance tracking enabled');
  }

  /**
   * Disable performance tracking
   */
  disable(): void {
    this.enabled = false;
    console.log('Performance tracking disabled');
  }

  /**
   * Check if performance tracking is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Reset performance statistics
   */
  resetStats(): void {
    this.stats = {
      totalHits: 0,
      accurateHits: 0,
      timingErrors: [],
      averageAccuracy: 0,
    };
  }

  /**
   * Analyze a MIDI hit against the loaded pattern
   * @param grooveVoice - The drum voice that was hit
   * @param timestamp - When the hit occurred from event.timeStamp (ms relative to performance.timeOrigin)
   *                    Must use same clock source as startTime passed to enable()
   *                    Issue #90: Standardized on performance.now() / event.timeStamp
   * @returns Analysis result or null if tracking disabled
   */
  analyzeHit(grooveVoice: DrumVoice | null, timestamp: number): HitAnalysis | null {
    if (!this.enabled || !this.loadedPattern || !grooveVoice) {
      return null;
    }

    const timingAccuracy = this.calculateTimingAccuracy(timestamp);
    const currentStep = this.getCurrentStep(timestamp);
    const noteAccuracy = this.checkNoteAccuracy(grooveVoice, currentStep);
    const overall = (timingAccuracy + noteAccuracy) / 2;

    // Update stats
    this.stats.totalHits++;
    if (overall > 70) {
      this.stats.accurateHits++;
    }
    // Keep rolling window of timing errors (Issue #98)
    this.stats.timingErrors.push(timingAccuracy);
    if (this.stats.timingErrors.length > MAX_TIMING_ERRORS) {
      this.stats.timingErrors.shift();
    }
    this.stats.averageAccuracy =
      (this.stats.averageAccuracy * (this.stats.totalHits - 1) + overall) / this.stats.totalHits;

    return {
      timingAccuracy: Math.round(timingAccuracy),
      noteAccuracy: Math.round(noteAccuracy),
      overall: Math.round(overall),
      feedback: this.getFeedback(overall),
    };
  }

  /**
   * Get current step position based on elapsed time
   * @private
   * @param timestamp - Hit timestamp (ms since epoch)
   * @returns Step index (0-based within measure)
   */
  private getCurrentStep(timestamp: number): number {
    if (this.startTime == null) return 0;

    const elapsedMs = timestamp - this.startTime;
    const beatDurationMs = (60 / this.tempo) * 1000;
    const stepsPerBeat = this.division / this.timeSignature.noteValue;
    const stepDurationMs = beatDurationMs / stepsPerBeat;

    const stepNumber = Math.round(elapsedMs / stepDurationMs);
    const measureLength = (this.division / this.timeSignature.noteValue) * this.timeSignature.beats;
    return stepNumber % measureLength;
  }

  /**
   * Calculate timing accuracy (how close to the step grid)
   *
   * Uses practical grading bands based on human perception:
   * - On time: |Δ| <= 20 ms (perfect)
   * - Slightly early/late: 20–40 ms (good)
   * - Early/late: 40–80 ms (fair)
   * - Very off: 80–150 ms (poor)
   * - Miss: > 150 ms (complete miss)
   *
   * Issue #91: Now uses step-based quantization instead of beat-based
   *
   * @private
   * @param timestamp - Hit timestamp (ms since epoch)
   * @returns Accuracy percentage (0-100)
   */
  private calculateTimingAccuracy(timestamp: number): number {
    // Use null check instead of falsy check to allow startTime=0 (Issue #93)
    if (this.startTime == null) return 50;

    const elapsedMs = timestamp - this.startTime;
    const beatDurationMs = (60 / this.tempo) * 1000;
    const stepsPerBeat = this.division / this.timeSignature.noteValue;
    const stepDurationMs = beatDurationMs / stepsPerBeat;

    // Find nearest step (Issue #91: step-based, not beat-based)
    const stepNumber = Math.round(elapsedMs / stepDurationMs);
    const expectedTime = stepNumber * stepDurationMs;
    const timingError = Math.abs(elapsedMs - expectedTime);

    // Practical grading bands (milliseconds from step)
    let accuracy: number;

    if (timingError <= 20) {
      // On time: perfect
      accuracy = 100;
    } else if (timingError <= 40) {
      // Slightly early/late: good
      accuracy = 75;
    } else if (timingError <= 80) {
      // Early/late: fair
      accuracy = 50;
    } else if (timingError <= 150) {
      // Very off: poor
      accuracy = 25;
    } else {
      // Complete miss
      accuracy = 0;
    }

    return accuracy;
  }

  /**
   * Check if the hit note matches the loaded pattern at the current step
   * @private
   * @param grooveVoice - Voice that was hit
   * @param currentStep - Current step in the measure (0-based)
   * @returns Accuracy percentage (0-100)
   */
  private checkNoteAccuracy(grooveVoice: DrumVoice, currentStep: number): number {
    // Issue #89: Now position-aware (checks specific step, not just voice existence)
    if (!this.loadedPattern || !this.loadedPattern.voices) {
      return 50; // No pattern loaded, can't verify
    }

    const voicePattern = this.loadedPattern.voices[grooveVoice];

    if (!voicePattern || voicePattern.length === 0) {
      // Voice not in pattern at all
      return 30;
    }

    // Check if this voice plays at the current step (position-aware)
    const stepInMeasure = currentStep % voicePattern.length;
    if (voicePattern[stepInMeasure]) {
      // Voice plays at this step
      return 80;
    } else {
      // Voice exists in pattern but not at this step (wrong position)
      return 30;
    }
  }

  /**
   * Get performance feedback message
   * @private
   * @param accuracy - Overall accuracy (0-100)
   * @returns Feedback message
   */
  private getFeedback(accuracy: number): string {
    if (accuracy >= 90) return 'Perfect!';
    if (accuracy >= 75) return 'Great!';
    if (accuracy >= 60) return 'Good';
    if (accuracy >= 40) return 'Keep trying';
    return 'Miss';
  }

  /**
   * Get current performance statistics
   */
  getStats(): PerformanceStats {
    // Return deep copy to prevent external mutation of internal state (Issue #95)
    return { ...this.stats, timingErrors: [...this.stats.timingErrors] };
  }

  /**
   * Get formatted performance report
   */
  getReport(): string {
    const { totalHits, accurateHits, averageAccuracy } = this.stats;
    const accuracy = totalHits > 0 ? ((accurateHits / totalHits) * 100).toFixed(1) : '0.0';

    return `
Performance Report:
- Total Hits: ${totalHits}
- Accurate Hits: ${accurateHits}
- Accuracy: ${accuracy}%
- Average Score: ${averageAccuracy.toFixed(1)}/100
    `.trim();
  }
}

// Export singleton instance
export const performanceTracker = new PerformanceTracker();
