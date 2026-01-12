import { useCallback } from 'react';
import { GrooveData, DrumVoice, createEmptyNotesRecord, MAX_MEASURES } from '../types';
import { GrooveUtils } from '../core';

/**
 * A single note change for batch operations
 */
export interface NoteChange {
  voice: DrumVoice;
  position: number;
  measureIndex: number;
  value: boolean;
}

/**
 * Actions returned by useGrooveActions hook
 */
export interface GrooveActions {
  // Note manipulation
  handleNoteToggle: (voice: DrumVoice, position: number, measureIndex: number) => void;
  handleSetNotes: (changes: NoteChange[]) => void;
  
  // Measure manipulation
  handleMeasureDuplicate: (measureIndex: number) => void;
  handleMeasureAdd: (afterIndex: number) => void;
  handleMeasureRemove: (measureIndex: number) => void;
  handleMeasureClear: (measureIndex: number) => void;
  handleClearAll: () => void;
  
  // Metadata
  handleTitleChange: (title: string) => void;
  handleAuthorChange: (author: string) => void;
  handleCommentsChange: (comments: string) => void;
}

/**
 * Hook for groove manipulation actions
 * 
 * Extracts shared business logic for note toggling, measure manipulation,
 * and metadata updates. Used by both GrooveEditor and ProductionPage.
 * 
 * Engine sync is handled externally via centralized useEffect in the parent component.
 */
export function useGrooveActions(
  groove: GrooveData,
  setGroove: (groove: GrooveData) => void
): GrooveActions {
  
  // Note toggle handler
  const handleNoteToggle = useCallback((voice: DrumVoice, position: number, measureIndex: number) => {
    const newMeasures = groove.measures.map((measure, idx) => {
      if (idx !== measureIndex) return measure;
      return {
        ...measure,
        notes: {
          ...measure.notes,
          [voice]: measure.notes[voice].map((note, i) => (i === position ? !note : note)),
        },
      };
    });
    const newGroove = { ...groove, measures: newMeasures };
    setGroove(newGroove);
  }, [groove, setGroove]);

  // Batch set multiple notes at once (avoids React state batching issues)
  const handleSetNotes = useCallback((changes: NoteChange[]) => {
    const newMeasures = groove.measures.map((measure, measureIdx) => {
      const measureChanges = changes.filter(c => c.measureIndex === measureIdx);
      if (measureChanges.length === 0) return measure;

      const newNotes = { ...measure.notes };
      for (const change of measureChanges) {
        newNotes[change.voice] = newNotes[change.voice].map((note, i) =>
          i === change.position ? change.value : note
        );
      }
      return { ...measure, notes: newNotes };
    });
    const newGroove = { ...groove, measures: newMeasures };
    setGroove(newGroove);
  }, [groove, setGroove]);

  // Measure manipulation handlers
  const handleMeasureDuplicate = useCallback((measureIndex: number) => {
    if (groove.measures.length >= MAX_MEASURES) return;
    const measureToCopy = groove.measures[measureIndex];
    const copiedNotes = Object.fromEntries(
      Object.entries(measureToCopy.notes).map(([voice, notes]) => [voice, [...notes]])
    ) as typeof measureToCopy.notes;
    const newMeasure = { ...measureToCopy, notes: copiedNotes };
    const newMeasures = [
      ...groove.measures.slice(0, measureIndex + 1),
      newMeasure,
      ...groove.measures.slice(measureIndex + 1),
    ];
    const newGroove = { ...groove, measures: newMeasures };
    setGroove(newGroove);
  }, [groove, setGroove]);

  const handleMeasureAdd = useCallback((afterIndex: number) => {
    if (groove.measures.length >= MAX_MEASURES) return;
    const notesPerMeasure = GrooveUtils.calcNotesPerMeasure(
      groove.division,
      groove.timeSignature.beats,
      groove.timeSignature.noteValue
    );
    const newMeasure = { notes: createEmptyNotesRecord(notesPerMeasure) };
    const newMeasures = [
      ...groove.measures.slice(0, afterIndex + 1),
      newMeasure,
      ...groove.measures.slice(afterIndex + 1),
    ];
    const newGroove = { ...groove, measures: newMeasures };
    setGroove(newGroove);
  }, [groove, setGroove]);

  const handleMeasureRemove = useCallback((measureIndex: number) => {
    if (groove.measures.length <= 1) return;
    const newMeasures = groove.measures.filter((_, idx) => idx !== measureIndex);
    const newGroove = { ...groove, measures: newMeasures };
    setGroove(newGroove);
  }, [groove, setGroove]);

  const handleMeasureClear = useCallback((measureIndex: number) => {
    const notesPerMeasure = GrooveUtils.calcNotesPerMeasure(
      groove.division,
      groove.timeSignature.beats,
      groove.timeSignature.noteValue
    );
    const newMeasures = groove.measures.map((measure, idx) => {
      if (idx !== measureIndex) return measure;
      return { ...measure, notes: createEmptyNotesRecord(notesPerMeasure) };
    });
    const newGroove = { ...groove, measures: newMeasures };
    setGroove(newGroove);
  }, [groove, setGroove]);

  const handleClearAll = useCallback(() => {
    const notesPerMeasure = GrooveUtils.calcNotesPerMeasure(
      groove.division,
      groove.timeSignature.beats,
      groove.timeSignature.noteValue
    );
    const newMeasures = groove.measures.map((measure) => ({
      ...measure,
      notes: createEmptyNotesRecord(notesPerMeasure),
    }));
    const newGroove = { ...groove, measures: newMeasures };
    setGroove(newGroove);
  }, [groove, setGroove]);

  // Metadata handlers - these don't trigger engine sync (no audio impact)
  const handleTitleChange = useCallback((title: string) => {
    const newGroove = { ...groove, title: title || undefined };
    setGroove(newGroove);
  }, [groove, setGroove]);

  const handleAuthorChange = useCallback((author: string) => {
    const newGroove = { ...groove, author: author || undefined };
    setGroove(newGroove);
  }, [groove, setGroove]);

  const handleCommentsChange = useCallback((comments: string) => {
    const newGroove = { ...groove, comments: comments || undefined };
    setGroove(newGroove);
  }, [groove, setGroove]);

  return {
    handleNoteToggle,
    handleSetNotes,
    handleMeasureDuplicate,
    handleMeasureAdd,
    handleMeasureRemove,
    handleMeasureClear,
    handleClearAll,
    handleTitleChange,
    handleAuthorChange,
    handleCommentsChange,
  };
}

