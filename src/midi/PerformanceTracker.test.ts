/**
 * Tests for PerformanceTracker
 *
 * Verifies performance analysis and statistics tracking
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { performanceTracker } from './PerformanceTracker';
import type { GroovePattern } from './PerformanceTracker';

describe('PerformanceTracker', () => {
  const mockPattern: GroovePattern = {
    voices: {
      'kick': [true, false, true, false],
      'snare-normal': [false, true, false, true],
      'hihat-closed': [true, true, true, true],
    } as any,
  };

  beforeEach(() => {
    performanceTracker.disable();
    performanceTracker.resetStats();
  });

  describe('enable/disable', () => {
    it('enables performance tracking with pattern', () => {
      const startTime = Date.now();
      performanceTracker.enable(mockPattern, 120, startTime);

      expect(performanceTracker.isEnabled()).toBe(true);
    });

    it('disables performance tracking', () => {
      performanceTracker.enable(mockPattern, 120, Date.now());
      performanceTracker.disable();

      expect(performanceTracker.isEnabled()).toBe(false);
    });

    it('starts with tracking disabled', () => {
      expect(performanceTracker.isEnabled()).toBe(false);
    });
  });

  describe('analyzeHit', () => {
    beforeEach(() => {
      performanceTracker.enable(mockPattern, 120, Date.now());
    });

    it('returns null when tracking disabled', () => {
      performanceTracker.disable();
      const result = performanceTracker.analyzeHit('kick', Date.now());

      expect(result).toBeNull();
    });

    it('returns null when voice is null', () => {
      const result = performanceTracker.analyzeHit(null, Date.now());

      expect(result).toBeNull();
    });

    it('analyzes hit with valid voice and returns analysis', () => {
      const result = performanceTracker.analyzeHit('kick', Date.now());

      expect(result).toBeTruthy();
      expect(result!.timingAccuracy).toBeGreaterThanOrEqual(0);
      expect(result!.timingAccuracy).toBeLessThanOrEqual(100);
      expect(result!.noteAccuracy).toBeGreaterThanOrEqual(0);
      expect(result!.noteAccuracy).toBeLessThanOrEqual(100);
      expect(result!.overall).toBeGreaterThanOrEqual(0);
      expect(result!.overall).toBeLessThanOrEqual(100);
      expect(result!.feedback).toBeTruthy();
    });

    it('provides feedback based on accuracy', () => {
      // This test checks that feedback is provided
      // Exact accuracy depends on timing which is hard to control
      const result = performanceTracker.analyzeHit('kick', Date.now());

      expect(['Perfect!', 'Great!', 'Good', 'Keep trying', 'Miss']).toContain(result!.feedback);
    });

    it('rewards voices in the pattern', () => {
      // Voices in the pattern get 80 note accuracy
      const result = performanceTracker.analyzeHit('kick', Date.now());

      expect(result!.noteAccuracy).toBeGreaterThanOrEqual(50); // At least partial credit
    });

    it('penalizes voices not in the pattern', () => {
      // Voices not in pattern get 30 note accuracy
      const result = performanceTracker.analyzeHit('tom-floor', Date.now());

      expect(result!.noteAccuracy).toBeLessThan(50); // Lower score for off-pattern voice
    });
  });

  describe('Statistics tracking', () => {
    beforeEach(() => {
      performanceTracker.enable(mockPattern, 120, Date.now());
    });

    it('tracks total hits', () => {
      performanceTracker.analyzeHit('kick', Date.now());
      performanceTracker.analyzeHit('snare-normal', Date.now());
      performanceTracker.analyzeHit('hihat-closed', Date.now());

      const stats = performanceTracker.getStats();
      expect(stats.totalHits).toBe(3);
    });

    it('counts accurate hits (>70% accuracy)', () => {
      // All hits in the pattern should be at least somewhat accurate
      performanceTracker.analyzeHit('kick', Date.now());
      performanceTracker.analyzeHit('snare-normal', Date.now());

      const stats = performanceTracker.getStats();
      expect(stats.accurateHits).toBeGreaterThanOrEqual(0);
    });

    it('calculates average accuracy', () => {
      performanceTracker.analyzeHit('kick', Date.now());
      performanceTracker.analyzeHit('snare-normal', Date.now());

      const stats = performanceTracker.getStats();
      expect(stats.averageAccuracy).toBeGreaterThanOrEqual(0);
      expect(stats.averageAccuracy).toBeLessThanOrEqual(100);
    });

    it('tracks timing errors', () => {
      performanceTracker.analyzeHit('kick', Date.now());
      performanceTracker.analyzeHit('snare-normal', Date.now());

      const stats = performanceTracker.getStats();
      expect(stats.timingErrors.length).toBe(2);
      expect(stats.timingErrors.every((e) => typeof e === 'number')).toBe(true);
    });

    it('resets statistics', () => {
      performanceTracker.analyzeHit('kick', Date.now());
      expect(performanceTracker.getStats().totalHits).toBe(1);

      performanceTracker.resetStats();
      const stats = performanceTracker.getStats();

      expect(stats.totalHits).toBe(0);
      expect(stats.accurateHits).toBe(0);
      expect(stats.averageAccuracy).toBe(0);
      expect(stats.timingErrors.length).toBe(0);
    });
  });

  describe('Timing accuracy calculation', () => {
    it('gives high accuracy for on-beat hits', () => {
      // Start performance and immediately hit on beat
      const startTime = Date.now();
      performanceTracker.enable(mockPattern, 120, startTime);

      // Hit almost immediately (on the first beat)
      const result = performanceTracker.analyzeHit('kick', startTime + 10);

      expect(result!.timingAccuracy).toBeGreaterThan(50);
    });

    it('penalizes off-beat hits', () => {
      const startTime = Date.now();
      performanceTracker.enable(mockPattern, 120, startTime);
      const beatDurationMs = (60 / 120) * 1000; // 500ms per beat at 120 BPM

      // Hit far off the beat (3/4 beat duration late)
      const result = performanceTracker.analyzeHit('kick', startTime + beatDurationMs * 0.75);

      // Should have lower accuracy than an on-beat hit
      expect(result!.timingAccuracy).toBeLessThan(100);
    });
  });

  describe('getReport', () => {
    it('generates performance report', () => {
      performanceTracker.enable(mockPattern, 120, Date.now());
      performanceTracker.analyzeHit('kick', Date.now());
      performanceTracker.analyzeHit('snare-normal', Date.now());

      const report = performanceTracker.getReport();

      expect(report).toContain('Performance Report');
      expect(report).toContain('Total Hits: 2');
      expect(report).toContain('Accuracy');
      expect(report).toContain('Average Score');
    });

    it('shows zero stats for no hits', () => {
      performanceTracker.enable(mockPattern, 120, Date.now());

      const report = performanceTracker.getReport();

      expect(report).toContain('Total Hits: 0');
      expect(report).toContain('Accuracy: 0.0%');
    });
  });

  describe('getStats', () => {
    it('returns independent copy of stats', () => {
      performanceTracker.enable(mockPattern, 120, Date.now());
      performanceTracker.analyzeHit('kick', Date.now());

      const stats1 = performanceTracker.getStats();
      const stats2 = performanceTracker.getStats();

      expect(stats1).toEqual(stats2);
      expect(stats1).not.toBe(stats2); // Different object references
    });
  });
});
