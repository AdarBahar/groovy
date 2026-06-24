import { useRef, useCallback } from 'react';
import { GrooveData, MeasureConfig, MAX_MEASURES } from '../types';

export interface MeasureCopyPasteReturn {
  handleMeasureCopy: (measureIndex: number) => void;
  handleMeasurePaste: (afterIndex: number) => boolean;
}

function cloneMeasure(measure: MeasureConfig): MeasureConfig {
  return {
    ...measure,
    notes: Object.fromEntries(
      Object.entries(measure.notes).map(([voice, notes]) => [voice, [...notes]])
    ) as MeasureConfig['notes'],
    sticking: measure.sticking ? [...measure.sticking] : undefined,
  };
}

export function useMeasureCopyPaste(
  groove: GrooveData,
  setGroove: (g: GrooveData) => void
): MeasureCopyPasteReturn {
  const copiedMeasureRef = useRef<MeasureConfig | null>(null);

  const handleMeasureCopy = useCallback((measureIndex: number) => {
    const measure = groove.measures[measureIndex];
    if (!measure) return;
    copiedMeasureRef.current = cloneMeasure(measure);
  }, [groove.measures]);

  const handleMeasurePaste = useCallback((afterIndex: number): boolean => {
    if (!copiedMeasureRef.current || groove.measures.length >= MAX_MEASURES) {
      return false;
    }

    const measureToPaste = cloneMeasure(copiedMeasureRef.current);
    const insertIndex = Math.min(afterIndex + 1, groove.measures.length);
    setGroove({
      ...groove,
      measures: [
        ...groove.measures.slice(0, insertIndex),
        measureToPaste,
        ...groove.measures.slice(insertIndex),
      ],
    });
    return true;
  }, [groove, setGroove]);

  return { handleMeasureCopy, handleMeasurePaste };
}
