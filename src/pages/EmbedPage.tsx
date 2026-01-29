/**
 * EmbedPage Component
 *
 * Minimal view for embedding grooves on external websites.
 * Shows only: header, playback controls, sheet music, and footer.
 * Triggered by `embed=true` URL parameter.
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { ExternalLink,  Ellipsis } from 'lucide-react';  //ChevronDown,
import { GrooveData, DEFAULT_GROOVE } from '../types';
import { useGrooveEngine } from '../hooks/useGrooveEngine';
import { useURLSync } from '../hooks/useURLSync';
import { useHistory } from '../hooks/useHistory';
import { usePlaybackHighlight } from '../hooks/usePlaybackHighlight';
import SheetMusicDisplay from '../components/SheetMusicDisplay';
import { PlaybackControls } from '../components/production/PlaybackControls';

export default function EmbedPage() {
  const [elapsedTime, setElapsedTime] = useState('0:00');
  const [isControlsExpanded, setIsControlsExpanded] = useState(false);
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
  const grooveAuthor = groove.author ? `by ${groove.author}` : 'Anonymous';
  const grooveDescription = groove.comments || 'description';
  // No-op for speed up (not available in embed)
  const handlePlayWithSpeedUp = handlePlay;

  return (
    <div className="h-screen flex flex-col embed  overflow-hidden">
      {/* Compact Header with Title */}
      <header className="px-3 py-2 flex flex-col embed:text-black">
        <div className="flex items-center justify-between">
          {/* Always visible: play button and elapsed time */}
          <div className="flex items-left gap-3">
              {!isControlsExpanded && (<span>
                <button
                  onClick={handlePlay}
                  className="px-3 py-1 bg-slate-500 embed:text-white   text-sm font-medium hover:opacity-80 transition-opacity">
                  {isPlaying ? ' ⏸ ' : '▶ '}
                </button>
              <span className="px-3 text-sm text-slate-500 ">{elapsedTime}</span>
              </span>
          )}
                {/* Expand/collapse button and title */}
          <div className="flex items-center gap-2">   
          <button
            onClick={() => setIsControlsExpanded(!isControlsExpanded)}
            className="flex items-center gap-2 text-sm font-medium text-slate-500 embed group"
          >
            <Ellipsis
              className={`w-4 h-4 transition-transform text-lg text-black duration-200  ${
                isControlsExpanded ? 'rotate-0' : '-rotate-90'
              }`}
            />
            <span className="hidden group-hover:inline text-black text-xs">Set Tempo & Swing</span>
          </button>
                    </div>
        </div>
        <h2 className=" truncate">{grooveTitle}</h2>
          <a
            href={fullURL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs  flex-shrink-0 light group"
            >
          <span className="hidden group-hover:inline text-xs">Edit Groove</span>
          <ExternalLink className="w-3 h-3 group-hover:hidden" />
        </a>
        </div>
         <div className="flex items-center justify-between text-s">
        <div>{grooveAuthor}</div><div>{grooveDescription}</div>
        </div>
      </header>
      {/* Sheet Music */}
      <div className="flex-1 overflow-auto embed ">
          <SheetMusicDisplay
            groove={groove}
            visible={true}
            currentPosition={visualPosition}
            isPlaying={isPlaying}
          />
       {/* Playback Controls - Full toolbar */}
      {isControlsExpanded && (
          <div className="mt-3 embed:text-black">
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
              isEmbedded={true}
            />
          </div>
          
        )}
      </div>
    </div>
  );
}
