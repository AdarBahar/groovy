import { DrumVoice } from '../types';
import { logger } from '../utils/logger';

/**
 * Drum sample player using Web Audio API
 * Loads and plays drum samples
 *
 * The real AudioContext starts at the first resume() call. Browsers block audio
 * before a user gesture, so the constructor does not create the real context.
 * The constructor decodes samples with an OfflineAudioContext instead.
 * Call dispose() to close the real context when the synth is not in use.
 */
export class DrumSynth {
  private audioContext: AudioContext | null = null;
  private decodeContext: BaseAudioContext | null = null;
  private samples: Map<string, AudioBuffer> = new Map();
  private isLoaded = false;
  private masterGainNode: GainNode | null = null;
  private masterVolume = 1.0;
  private isDisposed = false;
  private initError: Error | null = null;

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
    try {
      if (typeof OfflineAudioContext !== 'undefined') {
        // Decode samples without a real AudioContext (no user gesture needed)
        this.decodeContext = new OfflineAudioContext(1, 1, 44100);
      } else if (typeof AudioContext !== 'undefined') {
        // Old browsers: create the real context at once
        this.decodeContext = this.createRealContext();
      } else {
        this.initError = new Error('Web Audio API is not available');
        logger.error('❌ Failed to initialize AudioContext:', this.initError.message);
        return;
      }

      this.loadSamples();
    } catch (error) {
      this.initError = error instanceof Error ? error : new Error(String(error));
      logger.error('❌ Failed to initialize AudioContext:', this.initError.message);
    }
  }

  /**
   * Create the real AudioContext and the master gain node (runs at most once)
   */
  private createRealContext(): AudioContext {
    if (this.audioContext) {
      return this.audioContext;
    }
    const context = new AudioContext();
    const gainNode = context.createGain();
    gainNode.gain.value = this.masterVolume;
    gainNode.connect(context.destination);
    this.audioContext = context;
    this.masterGainNode = gainNode;
    this.setupErrorHandling();
    return context;
  }

  /**
   * Check if initialization succeeded
   */
  isInitialized(): boolean {
    return this.initError === null && !this.isDisposed;
  }

  /**
   * Get initialization error if any
   */
  getInitError(): Error | null {
    return this.initError;
  }

  /**
   * Set up error event handling for audio context
   */
  private setupErrorHandling(): void {
    // Listen for audio processing errors
    if (this.audioContext && 'addEventListener' in this.audioContext) {
      this.audioContext.addEventListener?.('processorerror', (event: Event) => {
        logger.error('AudioContext processorerror:', event);
      });
    }
  }

  /**
   * Load all drum samples with individual error handling
   * Allows partial loading - app continues even if some samples fail
   */
  private async loadSamples(): Promise<void> {
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
          if (!this.decodeContext) {
            return;
          }
          const audioBuffer = await this.decodeContext.decodeAudioData(arrayBuffer);
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
  private generateFallbackSamples(): void {
    const decodeContext = this.decodeContext;
    if (!decodeContext) {
      return;
    }
    const sampleRate = decodeContext.sampleRate;
    const duration = 0.5; // 500ms samples
    const length = sampleRate * duration;

    // Generate kick (low frequency)
    const kickBuffer = decodeContext.createBuffer(1, length, sampleRate);
    const kickData = kickBuffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const decay = Math.exp(-t * 4);
      kickData[i] = decay * Math.sin(2 * Math.PI * 60 * t);
    }
    this.samples.set('kick', kickBuffer);

    // Generate snare (noise)
    const snareBuffer = decodeContext.createBuffer(1, length, sampleRate);
    const snareData = snareBuffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const decay = Math.exp(-t * 8);
      snareData[i] = decay * (Math.random() * 2 - 1);
    }
    this.samples.set('snare-normal', snareBuffer);

    // Generate hi-hat (bright noise)
    const hihatBuffer = decodeContext.createBuffer(1, Math.floor(sampleRate * 0.2), sampleRate);
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
  playDrum(voice: DrumVoice, time: number = 0, velocity: number = 100): void {
    const audioContext = this.audioContext;
    const masterGainNode = this.masterGainNode;
    if (!this.isInitialized() || !this.isLoaded || !audioContext || !masterGainNode) {
      return;
    }

    const playTime = audioContext.currentTime + time;

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
      const source = audioContext.createBufferSource();
      source.buffer = sample;

      // Create gain node for velocity
      const gainNode = audioContext.createGain();
      let volume = velocity / 127;

      // Boost metronome samples (they are quieter than drum samples)
      if (voice.startsWith('hihat-metronome')) {
        volume *= 2.5; // Boost metronome volume
      }
      gainNode.gain.value = volume;

      // Connect nodes through master gain
      source.connect(gainNode);
      gainNode.connect(masterGainNode);

      // Play
      source.start(playTime);
    } catch (error) {
      logger.error(`Failed to play ${voice} at time ${playTime}: ${error}`);
    }
  }

  /**
   * Resume audio context (required for user interaction)
   * The first call creates the real AudioContext, before any await.
   */
  async resume(): Promise<void> {
    if (!this.isInitialized()) {
      return;
    }
    if (!this.audioContext) {
      try {
        this.createRealContext();
      } catch (error) {
        this.initError = error instanceof Error ? error : new Error(String(error));
        logger.error('❌ Failed to create AudioContext:', this.initError.message);
        return;
      }
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  /**
   * Get current audio context time (0 before the first resume)
   */
  getCurrentTime(): number {
    if (!this.isInitialized() || !this.audioContext) {
      return 0;
    }
    return this.audioContext.currentTime;
  }

  /**
   * Set master volume (0-1)
   * The value is stored and applied when the real context starts.
   */
  setMasterVolume(volume: number): void {
    // Clamp volume to 0-1 range
    this.masterVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGainNode) {
      this.masterGainNode.gain.value = this.masterVolume;
    }
  }

  /**
   * Get current master volume (0-1)
   */
  getMasterVolume(): number {
    return this.masterVolume;
  }

  /**
   * Close the real AudioContext and release resources. Safe to call more than once.
   */
  dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this.isDisposed = true;
    const context = this.audioContext;
    if (context && context.state !== 'closed') {
      context.close().catch((error: unknown) => {
        logger.error('Failed to close AudioContext:', error);
      });
    }
    try {
      this.masterGainNode?.disconnect();
    } catch (error) {
      logger.warn(`Failed to disconnect master gain: ${error}`);
    }
    this.audioContext = null;
    this.masterGainNode = null;
    this.decodeContext = null;
    this.lastPlayTime.clear();
  }
}
