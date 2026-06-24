import { useState, useRef, useEffect, useCallback } from 'react';
import { GrooveData, DrumVoice, MetronomeConfig } from '../types';
import * as analytics from '../utils/analytics';

interface AutoSpeedUp {
  isActive: boolean;
  start: () => void;
  stop: () => void;
}

interface UsePlaybackStateParams {
  groove: GrooveData;
  play: (groove: GrooveData) => Promise<void>;
  stop: () => void;
  isPlaying: boolean;
  metronomeConfig: MetronomeConfig;
  autoSpeedUp: AutoSpeedUp;
  playPreview: (voice: DrumVoice) => Promise<void>;
}

export interface PlaybackStateReturn {
  elapsedTime: string;
  isCountingIn: boolean;
  countdownNumber: number | null;
  countingInButton: 'play' | 'playPlus' | null;
  handlePlay: () => Promise<void>;
  handlePlayWithSpeedUp: () => Promise<void>;
}

export function usePlaybackState({
  groove,
  play,
  stop,
  isPlaying,
  metronomeConfig,
  autoSpeedUp,
  playPreview,
}: UsePlaybackStateParams): PlaybackStateReturn {
  const [elapsedTime, setElapsedTime] = useState('0:00');
  const [isCountingIn, setIsCountingIn] = useState(false);
  const [countdownNumber, setCountdownNumber] = useState<number | null>(null);
  const [countingInButton, setCountingInButton] = useState<'play' | 'playPlus' | null>(null);

  const playStartTimeRef = useRef<number | null>(null);
  const countInTimeoutRef = useRef<number | null>(null);

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

  const cancelCountIn = useCallback(() => {
    if (countInTimeoutRef.current) {
      clearTimeout(countInTimeoutRef.current);
      countInTimeoutRef.current = null;
    }
    setIsCountingIn(false);
    setCountdownNumber(null);
    setCountingInButton(null);
  }, []);

  const playCountIn = useCallback(async (button: 'play' | 'playPlus'): Promise<boolean> => {
    return new Promise((resolve) => {
      const beatDuration = 60000 / groove.tempo;
      let currentBeat = 4;

      setIsCountingIn(true);
      setCountingInButton(button);
      setCountdownNumber(currentBeat);

      const playBeat = () => {
        if (currentBeat > 0) {
          playPreview('hihat-metronome-normal');
          setCountdownNumber(currentBeat);
          currentBeat--;
          countInTimeoutRef.current = window.setTimeout(playBeat, beatDuration);
        } else {
          setIsCountingIn(false);
          setCountdownNumber(null);
          setCountingInButton(null);
          resolve(true);
        }
      };

      playBeat();
    });
  }, [groove.tempo, playPreview]);

  const handlePlay = useCallback(async () => {
    if (autoSpeedUp.isActive) autoSpeedUp.stop();

    if (isCountingIn) {
      cancelCountIn();
      return;
    }

    if (isPlaying) {
      const duration = playStartTimeRef.current ? (Date.now() - playStartTimeRef.current) / 1000 : 0;
      analytics.trackStop('normal', duration);
      stop();
    } else {
      if (metronomeConfig.countIn) {
        const completed = await playCountIn('play');
        if (!completed) return;
      }
      analytics.trackPlay('normal', groove.tempo, `${groove.timeSignature.beats}/${groove.timeSignature.noteValue}`);
      await play(groove);
    }
  }, [autoSpeedUp, isCountingIn, cancelCountIn, isPlaying, stop, metronomeConfig.countIn, playCountIn, groove, play]);

  const handlePlayWithSpeedUp = useCallback(async () => {
    if (isCountingIn) {
      cancelCountIn();
      return;
    }

    if (isPlaying) {
      const duration = playStartTimeRef.current ? (Date.now() - playStartTimeRef.current) / 1000 : 0;
      analytics.trackStop('speed-up', duration);
      autoSpeedUp.stop();
      stop();
    } else {
      if (metronomeConfig.countIn) {
        const completed = await playCountIn('playPlus');
        if (!completed) return;
      }
      analytics.trackPlay('speed-up', groove.tempo, `${groove.timeSignature.beats}/${groove.timeSignature.noteValue}`);
      await play(groove);
      autoSpeedUp.start();
    }
  }, [isCountingIn, cancelCountIn, isPlaying, autoSpeedUp, stop, metronomeConfig.countIn, playCountIn, groove, play]);

  return {
    elapsedTime,
    isCountingIn,
    countdownNumber,
    countingInButton,
    handlePlay,
    handlePlayWithSpeedUp,
  };
}
