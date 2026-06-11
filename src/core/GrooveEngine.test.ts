/**
 * Tests for GrooveEngine
 *
 * Focuses on the getPlayStartPerformanceTime anchor added in #117.
 * DrumSynth is stubbed so tests run without Web Audio API.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
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
});
