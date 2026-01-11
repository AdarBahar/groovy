/**
 * ABC Notation Transcoder
 * 
 * Converts GrooveData to ABC notation string for sheet music rendering.
 * Supports multi-voice notation with hands (stems up) and feet (stems down).
 */

import { GrooveData, DrumVoice, getFlattenedNotes } from '../types';
import {
  ABC_SYMBOLS,
  ABC_DECORATIONS,
  ABC_REST,
  HANDS_VOICES,
  FEET_VOICES,
  ABC_BOILERPLATE,
  generateABCHeader,
  getNoteDurationSuffix,
  isTripletDivision,
} from './ABCConstants';

export interface ABCTranscoderOptions {
  title?: string;
  showTempo?: boolean;
  showTimeSignature?: boolean;
}

/**
 * Get all active voices at a specific position
 */
function getActiveVoicesAtPosition(
  notes: Record<DrumVoice, boolean[]>,
  position: number,
  voiceFilter: DrumVoice[]
): DrumVoice[] {
  return voiceFilter.filter(
    (voice) => notes[voice]?.[position] === true
  );
}

/**
 * Get the ABC symbol with decoration for a voice
 * Decorations are placed before the note symbol
 */
function getDecoratedSymbol(voice: DrumVoice): string {
  const decoration = ABC_DECORATIONS[voice] || '';
  const symbol = ABC_SYMBOLS[voice];
  return decoration + symbol;
}

/**
 * Generate ABC symbols for a single position
 * Returns a chord [abc] if multiple voices, single note otherwise
 *
 * For single notes: decoration + symbol + duration (e.g., "!accent!^g2")
 * For chords: decorations before chord, symbols inside (e.g., "!accent![^g c]2")
 *
 * Note: When multiple notes have decorations in a chord, decorations are
 * placed before the chord bracket. This is a limitation of ABC notation.
 */
function generatePositionABC(
  notes: Record<DrumVoice, boolean[]>,
  position: number,
  voiceFilter: DrumVoice[],
  durationSuffix: string
): string {
  const activeVoices = getActiveVoicesAtPosition(notes, position, voiceFilter);

  if (activeVoices.length === 0) {
    return ABC_REST + durationSuffix;
  }

  if (activeVoices.length === 1) {
    // Single note: decoration + symbol + duration
    return getDecoratedSymbol(activeVoices[0]) + durationSuffix;
  }

  // Multiple voices at same position: create chord
  // Collect all decorations and place them before the chord
  const decorations = activeVoices
    .map((voice) => ABC_DECORATIONS[voice] || '')
    .filter((d) => d !== '')
    .join('');

  const symbols = activeVoices.map((voice) => ABC_SYMBOLS[voice]);

  return decorations + '[' + symbols.join('') + ']' + durationSuffix;
}

/** Number of measures per line in sheet music */
const MEASURES_PER_LINE = 3;

/**
 * Generate ABC notation for a single voice part (Hands or Feet)
 * Handles multiple measures with measure bars between them
 * Adds line breaks every MEASURES_PER_LINE measures for readability
 */
function generateVoicePart(
  groove: GrooveData,
  voiceFilter: DrumVoice[],
  durationSuffix: string
): string {
  const division = groove.division;
  const isTriplet = isTripletDivision(division);
  const parts: string[] = [];

  // Group notes for readability (every 4 notes for straight, every 3 for triplets)
  const groupSize = isTriplet ? 3 : 4;

  // Process each measure
  for (let measureIndex = 0; measureIndex < groove.measures.length; measureIndex++) {
    const measure = groove.measures[measureIndex];
    const ts = measure.timeSignature || groove.timeSignature;
    const notesPerMeasure = (division / ts.noteValue) * ts.beats;

    for (let i = 0; i < notesPerMeasure; i++) {
      // Add space between groups for readability
      if (i > 0 && i % groupSize === 0) {
        parts.push(' ');
      }

      const abc = generatePositionABC(measure.notes, i, voiceFilter, durationSuffix);
      parts.push(abc);
    }

    // Add measure bar
    parts.push(' |');

    // Add line break after every MEASURES_PER_LINE measures (but not at the very end)
    const measureNumber = measureIndex + 1;
    if (measureNumber % MEASURES_PER_LINE === 0 && measureIndex < groove.measures.length - 1) {
      parts.push('\n');
    }
  }

  return parts.join('');
}

/**
 * Convert GrooveData to ABC notation string
 * 
 * Generates two-voice ABC notation:
 * - Hands voice (stems up): hi-hat, snare, toms, cymbals
 * - Feet voice (stems down): kick, hi-hat foot
 */
export function grooveToABC(
  groove: GrooveData,
  options: ABCTranscoderOptions = {}
): string {
  const { title } = options;
  const { beats, noteValue } = groove.timeSignature;
  const durationSuffix = getNoteDurationSuffix(groove.division);

  // Build ABC string
  const lines: string[] = [];

  // Add boilerplate (SVG defs, map, deco)
  lines.push(ABC_BOILERPLATE);

  // Add header
  lines.push(generateABCHeader(beats, noteValue, groove.tempo, title));

  // Add staves directive for multi-voice
  lines.push('%%staves (Hands Feet)');

  // Key and clef
  lines.push('K:C clef=perc');

  // Hands voice (stems up)
  lines.push('V:Hands stem=up');
  lines.push('%%voicemap drum');
  lines.push(generateVoicePart(groove, HANDS_VOICES, durationSuffix));

  // Feet voice (stems down)
  lines.push('V:Feet stem=down');
  lines.push('%%voicemap drum');
  lines.push(generateVoicePart(groove, FEET_VOICES, durationSuffix));

  return lines.join('\n');
}

/**
 * Check if a groove has any notes in the hands voices
 */
export function hasHandsNotes(groove: GrooveData): boolean {
  const notes = getFlattenedNotes(groove);
  return HANDS_VOICES.some((voice) =>
    notes[voice]?.some((note: boolean) => note === true)
  );
}

/**
 * Check if a groove has any notes in the feet voices
 */
export function hasFeetNotes(groove: GrooveData): boolean {
  const notes = getFlattenedNotes(groove);
  return FEET_VOICES.some((voice) =>
    notes[voice]?.some((note: boolean) => note === true)
  );
}

// Export namespace for convenience
export const ABCTranscoder = {
  grooveToABC,
  hasHandsNotes,
  hasFeetNotes,
};

