import { useState, useCallback } from 'react';
import { GrooveData, StickingValue, createEmptySticking } from '../types';
import { GrooveUtils } from '../core';
import { applyStickingToSimilar } from '../core/stickingUtils';

export interface StickingStateReturn {
  isStickingSetupActive: boolean;
  handleStickingSetupToggle: () => void;
  handleStickingChange: (measureIndex: number, subdivIndex: number, value: StickingValue) => void;
  handleApplyToSimilar: (measureIndex: number) => string;
}

export function useStickingState(
  groove: GrooveData,
  setGroove: (g: GrooveData) => void
): StickingStateReturn {
  const [isStickingSetupActive, setIsStickingSetupActive] = useState(false);

  const handleStickingSetupToggle = useCallback(() => {
    setIsStickingSetupActive(prev => !prev);
  }, []);

  const handleStickingChange = useCallback((
    measureIndex: number,
    subdivIndex: number,
    value: StickingValue
  ) => {
    const measure = groove.measures[measureIndex];
    if (!measure) return;

    const ts = measure.timeSignature || groove.timeSignature;
    const subdivCount = GrooveUtils.calcNotesPerMeasure(groove.division, ts.beats, ts.noteValue);

    if (subdivIndex < 0 || subdivIndex >= subdivCount) return;

    const existingSticking: StickingValue[] = (measure.sticking && measure.sticking.length === subdivCount)
      ? [...measure.sticking]
      : createEmptySticking(subdivCount);

    existingSticking[subdivIndex] = value;

    setGroove({
      ...groove,
      measures: groove.measures.map((m, i) =>
        i === measureIndex ? { ...m, sticking: existingSticking } : m
      ),
    });
  }, [groove, setGroove]);

  const handleApplyToSimilar = useCallback((measureIndex: number): string => {
    const similarIndices = applyStickingToSimilar(groove, measureIndex);
    if (similarIndices.length === 0) {
      return 'No similar measures found.';
    }

    const sourceSticking = groove.measures[measureIndex].sticking!;
    setGroove({
      ...groove,
      measures: groove.measures.map((m, i) =>
        similarIndices.includes(i)
          ? { ...m, sticking: [...sourceSticking] }
          : m
      ),
    });

    const count = similarIndices.length;
    return `Applied to ${count} similar ${count === 1 ? 'measure' : 'measures'}.`;
  }, [groove, setGroove]);

  return {
    isStickingSetupActive,
    handleStickingSetupToggle,
    handleStickingChange,
    handleApplyToSimilar,
  };
}
