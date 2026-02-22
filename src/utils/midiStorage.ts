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
export function loadMIDIConfig(): MIDIConfig {
  try {
    const saved = localStorage.getItem(MIDI_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_MIDI_CONFIG, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to load MIDI config:', e);
  }
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
