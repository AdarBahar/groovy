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
