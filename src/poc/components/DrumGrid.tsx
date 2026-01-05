import { GrooveData, DrumVoice } from '../../types';
import { GrooveUtils } from '../../core';
import { useState, useRef, useEffect } from 'react';
import './DrumGrid.css';

interface DrumGridProps {
  groove: GrooveData;
  currentPosition: number;
  onNoteToggle: (voice: DrumVoice, position: number) => void;
  onPreview: (voice: DrumVoice) => void;
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

function DrumGrid({ groove, currentPosition, onNoteToggle, onPreview }: DrumGridProps) {
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

  // Handle left click - toggle notes with selected voices
  const handleLeftClick = (rowIndex: number, position: number) => {
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

  return (
    <div className="drum-grid">
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
                  onClick={() => onPreview(row.defaultVoices[0])}
                  title={`Click to preview ${row.name}`}
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

                  return (
                    <button
                      key={pos}
                      className={`note-cell ${isActive ? 'active' : ''} ${
                        isCurrent ? 'current' : ''
                      } ${isDown ? 'downbeat' : ''} ${hasVariations ? 'has-variations' : ''} ${isNonDefault ? 'non-default' : ''}`}
                      onClick={() => handleLeftClick(rowIndex, pos)}
                      onContextMenu={(e) => handleRightClick(e, rowIndex, pos)}
                      title={`${row.name} - ${variationLabel} at position ${pos + 1}${hasVariations ? ' (right-click for options)' : ''}`}
                    >
                      {isActive && <span className="note-dot">●</span>}
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
    </div>
  );
}

export default DrumGrid;

