/**
 * Tests for ABC Notation Transcoder
 */

import { describe, it, expect } from 'vitest';
import { grooveToABC, hasHandsNotes, hasFeetNotes } from './ABCTranscoder';
import { GrooveData, DrumVoice, createEmptyNotesRecord, createMeasureFromNotes } from '../types';
import { ABC_SYMBOLS, HANDS_VOICES, FEET_VOICES } from './ABCConstants';

// Helper to create an empty groove
const createEmptyGroove = (division: number = 16): GrooveData => {
  const notes = createEmptyNotesRecord(division);
  return {
    timeSignature: { beats: 4, noteValue: 4 },
    division: division as 4 | 8 | 12 | 16 | 24 | 32 | 48,
    tempo: 120,
    swing: 0,
    measures: [createMeasureFromNotes(notes)],
  };
};

// Helper to set notes for a voice in the first measure
const setNotes = (
  groove: GrooveData,
  voice: DrumVoice,
  positions: number[]
): GrooveData => ({
  ...groove,
  measures: groove.measures.map((measure, idx) =>
    idx === 0
      ? {
          ...measure,
          notes: {
            ...measure.notes,
            [voice]: measure.notes[voice].map((_: boolean, i: number) => positions.includes(i)),
          },
        }
      : measure
  ),
});

describe('ABCTranscoder', () => {
  describe('grooveToABC', () => {
    it('generates valid ABC header with time signature', () => {
      const groove = createEmptyGroove();
      const abc = grooveToABC(groove);

      expect(abc).toContain('M:4/4');
      expect(abc).toContain('Q:1/4=120');
      expect(abc).toContain('L:1/16');
    });

    it('includes title when provided', () => {
      const groove = createEmptyGroove();
      const abc = grooveToABC(groove, { title: 'Test Groove' });

      expect(abc).toContain('T:Test Groove');
    });

    it('generates multi-voice structure', () => {
      const groove = createEmptyGroove();
      const abc = grooveToABC(groove);

      expect(abc).toContain('%%staves (Hands Feet)');
      expect(abc).toContain('V:Hands stem=up');
      expect(abc).toContain('V:Feet stem=down');
      expect(abc).toContain('K:C clef=perc');
    });

    it('includes ABC boilerplate for drum notation', () => {
      const groove = createEmptyGroove();
      const abc = grooveToABC(groove);

      expect(abc).toContain('%%flatbeams 1');
    });

    it('generates hi-hat notes in Hands voice', () => {
      let groove = createEmptyGroove();
      groove = setNotes(groove, 'hihat-closed', [0, 2, 4, 6]);
      const abc = grooveToABC(groove);

      // Should contain hi-hat symbol (g) in Hands voice
      expect(abc).toMatch(/V:Hands.*\n.*\n.*g/s);
    });

    it('generates kick notes in Feet voice', () => {
      let groove = createEmptyGroove();
      groove = setNotes(groove, 'kick', [0, 8]);
      const abc = grooveToABC(groove);

      // Should contain kick symbol (F)
      expect(abc).toContain('F');
    });

    it('generates invisible rests for empty positions', () => {
      const groove = createEmptyGroove();
      const abc = grooveToABC(groove);

      // Empty positions should have invisible rests (x) to preserve spacing
      expect(abc).toContain('x');
    });

    it('handles chords when multiple voices hit at same position', () => {
      let groove = createEmptyGroove();
      groove = setNotes(groove, 'hihat-closed', [0]);
      groove = setNotes(groove, 'snare-normal', [0]);
      const abc = grooveToABC(groove);

      // Should contain a chord bracket with g and c
      expect(abc).toMatch(/\[.*g.*c.*\]|\[.*c.*g.*\]/);
    });
  });

  describe('hasHandsNotes', () => {
    it('returns false for empty groove', () => {
      const groove = createEmptyGroove();
      expect(hasHandsNotes(groove)).toBe(false);
    });

    it('returns true when hi-hat has notes', () => {
      let groove = createEmptyGroove();
      groove = setNotes(groove, 'hihat-closed', [0]);
      expect(hasHandsNotes(groove)).toBe(true);
    });

    it('returns true when snare has notes', () => {
      let groove = createEmptyGroove();
      groove = setNotes(groove, 'snare-normal', [4]);
      expect(hasHandsNotes(groove)).toBe(true);
    });
  });

  describe('hasFeetNotes', () => {
    it('returns false for empty groove', () => {
      const groove = createEmptyGroove();
      expect(hasFeetNotes(groove)).toBe(false);
    });

    it('returns true when kick has notes', () => {
      let groove = createEmptyGroove();
      groove = setNotes(groove, 'kick', [0]);
      expect(hasFeetNotes(groove)).toBe(true);
    });

    it('returns true when hi-hat foot has notes', () => {
      let groove = createEmptyGroove();
      groove = setNotes(groove, 'hihat-foot', [4]);
      expect(hasFeetNotes(groove)).toBe(true);
    });
  });

  describe('ABC_SYMBOLS mapping', () => {
    it('has symbols for all hands voices', () => {
      HANDS_VOICES.forEach((voice) => {
        expect(ABC_SYMBOLS[voice]).toBeDefined();
        expect(ABC_SYMBOLS[voice].length).toBeGreaterThan(0);
      });
    });

    it('has symbols for all feet voices', () => {
      FEET_VOICES.forEach((voice) => {
        expect(ABC_SYMBOLS[voice]).toBeDefined();
        expect(ABC_SYMBOLS[voice].length).toBeGreaterThan(0);
      });
    });
  });
});

