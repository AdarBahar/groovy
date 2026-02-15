// performance-tracker.js - Real-time Performance Analysis (Optional)

class PerformanceTracker {
  constructor() {
    this.enabled = false;
    this.loadedPattern = null;
    this.startTime = null;
    this.tempo = 120;
    this.stats = {
      totalHits: 0,
      accurateHits: 0,
      timingErrors: [],
      averageAccuracy: 0
    };
  }

  /**
   * Enable performance tracking with a loaded groove pattern
   * @param {Object} pattern - Parsed groove pattern
   * @param {number} tempo - BPM
   * @param {number} startTime - Performance start timestamp
   */
  enable(pattern, tempo, startTime) {
    this.loadedPattern = pattern;
    this.tempo = tempo;
    this.startTime = startTime;
    this.enabled = true;
    this.resetStats();
    console.log('Performance tracking enabled');
  }

  /**
   * Disable performance tracking
   */
  disable() {
    this.enabled = false;
    console.log('Performance tracking disabled');
  }

  /**
   * Reset performance statistics
   */
  resetStats() {
    this.stats = {
      totalHits: 0,
      accurateHits: 0,
      timingErrors: [],
      averageAccuracy: 0
    };
  }

  /**
   * Analyze a MIDI hit
   * @param {string} grooveVoice - The groove voice that was hit (H/S/K/etc.)
   * @param {number} timestamp - When the hit occurred
   * @returns {Object} Analysis result {timingAccuracy, noteAccuracy, overall}
   */
  analyzeHit(grooveVoice, timestamp) {
    if (!this.enabled || !this.loadedPattern) {
      return null;
    }

    const timingAccuracy = this.calculateTimingAccuracy(timestamp);
    const noteAccuracy = this.checkNoteAccuracy(grooveVoice);
    const overall = (timingAccuracy + noteAccuracy) / 2;

    // Update stats
    this.stats.totalHits++;
    if (overall > 70) {
      this.stats.accurateHits++;
    }
    this.stats.timingErrors.push(timingAccuracy);
    this.stats.averageAccuracy =
      (this.stats.averageAccuracy * (this.stats.totalHits - 1) + overall) / this.stats.totalHits;

    return {
      timingAccuracy,
      noteAccuracy,
      overall,
      feedback: this.getFeedback(overall)
    };
  }

  /**
   * Calculate timing accuracy (how close to the beat)
   * @private
   * @param {number} timestamp - Hit timestamp
   * @returns {number} Accuracy percentage (0-100)
   */
  calculateTimingAccuracy(timestamp) {
    if (!this.startTime) return 50;

    const elapsedMs = timestamp - this.startTime;
    const beatDurationMs = (60 / this.tempo) * 1000;

    // Find nearest beat
    const beatNumber = Math.round(elapsedMs / beatDurationMs);
    const expectedTime = beatNumber * beatDurationMs;
    const timingError = Math.abs(elapsedMs - expectedTime);

    // Convert to accuracy (closer = higher score)
    const maxError = beatDurationMs / 4; // Quarter beat tolerance
    const accuracy = Math.max(0, 100 - (timingError / maxError) * 100);

    return Math.round(accuracy);
  }

  /**
   * Check if the hit note matches the loaded pattern
   * @private
   * @param {string} grooveVoice - Voice that was hit
   * @returns {number} Accuracy percentage (0-100)
   */
  checkNoteAccuracy(grooveVoice) {
    if (!this.loadedPattern || !this.loadedPattern.voices) {
      return 50; // No pattern loaded, can't verify
    }

    // Check if this voice exists in the pattern
    const voicePattern = this.loadedPattern.voices[grooveVoice];

    if (!voicePattern || voicePattern.length === 0) {
      // Voice not in pattern
      return 30;
    }

    // Voice exists in pattern - could enhance by checking position
    return 80;
  }

  /**
   * Get performance feedback message
   * @private
   * @param {number} accuracy - Overall accuracy (0-100)
   * @returns {string} Feedback message
   */
  getFeedback(accuracy) {
    if (accuracy >= 90) return 'Perfect!';
    if (accuracy >= 75) return 'Great!';
    if (accuracy >= 60) return 'Good';
    if (accuracy >= 40) return 'Keep trying';
    return 'Miss';
  }

  /**
   * Get current performance statistics
   * @returns {Object} Stats object
   */
  getStats() {
    return { ...this.stats };
  }
}

// Export singleton instance
export const performanceTracker = new PerformanceTracker();
