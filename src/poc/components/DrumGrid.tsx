import { GrooveData, DrumVoice } from '../../types';
import { GrooveUtils, HI_HAT_PATTERNS, SNARE_PATTERNS, KICK_PATTERNS, BulkPattern } from '../../core';
import { useState, useRef, useEffect } from 'react';
import BulkOperationsDialog from './BulkOperationsDialog';
import NoteIcon from './NoteIcon';
import './DrumGrid.css';

interface DrumGridProps {
  groove: GrooveData;
  currentPosition: number;
  onNoteToggle: (voice: DrumVoice, position: number) => void;
  onPreview: (voice: DrumVoice) => void;
  advancedEditMode?: boolean;
}

// Define drum rows with their variations
interface DrumRow {
  name: string;
  defaultVoices: DrumVoice[]; // Can be multiple voices
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
    name: 'Tom 1',
    defaultVoices: ['tom-10'],
    variations: [
      { voices: ['tom-10'], label: 'Tom 1' },
    ],
  },
  {
    name: 'Tom 2',
    defaultVoices: ['tom-16'],
    variations: [
      { voices: ['tom-16'], label: 'Tom 2' },
    ],
  },
  {
    name: 'Floor Tom',
    defaultVoices: ['tom-floor'],
    variations: [
      { voices: ['tom-floor'], label: 'Floor Tom' },
    ],
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

function DrumGrid({ groove, currentPosition, onNoteToggle, onPreview, advancedEditMode = false }: DrumGridProps) {
  const positions = Array.from({ length: groove.division }, (_, i) => i);

  // Track which voices are selected for each row at each position
  // Key format: "rowIndex-position" -> DrumVoice[]
  const [voiceSelections, setVoiceSelections] = useState<Record<string, DrumVoice[]>>(() => {
    const initial: Record<string, DrumVoice[]> = {};
    DRUM_ROWS.forEach((row, rowIndex) => {
      positions.forEach((pos) => {
        initial[`${rowIndex}-${pos}`] = row.defaultVoices;
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
  } | null>(null);

  // Drag-to-paint state
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'paint' | 'erase' | null>(null);

  // Touch support state
  const [touchStartTime, setTouchStartTime] = useState<number>(0);
  const [touchMoved, setTouchMoved] = useState(false);

  // Bulk operations dialog state
  const [bulkDialog, setBulkDialog] = useState<{
    visible: boolean;
    rowIndex: number;
    measureIndex: number;
  } | null>(null);

  const contextMenuRef = useRef<HTMLDivElement>(null);

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
  }, [contextMenu]);

  // Handle global mouseup to end drag operations
  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setDragMode(null);
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Determine if a position is a downbeat based on time signature
  // Downbeats occur at the start of each beat
  const isDownbeat = (pos: number) => {
    const notesPerBeat = groove.division / groove.timeSignature.beats;
    return pos % notesPerBeat === 0;
  };

  // Calculate notes per measure
  const notesPerMeasure = GrooveUtils.calcNotesPerMeasure(
    groove.division,
    groove.timeSignature.beats,
    groove.timeSignature.noteValue
  );

  // Split into two measures
  const measure1 = positions.slice(0, notesPerMeasure);
  const measure2 = positions.slice(notesPerMeasure, notesPerMeasure * 2);
  const measures = [measure1, measure2].filter(m => m.length > 0);

  // Get the selected voices for a row at a position
  const getVoicesForPosition = (rowIndex: number, position: number): DrumVoice[] => {
    return voiceSelections[`${rowIndex}-${position}`] || DRUM_ROWS[rowIndex].defaultVoices;
  };

  // Check if any voice in the row is active at this position
  const isPositionActive = (rowIndex: number, position: number): boolean => {
    const row = DRUM_ROWS[rowIndex];
    return row.variations.some(v => v.voices.some(voice => groove.notes[voice]?.[position]));
  };

  // Get the label for the current variation at this position
  const getVariationLabel = (rowIndex: number, position: number): string => {
    const row = DRUM_ROWS[rowIndex];
    const selectedVoices = getVoicesForPosition(rowIndex, position);
    const variation = row.variations.find(v =>
      v.voices.length === selectedVoices.length &&
      v.voices.every(voice => selectedVoices.includes(voice))
    );
    return variation?.label || row.variations[0].label;
  };

  // Get the active voices at a position (voices that are actually turned on)
  const getActiveVoices = (rowIndex: number, position: number): DrumVoice[] => {
    const row = DRUM_ROWS[rowIndex];
    const activeVoices: DrumVoice[] = [];
    row.variations.forEach(v => {
      v.voices.forEach(voice => {
        if (groove.notes[voice]?.[position] && !activeVoices.includes(voice)) {
          activeVoices.push(voice);
        }
      });
    });
    return activeVoices;
  };

  // Handle mouse down - start drag operation if Ctrl/Alt/Shift is pressed
  const handleMouseDown = (event: React.MouseEvent, rowIndex: number, position: number) => {
    // Check for drag modifiers:
    // - Ctrl/Cmd for paint
    // - Alt/Option or Shift for erase (Shift is more reliable on Mac)
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      setIsDragging(true);
      setDragMode('paint');
      // Apply paint action to current cell
      applyDragAction('paint', rowIndex, position);
    } else if (event.altKey || event.shiftKey) {
      event.preventDefault();
      setIsDragging(true);
      setDragMode('erase');
      // Apply erase action to current cell
      applyDragAction('erase', rowIndex, position);
    }
  };

  // Handle mouse enter - continue drag operation
  const handleMouseEnter = (rowIndex: number, position: number) => {
    if (isDragging && dragMode) {
      applyDragAction(dragMode, rowIndex, position);
    }
  };

  // Apply drag action (paint or erase)
  const applyDragAction = (mode: 'paint' | 'erase', rowIndex: number, position: number) => {
    const voices = getVoicesForPosition(rowIndex, position);
    const isActive = isPositionActive(rowIndex, position);

    if (mode === 'paint' && !isActive) {
      // Paint: turn on selected voices
      voices.forEach(voice => {
        onNoteToggle(voice, position);
      });
    } else if (mode === 'erase' && isActive) {
      // Erase: turn off all voices for this row at this position
      const row = DRUM_ROWS[rowIndex];
      row.variations.forEach(v => {
        v.voices.forEach(voice => {
          if (groove.notes[voice]?.[position]) {
            onNoteToggle(voice, position);
          }
        });
      });
    }
  };

  // Touch event handlers for mobile support
  const handleTouchStart = (event: React.TouchEvent, rowIndex: number, position: number) => {
    setTouchStartTime(Date.now());
    setTouchMoved(false);

    // Start drag mode (paint by default on touch)
    setIsDragging(true);
    setDragMode('paint');
    applyDragAction('paint', rowIndex, position);
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    setTouchMoved(true);

    if (!isDragging) return;

    // Get the element under the touch point
    const touch = event.touches[0];
    const element = document.elementFromPoint(touch.clientX, touch.clientY);

    if (element && element.classList.contains('note-cell')) {
      // Extract row and position from data attributes
      const cellButton = element as HTMLButtonElement;
      const rowIndex = parseInt(cellButton.dataset.rowIndex || '-1');
      const position = parseInt(cellButton.dataset.position || '-1');

      if (rowIndex >= 0 && position >= 0 && dragMode) {
        applyDragAction(dragMode, rowIndex, position);
      }
    }
  };

  const handleTouchEnd = (event: React.TouchEvent, rowIndex: number, position: number) => {
    const touchDuration = Date.now() - touchStartTime;

    // If touch was held for > 500ms and didn't move much, treat as long-press (context menu)
    if (touchDuration > 500 && !touchMoved) {
      event.preventDefault();
      handleRightClick(event as unknown as React.MouseEvent, rowIndex, position);
    }

    // End drag mode
    setIsDragging(false);
    setDragMode(null);
    setTouchMoved(false);
  };

  // Handle left click - toggle notes with selected voices (or open menu in advanced mode)
  const handleLeftClick = (event: React.MouseEvent, rowIndex: number, position: number) => {
    // Don't handle click if we're dragging
    if (isDragging) {
      return;
    }

    // In advanced mode, left-click delegates to right-click behavior
    if (advancedEditMode) {
      handleRightClick(event, rowIndex, position);
      return;
    }

    // Simple mode: toggle notes with selected voices
    const voices = getVoicesForPosition(rowIndex, position);
    const isActive = isPositionActive(rowIndex, position);

    if (isActive) {
      // Turn off all voices for this row at this position
      const row = DRUM_ROWS[rowIndex];
      row.variations.forEach(v => {
        v.voices.forEach(voice => {
          if (groove.notes[voice]?.[position]) {
            onNoteToggle(voice, position);
          }
        });
      });
    } else {
      // Turn on selected voices
      voices.forEach(voice => {
        onNoteToggle(voice, position);
      });
      // Preview first voice
      onPreview(voices[0]);
    }
  };

  // Handle right click - show context menu
  const handleRightClick = (event: React.MouseEvent, rowIndex: number, position: number) => {
    event.preventDefault();
    const row = DRUM_ROWS[rowIndex];

    // Only show menu if there are variations
    if (row.variations.length > 1) {
      setContextMenu({
        visible: true,
        x: event.clientX,
        y: event.clientY,
        rowIndex,
        position,
      });
    }
  };

  // Handle voice selection from context menu
  const handleVoiceSelect = (voices: DrumVoice[]) => {
    if (!contextMenu) return;

    const { rowIndex, position } = contextMenu;
    const key = `${rowIndex}-${position}`;

    // Update voice selection for this position
    setVoiceSelections(prev => ({
      ...prev,
      [key]: voices,
    }));

    // Clear any existing notes for this row at this position
    const row = DRUM_ROWS[rowIndex];
    row.variations.forEach(v => {
      v.voices.forEach(voice => {
        if (groove.notes[voice]?.[position]) {
          onNoteToggle(voice, position);
        }
      });
    });

    // Set the new voices
    voices.forEach(voice => {
      onNoteToggle(voice, position);
    });

    // Preview first voice
    onPreview(voices[0]);

    // Close menu
    setContextMenu(null);
  };

  // Handle voice label click - open bulk operations dialog
  const handleVoiceLabelClick = (rowIndex: number, measureIndex: number) => {
    setBulkDialog({ visible: true, rowIndex, measureIndex });
  };

  // Get bulk patterns for a row
  const getBulkPatternsForRow = (rowIndex: number): BulkPattern[] => {
    const rowName = DRUM_ROWS[rowIndex].name;
    if (rowName === 'Hi-Hat') return HI_HAT_PATTERNS;
    if (rowName === 'Snare') return SNARE_PATTERNS;
    if (rowName === 'Kick') return KICK_PATTERNS;
    return []; // Toms don't have bulk patterns yet
  };

  // Apply bulk pattern to a measure
  const handleBulkPatternSelect = (pattern: BulkPattern) => {
    if (!bulkDialog) return;

    const { rowIndex, measureIndex } = bulkDialog;
    const measure = measures[measureIndex];
    const row = DRUM_ROWS[rowIndex];

    // First, clear all voices for this row in this measure
    measure.forEach(pos => {
      row.variations.forEach(v => {
        v.voices.forEach(voice => {
          if (groove.notes[voice]?.[pos]) {
            onNoteToggle(voice, pos);
          }
        });
      });
    });

    // Then, apply the pattern
    measure.forEach(pos => {
      const shouldBeOn = pattern.pattern(pos % notesPerMeasure, notesPerMeasure);
      if (shouldBeOn && pattern.voices.length > 0) {
        pattern.voices.forEach(voice => {
          onNoteToggle(voice, pos);
        });
      }
    });

    // Preview the first voice if pattern has voices
    if (pattern.voices.length > 0) {
      onPreview(pattern.voices[0]);
    }
  };

  return (
    <div className={`drum-grid ${isDragging ? 'dragging' : ''}`}>
      <div className="measures-container">
        {measures.map((measure, measureIndex) => (
          <div key={measureIndex} className="measure">
            <div className="measure-label">Measure {measureIndex + 1}</div>

            {/* Count labels header */}
            <div className="grid-header">
              <div className="voice-label-header">Drum</div>
              {measure.map((pos) => {
                const countLabel = GrooveUtils.getCountLabel(
                  pos % notesPerMeasure,
                  groove.division,
                  groove.timeSignature.beats
                );
                return (
                  <div
                    key={pos}
                    className={`count-label ${isDownbeat(pos) ? 'downbeat' : ''}`}
                  >
                    {countLabel}
                  </div>
                );
              })}
            </div>

            {/* Drum rows */}
            {DRUM_ROWS.map((row, rowIndex) => (
              <div key={rowIndex} className="drum-row">
                <button
                  className="voice-label"
                  onClick={() => handleVoiceLabelClick(rowIndex, measureIndex)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    onPreview(row.defaultVoices[0]);
                  }}
                  title={`Click for bulk operations, right-click to preview ${row.name}`}
                >
                  {row.name}
                </button>

                {measure.map((pos) => {
                  const isActive = isPositionActive(rowIndex, pos);
                  const isCurrent = pos === currentPosition;
                  const isDown = isDownbeat(pos);
                  const variationLabel = getVariationLabel(rowIndex, pos);
                  const hasVariations = row.variations.length > 1;
                  const isNonDefault = variationLabel !== row.variations[0].label;
                  const activeVoices = getActiveVoices(rowIndex, pos);

                  return (
                    <button
                      key={pos}
                      className={`note-cell ${isActive ? 'active' : ''} ${
                        isCurrent ? 'current' : ''
                      } ${isDown ? 'downbeat' : ''} ${hasVariations ? 'has-variations' : ''} ${isNonDefault ? 'non-default' : ''} ${advancedEditMode ? 'advanced-mode' : ''} ${isDragging ? (dragMode === 'paint' ? 'drag-paint' : 'drag-erase') : ''}`}
                      data-row-index={rowIndex}
                      data-position={pos}
                      onClick={(e) => handleLeftClick(e, rowIndex, pos)}
                      onMouseDown={(e) => handleMouseDown(e, rowIndex, pos)}
                      onMouseEnter={() => handleMouseEnter(rowIndex, pos)}
                      onContextMenu={(e) => handleRightClick(e, rowIndex, pos)}
                      onTouchStart={(e) => handleTouchStart(e, rowIndex, pos)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={(e) => handleTouchEnd(e, rowIndex, pos)}
                      title={`${row.name} - ${variationLabel} at position ${pos + 1}${hasVariations ? (advancedEditMode ? ' (click for options)' : ' (right-click for options)') : ''}`}
                    >
                      <NoteIcon voices={activeVoices} isActive={isActive} />
                      {isActive && isNonDefault && hasVariations && (
                        <span className="variation-indicator">*</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Context Menu */}
      {contextMenu?.visible && (
        <div
          ref={contextMenuRef}
          className="context-menu"
          style={{
            position: 'fixed',
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
        >
          <div className="context-menu-header">
            {DRUM_ROWS[contextMenu.rowIndex].name} - Select Sound
          </div>
          {DRUM_ROWS[contextMenu.rowIndex].variations.map((variation, index) => {
            const selectedVoices = getVoicesForPosition(contextMenu.rowIndex, contextMenu.position);
            const isSelected = variation.voices.length === selectedVoices.length &&
              variation.voices.every(v => selectedVoices.includes(v));

            return (
              <button
                key={index}
                className={`context-menu-item ${isSelected ? 'selected' : ''}`}
                onClick={() => handleVoiceSelect(variation.voices)}
                onMouseEnter={() => onPreview(variation.voices[0])}
              >
                <span className="menu-item-label">{variation.label}</span>
                {variation.shortcut && (
                  <span className="menu-item-shortcut">{variation.shortcut}</span>
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

export default DrumGrid;

