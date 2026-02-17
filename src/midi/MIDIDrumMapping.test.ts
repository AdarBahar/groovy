/**
 * Tests for MIDI Drum Mapping
 *
 * Verifies bidirectional mapping between MIDI notes and DrumVoice types
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { midiDrumMapping } from './MIDIDrumMapping';
import { DrumVoice } from '../types';

describe('MIDIDrumMapping', () => {
  beforeEach(() => {
    // Reset to default kit
    midiDrumMapping.setKit('TD-17');
  });

  describe('getVoiceFromNote', () => {
    it('returns a DrumVoice for valid MIDI notes', () => {
      const voice = midiDrumMapping.getVoiceFromNote(36); // Kick
      expect(voice).toBeTruthy();
      expect(typeof voice === 'string').toBe(true);
    });

    it('returns null for unmapped MIDI notes', () => {
      const voice = midiDrumMapping.getVoiceFromNote(127); // Usually not mapped
      expect(voice).toBeNull();
    });

    it('maps hihat-closed to MIDI note 42', () => {
      const voice = midiDrumMapping.getVoiceFromNote(42);
      expect(voice).toBe('hihat-closed');
    });

    it('maps kick to MIDI note 36', () => {
      const voice = midiDrumMapping.getVoiceFromNote(36);
      expect(voice).toBe('kick');
    });

    it('maps snare-normal to MIDI note 38', () => {
      const voice = midiDrumMapping.getVoiceFromNote(38);
      expect(voice).toBe('snare-normal');
    });
  });

  describe('getNoteFromVoice', () => {
    it('returns MIDI note for valid DrumVoice', () => {
      const note = midiDrumMapping.getNoteFromVoice('hihat-closed');
      expect(note).toBe(42);
    });

    it('returns valid MIDI note number (0-127)', () => {
      const note = midiDrumMapping.getNoteFromVoice('kick');
      expect(note).toBeGreaterThanOrEqual(0);
      expect(note).toBeLessThanOrEqual(127);
    });

    it('returns null for unmapped voice', () => {
      const note = midiDrumMapping.getNoteFromVoice('invalid-voice' as DrumVoice);
      expect(note).toBeNull();
    });

    it('kick maps to MIDI note 36', () => {
      const note = midiDrumMapping.getNoteFromVoice('kick');
      expect(note).toBe(36);
    });
  });

  describe('getVoiceDisplayName', () => {
    it('returns display name for mapped MIDI note', () => {
      const name = midiDrumMapping.getVoiceDisplayName(36);
      expect(name).toBeTruthy();
      expect(typeof name === 'string').toBe(true);
    });

    it('returns null for unmapped note', () => {
      const name = midiDrumMapping.getVoiceDisplayName(127);
      expect(name).toBeNull();
    });

    it('returns non-empty string for valid voices', () => {
      const name = midiDrumMapping.getVoiceDisplayName(42);
      expect(name).toBeTruthy();
      expect(name!.length).toBeGreaterThan(0);
    });
  });

  describe('setKit', () => {
    it('switches to different drum kit', () => {
      midiDrumMapping.setKit('Alesis Nitro');
      expect(midiDrumMapping.getCurrentKit()).toBe('Alesis Nitro');
    });

    it('maintains mappings after kit switch', () => {
      const voiceBefore = midiDrumMapping.getVoiceFromNote(36);
      midiDrumMapping.setKit('Yamaha DTX');
      const voiceAfter = midiDrumMapping.getVoiceFromNote(36);

      // Both should map to a voice (may differ by kit)
      expect(voiceBefore).toBeTruthy();
      expect(voiceAfter).toBeTruthy();
    });

    it('returns to default kit', () => {
      midiDrumMapping.setKit('Alesis Nitro');
      midiDrumMapping.setKit('TD-17');
      expect(midiDrumMapping.getCurrentKit()).toBe('TD-17');
    });
  });

  describe('getCurrentKit', () => {
    it('returns default kit on initialization', () => {
      expect(midiDrumMapping.getCurrentKit()).toBe('TD-17');
    });

    it('returns current kit after switch', () => {
      midiDrumMapping.setKit('Yamaha DTX');
      expect(midiDrumMapping.getCurrentKit()).toBe('Yamaha DTX');
    });
  });

  describe('getAllMappings', () => {
    it('returns object with MIDI notes as keys', () => {
      const mappings = midiDrumMapping.getAllMappings();
      const keys = Object.keys(mappings).map(Number);

      expect(keys.length).toBeGreaterThan(0);
      keys.forEach((note) => {
        expect(note).toBeGreaterThanOrEqual(0);
        expect(note).toBeLessThanOrEqual(127);
      });
    });

    it('returns DrumVoice values', () => {
      const mappings = midiDrumMapping.getAllMappings();
      const values = Object.values(mappings);

      values.forEach((voice) => {
        expect(typeof voice === 'string').toBe(true);
      });
    });

    it('all values should be valid voice strings', () => {
      const mappings = midiDrumMapping.getAllMappings();
      const validVoices = ['kick', 'snare', 'hihat', 'tom', 'crash', 'ride'];

      Object.values(mappings).forEach((voice) => {
        // Each voice should contain at least one part of a drum name
        const isValid = validVoices.some((v) => voice.includes(v));
        expect(isValid).toBe(true);
      });
    });
  });

  describe('Consistency checks', () => {
    it('reverse mapping is consistent', () => {
      // Get a voice from note
      const voice = midiDrumMapping.getVoiceFromNote(42);
      if (voice) {
        // Get note from that voice
        const note = midiDrumMapping.getNoteFromVoice(voice);
        // Should match original note
        expect(note).toBe(42);
      }
    });

    it('all mapped notes should return voices', () => {
      const mappings = midiDrumMapping.getAllMappings();
      Object.keys(mappings).forEach((noteStr) => {
        const note = parseInt(noteStr, 10);
        const voice = midiDrumMapping.getVoiceFromNote(note);
        expect(voice).toBeTruthy();
      });
    });
  });
});
