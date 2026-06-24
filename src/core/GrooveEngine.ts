import { GrooveData, DrumVoice, ALL_DRUM_VOICES, getFlattenedNotes, MetronomeFrequency, MetronomeOffsetClick, MetronomeConfig } from '../types';
import { DrumSynth } from './DrumSynth';
import { GrooveUtils } from './GrooveUtils';
import { MetronomeManager } from './MetronomeManager';
import { logger } from '../utils/logger';

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
  if (position % 2 === 0) {
    return 0;
  }
  const swingRatio = (swing / 100) * 0.33;
  return swingRatio;
}

/**
 * Core playback engine for drum grooves
 * Completely UI-agnostic - can be used with any framework or no framework
 */
export class GrooveEngine {
  private synth: DrumSynth;
  private isPlaying = false;
  private startTime = 0;
  private currentPosition = 0;
  private timerID: number | null = null;
  private endStopTimerID: number | null = null;
  private syncMode: SyncMode = 'middle';
  private currentGroove: GrooveData | null = null;
  private pendingGroove: GrooveData | null = null;
  private loopEnabled = true;
  private baseScheduleAheadTime = 0.15;

  private visualRAFId: number | null = null;
  private lastEmittedPosition: number = -1;

  // Performance.now() anchor captured at the instant playback begins.
  // Shared with useMIDITracking so PerformanceTracker uses the same clock.
  private playStartPerformanceTime: number | null = null;

  private readonly metronome = new MetronomeManager();

  private listeners: Partial<GrooveEngineEvents> = {};

  constructor(synth?: DrumSynth) {
    this.synth = synth || new DrumSynth();
  }

  getSynth(): DrumSynth {
    return this.synth;
  }

  /**
   * Get the performance.now() timestamp captured at the start of playback.
   * Returns null when not playing or before the first play() call.
   */
  getPlayStartPerformanceTime(): number | null {
    return this.playStartPerformanceTime;
  }

  on<K extends keyof GrooveEngineEvents>(event: K, callback: GrooveEngineEvents[K]): void {
    this.listeners[event] = callback;
  }

  off<K extends keyof GrooveEngineEvents>(event: K): void {
    delete this.listeners[event];
  }

  private emit<K extends keyof GrooveEngineEvents>(
    event: K,
    ...args: Parameters<GrooveEngineEvents[K]>
  ): void {
    const listener = this.listeners[event];
    if (listener) {
      (listener as (...callbackArgs: typeof args) => void)(...args);
    }
  }

  setSyncMode(mode: SyncMode): void {
    this.syncMode = mode;
  }

  getSyncMode(): SyncMode {
    return this.syncMode;
  }

  // ===== Metronome delegation =====

  setMetronomeFrequency(frequency: MetronomeFrequency): void {
    this.metronome.setFrequency(frequency);
  }

  getMetronomeFrequency(): MetronomeFrequency {
    return this.metronome.getFrequency();
  }

  setMetronomeSolo(solo: boolean): void {
    this.metronome.setSolo(solo);
  }

  getMetronomeSolo(): boolean {
    return this.metronome.getSolo();
  }

  setMetronomeCountIn(countIn: boolean): void {
    this.metronome.setCountIn(countIn);
  }

  getMetronomeCountIn(): boolean {
    return this.metronome.getCountIn();
  }

  setMetronomeOffsetClick(offsetClick: MetronomeOffsetClick): void {
    this.metronome.setOffsetClick(offsetClick);
  }

  getMetronomeOffsetClick(): MetronomeOffsetClick {
    return this.metronome.getOffsetClick();
  }

  setMetronomeVolume(volume: number): void {
    this.metronome.setVolume(volume);
  }

  getMetronomeVolume(): number {
    return this.metronome.getVolume();
  }

  getMetronomeConfig(): MetronomeConfig {
    return this.metronome.getConfig();
  }

  setMetronomeConfig(config: Partial<MetronomeConfig>): void {
    this.metronome.setConfig(config);
  }

  // ===== Volume =====

  setMasterVolume(volume: number): void {
    const clampedVolume = Math.max(0, Math.min(1, volume));
    this.synth.setMasterVolume(clampedVolume);
  }

  getMasterVolume(): number {
    return this.synth.getMasterVolume();
  }

  /**
   * Update the groove during playback
   * Changes will take effect on the next loop
   * Validates division compatibility and auto-corrects if needed
   */
  updateGroove(groove: GrooveData): void {
    let corrected: GrooveData = groove;

    if (!GrooveUtils.isDivisionCompatible(
      corrected.division,
      corrected.timeSignature.beats,
      corrected.timeSignature.noteValue
    )) {
      logger.warn(
        `Division ${corrected.division} is incompatible with ${corrected.timeSignature.beats}/${corrected.timeSignature.noteValue} time. ` +
        `Auto-correcting to compatible division.`
      );
      corrected = {
        ...corrected,
        division: GrooveUtils.getDefaultDivision(
          corrected.timeSignature.beats,
          corrected.timeSignature.noteValue
        ),
      };
    }

    if (!GrooveUtils.doesDivisionSupportSwing(corrected.division)) {
      if (corrected.swing > 0) {
        logger.info(`Swing disabled for division ${corrected.division} (triplets/quarter notes don't support swing)`);
        corrected = { ...corrected, swing: 0 };
      }
    }

    if (this.isPlaying) {
      this.pendingGroove = corrected;
    } else {
      this.currentGroove = corrected;
      this.emit('grooveChange', corrected);
    }
  }

  getCurrentGroove(): GrooveData | null {
    return this.currentGroove;
  }

  hasPendingChanges(): boolean {
    return this.pendingGroove !== null;
  }

  async play(groove: GrooveData, loop: boolean = true): Promise<void> {
    await this.synth.resume();

    if (this.isPlaying) return;

    this.isPlaying = true;
    this.currentPosition = 0;
    this.startTime = this.synth.getCurrentTime();
    this.playStartPerformanceTime = performance.now();
    this.currentGroove = groove;
    this.pendingGroove = null;
    this.loopEnabled = loop;

    if (this.endStopTimerID !== null) {
      clearTimeout(this.endStopTimerID);
      this.endStopTimerID = null;
    }

    this.metronome.resetRotation();
    this.emit('playbackStateChange', true);

    this.scheduleLoop();
    this.startVisualLoop();
  }

  private scheduleLoop(): void {
    if (!this.isPlaying) return;

    const currentTime = this.synth.getCurrentTime();
    const activeGroove = this.currentGroove!;

    const beatDuration = 60 / activeGroove.tempo;
    const noteDuration = beatDuration / (activeGroove.division / 4);
    const totalPositions = GrooveUtils.getTotalPositions(activeGroove);
    const flatNotes = getFlattenedNotes(activeGroove);

    // Adaptive schedule-ahead time: reduce at high tempos to reduce audio node accumulation
    let effectiveScheduleAheadTime = this.baseScheduleAheadTime;
    const notesPerSecond = (activeGroove.tempo * activeGroove.division) / (4 * 60);

    if (notesPerSecond > 32) {
      effectiveScheduleAheadTime = 0.05;
    } else if (notesPerSecond > 24) {
      effectiveScheduleAheadTime = 0.065;
    } else if (notesPerSecond > 16) {
      effectiveScheduleAheadTime = 0.08;
    } else if (activeGroove.tempo > 180) {
      effectiveScheduleAheadTime = 0.1;
    } else if (activeGroove.tempo > 150) {
      effectiveScheduleAheadTime = 0.12;
    }

    while (true) {
      const absolutePosition = this.currentPosition % totalPositions;
      const noteTime = this.startTime + (this.currentPosition * noteDuration);

      if (noteTime > currentTime + effectiveScheduleAheadTime) break;

      const { measureIndex, positionInMeasure } = GrooveUtils.absoluteToMeasurePosition(activeGroove, absolutePosition);

      const swingOffset = calculateSwingOffset(positionInMeasure, activeGroove.division, activeGroove.swing);
      const playTime = noteTime + (swingOffset * noteDuration);

      const metronomeConfig = this.metronome.getConfig();

      if (!metronomeConfig.solo) {
        ALL_DRUM_VOICES.forEach((voice) => {
          if (flatNotes[voice]?.[absolutePosition]) {
            this.synth.playDrum(voice, playTime - currentTime, 100);
          }
        });
      }

      if (metronomeConfig.frequency > 0) {
        const measure = activeGroove.measures[measureIndex];
        const timeSignature = measure?.timeSignature || activeGroove.timeSignature;
        const notesPerMeasure = GrooveUtils.calcNotesPerMeasure(
          activeGroove.division,
          timeSignature.beats,
          timeSignature.noteValue
        );

        const clickType = this.metronome.shouldPlayClick(
          positionInMeasure,
          activeGroove.division,
          timeSignature,
          notesPerMeasure
        );

        if (clickType) {
          const voice: DrumVoice = clickType === 'accent'
            ? 'hihat-metronome-accent'
            : 'hihat-metronome-normal';
          const velocity = Math.round((metronomeConfig.volume / 100) * 127);
          this.synth.playDrum(voice, playTime - currentTime, velocity);
        }
      }

      this.currentPosition++;

      if (absolutePosition === totalPositions - 1) {
        if (!this.loopEnabled) {
          const grooveEndTime = this.startTime + totalPositions * noteDuration;
          const delayMs = Math.max(0, (grooveEndTime - currentTime) * 1000);
          if (this.endStopTimerID !== null) {
            clearTimeout(this.endStopTimerID);
          }
          this.endStopTimerID = window.setTimeout(() => this.stop(), delayMs);
          return;
        }

        this.metronome.onLoopComplete(activeGroove.division);

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

    this.timerID = window.setTimeout(() => this.scheduleLoop(), 50);
  }

  private startVisualLoop(): void {
    const update = () => {
      if (!this.isPlaying || !this.currentGroove) return;

      const currentTime = this.synth.getCurrentTime();
      const groove = this.currentGroove;

      const beatDuration = 60 / groove.tempo;
      const noteDuration = beatDuration / (groove.division / 4);
      const totalPositions = GrooveUtils.getTotalPositions(groove);

      const elapsed = currentTime - this.startTime;

      let syncOffset = 0;
      switch (this.syncMode) {
        case 'middle': syncOffset = noteDuration / 2; break;
        case 'end': syncOffset = noteDuration; break;
      }

      const adjustedElapsed = elapsed + syncOffset;
      let visualPosition = Math.floor(adjustedElapsed / noteDuration);

      if (this.loopEnabled && visualPosition >= 0) {
        visualPosition = visualPosition % totalPositions;
      } else if (visualPosition >= totalPositions) {
        visualPosition = totalPositions - 1;
      }

      visualPosition = Math.max(0, Math.min(visualPosition, totalPositions - 1));

      if (visualPosition !== this.lastEmittedPosition) {
        this.lastEmittedPosition = visualPosition;
        this.emit('positionChange', visualPosition);
      }

      this.visualRAFId = requestAnimationFrame(update);
    };

    this.visualRAFId = requestAnimationFrame(update);
  }

  private stopVisualLoop(): void {
    if (this.visualRAFId !== null) {
      cancelAnimationFrame(this.visualRAFId);
      this.visualRAFId = null;
    }
    this.lastEmittedPosition = -1;
  }

  stop(): void {
    this.isPlaying = false;
    this.currentPosition = 0;
    this.playStartPerformanceTime = null;

    if (this.timerID !== null) {
      clearTimeout(this.timerID);
      this.timerID = null;
    }

    if (this.endStopTimerID !== null) {
      clearTimeout(this.endStopTimerID);
      this.endStopTimerID = null;
    }

    this.stopVisualLoop();

    this.emit('playbackStateChange', false);
    this.emit('positionChange', -1);
  }

  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  getTempo(): number {
    return this.currentGroove?.tempo ?? 120;
  }

  /**
   * Set tempo during playback without restarting
   * Adjusts timing seamlessly for the next scheduled notes
   */
  setTempo(tempo: number): void {
    if (!this.currentGroove) return;

    const clampedTempo = Math.max(30, Math.min(300, tempo));

    if (this.isPlaying) {
      const currentTime = this.synth.getCurrentTime();
      const oldBeatDuration = 60 / this.currentGroove.tempo;
      const oldNoteDuration = oldBeatDuration / (this.currentGroove.division / 4);
      const elapsedTime = currentTime - this.startTime;
      const elapsedPositions = elapsedTime / oldNoteDuration;

      this.currentGroove = { ...this.currentGroove, tempo: clampedTempo };

      const newBeatDuration = 60 / clampedTempo;
      const newNoteDuration = newBeatDuration / (this.currentGroove.division / 4);
      this.startTime = currentTime - (elapsedPositions * newNoteDuration);

      if (this.pendingGroove) {
        this.pendingGroove = { ...this.pendingGroove, tempo: clampedTempo };
      }

      this.emit('grooveChange', this.currentGroove);
    } else {
      this.currentGroove = { ...this.currentGroove, tempo: clampedTempo };
      this.emit('grooveChange', this.currentGroove);
    }
  }

  async playPreview(voice: DrumVoice): Promise<void> {
    await this.synth.resume();
    this.synth.playDrum(voice, 0, 100);
  }

  dispose(): void {
    this.stop();
    this.listeners = {};
  }
}
