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

import { DrumVoice, GrooveData, getFlattenedNotes } from '../types';
import { GrooveUtils } from '../core/GrooveUtils';
import { logger } from '../utils/logger';

export interface PerformanceStats {
  totalHits: number;
  accurateHits: number;
  timingScores: number[];
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

  // Total steps across all measures (for wrapping getCurrentStep)
  private totalSteps: number = 0;

  // Performed BPM estimation (EWMA inter-onset method — #122)
  // globalStepIndex is retained for legacy use; BPM estimation now uses inter-onset step intervals.
  private globalStepIndex: number = 0;
  private bpmEstimate: number | null = null;
  private lastAbsStep: number | null = null;   // absolute quantized step of last accepted hit
  private lastTimestamp: number | null = null; // timestamp of last accepted hit
  private readonly EWMA_ALPHA = 0.05; // smoothing factor

  private stats: PerformanceStats = {
    totalHits: 0,
    accurateHits: 0,
    timingScores: [],
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
      logger.warn('PerformanceTracker: Invalid tempo. Must be positive number.');
      return;
    }

    // Validate groove has required timing metadata
    if (!groove.division || !groove.timeSignature?.beats || !groove.timeSignature?.noteValue) {
      logger.warn('PerformanceTracker: Groove missing required timing metadata.');
      return;
    }

    // Store all timing parameters
    this.tempo = groove.tempo;
    this.division = groove.division;
    this.swing = groove.swing;
    this.timeSignature = groove.timeSignature;
    this.startTime = startTime;

    // Build flattened pattern across ALL measures (fixes single-measure grading bug #121)
    this.loadedPattern = {
      division: groove.division,
      timeSignature: groove.timeSignature,
      voices: getFlattenedNotes(groove),
    };

    // Compute total steps: sum of each measure's step count (respects per-measure time sig overrides)
    this.totalSteps = this.computeTotalSteps(groove);

    // Build swing-aware quantization grid
    this.buildOffsetGrid();

    // Reset performance state
    this.globalStepIndex = 0;
    this.bpmEstimate = null;
    this.lastAbsStep = null;
    this.lastTimestamp = null;
    this.resetStats();

    this.enabled = true;
    logger.log(`Performance tracking enabled: ${groove.tempo}BPM, division=${groove.division}, swing=${groove.swing}%`);
  }

  /**
   * Disable performance tracking
   */
  disable(): void {
    this.enabled = false;
    logger.log('Performance tracking disabled');
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
   * Compute total step count across all measures, respecting per-measure time signature overrides.
   * Each measure contributes GrooveUtils.calcNotesPerMeasure(division, beats, noteValue) steps.
   * @private
   */
  private computeTotalSteps(groove: GrooveData): number {
    const div = groove.division as import('../types').Division;
    let total = 0;
    for (const measure of groove.measures) {
      const ts = measure.timeSignature ?? groove.timeSignature;
      total += GrooveUtils.calcNotesPerMeasure(div, ts.beats, ts.noteValue);
    }
    return total;
  }

  /**
   * Update groove pattern mid-session (for live editing during playback).
   * Rebuilds the flattened pattern, total step count, and offset grid.
   * Does NOT reset startTime or stats — preserves accumulated performance data.
   * @param groove - Updated GrooveData
   */
  updateGroove(groove: GrooveData): void {
    if (!this.enabled) return;

    // Validate like enable()
    if (!groove.tempo || groove.tempo <= 0) {
      logger.warn('PerformanceTracker.updateGroove: Invalid tempo.');
      return;
    }
    if (!groove.division || !groove.timeSignature?.beats || !groove.timeSignature?.noteValue) {
      logger.warn('PerformanceTracker.updateGroove: Groove missing required timing metadata.');
      return;
    }

    this.tempo = groove.tempo;
    this.division = groove.division;
    this.swing = groove.swing;
    this.timeSignature = groove.timeSignature;

    // Rebuild flattened pattern and total step count
    this.loadedPattern = {
      division: groove.division,
      timeSignature: groove.timeSignature,
      voices: getFlattenedNotes(groove),
    };
    this.totalSteps = this.computeTotalSteps(groove);

    // Rebuild offset grid with possibly new tempo/swing/division
    this.buildOffsetGrid();
    // startTime, globalStepIndex, bpmEstimate, and stats are intentionally preserved
  }

  /**
   * Build swing-aware beat offset grid for quantization
   * Spec Section 3-4: Swing affects offbeat positions in even-step divisions
   * @private
   */
  private buildOffsetGrid(): void {
    const beatDurMs = (60 / this.tempo) * 1000;
    // Beat = quarter note (engine source of truth: note duration = (60/tempo)/(division/4))
    // Do NOT use division/noteValue here — that would disagree with the engine in non-4/4 (#123).
    const stepsPerBeat = this.division / 4;

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

    // Find nearest offset in the grid.
    // Also consider beatDurMs as the next beat's downbeat (offset === beatDurMs),
    // so a hit just before the downbeat (e.g. posInBeat=490, beatDurMs=500)
    // reports a small negative error (-10ms) instead of a large late error.
    let minDist = Infinity;
    let nearestOffset = 0;
    for (const offset of this.beatOffsets) {
      const dist = Math.abs(posInBeat - offset);
      if (dist < minDist) {
        minDist = dist;
        nearestOffset = offset;
      }
    }
    // Check next-beat downbeat candidate
    const nextDownbeatDist = Math.abs(posInBeat - beatDurMs);
    if (nextDownbeatDist < minDist) {
      nearestOffset = beatDurMs;
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
      timingScores: [],
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
    this.stats.timingScores.push(timingAccuracy);
    if (this.stats.timingScores.length > MAX_TIMING_ERRORS) {
      this.stats.timingScores.shift();
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
    // Beat = quarter note (engine source of truth: note duration = (60/tempo)/(division/4))
    const stepsPerBeat = this.division / 4;
    const stepDurationMs = beatDurationMs / stepsPerBeat;

    const stepNumber = Math.round(elapsedMs / stepDurationMs);
    // Wrap by total steps across ALL measures (not just one measure's length)
    const wrapLength = this.totalSteps > 0 ? this.totalSteps : stepsPerBeat * this.timeSignature.beats;
    return stepNumber % wrapLength;
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
   * Update EWMA-smoothed performed BPM estimate using inter-onset step intervals.
   * Spec Section 7: Track tempo drift relative to grid.
   *
   * Method: for each accepted hit compute its absolute quantized step index
   *   absStep = round((timestamp - startTime) / stepDurMs)
   * then use the step delta between consecutive accepted hits to estimate BPM:
   *   bpmSample = (stepDelta * 60) / ((division/4) * timeDeltaSecs)
   * This is correct even when the drummer plays quarters in a 16ths groove (#122)
   * because stepDelta reflects the actual steps skipped, not a raw hit count.
   *
   * Flam/simultaneous hits (stepDelta=0): skip EWMA update entirely,
   * keeping last* unchanged so the next genuine onset measures from the real previous hit.
   *
   * Deviation check: getPerformedBpm() returns null when |estimate - tempo|/tempo > 0.2,
   * but the internal estimate is NOT zeroed — preventing oscillation between null and a value.
   * @private
   */
  private updatePerformedBpmEstimate(timestamp: number): void {
    if (this.startTime == null) return;

    // Beat = quarter note (engine source of truth) — consistent with buildOffsetGrid (#123)
    const stepsPerBeat = this.division / 4;
    const beatDurMs = (60 / this.tempo) * 1000;
    const stepDurMs = beatDurMs / stepsPerBeat;

    // Absolute quantized step index for this hit
    const absStep = Math.round((timestamp - this.startTime) / stepDurMs);

    if (this.lastAbsStep === null || this.lastTimestamp === null) {
      // Seed: record position but no BPM sample yet
      this.lastAbsStep = absStep;
      this.lastTimestamp = timestamp;
      return;
    }

    const stepDelta = absStep - this.lastAbsStep;

    if (stepDelta < 1) {
      // Simultaneous / flam hit: ignore this onset for BPM estimation.
      // Keep last* unchanged so the next genuine onset measures from the real previous hit.
      return;
    }

    if (stepDelta < stepsPerBeat) {
      // Sub-beat interval: too short to measure BPM accurately.
      // A 15ms timing error on a 125ms window (16th at 120 BPM) inflates the sample by ~13%.
      // The same error on a 500ms beat window is only ~3%. Advance the pointer and wait.
      this.lastAbsStep = absStep;
      this.lastTimestamp = timestamp;
      return;
    }

    const timeDeltaSecs = (timestamp - this.lastTimestamp) / 1000;
    if (timeDeltaSecs <= 0) {
      // Guard against zero/negative time delta
      this.lastAbsStep = absStep;
      this.lastTimestamp = timestamp;
      return;
    }

    // bpmSample = (stepDelta / stepsPerBeat) beats / timeDeltaSecs seconds * 60
    const bpmSample = (stepDelta * 60) / (stepsPerBeat * timeDeltaSecs);

    if (this.bpmEstimate === null) {
      this.bpmEstimate = bpmSample;
    } else {
      // EWMA smoothing: newEst = oldEst + alpha * (sample - oldEst)
      this.bpmEstimate += this.EWMA_ALPHA * (bpmSample - this.bpmEstimate);
    }

    // Advance last hit pointers
    this.lastAbsStep = absStep;
    this.lastTimestamp = timestamp;
  }

  /**
   * Get EWMA-smoothed performed BPM (actual tempo from drummer's hits).
   * Returns null if deviation from set tempo exceeds 20% or insufficient data.
   * The internal estimate is NOT nulled on deviation — only the return value is null.
   * This prevents oscillation between valid and null readings (#122).
   */
  getPerformedBpm(): number | null {
    if (this.bpmEstimate === null) return null;
    const deviation = Math.abs(this.bpmEstimate - this.tempo) / this.tempo;
    if (deviation > 0.2) return null;
    return Math.round(this.bpmEstimate * 10) / 10;
  }

  /**
   * Get current performance statistics
   */
  getStats(): PerformanceStats {
    // Return deep copy to prevent external mutation of internal state (Issue #95)
    return { ...this.stats, timingScores: [...this.stats.timingScores] };
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
