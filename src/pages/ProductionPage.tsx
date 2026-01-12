import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { GrooveData, DEFAULT_GROOVE, DrumVoice, Division, ALL_DRUM_VOICES } from '../types';
import { GrooveUtils, decodeGroove, SavedGroove } from '../core';
import { useGrooveEngine } from '../hooks/useGrooveEngine';
import { useHistory } from '../hooks/useHistory';
import { useURLSync } from '../hooks/useURLSync';
import { useAutoSpeedUp } from '../hooks/useAutoSpeedUp';
import { useGrooveActions } from '../hooks/useGrooveActions';
import { useMyGrooves } from '../hooks/useMyGrooves';
import { usePlaybackHighlight } from '../hooks/usePlaybackHighlight';

// Core components - drum grid and sheet music
import { DrumGridDark } from '../components/production/DrumGridDark';
import SheetMusicDisplay from '../components/SheetMusicDisplay';

// New UI components
import { Header } from '../components/production/Header';
import { Sidebar } from '../components/production/Sidebar';
import { PlaybackControls } from '../components/production/PlaybackControls';
import { MetadataFields, MetadataFieldsRef } from '../components/production/MetadataFields';
import { BottomToolbar } from '../components/production/BottomToolbar';
import { KeyboardShortcuts } from '../components/production/KeyboardShortcuts';
import { ClearButton } from '../components/production/ClearButton';
import { DownloadModal } from '../components/production/DownloadModal';
import { PrintPreviewModal } from '../components/production/PrintPreviewModal';
import { MyGroovesModal } from '../components/production/MyGroovesModal';
import { SaveGrooveModal } from '../components/production/SaveGrooveModal';
import { Button } from '../components/ui/button';

import './ProductionPage.css';

export default function ProductionPage() {
  const [advancedEditMode] = useState(false);
  const [isNotesOnly, setIsNotesOnly] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isMyGroovesModalOpen, setIsMyGroovesModalOpen] = useState(false);
  const [isSaveGrooveModalOpen, setIsSaveGrooveModalOpen] = useState(false);
  const [elapsedTime, setElapsedTime] = useState('0:00');
  const [countInEnabled, setCountInEnabled] = useState(false);
  const [isCountingIn, setIsCountingIn] = useState(false);
  const [countdownNumber, setCountdownNumber] = useState<number | null>(null);
  const [countingInButton, setCountingInButton] = useState<'play' | 'playPlus' | null>(null);
  const playStartTimeRef = useRef<number | null>(null);
  const countInTimeoutRef = useRef<number | null>(null);
  const metadataFieldsRef = useRef<MetadataFieldsRef>(null);

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
    updateGroove,
    setSyncMode: setEngineSyncMode,
    playPreview,
    play,
    stop,
  } = useGrooveEngine();

  // URL sync
  const { copyURLToClipboard } = useURLSync(groove, setGroove);

  // My Grooves (localStorage persistence)
  const myGrooves = useMyGrooves();

  // Shared groove actions (note toggling, measure manipulation, metadata)
  const {
    handleNoteToggle,
    handleSetNotes,
    handleMeasureDuplicate,
    handleMeasureAdd,
    handleMeasureRemove,
    handleMeasureClear,
    handleClearAll,
    handleTitleChange,
    handleAuthorChange,
    handleCommentsChange,
  } = useGrooveActions(groove, setGroove);

  // Centralized engine sync: automatically update engine when groove changes
  // This eliminates the need for manual updateGroove calls throughout the codebase
  const prevGrooveRef = useRef<GrooveData | null>(null);
  useEffect(() => {
    // Skip if groove hasn't actually changed (reference check first, then compare audio-relevant fields)
    if (prevGrooveRef.current) {
      const prev = prevGrooveRef.current;
      // Only sync if audio-relevant properties changed (not metadata like title/author/comments)
      const audioChanged =
        prev.tempo !== groove.tempo ||
        prev.swing !== groove.swing ||
        prev.division !== groove.division ||
        prev.timeSignature.beats !== groove.timeSignature.beats ||
        prev.timeSignature.noteValue !== groove.timeSignature.noteValue ||
        prev.measures !== groove.measures; // Reference check for measures array

      if (!audioChanged) {
        prevGrooveRef.current = groove;
        return;
      }
    }
    prevGrooveRef.current = groove;
    updateGroove(groove);
  }, [groove, updateGroove]);

  // Auto Speed Up hook
  const autoSpeedUp = useAutoSpeedUp({
    tempo: groove.tempo,
    onTempoChange: (tempo) => {
      const newGroove = { ...groove, tempo };
      setGroove(newGroove);
      // Engine sync handled by centralized useEffect
    },
    isPlaying,
  });

  // Calculate visual position
  const visualPosition = useMemo(() => {
    if (currentPosition < 0 || !isPlaying) return currentPosition;
    return currentPosition;
  }, [currentPosition, isPlaying]);

  // Use direct DOM manipulation for playback highlighting (performance optimization)
  // This avoids React re-renders for high-frequency position updates during playback
  usePlaybackHighlight(visualPosition, isPlaying);

  // Initialize sync mode
  useEffect(() => {
    setEngineSyncMode('start');
  }, [setEngineSyncMode]);

  // Track elapsed time during playback
  useEffect(() => {
    if (isPlaying) {
      // Start tracking time
      playStartTimeRef.current = Date.now();

      const updateElapsedTime = () => {
        if (playStartTimeRef.current) {
          const elapsed = Date.now() - playStartTimeRef.current;
          const seconds = Math.floor(elapsed / 1000);
          const minutes = Math.floor(seconds / 60);
          const remainingSeconds = seconds % 60;
          setElapsedTime(`${minutes}:${remainingSeconds.toString().padStart(2, '0')}`);
        }
      };

      // Update every 100ms for smooth display
      const intervalId = setInterval(updateElapsedTime, 100);
      updateElapsedTime(); // Initial update

      return () => {
        clearInterval(intervalId);
      };
    } else {
      // Reset when stopped
      playStartTimeRef.current = null;
      setElapsedTime('0:00');
    }
  }, [isPlaying]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        if (canUndo) {
          undo();
          // Engine sync handled by centralized useEffect
        }
      } else if (
        ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'z') ||
        ((event.ctrlKey || event.metaKey) && event.key === 'y')
      ) {
        event.preventDefault();
        if (canRedo) {
          redo();
          // Engine sync handled by centralized useEffect
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [canUndo, canRedo, undo, redo]);

  // Cancel count-in helper
  const cancelCountIn = useCallback(() => {
    if (countInTimeoutRef.current) {
      clearTimeout(countInTimeoutRef.current);
      countInTimeoutRef.current = null;
    }
    setIsCountingIn(false);
    setCountdownNumber(null);
    setCountingInButton(null);
  }, []);

  // Play count-in clicks (4 beats with metronome sounds)
  const playCountIn = useCallback(async (button: 'play' | 'playPlus'): Promise<boolean> => {
    return new Promise((resolve) => {
      const beatDuration = 60000 / groove.tempo; // ms per beat
      let currentBeat = 4; // Start at 4, count down to 1

      setIsCountingIn(true);
      setCountingInButton(button);
      setCountdownNumber(currentBeat);

      const playBeat = () => {
        if (currentBeat > 0) {
          // Play metronome click - same sound for all 4 beats
          playPreview('hihat-metronome-normal');
          setCountdownNumber(currentBeat);
          currentBeat--;
          countInTimeoutRef.current = window.setTimeout(playBeat, beatDuration);
        } else {
          setIsCountingIn(false);
          setCountdownNumber(null);
          setCountingInButton(null);
          resolve(true); // Count-in completed successfully
        }
      };

      playBeat();
    });
  }, [groove.tempo, playPreview]);

  const handlePlay = async () => {
    if (autoSpeedUp.isActive) autoSpeedUp.stop();

    // If counting in, cancel it
    if (isCountingIn) {
      cancelCountIn();
      return;
    }

    if (isPlaying) {
      // Stop playback
      stop();
    } else {
      // Start playback (with count-in if enabled)
      if (countInEnabled) {
        const completed = await playCountIn('play');
        if (!completed) return; // Count-in was cancelled
      }
      await play(groove);
    }
  };

  const handlePlayWithSpeedUp = async () => {
    // If counting in, cancel it
    if (isCountingIn) {
      cancelCountIn();
      return;
    }

    if (isPlaying) {
      autoSpeedUp.stop();
      stop();
    } else {
      if (countInEnabled) {
        const completed = await playCountIn('playPlus');
        if (!completed) return; // Count-in was cancelled
      }
      await play(groove);
      autoSpeedUp.start();
    }
  };

  const handleTempoChange = (tempo: number) => {
    const newGroove = { ...groove, tempo };
    setGroove(newGroove);
    // Engine sync handled by centralized useEffect
  };

  const handleSwingChange = (swing: number) => {
    const newGroove = { ...groove, swing };
    setGroove(newGroove);
    // Engine sync handled by centralized useEffect
  };

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
    // Engine sync handled by centralized useEffect
    if (wasPlaying) await play(newGroove);
  };

  // My Grooves handlers
  const handleSaveGroove = (name: string, existingId?: string) => {
    myGrooves.saveGroove(groove, name, existingId);
  };

  const handleLoadGroove = (saved: SavedGroove) => {
    const loadedGroove = decodeGroove(saved);
    setGroove(loadedGroove);
    // URL will update automatically via useURLSync
  };

  const handleDeleteGroove = (id: string) => {
    myGrooves.deleteGroove(id);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white">
      <Header
        countInEnabled={countInEnabled}
        onCountInToggle={() => setCountInEnabled(!countInEnabled)}
        autoSpeedUpConfig={autoSpeedUp.config}
        onAutoSpeedUpConfigChange={autoSpeedUp.setConfig}
        onAutoSpeedUpSaveDefault={autoSpeedUp.saveAsDefault}
        onSaveGroove={() => setIsSaveGrooveModalOpen(true)}
        onOpenMyGrooves={() => setIsMyGroovesModalOpen(true)}
        savedGroovesCount={myGrooves.grooves.length}
      />

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
                elapsedTime={elapsedTime}
                countdownNumber={countdownNumber}
                countingInButton={countingInButton}
              />

              {/* Metadata Details - Title, Author, Comments */}
              <MetadataFields
                ref={metadataFieldsRef}
                title={groove.title || ''}
                author={groove.author || ''}
                comments={groove.comments || ''}
                onTitleChange={handleTitleChange}
                onAuthorChange={handleAuthorChange}
                onCommentsChange={handleCommentsChange}
                isNotesOnly={isNotesOnly}
              />

              {/* Main sequencer area - Sheet music + Grid */}
              <div className="bg-white/50 dark:bg-slate-800/50 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
                {/* Sheet Music Notation */}
                <div className={`p-6 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-600 ${!isNotesOnly ? 'mb-6' : ''}`}>
                  <SheetMusicDisplay
                    groove={groove}
                    visible={true}
                    currentPosition={visualPosition}
                    isPlaying={isPlaying}
                  />
                </div>

                {/* Drum Grid with time signature display - hidden in Notes Only mode */}
                {!isNotesOnly && (
                  <div className="flex">
                    {/* Time signature display */}
                    <div className="flex flex-col items-center justify-center mr-8 text-slate-900 dark:text-white">
                      <div className="text-4xl font-bold">{groove.timeSignature.beats}</div>
                      <div className="w-8 h-px bg-slate-900 dark:bg-white my-1"></div>
                      <div className="text-4xl font-bold">{groove.timeSignature.noteValue}</div>
                    </div>

                    {/* Drum grid */}
                    <div className="flex-1">
                      <DrumGridDark
                        groove={groove}
                        onNoteToggle={handleNoteToggle}
                        onSetNotes={handleSetNotes}
                        onPreview={handlePreview}
                        advancedEditMode={advancedEditMode}
                        onMeasureDuplicate={handleMeasureDuplicate}
                        onMeasureAdd={handleMeasureAdd}
                        onMeasureRemove={handleMeasureRemove}
                        onMeasureClear={handleMeasureClear}
                      />
                    </div>
                  </div>
                )}
              </div>

              {!isNotesOnly && (
                <div className="flex items-center gap-2">
                  <ClearButton onClear={handleClearAll} />

                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-2 h-auto py-2 px-4"
                  >
                    <div className="w-4 h-4 flex items-center justify-center font-bold text-sm">
                      S
                    </div>
                    <span className="text-xs uppercase">Stickings</span>
                  </Button>
                </div>
              )}
            </div>
          </main>

          {!isNotesOnly && <KeyboardShortcuts />}
        </div>
      </div>

      <BottomToolbar
        onShare={copyURLToClipboard}
        onDownload={() => setIsDownloadModalOpen(true)}
        onPrint={() => setIsPrintModalOpen(true)}
      />

      <DownloadModal
        groove={groove}
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
      />

      <PrintPreviewModal
        groove={groove}
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        onAddTitle={() => metadataFieldsRef.current?.openAndFocusTitle()}
      />

      <MyGroovesModal
        isOpen={isMyGroovesModalOpen}
        onClose={() => setIsMyGroovesModalOpen(false)}
        grooves={myGrooves.grooves}
        onLoadGroove={handleLoadGroove}
        onDeleteGroove={handleDeleteGroove}
      />

      <SaveGrooveModal
        isOpen={isSaveGrooveModalOpen}
        onClose={() => setIsSaveGrooveModalOpen(false)}
        onSave={handleSaveGroove}
        initialName={groove.title || ''}
        findByName={myGrooves.findByName}
      />
    </div>
  );
}

