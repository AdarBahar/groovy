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
  const prevCellsRef = useRef<Element[]>([]);
  const prevIconContainersRef = useRef<Element[]>([]);

  useEffect(() => {
    // Skip if position hasn't changed
    if (currentPosition === prevPositionRef.current) {
      return;
    }

    // Remove highlight from previous cells (entire column)
    prevCellsRef.current.forEach(cell => {
      cell.classList.remove('ring-2', 'ring-purple-400', 'ring-opacity-50');
    });
    prevIconContainersRef.current.forEach(container => {
      container.classList.remove('playing');
    });

    // Add highlight to new cells if playing and position is valid
    if (isPlaying && currentPosition >= 0) {
      const newCells = document.querySelectorAll(`[data-absolute-pos="${currentPosition}"]`);
      if (newCells.length > 0) {
        // Convert NodeList to Array
        const cellArray = Array.from(newCells);
        cellArray.forEach(cell => {
          cell.classList.add('ring-2', 'ring-purple-400', 'ring-opacity-50');
        });
        prevCellsRef.current = cellArray;

        // Also highlight the note icon containers inside each cell
        const iconContainers: Element[] = [];
        cellArray.forEach(cell => {
          const iconContainer = cell.querySelector('.note-icon-container');
          if (iconContainer) {
            iconContainer.classList.add('playing');
            iconContainers.push(iconContainer);
          }
        });
        prevIconContainersRef.current = iconContainers;
      } else {
        prevCellsRef.current = [];
        prevIconContainersRef.current = [];
      }
    } else {
      prevCellsRef.current = [];
      prevIconContainersRef.current = [];
    }

    prevPositionRef.current = currentPosition;
  }, [currentPosition, isPlaying]);

  // Cleanup on unmount or when playback stops
  useEffect(() => {
    if (!isPlaying) {
      prevCellsRef.current.forEach(cell => {
        cell.classList.remove('ring-2', 'ring-purple-400', 'ring-opacity-50');
      });
      prevIconContainersRef.current.forEach(container => {
        container.classList.remove('playing');
      });
      prevCellsRef.current = [];
      prevIconContainersRef.current = [];
      prevPositionRef.current = -1;
    }
  }, [isPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      prevCellsRef.current.forEach(cell => {
        cell.classList.remove('ring-2', 'ring-purple-400', 'ring-opacity-50');
      });
      prevIconContainersRef.current.forEach(container => {
        container.classList.remove('playing');
      });
    };
  }, []);
}

