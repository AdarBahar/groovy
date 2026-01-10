import { useState, useEffect, useCallback, useMemo } from 'react';
import { GrooveData, DEFAULT_GROOVE, DrumVoice, TimeSignature, Division, ALL_DRUM_VOICES, createEmptyNotesRecord, MAX_MEASURES } from '../types';
import { SyncMode, GrooveUtils } from '../core';
import { useGrooveEngine } from '../hooks/useGrooveEngine';
import { useHistory } from '../hooks/useHistory';
import { useURLSync } from '../hooks/useURLSync';
import { useAutoSpeedUp } from '../hooks/useAutoSpeedUp';
import DrumGrid, { NoteChange } from './DrumGrid';
import PlaybackControls from './PlaybackControls';
import TempoControl from './TempoControl';
import PresetSelector from './PresetSelector';
import SyncControl from './SyncControl';
import TimeSignatureSelector from './TimeSignatureSelector';
import DivisionSelector from './DivisionSelector';
import EditModeToggle from './EditModeToggle';
import UndoRedoControls from './UndoRedoControls';
import SheetMusicDisplay from './SheetMusicDisplay';
import ShareButton from './ShareButton';
import MetadataEditor from './MetadataEditor';
import AutoSpeedUpConfig from './AutoSpeedUpConfig';
import AutoSpeedUpIndicator from './AutoSpeedUpIndicator';
import SyncOffsetControl, { loadSyncOffset } from './SyncOffsetControl';
import './GrooveEditor.css';

function App() {
  const [syncMode, setSyncMode] = useState<SyncMode>('start');
  const [advancedEditMode, setAdvancedEditMode] = useState(false);
  const [showSheetMusic, setShowSheetMusic] = useState(true);
  const [showSpeedUpConfig, setShowSpeedUpConfig] = useState(false);
  const [syncOffset, setSyncOffset] = useState<number>(loadSyncOffset);

  // Use history hook for undo/redo
  const {
    state: groove,
    setState: setGroove,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistory<GrooveData>(DEFAULT_GROOVE, 50);

  // Use the GrooveEngine hook (this is the ONLY React-specific integration)
  const {
    isPlaying,
    currentPosition,
    togglePlayback,
    updateGroove,
    setSyncMode: setEngineSyncMode,
    playPreview,
    play,
    stop,
  } = useGrooveEngine();

  // URL sync: load groove from URL on init, update URL on changes
  const { copyURLToClipboard } = useURLSync(groove, setGroove);

  // Auto Speed Up hook
  const autoSpeedUp = useAutoSpeedUp({
    tempo: groove.tempo,
    onTempoChange: (tempo) => {
      const newGroove = { ...groove, tempo };
      setGroove(newGroove);
      updateGroove(newGroove);
    },
    isPlaying,
  });

  // Calculate visual position adjusted by sync offset
  // Positive offset = delay visual (subtract positions)
  // Negative offset = advance visual (add positions)
  const visualPosition = useMemo(() => {
    if (currentPosition < 0 || !isPlaying) return currentPosition;

    // Convert offset (ms) to positions
    // ms_per_beat = 60000 / tempo
    // positions_per_beat = division / 4 (for quarter note = 1 beat)
    // ms_per_position = ms_per_beat / positions_per_beat = 60000 / tempo / (division / 4)
    const msPerPosition = (60000 / groove.tempo) / (groove.division / 4);
    const positionOffset = Math.round(syncOffset / msPerPosition);

    // Total positions for wrapping
    const totalPositions = GrooveUtils.getTotalPositions(groove);

    // Apply offset (positive offset = delay visual = show earlier position)
    let adjusted = currentPosition - positionOffset;

    // Wrap around
    if (adjusted < 0) {
      adjusted = totalPositions + adjusted;
    } else if (adjusted >= totalPositions) {
      adjusted = adjusted % totalPositions;
    }

    return adjusted;
  }, [currentPosition, syncOffset, groove.tempo, groove.division, groove, isPlaying]);

  // Initialize sync mode to 'start' on mount
  useEffect(() => {
    setEngineSyncMode('start');
  }, [setEngineSyncMode]);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Undo: Ctrl+Z (Cmd+Z on Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        if (canUndo) {
          undo();
          // Update engine with undone state
          setTimeout(() => updateGroove(groove), 0);
        }
      }
      // Redo: Ctrl+Shift+Z or Ctrl+Y (Cmd+Shift+Z or Cmd+Y on Mac)
      else if (
        ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'z') ||
        ((event.ctrlKey || event.metaKey) && event.key === 'y')
      ) {
        event.preventDefault();
        if (canRedo) {
          redo();
          // Update engine with redone state
          setTimeout(() => updateGroove(groove), 0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo, updateGroove, groove]);

  const handleNoteToggle = (voice: DrumVoice, position: number, measureIndex: number) => {
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
    updateGroove(newGroove);
  };

  // Batch set multiple notes at once (avoids React state batching issues)
  const handleSetNotes = useCallback((changes: NoteChange[]) => {
    const newMeasures = groove.measures.map((measure, measureIdx) => {
      // Get all changes for this measure
      const measureChanges = changes.filter(c => c.measureIndex === measureIdx);
      if (measureChanges.length === 0) return measure;

      // Apply all changes to this measure's notes
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
    updateGroove(newGroove);
  }, [groove, setGroove, updateGroove]);

  // Measure manipulation handlers
  const handleMeasureDuplicate = useCallback((measureIndex: number) => {
    if (groove.measures.length >= MAX_MEASURES) return;
    const measureToCopy = groove.measures[measureIndex];
    // Deep copy the notes
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
    updateGroove(newGroove);
  }, [groove, setGroove, updateGroove]);

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
    updateGroove(newGroove);
  }, [groove, setGroove, updateGroove]);

  const handleMeasureRemove = useCallback((measureIndex: number) => {
    if (groove.measures.length <= 1) return;
    const newMeasures = groove.measures.filter((_, idx) => idx !== measureIndex);
    const newGroove = { ...groove, measures: newMeasures };
    setGroove(newGroove);
    updateGroove(newGroove);
  }, [groove, setGroove, updateGroove]);

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
    updateGroove(newGroove);
  }, [groove, setGroove, updateGroove]);

  const handlePlay = async () => {
    // Stop auto speed up when using regular play
    if (autoSpeedUp.isActive) {
      autoSpeedUp.stop();
    }
    await togglePlayback(groove);
  };

  const handlePlayWithSpeedUp = async () => {
    if (isPlaying) {
      // Stop playback and auto speed up
      autoSpeedUp.stop();
      stop();
    } else {
      // Start playback with auto speed up
      await play(groove);
      autoSpeedUp.start();
    }
  };

  const handleTempoChange = (tempo: number) => {
    const newGroove = { ...groove, tempo };
    setGroove(newGroove);
    updateGroove(newGroove);
  };

  const handleSwingChange = (swing: number) => {
    const newGroove = { ...groove, swing };
    setGroove(newGroove);
    updateGroove(newGroove);
  };

  // Metadata handlers
  const handleTitleChange = useCallback((title: string) => {
    const newGroove = { ...groove, title: title || undefined };
    setGroove(newGroove);
    // Don't call updateGroove for metadata-only changes (no audio impact)
  }, [groove, setGroove]);

  const handleAuthorChange = useCallback((author: string) => {
    const newGroove = { ...groove, author: author || undefined };
    setGroove(newGroove);
  }, [groove, setGroove]);

  const handleCommentsChange = useCallback((comments: string) => {
    const newGroove = { ...groove, comments: comments || undefined };
    setGroove(newGroove);
  }, [groove, setGroove]);

  const handlePresetChange = (preset: GrooveData) => {
    setGroove(preset);
    updateGroove(preset);
  };

  const handlePreview = async (voice: DrumVoice) => {
    await playPreview(voice);
  };

  const handleSyncModeChange = (mode: SyncMode) => {
    setSyncMode(mode);
    setEngineSyncMode(mode);
  };

  const handleTimeSignatureChange = async (timeSignature: TimeSignature) => {
    const wasPlaying = isPlaying;

    // Stop playback if playing
    if (wasPlaying) {
      stop();
    }

    const oldDivision = groove.division;

    // Check if current division is compatible with new time signature
    let newDivision = oldDivision;
    if (!GrooveUtils.isDivisionCompatible(oldDivision, timeSignature.beats, timeSignature.noteValue)) {
      newDivision = GrooveUtils.getDefaultDivision(timeSignature.beats, timeSignature.noteValue);
      console.info(`Division ${oldDivision} incompatible with ${timeSignature.beats}/${timeSignature.noteValue}, switching to ${newDivision}`);
    }

    const newNotesPerMeasure = GrooveUtils.calcNotesPerMeasure(
      newDivision,
      timeSignature.beats,
      timeSignature.noteValue
    );

    // Resize notes in each measure
    const newMeasures = groove.measures.map((measure) => {
      const oldTs = measure.timeSignature || groove.timeSignature;
      const oldNotesPerMeasure = GrooveUtils.calcNotesPerMeasure(oldDivision, oldTs.beats, oldTs.noteValue);

      const newNotes: Record<DrumVoice, boolean[]> = {} as Record<DrumVoice, boolean[]>;
      for (const voice of ALL_DRUM_VOICES) {
        newNotes[voice] = GrooveUtils.resizeNotesArray(
          measure.notes[voice],
          oldNotesPerMeasure,
          newNotesPerMeasure
        );
      }
      return {
        ...measure,
        timeSignature: undefined, // Clear per-measure overrides when global changes
        notes: newNotes,
      };
    });

    const newGroove: GrooveData = {
      ...groove,
      timeSignature,
      division: newDivision,
      measures: newMeasures,
      swing: GrooveUtils.doesDivisionSupportSwing(newDivision) ? groove.swing : 0,
    };

    setGroove(newGroove);
    updateGroove(newGroove);

    // Restart playback from the beginning if it was playing
    if (wasPlaying) {
      await play(newGroove);
    }
  };

  const handleDivisionChange = async (division: Division) => {
    const wasPlaying = isPlaying;

    // Stop playback if playing
    if (wasPlaying) {
      stop();
    }

    // Resize notes in each measure
    const newMeasures = groove.measures.map((measure) => {
      const ts = measure.timeSignature || groove.timeSignature;
      const oldNotesPerMeasure = GrooveUtils.calcNotesPerMeasure(groove.division, ts.beats, ts.noteValue);
      const newNotesPerMeasure = GrooveUtils.calcNotesPerMeasure(division, ts.beats, ts.noteValue);

      const newNotes: Record<DrumVoice, boolean[]> = {} as Record<DrumVoice, boolean[]>;
      for (const voice of ALL_DRUM_VOICES) {
        newNotes[voice] = GrooveUtils.resizeNotesArray(
          measure.notes[voice],
          oldNotesPerMeasure,
          newNotesPerMeasure
        );
      }
      return { ...measure, notes: newNotes };
    });

    const newGroove: GrooveData = {
      ...groove,
      division,
      measures: newMeasures,
      swing: GrooveUtils.doesDivisionSupportSwing(division) ? groove.swing : 0,
    };

    setGroove(newGroove);
    updateGroove(newGroove);

    // Restart playback from the beginning if it was playing
    if (wasPlaying) {
      await play(newGroove);
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🥁 GrooveScribe POC</h1>
        <p className="subtitle">Drum Timing & Sound Test</p>
      </header>

      <main className="main">
        <section className="controls-section">
          <div className="controls-row">
            <TimeSignatureSelector
              timeSignature={groove.timeSignature}
              onTimeSignatureChange={handleTimeSignatureChange}
            />

            <PresetSelector onPresetChange={handlePresetChange} />

            <PlaybackControls
              isPlaying={isPlaying}
              onPlay={handlePlay}
              onPlayWithSpeedUp={handlePlayWithSpeedUp}
              isAutoSpeedUpActive={autoSpeedUp.isActive}
              onConfigureSpeedUp={() => setShowSpeedUpConfig(!showSpeedUpConfig)}
            />
          </div>

          {/* Auto Speed Up Config Panel */}
          {showSpeedUpConfig && (
            <div className="controls-row">
              <AutoSpeedUpConfig
                config={autoSpeedUp.config}
                onConfigChange={autoSpeedUp.setConfig}
                onSaveAsDefault={autoSpeedUp.saveAsDefault}
                onClose={() => setShowSpeedUpConfig(false)}
              />
            </div>
          )}

          {/* Auto Speed Up Indicator */}
          {autoSpeedUp.isActive && (
            <div className="controls-row">
              <AutoSpeedUpIndicator
                config={autoSpeedUp.config}
                state={autoSpeedUp.state}
                currentTempo={groove.tempo}
              />
            </div>
          )}

          <div className="controls-row">
            <DivisionSelector
              division={groove.division}
              timeSignature={groove.timeSignature}
              onDivisionChange={handleDivisionChange}
            />
          </div>

          <div className="controls-row">
            <TempoControl
              tempo={groove.tempo}
              swing={groove.swing}
              division={groove.division}
              onTempoChange={handleTempoChange}
              onSwingChange={handleSwingChange}
            />

            <SyncControl
              syncMode={syncMode}
              onSyncModeChange={handleSyncModeChange}
            />

            <SyncOffsetControl
              offset={syncOffset}
              onOffsetChange={setSyncOffset}
            />
          </div>
        </section>

        <section className="grid-section">
          <div className="grid-header">
            <EditModeToggle
              advancedMode={advancedEditMode}
              onToggle={setAdvancedEditMode}
            />

            <UndoRedoControls
              canUndo={canUndo}
              canRedo={canRedo}
              onUndo={undo}
              onRedo={redo}
            />

            <button
              className={`toggle-button ${showSheetMusic ? 'active' : ''}`}
              onClick={() => setShowSheetMusic(!showSheetMusic)}
              title={showSheetMusic ? 'Hide sheet music' : 'Show sheet music'}
            >
              🎼 {showSheetMusic ? 'Hide' : 'Show'} Notation
            </button>

            <ShareButton onCopyURL={copyURLToClipboard} />
          </div>

          <MetadataEditor
            title={groove.title || ''}
            author={groove.author || ''}
            comments={groove.comments || ''}
            onTitleChange={handleTitleChange}
            onAuthorChange={handleAuthorChange}
            onCommentsChange={handleCommentsChange}
          />

          {/* Sheet music above editor for visual alignment */}
          <SheetMusicDisplay
            groove={groove}
            visible={showSheetMusic}
            currentPosition={visualPosition}
            isPlaying={isPlaying}
          />

          <DrumGrid
            groove={groove}
            currentPosition={visualPosition}
            onNoteToggle={handleNoteToggle}
            onSetNotes={handleSetNotes}
            onPreview={handlePreview}
            advancedEditMode={advancedEditMode}
            onMeasureDuplicate={handleMeasureDuplicate}
            onMeasureAdd={handleMeasureAdd}
            onMeasureRemove={handleMeasureRemove}
            onMeasureClear={handleMeasureClear}
          />
        </section>

        <footer className="shortcuts-footer">
          <span><kbd>Space</kbd> Play/Pause</span>
          <span><kbd>E</kbd> Edit Mode</span>
          <span><kbd>⌘/Ctrl</kbd>+drag Paint</span>
          <span><kbd>⇧/Alt</kbd>+drag Erase</span>
          <span><kbd>⌘Z</kbd> Undo</span>
          <span><kbd>⌘⇧Z</kbd> Redo</span>
        </footer>
      </main>
    </div>
  );
}

export default App;

