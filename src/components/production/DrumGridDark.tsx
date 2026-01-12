import { useState, useRef, useEffect } from 'react';
import { Copy, Plus, Trash2, X } from 'lucide-react';
import { GrooveData, DrumVoice, MAX_MEASURES } from '../../types';
import { GrooveUtils, HI_HAT_PATTERNS, SNARE_PATTERNS, KICK_PATTERNS, BulkPattern } from '../../core';
import BulkOperationsDialog from '../BulkOperationsDialog';
import NoteIcon from '../NoteIcon';

/** A single note change for batch operations */
export interface NoteChange {
  voice: DrumVoice;
  position: number;
  measureIndex: number;
  value: boolean;
}

interface DrumGridDarkProps {
  groove: GrooveData;
  onNoteToggle: (voice: DrumVoice, position: number, measureIndex: number) => void;
  /** Batch set multiple notes at once (avoids React state batching issues) */
  onSetNotes?: (changes: NoteChange[]) => void;
  onPreview: (voice: DrumVoice) => void;
  advancedEditMode?: boolean;
  onMeasureDuplicate?: (measureIndex: number) => void;
  onMeasureAdd?: (afterIndex: number) => void;
  onMeasureRemove?: (measureIndex: number) => void;
  onMeasureClear?: (measureIndex: number) => void;
}

// Define drum rows with their variations
interface DrumRow {
  name: string;
  defaultVoices: DrumVoice[];
  variations: { voices: DrumVoice[]; label: string; shortcut?: string }[];
}

const DRUM_ROWS: DrumRow[] = [
  {
    name: 'Hi-Hat',
    defaultVoices: ['hihat-closed'],
    variations: [
      { voices: ['hihat-closed'], label: 'Closed', shortcut: '1' },
      { voices: ['hihat-open'], label: 'Open', shortcut: '2' },
      { voices: ['hihat-accent'], label: 'Accent', shortcut: '3' },
      { voices: ['crash'], label: 'Crash', shortcut: '4' },
      { voices: ['ride'], label: 'Ride', shortcut: '5' },
      { voices: ['ride-bell'], label: 'Ride Bell', shortcut: '6' },
      { voices: ['cowbell'], label: 'Cowbell', shortcut: '7' },
      { voices: ['stacker'], label: 'Stacker', shortcut: '8' },
      { voices: ['hihat-metronome-normal'], label: 'Metronome', shortcut: '9' },
      { voices: ['hihat-metronome-accent'], label: 'Metronome Accent', shortcut: '0' },
      { voices: ['hihat-cross'], label: 'Cross' },
    ],
  },
  {
    name: 'Tom 1',
    defaultVoices: ['tom-10'],
    variations: [{ voices: ['tom-10'], label: 'Tom 1' }],
  },
  {
    name: 'Snare',
    defaultVoices: ['snare-normal'],
    variations: [
      { voices: ['snare-normal'], label: 'Normal', shortcut: '1' },
      { voices: ['snare-accent'], label: 'Accent', shortcut: '2' },
      { voices: ['snare-ghost'], label: 'Ghost Note', shortcut: '3' },
      { voices: ['snare-cross-stick'], label: 'Cross Stick', shortcut: '4' },
      { voices: ['snare-flam'], label: 'Flam', shortcut: '5' },
      { voices: ['snare-rim'], label: 'Rimshot', shortcut: '6' },
      { voices: ['snare-drag'], label: 'Drag', shortcut: '7' },
      { voices: ['snare-buzz'], label: 'Buzz', shortcut: '8' },
    ],
  },
  {
    name: 'Tom 2',
    defaultVoices: ['tom-16'],
    variations: [{ voices: ['tom-16'], label: 'Tom 2' }],
  },
  {
    name: 'Floor Tom',
    defaultVoices: ['tom-floor'],
    variations: [{ voices: ['tom-floor'], label: 'Floor Tom' }],
  },
  {
    name: 'Kick',
    defaultVoices: ['kick'],
    variations: [
      { voices: ['kick'], label: 'Kick', shortcut: '1' },
      { voices: ['hihat-foot'], label: 'Hi-Hat Foot', shortcut: '2' },
      { voices: ['kick', 'hihat-foot'], label: 'Kick & Hi-Hat Foot', shortcut: '3' },
    ],
  },
];

export function DrumGridDark({
  groove,
  onNoteToggle,
  onSetNotes,
  onPreview,
  advancedEditMode = false,
  onMeasureDuplicate,
  onMeasureAdd,
  onMeasureRemove,
  onMeasureClear,
}: DrumGridDarkProps) {
  const notesPerMeasure = GrooveUtils.calcNotesPerMeasure(
    groove.division,
    groove.timeSignature.beats,
    groove.timeSignature.noteValue
  );

  // Voice selection state
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
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    rowIndex: number;
    position: number;
    measureIndex: number;
  } | null>(null);

  // Drag state
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'paint' | 'erase' | null>(null);
  const [dragMeasureIndex, setDragMeasureIndex] = useState<number>(0);

  // Touch state
  const [touchStartTime, setTouchStartTime] = useState<number>(0);
  const [touchMoved, setTouchMoved] = useState(false);

  // Bulk operations dialog
  const [bulkDialog, setBulkDialog] = useState<{
    visible: boolean;
    rowIndex: number;
    measureIndex: number;
  } | null>(null);

  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Helper functions
  const isDownbeat = (pos: number) => {
    const notesPerBeat = groove.division / groove.timeSignature.beats;
    return pos % notesPerBeat === 0;
  };

  const getVoicesForPosition = (measureIndex: number, rowIndex: number, position: number): DrumVoice[] => {
    return voiceSelections[`${measureIndex}-${rowIndex}-${position}`] || DRUM_ROWS[rowIndex].defaultVoices;
  };

  const isPositionActive = (measureIndex: number, rowIndex: number, position: number): boolean => {
    const measure = groove.measures[measureIndex];
    if (!measure) return false;
    const row = DRUM_ROWS[rowIndex];
    return row.variations.some(v => v.voices.some(voice => measure.notes[voice]?.[position]));
  };

  const getActiveVoices = (measureIndex: number, rowIndex: number, position: number): DrumVoice[] => {
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
  };

  const getVariationLabel = (measureIndex: number, rowIndex: number, position: number): string => {
    const row = DRUM_ROWS[rowIndex];
    const selectedVoices = getVoicesForPosition(measureIndex, rowIndex, position);
    const variation = row.variations.find(v =>
      v.voices.length === selectedVoices.length &&
      v.voices.every(voice => selectedVoices.includes(voice))
    );
    return variation?.label || row.variations[0].label;
  };

  // Close context menu when clicking outside
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
  }, [contextMenu]);

  // Handle global mouseup
  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setDragMode(null);
      }
    };
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [isDragging]);

  // Drag action
  const applyDragAction = (mode: 'paint' | 'erase', measureIndex: number, rowIndex: number, position: number) => {
    const measure = groove.measures[measureIndex];
    if (!measure) return;
    const voices = getVoicesForPosition(measureIndex, rowIndex, position);
    const isActive = isPositionActive(measureIndex, rowIndex, position);

    if (mode === 'paint' && !isActive) {
      voices.forEach(voice => onNoteToggle(voice, position, measureIndex));
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
  };

  const handleMouseDown = (event: React.MouseEvent, measureIndex: number, rowIndex: number, position: number) => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      setIsDragging(true);
      setDragMode('paint');
      setDragMeasureIndex(measureIndex);
      applyDragAction('paint', measureIndex, rowIndex, position);
    } else if (event.altKey || event.shiftKey) {
      event.preventDefault();
      setIsDragging(true);
      setDragMode('erase');
      setDragMeasureIndex(measureIndex);
      applyDragAction('erase', measureIndex, rowIndex, position);
    }
  };

  const handleMouseEnter = (measureIndex: number, rowIndex: number, position: number) => {
    if (isDragging && dragMode && measureIndex === dragMeasureIndex) {
      applyDragAction(dragMode, measureIndex, rowIndex, position);
    }
  };

  const handleTouchStart = (_event: React.TouchEvent, measureIndex: number, rowIndex: number, position: number) => {
    setTouchStartTime(Date.now());
    setTouchMoved(false);
    setIsDragging(true);
    setDragMode('paint');
    setDragMeasureIndex(measureIndex);
    applyDragAction('paint', measureIndex, rowIndex, position);
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    setTouchMoved(true);
    if (!isDragging) return;
    const touch = event.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (element && element.classList.contains('drum-cell')) {
      const cellButton = element as HTMLButtonElement;
      const mIdx = parseInt(cellButton.dataset.measureIndex || '-1');
      const rIdx = parseInt(cellButton.dataset.rowIndex || '-1');
      const pos = parseInt(cellButton.dataset.position || '-1');
      if (mIdx >= 0 && rIdx >= 0 && pos >= 0 && dragMode && mIdx === dragMeasureIndex) {
        applyDragAction(dragMode, mIdx, rIdx, pos);
      }
    }
  };

  const handleTouchEnd = (event: React.TouchEvent, measureIndex: number, rowIndex: number, position: number) => {
    const touchDuration = Date.now() - touchStartTime;
    if (touchDuration > 500 && !touchMoved) {
      event.preventDefault();
      handleRightClick(event as unknown as React.MouseEvent, measureIndex, rowIndex, position);
    }
    setIsDragging(false);
    setDragMode(null);
    setTouchMoved(false);
  };

  const handleLeftClick = (event: React.MouseEvent, measureIndex: number, rowIndex: number, position: number) => {
    if (isDragging) return;
    const measure = groove.measures[measureIndex];
    if (!measure) return;

    if (advancedEditMode) {
      handleRightClick(event, measureIndex, rowIndex, position);
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
      // First, clear any existing notes for this row at this position
      // This ensures only one variation is active per beat per row
      const row = DRUM_ROWS[rowIndex];
      row.variations.forEach(v => {
        v.voices.forEach(voice => {
          if (measure.notes[voice]?.[position]) {
            onNoteToggle(voice, position, measureIndex);
          }
        });
      });
      // Then turn on selected voices
      voices.forEach(voice => onNoteToggle(voice, position, measureIndex));
      onPreview(voices[0]);
    }
  };

  const handleRightClick = (event: React.MouseEvent, measureIndex: number, rowIndex: number, position: number) => {
    event.preventDefault();
    const row = DRUM_ROWS[rowIndex];
    if (row.variations.length > 1) {
      setContextMenu({ visible: true, x: event.clientX, y: event.clientY, rowIndex, position, measureIndex });
    }
  };

  const handleVoiceSelect = (voices: DrumVoice[]) => {
    if (!contextMenu) return;
    const { measureIndex, rowIndex, position } = contextMenu;
    const measure = groove.measures[measureIndex];
    if (!measure) return;

    const key = `${measureIndex}-${rowIndex}-${position}`;
    setVoiceSelections(prev => ({ ...prev, [key]: voices }));

    // Use batch update if available to avoid React state batching issues
    if (onSetNotes) {
      const changes: NoteChange[] = [];

      // Clear any existing notes for this row at this position
      const row = DRUM_ROWS[rowIndex];
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
      // Fallback to individual toggles (may have stale state issues)
      const row = DRUM_ROWS[rowIndex];
      row.variations.forEach(v => {
        v.voices.forEach(voice => {
          if (measure.notes[voice]?.[position]) {
            onNoteToggle(voice, position, measureIndex);
          }
        });
      });
      voices.forEach(voice => onNoteToggle(voice, position, measureIndex));
    }

    onPreview(voices[0]);
    setContextMenu(null);
  };

  const handleVoiceLabelClick = (rowIndex: number, measureIndex: number) => {
    setBulkDialog({ visible: true, rowIndex, measureIndex });
  };

  const getBulkPatternsForRow = (rowIndex: number): BulkPattern[] => {
    const rowName = DRUM_ROWS[rowIndex].name;
    if (rowName === 'Hi-Hat') return HI_HAT_PATTERNS;
    if (rowName === 'Snare') return SNARE_PATTERNS;
    if (rowName === 'Kick') return KICK_PATTERNS;
    return [];
  };

  const handleBulkPatternSelect = (pattern: BulkPattern) => {
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
        pattern.voices.forEach(voice => onNoteToggle(voice, pos, measureIndex));
      }
    }

    if (pattern.voices.length > 0) {
      onPreview(pattern.voices[0]);
    }
  };

  const getPositionsForMeasure = (measureIndex: number): number[] => {
    const measure = groove.measures[measureIndex];
    const ts = measure?.timeSignature || groove.timeSignature;
    const posCount = GrooveUtils.calcNotesPerMeasure(groove.division, ts.beats, ts.noteValue);
    return Array.from({ length: posCount }, (_, i) => i);
  };

  // RENDER
  return (
    <div className={`flex flex-wrap gap-6 mt-6 ${isDragging ? 'select-none' : ''}`}>
      {groove.measures.map((measure, measureIndex) => {
        const positions = getPositionsForMeasure(measureIndex);
        const ts = measure.timeSignature || groove.timeSignature;
        const canAdd = groove.measures.length < MAX_MEASURES;
        const canRemove = groove.measures.length > 1;

        return (
          <div
            key={measureIndex}
            className="inline-block bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4"
          >
            {/* Measure Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-lg font-semibold text-purple-600 dark:text-purple-400">
                Measure {measureIndex + 1}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onMeasureClear?.(measureIndex)}
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group"
                  title="Clear measure"
                >
                  <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white" />
                </button>
                <button
                  onClick={() => onMeasureDuplicate?.(measureIndex)}
                  disabled={!canAdd}
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                  title="Duplicate measure"
                >
                  <Copy className="w-4 h-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white" />
                </button>
                <button
                  onClick={() => onMeasureAdd?.(measureIndex)}
                  disabled={!canAdd}
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                  title="Add measure"
                >
                  <Plus className="w-4 h-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white" />
                </button>
                <button
                  onClick={() => onMeasureRemove?.(measureIndex)}
                  disabled={!canRemove}
                  className="w-8 h-8 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                  title="Delete measure"
                >
                  <X className="w-4 h-4 text-red-500 dark:text-red-400 group-hover:text-red-600 dark:group-hover:text-red-300" />
                </button>
              </div>
            </div>

            {/* Beat Labels Row */}
            <div className="flex items-center mb-2">
              <div className="w-24 flex-shrink-0" />
              {positions.map((pos) => {
                const countLabel = GrooveUtils.getCountLabel(pos, groove.division, ts.beats);
                return (
                  <div
                    key={pos}
                    className={`w-12 text-center text-xs font-medium ${
                      isDownbeat(pos) ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {countLabel}
                  </div>
                );
              })}
            </div>

            {/* Drum Rows */}
            {DRUM_ROWS.map((row, rowIndex) => (
              <div key={rowIndex} className="flex items-center mb-1 last:mb-0">
                <button
                  onClick={() => handleVoiceLabelClick(rowIndex, measureIndex)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    onPreview(row.defaultVoices[0]);
                  }}
                  className="w-24 flex-shrink-0 px-3 py-2 text-right text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                  title="Click for patterns, right-click to preview"
                >
                  {row.name}
                </button>

                {positions.map((pos) => {
                  const isActive = isPositionActive(measureIndex, rowIndex, pos);
                  const absolutePos = GrooveUtils.measureToAbsolutePosition(groove, measureIndex, pos);
                  const isDown = isDownbeat(pos);
                  const hasVariations = row.variations.length > 1;
                  const variationLabel = getVariationLabel(measureIndex, rowIndex, pos);
                  const isNonDefault = variationLabel !== row.variations[0].label;
                  const activeVoices = getActiveVoices(measureIndex, rowIndex, pos);

                  return (
                    <button
                      key={pos}
                      className={`drum-cell w-12 h-10 border cursor-pointer transition-all duration-150 flex items-center justify-center relative
                        ${isActive ? 'bg-purple-600 hover:bg-purple-700 border-purple-500' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-600'}
                        ${isDown ? 'border-l-slate-400 dark:border-l-slate-500' : ''}
                      `}
                      data-measure-index={measureIndex}
                      data-row-index={rowIndex}
                      data-position={pos}
                      data-absolute-pos={absolutePos}
                      onClick={(e) => handleLeftClick(e, measureIndex, rowIndex, pos)}
                      onMouseDown={(e) => handleMouseDown(e, measureIndex, rowIndex, pos)}
                      onMouseEnter={() => handleMouseEnter(measureIndex, rowIndex, pos)}
                      onContextMenu={(e) => handleRightClick(e, measureIndex, rowIndex, pos)}
                      onTouchStart={(e) => handleTouchStart(e, measureIndex, rowIndex, pos)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={(e) => handleTouchEnd(e, measureIndex, rowIndex, pos)}
                      title={`${row.name} - ${variationLabel} at position ${pos + 1}${hasVariations ? ' (right-click for options)' : ''}`}
                    >
                      <NoteIcon voices={activeVoices} isActive={isActive} />
                      {isActive && isNonDefault && hasVariations && (
                        <span className="absolute top-0 right-0.5 text-xs text-white/70">*</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        );
      })}

      {/* Context Menu */}
      {contextMenu?.visible && (
        <div
          ref={contextMenuRef}
          className="fixed z-50 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg py-2 min-w-[200px]"
          style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
        >
          <div className="px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-600 mb-1">
            {DRUM_ROWS[contextMenu.rowIndex].name} - Select Sound
          </div>
          {DRUM_ROWS[contextMenu.rowIndex].variations.map((variation, index) => {
            const selectedVoices = getVoicesForPosition(contextMenu.measureIndex, contextMenu.rowIndex, contextMenu.position);
            const isSelected = variation.voices.length === selectedVoices.length &&
              variation.voices.every(v => selectedVoices.includes(v));

            return (
              <button
                key={index}
                className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors
                  ${isSelected ? 'text-purple-600 dark:text-purple-400' : 'text-slate-700 dark:text-slate-200'}
                `}
                onClick={() => handleVoiceSelect(variation.voices)}
                onMouseEnter={() => onPreview(variation.voices[0])}
              >
                <span className="flex items-center gap-2">
                  {isSelected && <span className="text-purple-600 dark:text-purple-400">✓</span>}
                  {variation.label}
                </span>
                {variation.shortcut && (
                  <span className="text-xs text-slate-400">{variation.shortcut}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Bulk Operations Dialog */}
      {bulkDialog?.visible && (
        <BulkOperationsDialog
          visible={bulkDialog.visible}
          rowName={DRUM_ROWS[bulkDialog.rowIndex].name}
          patterns={getBulkPatternsForRow(bulkDialog.rowIndex)}
          onPatternSelect={handleBulkPatternSelect}
          onClose={() => setBulkDialog(null)}
        />
      )}
    </div>
  );
}
