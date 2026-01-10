import { GrooveData, DrumVoice, ALL_DRUM_VOICES, getFlattenedNotes } from '../types';
import { DrumSynth } from './DrumSynth';
import { GrooveUtils } from './GrooveUtils';

export type SyncMode = 'start' | 'middle' | 'end';

/**
 * Event types emitted by the GrooveEngine
 */
export interface GrooveEngineEvents {
  positionChange: (position: number) => void;
  playbackStateChange: (isPlaying: boolean) => void;
  grooveChange: (groove: GrooveData) => void;
}

/**
 * Calculate the time offset for a note position with swing applied
 */
function calculateSwingOffset(
  position: number,
  _division: number,
  swing: number
): number {
  // Swing only affects off-beat notes (odd positions in 16th notes)
  if (position % 2 === 0) {
    return 0;
  }
  
  // Off-beat notes: delay based on swing amount
  // Convert swing percentage to ratio (0-100 -> 0-0.33)
  const swingRatio = (swing / 100) * 0.33;
  return swingRatio;
}

/**
 * Core playback engine for drum grooves
 * Completely UI-agnostic - can be used with any framework or no framework
 */
export class GrooveEngine {
  private synth: DrumSynth;
  private scheduledNotes: number[] = [];
  private scheduledVisuals = new Set<number>();
  private isPlaying = false;
  private startTime = 0;
  private currentPosition = 0;
  private scheduleAheadTime = 0.15; // Schedule notes 150ms ahead for better timing stability
  private timerID: number | null = null;
  private syncMode: SyncMode = 'middle';
  private currentGroove: GrooveData | null = null;
  private pendingGroove: GrooveData | null = null;
  private loopEnabled = true;
  
  // Event listeners
  private listeners: Partial<GrooveEngineEvents> = {};
  
  constructor(synth?: DrumSynth) {
    this.synth = synth || new DrumSynth();
  }
  
  /**
   * Register event listeners
   */
  on<K extends keyof GrooveEngineEvents>(
    event: K,
    callback: GrooveEngineEvents[K]
  ): void {
    this.listeners[event] = callback;
  }
  
  /**
   * Remove event listener
   */
  off<K extends keyof GrooveEngineEvents>(event: K): void {
    delete this.listeners[event];
  }
  
  /**
   * Emit an event
   */
  private emit<K extends keyof GrooveEngineEvents>(
    event: K,
    ...args: Parameters<GrooveEngineEvents[K]>
  ): void {
    const listener = this.listeners[event];
    if (listener) {
      // @ts-ignore - TypeScript has trouble with spread args here
      listener(...args);
    }
  }
  
  /**
   * Set the sync mode for visual updates
   */
  setSyncMode(mode: SyncMode): void {
    this.syncMode = mode;
  }
  
  /**
   * Get current sync mode
   */
  getSyncMode(): SyncMode {
    return this.syncMode;
  }
  
  /**
   * Update the groove during playback
   * Changes will take effect on the next loop
   * Validates division compatibility and auto-corrects if needed
   */
  updateGroove(groove: GrooveData): void {
    // Validate division compatibility with time signature
    if (!GrooveUtils.isDivisionCompatible(
      groove.division,
      groove.timeSignature.beats,
      groove.timeSignature.noteValue
    )) {
      console.warn(
        `Division ${groove.division} is incompatible with ${groove.timeSignature.beats}/${groove.timeSignature.noteValue} time. ` +
        `Auto-correcting to compatible division.`
      );
      groove.division = GrooveUtils.getDefaultDivision(
        groove.timeSignature.beats,
        groove.timeSignature.noteValue
      );
    }

    // Auto-disable swing for triplets and quarter notes
    if (!GrooveUtils.doesDivisionSupportSwing(groove.division)) {
      if (groove.swing > 0) {
        console.info(`Swing disabled for division ${groove.division} (triplets/quarter notes don't support swing)`);
        groove.swing = 0;
      }
    }

    if (this.isPlaying) {
      this.pendingGroove = groove;
    } else {
      this.currentGroove = groove;
      this.emit('grooveChange', groove);
    }
  }
  
  /**
   * Get current groove
   */
  getCurrentGroove(): GrooveData | null {
    return this.currentGroove;
  }
  
  /**
   * Check if there are pending changes
   */
  hasPendingChanges(): boolean {
    return this.pendingGroove !== null;
  }
  
  /**
   * Start playback
   */
  async play(groove: GrooveData, loop: boolean = true): Promise<void> {
    await this.synth.resume();

    if (this.isPlaying) {
      return;
    }

    this.isPlaying = true;
    this.currentPosition = 0;
    this.startTime = this.synth.getCurrentTime();
    this.currentGroove = groove;
    this.pendingGroove = null;
    this.loopEnabled = loop;
    
    this.emit('playbackStateChange', true);

    this.scheduleLoop();
  }

  /**
   * Main scheduling loop
   */
  private scheduleLoop(): void {
    if (!this.isPlaying) {
      return;
    }

    const currentTime = this.synth.getCurrentTime();
    const activeGroove = this.currentGroove!;

    // Calculate note duration based on tempo and division
    const beatDuration = 60 / activeGroove.tempo;
    const noteDuration = beatDuration / (activeGroove.division / 4);

    // Get total positions across all measures
    const totalPositions = GrooveUtils.getTotalPositions(activeGroove);

    // Get flattened notes for multi-measure playback
    const flatNotes = getFlattenedNotes(activeGroove);

    // Schedule notes that should play in the next scheduleAheadTime window
    while (true) {
      // Calculate absolute position within the full groove
      const absolutePosition = this.currentPosition % totalPositions;

      // Calculate time for this position
      const noteTime = this.startTime + (this.currentPosition * noteDuration);

      // Stop scheduling if we're too far ahead
      if (noteTime > currentTime + this.scheduleAheadTime) {
        break;
      }

      // Get measure-relative position for swing calculation
      const { positionInMeasure } = GrooveUtils.absoluteToMeasurePosition(activeGroove, absolutePosition);

      // Calculate swing offset
      const swingOffset = calculateSwingOffset(
        positionInMeasure,
        activeGroove.division,
        activeGroove.swing
      );

      const playTime = noteTime + (swingOffset * noteDuration);

      // Schedule notes for each voice
      ALL_DRUM_VOICES.forEach((voice) => {
        if (flatNotes[voice]?.[absolutePosition]) {
          this.synth.playDrum(voice, playTime - currentTime, 100);
        }
      });

      // Schedule visual update based on sync mode (using absolute position)
      this.scheduleVisualUpdate(playTime, currentTime, noteDuration, absolutePosition);

      this.currentPosition++;

      // Check if we've completed a full loop through all measures
      if (absolutePosition === totalPositions - 1) {
        if (!this.loopEnabled) {
          this.stop();
          return;
        }

        // Apply pending groove changes at the end of the loop
        if (this.pendingGroove) {
          const nextLoopStartTime = this.startTime + (this.currentPosition * noteDuration);
          this.currentGroove = this.pendingGroove;
          this.pendingGroove = null;
          this.startTime = nextLoopStartTime;
          this.currentPosition = 0;
          this.emit('grooveChange', this.currentGroove);
        }
      }
    }

    // Schedule next check (50ms interval reduces CPU usage while maintaining timing accuracy)
    this.timerID = window.setTimeout(() => this.scheduleLoop(), 50);
  }

  /**
   * Schedule visual position update
   */
  private scheduleVisualUpdate(
    playTime: number,
    currentTime: number,
    noteDuration: number,
    position: number
  ): void {
    let visualTime: number;

    switch (this.syncMode) {
      case 'start':
        visualTime = playTime;
        break;
      case 'middle':
        visualTime = playTime - (noteDuration / 2);
        break;
      case 'end':
        visualTime = playTime - noteDuration;
        break;
    }

    const visualDelay = (visualTime - currentTime) * 1000;
    const timeoutId = window.setTimeout(() => {
      // Self-clean: remove from set after execution to prevent memory leak
      this.scheduledVisuals.delete(timeoutId);
      if (this.isPlaying) {
        this.emit('positionChange', position);
      }
    }, Math.max(0, visualDelay));

    this.scheduledVisuals.add(timeoutId);
  }

  /**
   * Stop playback
   */
  stop(): void {
    this.isPlaying = false;
    this.currentPosition = 0;

    if (this.timerID !== null) {
      clearTimeout(this.timerID);
      this.timerID = null;
    }

    // Clear scheduled notes
    this.scheduledNotes.forEach((id) => clearTimeout(id));
    this.scheduledNotes = [];

    // Clear scheduled visual updates
    this.scheduledVisuals.forEach((id) => clearTimeout(id));
    this.scheduledVisuals.clear();

    this.emit('playbackStateChange', false);
    this.emit('positionChange', -1);
  }

  /**
   * Check if currently playing
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Get current tempo
   */
  getTempo(): number {
    return this.currentGroove?.tempo ?? 120;
  }

  /**
   * Set tempo during playback without restarting
   * Adjusts timing seamlessly for the next scheduled notes
   */
  setTempo(tempo: number): void {
    if (!this.currentGroove) return;

    // Clamp tempo to valid range
    const clampedTempo = Math.max(30, Math.min(300, tempo));

    if (this.isPlaying) {
      // Calculate current time offset before tempo change
      const currentTime = this.synth.getCurrentTime();
      const oldBeatDuration = 60 / this.currentGroove.tempo;
      const oldNoteDuration = oldBeatDuration / (this.currentGroove.division / 4);
      const elapsedTime = currentTime - this.startTime;
      const elapsedPositions = elapsedTime / oldNoteDuration;

      // Update tempo
      this.currentGroove = { ...this.currentGroove, tempo: clampedTempo };

      // Recalculate start time to maintain smooth transition
      const newBeatDuration = 60 / clampedTempo;
      const newNoteDuration = newBeatDuration / (this.currentGroove.division / 4);
      this.startTime = currentTime - (elapsedPositions * newNoteDuration);

      // Also update pending groove if exists
      if (this.pendingGroove) {
        this.pendingGroove = { ...this.pendingGroove, tempo: clampedTempo };
      }

      this.emit('grooveChange', this.currentGroove);
    } else {
      // Not playing - just update the groove
      this.currentGroove = { ...this.currentGroove, tempo: clampedTempo };
      this.emit('grooveChange', this.currentGroove);
    }
  }

  /**
   * Play a single drum hit (for preview)
   */
  async playPreview(voice: DrumVoice): Promise<void> {
    await this.synth.resume();
    this.synth.playDrum(voice, 0, 100);
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.stop();
    this.listeners = {};
  }
}

