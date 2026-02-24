/**
 * DoubleTriggerFilter - De-bounce for MIDI Hardware
 *
 * Prevents double-triggers and bouncing from e-drum pads.
 * Each pad has a refractory window: hits arriving within this window
 * of the previous hit on that pad are suppressed.
 *
 * Per-pad windows can be configured to match specific hardware characteristics.
 */

import { DoubleTriggerConfig, DEFAULT_DOUBLE_TRIGGER_WINDOWS } from './types';

/**
 * Filters duplicate/bounce triggers on MIDI notes
 */
export class DoubleTriggerFilter {
  private windows: DoubleTriggerConfig;
  private lastHitTime: Map<number, number> = new Map(); // note -> timestamp
  private globalDefaultWindow: number = 15; // ms, conservative default

  constructor(customWindows?: DoubleTriggerConfig) {
    // Merge custom windows with defaults
    this.windows = {
      ...DEFAULT_DOUBLE_TRIGGER_WINDOWS,
      ...(customWindows || {}),
    };
  }

  /**
   * Check if a note-on event should be accepted (not a double-trigger)
   * @param note - MIDI note number (0-127)
   * @param timestamp - Event timestamp (ms)
   * @returns true if the event is accepted, false if suppressed
   */
  isValid(note: number, timestamp: number): boolean {
    const lastTime = this.lastHitTime.get(note);

    // First hit on this note, always accept
    if (lastTime === undefined) {
      this.lastHitTime.set(note, timestamp);
      return true;
    }

    // Get refractory window for this note
    const window = this.windows[note] ?? this.globalDefaultWindow;
    const timeSinceLastHit = timestamp - lastTime;

    // If within refractory window, suppress
    if (timeSinceLastHit < window) {
      return false;
    }

    // Outside refractory window, accept and update last hit time
    this.lastHitTime.set(note, timestamp);
    return true;
  }

  /**
   * Get the refractory window for a specific note
   * @param note - MIDI note number (0-127)
   * @returns Window duration in milliseconds
   */
  getWindow(note: number): number {
    return this.windows[note] ?? this.globalDefaultWindow;
  }

  /**
   * Get all configured windows
   */
  getWindows(): DoubleTriggerConfig {
    return { ...this.windows };
  }

  /**
   * Update windows (e.g., from calibration)
   */
  setWindows(windows: DoubleTriggerConfig): void {
    this.windows = {
      ...DEFAULT_DOUBLE_TRIGGER_WINDOWS,
      ...windows,
    };
  }

  /**
   * Reset to defaults
   */
  reset(): void {
    this.windows = { ...DEFAULT_DOUBLE_TRIGGER_WINDOWS };
  }

  /**
   * Clear hit history (e.g., when playback stops)
   */
  clearHistory(): void {
    this.lastHitTime.clear();
  }

  /**
   * Get hit history for debugging/analysis
   */
  getHistory(): Record<number, number> {
    const result: Record<number, number> = {};
    for (const [note, time] of this.lastHitTime.entries()) {
      result[note] = time;
    }
    return result;
  }
}

/**
 * Convenience function to create a filter with custom windows
 */
export function createDoubleTriggerFilter(windows?: DoubleTriggerConfig): DoubleTriggerFilter {
  return new DoubleTriggerFilter(windows);
}
