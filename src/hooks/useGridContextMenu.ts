/**
 * useGridContextMenu - context menu, bulk dialog, and click handling for drum grids.
 * Extracted from useDrumGrid.ts.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { GrooveData, DrumVoice } from '../types';
import { GrooveUtils, BulkPattern } from '../core';
import { DRUM_ROWS } from '../core/DrumVoiceConfig';
import { ContextMenuState, BulkDialogState, NoteChange } from './useDrumGrid';

interface UseGridContextMenuProps {
  groove: GrooveData;
  onNoteToggle: (voice: DrumVoice, position: number, measureIndex: number) => void;
  onSetNotes?: (changes: NoteChange[]) => void;
  onPreview: (voice: DrumVoice) => void;
  advancedEditMode: boolean;
  getVoicesForPosition: (measureIndex: number, rowIndex: number, position: number) => DrumVoice[];
  isPositionActive: (measureIndex: number, rowIndex: number, position: number) => boolean;
  setVoiceSelections: React.Dispatch<React.SetStateAction<Record<string, DrumVoice[]>>>;
}

interface UseGridContextMenuReturn {
  contextMenu: ContextMenuState | null;
  setContextMenu: React.Dispatch<React.SetStateAction<ContextMenuState | null>>;
  contextMenuRef: React.RefObject<HTMLDivElement>;
  bulkDialog: BulkDialogState | null;
  setBulkDialog: React.Dispatch<React.SetStateAction<BulkDialogState | null>>;
  getContextMenuPosition: (eventTarget: EventTarget, rowIndex: number) => Pick<ContextMenuState, 'x' | 'y' | 'placement'>;
  handleLeftClick: (event: React.MouseEvent, measureIndex: number, rowIndex: number, position: number) => void;
  handleRightClick: (event: React.MouseEvent, measureIndex: number, rowIndex: number, position: number) => void;
  handleVoiceSelect: (voices: DrumVoice[]) => void;
  handleVoiceLabelClick: (rowIndex: number, measureIndex: number) => void;
  handleBulkPatternSelect: (pattern: BulkPattern) => void;
}

export function useGridContextMenu({
  groove,
  onNoteToggle,
  onSetNotes,
  onPreview,
  advancedEditMode,
  getVoicesForPosition,
  isPositionActive,
  setVoiceSelections,
}: UseGridContextMenuProps): UseGridContextMenuReturn {
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const [bulkDialog, setBulkDialog] = useState<BulkDialogState | null>(null);

  const notesPerMeasure = GrooveUtils.calcNotesPerMeasure(
    groove.division,
    groove.timeSignature.beats,
    groove.timeSignature.noteValue
  );

  const getContextMenuPosition = useCallback((
    eventTarget: EventTarget,
    rowIndex: number
  ): Pick<ContextMenuState, 'x' | 'y' | 'placement'> => {
    const target = eventTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const menuWidth = 200;
    const menuHeight = 34 + DRUM_ROWS[rowIndex].variations.length * 38 + 8;
    const gap = 6;
    const viewportPadding = 8;
    const roomBelow = window.innerHeight - rect.bottom - gap - viewportPadding;
    const roomAbove = rect.top - gap - viewportPadding;
    const hasRoomBelow = roomBelow >= menuHeight;
    const hasRoomAbove = roomAbove >= menuHeight;
    const placement = hasRoomBelow || (!hasRoomAbove && roomBelow >= roomAbove) ? 'below' : 'above';

    return {
      x: Math.min(
        Math.max(rect.left, viewportPadding),
        window.innerWidth - menuWidth - viewportPadding
      ),
      y: placement === 'below'
        ? rect.bottom + gap
        : rect.top - menuHeight - gap,
      placement,
    };
  }, []);

  // Note: isDragging guard is applied by the parent useDrumGrid wrapper
  const handleLeftClick = useCallback((
    event: React.MouseEvent,
    measureIndex: number,
    rowIndex: number,
    position: number
  ) => {
    const measure = groove.measures[measureIndex];
    if (!measure) return;

    if (advancedEditMode) {
      event.preventDefault();
      const row = DRUM_ROWS[rowIndex];
      if (row.variations.length > 1) {
        const menuPosition = getContextMenuPosition(event.currentTarget, rowIndex);
        setContextMenu({ visible: true, ...menuPosition, rowIndex, position, measureIndex });
      }
      return;
    }

    const voices = getVoicesForPosition(measureIndex, rowIndex, position);
    const isActive = isPositionActive(measureIndex, rowIndex, position);

    if (isActive) {
      const row = DRUM_ROWS[rowIndex];
      row.variations.forEach(v => {
        v.voices.forEach(voice => {
          if (measure.notes[voice]?.[position]) {
            onNoteToggle(voice, position, measureIndex);
          }
        });
      });
    } else {
      const row = DRUM_ROWS[rowIndex];
      row.variations.forEach(v => {
        v.voices.forEach(voice => {
          if (measure.notes[voice]?.[position]) {
            onNoteToggle(voice, position, measureIndex);
          }
        });
      });
      voices.forEach(voice => {
        onNoteToggle(voice, position, measureIndex);
      });
      onPreview(voices[0]);
    }
  }, [groove.measures, advancedEditMode, getContextMenuPosition, getVoicesForPosition, isPositionActive, onNoteToggle, onPreview]);

  const handleRightClick = useCallback((
    event: React.MouseEvent,
    measureIndex: number,
    rowIndex: number,
    position: number
  ) => {
    event.preventDefault();
    const row = DRUM_ROWS[rowIndex];
    if (row.variations.length > 1) {
      const menuPosition = getContextMenuPosition(event.currentTarget, rowIndex);
      setContextMenu({ visible: true, ...menuPosition, rowIndex, position, measureIndex });
    }
  }, [getContextMenuPosition]);

  const handleVoiceSelect = useCallback((voices: DrumVoice[]) => {
    if (!contextMenu) return;

    const { measureIndex, rowIndex, position } = contextMenu;
    const measure = groove.measures[measureIndex];
    if (!measure) return;

    const key = `${measureIndex}-${rowIndex}-${position}`;
    setVoiceSelections(prev => ({ ...prev, [key]: voices }));

    if (onSetNotes) {
      const changes: NoteChange[] = [];
      const row = DRUM_ROWS[rowIndex];

      row.variations.forEach(v => {
        v.voices.forEach(voice => {
          if (measure.notes[voice]?.[position]) {
            changes.push({ voice, position, measureIndex, value: false });
          }
        });
      });

      voices.forEach(voice => {
        changes.push({ voice, position, measureIndex, value: true });
      });

      onSetNotes(changes);
    } else {
      const row = DRUM_ROWS[rowIndex];
      row.variations.forEach(v => {
        v.voices.forEach(voice => {
          if (measure.notes[voice]?.[position]) {
            onNoteToggle(voice, position, measureIndex);
          }
        });
      });
      voices.forEach(voice => {
        onNoteToggle(voice, position, measureIndex);
      });
    }

    onPreview(voices[0]);
    setContextMenu(null);
  }, [contextMenu, groove.measures, onSetNotes, onNoteToggle, onPreview, setVoiceSelections]);

  const handleVoiceLabelClick = useCallback((rowIndex: number, measureIndex: number) => {
    setBulkDialog({ visible: true, rowIndex, measureIndex });
  }, []);

  const handleBulkPatternSelect = useCallback((pattern: BulkPattern) => {
    if (!bulkDialog) return;

    const { rowIndex, measureIndex } = bulkDialog;
    const measure = groove.measures[measureIndex];
    if (!measure) return;

    const row = DRUM_ROWS[rowIndex];

    for (let pos = 0; pos < notesPerMeasure; pos++) {
      row.variations.forEach(v => {
        v.voices.forEach(voice => {
          if (measure.notes[voice]?.[pos]) {
            onNoteToggle(voice, pos, measureIndex);
          }
        });
      });
    }

    for (let pos = 0; pos < notesPerMeasure; pos++) {
      const shouldBeOn = pattern.pattern(pos, notesPerMeasure);
      if (shouldBeOn && pattern.voices.length > 0) {
        pattern.voices.forEach(voice => {
          onNoteToggle(voice, pos, measureIndex);
        });
      }
    }

    if (pattern.voices.length > 0) {
      onPreview(pattern.voices[0]);
    }
  }, [bulkDialog, groove.measures, notesPerMeasure, onNoteToggle, onPreview]);

  // Close context menu on outside click or Escape/shortcut keys
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!contextMenu?.visible) return;

      const row = DRUM_ROWS[contextMenu.rowIndex];
      const variation = row.variations.find(v => v.shortcut === event.key);

      if (variation) {
        event.preventDefault();
        handleVoiceSelect(variation.voices);
      } else if (event.key === 'Escape') {
        setContextMenu(null);
      }
    };

    if (contextMenu?.visible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [contextMenu, handleVoiceSelect]);

  return {
    contextMenu,
    setContextMenu,
    contextMenuRef: contextMenuRef as React.RefObject<HTMLDivElement>,
    bulkDialog,
    setBulkDialog,
    getContextMenuPosition,
    handleLeftClick,
    handleRightClick,
    handleVoiceSelect,
    handleVoiceLabelClick,
    handleBulkPatternSelect,
  };
}
