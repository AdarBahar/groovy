/**
 * Core type definitions for Groovy
 * These types are shared between core logic and UI
 */

import { z } from 'zod';

export type DrumVoice =
  // Hi-Hat variations
  | 'hihat-closed'
  | 'hihat-open'
  | 'hihat-accent'
  | 'hihat-foot'
  | 'hihat-metronome-normal'
  | 'hihat-metronome-accent'
  | 'hihat-cross'
  // Snare variations
  | 'snare-normal'
  | 'snare-accent'
  | 'snare-ghost'
  | 'snare-cross-stick'
  | 'snare-flam'
  | 'snare-rim'
  | 'snare-drag'
  | 'snare-buzz'
  // Kick
  | 'kick'
  // Toms
  | 'tom-rack'
  | 'tom-floor'
  | 'tom-10'
  | 'tom-16'
  // Cymbals
  | 'crash'
  | 'ride'
  | 'ride-bell'
  // Percussion
  | 'cowbell'
  | 'stacker';

export interface TimeSignature {
  beats: number;      // 2-15 supported
  noteValue: 4 | 8 | 16;
}

export type Division = 4 | 8 | 12 | 16 | 24 | 32 | 48;

export type DivisionType = 'straight' | 'triplet';

export interface DivisionInfo {
  value: Division;
  type: DivisionType;
  label: string;
  notesPerMeasure: number;
  supportsSwing: boolean;
}

export interface Note {
  voice: DrumVoice;
  position: number; // 0-based position in the measure
  velocity: number; // 0-127
}

/** Maximum number of measures allowed */
export const MAX_MEASURES = 16;

/** All drum voices for iteration */
export const ALL_DRUM_VOICES: DrumVoice[] = [
  'hihat-closed', 'hihat-open', 'hihat-accent', 'hihat-foot',
  'hihat-metronome-normal', 'hihat-metronome-accent', 'hihat-cross',
  'snare-normal', 'snare-accent', 'snare-ghost', 'snare-cross-stick',
  'snare-flam', 'snare-rim', 'snare-drag', 'snare-buzz',
  'kick',
  'tom-rack', 'tom-floor', 'tom-10', 'tom-16',
  'crash', 'ride', 'ride-bell',
  'cowbell', 'stacker',
];

/**
 * Configuration for a single measure
 * Each measure can have its own time signature (override) and notes
 */
export interface MeasureConfig {
  /** Time signature for this measure (if different from global) */
  timeSignature?: TimeSignature;
  /** Notes for each voice in this measure */
  notes: Record<DrumVoice, boolean[]>;
}

/**
 * Main groove data structure
 * Supports multiple measures with optional per-measure time signature overrides
 */
export interface GrooveData {
  /** Default time signature (used when measure doesn't override) */
  timeSignature: TimeSignature;
  /** Division (note density) - shared across all measures */
  division: Division;
  /** Tempo in BPM */
  tempo: number;
  /** Swing percentage (0-100) */
  swing: number;
  /** Array of measures (1 to MAX_MEASURES) */
  measures: MeasureConfig[];
  /** Groove title (optional, for sharing/saving) */
  title?: string;
  /** Author name (optional, for sharing/saving) */
  author?: string;
  /** Comments/notes about the groove (optional) */
  comments?: string;
}

/** Create empty notes record for all voices */
export function createEmptyNotesRecord(length: number): Record<DrumVoice, boolean[]> {
  const notes: Partial<Record<DrumVoice, boolean[]>> = {};
  for (const voice of ALL_DRUM_VOICES) {
    notes[voice] = Array(length).fill(false);
  }
  return notes as Record<DrumVoice, boolean[]>;
}

/** Create an empty measure with given time signature and division */
export function createEmptyMeasure(
  division: Division,
  timeSignature: TimeSignature,
  overrideTimeSignature?: TimeSignature
): MeasureConfig {
  const ts = overrideTimeSignature || timeSignature;
  const notesPerMeasure = (division / ts.noteValue) * ts.beats;
  return {
    timeSignature: overrideTimeSignature,
    notes: createEmptyNotesRecord(notesPerMeasure),
  };
}

/** Create default notes for a measure (basic rock pattern) */
function createDefaultMeasureNotes(): Record<DrumVoice, boolean[]> {
  const notes = createEmptyNotesRecord(8);
  // Hi-hat on all 8th notes
  notes['hihat-closed'] = [true, true, true, true, true, true, true, true];
  // Snare on beats 2 and 4
  notes['snare-normal'] = [false, false, true, false, false, false, true, false];
  // Kick on beats 1 and 3
  notes['kick'] = [true, false, false, false, true, false, false, false];
  return notes;
}

export const DEFAULT_GROOVE: GrooveData = {
  timeSignature: { beats: 4, noteValue: 4 },
  division: 8,
  tempo: 120,
  swing: 0,
  measures: [
    {
      // First measure uses default time signature (no override)
      notes: createDefaultMeasureNotes(),
    },
  ],
};

/**
 * Get flattened notes across all measures for backward compatibility
 * Concatenates notes from all measures into a single array per voice
 */
export function getFlattenedNotes(groove: GrooveData): Record<DrumVoice, boolean[]> {
  const result: Partial<Record<DrumVoice, boolean[]>> = {};

  for (const voice of ALL_DRUM_VOICES) {
    const allNotes: boolean[] = [];
    for (const measure of groove.measures) {
      const measureNotes = measure.notes[voice] || [];
      allNotes.push(...measureNotes);
    }
    result[voice] = allNotes;
  }

  return result as Record<DrumVoice, boolean[]>;
}

/**
 * Get notes for a specific measure (convenience accessor)
 */
export function getMeasureNotes(
  groove: GrooveData,
  measureIndex: number
): Record<DrumVoice, boolean[]> | undefined {
  return groove.measures[measureIndex]?.notes;
}

/**
 * Create a measure config from a notes record
 */
export function createMeasureFromNotes(
  notes: Record<DrumVoice, boolean[]>,
  timeSignature?: TimeSignature
): MeasureConfig {
  return {
    timeSignature,
    notes,
  };
}

/**
 * Auto Speed Up Configuration
 * Settings for automatic tempo increase during practice
 */
export interface AutoSpeedUpConfig {
  /** BPM increase per interval (1-20, default 5) */
  stepBpm: number;
  /** Interval in minutes between increases (1-10, default 2) */
  intervalMinutes: number;
  /** Keep increasing indefinitely or stop after one step */
  keepGoing: boolean;
}

/**
 * Auto Speed Up State
 * Runtime state for auto speed up feature
 */
export interface AutoSpeedUpState {
  /** Whether auto speed up is currently active */
  isActive: boolean;
  /** Starting tempo when auto speed up began */
  baseTempo: number;
  /** Total BPM increased so far */
  totalIncreased: number;
  /** Timestamp of next tempo increase (ms since epoch) */
  nextIncreaseAt: number | null;
  /** Time remaining until next increase (ms) */
  timeRemaining: number;
}

/** Default auto speed up configuration */
export const DEFAULT_AUTO_SPEED_UP_CONFIG: AutoSpeedUpConfig = {
  stepBpm: 5,
  intervalMinutes: 2,
  keepGoing: true,
};

/** Minimum and maximum tempo bounds */
export const MIN_TEMPO = 30;
export const MAX_TEMPO = 300;

/**
 * Metronome frequency (clicks per measure)
 * 0 = off, 4 = quarter notes, 8 = eighth notes, 16 = sixteenth notes
 */
export type MetronomeFrequency = 0 | 4 | 8 | 16;

/**
 * Metronome offset click position
 * Determines where the click falls relative to the beat
 * - '1': On the beat (default)
 * - 'E': On the "e" of "1 e & a" (second 16th)
 * - 'AND': On the "&" (second 8th)
 * - 'A': On the "a" (fourth 16th)
 * - 'TI': Triplet offset (second note of triplet)
 * - 'TA': Triplet offset (third note of triplet)
 * - 'ROTATE': Cycle through offsets on each loop
 */
export type MetronomeOffsetClick = '1' | 'E' | 'AND' | 'A' | 'TI' | 'TA' | 'ROTATE';

/**
 * Metronome configuration
 */
export interface MetronomeConfig {
  /** Metronome frequency (0 = off, 4/8/16 = subdivisions) */
  frequency: MetronomeFrequency;
  /** Solo mode: mute groove notes, play only metronome */
  solo: boolean;
  /** Count-in: play one bar of metronome before groove starts */
  countIn: boolean;
  /** Offset click position */
  offsetClick: MetronomeOffsetClick;
  /** Volume (0-100) */
  volume: number;
}

/** Default metronome configuration */
export const DEFAULT_METRONOME_CONFIG: MetronomeConfig = {
  frequency: 0,
  solo: false,
  countIn: false,
  offsetClick: '1',
  volume: 80,
};

// ==========================================================================
// Zod Schemas for Runtime Validation
// ==========================================================================

/** All valid drum voices as an array for Zod enum */
const DRUM_VOICE_VALUES = [
  'hihat-closed', 'hihat-open', 'hihat-accent', 'hihat-foot',
  'hihat-metronome-normal', 'hihat-metronome-accent', 'hihat-cross',
  'snare-normal', 'snare-accent', 'snare-ghost', 'snare-cross-stick',
  'snare-flam', 'snare-rim', 'snare-drag', 'snare-buzz',
  'kick',
  'tom-rack', 'tom-floor', 'tom-10', 'tom-16',
  'crash', 'ride', 'ride-bell',
  'cowbell', 'stacker',
] as const;

/** Zod schema for DrumVoice */
export const DrumVoiceSchema = z.enum(DRUM_VOICE_VALUES);

/** Zod schema for TimeSignature */
export const TimeSignatureSchema = z.object({
  beats: z.number().int().min(1).max(16),
  noteValue: z.union([z.literal(4), z.literal(8), z.literal(16)]),
});

/** Zod schema for Division */
export const DivisionSchema = z.union([
  z.literal(4),
  z.literal(8),
  z.literal(12),
  z.literal(16),
  z.literal(24),
  z.literal(32),
  z.literal(48),
]);

/** Zod schema for notes record (voice -> boolean array) */
const NotesRecordSchema = z.record(
  DrumVoiceSchema,
  z.array(z.boolean())
);

/** Zod schema for MeasureConfig */
export const MeasureConfigSchema = z.object({
  timeSignature: TimeSignatureSchema.optional(),
  notes: NotesRecordSchema,
});

/** Zod schema for GrooveData */
export const GrooveDataSchema = z.object({
  timeSignature: TimeSignatureSchema,
  division: DivisionSchema,
  tempo: z.number().min(MIN_TEMPO).max(MAX_TEMPO),
  swing: z.number().min(0).max(100),
  measures: z.array(MeasureConfigSchema).min(1).max(MAX_MEASURES),
  title: z.string().max(200).optional(),
  author: z.string().max(100).optional(),
  comments: z.string().max(1000).optional(),
});

/** Type inferred from GrooveDataSchema for runtime-validated data */
export type ValidatedGrooveData = z.infer<typeof GrooveDataSchema>;

/**
 * Validate GrooveData at runtime
 * Returns the validated data or null if invalid
 */
export function validateGrooveData(data: unknown): GrooveData | null {
  const result = GrooveDataSchema.safeParse(data);
  if (result.success) {
    return result.data as GrooveData;
  }
  return null;
}

/**
 * Validate GrooveData and return detailed errors
 */
export function validateGrooveDataWithErrors(data: unknown): {
  success: boolean;
  data?: GrooveData;
  errors?: z.ZodError;
} {
  const result = GrooveDataSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data as GrooveData };
  }
  return { success: false, errors: result.error };
}

