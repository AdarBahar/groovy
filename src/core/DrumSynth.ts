import { DrumVoice } from '../types';

/**
 * Drum sample player using Web Audio API
 * Loads and plays drum samples
 */
export class DrumSynth {
  private audioContext: AudioContext;
  private samples: Map<string, AudioBuffer> = new Map();
  private isLoaded = false;

  // Map drum voices to sample file names
  private sampleFiles: Record<DrumVoice, string> = {
    kick: 'Kick.mp3',
    snare: 'Snare Normal.mp3',
    hihat: 'Hi Hat Normal.mp3',
  };

  constructor() {
    this.audioContext = new AudioContext();
    this.loadSamples();
  }

  /**
   * Load all drum samples
   */
  private async loadSamples() {
    const voices: DrumVoice[] = ['kick', 'snare', 'hihat'];

    try {
      await Promise.all(
        voices.map(async (voice) => {
          const fileName = this.sampleFiles[voice];
          // Use relative path with import.meta.env.BASE_URL for correct base path
          const basePath = import.meta.env.BASE_URL || '/';
          const soundPath = `${basePath}sounds/${fileName}`;
          console.log(`Loading sound: ${soundPath}`);
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
      console.log('✅ Drum samples loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load drum samples:', error);
      this.isLoaded = false;
    }
  }

  /**
   * Play a drum hit
   */
  playDrum(voice: DrumVoice, time: number = 0, velocity: number = 100) {
    if (!this.isLoaded) {
      console.warn('Samples not loaded yet');
      return;
    }

    const sample = this.samples.get(voice);
    if (!sample) {
      console.warn(`No sample found for ${voice}`);
      return;
    }

    const now = this.audioContext.currentTime + time;

    // Create buffer source
    const source = this.audioContext.createBufferSource();
    source.buffer = sample;

    // Create gain node for velocity
    const gainNode = this.audioContext.createGain();
    const volume = velocity / 127;
    gainNode.gain.value = volume;

    // Connect nodes
    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    // Play
    source.start(now);
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

