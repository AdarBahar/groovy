/**
 * useKeyboardEditor Hook
 *
 * Manages keyboard navigation state for the drum grid editor:
 * cursor position (row/col/measure), variation menu selection,
 * keyboard messages, and the full handleKeyboardEditKeyDown handler.
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { GrooveData, DrumVoice, MAX_MEASURES } from '../types';
import { GrooveUtils } from '../core';
import { DRUM_ROWS, NoteChange } from './useDrumGrid';
import type { UseDrumGridReturn } from './useDrumGrid';

export interface KeyboardCursor {
  measureIndex: number;
  rowIndex: number;
  position: number;
}

const INITIAL_KEYBOARD_ROW_INDEX = Math.max(0, DRUM_ROWS.findIndex(row => row.name === 'Hi-Hat'));

export interface UseKeyboardEditorProps {
  groove: GrooveData;
  grid: UseDrumGridReturn;
  onNoteToggle: (voice: DrumVoice, position: number, measureIndex: number) => void;
  onSetNotes?: (changes: NoteChange[]) => void;
  onPreview: (voice: DrumVoice) => void;
  onMeasureCopy?: (measureIndex: number) => void;
  onMeasurePaste?: (afterIndex: number) => boolean;
}

export interface UseKeyboardEditorReturn {
  keyboardCursor: KeyboardCursor;
  keyboardVariationIndex: number;
  keyboardMessage: string | null;
  cellRefs: React.MutableRefObject<Record<string, HTMLButtonElement | null>>;
  getCellKey: (cursor: KeyboardCursor) => string;
  registerCellRef: (cursor: KeyboardCursor, element: HTMLButtonElement | null) => void;
  handleKeyboardEditKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
  handleKeyboardVariationSelect: (variationIndex: number) => void;
  setKeyboardCursor: React.Dispatch<React.SetStateAction<KeyboardCursor>>;
}

export function useKeyboardEditor({
  groove,
  grid,
  onNoteToggle,
  onSetNotes,
  onPreview,
  onMeasureCopy,
  onMeasurePaste,
}: UseKeyboardEditorProps): UseKeyboardEditorReturn {
  const [keyboardCursor, setKeyboardCursor] = useState<KeyboardCursor>({
    measureIndex: 0,
    rowIndex: INITIAL_KEYBOARD_ROW_INDEX,
    position: 0,
  });
  const [keyboardVariationIndex, setKeyboardVariationIndex] = useState(0);
  const [keyboardMessage, setKeyboardMessage] = useState<string | null>(null);
  const cellRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const keyboardMessageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getCellKey = useCallback((cursor: KeyboardCursor) => {
    return `${cursor.measureIndex}-${cursor.rowIndex}-${cursor.position}`;
  }, []);

  const registerCellRef = useCallback((cursor: KeyboardCursor, element: HTMLButtonElement | null) => {
    cellRefs.current[getCellKey(cursor)] = element;
  }, [getCellKey]);

  const getPositionCount = useCallback((measureIndex: number) => {
    const measure = groove.measures[measureIndex];
    const ts = measure?.timeSignature || groove.timeSignature;
    return GrooveUtils.calcNotesPerMeasure(groove.division, ts.beats, ts.noteValue);
  }, [groove.division, groove.measures, groove.timeSignature]);

  const getHorizontalNeighbor = useCallback((cursor: KeyboardCursor, direction: -1 | 1): KeyboardCursor | null => {
    const positionCount = getPositionCount(cursor.measureIndex);
    const nextPosition = cursor.position + direction;

    if (nextPosition >= 0 && nextPosition < positionCount) {
      return { ...cursor, position: nextPosition };
    }

    const nextMeasureIndex = cursor.measureIndex + direction;
    if (nextMeasureIndex < 0 || nextMeasureIndex >= groove.measures.length) {
      return null;
    }

    return {
      measureIndex: nextMeasureIndex,
      rowIndex: cursor.rowIndex,
      position: direction === 1 ? 0 : getPositionCount(nextMeasureIndex) - 1,
    };
  }, [getPositionCount, groove.measures.length]);

  const moveKeyboardCursor = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    setKeyboardCursor(current => {
      if (direction === 'left' || direction === 'right') {
        return getHorizontalNeighbor(current, direction === 'right' ? 1 : -1) || current;
      }

      const nextRowIndex = Math.min(
        DRUM_ROWS.length - 1,
        Math.max(0, current.rowIndex + (direction === 'down' ? 1 : -1))
      );

      return { ...current, rowIndex: nextRowIndex };
    });
  }, [getHorizontalNeighbor]);

  const getRowVoices = useCallback((cursor: KeyboardCursor) => {
    const measure = groove.measures[cursor.measureIndex];
    if (!measure) return [];
    const row = DRUM_ROWS[cursor.rowIndex];
    const activeVoices: DrumVoice[] = [];
    row.variations.forEach(variation => {
      variation.voices.forEach(voice => {
        if (measure.notes[voice]?.[cursor.position] && !activeVoices.includes(voice)) {
          activeVoices.push(voice);
        }
      });
    });
    return activeVoices;
  }, [groove.measures]);

  const setRowVoices = useCallback((cursor: KeyboardCursor, voices: DrumVoice[]) => {
    const measure = groove.measures[cursor.measureIndex];
    if (!measure) return;

    const row = DRUM_ROWS[cursor.rowIndex];
    const changes: NoteChange[] = [];

    row.variations.forEach(variation => {
      variation.voices.forEach(voice => {
        if (measure.notes[voice]?.[cursor.position]) {
          changes.push({
            voice,
            position: cursor.position,
            measureIndex: cursor.measureIndex,
            value: false,
          });
        }
      });
    });

    voices.forEach(voice => {
      changes.push({
        voice,
        position: cursor.position,
        measureIndex: cursor.measureIndex,
        value: true,
      });
    });

    if (changes.length === 0) return;

    if (onSetNotes) {
      onSetNotes(changes);
    } else {
      changes.forEach(change => {
        if (measure.notes[change.voice]?.[change.position] !== change.value) {
          onNoteToggle(change.voice, change.position, change.measureIndex);
        }
      });
    }

    if (voices[0]) {
      onPreview(voices[0]);
    }
  }, [groove.measures, onNoteToggle, onPreview, onSetNotes]);

  const toggleKeyboardCell = useCallback(() => {
    const activeVoices = getRowVoices(keyboardCursor);
    setRowVoices(
      keyboardCursor,
      activeVoices.length > 0 ? [] : DRUM_ROWS[keyboardCursor.rowIndex].defaultVoices
    );
  }, [getRowVoices, keyboardCursor, setRowVoices]);

  const duplicateKeyboardCell = useCallback((direction: -1 | 1) => {
    const target = getHorizontalNeighbor(keyboardCursor, direction);
    if (!target) return;

    const sourceVoices = getRowVoices(keyboardCursor);
    if (sourceVoices.length === 0) return;

    setRowVoices(target, sourceVoices);
    setKeyboardCursor(target);
  }, [getHorizontalNeighbor, getRowVoices, keyboardCursor, setRowVoices]);

  const eraseKeyboardCell = useCallback((direction: -1 | 1) => {
    const target = getHorizontalNeighbor(keyboardCursor, direction);
    if (!target) return;

    setRowVoices(target, []);
    setKeyboardCursor(target);
  }, [getHorizontalNeighbor, keyboardCursor, setRowVoices]);

  const openKeyboardVariationMenu = useCallback(() => {
    const row = DRUM_ROWS[keyboardCursor.rowIndex];
    if (row.variations.length <= 1) return;

    const cell = cellRefs.current[getCellKey(keyboardCursor)];
    if (!cell) return;

    const rect = cell.getBoundingClientRect();
    const menuWidth = 200;
    const menuHeight = 34 + row.variations.length * 38 + 8;
    const gap = 6;
    const viewportPadding = 8;
    const roomBelow = window.innerHeight - rect.bottom - gap - viewportPadding;
    const roomAbove = rect.top - gap - viewportPadding;
    const hasRoomBelow = roomBelow >= menuHeight;
    const hasRoomAbove = roomAbove >= menuHeight;
    const placement = hasRoomBelow || (!hasRoomAbove && roomBelow >= roomAbove) ? 'below' : 'above';
    const selectedVoices = grid.getVoicesForPosition(
      keyboardCursor.measureIndex,
      keyboardCursor.rowIndex,
      keyboardCursor.position
    );
    const selectedIndex = Math.max(0, row.variations.findIndex(variation =>
      variation.voices.length === selectedVoices.length &&
      variation.voices.every(voice => selectedVoices.includes(voice))
    ));

    setKeyboardVariationIndex(selectedIndex);
    grid.setContextMenu({
      visible: true,
      x: Math.min(
        Math.max(rect.left, viewportPadding),
        window.innerWidth - menuWidth - viewportPadding
      ),
      y: placement === 'below'
        ? rect.bottom + gap
        : rect.top - menuHeight - gap,
      placement,
      rowIndex: keyboardCursor.rowIndex,
      position: keyboardCursor.position,
      measureIndex: keyboardCursor.measureIndex,
    });
  }, [getCellKey, grid, keyboardCursor]);

  const handleKeyboardVariationSelect = useCallback((variationIndex: number) => {
    const row = DRUM_ROWS[keyboardCursor.rowIndex];
    const variation = row.variations[variationIndex];
    if (!variation) return;

    setKeyboardVariationIndex(variationIndex);
    grid.handleVoiceSelect(variation.voices);
  }, [grid, keyboardCursor.rowIndex]);

  const isEditableTarget = useCallback((target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) return false;
    return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
  }, []);

  const handleKeyboardEditKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    if (isEditableTarget(event.target)) return;

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') {
      event.preventDefault();
      onMeasureCopy?.(keyboardCursor.measureIndex);
      return;
    }

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'v') {
      event.preventDefault();
      const pasted = onMeasurePaste?.(keyboardCursor.measureIndex) ?? false;
      if (pasted) {
        setKeyboardMessage(null);
        setKeyboardCursor(current => ({
          ...current,
          measureIndex: Math.min(current.measureIndex + 1, groove.measures.length),
        }));
      } else {
        setKeyboardMessage(
          groove.measures.length >= MAX_MEASURES
            ? `Measure limit reached (${MAX_MEASURES}). Cannot paste more measures.`
            : 'Copy a measure before pasting.'
        );
      }
      return;
    }

    if (grid.contextMenu?.visible) {
      const row = DRUM_ROWS[grid.contextMenu.rowIndex];
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault();
        setKeyboardVariationIndex(current => {
          const delta = event.key === 'ArrowDown' ? 1 : -1;
          return (current + delta + row.variations.length) % row.variations.length;
        });
        return;
      }

      if (event.key === 'Enter') {
        event.preventDefault();
        handleKeyboardVariationSelect(keyboardVariationIndex);
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        grid.setContextMenu(null);
        return;
      }
    }

    if (
      (event.shiftKey || event.altKey) &&
      (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
    ) {
      event.preventDefault();
      eraseKeyboardCell(event.key === 'ArrowRight' ? 1 : -1);
      return;
    }

    if (
      (event.ctrlKey || event.metaKey) &&
      (event.key === 'ArrowLeft' || event.key === 'ArrowRight')
    ) {
      event.preventDefault();
      duplicateKeyboardCell(event.key === 'ArrowRight' ? 1 : -1);
      return;
    }

    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight' || event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      const direction = event.key.replace('Arrow', '').toLowerCase() as 'up' | 'down' | 'left' | 'right';
      moveKeyboardCursor(direction);
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      toggleKeyboardCell();
      return;
    }

    if (event.key === 'Tab') {
      event.preventDefault();
      openKeyboardVariationMenu();
    }
  }, [
    duplicateKeyboardCell,
    eraseKeyboardCell,
    grid,
    groove.measures.length,
    handleKeyboardVariationSelect,
    isEditableTarget,
    keyboardCursor,
    keyboardVariationIndex,
    moveKeyboardCursor,
    onMeasureCopy,
    onMeasurePaste,
    openKeyboardVariationMenu,
    toggleKeyboardCell,
  ]);

  // Clamp cursor when measures are removed or time signatures change
  useEffect(() => {
    setKeyboardCursor(current => {
      const maxMeasureIndex = Math.max(0, groove.measures.length - 1);
      const maxRowIndex = DRUM_ROWS.length - 1;

      if (
        current.measureIndex <= maxMeasureIndex &&
        current.rowIndex <= maxRowIndex &&
        current.position < getPositionCount(current.measureIndex)
      ) {
        return current;
      }

      const measureIndex = Math.min(current.measureIndex, maxMeasureIndex);
      const position = Math.min(current.position, Math.max(0, getPositionCount(measureIndex) - 1));
      const rowIndex = Math.min(current.rowIndex, maxRowIndex);
      return { measureIndex, rowIndex, position };
    });
  }, [getPositionCount, groove.measures.length]);

  // Focus cell and scroll into view when cursor moves
  useEffect(() => {
    const cell = cellRefs.current[getCellKey(keyboardCursor)];
    if (cell && document.activeElement?.closest('[data-keyboard-editor="true"]')) {
      cell.focus({ preventScroll: true });
      cell.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    }
  }, [getCellKey, keyboardCursor]);

  // Auto-clear keyboard message after 2.5 seconds
  useEffect(() => {
    if (!keyboardMessage) return;

    if (keyboardMessageTimerRef.current) {
      clearTimeout(keyboardMessageTimerRef.current);
    }
    keyboardMessageTimerRef.current = setTimeout(() => {
      setKeyboardMessage(null);
      keyboardMessageTimerRef.current = null;
    }, 2500);

    return () => {
      if (keyboardMessageTimerRef.current) {
        clearTimeout(keyboardMessageTimerRef.current);
        keyboardMessageTimerRef.current = null;
      }
    };
  }, [keyboardMessage]);

  return {
    keyboardCursor,
    keyboardVariationIndex,
    keyboardMessage,
    cellRefs,
    getCellKey,
    registerCellRef,
    handleKeyboardEditKeyDown,
    handleKeyboardVariationSelect,
    setKeyboardCursor,
  };
}
