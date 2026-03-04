/**
 * Tests for GrooveURLCodec
 */

import { describe, it, expect } from 'vitest';
import { encodeGrooveToURL, decodeURLToGroove, hasGrooveParams, getShareableURL, getShareableURLWithValidation } from './GrooveURLCodec';
import { GrooveData, DrumVoice, createEmptyNotesRecord, createMeasureFromNotes, getFlattenedNotes } from '../types';

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

describe('GrooveURLCodec', () => {
  describe('encodeGrooveToURL', () => {
    it('encodes basic params correctly', () => {
      const groove = createEmptyGroove();
      const url = encodeGrooveToURL(groove);
      
      expect(url).toContain('TimeSig=4%2F4');
      expect(url).toContain('Div=16');
      expect(url).toContain('Tempo=120');
      expect(url).toContain('Measures=1');
    });

    it('encodes swing when present', () => {
      const groove = { ...createEmptyGroove(), swing: 50 };
      const url = encodeGrooveToURL(groove);
      
      expect(url).toContain('Swing=50');
    });

    it('does not include swing when zero', () => {
      const groove = createEmptyGroove();
      const url = encodeGrooveToURL(groove);
      
      expect(url).not.toContain('Swing');
    });

    it('encodes hi-hat pattern', () => {
      let groove = createEmptyGroove();
      groove = setNotes(groove, 'hihat-closed', [0, 2, 4, 6, 8, 10, 12, 14]);
      const url = encodeGrooveToURL(groove);
      
      expect(url).toContain('H=');
      // Pattern should have x at positions 0,2,4,6,8,10,12,14
    });

    it('encodes snare pattern', () => {
      let groove = createEmptyGroove();
      groove = setNotes(groove, 'snare-normal', [4, 12]);
      const url = encodeGrooveToURL(groove);
      
      expect(url).toContain('S=');
    });

    it('encodes kick pattern', () => {
      let groove = createEmptyGroove();
      groove = setNotes(groove, 'kick', [0, 8]);
      const url = encodeGrooveToURL(groove);

      expect(url).toContain('K=');
    });

    it('encodes metadata when present', () => {
      const groove = { ...createEmptyGroove(), title: 'My Groove', author: 'Jane Doe', comments: 'A funky beat' };
      const url = encodeGrooveToURL(groove);

      expect(url).toContain('Title=My+Groove');
      expect(url).toContain('Author=Jane+Doe');
      expect(url).toContain('Comments=A+funky+beat');
    });

    it('does not include metadata when empty', () => {
      const groove = createEmptyGroove();
      const url = encodeGrooveToURL(groove);

      expect(url).not.toContain('Title');
      expect(url).not.toContain('Author');
      expect(url).not.toContain('Comments');
    });
  });

  describe('decodeURLToGroove', () => {
    it('decodes basic params correctly', () => {
      const url = 'TimeSig=4/4&Div=16&Tempo=120&Measures=1';
      const groove = decodeURLToGroove(url);
      
      expect(groove.timeSignature).toEqual({ beats: 4, noteValue: 4 });
      expect(groove.division).toBe(16);
      expect(groove.tempo).toBe(120);
    });

    it('decodes swing', () => {
      const url = 'TimeSig=4/4&Div=16&Tempo=120&Swing=50';
      const groove = decodeURLToGroove(url);
      
      expect(groove.swing).toBe(50);
    });

    it('decodes hi-hat pattern', () => {
      const url = 'TimeSig=4/4&Div=16&Tempo=120&H=|x-x-x-x-x-x-x-x-|';
      const groove = decodeURLToGroove(url);
      const notes = getFlattenedNotes(groove);

      expect(notes['hihat-closed'][0]).toBe(true);
      expect(notes['hihat-closed'][1]).toBe(false);
      expect(notes['hihat-closed'][2]).toBe(true);
    });

    it('decodes snare pattern', () => {
      const url = 'TimeSig=4/4&Div=16&Tempo=120&S=|----o-------o---|';
      const groove = decodeURLToGroove(url);
      const notes = getFlattenedNotes(groove);

      expect(notes['snare-normal'][4]).toBe(true);
      expect(notes['snare-normal'][12]).toBe(true);
    });

    it('handles URL with leading ?', () => {
      const url = '?TimeSig=4/4&Div=16&Tempo=120';
      const groove = decodeURLToGroove(url);

      expect(groove.timeSignature).toEqual({ beats: 4, noteValue: 4 });
    });

    it('decodes metadata', () => {
      const url = 'TimeSig=4/4&Div=16&Tempo=120&Title=My+Groove&Author=Jane+Doe&Comments=A+funky+beat';
      const groove = decodeURLToGroove(url);

      expect(groove.title).toBe('My Groove');
      expect(groove.author).toBe('Jane Doe');
      expect(groove.comments).toBe('A funky beat');
    });

    it('handles missing metadata gracefully', () => {
      const url = 'TimeSig=4/4&Div=16&Tempo=120';
      const groove = decodeURLToGroove(url);

      expect(groove.title).toBeUndefined();
      expect(groove.author).toBeUndefined();
      expect(groove.comments).toBeUndefined();
    });
  });

  describe('roundtrip', () => {
    it('encodes and decodes back to equivalent groove', () => {
      let original = createEmptyGroove();
      original = setNotes(original, 'hihat-closed', [0, 2, 4, 6, 8, 10, 12, 14]);
      original = setNotes(original, 'snare-normal', [4, 12]);
      original = setNotes(original, 'kick', [0, 8]);

      const encoded = encodeGrooveToURL(original);
      const decoded = decodeURLToGroove(encoded);

      const originalNotes = getFlattenedNotes(original);
      const decodedNotes = getFlattenedNotes(decoded);

      expect(decoded.timeSignature).toEqual(original.timeSignature);
      expect(decoded.division).toBe(original.division);
      expect(decoded.tempo).toBe(original.tempo);
      expect(decodedNotes['hihat-closed']).toEqual(originalNotes['hihat-closed']);
      expect(decodedNotes['snare-normal']).toEqual(originalNotes['snare-normal']);
      expect(decodedNotes['kick']).toEqual(originalNotes['kick']);
    });
  });

  describe('hasGrooveParams', () => {
    it('returns true for URL with groove params', () => {
      expect(hasGrooveParams('TimeSig=4/4')).toBe(true);
      expect(hasGrooveParams('Div=16')).toBe(true);
      expect(hasGrooveParams('H=|x-x-|')).toBe(true);
    });

    it('returns false for URL without groove params', () => {
      expect(hasGrooveParams('')).toBe(false);
      expect(hasGrooveParams('foo=bar')).toBe(false);
    });
  });

  describe('getShareableURL', () => {
    const testBaseURL = 'https://example.com/';

    it('generates embed URL by default', () => {
      const groove = createEmptyGroove();
      const url = getShareableURL(groove, testBaseURL);
      expect(url).toContain('embed=true');
    });

    it('generates editor URL when mode is editor', () => {
      const groove = createEmptyGroove();
      const url = getShareableURL(groove, testBaseURL, 'editor');
      expect(url).not.toContain('embed=true');
    });

    it('generates embed URL when mode is embed explicitly', () => {
      const groove = createEmptyGroove();
      const url = getShareableURL(groove, testBaseURL, 'embed');
      expect(url).toContain('embed=true');
    });

    it('includes all groove data in the URL', () => {
      const groove = createEmptyGroove();
      const url = getShareableURL(groove, testBaseURL);

      expect(url).toContain('TimeSig=4%2F4');
      expect(url).toContain('Div=16');
      expect(url).toContain('Tempo=120');
      expect(url).toContain('Measures=1');
      expect(url).toContain('embed=true');
    });

    it('uses custom baseURL when provided', () => {
      const groove = createEmptyGroove();
      const customBase = 'https://custom.com/groove/';
      const url = getShareableURL(groove, customBase, 'embed');

      expect(url).toMatch(/^https:\/\/custom\.com\/groove\//);
      expect(url).toContain('embed=true');
    });
  });

  describe('getShareableURLWithValidation', () => {
    const testBaseURL = 'https://example.com/';

    it('returns URL with validation for embed mode', () => {
      const groove = createEmptyGroove();
      const { url, validation } = getShareableURLWithValidation(groove, testBaseURL, 'embed');

      expect(url).toContain('embed=true');
      expect(validation).toBeDefined();
      expect(validation.status).toBe('ok');
    });

    it('returns URL with validation for editor mode', () => {
      const groove = createEmptyGroove();
      const { url, validation } = getShareableURLWithValidation(groove, testBaseURL, 'editor');

      expect(url).not.toContain('embed=true');
      expect(validation).toBeDefined();
      expect(validation.status).toBe('ok');
    });

    it('defaults to embed mode when not specified', () => {
      const groove = createEmptyGroove();
      const { url } = getShareableURLWithValidation(groove, testBaseURL);

      expect(url).toContain('embed=true');
    });
  });
});

