import { useEffect, useRef } from 'react';

/**
 * Hook that handles playback position highlighting via direct DOM manipulation.
 * This avoids React re-renders for high-frequency position updates during playback.
 * 
 * The hook adds/removes CSS classes on drum grid cells based on the current position,
 * bypassing React's reconciliation for better performance.
 */
export function usePlaybackHighlight(currentPosition: number, isPlaying: boolean) {
  const prevPositionRef = useRef<number>(-1);
  const prevCellRef = useRef<Element | null>(null);
  const prevIconContainerRef = useRef<Element | null>(null);

  useEffect(() => {
    // Skip if position hasn't changed
    if (currentPosition === prevPositionRef.current) {
      return;
    }

    // Remove highlight from previous cell
    if (prevCellRef.current) {
      prevCellRef.current.classList.remove('ring-2', 'ring-purple-400', 'ring-opacity-50');
    }
    if (prevIconContainerRef.current) {
      prevIconContainerRef.current.classList.remove('playing');
    }

    // Add highlight to new cell if playing and position is valid
    if (isPlaying && currentPosition >= 0) {
      const newCell = document.querySelector(`[data-absolute-pos="${currentPosition}"]`);
      if (newCell) {
        newCell.classList.add('ring-2', 'ring-purple-400', 'ring-opacity-50');
        prevCellRef.current = newCell;

        // Also highlight the note icon container inside the cell
        const iconContainer = newCell.querySelector('.note-icon-container');
        if (iconContainer) {
          iconContainer.classList.add('playing');
          prevIconContainerRef.current = iconContainer;
        } else {
          prevIconContainerRef.current = null;
        }
      } else {
        prevCellRef.current = null;
        prevIconContainerRef.current = null;
      }
    } else {
      prevCellRef.current = null;
      prevIconContainerRef.current = null;
    }

    prevPositionRef.current = currentPosition;
  }, [currentPosition, isPlaying]);

  // Cleanup on unmount or when playback stops
  useEffect(() => {
    if (!isPlaying) {
      if (prevCellRef.current) {
        prevCellRef.current.classList.remove('ring-2', 'ring-purple-400', 'ring-opacity-50');
        prevCellRef.current = null;
      }
      if (prevIconContainerRef.current) {
        prevIconContainerRef.current.classList.remove('playing');
        prevIconContainerRef.current = null;
      }
      prevPositionRef.current = -1;
    }
  }, [isPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (prevCellRef.current) {
        prevCellRef.current.classList.remove('ring-2', 'ring-purple-400', 'ring-opacity-50');
      }
      if (prevIconContainerRef.current) {
        prevIconContainerRef.current.classList.remove('playing');
      }
    };
  }, []);
}

