/**
 * Tests for useMIDITracking Hook
 *
 * Verifies:
 * - Tracker is enabled when playback starts with tracking enabled
 * - Tracker is disabled when playback stops
 * - Tempo changes are synced mid-session
 * - MIDI hits are analyzed and events dispatched
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMIDITracking } from './useMIDITracking';
import { performanceTracker } from '../midi/PerformanceTracker';
import { DEFAULT_GROOVE } from '../types';

vi.mock('../midi/PerformanceTracker', () => ({
  performanceTracker: {
    enable: vi.fn(),
    disable: vi.fn(),
    setTempo: vi.fn(),
    updateGroove: vi.fn(),
    analyzeHit: vi.fn(),
    getPerformedBpm: vi.fn(() => null),
  },
}));

describe('useMIDITracking', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should enable tracker when tracking and playing are both true', () => {
    renderHook(() =>
      useMIDITracking(true, true, DEFAULT_GROOVE, 0)
    );

    // performanceTracker.enable should have been called
    expect(performanceTracker.enable).toHaveBeenCalled();
  });

  it('should not enable tracker when tracking is false', () => {
    renderHook(() =>
      useMIDITracking(false, true, DEFAULT_GROOVE, 0)
    );

    // performanceTracker.enable should not be called
    expect(performanceTracker.enable).not.toHaveBeenCalled();
  });

  it('should sync tempo changes during playback', () => {
    const { rerender } = renderHook(
      ({ tempo }) =>
        useMIDITracking(true, true, { ...DEFAULT_GROOVE, tempo }, 0),
      { initialProps: { tempo: 120 } }
    );

    vi.clearAllMocks();

    // Change tempo while playing
    rerender({ tempo: 140 });

    // performanceTracker.setTempo should have been called with new tempo
    expect(performanceTracker.setTempo).toHaveBeenCalledWith(140);
  });

  it('should analyze MIDI hits with performance tracker', () => {
    const mockAnalysis = {
      timingErrorMs: 5,
      timingAccuracy: 95,
      noteAccuracy: 90,
      overall: 92,
      feedback: 'Great timing!',
    };

    vi.mocked(performanceTracker.analyzeHit).mockReturnValue(mockAnalysis);

    renderHook(() =>
      useMIDITracking(true, true, DEFAULT_GROOVE, 0)
    );

    // Simulate MIDI hit event
    const event = new CustomEvent('midi-note-hit', {
      detail: { voice: 'kick', timestamp: performance.now() },
    });

    act(() => {
      window.dispatchEvent(event);
    });

    // analyzeHit should have been called
    expect(performanceTracker.analyzeHit).toHaveBeenCalled();
  });

  describe('audio-start clock anchor (#117)', () => {
    it('passes the engine anchor to performanceTracker.enable when provided', () => {
      const engineAnchor = 12345.6;
      const mockEngine = {
        getPlayStartPerformanceTime: vi.fn().mockReturnValue(engineAnchor),
      };

      renderHook(() =>
        useMIDITracking(true, true, DEFAULT_GROOVE, 0, mockEngine)
      );

      expect(performanceTracker.enable).toHaveBeenCalledWith(
        DEFAULT_GROOVE,
        engineAnchor
      );
    });

    it('falls back to performance.now() when engine anchor is null', () => {
      const before = performance.now();
      const mockEngine = {
        getPlayStartPerformanceTime: vi.fn().mockReturnValue(null),
      };

      renderHook(() =>
        useMIDITracking(true, true, DEFAULT_GROOVE, 0, mockEngine)
      );

      const after = performance.now();
      expect(performanceTracker.enable).toHaveBeenCalled();
      const anchor = (performanceTracker.enable as ReturnType<typeof vi.fn>).mock.calls[0][1] as number;
      expect(anchor).toBeGreaterThanOrEqual(before - 5);
      expect(anchor).toBeLessThanOrEqual(after + 5);
    });

    it('falls back to performance.now() when no engine is provided', () => {
      const before = performance.now();

      renderHook(() =>
        useMIDITracking(true, true, DEFAULT_GROOVE, 0)
      );

      const after = performance.now();
      expect(performanceTracker.enable).toHaveBeenCalled();
      const anchor = (performanceTracker.enable as ReturnType<typeof vi.fn>).mock.calls[0][1] as number;
      expect(anchor).toBeGreaterThanOrEqual(before - 5);
      expect(anchor).toBeLessThanOrEqual(after + 5);
    });
  });

  describe('updateGroove mid-session (#121)', () => {
    it('calls performanceTracker.updateGroove when groove changes while playing+tracking', () => {
      const { rerender } = renderHook(
        ({ groove }) =>
          useMIDITracking(true, true, groove, 0),
        { initialProps: { groove: DEFAULT_GROOVE } }
      );

      vi.clearAllMocks();

      // Change groove while playing (simulate note added)
      const updatedGroove = { ...DEFAULT_GROOVE, tempo: 130 };
      rerender({ groove: updatedGroove });

      // updateGroove should have been called with the new groove
      expect(performanceTracker.updateGroove).toHaveBeenCalledWith(updatedGroove);
    });

    it('does NOT call enable again when groove changes mid-session', () => {
      const { rerender } = renderHook(
        ({ groove }) =>
          useMIDITracking(true, true, groove, 0),
        { initialProps: { groove: DEFAULT_GROOVE } }
      );

      // Enable was called once on mount
      expect(performanceTracker.enable).toHaveBeenCalledTimes(1);
      vi.clearAllMocks();

      // Change groove while playing
      const updatedGroove = { ...DEFAULT_GROOVE, swing: 30 };
      rerender({ groove: updatedGroove });

      // Should NOT call enable again (would reset stats/startTime)
      expect(performanceTracker.enable).not.toHaveBeenCalled();
      expect(performanceTracker.updateGroove).toHaveBeenCalledTimes(1);
    });
  });

  it('should clean up listeners on unmount', () => {
    const { unmount } = renderHook(() =>
      useMIDITracking(true, true, DEFAULT_GROOVE, 0)
    );

    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    unmount();

    // Should remove midi-note-hit listener
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'midi-note-hit',
      expect.any(Function)
    );

    removeEventListenerSpy.mockRestore();
  });

  describe('P2: single-subscription listener (no churn on position/tempo change)', () => {
    it('does NOT re-subscribe to midi-note-hit when currentPosition changes', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      const { rerender } = renderHook(
        ({ position }) =>
          useMIDITracking(true, true, DEFAULT_GROOVE, position),
        { initialProps: { position: 0 } }
      );

      // Count initial subscriptions for midi-note-hit
      const initialCount = addEventListenerSpy.mock.calls.filter(
        ([type]) => type === 'midi-note-hit'
      ).length;

      // Change position multiple times
      rerender({ position: 1 });
      rerender({ position: 2 });
      rerender({ position: 3 });

      const totalCount = addEventListenerSpy.mock.calls.filter(
        ([type]) => type === 'midi-note-hit'
      ).length;

      // Should have subscribed exactly once (on initial mount) despite multiple position changes
      expect(totalCount).toBe(initialCount);

      addEventListenerSpy.mockRestore();
    });

    it('does NOT re-subscribe when groove.tempo changes', () => {
      const addEventListenerSpy = vi.spyOn(window, 'addEventListener');

      const { rerender } = renderHook(
        ({ tempo }) =>
          useMIDITracking(true, true, { ...DEFAULT_GROOVE, tempo }, 0),
        { initialProps: { tempo: 120 } }
      );

      const initialCount = addEventListenerSpy.mock.calls.filter(
        ([type]) => type === 'midi-note-hit'
      ).length;

      rerender({ tempo: 130 });
      rerender({ tempo: 140 });

      const totalCount = addEventListenerSpy.mock.calls.filter(
        ([type]) => type === 'midi-note-hit'
      ).length;

      expect(totalCount).toBe(initialCount);

      addEventListenerSpy.mockRestore();
    });

    it('dispatched midi-tracking-hit event carries the CURRENT position (not stale)', () => {
      const mockAnalysis = {
        timingErrorMs: 5,
        timingAccuracy: 90,
        noteAccuracy: 85,
        overall: 87,
        feedback: 'Great!',
      };
      vi.mocked(performanceTracker.analyzeHit).mockReturnValue(mockAnalysis);

      const { rerender } = renderHook(
        ({ position }) =>
          useMIDITracking(true, true, DEFAULT_GROOVE, position),
        { initialProps: { position: 0 } }
      );

      // Advance position to 5
      rerender({ position: 5 });

      const trackingHitEvents: CustomEvent[] = [];
      const trackingListener = (e: Event) => trackingHitEvents.push(e as CustomEvent);
      window.addEventListener('midi-tracking-hit', trackingListener);

      act(() => {
        window.dispatchEvent(new CustomEvent('midi-note-hit', {
          detail: { voice: 'kick', timestamp: performance.now() },
        }));
      });

      window.removeEventListener('midi-tracking-hit', trackingListener);

      // Event must carry position=5, not stale position=0
      expect(trackingHitEvents.length).toBe(1);
      expect(trackingHitEvents[0].detail.position).toBe(5);
    });

    it('dispatched midi-tracking-hit event carries the CURRENT tempo (not stale)', () => {
      const mockAnalysis = {
        timingErrorMs: 5,
        timingAccuracy: 90,
        noteAccuracy: 85,
        overall: 87,
        feedback: 'Great!',
      };
      vi.mocked(performanceTracker.analyzeHit).mockReturnValue(mockAnalysis);

      const { rerender } = renderHook(
        ({ tempo }) =>
          useMIDITracking(true, true, { ...DEFAULT_GROOVE, tempo }, 0),
        { initialProps: { tempo: 120 } }
      );

      // Change tempo to 160
      rerender({ tempo: 160 });

      const trackingHitEvents: CustomEvent[] = [];
      const trackingListener = (e: Event) => trackingHitEvents.push(e as CustomEvent);
      window.addEventListener('midi-tracking-hit', trackingListener);

      act(() => {
        window.dispatchEvent(new CustomEvent('midi-note-hit', {
          detail: { voice: 'kick', timestamp: performance.now() },
        }));
      });

      window.removeEventListener('midi-tracking-hit', trackingListener);

      // Event must carry tempo=160, not stale tempo=120
      expect(trackingHitEvents.length).toBe(1);
      expect(trackingHitEvents[0].detail.tempo).toBe(160);
    });
  });
});
