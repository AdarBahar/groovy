/**
 * Tests for BeatComparator
 *
 * Verifies the per-beat [BeatCompare] console line: format, expected-vs-played
 * voice columns, silent beats, extra/wrong voices, timing verdicts, next-downbeat
 * bucketing, and disable() cleanup.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { BeatComparator } from './BeatComparator';
import { logger } from '../utils/logger';
import { createEmptyNotesRecord } from '../types';
import type { GrooveData } from '../types';

/**
 * 4/4, division 8 (eighth notes) => stepsPerBeat = 2, tempo 120 => beatDurMs = 500,
 * stepDurMs = 250. One measure of 8 steps = 4 beats (indices 0-3).
 *
 * Pattern:
 *   beat 0 (steps 0,1): hihat-closed + kick
 *   beat 1 (steps 2,3): hihat-closed only
 *   beat 2 (steps 4,5): hihat-closed + snare-normal
 *   beat 3 (steps 6,7): nothing (fully silent pattern)
 */
function makeTestGroove(): GrooveData {
  const notes = createEmptyNotesRecord(8);
  notes['hihat-closed'] = [true, false, true, false, true, false, false, false];
  notes['kick'] = [true, false, false, false, false, false, false, false];
  notes['snare-normal'] = [false, false, false, false, true, false, false, false];

  return {
    timeSignature: { beats: 4, noteValue: 4 },
    division: 8,
    tempo: 120,
    swing: 0,
    measures: [{ notes }],
  };
}

describe('BeatComparator', () => {
  let comparator: BeatComparator;
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.useFakeTimers({ now: 0 });
    comparator = new BeatComparator();
    logSpy = vi.spyOn(logger, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    comparator.disable();
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('emits exactly one [BeatCompare] line matching the target format once a beat ends', () => {
    comparator.enable(makeTestGroove(), 0);

    comparator.recordHit('hihat-closed', 0, 0);
    comparator.recordHit('kick', 0, 0);

    // Beat 0 ends at 500ms; grace = min(90, 500*0.18) = 90 → flushable at 590ms+.
    vi.advanceTimersByTime(600);

    expect(logSpy).toHaveBeenCalledTimes(1);
    expect(logSpy).toHaveBeenCalledWith(
      '[BeatCompare] beat 1 | player: Closed Hi-Hat & Kick | midi: Closed Hi-Hat & Kick | time: on time'
    );
  });

  it('shows matching player and midi columns with "on time" verdict when hits match the pattern', () => {
    comparator.enable(makeTestGroove(), 0);

    comparator.recordHit('hihat-closed', 0, 3);
    comparator.recordHit('kick', 0, -2);

    vi.advanceTimersByTime(600);

    const lines = logSpy.mock.calls.map((call) => call[0]);
    expect(lines).toContain(
      '[BeatCompare] beat 1 | player: Closed Hi-Hat & Kick | midi: Closed Hi-Hat & Kick | time: on time'
    );
  });

  it('logs silent beats with midi: — (and player: — when the pattern is also empty)', () => {
    comparator.enable(makeTestGroove(), 0);
    // No hits recorded at all.

    // Flush all 4 beats: maxFlushable >= 3 requires elapsed >= 90 + 4*500 = 2090.
    vi.advanceTimersByTime(2100);

    const lines = logSpy.mock.calls.map((call) => call[0]);
    expect(lines).toContain(
      '[BeatCompare] beat 1 | player: Closed Hi-Hat & Kick | midi: — | time: —'
    );
    expect(lines).toContain('[BeatCompare] beat 4 | player: — | midi: — | time: —');
  });

  it('shows an extra/wrong voice in the midi column even when it is not in the pattern', () => {
    comparator.enable(makeTestGroove(), 0);

    // Beat 1 (steps 2,3) expects only hihat-closed; drummer hits hihat-open instead.
    comparator.recordHit('hihat-open', 500, 10);

    vi.advanceTimersByTime(1100);

    const lines = logSpy.mock.calls.map((call) => call[0]);
    expect(lines).toContain(
      '[BeatCompare] beat 2 | player: Closed Hi-Hat | midi: Open Hi-Hat | time: on time'
    );
  });

  it('derives late/early verdicts from the mean signed timingErrorMs', () => {
    comparator.enable(makeTestGroove(), 0);

    comparator.recordHit('hihat-closed', 0, -30); // beat 0: mean -30 → late
    comparator.recordHit('hihat-closed', 500, 30); // beat 1: mean +30 → early

    vi.advanceTimersByTime(1100);

    const lines = logSpy.mock.calls.map((call) => call[0]);
    expect(lines).toContain(
      '[BeatCompare] beat 1 | player: Closed Hi-Hat & Kick | midi: Closed Hi-Hat | time: late'
    );
    expect(lines).toContain(
      '[BeatCompare] beat 2 | player: Closed Hi-Hat | midi: Closed Hi-Hat | time: early'
    );
  });

  it('buckets a hit that quantizes to the next downbeat into the next beat, not the current one', () => {
    comparator.enable(makeTestGroove(), 0);

    // 490ms is within beat 0 (0-500ms) but rounds to step 2 (the first step of beat 1).
    comparator.recordHit('hihat-closed', 490, 5);

    vi.advanceTimersByTime(1100);

    const lines = logSpy.mock.calls.map((call) => call[0]);
    expect(lines).toContain(
      '[BeatCompare] beat 1 | player: Closed Hi-Hat & Kick | midi: — | time: —'
    );
    expect(lines).toContain(
      '[BeatCompare] beat 2 | player: Closed Hi-Hat | midi: Closed Hi-Hat | time: on time'
    );
  });

  it('disable() stops further flushes and clears the interval', () => {
    comparator.enable(makeTestGroove(), 0);
    vi.advanceTimersByTime(600);
    expect(logSpy).toHaveBeenCalledTimes(1);

    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');
    comparator.disable();
    expect(clearIntervalSpy).toHaveBeenCalled();

    vi.advanceTimersByTime(3000);
    expect(logSpy).toHaveBeenCalledTimes(1);
  });
});
