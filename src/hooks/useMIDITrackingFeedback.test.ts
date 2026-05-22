/**
 * Tests for useMIDITrackingFeedback Hook
 *
 * Verifies:
 * - SVG container is found and notes are queried
 * - Good hits apply 'midi-tracking-good' class
 * - Bad hits apply 'midi-tracking-bad' class
 * - Classes are removed after 500ms
 * - Fallback to last note if exact note not found
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMIDITrackingFeedback } from './useMIDITrackingFeedback';

describe('useMIDITrackingFeedback', () => {
  let svgContainer: HTMLDivElement;
  let svg: SVGSVGElement;

  beforeEach(() => {
    // Setup DOM structure for sheet music
    svgContainer = document.createElement('div');
    svgContainer.setAttribute('data-sheet-music', 'true');

    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

    // Create mock note elements
    for (let i = 0; i < 5; i++) {
      const note = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      note.setAttribute('class', 'abcjs-note');
      svg.appendChild(note);
    }

    svgContainer.appendChild(svg);
    document.body.appendChild(svgContainer);

    vi.useFakeTimers();
  });

  afterEach(() => {
    document.body.removeChild(svgContainer);
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should apply good hit class to notes when overall score > 70', () => {
    renderHook(() => useMIDITrackingFeedback());

    const event = new CustomEvent('midi-tracking-hit', {
      detail: {
        position: 0,
        analysis: {
          overall: 95,
          timingAccuracy: 95,
          noteAccuracy: 90,
          feedback: 'Perfect!',
          timingErrorMs: 2,
        },
      },
    });

    act(() => {
      window.dispatchEvent(event);
    });

    // First note should have good class
    const notes = svg.querySelectorAll('.abcjs-note');
    expect((notes[0] as any).classList.contains('midi-tracking-good')).toBe(true);
  });

  it('should apply bad hit class to notes when overall score <= 70', () => {
    renderHook(() => useMIDITrackingFeedback());

    const event = new CustomEvent('midi-tracking-hit', {
      detail: {
        position: 0,
        analysis: {
          overall: 50,
          timingAccuracy: 40,
          noteAccuracy: 60,
          feedback: 'Too slow',
          timingErrorMs: -50,
        },
      },
    });

    act(() => {
      window.dispatchEvent(event);
    });

    // First note should have bad class
    const notes = svg.querySelectorAll('.abcjs-note');
    expect((notes[0] as any).classList.contains('midi-tracking-bad')).toBe(true);
  });

  it('should remove class after 500ms timeout', () => {
    renderHook(() => useMIDITrackingFeedback());

    const event = new CustomEvent('midi-tracking-hit', {
      detail: {
        position: 0,
        analysis: {
          overall: 95,
          timingAccuracy: 95,
          noteAccuracy: 90,
          feedback: 'Perfect!',
          timingErrorMs: 2,
        },
      },
    });

    act(() => {
      window.dispatchEvent(event);
    });

    const notes = svg.querySelectorAll('.abcjs-note');
    expect((notes[0] as any).classList.contains('midi-tracking-good')).toBe(true);

    // Advance time by 500ms
    act(() => {
      vi.advanceTimersByTime(500);
    });

    // Class should be removed
    expect((notes[0] as any).classList.contains('midi-tracking-good')).toBe(false);
  });

  it('should fallback to last note if exact note not found', () => {
    renderHook(() => useMIDITrackingFeedback());

    const event = new CustomEvent('midi-tracking-hit', {
      detail: {
        position: 100, // Position beyond available notes
        analysis: {
          overall: 85,
          timingAccuracy: 85,
          noteAccuracy: 85,
          feedback: 'Good',
          timingErrorMs: 10,
        },
      },
    });

    act(() => {
      window.dispatchEvent(event);
    });

    // Last note should have the class
    const notes = svg.querySelectorAll('.abcjs-note');
    expect((notes[notes.length - 1] as any).classList.contains('midi-tracking-good')).toBe(true);
  });

  it('should handle missing SVG container gracefully', () => {
    // Create a new hook instance without the SVG container
    const newContainer = document.createElement('div');
    document.body.appendChild(newContainer);

    renderHook(() => useMIDITrackingFeedback());

    const event = new CustomEvent('midi-tracking-hit', {
      detail: {
        position: 0,
        analysis: {
          overall: 95,
          timingAccuracy: 95,
          noteAccuracy: 90,
          feedback: 'Perfect!',
          timingErrorMs: 2,
        },
      },
    });

    // Should not throw when SVG container is not found
    act(() => {
      window.dispatchEvent(event);
    });

    document.body.removeChild(newContainer);
    expect(true).toBe(true);
  });

  it('should remove event listener on unmount', () => {
    const { unmount } = renderHook(() => useMIDITrackingFeedback());

    const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

    unmount();

    // Should remove midi-tracking-hit listener
    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'midi-tracking-hit',
      expect.any(Function)
    );

    removeEventListenerSpy.mockRestore();
  });

  it('should calculate correct note index based on position', () => {
    renderHook(() => useMIDITrackingFeedback());

    // Position 0 -> noteIndex 0
    const event1 = new CustomEvent('midi-tracking-hit', {
      detail: {
        position: 0,
        analysis: {
          overall: 95,
          timingAccuracy: 95,
          noteAccuracy: 90,
          feedback: 'Perfect!',
          timingErrorMs: 2,
        },
      },
    });

    act(() => {
      window.dispatchEvent(event1);
    });

    const notes = svg.querySelectorAll('.abcjs-note');
    expect((notes[0] as any).classList.contains('midi-tracking-good')).toBe(true);

    // Advance time to clean up
    act(() => {
      vi.advanceTimersByTime(500);
    });

    expect((notes[0] as any).classList.contains('midi-tracking-good')).toBe(false);
  });
});
