import { describe, it, expect } from 'vitest';
import { HI_HAT_PATTERNS, SNARE_PATTERNS, KICK_PATTERNS } from './BulkPatterns';

describe('BulkPatterns', () => {
  describe('Hi-Hat Patterns', () => {
    it('should have 5 patterns', () => {
      expect(HI_HAT_PATTERNS).toHaveLength(5);
    });

    it('All On pattern should activate all positions', () => {
      const pattern = HI_HAT_PATTERNS.find(p => p.id === 'hihat-all-on');
      expect(pattern).toBeDefined();
      
      // Test with 16 notes per measure
      for (let i = 0; i < 16; i++) {
        expect(pattern!.pattern(i, 16)).toBe(true);
      }
    });

    it('Upbeats Only pattern should activate only e, &, a positions', () => {
      const pattern = HI_HAT_PATTERNS.find(p => p.id === 'hihat-upbeats');
      expect(pattern).toBeDefined();
      
      // Test with 16 notes per measure (1 e & a 2 e & a 3 e & a 4 e & a)
      // Upbeats are positions: 1 (e), 2 (&), 3 (a), 5 (e), 6 (&), 7 (a), etc.
      const expected = [false, true, true, true, false, true, true, true, false, true, true, true, false, true, true, true];
      for (let i = 0; i < 16; i++) {
        expect(pattern!.pattern(i, 16)).toBe(expected[i]);
      }
    });

    it('Downbeats Only pattern should activate only 1, 2, 3, 4', () => {
      const pattern = HI_HAT_PATTERNS.find(p => p.id === 'hihat-downbeats');
      expect(pattern).toBeDefined();
      
      // Test with 16 notes per measure
      // Downbeats are positions: 0, 4, 8, 12 (1, 2, 3, 4)
      const expected = [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false];
      for (let i = 0; i < 16; i++) {
        expect(pattern!.pattern(i, 16)).toBe(expected[i]);
      }
    });

    it('Eighth Notes pattern should activate 1 & 2 & 3 & 4 &', () => {
      const pattern = HI_HAT_PATTERNS.find(p => p.id === 'hihat-eighths');
      expect(pattern).toBeDefined();
      
      // Test with 16 notes per measure
      // Eighth notes are positions: 0, 2, 4, 6, 8, 10, 12, 14
      const expected = [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false];
      for (let i = 0; i < 16; i++) {
        expect(pattern!.pattern(i, 16)).toBe(expected[i]);
      }
    });

    it('Clear All pattern should deactivate all positions', () => {
      const pattern = HI_HAT_PATTERNS.find(p => p.id === 'hihat-clear');
      expect(pattern).toBeDefined();
      
      // Test with 16 notes per measure
      for (let i = 0; i < 16; i++) {
        expect(pattern!.pattern(i, 16)).toBe(false);
      }
    });

    it('all patterns should have correct voices', () => {
      const allOn = HI_HAT_PATTERNS.find(p => p.id === 'hihat-all-on');
      expect(allOn!.voices).toEqual(['hihat-closed']);
      
      const clear = HI_HAT_PATTERNS.find(p => p.id === 'hihat-clear');
      expect(clear!.voices).toEqual([]);
    });
  });

  describe('Snare Patterns', () => {
    it('should have 5 patterns', () => {
      expect(SNARE_PATTERNS).toHaveLength(5);
    });

    it('All On pattern should activate all positions with normal snare', () => {
      const pattern = SNARE_PATTERNS.find(p => p.id === 'snare-all-on');
      expect(pattern).toBeDefined();
      expect(pattern!.voices).toEqual(['snare-normal']);
      
      for (let i = 0; i < 16; i++) {
        expect(pattern!.pattern(i, 16)).toBe(true);
      }
    });

    it('Backbeat pattern should activate only 2 & 4', () => {
      const pattern = SNARE_PATTERNS.find(p => p.id === 'snare-backbeat');
      expect(pattern).toBeDefined();
      
      // Test with 16 notes per measure
      // Backbeat is positions: 4 (2) and 12 (4)
      const expected = [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false];
      for (let i = 0; i < 16; i++) {
        expect(pattern!.pattern(i, 16)).toBe(expected[i]);
      }
    });

    it('All Ghost Notes pattern should use ghost voice', () => {
      const pattern = SNARE_PATTERNS.find(p => p.id === 'snare-all-ghost');
      expect(pattern).toBeDefined();
      expect(pattern!.voices).toEqual(['snare-ghost']);

      for (let i = 0; i < 16; i++) {
        expect(pattern!.pattern(i, 16)).toBe(true);
      }
    });

    it('All Accents pattern should use accent voice', () => {
      const pattern = SNARE_PATTERNS.find(p => p.id === 'snare-all-accent');
      expect(pattern).toBeDefined();
      expect(pattern!.voices).toEqual(['snare-accent']);
      
      for (let i = 0; i < 16; i++) {
        expect(pattern!.pattern(i, 16)).toBe(true);
      }
    });

    it('Clear All pattern should deactivate all positions', () => {
      const pattern = SNARE_PATTERNS.find(p => p.id === 'snare-clear');
      expect(pattern).toBeDefined();
      expect(pattern!.voices).toEqual([]);
      
      for (let i = 0; i < 16; i++) {
        expect(pattern!.pattern(i, 16)).toBe(false);
      }
    });
  });

  describe('Kick Patterns', () => {
    it('should have 5 patterns', () => {
      expect(KICK_PATTERNS).toHaveLength(5);
    });

    it('All On pattern should activate all positions', () => {
      const pattern = KICK_PATTERNS.find(p => p.id === 'kick-all-on');
      expect(pattern).toBeDefined();
      expect(pattern!.voices).toEqual(['kick']);
      
      for (let i = 0; i < 16; i++) {
        expect(pattern!.pattern(i, 16)).toBe(true);
      }
    });

    it('Four on the Floor pattern should activate 1, 2, 3, 4', () => {
      const pattern = KICK_PATTERNS.find(p => p.id === 'kick-four-floor');
      expect(pattern).toBeDefined();
      
      // Test with 16 notes per measure
      // Four on floor is positions: 0, 4, 8, 12
      const expected = [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false];
      for (let i = 0; i < 16; i++) {
        expect(pattern!.pattern(i, 16)).toBe(expected[i]);
      }
    });
  });
});

