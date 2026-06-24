/**
 * BPMEstimator - EWMA-smoothed performed BPM estimation using inter-onset intervals.
 * Spec Section 7: Track tempo drift relative to grid.
 *
 * Method: for each accepted hit compute its absolute quantized step index
 *   absStep = round((timestamp - startTime) / stepDurMs)
 * then use the step delta between consecutive accepted hits to estimate BPM.
 * Correct even when the drummer plays quarters in a 16ths groove because
 * stepDelta reflects actual steps skipped, not a raw hit count.
 *
 * Flam/simultaneous hits (stepDelta=0): skip EWMA update entirely,
 * keeping last* unchanged so the next genuine onset measures from the real previous hit.
 *
 * getPerformedBpm() returns null when |estimate - tempo|/tempo > 0.2,
 * but the internal estimate is NOT zeroed — preventing oscillation.
 */
export class BPMEstimator {
  private readonly EWMA_ALPHA = 0.05;
  private bpmEstimate: number | null = null;
  private lastAbsStep: number | null = null;
  private lastTimestamp: number | null = null;

  reset(): void {
    this.bpmEstimate = null;
    this.lastAbsStep = null;
    this.lastTimestamp = null;
  }

  /**
   * Update estimate from a new accepted hit.
   * @param timestamp - Hit timestamp (ms)
   * @param startTime - Playback start time (ms, same clock as timestamp)
   * @param tempo - Current grid tempo (BPM)
   * @param division - Groove division (e.g. 16 for 16th notes)
   */
  update(timestamp: number, startTime: number, tempo: number, division: number): void {
    // Beat = quarter note (engine source of truth: note duration = (60/tempo)/(division/4))
    const stepsPerBeat = division / 4;
    const beatDurMs = (60 / tempo) * 1000;
    const stepDurMs = beatDurMs / stepsPerBeat;

    const absStep = Math.round((timestamp - startTime) / stepDurMs);

    if (this.lastAbsStep === null || this.lastTimestamp === null) {
      this.lastAbsStep = absStep;
      this.lastTimestamp = timestamp;
      return;
    }

    const stepDelta = absStep - this.lastAbsStep;

    if (stepDelta < 1) {
      // Simultaneous / flam hit: skip update, keep last* unchanged
      return;
    }

    if (stepDelta < stepsPerBeat) {
      // Sub-beat interval: too short to measure BPM accurately
      this.lastAbsStep = absStep;
      this.lastTimestamp = timestamp;
      return;
    }

    const timeDeltaSecs = (timestamp - this.lastTimestamp) / 1000;
    if (timeDeltaSecs <= 0) {
      this.lastAbsStep = absStep;
      this.lastTimestamp = timestamp;
      return;
    }

    const bpmSample = (stepDelta * 60) / (stepsPerBeat * timeDeltaSecs);

    if (this.bpmEstimate === null) {
      this.bpmEstimate = bpmSample;
    } else {
      this.bpmEstimate += this.EWMA_ALPHA * (bpmSample - this.bpmEstimate);
    }

    this.lastAbsStep = absStep;
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
