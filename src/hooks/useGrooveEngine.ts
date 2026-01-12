import { useState, useEffect, useRef, useCallback } from 'react';
import { GrooveEngine, SyncMode } from '../core';
import { GrooveData, DrumVoice, MetronomeFrequency, MetronomeOffsetClick, MetronomeConfig, DEFAULT_METRONOME_CONFIG } from '../types';

const METRONOME_STORAGE_KEY = 'groovy-metronome-config';

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
    console.warn('Failed to load metronome config:', e);
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
    console.warn('Failed to save metronome config:', e);
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

    engineRef.current = engine;

    // Cleanup on unmount
    return () => {
      engine.dispose();
    };
  }, []);
  
  // Play function
  const play = async (groove: GrooveData, loop: boolean = true) => {
    if (engineRef.current) {
      await engineRef.current.play(groove, loop);
      setCurrentGroove(groove);
    }
  };
  
  // Stop function
  const stop = () => {
    if (engineRef.current) {
      engineRef.current.stop();
    }
  };
  
  // Toggle play/pause
  const togglePlayback = async (groove: GrooveData) => {
    if (isPlaying) {
      stop();
    } else {
      await play(groove);
    }
  };
  
  // Update groove (during playback or not)
  const updateGroove = (groove: GrooveData) => {
    if (engineRef.current) {
      engineRef.current.updateGroove(groove);
      
      // If playing, mark as having pending changes
      if (isPlaying) {
        setHasPendingChanges(true);
        
        // Clear pending indicator after a short delay
        setTimeout(() => {
          setHasPendingChanges(false);
        }, 300);
      } else {
        setCurrentGroove(groove);
      }
    }
  };
  
  // Set sync mode
  const setSyncMode = (mode: SyncMode) => {
    if (engineRef.current) {
      engineRef.current.setSyncMode(mode);
    }
  };
  
  // Get sync mode
  const getSyncMode = (): SyncMode => {
    return engineRef.current?.getSyncMode() || 'middle';
  };
  
  // Play preview
  const playPreview = async (voice: DrumVoice) => {
    if (engineRef.current) {
      await engineRef.current.playPreview(voice);
    }
  };

  // ===== Metronome Methods =====

  const setMetronomeFrequency = useCallback((frequency: MetronomeFrequency) => {
    if (engineRef.current) {
      engineRef.current.setMetronomeFrequency(frequency);
      setMetronomeConfigState(prev => {
        const newConfig = { ...prev, frequency };
        saveMetronomeConfig(newConfig);
        return newConfig;
      });
    }
  }, []);

  const setMetronomeSolo = useCallback((solo: boolean) => {
    if (engineRef.current) {
      engineRef.current.setMetronomeSolo(solo);
      setMetronomeConfigState(prev => {
        const newConfig = { ...prev, solo };
        saveMetronomeConfig(newConfig);
        return newConfig;
      });
    }
  }, []);

  const setMetronomeCountIn = useCallback((countIn: boolean) => {
    if (engineRef.current) {
      engineRef.current.setMetronomeCountIn(countIn);
      setMetronomeConfigState(prev => {
        const newConfig = { ...prev, countIn };
        saveMetronomeConfig(newConfig);
        return newConfig;
      });
    }
  }, []);

  const setMetronomeOffsetClick = useCallback((offsetClick: MetronomeOffsetClick) => {
    if (engineRef.current) {
      engineRef.current.setMetronomeOffsetClick(offsetClick);
      setMetronomeConfigState(prev => {
        const newConfig = { ...prev, offsetClick };
        saveMetronomeConfig(newConfig);
        return newConfig;
      });
    }
  }, []);

  const setMetronomeVolume = useCallback((volume: number) => {
    if (engineRef.current) {
      engineRef.current.setMetronomeVolume(volume);
      setMetronomeConfigState(prev => {
        const newConfig = { ...prev, volume: Math.max(0, Math.min(100, volume)) };
        saveMetronomeConfig(newConfig);
        return newConfig;
      });
    }
  }, []);

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

  return {
    // State
    isPlaying,
    currentPosition,
    currentGroove,
    hasPendingChanges,
    metronomeConfig,

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
  };
}

