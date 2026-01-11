/**
 * ABC Notation Constants for Drum Transcoding
 * 
 * Maps DrumVoice types to ABC notation symbols and URL tab characters.
 * Based on GrooveScribe's groove_utils.js implementation.
 */

import { DrumVoice } from '../types';

/**
 * ABC symbol for each drum voice
 * Used in the ABC notation string for sheet music rendering
 */
export const ABC_SYMBOLS: Record<DrumVoice, string> = {
  // Hi-Hat variations (Hands voice - stems up)
  // Using standard pitches on percussion clef
  'hihat-closed': 'g',
  'hihat-open': 'g',
  'hihat-accent': 'g',
  'hihat-foot': 'd,', // Feet voice - stems down
  'hihat-metronome-normal': 'g',
  'hihat-metronome-accent': 'g',
  'hihat-cross': 'g',

  // Snare variations (Hands voice - stems up)
  'snare-normal': 'c',
  'snare-accent': 'c',
  'snare-ghost': 'c',
  'snare-cross-stick': 'c',
  'snare-flam': 'c',
  'snare-rim': 'c',
  'snare-drag': 'c',
  'snare-buzz': 'c',

  // Kick (Feet voice - stems down)
  'kick': 'F',

  // Toms (Hands voice - stems up)
  // Standard drum notation positions from high to low:
  // Tom 1 (high tom): 'e' - first space from top
  // Tom 2 (mid tom): 'B' - space between snare (c) and floor tom
  // Floor Tom: 'A' - one step above kick (G)
  'tom-rack': 'd',      // rack tom (high)
  'tom-10': 'e',        // Tom 1 - high tom
  'tom-16': 'B',        // Tom 2 - mid tom (space below snare)
  'tom-floor': 'A',     // Floor Tom - just above kick

  // Cymbals (Hands voice - stems up)
  'crash': "a",
  'ride': 'f',
  'ride-bell': 'f',

  // Percussion (Hands voice - stems up)
  'cowbell': 'a',
  'stacker': "a",
};

/**
 * ABC decoration prefix for each drum voice
 * Applied before the note symbol for articulations
 *
 * Standard abcjs decorations:
 * - !>! = accent mark (>) above note (marcato)
 * - !open! = open circle (o) above note (used for open hi-hat)
 * - !style=harmonic! = diamond notehead (used for ride bell)
 */
export const ABC_DECORATIONS: Partial<Record<DrumVoice, string>> = {
  // Hi-Hat decorations
  'hihat-open': '!open!',
  'hihat-accent': '!>!',
  'hihat-metronome-accent': '!>!',

  // Snare decorations
  'snare-accent': '!>!',
  // Note: Ghost notes would need custom %%deco which abcjs doesn't fully support
  // For now, ghost notes render as regular notes (visual distinction via dynamics later)

  // Cymbal decorations
  'ride-bell': '!style=harmonic!', // Diamond notehead for ride bell
};

/**
 * URL tab character for each drum voice
 * Used in shareable URL encoding (GrooveScribe-compatible)
 */
export const URL_TAB_CHARS: Record<DrumVoice, string> = {
  // Hi-Hat variations
  'hihat-closed': 'x',
  'hihat-open': 'o',
  'hihat-accent': 'X',
  'hihat-foot': '+',
  'hihat-metronome-normal': 'm',
  'hihat-metronome-accent': 'M',
  'hihat-cross': 'c',

  // Snare variations
  'snare-normal': 'o',
  'snare-accent': 'O',
  'snare-ghost': 'g',
  'snare-cross-stick': 'x',
  'snare-flam': 'f',
  'snare-rim': 'r',
  'snare-drag': 'd',
  'snare-buzz': 'b',

  // Kick
  'kick': 'o',

  // Toms
  'tom-rack': 'o',
  'tom-floor': 'o',
  'tom-10': 'o',
  'tom-16': 'o',

  // Cymbals
  'crash': 'C',
  'ride': 'r',
  'ride-bell': 'R',

  // Percussion
  'cowbell': 'c',
  'stacker': 's',
};

/**
 * Voices that belong to the "Hands" part (stems up)
 */
export const HANDS_VOICES: DrumVoice[] = [
  'hihat-closed',
  'hihat-open',
  'hihat-accent',
  'hihat-metronome-normal',
  'hihat-metronome-accent',
  'hihat-cross',
  'snare-normal',
  'snare-accent',
  'snare-ghost',
  'snare-cross-stick',
  'snare-flam',
  'snare-rim',
  'snare-drag',
  'snare-buzz',
  'tom-rack',
  'tom-floor',
  'tom-10',
  'tom-16',
  'crash',
  'ride',
  'ride-bell',
  'cowbell',
  'stacker',
];

/**
 * Voices that belong to the "Feet" part (stems down)
 */
export const FEET_VOICES: DrumVoice[] = ['kick', 'hihat-foot'];

/**
 * ABC invisible rest/spacer symbol
 * Using 'x' instead of 'z' to hide empty beats while preserving spacing
 */
export const ABC_REST = 'x';

/**
 * Get ABC note duration suffix based on division
 * For 16th notes: no suffix (default unit)
 * For 8th notes: "2" (twice as long)
 * For triplets: appropriate grouping
 */
export function getNoteDurationSuffix(division: number): string {
  // Base case: 16th notes have no suffix
  if (division === 16) return '';
  if (division === 8) return '2';
  if (division === 4) return '4';
  if (division === 32) return '/2';
  // Triplet divisions handled differently (grouping)
  return '';
}

/**
 * Check if a division is triplet-based
 */
export function isTripletDivision(division: number): boolean {
  return division === 12 || division === 24 || division === 48;
}

/**
 * ABC boilerplate header for drum notation
 * Using standard abcjs percussion notation
 */
export const ABC_BOILERPLATE = `%%flatbeams 1
%%ornament up
%%barnumbers 1`;

/**
 * Generate ABC header with time signature and tempo
 */
export function generateABCHeader(
  beats: number,
  noteValue: number,
  tempo: number,
  title?: string
): string {
  const lines: string[] = [];

  if (title) {
    lines.push(`T:${title}`);
  }

  lines.push(`M:${beats}/${noteValue}`);
  lines.push(`Q:1/4=${tempo}`);
  lines.push('L:1/16'); // Default note length: 16th note

  return lines.join('\n');
}

