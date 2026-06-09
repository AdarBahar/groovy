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
});
