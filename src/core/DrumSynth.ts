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
  private masterGainNode: GainNode;

  // Rate limiting for audio playback (prevent spam/DoS)
  private lastPlayTime = new Map<DrumVoice, number>();
  private readonly MIN_PLAY_INTERVAL_AUDIO_TIME = 0.008; // Minimum 8ms in audio time units (allows ~125 plays/sec per voice)

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

    // Initialize master gain node for volume control
    this.masterGainNode = this.audioContext.createGain();
    this.masterGainNode.gain.value = 1.0; // Default to full volume
    this.masterGainNode.connect(this.audioContext.destination);

    this.setupErrorHandling();
    this.loadSamples();
  }

  /**
   * Set up error event handling for audio context
   */
  private setupErrorHandling() {
    // Listen for audio processing errors
    if (this.audioContext instanceof AudioContext && 'addEventListener' in this.audioContext) {
      (this.audioContext as any).addEventListener?.('processorerror', (event: any) => {
        logger.error('AudioContext processorerror:', event);
      });
    }
  }

  /**
   * Load all drum samples with individual error handling
   * Allows partial loading - app continues even if some samples fail
   */
  private async loadSamples() {
    const voices: DrumVoice[] = Object.keys(this.sampleFiles) as DrumVoice[];
    const failedVoices: DrumVoice[] = [];

    await Promise.allSettled(
      voices.map(async (voice) => {
        const fileName = this.sampleFiles[voice];
        const basePath = import.meta.env.BASE_URL || '/';
        const soundPath = `${basePath}sounds/${fileName}`;

        try {
          logger.log(`Loading sound: ${soundPath}`);
          const response = await fetch(soundPath, {
            signal: AbortSignal.timeout(10000) // 10 second timeout
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const arrayBuffer = await response.arrayBuffer();
          const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
          this.samples.set(voice, audioBuffer);
          logger.log(`✅ Loaded: ${voice}`);
        } catch (error) {
          failedVoices.push(voice);
          logger.warn(`⚠️ Failed to load ${voice}: ${error}`);
        }
      })
    );

    if (this.samples.size > 0) {
      this.isLoaded = true;
      if (failedVoices.length > 0) {
        logger.warn(`⚠️ Partial load: ${this.samples.size} samples loaded, ${failedVoices.length} failed`);
      } else {
        logger.log('✅ All drum samples loaded successfully');
      }
    } else {
      logger.error('❌ Failed to load any drum samples - generating synthetic fallback');
      this.generateFallbackSamples();
      this.isLoaded = true;
    }
  }

  /**
   * Generate simple synthetic drum sounds as fallback
   */
  private generateFallbackSamples() {
    const sampleRate = this.audioContext.sampleRate;
    const duration = 0.5; // 500ms samples
    const length = sampleRate * duration;

    // Generate kick (low frequency)
    const kickBuffer = this.audioContext.createBuffer(1, length, sampleRate);
    const kickData = kickBuffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const decay = Math.exp(-t * 4);
      kickData[i] = decay * Math.sin(2 * Math.PI * 60 * t);
    }
    this.samples.set('kick', kickBuffer);

    // Generate snare (noise)
    const snareBuffer = this.audioContext.createBuffer(1, length, sampleRate);
    const snareData = snareBuffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const decay = Math.exp(-t * 8);
      snareData[i] = decay * (Math.random() * 2 - 1);
    }
    this.samples.set('snare-normal', snareBuffer);

    // Generate hi-hat (bright noise)
    const hihatBuffer = this.audioContext.createBuffer(1, Math.floor(sampleRate * 0.2), sampleRate);
    const hihatData = hihatBuffer.getChannelData(0);
    for (let i = 0; i < hihatData.length; i++) {
      const t = i / sampleRate;
      const decay = Math.exp(-t * 15);
      hihatData[i] = decay * (Math.random() * 2 - 1) * 0.3;
    }
    this.samples.set('hihat-closed', hihatBuffer);

    logger.log('⚠️ Using synthetic drum sounds as fallback');
  }

  /**
   * Play a drum hit with rate limiting to prevent audio spam
   */
  playDrum(voice: DrumVoice, time: number = 0, velocity: number = 100) {
    if (!this.isLoaded) {
      return;
    }

    const playTime = this.audioContext.currentTime + time;

    // Rate limiting: prevent rapid-fire calls for the same voice using audio time
    const lastPlay = this.lastPlayTime.get(voice) || 0;
    if (lastPlay > 0 && playTime - lastPlay < this.MIN_PLAY_INTERVAL_AUDIO_TIME) {
      return;
    }
    this.lastPlayTime.set(voice, playTime);

    // Try exact voice first, then fallback to similar voice
    let sample = this.samples.get(voice);
    if (!sample) {
      // Fallback logic: use similar drum type if exact voice not found
      const drumType = voice.split('-')[0]; // e.g., 'snare' from 'snare-ghost'
      sample = Array.from(this.samples.entries()).find(([key]) =>
        key.startsWith(drumType)
      )?.[1];

      if (!sample) {
        // Last resort: use kick as generic fallback
        sample = this.samples.get('kick');
      }
    }

    if (!sample) {
      return;
    }

    try {
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

      // Connect nodes through master gain
      source.connect(gainNode);
      gainNode.connect(this.masterGainNode);

      // Play
      source.start(playTime);
    } catch (error) {
      logger.error(`Failed to play ${voice} at time ${playTime}: ${error}`);
    }
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

  /**
   * Set master volume (0-1)
   */
  setMasterVolume(volume: number): void {
    // Clamp volume to 0-1 range
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.masterGainNode.gain.value = clampedVolume;
  }

  /**
   * Get current master volume (0-1)
   */
  getMasterVolume(): number {
    return this.masterGainNode.gain.value;
  }
}

