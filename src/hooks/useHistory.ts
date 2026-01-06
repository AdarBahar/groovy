import { useState, useCallback } from 'react';

export interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export interface UseHistoryReturn<T> {
  state: T;
  setState: (newState: T) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  clear: () => void;
}

/**
 * Hook for managing undo/redo history
 * @param initialState Initial state value
 * @param maxHistory Maximum number of history entries (default: 50)
 */
export function useHistory<T>(
  initialState: T,
  maxHistory: number = 50
): UseHistoryReturn<T> {
  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  const setState = useCallback(
    (newState: T) => {
      setHistory((currentHistory) => {
        const { past, present } = currentHistory;

        // Don't add to history if state hasn't changed
        if (JSON.stringify(present) === JSON.stringify(newState)) {
          return currentHistory;
        }

        // Add current state to past, limit history size
        const newPast = [...past, present].slice(-maxHistory);

        return {
          past: newPast,
          present: newState,
          future: [], // Clear future when new state is set
        };
      });
    },
    [maxHistory]
  );

  const undo = useCallback(() => {
    setHistory((currentHistory) => {
      const { past, present, future } = currentHistory;

      if (past.length === 0) {
        return currentHistory;
      }

      const previous = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);

      return {
        past: newPast,
        present: previous,
        future: [present, ...future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((currentHistory) => {
      const { past, present, future } = currentHistory;

      if (future.length === 0) {
        return currentHistory;
      }

      const next = future[0];
      const newFuture = future.slice(1);

      return {
        past: [...past, present],
        present: next,
        future: newFuture,
      };
    });
  }, []);

  const clear = useCallback(() => {
    setHistory({
      past: [],
      present: history.present,
      future: [],
    });
  }, [history.present]);

  return {
    state: history.present,
    setState,
    undo,
    redo,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    clear,
  };
}

