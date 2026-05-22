/**
 * MIDI Storage Utilities
 *
 * Handles persistence of MIDI configuration to localStorage.
 * Validates loaded data using Zod schemas for runtime safety.
 */

import { MIDIConfig, DEFAULT_MIDI_CONFIG, MIDIConfigSchema } from '../midi/types';
import { logger } from './logger';

const MIDI_CONFIG_KEY = 'groovy-midi-config';

// Known old latency defaults - if saved value matches these, use new default instead
const OLD_LATENCY_DEFAULTS = [0, 220, 270, 370, 580, 880];

/**
 * Load MIDI config from localStorage
 * Validates using Zod schema and merges with defaults to handle new options gracefully
 */
export function loadMIDIConfig(): MIDIConfig {
  try {
    const saved = localStorage.getItem(MIDI_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);

      // Validate against schema
      const validationResult = MIDIConfigSchema.safeParse(parsed);
      if (!validationResult.success) {
        logger.warn('Failed to validate MIDI config from localStorage:', validationResult.error);
        return DEFAULT_MIDI_CONFIG;
      }

      const parsed_config = validationResult.data;

      // If saved latencyCompensation uses an old default value, replace with new default
      const savedLatency = parsed_config.latencyCompensation?.offsetMs;
      const shouldUseNewLatencyDefault = savedLatency !== undefined && OLD_LATENCY_DEFAULTS.includes(savedLatency);

      // Build latencyCompensation, ensuring all required fields are present
      const latencyCompensation = parsed_config.latencyCompensation
        ? {
            ...DEFAULT_MIDI_CONFIG.latencyCompensation,
            ...parsed_config.latencyCompensation,
            ...(shouldUseNewLatencyDefault ? { offsetMs: DEFAULT_MIDI_CONFIG.latencyCompensation?.offsetMs || 950 } : {}),
          }
        : DEFAULT_MIDI_CONFIG.latencyCompensation;

      const result: MIDIConfig = {
        ...DEFAULT_MIDI_CONFIG,
        ...parsed_config,
        latencyCompensation,
      };
      logger.log(`📥 loadMIDIConfig: Loaded from localStorage, merged result:`, result);
      return result;
    }
  } catch (e) {
    logger.warn('Failed to load MIDI config:', e);
  }
  logger.log(`📥 loadMIDIConfig: Using DEFAULT_MIDI_CONFIG:`, DEFAULT_MIDI_CONFIG);
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
