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

export interface GroovePattern {
  voices?: Record<DrumVoice, boolean[]>;
  [key: string]: any;
}

class PerformanceTracker {
  private enabled: boolean = false;
  private loadedPattern: GroovePattern | null = null;
  private startTime: number | null = null;
  private tempo: number = 120;
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
   * @param startTime - Performance start timestamp (ms since epoch)
   */
  enable(pattern: GroovePattern, tempo: number, startTime: number): void {
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
   * @param timestamp - When the hit occurred (ms since epoch)
   * @returns Analysis result or null if tracking disabled
   */
  analyzeHit(grooveVoice: DrumVoice | null, timestamp: number): HitAnalysis | null {
    if (!this.enabled || !this.loadedPattern || !grooveVoice) {
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
      timingAccuracy: Math.round(timingAccuracy),
      noteAccuracy: Math.round(noteAccuracy),
      overall: Math.round(overall),
      feedback: this.getFeedback(overall),
    };
  }

  /**
   * Calculate timing accuracy (how close to the beat)
   * @private
   * @param timestamp - Hit timestamp (ms since epoch)
   * @returns Accuracy percentage (0-100)
   */
  private calculateTimingAccuracy(timestamp: number): number {
    if (!this.startTime) return 50;

    const elapsedMs = timestamp - this.startTime;
    const beatDurationMs = (60 / this.tempo) * 1000;

    // Find nearest beat
    const beatNumber = Math.round(elapsedMs / beatDurationMs);
    const expectedTime = beatNumber * beatDurationMs;
    const timingError = Math.abs(elapsedMs - expectedTime);

    // Convert to accuracy (closer = higher score)
    // Quarter beat tolerance
    const maxError = beatDurationMs / 4;
    const accuracy = Math.max(0, 100 - (timingError / maxError) * 100);

    return accuracy;
  }

  /**
   * Check if the hit note matches the loaded pattern
   * @private
   * @param grooveVoice - Voice that was hit
   * @returns Accuracy percentage (0-100)
   */
  private checkNoteAccuracy(grooveVoice: DrumVoice): number {
    if (!this.loadedPattern || !this.loadedPattern.voices) {
      return 50; // No pattern loaded, can't verify
    }

    // Check if this voice exists in the pattern
    const voicePattern = this.loadedPattern.voices[grooveVoice];

    if (!voicePattern || voicePattern.length === 0) {
      // Voice not in pattern
      return 30;
    }

    // Voice exists in pattern
    return 80;
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
    return { ...this.stats };
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
