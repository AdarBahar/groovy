/**
 * useGridDragPaint - drag painting, touch, and mouseup-outside handling for drum grids.
 * Extracted from useDrumGrid.ts.
 */

import { useState, useEffect, useCallback } from 'react';
import { GrooveData, DrumVoice } from '../types';
import { DRUM_ROWS } from '../core/DrumVoiceConfig';
import { ContextMenuState } from './useDrumGrid';

interface UseGridDragPaintProps {
  groove: GrooveData;
  onNoteToggle: (voice: DrumVoice, position: number, measureIndex: number) => void;
  getVoicesForPosition: (measureIndex: number, rowIndex: number, position: number) => DrumVoice[];
  isPositionActive: (measureIndex: number, rowIndex: number, position: number) => boolean;
  setVoiceSelections: React.Dispatch<React.SetStateAction<Record<string, DrumVoice[]>>>;
  setContextMenu: React.Dispatch<React.SetStateAction<ContextMenuState | null>>;
  getContextMenuPosition: (eventTarget: EventTarget, rowIndex: number) => Pick<ContextMenuState, 'x' | 'y' | 'placement'>;
}

interface UseGridDragPaintReturn {
  isDragging: boolean;
  dragMode: 'paint' | 'erase' | null;
  applyDragAction: (
    mode: 'paint' | 'erase',
    measureIndex: number,
    rowIndex: number,
    position: number,
    sourceVoices?: DrumVoice[]
  ) => void;
  handleMouseDown: (event: React.MouseEvent, measureIndex: number, rowIndex: number, position: number) => void;
  handleMouseEnter: (measureIndex: number, rowIndex: number, position: number) => void;
  handleTouchStart: (event: React.TouchEvent, measureIndex: number, rowIndex: number, position: number) => void;
  handleTouchMove: (event: React.TouchEvent) => void;
  handleTouchEnd: (event: React.TouchEvent, measureIndex: number, rowIndex: number, position: number) => void;
}

export function useGridDragPaint({
  groove,
  onNoteToggle,
  getVoicesForPosition,
  isPositionActive,
  setVoiceSelections,
  setContextMenu,
  getContextMenuPosition,
}: UseGridDragPaintProps): UseGridDragPaintReturn {
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'paint' | 'erase' | null>(null);
  const [dragMeasureIndex, setDragMeasureIndex] = useState<number>(0);
  const [dragSourceVoices, setDragSourceVoices] = useState<DrumVoice[] | null>(null);
  const [touchStartTime, setTouchStartTime] = useState<number>(0);
  const [touchMoved, setTouchMoved] = useState(false);

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
  }, [groove.measures, isPositionActive, getVoicesForPosition, onNoteToggle, setVoiceSelections]);

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
        const menuPosition = getContextMenuPosition(event.currentTarget, rowIndex);
        setContextMenu({
          visible: true,
          ...menuPosition,
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
  }, [touchStartTime, touchMoved, getContextMenuPosition, setContextMenu]);

  // End drag on global mouseup
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
    isDragging,
    dragMode,
    applyDragAction,
    handleMouseDown,
    handleMouseEnter,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
  };
}
