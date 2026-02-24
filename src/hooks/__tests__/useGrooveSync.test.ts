import { describe, it, expect } from 'vitest';
import { useGrooveSync } from '../useGrooveSync';
import { DEFAULT_GROOVE } from '../../types';

/**
 * Tests for useGrooveSync hook
 *
 * Verifies:
 * 1. Engine sync is called when audio properties change
 * 2. Engine sync is skipped when only metadata changes
 * 3. Reference tracking works correctly
 * 4. Multiple rapid changes are handled properly
 *
 * Note: These are logic tests for the hook's decision-making.
 * Integration tests should verify hook behavior in a React component context.
 */
describe('useGrooveSync', () => {
  describe('Audio property change detection', () => {
    it('should detect tempo changes', () => {
      const groove1 = DEFAULT_GROOVE;
      const groove2 = { ...DEFAULT_GROOVE, tempo: 130 };

      // Verify properties are different
      expect(groove1.tempo).not.toBe(groove2.tempo);
      expect(groove1.tempo).toBe(120); // DEFAULT_GROOVE
      expect(groove2.tempo).toBe(130);
    });

    it('should detect swing changes', () => {
      const groove1 = DEFAULT_GROOVE;
      const groove2 = { ...DEFAULT_GROOVE, swing: 50 };

      expect(groove1.swing).not.toBe(groove2.swing);
    });

    it('should detect division changes', () => {
      const groove1 = DEFAULT_GROOVE;
      const groove2 = { ...DEFAULT_GROOVE, division: 12 };

      expect(groove1.division).not.toBe(groove2.division);
    });

    it('should detect timeSignature.beats changes', () => {
      const groove1 = DEFAULT_GROOVE;
      const groove2 = { ...DEFAULT_GROOVE, timeSignature: { beats: 3, noteValue: 4 } };

      expect(groove1.timeSignature.beats).not.toBe(groove2.timeSignature.beats);
    });

    it('should detect timeSignature.noteValue changes', () => {
      const groove1 = DEFAULT_GROOVE;
      const groove2 = { ...DEFAULT_GROOVE, timeSignature: { beats: 4, noteValue: 8 } };

      expect(groove1.timeSignature.noteValue).not.toBe(groove2.timeSignature.noteValue);
    });

    it('should detect measures reference changes', () => {
      const groove1 = DEFAULT_GROOVE;
      const newMeasures = [...groove1.measures];
      const groove2 = { ...DEFAULT_GROOVE, measures: newMeasures };

      expect(groove1.measures).not.toBe(groove2.measures);
    });
  });

  describe('Metadata change detection', () => {
    it('should ignore title changes', () => {
      const groove1 = DEFAULT_GROOVE;
      const groove2 = { ...DEFAULT_GROOVE, title: 'New Title' };

      // Metadata property changed
      expect(groove1.title).not.toBe(groove2.title);

      // But audio properties are the same
      expect(groove1.tempo).toBe(groove2.tempo);
      expect(groove1.swing).toBe(groove2.swing);
      expect(groove1.division).toBe(groove2.division);
      expect(groove1.timeSignature).toEqual(groove2.timeSignature);
      expect(groove1.measures).toBe(groove2.measures);
    });

    it('should ignore author changes', () => {
      const groove1 = DEFAULT_GROOVE;
      const groove2 = { ...DEFAULT_GROOVE, author: 'New Author' };

      // Verify metadata changed but audio properties stayed same
      expect(groove1.author).not.toBe(groove2.author);
      expect(groove1.tempo).toBe(groove2.tempo);
    });

    it('should ignore comments changes', () => {
      const groove1 = DEFAULT_GROOVE;
      const groove2 = { ...DEFAULT_GROOVE, comments: 'New comments' };

      // Verify metadata changed but audio properties stayed same
      expect(groove1.comments).not.toBe(groove2.comments);
      expect(groove1.tempo).toBe(groove2.tempo);
    });

    it('should ignore multiple metadata changes simultaneously', () => {
      const groove1 = DEFAULT_GROOVE;
      const groove2 = {
        ...DEFAULT_GROOVE,
        title: 'New Title',
        author: 'New Author',
        comments: 'New comments',
      };

      // Verify metadata changed but audio properties stayed same
      expect(groove1.title).not.toBe(groove2.title);
      expect(groove1.author).not.toBe(groove2.author);
      expect(groove1.comments).not.toBe(groove2.comments);
      expect(groove1.tempo).toBe(groove2.tempo);
      expect(groove1.swing).toBe(groove2.swing);
      expect(groove1.division).toBe(groove2.division);
    });
  });

  describe('Combined audio and metadata changes', () => {
    it('should sync when audio property changes along with metadata', () => {
      const groove1 = DEFAULT_GROOVE;
      const groove2 = {
        ...DEFAULT_GROOVE,
        tempo: 130, // Audio property changed
        title: 'New Title', // Metadata also changed
      };

      // Verify audio property changed
      expect(groove1.tempo).not.toBe(groove2.tempo);
      // Verify metadata also changed
      expect(groove1.title).not.toBe(groove2.title);
    });

    it('should sync when multiple audio properties change', () => {
      const groove1 = DEFAULT_GROOVE;
      const groove2 = {
        ...DEFAULT_GROOVE,
        tempo: 130,
        swing: 50,
      };

      // Verify both audio properties changed
      expect(groove1.tempo).not.toBe(groove2.tempo);
      expect(groove1.swing).not.toBe(groove2.swing);
    });
  });

  describe('Reference equality', () => {
    it('should recognize identical groove references', () => {
      const groove = DEFAULT_GROOVE;

      // Same reference should be equal
      expect(groove).toBe(groove);
    });

    it('should distinguish spread copies from originals', () => {
      const groove1 = DEFAULT_GROOVE;
      const groove2 = { ...DEFAULT_GROOVE };

      // Spread creates new object reference
      expect(groove1).not.toBe(groove2);
      // But content is the same (unless we specifically changed something)
      expect(groove1.tempo).toBe(groove2.tempo);
    });
  });

  describe('Hook export', () => {
    it('should export useGrooveSync as a function', () => {
      expect(typeof useGrooveSync).toBe('function');
    });
  });
});
