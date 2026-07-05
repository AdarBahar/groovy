/**
 * BeatComparator - POC per-beat console comparison of groove pattern vs MIDI hits
 *
 * Mirrors PerformanceTracker's lifecycle and timing conventions (same clock, same
 * stepsPerBeat, same wrap logic) but emits ONE console line per quarter-note beat
 * comparing what the loaded groove pattern expects ("player") against what the
 * drummer actually played via MIDI ("midi"), plus a timing verdict.
 *
 * React-free. Output is gated behind logger.log (debug mode only).
 */

import { DrumVoice, GrooveData, getFlattenedNotes } from '../types';
import { DRUM_VOICE_CONFIG, ALL_DRUM_VOICES } from '../core/DrumVoiceConfig';
import { logger } from '../utils/logger';

/** Per-beat accumulator of MIDI hits recorded before the beat is flushed. */
interface BeatBucket {
  voices: DrumVoice[];
  errSum: number;
  errCount: number;
}

/** How often the flush loop checks for beats that have fully ended. */
const FLUSH_INTERVAL_MS = 100;

class BeatComparator {
  private enabled = false;
  private startTime: number | null = null;
  private tempo = 120;
  private division = 8;
  private flattened: Record<DrumVoice, boolean[]> | null = null;
  private totalSteps = 0;
  private buckets = new Map<number, BeatBucket>();
  private nextBeatToFlush = 0;
  private intervalHandle: ReturnType<typeof setInterval> | null = null;

  /**
   * Enable per-beat comparison logging for a loaded groove.
   * @param groove - Full GrooveData (division, tempo, measures) to compare hits against.
   * @param startTime - Same clock anchor passed to PerformanceTracker.enable() (performance.now()).
   */
  enable(groove: GrooveData, startTime: number): void {
    this.tempo = groove.tempo;
    this.division = groove.division;
    this.flattened = getFlattenedNotes(groove);
    this.totalSteps = this.computeTotalSteps(this.flattened);
    this.startTime = startTime;
    this.buckets = new Map();
    this.nextBeatToFlush = 0;
    this.enabled = true;

    if (this.intervalHandle != null) {
      clearInterval(this.intervalHandle);
    }
    this.intervalHandle = setInterval(() => this.flush(), FLUSH_INTERVAL_MS);
  }

  /** Disable comparison logging. Does NOT flush remaining beats. */
  disable(): void {
    this.enabled = false;
    if (this.intervalHandle != null) {
      clearInterval(this.intervalHandle);
      this.intervalHandle = null;
    }
  }

  /**
   * Update tempo mid-session (for auto speed-up support).
   * POC simplification: the absolute beat index is computed from the current tempo
   * only (same simplification PerformanceTracker makes; acceptable mid-session drift
   * for a POC).
   */
  setTempo(tempo: number): void {
    if (!this.enabled || !tempo || tempo <= 0) return;
    this.tempo = tempo;
  }

  /**
   * Update the loaded groove pattern mid-session (for live editing during playback).
   * Preserves startTime, in-flight buckets, and nextBeatToFlush.
   */
  updateGroove(groove: GrooveData): void {
    if (!this.enabled) return;

    this.tempo = groove.tempo;
    this.division = groove.division;
    this.flattened = getFlattenedNotes(groove);
    this.totalSteps = this.computeTotalSteps(this.flattened);
  }

  /**
   * Record a MIDI hit. MUST be O(1) — called from the <1ms MIDI event handler budget.
   * @param voice - Drum voice that was hit.
   * @param timestamp - Hit timestamp on the same clock as startTime.
   * @param timingErrorMs - Signed timing error from PerformanceTracker.analyzeHit().
   */
  recordHit(voice: DrumVoice, timestamp: number, timingErrorMs: number): void {
    if (!this.enabled || this.startTime == null) return;

    const stepsPerBeat = this.division / 4;
    const beatDurMs = (60 / this.tempo) * 1000;
    const stepDurMs = beatDurMs / stepsPerBeat;
    const elapsedMs = timestamp - this.startTime;
    const step = Math.round(elapsedMs / stepDurMs);
    const beat = Math.floor(step / stepsPerBeat);

    // A hit mapping to an already-flushed beat would sit in an orphan bucket forever
    // and never be logged. This happens when hit timestamps are shifted into the past
    // (e.g. latency compensation larger than the flush grace window) — warn instead
    // of silently dropping so misconfiguration is visible.
    if (beat < this.nextBeatToFlush) {
      logger.warn(
        `[BeatCompare] hit (${voice}) maps to beat ${beat + 1}, already flushed ` +
        `(next=${this.nextBeatToFlush + 1}) — check latency compensation config`
      );
      return;
    }

    let bucket = this.buckets.get(beat);
    if (!bucket) {
      bucket = { voices: [], errSum: 0, errCount: 0 };
      this.buckets.set(beat, bucket);
    }
    if (!bucket.voices.includes(voice)) {
      bucket.voices.push(voice);
    }
    bucket.errSum += timingErrorMs;
    bucket.errCount += 1;
  }

  /**
   * Total step count from the flattened pattern (length of any voice's boolean[]).
   * @private
   */
  private computeTotalSteps(flattened: Record<DrumVoice, boolean[]>): number {
    for (const voice of ALL_DRUM_VOICES) {
      const arr = flattened[voice];
      if (arr && arr.length > 0) return arr.length;
    }
    return 0;
  }

  /**
   * Flush every beat that has fully ended (plus a tempo-aware grace window), so silent
   * beats still get logged even though recordHit was never called for them.
   * @private
   */
  private flush(): void {
    if (!this.enabled || this.startTime == null) return;

    const beatDurMs = (60 / this.tempo) * 1000;
    const grace = Math.min(90, beatDurMs * 0.18);
    const elapsed = performance.now() - this.startTime;
    const maxFlushable = Math.floor((elapsed - grace) / beatDurMs) - 1;

    for (let beat = this.nextBeatToFlush; beat <= maxFlushable; beat++) {
      this.flushBeat(beat);
    }
    if (maxFlushable + 1 > this.nextBeatToFlush) {
      this.nextBeatToFlush = maxFlushable + 1;
    }
  }

  /**
   * Log the [BeatCompare] line for a single beat and drop its bucket.
   * @private
   */
  private flushBeat(beat: number): void {
    const beatDurMs = (60 / this.tempo) * 1000;
    const stepsPerBeat = this.division / 4;
    const onTimeMs = Math.min(25, beatDurMs * 0.05);

    const playerVoices = this.expectedVoicesForBeat(beat, stepsPerBeat);
    const bucket = this.buckets.get(beat);
    const midiVoices = bucket ? bucket.voices : [];

    const playerStr = this.namesFor(playerVoices);
    const midiStr = this.namesFor(midiVoices);

    let verdict: string;
    if (!bucket || bucket.errCount === 0) {
      verdict = '—';
    } else {
      const mean = bucket.errSum / bucket.errCount;
      // Sign convention mirrors performanceGrader / PerformanceTracker:
      // negative=slow=late, positive=fast=early.
      if (Math.abs(mean) <= onTimeMs) {
        verdict = 'on time';
      } else if (mean < 0) {
        verdict = 'late';
      } else {
        verdict = 'early';
      }
    }

    logger.log(
      `[BeatCompare] beat ${beat + 1} | player: ${playerStr} | midi: ${midiStr} | time: ${verdict}`
    );

    this.buckets.delete(beat);
  }

  /**
   * Voices the pattern expects during the given absolute beat index.
   * @private
   */
  private expectedVoicesForBeat(beat: number, stepsPerBeat: number): DrumVoice[] {
    if (!this.flattened || this.totalSteps <= 0) return [];

    const voices: DrumVoice[] = [];
    const startStep = beat * stepsPerBeat;
    const endStep = startStep + stepsPerBeat;

    for (const voice of ALL_DRUM_VOICES) {
      const pattern = this.flattened[voice];
      if (!pattern) continue;

      let present = false;
      for (let s = startStep; s < endStep; s++) {
        const stepInPattern = ((s % this.totalSteps) + this.totalSteps) % this.totalSteps;
        if (pattern[stepInPattern]) {
          present = true;
          break;
        }
      }
      if (present) voices.push(voice);
    }
    return voices;
  }

  /** Map distinct voices to display names, ' & '-joined; empty list → '—'. @private */
  private namesFor(voices: DrumVoice[]): string {
    if (voices.length === 0) return '—';
    return voices.map((voice) => DRUM_VOICE_CONFIG[voice].name).join(' & ');
  }
}

export { BeatComparator };
export const beatComparator = new BeatComparator();
