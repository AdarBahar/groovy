/**
 * useDrumGrid Hook
 *
 * Shared logic for DrumGrid and DrumGridDark components.
 * Handles voice selection, drag painting, touch support, context menus, and bulk operations.
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { GrooveData, DrumVoice } from '../types';
import { GrooveUtils, HI_HAT_PATTERNS, SNARE_PATTERNS, KICK_PATTERNS, BulkPattern } from '../core';
import { DRUM_ROWS, DrumRow } from '../core/DrumVoiceConfig';

/** A single note change for batch operations */
export interface NoteChange {
  voice: DrumVoice;
  position: number;
  measureIndex: number;
  value: boolean;
}

/** Context menu state */
export interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  rowIndex: number;
  position: number;
  measureIndex: number;
}

/** Bulk operations dialog state */
export interface BulkDialogState {
  visible: boolean;
  rowIndex: number;
  measureIndex: number;
}

/** Props for useDrumGrid hook */
export interface UseDrumGridProps {
  groove: GrooveData;
  onNoteToggle: (voice: DrumVoice, position: number, measureIndex: number) => void;
  onSetNotes?: (changes: NoteChange[]) => void;
  onPreview: (voice: DrumVoice) => void;
  advancedEditMode?: boolean;
}

/** Return type for useDrumGrid hook */
export interface UseDrumGridReturn {
  // State
  voiceSelections: Record<string, DrumVoice[]>;
  contextMenu: ContextMenuState | null;
  isDragging: boolean;
  dragMode: 'paint' | 'erase' | null;
  bulkDialog: BulkDialogState | null;
  contextMenuRef: React.RefObject<HTMLDivElement>;

  // Helper functions
  isDownbeat: (pos: number) => boolean;
  getVoicesForPosition: (measureIndex: number, rowIndex: number, position: number) => DrumVoice[];
  isPositionActive: (measureIndex: number, rowIndex: number, position: number) => boolean;
  getActiveVoices: (measureIndex: number, rowIndex: number, position: number) => DrumVoice[];
  getVariationLabel: (measureIndex: number, rowIndex: number, position: number) => string;
  getPositionsForMeasure: (measureIndex: number) => number[];
  getBulkPatternsForRow: (rowIndex: number) => BulkPattern[];

  // Event handlers
  handleMouseDown: (event: React.MouseEvent, measureIndex: number, rowIndex: number, position: number) => void;
  handleMouseEnter: (measureIndex: number, rowIndex: number, position: number) => void;
  handleTouchStart: (event: React.TouchEvent, measureIndex: number, rowIndex: number, position: number) => void;
  handleTouchMove: (event: React.TouchEvent) => void;
  handleTouchEnd: (event: React.TouchEvent, measureIndex: number, rowIndex: number, position: number) => void;
  handleLeftClick: (event: React.MouseEvent, measureIndex: number, rowIndex: number, position: number) => void;
  handleRightClick: (event: React.MouseEvent, measureIndex: number, rowIndex: number, position: number) => void;
  handleVoiceSelect: (voices: DrumVoice[]) => void;
  handleVoiceLabelClick: (rowIndex: number, measureIndex: number) => void;
  handleBulkPatternSelect: (pattern: BulkPattern) => void;

  // State setters
  setContextMenu: React.Dispatch<React.SetStateAction<ContextMenuState | null>>;
  setBulkDialog: React.Dispatch<React.SetStateAction<BulkDialogState | null>>;
}

export function useDrumGrid({
  groove,
  onNoteToggle,
  onSetNotes,
  onPreview,
  advancedEditMode = false,
}: UseDrumGridProps): UseDrumGridReturn {
  // Calculate notes per measure for the global time signature
  const notesPerMeasure = GrooveUtils.calcNotesPerMeasure(
    groove.division,
    groove.timeSignature.beats,
    groove.timeSignature.noteValue
  );

  // Voice selection state - tracks which voices are selected for each row at each position
  const [voiceSelections, setVoiceSelections] = useState<Record<string, DrumVoice[]>>(() => {
    const initial: Record<string, DrumVoice[]> = {};
    groove.measures.forEach((_, measureIndex) => {
      DRUM_ROWS.forEach((row, rowIndex) => {
        for (let pos = 0; pos < notesPerMeasure; pos++) {
          initial[`${measureIndex}-${rowIndex}-${pos}`] = row.defaultVoices;
        }
      });
    });
    return initial;
  });

  // Context menu state
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'paint' | 'erase' | null>(null);
  const [dragMeasureIndex, setDragMeasureIndex] = useState<number>(0);
  const [dragSourceVoices, setDragSourceVoices] = useState<DrumVoice[] | null>(null);

  // Touch state
  const [touchStartTime, setTouchStartTime] = useState<number>(0);
  const [touchMoved, setTouchMoved] = useState(false);

  // Bulk operations dialog state
  const [bulkDialog, setBulkDialog] = useState<BulkDialogState | null>(null);

  // ==========================================================================
  // Helper functions
  // ==========================================================================

  const isDownbeat = useCallback((pos: number) => {
    const notesPerBeat = groove.division / groove.timeSignature.beats;
    return pos % notesPerBeat === 0;
  }, [groove.division, groove.timeSignature.beats]);

  const getVoicesForPosition = useCallback((measureIndex: number, rowIndex: number, position: number): DrumVoice[] => {
    return voiceSelections[`${measureIndex}-${rowIndex}-${position}`] || DRUM_ROWS[rowIndex].defaultVoices;
  }, [voiceSelections]);

  const isPositionActive = useCallback((measureIndex: number, rowIndex: number, position: number): boolean => {
    const measure = groove.measures[measureIndex];
    if (!measure) return false;
    const row = DRUM_ROWS[rowIndex];
    return row.variations.some(v => v.voices.some(voice => measure.notes[voice]?.[position]));
  }, [groove.measures]);

  const getActiveVoices = useCallback((measureIndex: number, rowIndex: number, position: number): DrumVoice[] => {
    const measure = groove.measures[measureIndex];
    if (!measure) return [];
    const row = DRUM_ROWS[rowIndex];
    const activeVoices: DrumVoice[] = [];
    row.variations.forEach(v => {
      v.voices.forEach(voice => {
        if (measure.notes[voice]?.[position] && !activeVoices.includes(voice)) {
          activeVoices.push(voice);
        }
      });
    });
    return activeVoices;
  }, [groove.measures]);

  const getVariationLabel = useCallback((measureIndex: number, rowIndex: number, position: number): string => {
    const row = DRUM_ROWS[rowIndex];
    const selectedVoices = getVoicesForPosition(measureIndex, rowIndex, position);
    const variation = row.variations.find(v =>
      v.voices.length === selectedVoices.length &&
      v.voices.every(voice => selectedVoices.includes(voice))
    );
    return variation?.label || row.variations[0].label;
  }, [getVoicesForPosition]);

  const getPositionsForMeasure = useCallback((measureIndex: number): number[] => {
    const measure = groove.measures[measureIndex];
    const ts = measure?.timeSignature || groove.timeSignature;
    const posCount = GrooveUtils.calcNotesPerMeasure(groove.division, ts.beats, ts.noteValue);
    return Array.from({ length: posCount }, (_, i) => i);
  }, [groove.measures, groove.division, groove.timeSignature]);

  const getBulkPatternsForRow = useCallback((rowIndex: number): BulkPattern[] => {
    const rowName = DRUM_ROWS[rowIndex].name;
    if (rowName === 'Hi-Hat') return HI_HAT_PATTERNS;
    if (rowName === 'Snare') return SNARE_PATTERNS;
    if (rowName === 'Kick') return KICK_PATTERNS;
    return [];
  }, []);

  // ==========================================================================
  // Drag operations
  // ==========================================================================

  const applyDragAction = useCallback((
    mode: 'paint' | 'erase',
    measureIndex: number,
    rowIndex: number,
    position: number,
    sourceVoices?: DrumVoice[]
  ) => {
    const measure = groove.measures[measureIndex];
    if (!measure) return;

    const isActive = isPositionActive(measureIndex, rowIndex, position);

    if (mode === 'paint' && !isActive) {
      const voices = sourceVoices || getVoicesForPosition(measureIndex, rowIndex, position);
      voices.forEach(voice => {
        onNoteToggle(voice, position, measureIndex);
      });
      if (sourceVoices) {
        const key = `${measureIndex}-${rowIndex}-${position}`;
        setVoiceSelections(prev => ({ ...prev, [key]: sourceVoices }));
      }
    } else if (mode === 'erase' && isActive) {
      const row = DRUM_ROWS[rowIndex];
      row.variations.forEach(v => {
        v.voices.forEach(voice => {
          if (measure.notes[voice]?.[position]) {
            onNoteToggle(voice, position, measureIndex);
          }
        });
      });
    }
  }, [groove.measures, isPositionActive, getVoicesForPosition, onNoteToggle]);

  // ==========================================================================
  // Event handlers
  // ==========================================================================

  const handleMouseDown = useCallback((
    event: React.MouseEvent,
    measureIndex: number,
    rowIndex: number,
    position: number
  ) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      const sourceVoices = getVoicesForPosition(measureIndex, rowIndex, position);
      setIsDragging(true);
      setDragMode('paint');
      setDragMeasureIndex(measureIndex);
      setDragSourceVoices(sourceVoices);
      applyDragAction('paint', measureIndex, rowIndex, position, sourceVoices);
    } else if (event.altKey || event.shiftKey) {
      event.preventDefault();
      setIsDragging(true);
      setDragMode('erase');
      setDragMeasureIndex(measureIndex);
      setDragSourceVoices(null);
      applyDragAction('erase', measureIndex, rowIndex, position);
    }
  }, [getVoicesForPosition, applyDragAction]);

  const handleMouseEnter = useCallback((
    measureIndex: number,
    rowIndex: number,
    position: number
  ) => {
    if (isDragging && dragMode && measureIndex === dragMeasureIndex) {
      applyDragAction(dragMode, measureIndex, rowIndex, position, dragSourceVoices || undefined);
    }
  }, [isDragging, dragMode, dragMeasureIndex, dragSourceVoices, applyDragAction]);

  const handleTouchStart = useCallback((
    _event: React.TouchEvent,
    measureIndex: number,
    rowIndex: number,
    position: number
  ) => {
    setTouchStartTime(Date.now());
    setTouchMoved(false);
    const sourceVoices = getVoicesForPosition(measureIndex, rowIndex, position);
    setIsDragging(true);
    setDragMode('paint');
    setDragMeasureIndex(measureIndex);
    setDragSourceVoices(sourceVoices);
    applyDragAction('paint', measureIndex, rowIndex, position, sourceVoices);
  }, [getVoicesForPosition, applyDragAction]);

  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    setTouchMoved(true);
    if (!isDragging) return;

    const touch = event.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);

    // Check for both class names used by the two grid components
    if (element && (element.classList.contains('note-cell') || element.classList.contains('drum-cell'))) {
      const cellButton = element as HTMLButtonElement;
      const mIdx = parseInt(cellButton.dataset.measureIndex || '-1');
      const rIdx = parseInt(cellButton.dataset.rowIndex || '-1');
      const pos = parseInt(cellButton.dataset.position || '-1');

      if (mIdx >= 0 && rIdx >= 0 && pos >= 0 && dragMode && mIdx === dragMeasureIndex) {
        applyDragAction(dragMode, mIdx, rIdx, pos, dragSourceVoices || undefined);
      }
    }
  }, [isDragging, dragMode, dragMeasureIndex, dragSourceVoices, applyDragAction]);

  const handleTouchEnd = useCallback((
    event: React.TouchEvent,
    measureIndex: number,
    rowIndex: number,
    position: number
  ) => {
    const touchDuration = Date.now() - touchStartTime;

    if (touchDuration > 500 && !touchMoved) {
      event.preventDefault();
      const row = DRUM_ROWS[rowIndex];
      if (row.variations.length > 1) {
        // Get touch position for context menu
        const rect = (event.target as HTMLElement).getBoundingClientRect();
        setContextMenu({
          visible: true,
          x: rect.left,
          y: rect.bottom,
          rowIndex,
          position,
          measureIndex,
        });
      }
    }

    setIsDragging(false);
    setDragMode(null);
    setDragSourceVoices(null);
    setTouchMoved(false);
  }, [touchStartTime, touchMoved]);

  const handleLeftClick = useCallback((
    event: React.MouseEvent,
    measureIndex: number,
    rowIndex: number,
    position: number
  ) => {
    if (isDragging) return;

    const measure = groove.measures[measureIndex];
    if (!measure) return;

    if (advancedEditMode) {
      // In advanced mode, left-click shows context menu
      event.preventDefault();
      const row = DRUM_ROWS[rowIndex];
      if (row.variations.length > 1) {
        setContextMenu({
          visible: true,
          x: event.clientX,
          y: event.clientY,
          rowIndex,
          position,
          measureIndex,
        });
      }
      return;
    }

    const voices = getVoicesForPosition(measureIndex, rowIndex, position);
    const isActive = isPositionActive(measureIndex, rowIndex, position);

    if (isActive) {
      // Turn off all voices for this row at this position
      const row = DRUM_ROWS[rowIndex];
      row.variations.forEach(v => {
        v.voices.forEach(voice => {
          if (measure.notes[voice]?.[position]) {
            onNoteToggle(voice, position, measureIndex);
          }
        });
      });
    } else {
      // First, clear any existing notes for this row at this position
      const row = DRUM_ROWS[rowIndex];
      row.variations.forEach(v => {
        v.voices.forEach(voice => {
          if (measure.notes[voice]?.[position]) {
            onNoteToggle(voice, position, measureIndex);
          }
        });
      });
      // Then turn on selected voices
      voices.forEach(voice => {
        onNoteToggle(voice, position, measureIndex);
      });
      onPreview(voices[0]);
    }
  }, [isDragging, groove.measures, advancedEditMode, getVoicesForPosition, isPositionActive, onNoteToggle, onPreview]);

  const handleRightClick = useCallback((
    event: React.MouseEvent,
    measureIndex: number,
    rowIndex: number,
    position: number
  ) => {
    event.preventDefault();
    const row = DRUM_ROWS[rowIndex];
    if (row.variations.length > 1) {
      setContextMenu({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        rowIndex,
        position,
        measureIndex,
      });
    }
  }, []);

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

      // Clear any existing notes for this row at this position
      row.variations.forEach(v => {
        v.voices.forEach(voice => {
          if (measure.notes[voice]?.[position]) {
            changes.push({ voice, position, measureIndex, value: false });
          }
        });
      });

      // Set the new voices
      voices.forEach(voice => {
        changes.push({ voice, position, measureIndex, value: true });
      });

      onSetNotes(changes);
    } else {
      // Fallback to individual toggles
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
  }, [contextMenu, groove.measures, onSetNotes, onNoteToggle, onPreview]);

  const handleVoiceLabelClick = useCallback((rowIndex: number, measureIndex: number) => {
    setBulkDialog({ visible: true, rowIndex, measureIndex });
  }, []);

  const handleBulkPatternSelect = useCallback((pattern: BulkPattern) => {
    if (!bulkDialog) return;

    const { rowIndex, measureIndex } = bulkDialog;
    const measure = groove.measures[measureIndex];
    if (!measure) return;

    const row = DRUM_ROWS[rowIndex];

    // First, clear all voices for this row in this measure
    for (let pos = 0; pos < notesPerMeasure; pos++) {
      row.variations.forEach(v => {
        v.voices.forEach(voice => {
          if (measure.notes[voice]?.[pos]) {
            onNoteToggle(voice, pos, measureIndex);
          }
        });
      });
    }

    // Then, apply the pattern
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

  // ==========================================================================
  // Effects
  // ==========================================================================

  // Close context menu when clicking outside or handle keyboard shortcuts
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

  // Handle global mouseup to end drag operations
  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setDragMode(null);
        setDragSourceVoices(null);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return {
    // State
    voiceSelections,
    contextMenu,
    isDragging,
    dragMode,
    bulkDialog,
    contextMenuRef: contextMenuRef as React.RefObject<HTMLDivElement>,

    // Helper functions
    isDownbeat,
    getVoicesForPosition,
    isPositionActive,
    getActiveVoices,
    getVariationLabel,
    getPositionsForMeasure,
    getBulkPatternsForRow,

    // Event handlers
    handleMouseDown,
    handleMouseEnter,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleLeftClick,
    handleRightClick,
    handleVoiceSelect,
    handleVoiceLabelClick,
    handleBulkPatternSelect,

    // State setters
    setContextMenu,
    setBulkDialog,
  };
}

// Re-export types and DRUM_ROWS for convenience
export { DRUM_ROWS };
export type { DrumRow };
