/**
 * Tests for useAutoSpeedUp hook (#124)
 *
 * Verifies:
 * - Tempo increases by stepBpm on each interval
 * - Stops at MAX_TEMPO
 * - Stops when keepGoing=false after one step
 * - Unmount clears all timers (no further onTempoChange after unmount)
 * - Side effects (onTempoChange) run outside setState updater
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoSpeedUp } from './useAutoSpeedUp';
import { MAX_TEMPO } from '../types';

describe('useAutoSpeedUp (#124)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('tempo increases by stepBpm after one interval', () => {
    const onTempoChange = vi.fn();
    const baseTempo = 120;
    const intervalMs = 5000; // 5 seconds (quick for testing)

    const { result } = renderHook(() =>
      useAutoSpeedUp({
        tempo: baseTempo,
        onTempoChange,
        isPlaying: true,
      })
    );

    // Set config with short interval
    act(() => {
      result.current.setConfig({
        stepBpm: 5,
        intervalMinutes: intervalMs / 60000,
        keepGoing: true,
      });
    });

    // Start auto speed-up
    act(() => {
      result.current.start();
    });

    // Advance time by one interval
    act(() => {
      vi.advanceTimersByTime(intervalMs);
    });

    // onTempoChange should have been called with baseTempo + stepBpm
    expect(onTempoChange).toHaveBeenCalledWith(baseTempo + 5);
    expect(onTempoChange).toHaveBeenCalledTimes(1);
  });

  it('tempo increases by stepBpm each interval (multiple steps)', () => {
    const onTempoChange = vi.fn();
    const baseTempo = 120;
    const intervalMs = 5000;

    const { result } = renderHook(() =>
      useAutoSpeedUp({
        tempo: baseTempo,
        onTempoChange,
        isPlaying: true,
      })
    );

    act(() => {
      result.current.setConfig({
        stepBpm: 5,
        intervalMinutes: intervalMs / 60000,
        keepGoing: true,
      });
    });

    act(() => {
      result.current.start();
    });

    // Advance 2 intervals
    act(() => {
      vi.advanceTimersByTime(intervalMs * 2);
    });

    // Should have been called twice: 125, then 130
    expect(onTempoChange).toHaveBeenCalledTimes(2);
    expect(onTempoChange).toHaveBeenNthCalledWith(1, 125);
    expect(onTempoChange).toHaveBeenNthCalledWith(2, 130);
  });

  it('stops at MAX_TEMPO and does not call onTempoChange beyond it', () => {
    const onTempoChange = vi.fn();
    const intervalMs = 5000;
    // Start just below MAX_TEMPO
    const startTempo = MAX_TEMPO - 3;

    const { result } = renderHook(() =>
      useAutoSpeedUp({
        tempo: startTempo,
        onTempoChange,
        isPlaying: true,
      })
    );

    act(() => {
      result.current.setConfig({
        stepBpm: 5,
        intervalMinutes: intervalMs / 60000,
        keepGoing: true,
      });
    });

    act(() => {
      result.current.start();
    });

    // One step: startTempo + 5 would exceed MAX_TEMPO → clamped to MAX_TEMPO
    act(() => {
      vi.advanceTimersByTime(intervalMs);
    });

    expect(onTempoChange).toHaveBeenCalledWith(MAX_TEMPO);
    expect(result.current.isActive).toBe(false);

    // Advance more — should not call again
    act(() => {
      vi.advanceTimersByTime(intervalMs * 3);
    });
    expect(onTempoChange).toHaveBeenCalledTimes(1);
  });

  it('stops after one step when keepGoing=false', () => {
    const onTempoChange = vi.fn();
    const intervalMs = 5000;
    const baseTempo = 120;

    const { result } = renderHook(() =>
      useAutoSpeedUp({
        tempo: baseTempo,
        onTempoChange,
        isPlaying: true,
      })
    );

    act(() => {
      result.current.setConfig({
        stepBpm: 5,
        intervalMinutes: intervalMs / 60000,
        keepGoing: false,
      });
    });

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(intervalMs);
    });

    expect(onTempoChange).toHaveBeenCalledTimes(1);
    expect(onTempoChange).toHaveBeenCalledWith(125);
    expect(result.current.isActive).toBe(false);

    // No more calls after stopping
    act(() => {
      vi.advanceTimersByTime(intervalMs * 3);
    });
    expect(onTempoChange).toHaveBeenCalledTimes(1);
  });

  it('unmount clears timers — no further onTempoChange after unmount', () => {
    const onTempoChange = vi.fn();
    const intervalMs = 5000;
    const baseTempo = 120;

    const { result, unmount } = renderHook(() =>
      useAutoSpeedUp({
        tempo: baseTempo,
        onTempoChange,
        isPlaying: true,
      })
    );

    act(() => {
      result.current.setConfig({
        stepBpm: 5,
        intervalMinutes: intervalMs / 60000,
        keepGoing: true,
      });
    });

    act(() => {
      result.current.start();
    });

    // Unmount before the timer fires
    unmount();

    // Advance time — timer should be cleared, no calls
    act(() => {
      vi.advanceTimersByTime(intervalMs * 5);
    });

    expect(onTempoChange).not.toHaveBeenCalled();
  });
});
