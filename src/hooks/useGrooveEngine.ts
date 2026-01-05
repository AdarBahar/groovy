import { useState, useEffect, useRef } from 'react';
import { GrooveEngine, SyncMode } from '../core';
import { GrooveData, DrumVoice } from '../types';

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
  
  return {
    // State
    isPlaying,
    currentPosition,
    currentGroove,
    hasPendingChanges,
    
    // Actions
    play,
    stop,
    togglePlayback,
    updateGroove,
    setSyncMode,
    getSyncMode,
    playPreview,
  };
}

