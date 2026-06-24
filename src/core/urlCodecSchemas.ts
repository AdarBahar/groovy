/**
 * Zod validation schemas and shared constants for GrooveURLCodec.
 * Extracted to keep GrooveURLCodec.ts focused on encode/decode logic.
 */

import { z } from 'zod';
import { Division } from '../types';

export const VALIDATION = {
  TEMPO: { MIN: 20, MAX: 400, DEFAULT: 120 },
  SWING: { MIN: 0, MAX: 100, DEFAULT: 0 },
  MEASURES: { MIN: 1, MAX: 32, DEFAULT: 1 },
  BEATS: { MIN: 1, MAX: 16, DEFAULT: 4 },
  TITLE_MAX_LENGTH: 200,
  AUTHOR_MAX_LENGTH: 100,
  COMMENTS_MAX_LENGTH: 1000,
  PATTERN_MAX_LENGTH: 2000,
  STICKING_MAX_LENGTH: 600,
} as const;

/** Valid divisions - matches Division type in types.ts */
export const VALID_DIVISIONS = [4, 8, 12, 16, 24, 32, 48] as const;
export const VALID_NOTE_VALUES = [4, 8, 16] as const;

/** Rest character in URL patterns */
export const REST_CHAR = '-';

/** Measure separator in URL patterns */
export const MEASURE_SEP = '|';

export const timeSignatureSchema = z.string()
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

export const divisionSchema = z.coerce.number()
  .refine(
    (n) => VALID_DIVISIONS.includes(n as Division),
    { message: `Division must be one of: ${VALID_DIVISIONS.join(', ')}` }
  )
  .transform((n) => n as Division);

export const tempoSchema = z.coerce.number()
  .min(VALIDATION.TEMPO.MIN, `Tempo must be at least ${VALIDATION.TEMPO.MIN}`)
  .max(VALIDATION.TEMPO.MAX, `Tempo must be at most ${VALIDATION.TEMPO.MAX}`)
  .default(VALIDATION.TEMPO.DEFAULT);

export const swingSchema = z.coerce.number()
  .min(VALIDATION.SWING.MIN, `Swing must be at least ${VALIDATION.SWING.MIN}`)
  .max(VALIDATION.SWING.MAX, `Swing must be at most ${VALIDATION.SWING.MAX}`)
  .default(VALIDATION.SWING.DEFAULT);

export const measuresSchema = z.coerce.number()
  .min(VALIDATION.MEASURES.MIN, `Measures must be at least ${VALIDATION.MEASURES.MIN}`)
  .max(VALIDATION.MEASURES.MAX, `Measures must be at most ${VALIDATION.MEASURES.MAX}`)
  .default(VALIDATION.MEASURES.DEFAULT);

export const titleSchema = z.string()
  .max(VALIDATION.TITLE_MAX_LENGTH, `Title must be at most ${VALIDATION.TITLE_MAX_LENGTH} characters`)
  .optional();

export const authorSchema = z.string()
  .max(VALIDATION.AUTHOR_MAX_LENGTH, `Author must be at most ${VALIDATION.AUTHOR_MAX_LENGTH} characters`)
  .optional();

export const commentsSchema = z.string()
  .max(VALIDATION.COMMENTS_MAX_LENGTH, `Comments must be at most ${VALIDATION.COMMENTS_MAX_LENGTH} characters`)
  .optional();

export const patternSchema = z.string()
  .max(VALIDATION.PATTERN_MAX_LENGTH, `Pattern too long`)
  .regex(/^[|a-zA-Z0-9\-+^]*$/, 'Invalid characters in pattern')
  .optional();

export const stickingParamSchema = z.string()
  .max(VALIDATION.STICKING_MAX_LENGTH, 'Sticking parameter too long')
  .regex(/^[rlb|-]*$/, 'Invalid characters in sticking parameter')
  .optional();

/**
 * Safe parse helper - returns default value on validation failure
 */
export function safeParse<T>(
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
