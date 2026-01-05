/**
 * Core type definitions for Groovy
 * These types are shared between core logic and UI
 */

export type DrumVoice = 'hihat' | 'snare' | 'kick';

export interface TimeSignature {
  beats: number;
  noteValue: 4 | 8 | 16;
}

export type Division = 4 | 8 | 16;

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
  notes: {
    hihat: boolean[];
    snare: boolean[];
    kick: boolean[];
  };
}

export const DEFAULT_GROOVE: GrooveData = {
  timeSignature: { beats: 4, noteValue: 4 },
  division: 16,
  tempo: 120,
  swing: 0,
  notes: {
    hihat: [true, false, true, false, true, false, true, false, 
            true, false, true, false, true, false, true, false],
    snare: [false, false, false, false, true, false, false, false,
            false, false, false, false, true, false, false, false],
    kick: [true, false, false, false, false, false, false, false,
           true, false, false, false, false, false, false, false],
  }
};

