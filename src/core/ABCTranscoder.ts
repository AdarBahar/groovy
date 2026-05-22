/**
 * ABC Notation Transcoder
 *
 * Converts GrooveData to ABC notation string for sheet music rendering.
 * Supports multi-voice notation with hands (stems up) and feet (stems down).
 */

import { GrooveData, DrumVoice, StickingValue, getFlattenedNotes } from '../types';
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

/** Valid sticking values for annotation validation (T-02-05) */
const VALID_STICKING_VALUES = new Set<StickingValue>(['L', 'R', 'L/R', null]);

/**
 * Return the ABC annotation prefix for a sticking value, or empty string if none.
 * Validates the value before rendering (T-02-05: only L, R, L/R, null allowed).
 */
function getStickingAnnotation(value: StickingValue | undefined): string {
  if (value === null || value === undefined) return '';
  // Validate: only known sticking values render annotations
  if (!VALID_STICKING_VALUES.has(value)) return '';
  return `^"${value}"`;
}

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
 * For single notes: sticking + decoration + symbol + duration (e.g., `^"R"!accent!^g2`)
 * For chords: sticking + decorations before chord, symbols inside (e.g., `^"R"!accent![^g c]2`)
 *
 * Note: When multiple notes have decorations in a chord, decorations are
 * placed before the chord bracket. This is a limitation of ABC notation.
 *
 * Sticking annotations use ABCjs text annotations (^"text") and appear above the staff.
 * Only non-null, valid sticking values produce annotations (T-02-05).
 */
function generatePositionABC(
  notes: Record<DrumVoice, boolean[]>,
  position: number,
  voiceFilter: DrumVoice[],
  durationSuffix: string,
  stickingAnnotation: string = ''
): string {
  const activeVoices = getActiveVoicesAtPosition(notes, position, voiceFilter);

  if (activeVoices.length === 0) {
    return stickingAnnotation + ABC_REST + durationSuffix;
  }

  if (activeVoices.length === 1) {
    // Single note: sticking + decoration + symbol + duration
    return stickingAnnotation + getDecoratedSymbol(activeVoices[0]) + durationSuffix;
  }

  // Multiple voices at same position: create chord
  // Collect all decorations and place them before the chord
  const decorations = activeVoices
    .map((voice) => ABC_DECORATIONS[voice] || '')
    .filter((d) => d !== '')
    .join('');

  const symbols = activeVoices.map((voice) => ABC_SYMBOLS[voice]);

  return stickingAnnotation + decorations + '[' + symbols.join('') + ']' + durationSuffix;
}

/** Number of measures per line in sheet music */
const MEASURES_PER_LINE = 3;

/**
 * Generate ABC notation for a single voice part (Hands or Feet)
 * Handles multiple measures with measure bars between them
 * Adds line breaks every MEASURES_PER_LINE measures for readability
 *
 * @param includeSticking - Whether to include sticking annotations in output.
 *   Annotations should only appear on one voice (Hands) to avoid duplication.
 */
function generateVoicePart(
  groove: GrooveData,
  voiceFilter: DrumVoice[],
  durationSuffix: string,
  includeSticking: boolean = false
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

      // Resolve sticking annotation for this position (D-06).
      // Sticking is global per subdivision — render only on the Hands voice to avoid duplication.
      // If sticking array exists and has the right length, read the value; otherwise skip.
      let stickingAnnotation = '';
      if (includeSticking) {
        const stickingValue: StickingValue | undefined =
          measure.sticking && measure.sticking.length === notesPerMeasure
            ? measure.sticking[i]
            : undefined;
        stickingAnnotation = getStickingAnnotation(stickingValue);
      }

      const abc = generatePositionABC(measure.notes, i, voiceFilter, durationSuffix, stickingAnnotation);
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

  // Hands voice (stems up) — sticking annotations rendered here only to avoid duplication
  lines.push('V:Hands stem=up');
  lines.push('%%voicemap drum');
  lines.push(generateVoicePart(groove, HANDS_VOICES, durationSuffix, /* includeSticking */ true));

  // Feet voice (stems down) — no sticking annotations (already shown on Hands voice)
  lines.push('V:Feet stem=down');
  lines.push('%%voicemap drum');
  lines.push(generateVoicePart(groove, FEET_VOICES, durationSuffix, /* includeSticking */ false));

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

