/**
 * Metronome Configuration Constants
 *
 * Shared definitions for metronome options and frequency mapping.
 * Ensures type safety across all components using metronome settings.
 */

import { MetronomeFrequency } from '../types';

// Type-safe metronome frequency mapping
export const METRONOME_OPTIONS = ['off', '4th', '8th', '16th'] as const;
export type MetronomeOption = typeof METRONOME_OPTIONS[number];

export const METRONOME_FREQUENCY_MAP: Record<MetronomeOption, MetronomeFrequency> = {
  'off': 0,
  '4th': 4,
  '8th': 8,
  '16th': 16,
};

export const FREQUENCY_TO_OPTION_MAP: Record<MetronomeFrequency, MetronomeOption> = {
  0: 'off',
  4: '4th',
  8: '8th',
  16: '16th',
};

export function frequencyToMetronomeOption(freq: MetronomeFrequency): MetronomeOption {
  return FREQUENCY_TO_OPTION_MAP[freq] ?? 'off';
}

export function metronomeOptionToFrequency(option: MetronomeOption): MetronomeFrequency {
  return METRONOME_FREQUENCY_MAP[option];
}
