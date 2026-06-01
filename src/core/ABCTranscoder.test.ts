import { describe, expect, it } from 'vitest';
import { grooveToABC } from './ABCTranscoder';
import { ABC_DECORATIONS, ABC_SYMBOLS } from './ABCConstants';
import {
  createEmptyNotesRecord,
  createMeasureFromNotes,
  DrumVoice,
  GrooveData,
} from '../types';

function createEmptyGroove(division: number = 16): GrooveData {
  const notes = createEmptyNotesRecord(division);

  return {
    timeSignature: { beats: 4, noteValue: 4 },
    division: division as GrooveData['division'],
    tempo: 120,
    swing: 0,
    measures: [createMeasureFromNotes(notes)],
  };
}

function setNotes(groove: GrooveData, voice: DrumVoice, positions: number[]): GrooveData {
  return {
    ...groove,
    measures: groove.measures.map((measure, index) =>
      index === 0
        ? {
            ...measure,
            notes: {
              ...measure.notes,
              [voice]: measure.notes[voice].map((_, position) => positions.includes(position)),
            },
          }
        : measure
    ),
  };
}

describe('ABCTranscoder', () => {
  it('maps hi-hat foot to a low X notehead for pedal notation', () => {
    expect(ABC_SYMBOLS['hihat-foot']).toBe('C');
    expect(ABC_DECORATIONS['hihat-foot']).toBe('!style=x!');

    let groove = createEmptyGroove();
    groove = setNotes(groove, 'hihat-foot', [0]);

    expect(grooveToABC(groove)).toContain('!style=x!C');
  });

  it('keeps kick normal when kick and hi-hat foot are on the same subdivision', () => {
    let groove = createEmptyGroove();
    groove = setNotes(groove, 'kick', [0]);
    groove = setNotes(groove, 'hihat-foot', [0]);

    expect(grooveToABC(groove)).toContain('[!style=x!CF]');
  });
});
