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
