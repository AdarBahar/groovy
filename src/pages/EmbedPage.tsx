/**
 * EmbedPage Component
 *
 * Minimal view for embedding grooves on external websites.
 * Shows only: header, playback controls, sheet music, and footer.
 * Triggered by `embed=true` URL parameter.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ExternalLink } from 'lucide-react';
import { GrooveData, DEFAULT_GROOVE } from '../types';
import { useGrooveEngine } from '../hooks/useGrooveEngine';
import { useURLSync } from '../hooks/useURLSync';
import { useHistory } from '../hooks/useHistory';
import { usePlaybackHighlight } from '../hooks/usePlaybackHighlight';
import SheetMusicDisplay from '../components/SheetMusicDisplay';
import { PlaybackControls } from '../components/production/PlaybackControls';

export default function EmbedPage() {
  const [elapsedTime, setElapsedTime] = useState('0:00');
  const playStartTimeRef = useRef<number | null>(null);

  // Use history hook for state management (required by useURLSync)
  const {
    state: groove,
    setState: setGroove,
  } = useHistory<GrooveData>(DEFAULT_GROOVE, 1); // Minimal history for embeds

  // Use the GrooveEngine hook for playback
  const {
    isPlaying,
    currentPosition,
    updateGroove,
    play,
    stop,
  } = useGrooveEngine();

  // URL sync - loads groove from URL parameters
  useURLSync(groove, setGroove);

  // Centralized engine sync
  const prevGrooveRef = useRef<GrooveData | null>(null);
  useEffect(() => {
    if (prevGrooveRef.current) {
      const prev = prevGrooveRef.current;
      const audioChanged =
        prev.tempo !== groove.tempo ||
        prev.swing !== groove.swing ||
        prev.division !== groove.division ||
        prev.timeSignature.beats !== groove.timeSignature.beats ||
        prev.timeSignature.noteValue !== groove.timeSignature.noteValue ||
        prev.measures !== groove.measures;

      if (!audioChanged) {
        prevGrooveRef.current = groove;
        return;
      }
    }
    prevGrooveRef.current = groove;
    updateGroove(groove);
  }, [groove, updateGroove]);

  // Track elapsed time during playback
  useEffect(() => {
    if (isPlaying) {
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

      const intervalId = setInterval(updateElapsedTime, 100);
      updateElapsedTime();

      return () => {
        clearInterval(intervalId);
      };
    } else {
      playStartTimeRef.current = null;
      setElapsedTime('0:00');
    }
  }, [isPlaying]);

  // Calculate visual position
  const visualPosition = useMemo(() => {
    if (currentPosition < 0 || !isPlaying) return currentPosition;
    return currentPosition;
  }, [currentPosition, isPlaying]);

  // Use direct DOM manipulation for playback highlighting
  usePlaybackHighlight(visualPosition, isPlaying);

  // Handle play/stop toggle
  const handlePlay = useCallback(async () => {
    if (isPlaying) {
      stop();
    } else {
      await play(groove);
    }
  }, [isPlaying, stop, play, groove]);

  // Tempo and swing handlers
  const handleTempoChange = useCallback((tempo: number) => {
    setGroove({ ...groove, tempo });
  }, [groove, setGroove]);

  const handleSwingChange = useCallback((swing: number) => {
    setGroove({ ...groove, swing });
  }, [groove, setGroove]);

  // Generate full URL (without embed parameter) for "Open in Groovy" link
  const fullURL = useMemo(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete('embed');
    return url.toString();
  }, []);

  const grooveTitle = groove.title || 'Drum Groove';

  // No-op for speed up (not available in embed)
  const handlePlayWithSpeedUp = handlePlay;

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-slate-900 text-slate-900 dark:text-white overflow-hidden">
      {/* Compact Header with Title */}
      <header className="px-3 py-2 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
        <h1 className="text-sm font-semibold truncate">{grooveTitle}</h1>
        <a
          href={fullURL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:underline flex-shrink-0"
        >
          <span>Edit/Open in Groovy</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </header>

      {/* Playback Controls - Full toolbar */}
      <div className="px-3 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
        <PlaybackControls
          isPlaying={isPlaying}
          onPlay={handlePlay}
          onPlayWithSpeedUp={handlePlayWithSpeedUp}
          isAutoSpeedUpActive={false}
          timeSignature={groove.timeSignature}
          tempo={groove.tempo}
          swing={groove.swing}
          onTempoChange={handleTempoChange}
          onSwingChange={handleSwingChange}
          elapsedTime={elapsedTime}
        />
      </div>

      {/* Sheet Music */}
      <div className="flex-1 overflow-auto p-3">
        <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-600 p-3">
          <SheetMusicDisplay
            groove={groove}
            visible={true}
            currentPosition={visualPosition}
            isPlaying={isPlaying}
          />
        </div>
      </div>
    </div>
  );
}
