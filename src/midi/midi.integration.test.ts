/**
 * MIDI Integration Tests
 *
 * Tests the integration between MIDI modules without React hooks
 * (React hook testing requires @testing-library/react)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { midiHandler } from './MIDIHandler';
import { midiDrumMapping } from './MIDIDrumMapping';
import { loadMIDIConfig } from '../utils/midiStorage';
import { DEFAULT_MIDI_CONFIG } from './types';

describe('MIDI Integration', () => {
  beforeEach(() => {
    // Reset handlers
    midiHandler.setNoteOnHandler(() => {});
    midiHandler.setNoteOffHandler(() => {});
    midiHandler.setControlChangeHandler(() => {});
    midiDrumMapping.setKit('TD-17');
  });

  describe('MIDI message → DrumVoice mapping', () => {
    it('converts MIDI note to DrumVoice through complete chain', () => {
      const mockPlayDrum = vi.fn();

      midiHandler.setNoteOnHandler((note, velocity, _voice, _timestamp) => {
        const mappedVoice = midiDrumMapping.getVoiceFromNote(note);
        if (mappedVoice) {
          // This simulates what useMIDIInput would do
          mockPlayDrum(mappedVoice, velocity);
        }
      });

      // Simulate MIDI note on for kick drum (note 36)
      const midiData = new Uint8Array([0x90, 36, 100]);
      const mockEvent = {
        data: midiData,
        timeStamp: Date.now(),
      } as MIDIMessageEvent;

      midiHandler.handleMessage(mockEvent);

      expect(mockPlayDrum).toHaveBeenCalledWith('kick', 100);
    });

    it('handles unmapped MIDI notes gracefully', () => {
      const mockPlayDrum = vi.fn();

      midiHandler.setNoteOnHandler((note) => {
        const mappedVoice = midiDrumMapping.getVoiceFromNote(note);
        if (mappedVoice) {
          mockPlayDrum(mappedVoice, 100);
        }
      });

      // Try unmapped note
      const midiData = new Uint8Array([0x90, 127, 100]);
      const mockEvent = {
        data: midiData,
        timeStamp: Date.now(),
      } as MIDIMessageEvent;

      midiHandler.handleMessage(mockEvent);

      // Should not call playDrum for unmapped note
      expect(mockPlayDrum).not.toHaveBeenCalled();
    });

    it('respects drum kit switching', () => {
      const noteOnHandler = vi.fn();
      midiHandler.setNoteOnHandler(noteOnHandler);

      // Get initial mapping for TD-17
      const note = 36;
      const voiceTD17 = midiDrumMapping.getVoiceFromNote(note);

      // Switch kit
      midiDrumMapping.setKit('Alesis Nitro');
      const voiceAlesis = midiDrumMapping.getVoiceFromNote(note);

      // Both should return a voice
      expect(voiceTD17).toBeTruthy();
      expect(voiceAlesis).toBeTruthy();

      // Reset to TD-17
      midiDrumMapping.setKit('TD-17');
      const voiceBackToTD17 = midiDrumMapping.getVoiceFromNote(note);
      expect(voiceBackToTD17).toBe(voiceTD17);
    });
  });

  describe('Multiple drum pads trigger correctly', () => {
    it('processes sequence of MIDI notes', () => {
      const playedDrums: string[] = [];

      midiHandler.setNoteOnHandler((note) => {
        const voice = midiDrumMapping.getVoiceFromNote(note);
        if (voice) {
          playedDrums.push(voice);
        }
      });

      // Simulate kick, snare, hi-hat sequence
      const sequence = [36, 38, 42]; // Kick, snare, closed hi-hat

      sequence.forEach((note) => {
        const midiData = new Uint8Array([0x90, note, 100]);
        const mockEvent = {
          data: midiData,
          timeStamp: Date.now(),
        } as MIDIMessageEvent;
        midiHandler.handleMessage(mockEvent);
      });

      expect(playedDrums.length).toBe(3);
      expect(playedDrums[0]).toBe('kick');
      expect(playedDrums[1]).toBe('snare-normal');
      expect(playedDrums[2]).toBe('hihat-closed');
    });
  });

  describe('Velocity preservation', () => {
    it('passes velocity through from MIDI to synth', () => {
      let capturedVelocity = 0;

      midiHandler.setNoteOnHandler((note, velocity) => {
        const voice = midiDrumMapping.getVoiceFromNote(note);
        if (voice) {
          capturedVelocity = velocity;
        }
      });

      // Test various velocities
      const velocities = [0, 50, 100, 127];

      velocities.forEach((vel) => {
        const midiData = new Uint8Array([0x90, 36, vel]);
        const mockEvent = {
          data: midiData,
          timeStamp: Date.now(),
        } as MIDIMessageEvent;
        midiHandler.handleMessage(mockEvent);

        if (vel > 0) {
          // Velocity 0 is treated as note off
          expect(capturedVelocity).toBe(vel);
        }
      });
    });
  });

  describe('Configuration integration', () => {
    it('default config matches expected values', () => {
      const config = loadMIDIConfig();

      expect(config).toEqual(DEFAULT_MIDI_CONFIG);
      expect(config.selectedKitName).toBe('TD-17');
    });

    it('kit name from config can be used with midiDrumMapping', () => {
      const config = loadMIDIConfig();

      // Should not throw
      expect(() => {
        midiDrumMapping.setKit(config.selectedKitName);
      }).not.toThrow();

      expect(midiDrumMapping.getCurrentKit()).toBe(config.selectedKitName);
    });
  });

  describe('Note on/off lifecycle', () => {
    it('correctly handles note on followed by note off', () => {
      const noteOnCalls: number[] = [];
      const noteOffCalls: number[] = [];

      midiHandler.setNoteOnHandler((note) => {
        noteOnCalls.push(note);
      });

      midiHandler.setNoteOffHandler((note) => {
        noteOffCalls.push(note);
      });

      // Send note on
      const noteOnData = new Uint8Array([0x90, 42, 100]);
      const noteOnEvent = {
        data: noteOnData,
        timeStamp: Date.now(),
      } as MIDIMessageEvent;

      midiHandler.handleMessage(noteOnEvent);

      // Send note off
      const noteOffData = new Uint8Array([0x80, 42, 0]);
      const noteOffEvent = {
        data: noteOffData,
        timeStamp: Date.now(),
      } as MIDIMessageEvent;

      midiHandler.handleMessage(noteOffEvent);

      expect(noteOnCalls).toContain(42);
      expect(noteOffCalls).toContain(42);
    });
  });

  describe('Edge case handling', () => {
    it('handles rapid fire MIDI notes', () => {
      const playedDrums: string[] = [];

      midiHandler.setNoteOnHandler((note) => {
        const voice = midiDrumMapping.getVoiceFromNote(note);
        if (voice) {
          playedDrums.push(voice);
        }
      });

      // Rapidly send same note multiple times
      for (let i = 0; i < 5; i++) {
        const midiData = new Uint8Array([0x90, 42, 100]);
        const mockEvent = {
          data: midiData,
          timeStamp: Date.now(),
        } as MIDIMessageEvent;
        midiHandler.handleMessage(mockEvent);
      }

      expect(playedDrums.length).toBe(5);
      playedDrums.forEach((drum) => {
        expect(drum).toBe('hihat-closed');
      });
    });

    it('handles switching between kits during playback', () => {
      const playedDrums: string[] = [];

      midiHandler.setNoteOnHandler((note) => {
        const voice = midiDrumMapping.getVoiceFromNote(note);
        if (voice) {
          playedDrums.push(`${midiDrumMapping.getCurrentKit()}:${voice}`);
        }
      });

      // Play with TD-17
      let midiData = new Uint8Array([0x90, 36, 100]);
      let mockEvent = {
        data: midiData,
        timeStamp: Date.now(),
      } as MIDIMessageEvent;
      midiHandler.handleMessage(mockEvent);

      // Switch kit
      midiDrumMapping.setKit('Alesis Nitro');

      // Play with Alesis
      midiData = new Uint8Array([0x90, 36, 100]);
      mockEvent = {
        data: midiData,
        timeStamp: Date.now(),
      } as MIDIMessageEvent;
      midiHandler.handleMessage(mockEvent);

      expect(playedDrums[0]).toContain('TD-17');
      expect(playedDrums[1]).toContain('Alesis Nitro');
    });
  });
});
