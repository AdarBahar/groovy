import { describe, expect, it } from 'vitest';
import { GrooveUtils } from './GrooveUtils';
import { Division } from '../types';

function getLabels(division: Division, count: number): string[] {
  return Array.from({ length: count }, (_, position) =>
    GrooveUtils.getCountLabel(position, division, 4)
  );
}

describe('GrooveUtils.getCountLabel', () => {
  it('labels 32nd-note subdivisions within each beat', () => {
    expect(getLabels(32, 16)).toEqual([
      '1', 'e', '&', 'a', '+', 'e', '&', 'a',
      '2', 'e', '&', 'a', '+', 'e', '&', 'a',
    ]);
  });

  it('labels 16th-triplet subdivisions within each beat', () => {
    expect(getLabels(24, 12)).toEqual([
      '1', 'trip', 'let', '+', 'trip', 'let',
      '2', 'trip', 'let', '+', 'trip', 'let',
    ]);
  });
});
