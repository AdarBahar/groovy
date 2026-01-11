import { useState, useCallback, useRef } from 'react';

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
 * Fast shallow equality check for objects
 * Compares scalar properties first, then checks array/object references
 * Falls back to JSON comparison only if structure is different
 */
function fastShallowEqual<T>(a: T, b: T): boolean {
  // Same reference
  if (a === b) return true;

  // Null/undefined checks
  if (a == null || b == null) return a === b;

  // Different types
  if (typeof a !== typeof b) return false;

  // Primitives
  if (typeof a !== 'object') return a === b;

  // Arrays - compare lengths and references
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    // For performance, just check if it's the same array reference
    // If caller wants deep comparison, they should use custom comparator
    return a === b;
  }

  // Objects - compare keys and values (shallow)
  const keysA = Object.keys(a as object);
  const keysB = Object.keys(b as object);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    const valA = (a as Record<string, unknown>)[key];
    const valB = (b as Record<string, unknown>)[key];

    // For nested objects/arrays, just compare references for speed
    // This is the key optimization: we don't deep-compare, just reference-check
    if (valA !== valB) {
      // Only recurse one level for scalar values
      if (typeof valA === 'object' || typeof valB === 'object') {
        return false; // Different references = consider different
      }
      if (valA !== valB) return false;
    }
  }

  return true;
}

export type EqualityFn<T> = (a: T, b: T) => boolean;

export interface UseHistoryOptions<T> {
  /** Maximum number of history entries (default: 50) */
  maxHistory?: number;
  /** Custom equality function (default: fastShallowEqual) */
  isEqual?: EqualityFn<T>;
}

/**
 * Hook for managing undo/redo history
 * @param initialState Initial state value
 * @param options Configuration options or maxHistory number for backward compatibility
 */
export function useHistory<T>(
  initialState: T,
  options: number | UseHistoryOptions<T> = 50
): UseHistoryReturn<T> {
  // Support both old API (maxHistory number) and new API (options object)
  const { maxHistory, isEqual } = typeof options === 'number'
    ? { maxHistory: options, isEqual: fastShallowEqual }
    : { maxHistory: options.maxHistory ?? 50, isEqual: options.isEqual ?? fastShallowEqual };

  const [history, setHistory] = useState<HistoryState<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  // Store isEqual in a ref to avoid dependency changes
  const isEqualRef = useRef(isEqual);
  isEqualRef.current = isEqual;

  const setState = useCallback(
    (newState: T) => {
      setHistory((currentHistory) => {
        const { past, present } = currentHistory;

        // Don't add to history if state hasn't changed (using fast equality check)
        if (isEqualRef.current(present, newState)) {
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

