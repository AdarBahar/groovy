/**
 * Sticking codec — encodes/decodes per-measure sticking arrays to/from URL-safe strings.
 * Extracted from GrooveURLCodec.ts to isolate sticking-specific logic.
 */

import { GrooveData, DrumVoice, StickingValue } from '../types';
import { MEASURE_SEP } from './urlCodecSchemas';

/**
 * Sticking encoding: maps StickingValue to a single URL-safe character.
 * null → '-', 'R' → 'r', 'L' → 'l', 'L/R' → 'b' (both)
 */
const STICKING_ENCODE: Record<string, string> = {
  'R': 'r',
  'L': 'l',
  'L/R': 'b',
};
const STICKING_DECODE: Record<string, StickingValue> = {
  'r': 'R',
  'l': 'L',
  'b': 'L/R',
};
/** Valid decoded sticking characters (excluding rest '-') */
const VALID_STICKING_CHARS = new Set(['r', 'l', 'b', '-']);

/**
 * Encode sticking arrays from all measures into a single URL-safe string.
 * Format: |<measure1chars>|<measure2chars>|...
 * Characters: 'r'=R, 'l'=L, 'b'=L/R, '-'=null
 * Returns null if all sticking values are null (nothing to encode).
 */
export function encodeStickingPattern(groove: GrooveData): string | null {
  const hasAnySticking = groove.measures.some(m =>
    m.sticking && m.sticking.some(v => v !== null)
  );
  if (!hasAnySticking) return null;

  const parts: string[] = [];
  for (const measure of groove.measures) {
    const sticking = measure.sticking;
    if (!sticking || sticking.length === 0) {
      const firstVoice = Object.keys(measure.notes)[0] as DrumVoice | undefined;
      const length = firstVoice ? (measure.notes[firstVoice]?.length ?? 0) : 0;
      parts.push('-'.repeat(length));
    } else {
      parts.push(sticking.map(v => (v !== null ? STICKING_ENCODE[v] : '-')).join(''));
    }
  }

  return MEASURE_SEP + parts.join(MEASURE_SEP) + MEASURE_SEP;
}

/**
 * Decode sticking URL parameter back to per-measure StickingValue arrays.
 * Validates each character (T-02-07). Invalid characters are treated as null.
 * Returns an array of sticking arrays (one per measure), or null if no sticking param.
 */
export function decodeStickingPattern(
  param: string,
  numMeasures: number,
  notesPerMeasure: number
): (StickingValue[] | undefined)[] {
  // Trim exactly one leading/trailing MEASURE_SEP so that empty middle measures
  // keep their positional index and don't get shifted (C8).
  const trimmed = param.startsWith(MEASURE_SEP) ? param.slice(1) : param;
  const trimmed2 = trimmed.endsWith(MEASURE_SEP) ? trimmed.slice(0, -1) : trimmed;
  const measurePatterns = trimmed2.split(MEASURE_SEP); // no .filter — preserve empty slots
  const result: (StickingValue[] | undefined)[] = [];

  for (let m = 0; m < numMeasures; m++) {
    const chars = measurePatterns[m] ?? '';
    if (chars.length === 0) {
      result.push(undefined);
      continue;
    }
    const sticking: StickingValue[] = [];
    for (let i = 0; i < notesPerMeasure; i++) {
      const ch = i < chars.length ? chars[i] : '-';
      if (!VALID_STICKING_CHARS.has(ch)) {
        // T-02-07: reject invalid sticking characters — treat as null
        sticking.push(null);
      } else {
        sticking.push(STICKING_DECODE[ch] ?? null);
      }
    }
    const hasValues = sticking.some(v => v !== null);
    result.push(hasValues ? sticking : undefined);
  }

  return result;
}
