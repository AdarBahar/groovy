/**
 * ABC Notation Constants for Drum Transcoding
 *
 * Re-exports voice-specific constants from DrumVoiceConfig and provides
 * ABC notation utilities.
 *
 * Based on GrooveScribe's groove_utils.js implementation.
 */

// Re-export voice constants from centralized config
export {
  ABC_SYMBOLS,
  ABC_DECORATIONS,
  URL_TAB_CHARS,
  HANDS_VOICES,
  FEET_VOICES,
  type DrumVoice,
} from './DrumVoiceConfig';

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

