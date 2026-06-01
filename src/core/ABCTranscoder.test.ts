import { describe, expect, it } from 'vitest';
import { grooveToABC } from './ABCTranscoder';
import { ABC_DECORATIONS, ABC_SYMBOLS, getMeasuresPerLine } from './ABCConstants';
import {
  createEmptyNotesRecord,
  createMeasureFromNotes,
  DrumVoice,
  GrooveData,
} from '../types';

function createEmptyGroove(division: number = 16, measureCount: number = 1): GrooveData {
  const measures = Array.from({ length: measureCount }, () =>
    createMeasureFromNotes(createEmptyNotesRecord(division))
  );

  return {
    timeSignature: { beats: 4, noteValue: 4 },
    division: division as GrooveData['division'],
    tempo: 120,
    swing: 0,
    measures,
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

function getVoiceBody(abc: string, voiceName: 'Hands' | 'Feet'): string {
  const start = abc.indexOf(`V:${voiceName}`);
  const nextVoice = abc.indexOf('\nV:', start + 1);
  const section = nextVoice === -1 ? abc.slice(start) : abc.slice(start, nextVoice);
  return section.split('\n').slice(2).join('\n');
}

function getBarCountsByLine(voiceBody: string): number[] {
  return voiceBody
    .split('\n')
    .filter((line) => line.trim().length > 0)
    .map((line) => (line.match(/\|/g) || []).length);
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

  it('requests abcjs to stretch the last staff line to full width', () => {
    expect(grooveToABC(createEmptyGroove())).toContain('%%stretchlast 1');
  });

  it('pads incomplete rows with invisible measures to preserve measure widths', () => {
    const groove = createEmptyGroove(8, 4);
    const abc = grooveToABC(groove);

    expect(getBarCountsByLine(getVoiceBody(abc, 'Hands'))).toEqual([3, 3]);
    expect(getBarCountsByLine(getVoiceBody(abc, 'Feet'))).toEqual([3, 3]);
  });

  it('uses two measures per row for dense divisions', () => {
    expect(getMeasuresPerLine(24)).toBe(2);
    expect(getMeasuresPerLine(32)).toBe(2);
    expect(getMeasuresPerLine(48)).toBe(2);

    const thirtySecondGroove = createEmptyGroove(32, 5);
    const sixteenthTripletGroove = createEmptyGroove(24, 5);

    expect(getBarCountsByLine(getVoiceBody(grooveToABC(thirtySecondGroove), 'Hands'))).toEqual([2, 2, 2]);
    expect(getBarCountsByLine(getVoiceBody(grooveToABC(thirtySecondGroove), 'Feet'))).toEqual([2, 2, 2]);
    expect(getBarCountsByLine(getVoiceBody(grooveToABC(sixteenthTripletGroove), 'Hands'))).toEqual([2, 2, 2]);
    expect(getBarCountsByLine(getVoiceBody(grooveToABC(sixteenthTripletGroove), 'Feet'))).toEqual([2, 2, 2]);
  });

  it('pads one and two measure grooves to full row width', () => {
    const oneMeasureGroove = createEmptyGroove(8, 1);
    const twoMeasureGroove = createEmptyGroove(8, 2);

    expect(getBarCountsByLine(getVoiceBody(grooveToABC(oneMeasureGroove), 'Hands'))).toEqual([3]);
    expect(getBarCountsByLine(getVoiceBody(grooveToABC(oneMeasureGroove), 'Feet'))).toEqual([3]);
    expect(getBarCountsByLine(getVoiceBody(grooveToABC(twoMeasureGroove), 'Hands'))).toEqual([3]);
    expect(getBarCountsByLine(getVoiceBody(grooveToABC(twoMeasureGroove), 'Feet'))).toEqual([3]);
  });

  it('does not pad complete rows', () => {
    const threeMeasureGroove = createEmptyGroove(8, 3);
    const sixMeasureGroove = createEmptyGroove(8, 6);

    expect(getBarCountsByLine(getVoiceBody(grooveToABC(threeMeasureGroove), 'Hands'))).toEqual([3]);
    expect(getBarCountsByLine(getVoiceBody(grooveToABC(threeMeasureGroove), 'Feet'))).toEqual([3]);
    expect(getBarCountsByLine(getVoiceBody(grooveToABC(sixMeasureGroove), 'Hands'))).toEqual([3, 3]);
    expect(getBarCountsByLine(getVoiceBody(grooveToABC(sixMeasureGroove), 'Feet'))).toEqual([3, 3]);
  });
});
