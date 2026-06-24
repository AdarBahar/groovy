import { GrooveData, DrumVoice, ALL_DRUM_VOICES } from '../types';
import { GrooveUtils } from './GrooveUtils';

function areNotesIdentical(
  notes1: Record<DrumVoice, boolean[]>,
  notes2: Record<DrumVoice, boolean[]>
): boolean {
  return ALL_DRUM_VOICES.every(voice => {
    const arr1 = notes1[voice];
    const arr2 = notes2[voice];
    if (!arr1 || !arr2) return arr1 === arr2;
    if (arr1.length !== arr2.length) return false;
    return arr1.every((v, i) => v === arr2[i]);
  });
}

/**
 * Find measures with the same note pattern as the target measure.
 * Similarity criteria (per D-05):
 * - Same time signature (beats x noteValue)
 * - Same subdivision count (notesPerMeasure)
 * - Identical note patterns across all voices (including articulation)
 *
 * Returns indices of similar measures, excluding the target measure itself.
 */
export function findSimilarMeasures(groove: GrooveData, targetMeasureIndex: number): number[] {
  const target = groove.measures[targetMeasureIndex];
  if (!target) return [];

  const targetTs = target.timeSignature || groove.timeSignature;
  const targetNotesPerMeasure = GrooveUtils.calcNotesPerMeasure(
    groove.division,
    targetTs.beats,
    targetTs.noteValue
  );

  const similar: number[] = [];
  for (let i = 0; i < groove.measures.length; i++) {
    if (i === targetMeasureIndex) continue;
    const candidate = groove.measures[i];
    const candidateTs = candidate.timeSignature || groove.timeSignature;

    if (
      candidateTs.beats !== targetTs.beats ||
      candidateTs.noteValue !== targetTs.noteValue
    ) {
      continue;
    }

    const candidateNotesPerMeasure = GrooveUtils.calcNotesPerMeasure(
      groove.division,
      candidateTs.beats,
      candidateTs.noteValue
    );
    if (candidateNotesPerMeasure !== targetNotesPerMeasure) continue;

    if (areNotesIdentical(target.notes, candidate.notes)) {
      similar.push(i);
    }
  }

  return similar;
}

/**
 * Apply the sticking from a source measure to all similar measures.
 * Returns the set of measure indices that were updated (for feedback messages).
 * Returns empty array if source has no sticking or no similar measures found.
 * The sticking array is deep-copied to each target measure (T-02-09).
 */
export function applyStickingToSimilar(groove: GrooveData, sourceMeasureIndex: number): number[] {
  const sourceSticking = groove.measures[sourceMeasureIndex]?.sticking;
  if (!sourceSticking || !sourceSticking.some(v => v !== null)) return [];

  return findSimilarMeasures(groove, sourceMeasureIndex);
}
