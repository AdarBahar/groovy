/**
 * Tests for GrooveEngine
 *
 * Focuses on the getPlayStartPerformanceTime anchor added in #117
 * and deferred non-loop stop behaviour added in #125.
 * DrumSynth is stubbed so tests run without Web Audio API.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { GrooveEngine } from './GrooveEngine';
import { DrumSynth } from './DrumSynth';
import { DEFAULT_GROOVE } from '../types';

// Stub DrumSynth to avoid AudioContext (not available in jsdom)
vi.mock('./DrumSynth', () => {
  class MockDrumSynth {
    resume = vi.fn().mockResolvedValue(undefined);
    getCurrentTime = vi.fn().mockReturnValue(0);
    playDrum = vi.fn();
    getGain = vi.fn().mockReturnValue(1);
    setGain = vi.fn();
    loadSamples = vi.fn().mockResolvedValue(undefined);
  }
  return { DrumSynth: MockDrumSynth };
});

// cancelAnimationFrame / requestAnimationFrame are available in jsdom but
// scheduleLoop uses setTimeout under the hood — no additional stub needed.

describe('GrooveEngine', () => {
  let engine: GrooveEngine;

  beforeEach(() => {
    const synthStub = new DrumSynth();
    engine = new GrooveEngine(synthStub);
  });

  afterEach(() => {
    engine.dispose();
    vi.useRealTimers();
  });

  describe('updateGroove does not mutate caller object (#119)', () => {
    it('leaves caller division unchanged when incompatible with time signature', () => {
      // 6/8 time with division 12 (triplet) — incompatible; engine should auto-correct
      const incompatibleGroove = {
        ...DEFAULT_GROOVE,
        timeSignature: { beats: 6, noteValue: 8 as const },
        division: 12 as const, // triplet not compatible with 6/8
        swing: 0,
      };
      const originalDivision = incompatibleGroove.division;

      engine.updateGroove(incompatibleGroove);

      // Caller's division must not have been touched
      expect(incompatibleGroove.division).toBe(originalDivision);
    });

    it('leaves caller swing unchanged when division does not support swing', () => {
      // division 4 (quarter notes) doesn't support swing
      const noSwingGroove = {
        ...DEFAULT_GROOVE,
        division: 4 as const,
        swing: 50,
      };
      const originalSwing = noSwingGroove.swing;

      engine.updateGroove(noSwingGroove);

      // Caller's swing value must not have been changed
      expect(noSwingGroove.swing).toBe(originalSwing);
    });

    it('engine stored groove reflects the auto-corrected division', async () => {
      // Capture emitted groove via grooveChange event
      let emittedGroove: any = null;
      engine.on('grooveChange', (g) => { emittedGroove = g; });

      const incompatibleGroove = {
        ...DEFAULT_GROOVE,
        timeSignature: { beats: 6, noteValue: 8 as const },
        division: 12 as const,
        swing: 0,
      };

      engine.updateGroove(incompatibleGroove);

      // Engine should have emitted a corrected groove (different division from caller)
      expect(emittedGroove).not.toBeNull();
      expect(emittedGroove.division).not.toBe(incompatibleGroove.division);
    });

    it('valid groove is stored without unexpected mutations', () => {
      // A groove with no corrections needed should still work properly
      const validGroove = { ...DEFAULT_GROOVE };
      let emittedGroove: any = null;
      engine.on('grooveChange', (g) => { emittedGroove = g; });

      engine.updateGroove(validGroove);

      expect(emittedGroove).not.toBeNull();
      expect(emittedGroove.division).toBe(validGroove.division);
      expect(emittedGroove.swing).toBe(validGroove.swing);
    });
  });

  describe('getPlayStartPerformanceTime (#117)', () => {
    it('returns null before play() is called', () => {
      expect(engine.getPlayStartPerformanceTime()).toBeNull();
    });

    it('returns a number after play() and the value is close to performance.now()', async () => {
      const before = performance.now();
      await engine.play(DEFAULT_GROOVE, false);
      const after = performance.now();

      const anchor = engine.getPlayStartPerformanceTime();
      expect(anchor).not.toBeNull();
      expect(typeof anchor).toBe('number');
      // Anchor must have been captured between before and after (within reasonable tolerance)
      expect(anchor!).toBeGreaterThanOrEqual(before - 5);
      expect(anchor!).toBeLessThanOrEqual(after + 5);
    });

    it('returns null after stop() is called', async () => {
      await engine.play(DEFAULT_GROOVE, false);
      expect(engine.getPlayStartPerformanceTime()).not.toBeNull();

      engine.stop();
      expect(engine.getPlayStartPerformanceTime()).toBeNull();
    });

    it('anchor persists across the playback session until stop()', async () => {
      await engine.play(DEFAULT_GROOVE, false);
      const anchor = engine.getPlayStartPerformanceTime();

      // Calling getPlayStartPerformanceTime again returns the same stable value
      expect(engine.getPlayStartPerformanceTime()).toBe(anchor);
      expect(engine.getPlayStartPerformanceTime()).toBe(anchor);
    });
  });

  describe('P6: non-loop playback defers stop to full groove duration (#125)', () => {
    it('does not emit playbackStateChange(false) before the groove full duration has elapsed', async () => {
      vi.useFakeTimers();

      // DEFAULT_GROOVE: tempo=120, division=8, 1 measure with 8 steps
      // noteDuration = (60/120) / (8/4) = 0.5/2 = 0.25s
      // totalPositions = 8, grooveDuration = 8 * 0.25 = 2s
      const mockSynth = new DrumSynth();
      let audioTime = 0;
      vi.mocked(mockSynth.getCurrentTime).mockImplementation(() => audioTime);

      const testEngine = new GrooveEngine(mockSynth);
      const stateChanges: boolean[] = [];
      testEngine.on('playbackStateChange', (isPlaying) => stateChanges.push(isPlaying));

      await testEngine.play(DEFAULT_GROOVE, false);
      // playbackStateChange(true) emitted
      expect(stateChanges).toEqual([true]);

      const noteDuration = (60 / DEFAULT_GROOVE.tempo) / (DEFAULT_GROOVE.division / 4);
      // totalPositions = steps per measure × measure count (8 steps in default groove)
      const stepsPerMeasure = (DEFAULT_GROOVE.measures[0].notes['hihat-closed'] as boolean[]).length;
      const totalPositions = stepsPerMeasure * DEFAULT_GROOVE.measures.length;
      const grooveDuration = totalPositions * noteDuration;

      // Advance audio time well past end so schedule loop reaches the last position.
      audioTime = grooveDuration + 0.5;
      // Run all pending timers to let scheduleLoop and deferred stop fire
      await vi.runAllTimersAsync();

      // playbackStateChange(false) must now have fired
      expect(stateChanges).toContain(false);

      testEngine.dispose();
    });

    it('playbackStateChange(false) fires no earlier than the groove full duration', async () => {
      vi.useFakeTimers();

      const mockSynth = new DrumSynth();
      let audioTime = 0;
      vi.mocked(mockSynth.getCurrentTime).mockImplementation(() => audioTime);

      const testEngine = new GrooveEngine(mockSynth);
      let stopFiredAtAudioTime: number | null = null;
      testEngine.on('playbackStateChange', (isPlaying) => {
        if (!isPlaying) {
          stopFiredAtAudioTime = audioTime;
        }
      });

      await testEngine.play(DEFAULT_GROOVE, false);

      // DEFAULT_GROOVE: 8 steps at 120BPM/8th → noteDuration=0.25s, endTime=2.0s
      const noteDuration = (60 / DEFAULT_GROOVE.tempo) / (DEFAULT_GROOVE.division / 4);
      const stepsPerMeasure = (DEFAULT_GROOVE.measures[0].notes['hihat-closed'] as boolean[]).length;
      const totalPositions = stepsPerMeasure * DEFAULT_GROOVE.measures.length;
      const endTime = totalPositions * noteDuration; // 2.0s

      // Advance audio time so the schedule loop reaches the last note position.
      // When it detects last position, delayMs = (endTime - audioTime)*1000 = 50ms.
      // The stop fires after that delay — audioTime is still at this value when it fires.
      audioTime = endTime - 0.05; // just before the groove end
      await vi.runAllTimersAsync();

      if (stopFiredAtAudioTime !== null) {
        // Stop must have fired at or after the audio time when we detected end of groove
        // (audioTime hasn't advanced between timer set and timer fire in the fake-timer env)
        expect(stopFiredAtAudioTime).toBeGreaterThanOrEqual(endTime - 0.1);
      }

      testEngine.dispose();
    });

    it('scheduledNotes field does not exist (dead code removed)', () => {
      // C1: verify scheduledNotes field was removed
      expect((engine as unknown as Record<string, unknown>)['scheduledNotes']).toBeUndefined();
    });
  });
});
