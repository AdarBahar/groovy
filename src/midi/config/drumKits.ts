/**
 * Drum Kit Configurations
 *
 * Defines MIDI note mappings for different electronic drum kits.
 * Each kit can have custom mappings that override the default GM mapping.
 *
 * To add a new kit:
 * 1. Add a new mapping object below
 * 2. Add it to DRUM_KITS object
 * 3. Update MIDISettingsModal dropdown to include it
 */

import { DrumVoice } from '../../types';

/**
 * Roland TD-17 MIDI Note Mapping
 * Default kit with General MIDI compatible mapping
 */
export const TD17_MAPPINGS: Record<number, DrumVoice> = {
  // Kick
  36: 'kick',

  // Snare
  38: 'snare-normal',
  37: 'snare-cross-stick',
  40: 'snare-rim',

  // Hi-Hat
  42: 'hihat-closed',
  46: 'hihat-open',
  44: 'hihat-foot',

  // Toms
  48: 'tom-10',
  50: 'tom-10', // Tom 1 also mapped to 50
  45: 'tom-16',
  47: 'tom-16', // Tom 2 also mapped to 47
  43: 'tom-rack',
  58: 'tom-rack', // Tom 3 also mapped to 58
  41: 'tom-floor',
  39: 'tom-floor', // Tom 4 also mapped to 39

  // Crashes
  49: 'crash',
  55: 'crash',
  57: 'crash',
  52: 'crash',

  // Ride
  51: 'ride',
  59: 'ride',
  53: 'ride-bell',
};

/**
 * Alesis Nitro Mesh MIDI Note Mapping
 * Different layout from Roland TD-17
 */
export const ALESIS_NITRO_MAPPINGS: Record<number, DrumVoice> = {
  // Kick
  36: 'kick',

  // Snare
  38: 'snare-normal',
  37: 'snare-cross-stick',

  // Hi-Hat
  42: 'hihat-closed',
  46: 'hihat-open',

  // Toms
  45: 'tom-10',
  48: 'tom-16',
  43: 'tom-rack',

  // Cymbals
  49: 'crash',
  51: 'ride',
};

/**
 * Yamaha DTX432K MIDI Note Mapping
 * Yamaha e-drum kit mapping
 */
export const YAMAHA_DTX_MAPPINGS: Record<number, DrumVoice> = {
  // Kick
  36: 'kick',

  // Snare
  38: 'snare-normal',
  37: 'snare-cross-stick',
  40: 'snare-rim',

  // Hi-Hat
  42: 'hihat-closed',
  46: 'hihat-open',
  44: 'hihat-foot',

  // Toms
  50: 'tom-10',
  45: 'tom-16',
  41: 'tom-rack',
  43: 'tom-floor',

  // Cymbals
  49: 'crash',
  51: 'ride',
  53: 'ride-bell',
};

/**
 * Drum kit definition
 */
export interface DrumKit {
  name: string;
  manufacturer: string;
  mappings: Record<number, DrumVoice>;
  description?: string;
}

/**
 * All available drum kits
 */
export const DRUM_KITS: Record<string, DrumKit> = {
  'TD-17': {
    name: 'Roland TD-17',
    manufacturer: 'Roland',
    mappings: TD17_MAPPINGS,
    description: 'Roland TD-17 electronic drum kit (General MIDI)',
  },
  'Alesis Nitro': {
    name: 'Alesis Nitro Mesh',
    manufacturer: 'Alesis',
    mappings: ALESIS_NITRO_MAPPINGS,
    description: 'Alesis Nitro Mesh electronic drum kit',
  },
  'Yamaha DTX': {
    name: 'Yamaha DTX432K',
    manufacturer: 'Yamaha',
    mappings: YAMAHA_DTX_MAPPINGS,
    description: 'Yamaha DTX432K electronic drum kit',
  },
};

/**
 * Default drum kit
 */
export const DEFAULT_DRUM_KIT = 'TD-17';

/**
 * Get drum kit mappings
 */
export function getDrumKitMappings(kitName: string): Record<number, DrumVoice> {
  const kit = DRUM_KITS[kitName];
  if (!kit) {
    console.warn(`Unknown drum kit: ${kitName}, falling back to TD-17`);
    return DRUM_KITS['TD-17'].mappings;
  }
  return kit.mappings;
}

/**
 * Get all drum kit names
 */
export function getAllDrumKitNames(): string[] {
  return Object.keys(DRUM_KITS);
}

/**
 * Get drum kit by name
 */
export function getDrumKit(kitName: string): DrumKit | null {
  return DRUM_KITS[kitName] || null;
}
