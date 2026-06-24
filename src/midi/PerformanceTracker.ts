/**
 * PerformanceTracker - Real-time Performance Analysis with Swing-Aware Quantization
 *
 * Tracks performance metrics when playing along with loaded groove patterns.
 * - Step-level quantization with swing-aware offset grids (Spec Section 4-5)
 * - Tempo-aware grading bands that scale with BPM (Spec Section 6)
 * - EWMA-smoothed performed BPM estimation delegated to BPMEstimator (Spec Section 7)
 * - Signed timing errors (negative=slow, positive=fast)
 *
 * Spec: https://github.com/AdarBahar/portfolio-tracker/issues/264
 */

import { DrumVoice, GrooveData, getFlattenedNotes } from '../types';
import { GrooveUtils } from '../core/GrooveUtils';
import { logger } from '../utils/logger';
import { BPMEstimator } from './BPMEstimator';
import {
  calculateTimingError,
  calculateTimingAccuracy,
  checkNoteAccuracy,
  getFeedback,
} from './performanceGrader';

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
  private swing: number = 0;
  private beatOffsets: number[] = [];

  private totalSteps: number = 0;
  private globalStepIndex: number = 0;

  private readonly bpmEstimator = new BPMEstimator();

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
    if (!groove.tempo || groove.tempo <= 0) {
      logger.warn('PerformanceTracker: Invalid tempo. Must be positive number.');
      return;
    }

    if (!groove.division || !groove.timeSignature?.beats || !groove.timeSignature?.noteValue) {
      logger.warn('PerformanceTracker: Groove missing required timing metadata.');
      return;
    }

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

    this.totalSteps = this.computeTotalSteps(groove);
    this.buildOffsetGrid();

    this.globalStepIndex = 0;
    this.bpmEstimator.reset();
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
   */
  updateGroove(groove: GrooveData): void {
    if (!this.enabled) return;

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

    this.loadedPattern = {
      division: groove.division,
      timeSignature: groove.timeSignature,
      voices: getFlattenedNotes(groove),
    };
    this.totalSteps = this.computeTotalSteps(groove);
    this.buildOffsetGrid();
  }

  /**
   * Build swing-aware beat offset grid for quantization.
   * Spec Section 3-4: Swing affects offbeat positions in even-step divisions.
   * @private
   */
  private buildOffsetGrid(): void {
    const beatDurMs = (60 / this.tempo) * 1000;
    // Beat = quarter note (engine source of truth: note duration = (60/tempo)/(division/4))
    // Do NOT use division/noteValue here — that would disagree with the engine in non-4/4 (#123).
    const stepsPerBeat = this.division / 4;

    const isTriplet = [12, 24, 48].includes(this.division);
    const supportsSwing = [8, 16, 32].includes(this.division);

    const offsets: number[] = [];

    for (let i = 0; i < stepsPerBeat; i++) {
      if (isTriplet || !supportsSwing || this.swing === 0) {
        offsets.push((i * beatDurMs) / stepsPerBeat);
      } else {
        if (i % 2 === 0) {
          offsets.push((i * beatDurMs) / stepsPerBeat);
        } else {
          // Odd steps (offbeats) are swung
          // Spec: offbeatFraction = 0.5 + s * (1/6) → ranges 0.5 (straight) to 0.667 (full triplet)
          const s = this.swing / 100;
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

    const beatDurMs = (60 / this.tempo) * 1000;
    const elapsedMs = timestamp - this.startTime!;
    const beatIndex = Math.floor(elapsedMs / beatDurMs);
    const posInBeat = elapsedMs - beatIndex * beatDurMs;

    const { errorMs: timingErrorMs, absError } = calculateTimingError(posInBeat, beatDurMs, this.beatOffsets);
    const timingAccuracy = calculateTimingAccuracy(absError, beatDurMs);
    const currentStep = this.getCurrentStep(timestamp);
    const noteAccuracy = checkNoteAccuracy(grooveVoice, currentStep, this.loadedPattern);
    const overall = (timingAccuracy + noteAccuracy) / 2;

    if (absError < 100) {
      this.globalStepIndex++;
      this.bpmEstimator.update(timestamp, this.startTime!, this.tempo, this.division);
    }

    this.stats.totalHits++;
    if (overall > 70) {
      this.stats.accurateHits++;
    }
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
      feedback: getFeedback(overall),
      timingErrorMs,
    };
  }

  /**
   * Get current step position based on elapsed time
   * @private
   */
  private getCurrentStep(timestamp: number): number {
    if (this.startTime == null) return 0;

    const elapsedMs = timestamp - this.startTime;
    const beatDurationMs = (60 / this.tempo) * 1000;
    // Beat = quarter note (engine source of truth: note duration = (60/tempo)/(division/4))
    const stepsPerBeat = this.division / 4;
    const stepDurationMs = beatDurationMs / stepsPerBeat;

    const stepNumber = Math.round(elapsedMs / stepDurationMs);
    const wrapLength = this.totalSteps > 0 ? this.totalSteps : stepsPerBeat * this.timeSignature.beats;
    return stepNumber % wrapLength;
  }

  /**
   * Get EWMA-smoothed performed BPM (actual tempo from drummer's hits).
   * Returns null if deviation from set tempo exceeds 20% or insufficient data.
   */
  getPerformedBpm(): number | null {
    return this.bpmEstimator.getPerformedBpm(this.tempo);
  }

  /**
   * Get current performance statistics
   */
  getStats(): PerformanceStats {
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
