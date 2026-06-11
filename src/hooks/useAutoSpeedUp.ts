import { useState, useEffect, useRef, useCallback } from 'react';
import {
  AutoSpeedUpConfig,
  AutoSpeedUpState,
  DEFAULT_AUTO_SPEED_UP_CONFIG,
  MAX_TEMPO,
} from '../types';

const STORAGE_KEY = 'groovy-auto-speed-up-defaults';

/**
 * Load saved defaults from localStorage
 */
function loadDefaults(): AutoSpeedUpConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_AUTO_SPEED_UP_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.warn('Failed to load auto speed up defaults:', e);
  }
  return DEFAULT_AUTO_SPEED_UP_CONFIG;
}

/**
 * Save defaults to localStorage
 */
function saveDefaults(config: AutoSpeedUpConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.warn('Failed to save auto speed up defaults:', e);
  }
}

interface UseAutoSpeedUpOptions {
  /** Current tempo */
  tempo: number;
  /** Function to update tempo */
  onTempoChange: (tempo: number) => void;
  /** Whether playback is active */
  isPlaying: boolean;
}

interface UseAutoSpeedUpReturn {
  /** Current configuration */
  config: AutoSpeedUpConfig;
  /** Update configuration */
  setConfig: (config: AutoSpeedUpConfig) => void;
  /** Save current config as defaults */
  saveAsDefault: () => void;
  /** Current state */
  state: AutoSpeedUpState;
  /** Start auto speed up */
  start: () => void;
  /** Stop auto speed up */
  stop: () => void;
  /** Whether auto speed up is active */
  isActive: boolean;
}

/**
 * Hook to manage auto speed up functionality.
 * Side effects (onTempoChange, scheduleIncrease) run OUTSIDE setState updaters
 * so React StrictMode double-invocation does not double-increase tempo (#124).
 * Timer cleanup on unmount prevents stale callbacks after component removal (#124).
 */
export function useAutoSpeedUp({
  tempo,
  onTempoChange,
  isPlaying,
}: UseAutoSpeedUpOptions): UseAutoSpeedUpReturn {
  const [config, setConfig] = useState<AutoSpeedUpConfig>(loadDefaults);
  const [state, setState] = useState<AutoSpeedUpState>({
    isActive: false,
    baseTempo: tempo,
    totalIncreased: 0,
    nextIncreaseAt: null,
    timeRemaining: 0,
  });

  const timerRef = useRef<number | null>(null);
  const countdownRef = useRef<number | null>(null);

  // Refs to latest values so timer callbacks always read current state without stale closures.
  // totalIncreasedRef is the authoritative counter for the timer chain — it is updated
  // synchronously inside the timeout callback so consecutive timeouts in the same flush
  // see the correct accumulated value, regardless of when React commits the setState (#124).
  const stateRef = useRef<AutoSpeedUpState>(state);
  const configRef = useRef<AutoSpeedUpConfig>(config);
  const onTempoChangeRef = useRef<(tempo: number) => void>(onTempoChange);
  const totalIncreasedRef = useRef<number>(0);
  const baseTempoRef = useRef<number>(tempo);

  // Keep refs in sync with latest values
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    onTempoChangeRef.current = onTempoChange;
  }, [onTempoChange]);

  // Unmount cleanup: clear both timers so no stale callbacks fire (#124)
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (countdownRef.current !== null) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, []);

  // Stop auto speed up when playback stops
  useEffect(() => {
    if (!isPlaying && state.isActive) {
      stop();
    }
  }, [isPlaying, state.isActive]);

  // Countdown timer to update timeRemaining
  useEffect(() => {
    if (state.isActive && state.nextIncreaseAt !== null) {
      countdownRef.current = window.setInterval(() => {
        const remaining = Math.max(0, stateRef.current.nextIncreaseAt! - Date.now());
        setState((prev) => ({ ...prev, timeRemaining: remaining }));
      }, 500);
    }

    return () => {
      if (countdownRef.current !== null) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    };
  }, [state.isActive, state.nextIncreaseAt]);

  const start = useCallback(() => {
    const cfg = configRef.current;
    const intervalMs = cfg.intervalMinutes * 60 * 1000;
    const nextIncreaseAt = Date.now() + intervalMs;

    // Reset accumulator refs for new session
    totalIncreasedRef.current = 0;
    baseTempoRef.current = tempo;

    setState({
      isActive: true,
      baseTempo: tempo,
      totalIncreased: 0,
      nextIncreaseAt,
      timeRemaining: intervalMs,
    });

    /**
     * Schedule the next tempo increase.
     * All side effects (onTempoChange, scheduleIncrease) happen OUTSIDE any setState
     * updater — satisfying StrictMode double-invocation safety (#124).
     *
     * totalIncreasedRef is updated synchronously so chained timer callbacks see the
     * correct accumulated value even when React state commits are deferred.
     */
    const scheduleIncrease = () => {
      timerRef.current = window.setTimeout(() => {
        // Read current values from refs (no stale closures)
        const currentState = stateRef.current;
        const currentConfig = configRef.current;
        const currentIntervalMs = currentConfig.intervalMinutes * 60 * 1000;

        if (!currentState.isActive) return;

        // Use ref for accumulated total so chained callbacks see correct value immediately
        totalIncreasedRef.current += currentConfig.stepBpm;
        const newTotalIncreased = totalIncreasedRef.current;
        const newTempo = Math.min(baseTempoRef.current + newTotalIncreased, MAX_TEMPO);
        const shouldContinue = currentConfig.keepGoing && newTempo < MAX_TEMPO;

        // Side effects run OUTSIDE setState — never inside an updater (#124)
        onTempoChangeRef.current(newTempo);

        if (shouldContinue) {
          scheduleIncrease();
        }

        // Pure state update: no side effects in this updater
        setState((prev) => {
          if (!prev.isActive) return prev;
          if (shouldContinue) {
            const nextAt = Date.now() + currentIntervalMs;
            return {
              ...prev,
              totalIncreased: newTotalIncreased,
              nextIncreaseAt: nextAt,
              timeRemaining: currentIntervalMs,
            };
          }
          return { ...prev, isActive: false, nextIncreaseAt: null, timeRemaining: 0 };
        });
      }, intervalMs);
    };

    scheduleIncrease();
  }, [config, tempo, onTempoChange]);

  const stop = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setState((prev) => ({ ...prev, isActive: false, nextIncreaseAt: null, timeRemaining: 0 }));
  }, []);

  const saveAsDefault = useCallback(() => {
    saveDefaults(config);
  }, [config]);

  return {
    config,
    setConfig,
    saveAsDefault,
    state,
    start,
    stop,
    isActive: state.isActive,
  };
}
