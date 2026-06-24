/**
 * useDrumGrid Hook
 *
 * Shared logic for DrumGrid and DrumGridDark components.
 * Coordinates voice selection state, drag painting, and context menu sub-hooks.
 */

import { useState, useCallback } from 'react';
import { GrooveData, DrumVoice } from '../types';
import { GrooveUtils, HI_HAT_PATTERNS, SNARE_PATTERNS, KICK_PATTERNS, BulkPattern } from '../core';
import { DRUM_ROWS, DrumRow } from '../core/DrumVoiceConfig';
import { useGridDragPaint } from './useGridDragPaint';
import { useGridContextMenu } from './useGridContextMenu';

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
  placement: 'above' | 'below';
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
  const notesPerMeasure = GrooveUtils.calcNotesPerMeasure(
    groove.division,
    groove.timeSignature.beats,
    groove.timeSignature.noteValue
  );

  // Voice selection state — shared between drag and context menu sub-hooks
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

  // ===== Helper functions =====

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

  // ===== Sub-hooks =====

  const ctx = useGridContextMenu({
    groove,
    onNoteToggle,
    onSetNotes,
    onPreview,
    advancedEditMode,
    getVoicesForPosition,
    isPositionActive,
    setVoiceSelections,
  });

  const drag = useGridDragPaint({
    groove,
    onNoteToggle,
    getVoicesForPosition,
    isPositionActive,
    setVoiceSelections,
    setContextMenu: ctx.setContextMenu,
    getContextMenuPosition: ctx.getContextMenuPosition,
  });

  // Guard left-click against ongoing drag (ctx.handleLeftClick doesn't own isDragging state)
  const handleLeftClick = useCallback((
    event: React.MouseEvent,
    measureIndex: number,
    rowIndex: number,
    position: number
  ) => {
    if (drag.isDragging) return;
    ctx.handleLeftClick(event, measureIndex, rowIndex, position);
  }, [drag.isDragging, ctx.handleLeftClick]);

  return {
    voiceSelections,
    contextMenu: ctx.contextMenu,
    isDragging: drag.isDragging,
    dragMode: drag.dragMode,
    bulkDialog: ctx.bulkDialog,
    contextMenuRef: ctx.contextMenuRef,

    isDownbeat,
    getVoicesForPosition,
    isPositionActive,
    getActiveVoices,
    getVariationLabel,
    getPositionsForMeasure,
    getBulkPatternsForRow,

    handleMouseDown: drag.handleMouseDown,
    handleMouseEnter: drag.handleMouseEnter,
    handleTouchStart: drag.handleTouchStart,
    handleTouchMove: drag.handleTouchMove,
    handleTouchEnd: drag.handleTouchEnd,
    handleLeftClick,
    handleRightClick: ctx.handleRightClick,
    handleVoiceSelect: ctx.handleVoiceSelect,
    handleVoiceLabelClick: ctx.handleVoiceLabelClick,
    handleBulkPatternSelect: ctx.handleBulkPatternSelect,

    setContextMenu: ctx.setContextMenu,
    setBulkDialog: ctx.setBulkDialog,
  };
}

// Re-export types and DRUM_ROWS for convenience
export { DRUM_ROWS };
export type { DrumRow };
