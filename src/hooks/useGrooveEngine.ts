import { useState, useEffect, useRef, useCallback } from 'react';
import { GrooveEngine, SyncMode } from '../core';
import { GrooveData, DrumVoice, MetronomeFrequency, MetronomeOffsetClick, MetronomeConfig, DEFAULT_METRONOME_CONFIG } from '../types';
import { logger } from '../utils/logger';

const METRONOME_STORAGE_KEY = 'groovy-metronome-config';
const MASTER_VOLUME_STORAGE_KEY = 'groovy-master-volume';
const DEFAULT_MASTER_VOLUME = 1.0;

/**
 * Load master volume from localStorage
 */
function loadMasterVolume(): number {
  try {
    const saved = localStorage.getItem(MASTER_VOLUME_STORAGE_KEY);
    if (saved) {
      const volume = parseFloat(saved);
      if (!isNaN(volume)) {
        return Math.max(0, Math.min(1, volume));
      }
    }
  } catch (e) {
    logger.warn('Failed to load master volume:', e);
  }
  return DEFAULT_MASTER_VOLUME;
}

/**
 * Save master volume to localStorage
 */
function saveMasterVolume(volume: number): void {
  try {
    localStorage.setItem(MASTER_VOLUME_STORAGE_KEY, volume.toString());
  } catch (e) {
    logger.warn('Failed to save master volume:', e);
  }
}

/**
 * Load metronome config from localStorage
 */
function loadMetronomeConfig(): MetronomeConfig {
  try {
    const saved = localStorage.getItem(METRONOME_STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_METRONOME_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {
    logger.warn('Failed to load metronome config:', e);
  }
  return DEFAULT_METRONOME_CONFIG;
}

/**
 * Save metronome config to localStorage
 */
function saveMetronomeConfig(config: MetronomeConfig): void {
  try {
    localStorage.setItem(METRONOME_STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    logger.warn('Failed to save metronome config:', e);
  }
}

/**
 * React hook for the GrooveEngine
 *
 * This is the ONLY place where React-specific code interacts with the core engine.
 * The core engine itself has no knowledge of React.
 */
export function useGrooveEngine() {
  const engineRef = useRef<GrooveEngine | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(-1);
  const [currentGroove, setCurrentGroove] = useState<GrooveData | null>(null);
  const [hasPendingChanges, setHasPendingChanges] = useState(false);

  // Master volume state - load from localStorage
  const [masterVolume, setMasterVolumeState] = useState<number>(loadMasterVolume);

  // Metronome state - load from localStorage
  const [metronomeConfig, setMetronomeConfigState] = useState<MetronomeConfig>(loadMetronomeConfig);
  
  // Initialize engine once
  useEffect(() => {
    const engine = new GrooveEngine();

    // Register event listeners
    engine.on('playbackStateChange', (playing) => {
      setIsPlaying(playing);
    });

    engine.on('positionChange', (position) => {
      setCurrentPosition(position);
    });

    engine.on('grooveChange', (groove) => {
      setCurrentGroove(groove);
      setHasPendingChanges(false);
    });

    // Initialize engine with saved metronome config
    const savedConfig = loadMetronomeConfig();
    engine.setMetronomeConfig(savedConfig);

    // Initialize engine with saved master volume
    const savedVolume = loadMasterVolume();
    engine.setMasterVolume(savedVolume);

    engineRef.current = engine;

    // Cleanup on unmount
    return () => {
      engine.dispose();
    };
  }, []);
  
  // Stable ref to isPlaying so callbacks can read current value without being in deps
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  // Play function
  const play = useCallback(async (groove: GrooveData, loop: boolean = true) => {
    if (engineRef.current) {
      await engineRef.current.play(groove, loop);
      setCurrentGroove(groove);
    }
  }, []);

  // Stop function
  const stop = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.stop();
    }
  }, []);

  // Toggle play/pause — reads isPlaying from ref to avoid dep instability
  const togglePlayback = useCallback(async (groove: GrooveData) => {
    if (isPlayingRef.current) {
      if (engineRef.current) {
        engineRef.current.stop();
      }
    } else {
      if (engineRef.current) {
        await engineRef.current.play(groove);
        setCurrentGroove(groove);
      }
    }
  }, []);

  // Update groove (during playback or not)
  const updateGroove = useCallback((groove: GrooveData) => {
    if (engineRef.current) {
      engineRef.current.updateGroove(groove);

      // If playing, mark as having pending changes
      if (isPlayingRef.current) {
        setHasPendingChanges(true);

        // Clear pending indicator after a short delay
        setTimeout(() => {
          setHasPendingChanges(false);
        }, 300);
      } else {
        setCurrentGroove(groove);
      }
    }
  }, []);

  // Set sync mode
  const setSyncMode = useCallback((mode: SyncMode) => {
    if (engineRef.current) {
      engineRef.current.setSyncMode(mode);
    }
  }, []);

  // Get sync mode
  const getSyncMode = useCallback((): SyncMode => {
    return engineRef.current?.getSyncMode() || 'middle';
  }, []);

  // Play preview
  const playPreview = useCallback(async (voice: DrumVoice) => {
    if (engineRef.current) {
      await engineRef.current.playPreview(voice);
    }
  }, []);

  // ===== Metronome Methods =====

  // Central setter — all per-field wrappers delegate here (C2).
  const setMetronomeConfig = useCallback((config: Partial<MetronomeConfig>) => {
    if (engineRef.current) {
      engineRef.current.setMetronomeConfig(config);
      setMetronomeConfigState(prev => {
        const newConfig = { ...prev, ...config };
        saveMetronomeConfig(newConfig);
        return newConfig;
      });
    }
  }, []);

  // Thin wrappers over setMetronomeConfig — volume clamp applied before delegating.
  const setMetronomeFrequency = useCallback((frequency: MetronomeFrequency) => {
    setMetronomeConfig({ frequency });
  }, [setMetronomeConfig]);

  const setMetronomeSolo = useCallback((solo: boolean) => {
    setMetronomeConfig({ solo });
  }, [setMetronomeConfig]);

  const setMetronomeCountIn = useCallback((countIn: boolean) => {
    setMetronomeConfig({ countIn });
  }, [setMetronomeConfig]);

  const setMetronomeOffsetClick = useCallback((offsetClick: MetronomeOffsetClick) => {
    setMetronomeConfig({ offsetClick });
  }, [setMetronomeConfig]);

  const setMetronomeVolume = useCallback((volume: number) => {
    setMetronomeConfig({ volume: Math.max(0, Math.min(100, volume)) });
  }, [setMetronomeConfig]);

  // ===== Master Volume Methods =====

  const setMasterVolume = useCallback((volume: number) => {
    if (engineRef.current) {
      engineRef.current.setMasterVolume(volume);
      const clampedVolume = Math.max(0, Math.min(1, volume));
      setMasterVolumeState(clampedVolume);
      saveMasterVolume(clampedVolume);
    }
  }, []);

  return {
    // State
    isPlaying,
    currentPosition,
    currentGroove,
    hasPendingChanges,
    metronomeConfig,
    masterVolume,

    // Actions
    play,
    stop,
    togglePlayback,
    updateGroove,
    setSyncMode,
    getSyncMode,
    playPreview,

    // Metronome actions
    setMetronomeFrequency,
    setMetronomeSolo,
    setMetronomeCountIn,
    setMetronomeOffsetClick,
    setMetronomeVolume,
    setMetronomeConfig,

    // Master volume actions
    setMasterVolume,

    // Engine access for shared synth
    engine: engineRef.current,
  };
}

