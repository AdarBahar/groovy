/**
 * Core type definitions for Groovy
 * These types are shared between core logic and UI
 */

export type DrumVoice =
  // Hi-Hat variations
  | 'hihat-closed'
  | 'hihat-open'
  | 'hihat-accent'
  | 'hihat-foot'
  // Snare variations
  | 'snare-normal'
  | 'snare-accent'
  | 'snare-ghost'
  | 'snare-cross-stick'
  | 'snare-flam'
  | 'snare-rim'
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

export interface GrooveData {
  timeSignature: TimeSignature;
  division: Division;
  tempo: number; // BPM
  swing: number; // 0-100 (percentage)

  // Notes for each voice (boolean array: true = hit, false = rest)
  notes: Record<DrumVoice, boolean[]>;
}

// Helper to create empty notes array
const createEmptyNotes = (division: number = 16): boolean[] =>
  Array(division).fill(false);

export const DEFAULT_GROOVE: GrooveData = {
  timeSignature: { beats: 4, noteValue: 4 },
  division: 16,
  tempo: 120,
  swing: 0,
  notes: {
    // Hi-Hat variations
    'hihat-closed': [true, false, true, false, true, false, true, false,
                     true, false, true, false, true, false, true, false],
    'hihat-open': createEmptyNotes(16),
    'hihat-accent': createEmptyNotes(16),
    'hihat-foot': createEmptyNotes(16),
    // Snare variations
    'snare-normal': [false, false, false, false, true, false, false, false,
                     false, false, false, false, true, false, false, false],
    'snare-accent': createEmptyNotes(16),
    'snare-ghost': createEmptyNotes(16),
    'snare-cross-stick': createEmptyNotes(16),
    'snare-flam': createEmptyNotes(16),
    'snare-rim': createEmptyNotes(16),
    // Kick
    'kick': [true, false, false, false, false, false, false, false,
             true, false, false, false, false, false, false, false],
    // Toms
    'tom-rack': createEmptyNotes(16),
    'tom-floor': createEmptyNotes(16),
    'tom-10': createEmptyNotes(16),
    'tom-16': createEmptyNotes(16),
    // Cymbals
    'crash': createEmptyNotes(16),
    'ride': createEmptyNotes(16),
    'ride-bell': createEmptyNotes(16),
    // Percussion
    'cowbell': createEmptyNotes(16),
    'stacker': createEmptyNotes(16),
  }
};

