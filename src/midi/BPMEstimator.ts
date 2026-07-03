import { logger } from '../utils/logger';

/**
 * BPMEstimator - EWMA-smoothed performed BPM estimation using inter-onset intervals.
 * Spec Section 7: Track tempo drift relative to grid.
 *
 * Method: for each accepted hit, round the INTERVAL since the previous hit to the
 * nearest number of grid steps:
 *   stepDelta = round((timestamp - lastTimestamp) / stepDurMs)
 * Numerator and denominator are both interval-based (not absolute-position-based),
 * so a constant grid offset (e.g. uncalibrated audio/MIDI latency) cancels exactly —
 * it shifts every timestamp by the same amount, which does not change any interval.
 *
 * Previous versions computed stepDelta by differencing separately-rounded ABSOLUTE
 * step indices (`round((timestamp - startTime) / stepDurMs)`), then discarded any
 * stepDelta below one beat as "too short to measure". Near a rounding boundary, a
 * constant offset flips one hit's absolute step +1 (an over-tempo sample, KEPT) while
 * the compensating hit flips -1 (an under-tempo sample, DISCARDED by the sub-beat
 * filter). Fast-looking samples were kept and slow-looking ones were censored, which
 * produced a persistent UPWARD bias (e.g. a steady 120 BPM performance read
 * 123-126 BPM). That censoring branch has been removed: any stepDelta >= 1 is now
 * accepted as a valid sample, including sub-beat (e.g. 8th-note) spacing, which also
 * fixes dense playing never producing an estimate.
 *
 * Minimum-interval floor: intervals under 100ms produce no sample. This covers both
 * flams/simultaneous hits (interval rounds to 0 steps) and noisy micro-intervals
 * below a 16th note at typical tempos. The floor trades off rejecting genuinely fast
 * sub-16th playing in favor of rejecting bounce/noise; skipped hits do NOT advance
 * the reference timestamp, so the next genuine onset is still measured from the true
 * previous hit.
 *
 * getPerformedBpm() returns null when |estimate - tempo|/tempo > 0.2,
 * but the internal estimate is NOT zeroed — preventing oscillation.
 */
export class BPMEstimator {
  private readonly EWMA_ALPHA = 0.05;
  private readonly MIN_INTERVAL_MS = 100;
  private bpmEstimate: number | null = null;
  private lastTimestamp: number | null = null;

  reset(): void {
    this.bpmEstimate = null;
    this.lastTimestamp = null;
  }

  /**
   * Update estimate from a new accepted hit.
   * @param timestamp - Hit timestamp (ms)
   * @param tempo - Current grid tempo (BPM)
   * @param division - Groove division (e.g. 16 for 16th notes)
   */
  update(timestamp: number, tempo: number, division: number): void {
    // Beat = quarter note (engine source of truth: note duration = (60/tempo)/(division/4))
    const stepsPerBeat = division / 4;
    const beatDurMs = (60 / tempo) * 1000;
    const stepDurMs = beatDurMs / stepsPerBeat;

    if (this.lastTimestamp === null) {
      this.lastTimestamp = timestamp;
      return;
    }

    const timeDelta = timestamp - this.lastTimestamp;

    // Flam / minimum-interval floor: skip WITHOUT advancing lastTimestamp so the
    // next genuine onset is measured from the real previous hit, not this noise.
    if (timeDelta < this.MIN_INTERVAL_MS) {
      return;
    }

    // Interval-rounded stepDelta: numerator and denominator are both interval-based,
    // so a constant grid offset applied to both timestamps cancels exactly.
    const stepDelta = Math.round((timestamp - this.lastTimestamp) / stepDurMs);

    // Defensive: an interval that still rounds to 0 steps is not a usable sample.
    if (stepDelta < 1) {
      return;
    }

    const timeDeltaSecs = timeDelta / 1000;
    const bpmSample = (stepDelta * 60) / (stepsPerBeat * timeDeltaSecs);

    if (this.bpmEstimate === null) {
      this.bpmEstimate = bpmSample;
    } else {
      this.bpmEstimate += this.EWMA_ALPHA * (bpmSample - this.bpmEstimate);
    }

    logger.log('[BPMEstimator]', { bpmSample, stepDelta, timeDeltaMs: timeDelta });

    this.lastTimestamp = timestamp;
  }

  /**
   * Get smoothed BPM estimate. Returns null if deviation from set tempo
   * exceeds 20% or insufficient data collected yet.
   * The internal estimate is NOT nulled on deviation — prevents oscillation (#122).
   */
  getPerformedBpm(tempo: number): number | null {
    if (this.bpmEstimate === null) return null;
    const deviation = Math.abs(this.bpmEstimate - tempo) / tempo;
    if (deviation > 0.2) return null;
    return Math.round(this.bpmEstimate * 10) / 10;
  }
}
