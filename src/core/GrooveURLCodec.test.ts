import { describe, expect, it } from 'vitest';
import { createEmptyNotesRecord, GrooveData } from '../types';
import { decodeURLToGroove, encodeGrooveToURL } from './GrooveURLCodec';

function createEmptyGroove(): GrooveData {
  return {
    timeSignature: { beats: 4, noteValue: 4 },
    division: 8,
    tempo: 120,
    swing: 0,
    measures: [{ notes: createEmptyNotesRecord(8) }],
  };
}

describe('C8: empty-middle-measure alignment', () => {
  it('round-trips a 3-measure groove with an empty middle measure without shifting alignment', () => {
    // Measure 0: kick on step 0
    // Measure 1: empty (no notes)
    // Measure 2: snare on step 2
    const groove: GrooveData = {
      timeSignature: { beats: 4, noteValue: 4 },
      division: 8,
      tempo: 120,
      swing: 0,
      measures: [
        { notes: { ...createEmptyNotesRecord(8), kick: [true, false, false, false, false, false, false, false] } },
        { notes: createEmptyNotesRecord(8) },
        { notes: { ...createEmptyNotesRecord(8), 'snare-normal': [false, false, true, false, false, false, false, false] } },
      ],
    };

    const encoded = encodeGrooveToURL(groove);
    const decoded = decodeURLToGroove(encoded);

    expect(decoded.measures.length).toBe(3);
    // Measure 0: kick on step 0
    expect(decoded.measures[0].notes['kick'][0]).toBe(true);
    expect(decoded.measures[0].notes['kick'].slice(1).every(v => !v)).toBe(true);
    // Measure 1: all empty
    expect(Object.values(decoded.measures[1].notes).every(arr => arr.every(v => !v))).toBe(true);
    // Measure 2: snare on step 2 (NOT shifted to measure 1)
    expect(decoded.measures[2].notes['snare-normal'][2]).toBe(true);
    expect(decoded.measures[2].notes['snare-normal'].filter(v => v).length).toBe(1);
  });

  it('backward-compatible: existing full-width measure URLs decode identically', () => {
    // Encode a 2-measure groove and verify the round-trip still works
    const groove: GrooveData = {
      timeSignature: { beats: 4, noteValue: 4 },
      division: 8,
      tempo: 120,
      swing: 0,
      measures: [
        { notes: { ...createEmptyNotesRecord(8), kick: [true, false, true, false, true, false, true, false] } },
        { notes: { ...createEmptyNotesRecord(8), 'snare-normal': [false, true, false, true, false, true, false, true] } },
      ],
    };

    const encoded = encodeGrooveToURL(groove);
    const decoded = decodeURLToGroove(encoded);

    expect(decoded.measures.length).toBe(2);
    expect(decoded.measures[0].notes['kick']).toEqual([true, false, true, false, true, false, true, false]);
    expect(decoded.measures[1].notes['snare-normal']).toEqual([false, true, false, true, false, true, false, true]);
  });
});

describe('GrooveURLCodec hihat-foot encoding', () => {
  it('round-trips hihat-foot without hihat-closed', () => {
    const groove = createEmptyGroove();
    groove.measures[0].notes['hihat-foot'][0] = true;

    const encoded = encodeGrooveToURL(groove);
    const decoded = decodeURLToGroove(encoded);

    expect(encoded).toContain('H=');
    expect(decoded.measures[0].notes['hihat-foot'][0]).toBe(true);
    expect(decoded.measures[0].notes['hihat-closed'][0]).toBe(false);
  });

  it('round-trips hihat-closed and hihat-foot at the same position', () => {
    const groove = createEmptyGroove();
    groove.measures[0].notes['hihat-closed'][0] = true;
    groove.measures[0].notes['hihat-foot'][0] = true;

    const encoded = encodeGrooveToURL(groove);
    const decoded = decodeURLToGroove(encoded);

    expect(encoded).toContain('%5E');
    expect(decoded.measures[0].notes['hihat-closed'][0]).toBe(true);
    expect(decoded.measures[0].notes['hihat-foot'][0]).toBe(true);
  });
});
