/**
 * GrooveURLCodec
 *
 * Encodes and decodes GrooveData to/from URL parameters.
 * Compatible with GrooveScribe URL format.
 *
 * URL Format:
 * ?TimeSig=4/4&Div=16&Tempo=120&Measures=1&H=|x-x-x-x-|&S=|----o---|&K=|o-------|
 */

import {
  GrooveData,
  DrumVoice,
  Division,
  TimeSignature,
  StickingValue,
  createEmptyNotesRecord,
  getFlattenedNotes,
} from '../types';
import { URL_TAB_CHARS, URL_VOICE_GROUPS } from './DrumVoiceConfig';
import {
  VALIDATION,
  MEASURE_SEP,
  REST_CHAR,
  timeSignatureSchema,
  divisionSchema,
  tempoSchema,
  swingSchema,
  measuresSchema,
  titleSchema,
  authorSchema,
  commentsSchema,
  patternSchema,
  stickingParamSchema,
  safeParse,
} from './urlCodecSchemas';
import { encodeStickingPattern, decodeStickingPattern } from './stickingCodec';

/** URL parameter names */
const PARAM = {
  TIME_SIG: 'TimeSig',
  DIV: 'Div',
  TEMPO: 'Tempo',
  MEASURES: 'Measures',
  SWING: 'Swing',
  // Voice patterns
  HIHAT: 'H',
  SNARE: 'S',
  KICK: 'K',
  TOM1: 'T1',
  TOM2: 'T2',
  TOM3: 'T3',
  TOM4: 'T4',
  CRASH: 'C',
  RIDE: 'R',
  PERCUSSION: 'P',
  // Metadata
  TITLE: 'Title',
  AUTHOR: 'Author',
  COMMENTS: 'Comments',
  // Sticking (per D-08)
  STICKING: 'Stk',
} as const;

/**
 * Voice groups for URL encoding/decoding
 * Imported from centralized DrumVoiceConfig
 */
const VOICE_GROUPS = URL_VOICE_GROUPS as Record<string, DrumVoice[]>;

/**
 * Encode a single voice group to URL pattern string
 * Encodes all measures with | separators
 * Special handling for hihat group: encodes both hihat-closed and hihat-foot if present
 */
function encodeVoicePattern(groove: GrooveData, voices: DrumVoice[]): string {
  if (voices.length === 0) {
    return '';
  }

  const parts: string[] = [];
  const firstVoice = voices[0];
  const canEncodeHihatClosed = voices.includes('hihat-closed');
  const canEncodeHihatFoot = voices.includes('hihat-foot');

  for (const measure of groove.measures) {
    const measureNotes = measure.notes;
    const notesPerMeasure = measureNotes[firstVoice]?.length ?? 16;
    const pattern: string[] = [];

    for (let i = 0; i < notesPerMeasure; i++) {
      let char = REST_CHAR;

      const hasHihatClosed = canEncodeHihatClosed && measureNotes['hihat-closed']?.[i];
      const hasHihatFoot = canEncodeHihatFoot && measureNotes['hihat-foot']?.[i];

      // Special case: hihat group with both closed and foot at same position.
      if (hasHihatClosed && hasHihatFoot) {
        char = '^';
      } else {
        for (const voice of voices) {
          if (measureNotes[voice]?.[i]) {
            char = URL_TAB_CHARS[voice] || REST_CHAR;
            break;
          }
        }
      }
      pattern.push(char);
    }

    parts.push(pattern.join(''));
  }

  return MEASURE_SEP + parts.join(MEASURE_SEP) + MEASURE_SEP;
}

/**
 * Decode URL pattern string to voice states
 * Special handling: '^' represents both hihat-closed and hihat-foot at same position
 */
function decodeVoicePattern(
  pattern: string,
  voices: DrumVoice[],
  notesPerMeasure: number
): Partial<Record<DrumVoice, boolean[]>> {
  const chars = pattern.replace(/\|/g, '').split('');
  const result: Partial<Record<DrumVoice, boolean[]>> = {};

  for (const voice of voices) {
    result[voice] = Array(notesPerMeasure).fill(false);
  }

  const charToVoice: Record<string, DrumVoice> = {};
  for (const voice of voices) {
    const char = URL_TAB_CHARS[voice];
    if (char && !charToVoice[char]) {
      charToVoice[char] = voice;
    }
  }

  for (let i = 0; i < Math.min(chars.length, notesPerMeasure); i++) {
    const char = chars[i];
    if (char === '^') {
      if (result['hihat-closed']) result['hihat-closed']![i] = true;
      if (result['hihat-foot']) result['hihat-foot']![i] = true;
    } else if (char !== REST_CHAR) {
      const voice = charToVoice[char];
      if (voice && result[voice]) {
        result[voice]![i] = true;
      }
    }
  }

  return result;
}

/**
 * Encode GrooveData to URL search params string
 */
export function encodeGrooveToURL(groove: GrooveData): string {
  const params = new URLSearchParams();

  params.set(PARAM.TIME_SIG, `${groove.timeSignature.beats}/${groove.timeSignature.noteValue}`);
  params.set(PARAM.DIV, String(groove.division));
  params.set(PARAM.TEMPO, String(groove.tempo));
  params.set(PARAM.MEASURES, String(groove.measures.length));

  if (groove.swing > 0) {
    params.set(PARAM.SWING, String(groove.swing));
  }

  if (groove.title) params.set(PARAM.TITLE, groove.title);
  if (groove.author) params.set(PARAM.AUTHOR, groove.author);
  if (groove.comments) params.set(PARAM.COMMENTS, groove.comments);

  const flatNotes = getFlattenedNotes(groove);

  for (const [param, voices] of Object.entries(VOICE_GROUPS)) {
    const hasNotes = voices.some((v: DrumVoice) => flatNotes[v]?.some((n: boolean) => n));
    if (hasNotes) {
      params.set(param, encodeVoicePattern(groove, voices));
    }
  }

  const stickingEncoded = encodeStickingPattern(groove);
  if (stickingEncoded !== null) {
    params.set(PARAM.STICKING, stickingEncoded);
  }

  return params.toString();
}

/**
 * Decode URL search params to GrooveData
 * All parameters are validated and sanitized using Zod schemas.
 * Invalid values fall back to safe defaults.
 */
export function decodeURLToGroove(urlOrParams: string | URLSearchParams): GrooveData {
  const params = typeof urlOrParams === 'string'
    ? new URLSearchParams(urlOrParams.startsWith('?') ? urlOrParams.slice(1) : urlOrParams)
    : urlOrParams;

  const timeSigResult = timeSignatureSchema.safeParse(params.get(PARAM.TIME_SIG) || '4/4');
  const timeSignature: TimeSignature = timeSigResult.success
    ? { beats: timeSigResult.data.beats, noteValue: timeSigResult.data.noteValue as 4 | 8 | 16 }
    : { beats: 4, noteValue: 4 };

  const division = safeParse(divisionSchema, params.get(PARAM.DIV), 16 as Division);
  const tempo = safeParse(tempoSchema, params.get(PARAM.TEMPO), VALIDATION.TEMPO.DEFAULT);
  const swing = safeParse(swingSchema, params.get(PARAM.SWING), VALIDATION.SWING.DEFAULT);
  const numMeasures = safeParse(measuresSchema, params.get(PARAM.MEASURES), VALIDATION.MEASURES.DEFAULT);

  const title = safeParse(titleSchema, params.get(PARAM.TITLE), undefined);
  const author = safeParse(authorSchema, params.get(PARAM.AUTHOR), undefined);
  const comments = safeParse(commentsSchema, params.get(PARAM.COMMENTS), undefined);

  // Calculate notes per measure: (division / noteValue) * beats
  // e.g., 4/4 with 16ths: (16/4) * 4 = 16
  const notesPerMeasure = (division / timeSignature.noteValue) * timeSignature.beats;

  const measures: { notes: Record<DrumVoice, boolean[]>; sticking?: StickingValue[] }[] = [];
  for (let m = 0; m < numMeasures; m++) {
    measures.push({ notes: createEmptyNotesRecord(notesPerMeasure) });
  }

  for (const [param, voices] of Object.entries(VOICE_GROUPS)) {
    const rawPattern = params.get(param);
    const pattern = safeParse(patternSchema, rawPattern, undefined);
    if (pattern) {
      // Trim exactly one leading/trailing MEASURE_SEP then split without filtering empties,
      // so that a future empty-middle-measure segment keeps its positional index (C8).
      const trimmed = pattern.startsWith(MEASURE_SEP) ? pattern.slice(1) : pattern;
      const trimmed2 = trimmed.endsWith(MEASURE_SEP) ? trimmed.slice(0, -1) : trimmed;
      const measurePatterns = trimmed2.split(MEASURE_SEP);

      for (let m = 0; m < Math.min(measurePatterns.length, numMeasures); m++) {
        const decoded = decodeVoicePattern(
          MEASURE_SEP + measurePatterns[m] + MEASURE_SEP,
          voices,
          notesPerMeasure
        );
        for (const [voice, values] of Object.entries(decoded)) {
          if (values) {
            measures[m].notes[voice as DrumVoice] = values;
          }
        }
      }
    }
  }

  // Decode sticking (per D-08): validate and apply per-measure sticking arrays (T-02-07)
  const rawSticking = params.get(PARAM.STICKING);
  const validatedSticking = safeParse(stickingParamSchema, rawSticking, undefined);
  if (validatedSticking) {
    const decodedSticking = decodeStickingPattern(validatedSticking, numMeasures, notesPerMeasure);
    for (let m = 0; m < numMeasures; m++) {
      if (decodedSticking[m]) {
        measures[m].sticking = decodedSticking[m];
      }
    }
  }

  return {
    timeSignature,
    division,
    tempo,
    swing,
    measures,
    title,
    author,
    comments,
  };
}

/**
 * URL length limits and thresholds
 * - Most browsers support 2000+ characters
 * - Safe limit for broad compatibility: 2000 chars
 * - Warning threshold: 1500 chars (use compression)
 * - Error threshold: 8000 chars (likely to fail)
 */
export const URL_LENGTH_LIMITS = {
  SAFE: 2000,
  WARNING: 1500,
  MAX: 8000,
} as const;

export type URLValidationResult = {
  isValid: boolean;
  length: number;
  status: 'ok' | 'warning' | 'error';
  message?: string;
};

/**
 * Validate URL length and return status
 */
export function validateURLLength(url: string): URLValidationResult {
  const length = url.length;

  if (length <= URL_LENGTH_LIMITS.WARNING) {
    return { isValid: true, length, status: 'ok' };
  }

  if (length <= URL_LENGTH_LIMITS.SAFE) {
    return {
      isValid: true,
      length,
      status: 'warning',
      message: `URL is ${length} characters. Some browsers may have issues with long URLs.`,
    };
  }

  if (length <= URL_LENGTH_LIMITS.MAX) {
    return {
      isValid: true,
      length,
      status: 'warning',
      message: `URL is ${length} characters. This may not work in all browsers. Consider simplifying the groove.`,
    };
  }

  return {
    isValid: false,
    length,
    status: 'error',
    message: `URL is ${length} characters, which exceeds the maximum of ${URL_LENGTH_LIMITS.MAX}. Please simplify the groove or reduce the number of measures.`,
  };
}

/**
 * Get full URL with groove encoded as query params
 *
 * Uses import.meta.env.BASE_URL to ensure the correct base path is used
 * in production deployments (e.g., /scribe/ or /groovy/).
 */
export function getShareableURL(groove: GrooveData, baseURL?: string, mode: 'embed' | 'editor' = 'embed'): string {
  const base = baseURL || window.location.origin + (import.meta.env.BASE_URL || '/');
  const params = encodeGrooveToURL(groove);
  const url = `${base}?${params}`;
  return mode === 'embed' ? `${url}&embed=true` : url;
}

/**
 * Get shareable URL with validation
 */
export function getShareableURLWithValidation(
  groove: GrooveData,
  baseURL?: string,
  mode: 'embed' | 'editor' = 'embed'
): { url: string; validation: URLValidationResult } {
  const url = getShareableURL(groove, baseURL, mode);
  const validation = validateURLLength(url);
  return { url, validation };
}

/**
 * Check if a groove can be safely shared via URL
 */
export function canShareGroove(groove: GrooveData): URLValidationResult {
  const url = getShareableURL(groove);
  return validateURLLength(url);
}

/**
 * Check if URL has groove params
 */
export function hasGrooveParams(urlOrParams: string | URLSearchParams): boolean {
  const params = typeof urlOrParams === 'string'
    ? new URLSearchParams(urlOrParams.startsWith('?') ? urlOrParams.slice(1) : urlOrParams)
    : urlOrParams;

  return params.has(PARAM.TIME_SIG) || params.has(PARAM.DIV) ||
         params.has(PARAM.HIHAT) || params.has(PARAM.SNARE) || params.has(PARAM.KICK);
}

// Export namespace for convenience
export const GrooveURLCodec = {
  encode: encodeGrooveToURL,
  decode: decodeURLToGroove,
  getShareableURL,
  getShareableURLWithValidation,
  canShareGroove,
  validateURLLength,
  hasGrooveParams,
  URL_LENGTH_LIMITS,
  VALIDATION,
};
