/**
 * GrooveURLCodec
 *
 * Encodes and decodes GrooveData to/from URL parameters.
 * Compatible with GrooveScribe URL format.
 *
 * URL Format:
 * ?TimeSig=4/4&Div=16&Tempo=120&Measures=1&H=|x-x-x-x-|&S=|----o---|&K=|o-------|
 */

import { z } from 'zod';
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

/** Validation constraints for URL parameters */
const VALIDATION = {
  TEMPO: { MIN: 20, MAX: 400, DEFAULT: 120 },
  SWING: { MIN: 0, MAX: 100, DEFAULT: 0 },
  MEASURES: { MIN: 1, MAX: 32, DEFAULT: 1 },
  BEATS: { MIN: 1, MAX: 16, DEFAULT: 4 },
  TITLE_MAX_LENGTH: 200,
  AUTHOR_MAX_LENGTH: 100,
  COMMENTS_MAX_LENGTH: 1000,
  PATTERN_MAX_LENGTH: 2000,
  STICKING_MAX_LENGTH: 600, // 16 measures * 48 subdivisions max = 768, allow some headroom
} as const;

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

/** Valid divisions - matches Division type in types.ts */
const VALID_DIVISIONS = [4, 8, 12, 16, 24, 32, 48] as const;
const VALID_NOTE_VALUES = [4, 8, 16] as const;

/** Zod schema for time signature string (e.g., "4/4") */
const timeSignatureSchema = z.string()
  .regex(/^\d{1,2}\/\d{1,2}$/, 'Invalid time signature format')
  .transform((str): { beats: number; noteValue: number } => {
    const [beats, noteValue] = str.split('/').map(Number);
    return { beats, noteValue };
  })
  .refine(
    (ts) => ts.beats >= VALIDATION.BEATS.MIN && ts.beats <= VALIDATION.BEATS.MAX,
    { message: `Beats must be between ${VALIDATION.BEATS.MIN} and ${VALIDATION.BEATS.MAX}` }
  )
  .refine(
    (ts) => VALID_NOTE_VALUES.includes(ts.noteValue as 4 | 8 | 16),
    { message: `Note value must be one of: ${VALID_NOTE_VALUES.join(', ')}` }
  );

/** Zod schema for division */
const divisionSchema = z.coerce.number()
  .refine(
    (n) => VALID_DIVISIONS.includes(n as Division),
    { message: `Division must be one of: ${VALID_DIVISIONS.join(', ')}` }
  )
  .transform((n) => n as Division);

/** Zod schema for tempo */
const tempoSchema = z.coerce.number()
  .min(VALIDATION.TEMPO.MIN, `Tempo must be at least ${VALIDATION.TEMPO.MIN}`)
  .max(VALIDATION.TEMPO.MAX, `Tempo must be at most ${VALIDATION.TEMPO.MAX}`)
  .default(VALIDATION.TEMPO.DEFAULT);

/** Zod schema for swing */
const swingSchema = z.coerce.number()
  .min(VALIDATION.SWING.MIN, `Swing must be at least ${VALIDATION.SWING.MIN}`)
  .max(VALIDATION.SWING.MAX, `Swing must be at most ${VALIDATION.SWING.MAX}`)
  .default(VALIDATION.SWING.DEFAULT);

/** Zod schema for measures count */
const measuresSchema = z.coerce.number()
  .min(VALIDATION.MEASURES.MIN, `Measures must be at least ${VALIDATION.MEASURES.MIN}`)
  .max(VALIDATION.MEASURES.MAX, `Measures must be at most ${VALIDATION.MEASURES.MAX}`)
  .default(VALIDATION.MEASURES.DEFAULT);

/** Zod schema for text fields (title, author, comments) */
const titleSchema = z.string()
  .max(VALIDATION.TITLE_MAX_LENGTH, `Title must be at most ${VALIDATION.TITLE_MAX_LENGTH} characters`)
  .optional();

const authorSchema = z.string()
  .max(VALIDATION.AUTHOR_MAX_LENGTH, `Author must be at most ${VALIDATION.AUTHOR_MAX_LENGTH} characters`)
  .optional();

const commentsSchema = z.string()
  .max(VALIDATION.COMMENTS_MAX_LENGTH, `Comments must be at most ${VALIDATION.COMMENTS_MAX_LENGTH} characters`)
  .optional();

/** Zod schema for voice patterns - validates format and length */
const patternSchema = z.string()
  .max(VALIDATION.PATTERN_MAX_LENGTH, `Pattern too long`)
  .regex(/^[|a-zA-Z0-9\-+^]*$/, 'Invalid characters in pattern')
  .optional();

/**
 * Zod schema for sticking parameter — validates character set and length (T-02-07)
 * Valid chars: 'r', 'l', 'b', '-', '|'
 */
const stickingParamSchema = z.string()
  .max(VALIDATION.STICKING_MAX_LENGTH, 'Sticking parameter too long')
  .regex(/^[rlb|-]*$/, 'Invalid characters in sticking parameter')
  .optional();

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

/** Rest character in URL patterns */
const REST_CHAR = '-';

/** Measure separator in URL patterns */
const MEASURE_SEP = '|';

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
  // Guard against empty voices array
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
      // A lone hihat-foot still falls through to its own URL char below.
      if (hasHihatClosed && hasHihatFoot) {
        char = '^'; // Combination character for both
      } else {
        // Check each voice in priority order, take first match
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
  // Remove measure separators and get characters
  const chars = pattern.replace(/\|/g, '').split('');
  const result: Partial<Record<DrumVoice, boolean[]>> = {};

  // Initialize all voices with false
  for (const voice of voices) {
    result[voice] = Array(notesPerMeasure).fill(false);
  }

  // Build reverse lookup: char → voice
  const charToVoice: Record<string, DrumVoice> = {};
  for (const voice of voices) {
    const char = URL_TAB_CHARS[voice];
    if (char && !charToVoice[char]) {
      charToVoice[char] = voice;
    }
  }

  // Decode each position
  for (let i = 0; i < Math.min(chars.length, notesPerMeasure); i++) {
    const char = chars[i];
    if (char === '^') {
      // Special combination character: both hihat-closed and hihat-foot
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
 * Encode sticking arrays from all measures into a single URL-safe string.
 * Format: |<measure1chars>|<measure2chars>|...
 * Characters: 'r'=R, 'l'=L, 'b'=L/R, '-'=null
 * Returns null if all sticking values are null (nothing to encode).
 */
function encodeStickingPattern(groove: GrooveData): string | null {
  const hasAnySticking = groove.measures.some(m =>
    m.sticking && m.sticking.some(v => v !== null)
  );
  if (!hasAnySticking) return null;

  const parts: string[] = [];
  for (const measure of groove.measures) {
    const sticking = measure.sticking;
    if (!sticking || sticking.length === 0) {
      // Determine length from notes array to produce correct-length placeholders
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
function decodeStickingPattern(
  param: string,
  numMeasures: number,
  notesPerMeasure: number
): (StickingValue[] | undefined)[] {
  const measurePatterns = param.split(MEASURE_SEP).filter(p => p.length > 0);
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
    // Only return a sticking array if it has at least one non-null value
    const hasValues = sticking.some(v => v !== null);
    result.push(hasValues ? sticking : undefined);
  }

  return result;
}

/**
 * Encode GrooveData to URL search params string
 */
export function encodeGrooveToURL(groove: GrooveData): string {
  const params = new URLSearchParams();

  // Basic params
  params.set(PARAM.TIME_SIG, `${groove.timeSignature.beats}/${groove.timeSignature.noteValue}`);
  params.set(PARAM.DIV, String(groove.division));
  params.set(PARAM.TEMPO, String(groove.tempo));
  params.set(PARAM.MEASURES, String(groove.measures.length));
  
  if (groove.swing > 0) {
    params.set(PARAM.SWING, String(groove.swing));
  }

  // Metadata (only include if non-empty)
  if (groove.title) {
    params.set(PARAM.TITLE, groove.title);
  }
  if (groove.author) {
    params.set(PARAM.AUTHOR, groove.author);
  }
  if (groove.comments) {
    params.set(PARAM.COMMENTS, groove.comments);
  }

  // Use flattened notes to check if any voice has notes
  const flatNotes = getFlattenedNotes(groove);

  // Voice patterns
  for (const [param, voices] of Object.entries(VOICE_GROUPS)) {
    const hasNotes = voices.some((v: DrumVoice) => flatNotes[v]?.some((n: boolean) => n));
    if (hasNotes) {
      params.set(param, encodeVoicePattern(groove, voices));
    }
  }

  // Sticking (per D-08): only include if any sticking values are set
  const stickingEncoded = encodeStickingPattern(groove);
  if (stickingEncoded !== null) {
    params.set(PARAM.STICKING, stickingEncoded);
  }

  return params.toString();
}

/**
 * Safe parse helper - returns default value on validation failure
 */
function safeParse<T>(
  schema: z.ZodType<T>,
  value: string | null | undefined,
  defaultValue: T
): T {
  if (value === null || value === undefined) {
    return defaultValue;
  }
  const result = schema.safeParse(value);
  return result.success ? result.data : defaultValue;
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

  // Parse and validate basic params with Zod schemas
  const timeSigResult = timeSignatureSchema.safeParse(params.get(PARAM.TIME_SIG) || '4/4');
  const timeSignature: TimeSignature = timeSigResult.success
    ? { beats: timeSigResult.data.beats, noteValue: timeSigResult.data.noteValue as 4 | 8 | 16 }
    : { beats: 4, noteValue: 4 };

  const division = safeParse(divisionSchema, params.get(PARAM.DIV), 16 as Division);
  const tempo = safeParse(tempoSchema, params.get(PARAM.TEMPO), VALIDATION.TEMPO.DEFAULT);
  const swing = safeParse(swingSchema, params.get(PARAM.SWING), VALIDATION.SWING.DEFAULT);
  const numMeasures = safeParse(measuresSchema, params.get(PARAM.MEASURES), VALIDATION.MEASURES.DEFAULT);

  // Parse and validate metadata with length limits
  const title = safeParse(titleSchema, params.get(PARAM.TITLE), undefined);
  const author = safeParse(authorSchema, params.get(PARAM.AUTHOR), undefined);
  const comments = safeParse(commentsSchema, params.get(PARAM.COMMENTS), undefined);

  // Calculate notes per measure: (division / noteValue) * beats
  // e.g., 4/4 with 16ths: (16/4) * 4 = 16
  const notesPerMeasure = (division / timeSignature.noteValue) * timeSignature.beats;

  // Start with empty notes for each measure
  const measures: { notes: Record<DrumVoice, boolean[]>; sticking?: StickingValue[] }[] = [];
  for (let m = 0; m < numMeasures; m++) {
    measures.push({ notes: createEmptyNotesRecord(notesPerMeasure) });
  }

  // Decode voice patterns with validation
  for (const [param, voices] of Object.entries(VOICE_GROUPS)) {
    const rawPattern = params.get(param);
    // Validate pattern format before processing
    const pattern = safeParse(patternSchema, rawPattern, undefined);
    if (pattern) {
      // Split pattern by measure separator (|)
      const measurePatterns = pattern.split(MEASURE_SEP).filter(p => p.length > 0);

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
  /** Safe URL length for all browsers/servers */
  SAFE: 2000,
  /** Warning threshold - consider compression */
  WARNING: 1500,
  /** Maximum before likely failure */
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
  // Use provided baseURL, or construct from origin + Vite's BASE_URL
  // import.meta.env.BASE_URL is set by Vite based on the 'base' config:
  // - Development: '/'
  // - Production: '/scribe/' (or whatever PRODUCTION_BASE_PATH is set to)
  const base = baseURL || window.location.origin + (import.meta.env.BASE_URL || '/');
  const params = encodeGrooveToURL(groove);
  const url = `${base}?${params}`;
  return mode === 'embed' ? `${url}&embed=true` : url;
}

/**
 * Get shareable URL with validation
 * Returns the URL along with validation status
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
  /** Validation constraints for URL parameters */
  VALIDATION,
};
