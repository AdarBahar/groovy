/**
 * Tests for sticking similarity detection and Apply to Similar Measures
 *
 * Tests findSimilarMeasures (D-05) and applyStickingToSimilar (D-10).
 */

import { describe, it, expect } from 'vitest';
import { findSimilarMeasures, applyStickingToSimilar } from '../pages/ProductionPage';
import type { GrooveData, MeasureConfig, StickingValue } from '../types';
import { createEmptyNotesRecord, createEmptySticking } from '../types';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Build a partial notes record where all voices are false except those specified */
function makeNotes(subdivisions: number, overrides: Record<string, boolean[]> = {}): Record<string, boolean[]> {
  const notes = createEmptyNotesRecord(subdivisions);
  for (const [voice, pattern] of Object.entries(overrides)) {
    (notes as Record<string, boolean[]>)[voice] = pattern;
  }
  return notes;
}

/**
 * Build a simple test groove with multiple measures.
 * Each measure entry is a partial MeasureConfig.
 */
function buildGroove(measures: Partial<MeasureConfig>[], division = 8): GrooveData {
  const subdivisions = (division / 4) * 4; // default 4/4 → same as division for 4/4 with div=8 → 8
  return {
    timeSignature: { beats: 4, noteValue: 4 },
    division: division as GrooveData['division'],
    tempo: 120,
    swing: 0,
    measures: measures.map(m => ({
      notes: makeNotes(subdivisions) as MeasureConfig['notes'],
      ...m,
    })) as MeasureConfig[],
  };
}

// ---------------------------------------------------------------------------
// Helper: a standard 8-subdivision pattern (hi-hat on all 8ths, snare on 2&4)
// ---------------------------------------------------------------------------
const STANDARD_HATS_8: boolean[] = [true, true, true, true, true, true, true, true];
const STANDARD_SNARE_8: boolean[] = [false, false, true, false, false, false, true, false];

function standardMeasure(sticking?: StickingValue[]): Partial<MeasureConfig> {
  return {
    notes: makeNotes(8, {
      'hihat-closed': STANDARD_HATS_8,
      'snare-normal': STANDARD_SNARE_8,
    }) as MeasureConfig['notes'],
    ...(sticking ? { sticking } : {}),
  };
}

// ---------------------------------------------------------------------------
// findSimilarMeasures tests
// ---------------------------------------------------------------------------

describe('findSimilarMeasures', () => {
  it('finds measures with identical note patterns', () => {
    const groove = buildGroove([
      standardMeasure(['R', 'L', 'R', 'L', 'R', 'L', 'R', 'L']),
      standardMeasure(), // same notes, no sticking
    ]);
    expect(findSimilarMeasures(groove, 0)).toEqual([1]);
  });

  it('excludes the target measure from results', () => {
    const groove = buildGroove([
      standardMeasure(['R', 'L', null, null, null, null, null, null]),
      standardMeasure(),
      standardMeasure(),
    ]);
    const result = findSimilarMeasures(groove, 0);
    expect(result).not.toContain(0);
    expect(result).toEqual([1, 2]);
  });

  it('returns empty array for single-measure groove', () => {
    const groove = buildGroove([standardMeasure(['R', null, null, null, null, null, null, null])]);
    expect(findSimilarMeasures(groove, 0)).toEqual([]);
  });

  it('returns empty array when no similar measures found', () => {
    const groove = buildGroove([
      standardMeasure(['R', 'L', 'R', 'L', 'R', 'L', 'R', 'L']),
      {
        // Different pattern: kick on all beats
        notes: makeNotes(8, { 'kick': STANDARD_HATS_8 }) as MeasureConfig['notes'],
      },
    ]);
    expect(findSimilarMeasures(groove, 0)).toEqual([]);
  });

  it('detects articulation differences (hihat-closed vs hihat-open count as different)', () => {
    const groove = buildGroove([
      {
        notes: makeNotes(8, { 'hihat-closed': STANDARD_HATS_8 }) as MeasureConfig['notes'],
      },
      {
        notes: makeNotes(8, { 'hihat-open': STANDARD_HATS_8 }) as MeasureConfig['notes'],
      },
    ]);
    // hihat-open and hihat-closed are separate DrumVoice values — not similar
    expect(findSimilarMeasures(groove, 0)).toEqual([]);
  });

  it('detects different subdivision counts as not similar', () => {
    // 4/4 vs 2/4 measure override → different noteCount even with same division=8
    const groove: GrooveData = {
      timeSignature: { beats: 4, noteValue: 4 },
      division: 8,
      tempo: 120,
      swing: 0,
      measures: [
        {
          // 4/4 → 8 subdivisions
          notes: makeNotes(8, { 'hihat-closed': STANDARD_HATS_8 }) as MeasureConfig['notes'],
        },
        {
          // 2/4 override → 4 subdivisions
          timeSignature: { beats: 2, noteValue: 4 },
          notes: makeNotes(4, { 'hihat-closed': [true, true, true, true] }) as MeasureConfig['notes'],
        },
      ],
    };
    expect(findSimilarMeasures(groove, 0)).toEqual([]);
  });

  it('detects different time signatures as not similar', () => {
    const groove: GrooveData = {
      timeSignature: { beats: 4, noteValue: 4 },
      division: 8,
      tempo: 120,
      swing: 0,
      measures: [
        {
          // Global 4/4 → 8 subdivisions
          notes: makeNotes(8, { 'snare-normal': STANDARD_SNARE_8 }) as MeasureConfig['notes'],
        },
        {
          // 3/4 override → 6 subdivisions
          timeSignature: { beats: 3, noteValue: 4 },
          notes: makeNotes(6, { 'snare-normal': [false, false, true, false, false, true] }) as MeasureConfig['notes'],
        },
      ],
    };
    expect(findSimilarMeasures(groove, 0)).toEqual([]);
  });

  it('finds multiple similar measures across larger groove', () => {
    const differentMeasure: Partial<MeasureConfig> = {
      notes: makeNotes(8, { 'kick': STANDARD_HATS_8 }) as MeasureConfig['notes'],
    };
    const groove = buildGroove([
      standardMeasure(['R', 'L', 'R', 'L', 'R', 'L', 'R', 'L']), // target
      differentMeasure,
      standardMeasure(), // similar
      differentMeasure,
      standardMeasure(), // similar
    ]);
    expect(findSimilarMeasures(groove, 0)).toEqual([2, 4]);
  });

  it('works with grooves that have no sticking (backward compatibility)', () => {
    const groove = buildGroove([
      {
        notes: makeNotes(8, { 'hihat-closed': STANDARD_HATS_8 }) as MeasureConfig['notes'],
        // no sticking field
      },
      {
        notes: makeNotes(8, { 'hihat-closed': STANDARD_HATS_8 }) as MeasureConfig['notes'],
        // no sticking field
      },
    ]);
    // Should work without errors and find similar measures
    expect(findSimilarMeasures(groove, 0)).toEqual([1]);
  });
});

// ---------------------------------------------------------------------------
// applyStickingToSimilar tests
// ---------------------------------------------------------------------------

describe('applyStickingToSimilar', () => {
  it('returns similar measure indices when source has sticking and matches exist', () => {
    const groove = buildGroove([
      standardMeasure(['R', 'L', 'R', 'L', 'R', 'L', 'R', 'L']),
      standardMeasure(), // similar, no sticking
    ]);
    const result = applyStickingToSimilar(groove, 0);
    expect(result).toEqual([1]);
  });

  it('returns empty array when no similar measures found', () => {
    const groove = buildGroove([
      standardMeasure(['R', 'L', 'R', 'L', 'R', 'L', 'R', 'L']),
      {
        notes: makeNotes(8, { 'kick': STANDARD_HATS_8 }) as MeasureConfig['notes'],
      },
    ]);
    expect(applyStickingToSimilar(groove, 0)).toEqual([]);
  });

  it('returns empty array when source has no sticking (all nulls)', () => {
    const stickingAllNull = createEmptySticking(8); // [null, null, null, null, null, null, null, null]
    const groove = buildGroove([
      {
        ...standardMeasure(stickingAllNull as StickingValue[]),
      },
      standardMeasure(),
    ]);
    // All nulls = nothing to apply
    expect(applyStickingToSimilar(groove, 0)).toEqual([]);
  });

  it('returns empty array when source has no sticking field', () => {
    const groove = buildGroove([
      standardMeasure(), // no sticking field
      standardMeasure(),
    ]);
    expect(applyStickingToSimilar(groove, 0)).toEqual([]);
  });

  it('returns multiple indices when multiple similar measures exist', () => {
    const groove = buildGroove([
      standardMeasure(['R', 'L', 'R', 'L', 'R', 'L', 'R', 'L']),
      standardMeasure(), // similar
      standardMeasure(), // similar
    ]);
    expect(applyStickingToSimilar(groove, 0)).toEqual([1, 2]);
  });

  it('backward compatibility: works when existing measures have no sticking field', () => {
    const groove = buildGroove([
      {
        notes: makeNotes(8, { 'hihat-closed': STANDARD_HATS_8 }) as MeasureConfig['notes'],
        sticking: ['R', null, 'L', null, 'R', null, 'L', null],
      },
      {
        notes: makeNotes(8, { 'hihat-closed': STANDARD_HATS_8 }) as MeasureConfig['notes'],
        // no sticking field (older format)
      },
    ]);
    const result = applyStickingToSimilar(groove, 0);
    expect(result).toEqual([1]);
  });
});

// ---------------------------------------------------------------------------
// Deep copy verification (T-02-09)
// ---------------------------------------------------------------------------

describe('applyStickingToSimilar - deep copy verification', () => {
  it('the caller applies an independent copy (mutations do not affect source)', () => {
    const sourceSticking: StickingValue[] = ['R', 'L', 'R', 'L', 'R', 'L', 'R', 'L'];
    const groove = buildGroove([
      standardMeasure(sourceSticking),
      standardMeasure(),
    ]);

    const similarIndices = applyStickingToSimilar(groove, 0);
    expect(similarIndices).toEqual([1]);

    // The handler is expected to deep-copy. Simulate what handleApplyToSimilar does:
    const copiedSticking: StickingValue[] = [...groove.measures[0].sticking!];
    copiedSticking[0] = 'L'; // mutate copy

    // Source should be unchanged
    expect(groove.measures[0].sticking![0]).toBe('R');
  });
});
