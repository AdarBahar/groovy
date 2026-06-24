/**
 * MetronomeManager - metronome state and click scheduling logic.
 * Extracted from GrooveEngine.ts to isolate metronome concerns.
 */

import { MetronomeFrequency, MetronomeOffsetClick, MetronomeConfig, DEFAULT_METRONOME_CONFIG } from '../types';

export class MetronomeManager {
  private config: MetronomeConfig = { ...DEFAULT_METRONOME_CONFIG };
  private currentRotationOffset = 0;
  private loopCount = 0;

  // ===== Config accessors =====

  setFrequency(frequency: MetronomeFrequency): void {
    this.config.frequency = frequency;
  }

  getFrequency(): MetronomeFrequency {
    return this.config.frequency;
  }

  setSolo(solo: boolean): void {
    this.config.solo = solo;
  }

  getSolo(): boolean {
    return this.config.solo;
  }

  setCountIn(countIn: boolean): void {
    this.config.countIn = countIn;
  }

  getCountIn(): boolean {
    return this.config.countIn;
  }

  setOffsetClick(offsetClick: MetronomeOffsetClick): void {
    this.config.offsetClick = offsetClick;
    this.currentRotationOffset = 0;
  }

  getOffsetClick(): MetronomeOffsetClick {
    return this.config.offsetClick;
  }

  setVolume(volume: number): void {
    this.config.volume = Math.max(0, Math.min(100, volume));
  }

  getVolume(): number {
    return this.config.volume;
  }

  getConfig(): MetronomeConfig {
    return { ...this.config };
  }

  setConfig(config: Partial<MetronomeConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.offsetClick !== undefined) {
      this.currentRotationOffset = 0;
    }
  }

  // ===== Playback lifecycle =====

  /**
   * Reset rotation state at the start of a new playback session.
   */
  resetRotation(): void {
    this.loopCount = 0;
    this.currentRotationOffset = 0;
  }

  /**
   * Called at the end of each loop pass to advance ROTATE offset.
   * @param division - Current groove division (to detect triplet vs straight)
   */
  onLoopComplete(division: number): void {
    this.loopCount++;
    if (this.config.offsetClick === 'ROTATE') {
      const isTriplet = division === 12 || division === 24 || division === 48;
      const rotationOptions = isTriplet ? 3 : 4;
      this.currentRotationOffset = (this.currentRotationOffset + 1) % rotationOptions;
    }
  }

  // ===== Click scheduling =====

  /**
   * Check if a metronome click should play at the given position.
   * Returns 'accent' for beat 1, 'normal' for other beats, or null for no click.
   */
  shouldPlayClick(
    positionInMeasure: number,
    division: number,
    timeSignature: { beats: number; noteValue: number },
    notesPerMeasure: number
  ): 'accent' | 'normal' | null {
    const { frequency, offsetClick } = this.config;

    if (frequency === 0) return null;

    const positionsPerBeat = notesPerMeasure / timeSignature.beats;
    const metronomeDivision = frequency;
    const clicksPerBeat = metronomeDivision / 4;
    const positionsPerClick = positionsPerBeat / clicksPerBeat;

    let offsetPositions = 0;
    const isTriplet = division === 12 || division === 24 || division === 48;

    if (offsetClick === 'ROTATE') {
      const rotationOptions = isTriplet ? ['1', 'TI', 'TA'] : ['1', 'E', 'AND', 'A'];
      const currentOffset = rotationOptions[this.currentRotationOffset % rotationOptions.length] as MetronomeOffsetClick;
      offsetPositions = this.getOffsetPositions(currentOffset, positionsPerBeat, isTriplet);
    } else {
      offsetPositions = this.getOffsetPositions(offsetClick, positionsPerBeat, isTriplet);
    }

    const adjustedPosition = (positionInMeasure - offsetPositions + notesPerMeasure) % notesPerMeasure;

    if (adjustedPosition % positionsPerClick !== 0) return null;

    return adjustedPosition === 0 ? 'accent' : 'normal';
  }

  /**
   * Get offset positions for a given offset click setting.
   * @private
   */
  private getOffsetPositions(
    offsetClick: MetronomeOffsetClick,
    positionsPerBeat: number,
    isTriplet: boolean
  ): number {
    if (isTriplet) {
      switch (offsetClick) {
        case 'TI': return Math.floor(positionsPerBeat / 3);
        case 'TA': return Math.floor((positionsPerBeat * 2) / 3);
        default: return 0;
      }
    } else {
      switch (offsetClick) {
        case 'E': return Math.floor(positionsPerBeat / 4);
        case 'AND': return Math.floor(positionsPerBeat / 2);
        case 'A': return Math.floor((positionsPerBeat * 3) / 4);
        default: return 0;
      }
    }
  }
}
