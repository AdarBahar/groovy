import { DrumVoice } from '../types';
import { logger } from '../utils/logger';

/**
 * Drum sample player using Web Audio API
 * Loads and plays drum samples
 */
export class DrumSynth {
  private audioContext: AudioContext;
  private samples: Map<string, AudioBuffer> = new Map();
  private isLoaded = false;

  // Rate limiting for audio playback (prevent spam/DoS)
  private lastPlayTime = new Map<DrumVoice, number>();
  private readonly MIN_PLAY_INTERVAL_MS = 10; // Minimum 10ms between same voice hits

  // Map drum voices to sample file names
  private sampleFiles: Record<DrumVoice, string> = {
    // Hi-Hat variations
    'hihat-closed': 'Hi Hat Normal.mp3',
    'hihat-open': 'Hi Hat Open.mp3',
    'hihat-accent': 'Hi Hat Accent.mp3',
    'hihat-foot': 'Hi Hat Foot.mp3',
    'hihat-metronome-normal': 'metronomeClick.mp3',
    'hihat-metronome-accent': 'metronome1Count.mp3',
    'hihat-cross': 'Hi Hat Normal.mp3', // Use normal hi-hat for cross stick pattern
    // Snare variations
    'snare-normal': 'Snare Normal.mp3',
    'snare-accent': 'Snare Accent.mp3',
    'snare-ghost': 'Snare Ghost.mp3',
    'snare-cross-stick': 'Snare Cross Stick.mp3',
    'snare-flam': 'Snare Flam.mp3',
    'snare-rim': 'Rim.mp3',
    'snare-drag': 'Drag.mp3',
    'snare-buzz': 'Buzz.mp3',
    // Kick
    'kick': 'Kick.mp3',
    // Toms
    'tom-rack': 'Rack Tom.mp3',
    'tom-floor': 'Floor Tom.mp3',
    'tom-10': '10 Tom.mp3',
    'tom-16': '16 Tom.mp3',
    // Cymbals
    'crash': 'Crash.mp3',
    'ride': 'Ride.mp3',
    'ride-bell': 'Bell.mp3',
    // Percussion
    'cowbell': 'Cowbell.mp3',
    'stacker': 'Stacker.mp3',
  };

  constructor() {
    this.audioContext = new AudioContext();
    this.loadSamples();
  }

  /**
   * Load all drum samples
   */
  private async loadSamples() {
    const voices: DrumVoice[] = Object.keys(this.sampleFiles) as DrumVoice[];

    try {
      await Promise.all(
        voices.map(async (voice) => {
          const fileName = this.sampleFiles[voice];
          // Use relative path with import.meta.env.BASE_URL for correct base path
          const basePath = import.meta.env.BASE_URL || '/';
          const soundPath = `${basePath}sounds/${fileName}`;
          logger.log(`Loading sound: ${soundPath}`);
          const response = await fetch(soundPath);

          if (!response.ok) {
            throw new Error(`Failed to fetch ${soundPath}: ${response.status} ${response.statusText}`);
          }

          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
          this.samples.set(voice, audioBuffer);
        })
      );
      this.isLoaded = true;
      logger.log('✅ Drum samples loaded successfully');
    } catch (error) {
      logger.error('❌ Failed to load drum samples:', error);
      this.isLoaded = false;
    }
  }

  /**
   * Play a drum hit with rate limiting to prevent audio spam
   */
  playDrum(voice: DrumVoice, time: number = 0, velocity: number = 100) {
    if (!this.isLoaded) {
      logger.warn('Samples not loaded yet');
      return;
    }

    // Rate limiting: prevent rapid-fire calls for the same voice
    const now = Date.now();
    const lastPlay = this.lastPlayTime.get(voice) || 0;
    if (now - lastPlay < this.MIN_PLAY_INTERVAL_MS) {
      logger.warn(`Rate limit: Skipping ${voice} play (too soon after last hit)`);
      return;
    }
    this.lastPlayTime.set(voice, now);

    const sample = this.samples.get(voice);
    if (!sample) {
      logger.warn(`No sample found for ${voice}`);
      return;
    }

    const playTime = this.audioContext.currentTime + time;

    // Create buffer source
    const source = this.audioContext.createBufferSource();
    source.buffer = sample;

    // Create gain node for velocity
    const gainNode = this.audioContext.createGain();
    let volume = velocity / 127;

    // Boost metronome samples (they are quieter than drum samples)
    if (voice.startsWith('hihat-metronome')) {
      volume *= 2.5; // Boost metronome volume
    }
    gainNode.gain.value = volume;

    // Connect nodes
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Play
    source.start(playTime);
  }

  /**
   * Resume audio context (required for user interaction)
   */
  async resume() {
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }
  
  /**
   * Get current audio context time
   */
  getCurrentTime(): number {
    return this.audioContext.currentTime;
  }
}

