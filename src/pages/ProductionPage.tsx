import { useState, useEffect, useCallback, useMemo } from 'react';
import { Trash2 } from 'lucide-react';
import { GrooveData, DEFAULT_GROOVE, DrumVoice, Division, ALL_DRUM_VOICES, createEmptyNotesRecord, MAX_MEASURES } from '../types';
import { GrooveUtils } from '../core';
import { useGrooveEngine } from '../hooks/useGrooveEngine';
import { useHistory } from '../hooks/useHistory';
import { useURLSync } from '../hooks/useURLSync';
import { useAutoSpeedUp } from '../hooks/useAutoSpeedUp';

// POC components (functional) - drum grid and sheet music
import DrumGrid from '../poc/components/DrumGrid';
import SheetMusicDisplay from '../poc/components/SheetMusicDisplay';

// New UI components
import { Header } from '../components/production/Header';
import { Sidebar } from '../components/production/Sidebar';
import { PlaybackControls } from '../components/production/PlaybackControls';
import { MetadataFields } from '../components/production/MetadataFields';
import { BottomToolbar } from '../components/production/BottomToolbar';
import { KeyboardShortcuts } from '../components/production/KeyboardShortcuts';
import { Button } from '../components/ui/button';

import './ProductionPage.css';

export default function ProductionPage() {
  const [advancedEditMode] = useState(false);
  const [isNotesOnly, setIsNotesOnly] = useState(false);

  // Use history hook for undo/redo
  const {
    state: groove,
    setState: setGroove,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistory<GrooveData>(DEFAULT_GROOVE, 50);

  // Use the GrooveEngine hook
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

  // URL sync
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

  // Calculate visual position
  const visualPosition = useMemo(() => {
    if (currentPosition < 0 || !isPlaying) return currentPosition;
    return currentPosition;
  }, [currentPosition, isPlaying]);

  // Initialize sync mode
  useEffect(() => {
    setEngineSyncMode('start');
  }, [setEngineSyncMode]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        if (canUndo) {
          undo();
          setTimeout(() => updateGroove(groove), 0);
        }
      } else if (
        ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'z') ||
        ((event.ctrlKey || event.metaKey) && event.key === 'y')
      ) {
        event.preventDefault();
        if (canRedo) {
          redo();
          setTimeout(() => updateGroove(groove), 0);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo, updateGroove, groove]);

  // Note toggle handler
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

  // Measure manipulation handlers
  const handleMeasureDuplicate = useCallback((measureIndex: number) => {
    if (groove.measures.length >= MAX_MEASURES) return;
    const measureToCopy = groove.measures[measureIndex];
    const copiedNotes = Object.fromEntries(
      Object.entries(measureToCopy.notes).map(([voice, notes]) => [voice, [...notes]])
    ) as typeof measureToCopy.notes;
    const newMeasure = { ...measureToCopy, notes: copiedNotes };
    const newMeasures = [...groove.measures.slice(0, measureIndex + 1), newMeasure, ...groove.measures.slice(measureIndex + 1)];
    const newGroove = { ...groove, measures: newMeasures };
    setGroove(newGroove);
    updateGroove(newGroove);
  }, [groove, setGroove, updateGroove]);

  const handleMeasureAdd = useCallback((afterIndex: number) => {
    if (groove.measures.length >= MAX_MEASURES) return;
    const notesPerMeasure = GrooveUtils.calcNotesPerMeasure(groove.division, groove.timeSignature.beats, groove.timeSignature.noteValue);
    const newMeasure = { notes: createEmptyNotesRecord(notesPerMeasure) };
    const newMeasures = [...groove.measures.slice(0, afterIndex + 1), newMeasure, ...groove.measures.slice(afterIndex + 1)];
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
    const notesPerMeasure = GrooveUtils.calcNotesPerMeasure(groove.division, groove.timeSignature.beats, groove.timeSignature.noteValue);
    const newMeasures = groove.measures.map((measure, idx) => {
      if (idx !== measureIndex) return measure;
      return { ...measure, notes: createEmptyNotesRecord(notesPerMeasure) };
    });
    const newGroove = { ...groove, measures: newMeasures };
    setGroove(newGroove);
    updateGroove(newGroove);
  }, [groove, setGroove, updateGroove]);

  const handlePlay = async () => {
    if (autoSpeedUp.isActive) autoSpeedUp.stop();
    await togglePlayback(groove);
  };

  const handlePlayWithSpeedUp = async () => {
    if (isPlaying) {
      autoSpeedUp.stop();
      stop();
    } else {
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

  const handleTitleChange = useCallback((title: string) => {
    const newGroove = { ...groove, title: title || undefined };
    setGroove(newGroove);
  }, [groove, setGroove]);

  const handleAuthorChange = useCallback((author: string) => {
    const newGroove = { ...groove, author: author || undefined };
    setGroove(newGroove);
  }, [groove, setGroove]);

  const handleCommentsChange = useCallback((comments: string) => {
    const newGroove = { ...groove, comments: comments || undefined };
    setGroove(newGroove);
  }, [groove, setGroove]);

  const handlePreview = async (voice: DrumVoice) => {
    await playPreview(voice);
  };

  const handleDivisionChange = async (division: Division) => {
    const wasPlaying = isPlaying;
    if (wasPlaying) stop();

    const newMeasures = groove.measures.map((measure) => {
      const ts = measure.timeSignature || groove.timeSignature;
      const oldNotesPerMeasure = GrooveUtils.calcNotesPerMeasure(groove.division, ts.beats, ts.noteValue);
      const newNotesPerMeasure = GrooveUtils.calcNotesPerMeasure(division, ts.beats, ts.noteValue);
      const newNotes: Record<DrumVoice, boolean[]> = {} as Record<DrumVoice, boolean[]>;
      for (const voice of ALL_DRUM_VOICES) {
        newNotes[voice] = GrooveUtils.resizeNotesArray(measure.notes[voice], oldNotesPerMeasure, newNotesPerMeasure);
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
    if (wasPlaying) await play(newGroove);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-900 text-white">
      <Header />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          isNotesOnly={isNotesOnly}
          onToggleNotesOnly={() => setIsNotesOnly(!isNotesOnly)}
          timeSignature={groove.timeSignature}
          division={groove.division}
          onDivisionChange={handleDivisionChange}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={undo}
          onRedo={redo}
        />

        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-auto">
            <div className="p-6 space-y-6">
              {/* Playback controls */}
              <PlaybackControls
                isPlaying={isPlaying}
                onPlay={handlePlay}
                onPlayWithSpeedUp={handlePlayWithSpeedUp}
                isAutoSpeedUpActive={autoSpeedUp.isActive}
                timeSignature={groove.timeSignature}
                tempo={groove.tempo}
                swing={groove.swing}
                onTempoChange={handleTempoChange}
                onSwingChange={handleSwingChange}
              />

              {/* Main sequencer area - Sheet music + Grid */}
              <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
                {/* Sheet Music Notation */}
                <div className="mb-6 p-6 bg-slate-900/50 rounded-lg border border-slate-600">
                  <SheetMusicDisplay
                    groove={groove}
                    visible={true}
                    currentPosition={visualPosition}
                    isPlaying={isPlaying}
                  />
                </div>

                {/* Drum Grid with time signature display */}
                <div className="flex">
                  {/* Time signature display */}
                  <div className="flex flex-col items-center justify-center mr-8 text-white">
                    <div className="text-4xl font-bold">{groove.timeSignature.beats}</div>
                    <div className="w-8 h-px bg-white my-1"></div>
                    <div className="text-4xl font-bold">{groove.timeSignature.noteValue}</div>
                  </div>

                  {/* Drum grid */}
                  <div className="flex-1">
                    <DrumGrid
                      groove={groove}
                      currentPosition={visualPosition}
                      onNoteToggle={handleNoteToggle}
                      onPreview={handlePreview}
                      advancedEditMode={advancedEditMode}
                      onMeasureDuplicate={handleMeasureDuplicate}
                      onMeasureAdd={handleMeasureAdd}
                      onMeasureRemove={handleMeasureRemove}
                      onMeasureClear={handleMeasureClear}
                    />
                  </div>
                </div>
              </div>

              {!isNotesOnly && (
                <>
                  {/* Metadata fields */}
                  <MetadataFields
                    title={groove.title || ''}
                    author={groove.author || ''}
                    comments={groove.comments || ''}
                    onTitleChange={handleTitleChange}
                    onAuthorChange={handleAuthorChange}
                    onCommentsChange={handleCommentsChange}
                  />

                  {/* Clear and Stickings buttons */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMeasureClear(0)}
                      className="text-slate-400 hover:text-white flex items-center gap-2 h-auto py-2 px-4"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="text-xs uppercase">Clear</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-white flex items-center gap-2 h-auto py-2 px-4"
                    >
                      <div className="w-4 h-4 flex items-center justify-center font-bold text-sm">
                        S
                      </div>
                      <span className="text-xs uppercase">Stickings</span>
                    </Button>
                  </div>
                </>
              )}
            </div>
          </main>

          {!isNotesOnly && <KeyboardShortcuts />}
        </div>
      </div>

      <BottomToolbar onShare={copyURLToClipboard} />
    </div>
  );
}

