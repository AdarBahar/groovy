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
 * Hook to manage auto speed up functionality
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
        const remaining = Math.max(0, state.nextIncreaseAt! - Date.now());
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
    const intervalMs = config.intervalMinutes * 60 * 1000;
    const nextIncreaseAt = Date.now() + intervalMs;

    setState({
      isActive: true,
      baseTempo: tempo,
      totalIncreased: 0,
      nextIncreaseAt,
      timeRemaining: intervalMs,
    });

    // Schedule tempo increases
    const scheduleIncrease = () => {
      timerRef.current = window.setTimeout(() => {
        setState((prev) => {
          if (!prev.isActive) return prev;

          const newTempo = Math.min(tempo + prev.totalIncreased + config.stepBpm, MAX_TEMPO);
          const totalIncreased = prev.totalIncreased + config.stepBpm;

          // Apply tempo change
          onTempoChange(newTempo);

          // Check if we should continue
          if (!config.keepGoing || newTempo >= MAX_TEMPO) {
            return { ...prev, isActive: false, nextIncreaseAt: null, timeRemaining: 0 };
          }

          // Schedule next increase
          const nextAt = Date.now() + intervalMs;
          scheduleIncrease();

          return { ...prev, totalIncreased, nextIncreaseAt: nextAt, timeRemaining: intervalMs };
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

