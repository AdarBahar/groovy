import { useState, useEffect } from 'react';
import { GrooveData, DEFAULT_GROOVE, DrumVoice, TimeSignature, Division } from '../types';
import { SyncMode, GrooveUtils } from '../core';
import { useGrooveEngine } from '../hooks/useGrooveEngine';
import { useHistory } from '../hooks/useHistory';
import DrumGrid from './components/DrumGrid';
import PlaybackControls from './components/PlaybackControls';
import TempoControl from './components/TempoControl';
import PresetSelector from './components/PresetSelector';
import SyncControl from './components/SyncControl';
import TimeSignatureSelector from './components/TimeSignatureSelector';
import DivisionSelector from './components/DivisionSelector';
import EditModeToggle from './components/EditModeToggle';
import UndoRedoControls from './components/UndoRedoControls';
import './PocApp.css';

function App() {
  const [syncMode, setSyncMode] = useState<SyncMode>('start');
  const [advancedEditMode, setAdvancedEditMode] = useState(false);

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

  const handleNoteToggle = (voice: DrumVoice, position: number) => {
    const newGroove = {
      ...groove,
      notes: {
        ...groove.notes,
        [voice]: groove.notes[voice].map((note, i) => (i === position ? !note : note)),
      },
    };
    setGroove(newGroove);
    updateGroove(newGroove);
  };

  const handlePlay = async () => {
    await togglePlayback(groove);
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
    const oldNotesPerMeasure = GrooveUtils.calcNotesPerMeasure(
      oldDivision,
      groove.timeSignature.beats,
      groove.timeSignature.noteValue
    );

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

    // Resize all note arrays
    const newNotes: Record<DrumVoice, boolean[]> = {} as any;
    Object.keys(groove.notes).forEach(voice => {
      newNotes[voice as DrumVoice] = GrooveUtils.resizeNotesArray(
        groove.notes[voice as DrumVoice],
        oldNotesPerMeasure,
        newNotesPerMeasure
      );
    });

    const newGroove: GrooveData = {
      ...groove,
      timeSignature,
      division: newDivision,
      notes: newNotes,
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

    const oldNotesPerMeasure = GrooveUtils.calcNotesPerMeasure(
      groove.division,
      groove.timeSignature.beats,
      groove.timeSignature.noteValue
    );

    const newNotesPerMeasure = GrooveUtils.calcNotesPerMeasure(
      division,
      groove.timeSignature.beats,
      groove.timeSignature.noteValue
    );

    // Resize all note arrays
    const newNotes: Record<DrumVoice, boolean[]> = {} as any;
    Object.keys(groove.notes).forEach(voice => {
      newNotes[voice as DrumVoice] = GrooveUtils.resizeNotesArray(
        groove.notes[voice as DrumVoice],
        oldNotesPerMeasure,
        newNotesPerMeasure
      );
    });

    const newGroove: GrooveData = {
      ...groove,
      division,
      notes: newNotes,
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
            />
          </div>

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
          </div>

          <DrumGrid
            groove={groove}
            currentPosition={currentPosition}
            onNoteToggle={handleNoteToggle}
            onPreview={handlePreview}
            advancedEditMode={advancedEditMode}
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

