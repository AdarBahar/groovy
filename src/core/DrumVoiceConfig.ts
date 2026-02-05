/**
 * DrumVoiceConfig - Centralized Drum Voice Definitions
 *
 * Single source of truth for all drum voice properties including:
 * - Display names and groupings
 * - ABC notation symbols and decorations
 * - URL tab characters for encoding
 * - MIDI note mappings
 * - Voice categorization (hands/feet)
 *
 * This file consolidates previously scattered definitions from:
 * - types.ts (DrumVoice type, ALL_DRUM_VOICES)
 * - ABCConstants.ts (ABC_SYMBOLS, ABC_DECORATIONS, URL_TAB_CHARS)
 * - ExportUtils.ts (DRUM_VOICE_TO_MIDI)
 * - GrooveURLCodec.ts (VOICE_GROUPS)
 * - DrumGrid.tsx / DrumGridDark.tsx (DRUM_ROWS)
 */

/**
 * Voice group categories for organization
 */
export type VoiceGroup =
  | 'hihat'
  | 'snare'
  | 'kick'
  | 'toms'
  | 'cymbals'
  | 'percussion';

/**
 * Voice part for stem direction in notation
 */
export type VoicePart = 'hands' | 'feet';

/**
 * Complete configuration for a single drum voice
 */
export interface DrumVoiceDefinition {
  /** Display name */
  name: string;
  /** Group category */
  group: VoiceGroup;
  /** Part for stem direction (hands = up, feet = down) */
  part: VoicePart;
  /** ABC notation symbol */
  abcSymbol: string;
  /** ABC decoration prefix (optional) */
  abcDecoration?: string;
  /** URL tab character for encoding */
  urlTabChar: string;
  /** General MIDI note number */
  midiNote: number;
  /** Default velocity (0-127) */
  velocity: number;
}

/**
 * Master configuration for all drum voices
 * Keys match the DrumVoice union type
 */
export const DRUM_VOICE_CONFIG = {
  // Hi-Hat variations
  'hihat-closed': {
    name: 'Closed Hi-Hat',
    group: 'hihat',
    part: 'hands',
    abcSymbol: 'g',
    urlTabChar: 'x',
    midiNote: 42,
    velocity: 100,
  },
  'hihat-open': {
    name: 'Open Hi-Hat',
    group: 'hihat',
    part: 'hands',
    abcSymbol: 'g',
    abcDecoration: '!open!',
    urlTabChar: 'o',
    midiNote: 46,
    velocity: 100,
  },
  'hihat-accent': {
    name: 'Hi-Hat Accent',
    group: 'hihat',
    part: 'hands',
    abcSymbol: 'g',
    abcDecoration: '!>!',
    urlTabChar: 'X',
    midiNote: 42,
    velocity: 120,
  },
  'hihat-foot': {
    name: 'Hi-Hat Foot',
    group: 'hihat',
    part: 'feet',
    abcSymbol: 'd,',
    urlTabChar: '+',
    midiNote: 44,
    velocity: 100,
  },
  'hihat-metronome-normal': {
    name: 'Metronome',
    group: 'hihat',
    part: 'hands',
    abcSymbol: 'g',
    urlTabChar: 'm',
    midiNote: 37,
    velocity: 80,
  },
  'hihat-metronome-accent': {
    name: 'Metronome Accent',
    group: 'hihat',
    part: 'hands',
    abcSymbol: 'g',
    abcDecoration: '!>!',
    urlTabChar: 'M',
    midiNote: 37,
    velocity: 80,
  },
  'hihat-cross': {
    name: 'Cross Stick Hi-Hat',
    group: 'hihat',
    part: 'hands',
    abcSymbol: 'g',
    urlTabChar: 'c',
    midiNote: 42,
    velocity: 100,
  },

  // Snare variations
  'snare-normal': {
    name: 'Snare',
    group: 'snare',
    part: 'hands',
    abcSymbol: 'c',
    urlTabChar: 'o',
    midiNote: 38,
    velocity: 100,
  },
  'snare-accent': {
    name: 'Snare Accent',
    group: 'snare',
    part: 'hands',
    abcSymbol: 'c',
    abcDecoration: '!>!',
    urlTabChar: 'O',
    midiNote: 38,
    velocity: 120,
  },
  'snare-ghost': {
    name: 'Ghost Note',
    group: 'snare',
    part: 'hands',
    abcSymbol: 'c',
    urlTabChar: 'g',
    midiNote: 38,
    velocity: 50,
  },
  'snare-cross-stick': {
    name: 'Cross Stick',
    group: 'snare',
    part: 'hands',
    abcSymbol: 'c',
    urlTabChar: 'x',
    midiNote: 37,
    velocity: 100,
  },
  'snare-flam': {
    name: 'Flam',
    group: 'snare',
    part: 'hands',
    abcSymbol: 'c',
    urlTabChar: 'f',
    midiNote: 38,
    velocity: 100,
  },
  'snare-rim': {
    name: 'Rimshot',
    group: 'snare',
    part: 'hands',
    abcSymbol: 'c',
    urlTabChar: 'r',
    midiNote: 37,
    velocity: 100,
  },
  'snare-drag': {
    name: 'Drag',
    group: 'snare',
    part: 'hands',
    abcSymbol: 'c',
    urlTabChar: 'd',
    midiNote: 38,
    velocity: 100,
  },
  'snare-buzz': {
    name: 'Buzz',
    group: 'snare',
    part: 'hands',
    abcSymbol: 'c',
    urlTabChar: 'b',
    midiNote: 38,
    velocity: 100,
  },

  // Kick
  kick: {
    name: 'Kick',
    group: 'kick',
    part: 'feet',
    abcSymbol: 'F',
    urlTabChar: 'o',
    midiNote: 36,
    velocity: 100,
  },

  // Toms
  'tom-rack': {
    name: 'Rack Tom',
    group: 'toms',
    part: 'hands',
    abcSymbol: 'd',
    urlTabChar: 'o',
    midiNote: 48,
    velocity: 100,
  },
  'tom-floor': {
    name: 'Floor Tom',
    group: 'toms',
    part: 'hands',
    abcSymbol: 'A',
    urlTabChar: 'o',
    midiNote: 43,
    velocity: 100,
  },
  'tom-10': {
    name: 'Tom 1',
    group: 'toms',
    part: 'hands',
    abcSymbol: 'e',
    urlTabChar: 'o',
    midiNote: 45,
    velocity: 100,
  },
  'tom-16': {
    name: 'Tom 2',
    group: 'toms',
    part: 'hands',
    abcSymbol: 'B',
    urlTabChar: 'o',
    midiNote: 41,
    velocity: 100,
  },

  // Cymbals
  crash: {
    name: 'Crash',
    group: 'cymbals',
    part: 'hands',
    abcSymbol: 'a',
    urlTabChar: 'C',
    midiNote: 49,
    velocity: 100,
  },
  ride: {
    name: 'Ride',
    group: 'cymbals',
    part: 'hands',
    abcSymbol: 'f',
    urlTabChar: 'r',
    midiNote: 51,
    velocity: 100,
  },
  'ride-bell': {
    name: 'Ride Bell',
    group: 'cymbals',
    part: 'hands',
    abcSymbol: 'f',
    abcDecoration: '!style=harmonic!',
    urlTabChar: 'R',
    midiNote: 53,
    velocity: 100,
  },

  // Percussion
  cowbell: {
    name: 'Cowbell',
    group: 'percussion',
    part: 'hands',
    abcSymbol: 'a',
    urlTabChar: 'c',
    midiNote: 56,
    velocity: 100,
  },
  stacker: {
    name: 'Stacker',
    group: 'percussion',
    part: 'hands',
    abcSymbol: 'a',
    urlTabChar: 's',
    midiNote: 52,
    velocity: 100,
  },
} as const satisfies Record<string, DrumVoiceDefinition>;

/**
 * DrumVoice type derived from config keys
 */
export type DrumVoice = keyof typeof DRUM_VOICE_CONFIG;

/**
 * All drum voices as an array (for iteration)
 */
export const ALL_DRUM_VOICES = Object.keys(DRUM_VOICE_CONFIG) as DrumVoice[];

// ============================================================================
// Derived lookups (generated from config)
// ============================================================================

/**
 * ABC symbol for each drum voice
 */
export const ABC_SYMBOLS: Record<DrumVoice, string> = Object.fromEntries(
  Object.entries(DRUM_VOICE_CONFIG).map(([voice, config]) => [voice, config.abcSymbol])
) as Record<DrumVoice, string>;

/**
 * ABC decoration prefix for each drum voice
 */
export const ABC_DECORATIONS: Partial<Record<DrumVoice, string>> = Object.fromEntries(
  Object.entries(DRUM_VOICE_CONFIG)
    .filter(([, config]) => 'abcDecoration' in config && config.abcDecoration)
    .map(([voice, config]) => [voice, (config as { abcDecoration?: string }).abcDecoration])
) as Partial<Record<DrumVoice, string>>;

/**
 * URL tab character for each drum voice
 */
export const URL_TAB_CHARS: Record<DrumVoice, string> = Object.fromEntries(
  Object.entries(DRUM_VOICE_CONFIG).map(([voice, config]) => [voice, config.urlTabChar])
) as Record<DrumVoice, string>;

/**
 * MIDI note for each drum voice
 */
export const DRUM_VOICE_TO_MIDI: Record<DrumVoice, number> = Object.fromEntries(
  Object.entries(DRUM_VOICE_CONFIG).map(([voice, config]) => [voice, config.midiNote])
) as Record<DrumVoice, number>;

/**
 * Voices that belong to the "Hands" part (stems up)
 */
export const HANDS_VOICES: DrumVoice[] = Object.entries(DRUM_VOICE_CONFIG)
  .filter(([, config]) => config.part === 'hands')
  .map(([voice]) => voice as DrumVoice);

/**
 * Voices that belong to the "Feet" part (stems down)
 */
export const FEET_VOICES: DrumVoice[] = Object.entries(DRUM_VOICE_CONFIG)
  .filter(([, config]) => config.part === 'feet')
  .map(([voice]) => voice as DrumVoice);

/**
 * Get velocity for a drum voice
 */
export function getVelocityForVoice(voice: DrumVoice): number {
  return DRUM_VOICE_CONFIG[voice].velocity;
}

/**
 * Get voices by group
 */
export function getVoicesByGroup(group: VoiceGroup): DrumVoice[] {
  return Object.entries(DRUM_VOICE_CONFIG)
    .filter(([, config]) => config.group === group)
    .map(([voice]) => voice as DrumVoice);
}

// ============================================================================
// URL Codec voice groups (for GrooveURLCodec.ts)
// ============================================================================

/**
 * URL parameter to voice group mapping
 * Each group is ordered by priority (first match wins when decoding)
 */
export const URL_VOICE_GROUPS = {
  H: getVoicesByGroup('hihat'),
  S: getVoicesByGroup('snare'),
  K: ['kick'] as DrumVoice[],
  T1: ['tom-rack'] as DrumVoice[],
  T2: ['tom-floor'] as DrumVoice[],
  T3: ['tom-10'] as DrumVoice[],
  T4: ['tom-16'] as DrumVoice[],
  C: ['crash'] as DrumVoice[],
  R: ['ride', 'ride-bell'] as DrumVoice[],
} as const;

/**
 * Reverse lookup: DrumVoice → URL param key
 */
export const VOICE_TO_URL_PARAM: Record<DrumVoice, string> = (() => {
  const result: Partial<Record<DrumVoice, string>> = {};
  for (const [param, voices] of Object.entries(URL_VOICE_GROUPS)) {
    for (const voice of voices) {
      result[voice] = param;
    }
  }
  return result as Record<DrumVoice, string>;
})();

// ============================================================================
// Drum Grid row definitions (for DrumGrid.tsx / DrumGridDark.tsx)
// ============================================================================

/**
 * Drum row definition for the grid UI
 */
export interface DrumRow {
  name: string;
  defaultVoices: DrumVoice[];
  variations: { voices: DrumVoice[]; label: string; shortcut?: string }[];
}

/**
 * Drum rows for the grid UI
 * Shared between DrumGrid.tsx and DrumGridDark.tsx
 */
export const DRUM_ROWS: DrumRow[] = [
  {
    name: 'Cymbals',
    defaultVoices: ['crash'],
    variations: [
      { voices: ['crash'], label: 'Crash', shortcut: '1' },
      { voices: ['ride'], label: 'Ride', shortcut: '2' },
      { voices: ['ride-bell'], label: 'Ride Bell', shortcut: '3' },
      { voices: ['cowbell'], label: 'Cowbell', shortcut: '4' },
      { voices: ['stacker'], label: 'Stacker', shortcut: '5' },
    ],
  },
  {
    name: 'Hi-Hat',
    defaultVoices: ['hihat-closed'],
    variations: [
      { voices: ['hihat-closed'], label: 'Closed', shortcut: '1' },
      { voices: ['hihat-open'], label: 'Open', shortcut: '2' },
      { voices: ['hihat-accent'], label: 'Accent', shortcut: '3' },
      { voices: ['hihat-metronome-normal'], label: 'Metronome', shortcut: '4' },
      { voices: ['hihat-metronome-accent'], label: 'Metronome Accent', shortcut: '5' },
    ],
  },
  {
    name: 'Tom 1',
    defaultVoices: ['tom-10'],
    variations: [{ voices: ['tom-10'], label: 'Tom 1' }],
  },
  {
    name: 'Snare',
    defaultVoices: ['snare-normal'],
    variations: [
      { voices: ['snare-normal'], label: 'Normal', shortcut: '1' },
      { voices: ['snare-accent'], label: 'Accent', shortcut: '2' },
      { voices: ['snare-ghost'], label: 'Ghost Note', shortcut: '3' },
      { voices: ['snare-cross-stick'], label: 'Cross Stick', shortcut: '4' },
      { voices: ['snare-flam'], label: 'Flam', shortcut: '5' },
      { voices: ['snare-rim'], label: 'Rimshot', shortcut: '6' },
      { voices: ['snare-drag'], label: 'Drag', shortcut: '7' },
      { voices: ['snare-buzz'], label: 'Buzz', shortcut: '8' },
    ],
  },
  {
    name: 'Tom 2',
    defaultVoices: ['tom-16'],
    variations: [{ voices: ['tom-16'], label: 'Tom 2' }],
  },
  {
    name: 'Floor Tom',
    defaultVoices: ['tom-floor'],
    variations: [{ voices: ['tom-floor'], label: 'Floor Tom' }],
  },
  {
    name: 'Kick',
    defaultVoices: ['kick'],
    variations: [
      { voices: ['kick'], label: 'Kick', shortcut: '1' },
      { voices: ['hihat-foot'], label: 'Hi-Hat Foot', shortcut: '2' },
      { voices: ['kick', 'hihat-foot'], label: 'Kick & Hi-Hat Foot', shortcut: '3' },
    ],
  },
];
