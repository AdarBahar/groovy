/**
 * MIDI Storage Utilities
 *
 * Handles persistence of MIDI configuration to localStorage.
 * Follows the same pattern as metronome config storage.
 */

import { MIDIConfig, DEFAULT_MIDI_CONFIG } from '../midi/types';

const MIDI_CONFIG_KEY = 'groovy-midi-config';

/**
 * Load MIDI config from localStorage
 * Merges saved config with defaults to handle new options gracefully
 */
// Known old latency defaults - if saved value matches these, use new default instead
const OLD_LATENCY_DEFAULTS = [0, 220, 270, 370, 580, 880];

export function loadMIDIConfig(): MIDIConfig {
  try {
    const saved = localStorage.getItem(MIDI_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);

      // If saved latencyCompensation uses an old default value, replace with new default
      const savedLatency = parsed.latencyCompensation?.offsetMs;
      const shouldUseNewLatencyDefault = savedLatency !== undefined && OLD_LATENCY_DEFAULTS.includes(savedLatency);

      // Deep merge latencyCompensation with smart handling of old defaults
      const result: MIDIConfig = {
        ...DEFAULT_MIDI_CONFIG,
        ...parsed,
        latencyCompensation: {
          ...DEFAULT_MIDI_CONFIG.latencyCompensation,
          ...(parsed.latencyCompensation || {}),
          // If saved value is an old default, use new default instead
          ...(shouldUseNewLatencyDefault ? { offsetMs: DEFAULT_MIDI_CONFIG.latencyCompensation?.offsetMs || 950 } : {}),
        },
      };
      console.log(`📥 loadMIDIConfig: Loaded from localStorage, merged result:`, result);
      return result;
    }
  } catch (e) {
    console.warn('Failed to load MIDI config:', e);
  }
  console.log(`📥 loadMIDIConfig: Using DEFAULT_MIDI_CONFIG:`, DEFAULT_MIDI_CONFIG);
  return DEFAULT_MIDI_CONFIG;
}

/**
 * Save MIDI config to localStorage
 */
export function saveMIDIConfig(config: MIDIConfig): void {
  try {
    localStorage.setItem(MIDI_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Failed to save MIDI config:', e);
  }
}

/**
 * Clear MIDI config from localStorage
 */
export function clearMIDIConfig(): void {
  try {
    localStorage.removeItem(MIDI_CONFIG_KEY);
  } catch (e) {
    console.warn('Failed to clear MIDI config:', e);
  }
}
