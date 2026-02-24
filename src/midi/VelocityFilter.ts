/**
 * VelocityFilter - Noise Filtering for MIDI Velocity
 *
 * Filters out low-velocity events that are likely noise or crosstalk,
 * especially from cymbals and hi-hats. Per-pad thresholds can be configured
 * and calibrated to match specific MIDI hardware.
 */

import { VelocityThresholdConfig, DEFAULT_VELOCITY_THRESHOLDS } from './types';

/**
 * Filters MIDI note events based on velocity thresholds
 */
export class VelocityFilter {
  private thresholds: VelocityThresholdConfig;
  private globalMinVelocity: number = 1; // Absolute minimum

  constructor(customThresholds?: VelocityThresholdConfig) {
    // Merge custom thresholds with defaults
    this.thresholds = {
      ...DEFAULT_VELOCITY_THRESHOLDS,
      ...(customThresholds || {}),
    };
  }

  /**
   * Check if a note-on event should be accepted based on velocity
   * @param note - MIDI note number (0-127)
   * @param velocity - MIDI velocity (0-127)
   * @returns true if the event passes the filter
   */
  isValid(note: number, velocity: number): boolean {
    // Ignore velocity 0 (note off)
    if (velocity < this.globalMinVelocity) {
      return false;
    }

    // Get threshold for this note, or use default
    const threshold = this.thresholds[note] ?? this.getDefaultThreshold();

    return velocity >= threshold;
  }

  /**
   * Get the velocity threshold for a specific note
   * @param note - MIDI note number (0-127)
   * @returns Minimum velocity required
   */
  getThreshold(note: number): number {
    return this.thresholds[note] ?? this.getDefaultThreshold();
  }

  /**
   * Get all configured thresholds
   */
  getThresholds(): VelocityThresholdConfig {
    return { ...this.thresholds };
  }

  /**
   * Update thresholds (e.g., from calibration)
   */
  setThresholds(thresholds: VelocityThresholdConfig): void {
    this.thresholds = {
      ...DEFAULT_VELOCITY_THRESHOLDS,
      ...thresholds,
    };
  }

  /**
   * Reset to defaults
   */
  reset(): void {
    this.thresholds = { ...DEFAULT_VELOCITY_THRESHOLDS };
  }

  /**
   * Get the default threshold for notes not explicitly configured
   * @private
   */
  private getDefaultThreshold(): number {
    // Conservative default: most drums need at least 2-3 velocity
    // Cymbals can go lower (2), drums need 3-4
    return 2;
  }
}

/**
 * Convenience function to create a filter with custom thresholds
 */
export function createVelocityFilter(thresholds?: VelocityThresholdConfig): VelocityFilter {
  return new VelocityFilter(thresholds);
}
