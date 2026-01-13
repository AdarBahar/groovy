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
  createEmptyNotesRecord,
  getFlattenedNotes,
} from '../types';
import { URL_TAB_CHARS } from './ABCConstants';

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
  // Metadata
  TITLE: 'Title',
  AUTHOR: 'Author',
  COMMENTS: 'Comments',
} as const;

/** Rest character in URL patterns */
const REST_CHAR = '-';

/** Measure separator in URL patterns */
const MEASURE_SEP = '|';

/**
 * Map of URL param keys to their associated DrumVoice groups
 * Each group is ordered by priority (first match wins when decoding)
 */
const VOICE_GROUPS: Record<string, DrumVoice[]> = {
  [PARAM.HIHAT]: ['hihat-closed', 'hihat-open', 'hihat-accent', 'hihat-foot', 'hihat-metronome-normal', 'hihat-metronome-accent', 'hihat-cross'],
  [PARAM.SNARE]: ['snare-normal', 'snare-accent', 'snare-ghost', 'snare-cross-stick', 'snare-flam', 'snare-rim', 'snare-drag', 'snare-buzz'],
  [PARAM.KICK]: ['kick'],
  [PARAM.TOM1]: ['tom-rack'],
  [PARAM.TOM2]: ['tom-floor'],
  [PARAM.TOM3]: ['tom-10'],
  [PARAM.TOM4]: ['tom-16'],
  [PARAM.CRASH]: ['crash'],
  [PARAM.RIDE]: ['ride', 'ride-bell'],
};

/**
 * Reverse lookup: DrumVoice → URL param key
 */
const VOICE_TO_PARAM: Record<DrumVoice, string> = {} as Record<DrumVoice, string>;
for (const [param, voices] of Object.entries(VOICE_GROUPS)) {
  for (const voice of voices) {
    VOICE_TO_PARAM[voice] = param;
  }
}

/**
 * Encode a single voice group to URL pattern string
 * Encodes all measures with | separators
 */
function encodeVoicePattern(groove: GrooveData, voices: DrumVoice[]): string {
  // Guard against empty voices array
  if (voices.length === 0) {
    return '';
  }

  const parts: string[] = [];
  const firstVoice = voices[0];

  for (const measure of groove.measures) {
    const measureNotes = measure.notes;
    const notesPerMeasure = measureNotes[firstVoice]?.length ?? 16;
    const pattern: string[] = [];

    for (let i = 0; i < notesPerMeasure; i++) {
      let char = REST_CHAR;
      // Check each voice in priority order
      for (const voice of voices) {
        if (measureNotes[voice]?.[i]) {
          char = URL_TAB_CHARS[voice] || REST_CHAR;
          break;
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
    if (char !== REST_CHAR) {
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

  return params.toString();
}

/**
 * Parse time signature string (e.g., "4/4") to TimeSignature
 */
function parseTimeSignature(str: string): TimeSignature {
  const [beats, noteValue] = str.split('/').map(Number);
  if (isNaN(beats) || isNaN(noteValue)) {
    return { beats: 4, noteValue: 4 };
  }
  return { beats, noteValue: noteValue as 4 | 8 | 16 };
}

/**
 * Decode URL search params to GrooveData
 */
export function decodeURLToGroove(urlOrParams: string | URLSearchParams): GrooveData {
  const params = typeof urlOrParams === 'string'
    ? new URLSearchParams(urlOrParams.startsWith('?') ? urlOrParams.slice(1) : urlOrParams)
    : urlOrParams;

  // Parse basic params
  const timeSig = params.get(PARAM.TIME_SIG) || '4/4';
  const timeSignature = parseTimeSignature(timeSig);

  const divParam = params.get(PARAM.DIV);
  const division = (divParam ? parseInt(divParam, 10) : 16) as Division;

  const tempoParam = params.get(PARAM.TEMPO);
  const tempo = tempoParam ? parseInt(tempoParam, 10) : 120;

  const swingParam = params.get(PARAM.SWING);
  const swing = swingParam ? parseInt(swingParam, 10) : 0;

  const measuresParam = params.get(PARAM.MEASURES);
  const numMeasures = measuresParam ? parseInt(measuresParam, 10) : 1;

  // Parse metadata
  const title = params.get(PARAM.TITLE) || undefined;
  const author = params.get(PARAM.AUTHOR) || undefined;
  const comments = params.get(PARAM.COMMENTS) || undefined;

  // Calculate notes per measure: (division / noteValue) * beats
  // e.g., 4/4 with 16ths: (16/4) * 4 = 16
  const notesPerMeasure = (division / timeSignature.noteValue) * timeSignature.beats;

  // Start with empty notes for each measure
  const measures: { notes: Record<DrumVoice, boolean[]> }[] = [];
  for (let m = 0; m < numMeasures; m++) {
    measures.push({ notes: createEmptyNotesRecord(notesPerMeasure) });
  }

  // Decode voice patterns
  for (const [param, voices] of Object.entries(VOICE_GROUPS)) {
    const pattern = params.get(param);
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
export function getShareableURL(groove: GrooveData, baseURL?: string): string {
  // Use provided baseURL, or construct from origin + Vite's BASE_URL
  // import.meta.env.BASE_URL is set by Vite based on the 'base' config:
  // - Development: '/'
  // - Production: '/scribe/' (or whatever PRODUCTION_BASE_PATH is set to)
  const base = baseURL || window.location.origin + (import.meta.env.BASE_URL || '/');
  const params = encodeGrooveToURL(groove);
  return `${base}?${params}`;
}

/**
 * Get shareable URL with validation
 * Returns the URL along with validation status
 */
export function getShareableURLWithValidation(
  groove: GrooveData,
  baseURL?: string
): { url: string; validation: URLValidationResult } {
  const url = getShareableURL(groove, baseURL);
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
};

