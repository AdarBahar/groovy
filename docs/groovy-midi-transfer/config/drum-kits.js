// drum-kits.js - Drum Kit Configuration

/**
 * Roland TD-17 MIDI Note Mapping
 * Maps MIDI note numbers to drum/cymbal names
 */
export const TD17_MIDI_MAP = {
  // Kick
  36: 'Kick',

  // Snare
  38: 'Snare Head',
  40: 'Snare Rim',
  37: 'Snare Cross Stick',

  // Hi-Hat
  42: 'HH Closed',
  44: 'HH Pedal',
  46: 'HH Open',

  // Toms
  48: 'Tom 1',
  50: 'Tom 1 Rim',
  45: 'Tom 2',
  47: 'Tom 2 Rim',
  43: 'Tom 3',
  58: 'Tom 3 Rim',
  41: 'Tom 4',
  39: 'Tom 4 Rim',

  // Crashes
  49: 'Crash 1 Bow',
  55: 'Crash 1 Edge',
  57: 'Crash 2 Bow',
  52: 'Crash 2 Edge',

  // Ride
  51: 'Ride Bow',
  59: 'Ride Edge',
  53: 'Ride Bell',

  // Aux
  54: 'Aux 1',
  56: 'Aux 2',

  // Special
  33: 'Click'
};

/**
 * Drum name to Groovy voice mapping
 * Maps drum names to Groovy pattern voice identifiers
 */
export const DRUM_TO_GROOVE_VOICE = {
  // Hi-Hat -> H
  'HH Closed': 'H',
  'HH Pedal': 'H',
  'HH Open': 'H',

  // Snare -> S
  'Snare Head': 'S',
  'Snare Rim': 'S',
  'Snare Cross Stick': 'S',

  // Kick -> K
  'Kick': 'K',

  // Toms -> T1-T4
  'Tom 1': 'T1',
  'Tom 1 Rim': 'T1',
  'Tom 2': 'T2',
  'Tom 2 Rim': 'T2',
  'Tom 3': 'T3',
  'Tom 3 Rim': 'T3',
  'Tom 4': 'T4',
  'Tom 4 Rim': 'T4',

  // Crashes -> C
  'Crash 1 Bow': 'C',
  'Crash 1 Edge': 'C',
  'Crash 2 Bow': 'C',
  'Crash 2 Edge': 'C',

  // Ride -> R
  'Ride Bow': 'R',
  'Ride Edge': 'R',
  'Ride Bell': 'R',

  // Aux (map to crashes for now)
  'Aux 1': 'C',
  'Aux 2': 'C',

  // Click (no mapping)
  'Click': null
};

/**
 * Available drum kit configurations
 * Can be extended for other e-drum kits in the future
 */
export const DRUM_KITS = {
  'TD-17': {
    name: 'Roland TD-17',
    midiMap: TD17_MIDI_MAP,
    voiceMap: DRUM_TO_GROOVE_VOICE
  }
  // Future: Add more kits here
  // 'Alesis Nitro': { ... },
  // 'Yamaha DTX': { ... }
};

// Default kit
export const DEFAULT_KIT = 'TD-17';
