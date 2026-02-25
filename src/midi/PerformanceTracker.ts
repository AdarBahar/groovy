/**
 * PerformanceTracker - Real-time Performance Analysis with Swing-Aware Quantization
 *
 * Tracks performance metrics when playing along with loaded groove patterns.
 * - Step-level quantization with swing-aware offset grids (Spec Section 4-5)
 * - Tempo-aware grading bands that scale with BPM (Spec Section 6)
 * - EWMA-smoothed performed BPM estimation (Spec Section 7)
 * - Signed timing errors (negative=slow, positive=fast)
 *
 * Spec: https://github.com/AdarBahar/portfolio-tracker/issues/264
 */

import { DrumVoice, GrooveData } from '../types';

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
  timingErrorMs: number; // signed: negative=slow, positive=fast
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
  private division: number = 8;
  private timeSignature: TimeSignature = { beats: 4, noteValue: 4 };
  private swing: number = 0; // 0-100 internal storage, maps to 0-0.33 ratio
  private beatOffsets: number[] = []; // ms offsets within one beat (accounts for swing)

  // Performed BPM estimation (EWMA smoothing)
  private globalStepIndex: number = 0;
  private bpmEstimate: number | null = null;
  private readonly EWMA_ALPHA = 0.05; // smoothing factor

  private stats: PerformanceStats = {
    totalHits: 0,
    accurateHits: 0,
    timingErrors: [],
    averageAccuracy: 0,
  };

  /**
   * Enable performance tracking with a loaded groove
   * @param groove - Full GrooveData with division, swing, timeSignature
   * @param startTime - Performance start timestamp from performance.now()
   *                    Must match clock source for hit timestamps (event.timeStamp from MIDI)
   */
  enable(groove: GrooveData, startTime: number): void {
    // Validate tempo (Issue #94)
    if (!groove.tempo || groove.tempo <= 0) {
      console.warn('PerformanceTracker: Invalid tempo. Must be positive number.');
      return;
    }

    // Validate groove has required timing metadata
    if (!groove.division || !groove.timeSignature?.beats || !groove.timeSignature?.noteValue) {
      console.warn('PerformanceTracker: Groove missing required timing metadata.');
      return;
    }

    // Store all timing parameters
    this.tempo = groove.tempo;
    this.division = groove.division;
    this.swing = groove.swing;
    this.timeSignature = groove.timeSignature;
    this.startTime = startTime;

    // Create pattern object from groove (needed for checkNoteAccuracy)
    // Uses first measure's notes as the pattern
    this.loadedPattern = {
      division: groove.division,
      timeSignature: groove.timeSignature,
      voices: groove.measures[0]?.notes,
    };

    // Build swing-aware quantization grid
    this.buildOffsetGrid();

    // Reset performance state
    this.globalStepIndex = 0;
    this.bpmEstimate = null;
    this.resetStats();

    this.enabled = true;
    console.log(`Performance tracking enabled: ${groove.tempo}BPM, division=${groove.division}, swing=${groove.swing}%`);
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
   * Update tempo during active tracking (for auto speed-up support)
   * Rebuilds the offset grid with new beat duration
   */
  setTempo(tempo: number): void {
    if (!this.enabled) return;
    if (!tempo || tempo <= 0) return;

    this.tempo = tempo;
    this.buildOffsetGrid();
  }

  /**
   * Build swing-aware beat offset grid for quantization
   * Spec Section 3-4: Swing affects offbeat positions in even-step divisions
   * @private
   */
  private buildOffsetGrid(): void {
    const beatDurMs = (60 / this.tempo) * 1000;
    const stepsPerBeat = this.division / this.timeSignature.noteValue;

    // Triplet divisions: 12, 24, 48 (don't support swing)
    const isTriplet = [12, 24, 48].includes(this.division);
    // Only 8, 16, 32 support swing
    const supportsSwing = [8, 16, 32].includes(this.division);

    const offsets: number[] = [];

    for (let i = 0; i < stepsPerBeat; i++) {
      if (isTriplet || !supportsSwing || this.swing === 0) {
        // Straight or triplet: linear grid
        offsets.push((i * beatDurMs) / stepsPerBeat);
      } else {
        // Even steps stay on grid
        if (i % 2 === 0) {
          offsets.push((i * beatDurMs) / stepsPerBeat);
        } else {
          // Odd steps (offbeats) are swung
          // Spec: swingRatio = (swing / 100) * 0.33; s = swing / 100
          // offbeatFraction = 0.5 + s * (1/6)  → ranges 0.5 (straight) to 0.667 (full triplet)
          const s = this.swing / 100; // 0-1
          const offbeatFraction = 0.5 + s * (1 / 6);
          const pairStart = Math.floor(i / 2) * (beatDurMs / (stepsPerBeat / 2));
          const pairLen = beatDurMs / (stepsPerBeat / 2);
          offsets.push(pairStart + offbeatFraction * pairLen);
        }
      }
    }

    this.beatOffsets = offsets;
  }

  /**
   * Calculate signed timing error and absolute error
   * Spec Section 5: Quantize to nearest offset in beat grid
   * @private
   * @param timestamp - Hit timestamp
   * @returns { errorMs: signed error (negative=slow, positive=fast), absError: absolute }
   */
  private calculateTimingError(timestamp: number): { errorMs: number; absError: number } {
    if (this.startTime == null) return { errorMs: 0, absError: 0 };

    const elapsedMs = timestamp - this.startTime;
    const beatDurMs = (60 / this.tempo) * 1000;

    // Find which beat we're in
    const beatIndex = Math.floor(elapsedMs / beatDurMs);
    const beatStart = beatIndex * beatDurMs;
    const posInBeat = elapsedMs - beatStart;

    // Find nearest offset in the grid
    let minDist = Infinity;
    let nearestOffset = 0;
    for (const offset of this.beatOffsets) {
      const dist = Math.abs(posInBeat - offset);
      if (dist < minDist) {
        minDist = dist;
        nearestOffset = offset;
      }
    }

    const errorMs = posInBeat - nearestOffset; // signed: negative=slow, positive=fast
    return { errorMs, absError: Math.abs(errorMs) };
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
   * @param timestamp - When the hit occurred from event.timeStamp
   * @returns Analysis result or null if tracking disabled
   */
  analyzeHit(grooveVoice: DrumVoice | null, timestamp: number): HitAnalysis | null {
    if (!this.enabled || !this.loadedPattern || !grooveVoice) {
      return null;
    }

    const { errorMs: timingErrorMs, absError } = this.calculateTimingError(timestamp);
    const timingAccuracy = this.calculateTimingAccuracy(timestamp);
    const currentStep = this.getCurrentStep(timestamp);
    const noteAccuracy = this.checkNoteAccuracy(grooveVoice, currentStep);
    const overall = (timingAccuracy + noteAccuracy) / 2;

    // Update global step counter for BPM estimation
    if (absError < 100) { // Only count "accepted" hits
      this.globalStepIndex++;
      this.updatePerformedBpmEstimate(timestamp);
    }

    // Update stats
    this.stats.totalHits++;
    if (overall > 70) {
      this.stats.accurateHits++;
    }
    // Keep rolling window of timing errors
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
      timingErrorMs, // signed error in ms
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
   * Calculate timing accuracy with tempo-aware thresholds
   * Spec Section 6: Use tempo-aware grading bands
   * @private
   * @param timestamp - Hit timestamp
   * @returns Accuracy percentage (0-100)
   */
  private calculateTimingAccuracy(timestamp: number): number {
    if (this.startTime == null) return 50;

    const { absError } = this.calculateTimingError(timestamp);
    const beatDurMs = (60 / this.tempo) * 1000;

    // Tempo-aware thresholds (Spec Section 6)
    const acceptWindow = Math.min(90, beatDurMs * 0.18);
    const onTimeMs = Math.min(25, beatDurMs * 0.05);

    // Grading bands based on distance from target
    if (absError > acceptWindow) {
      // Miss: too far away
      return 0;
    } else if (absError <= onTimeMs) {
      // Perfect: on time
      return 100;
    } else if (absError <= onTimeMs * 2) {
      // Good: close
      return 75;
    } else if (absError <= acceptWindow * 0.55) {
      // Fair: reasonable
      return 50;
    } else {
      // Poor: getting off
      return 25;
    }
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
   * Update EWMA-smoothed performed BPM estimate
   * Spec Section 7: Track tempo drift relative to grid
   * @private
   */
  private updatePerformedBpmEstimate(timestamp: number): void {
    if (this.startTime == null || this.globalStepIndex === 0) return;

    const stepsPerBeat = this.division / this.timeSignature.noteValue;
    const elapsedSecs = (timestamp - this.startTime) / 1000;
    const secondsPerStep = elapsedSecs / this.globalStepIndex;
    const stepsPerMinute = 60 / secondsPerStep;
    const targetBpm = stepsPerMinute / stepsPerBeat;

    if (this.bpmEstimate === null) {
      this.bpmEstimate = targetBpm;
    } else {
      // EWMA smoothing: newEst = oldEst + alpha * (target - oldEst)
      this.bpmEstimate += this.EWMA_ALPHA * (targetBpm - this.bpmEstimate);
    }

    // Freeze estimate if large deviation (>20% from set tempo)
    const deviation = Math.abs(this.bpmEstimate - this.tempo) / this.tempo;
    if (deviation > 0.2) {
      this.bpmEstimate = null;
    }
  }

  /**
   * Get EWMA-smoothed performed BPM (actual tempo from hits)
   * Returns null if drift is too large or insufficient data
   */
  getPerformedBpm(): number | null {
    return this.bpmEstimate !== null ? Math.round(this.bpmEstimate * 10) / 10 : null;
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
