/**
 * Tests for MIDI Handler
 *
 * Verifies MIDI message parsing and event handling
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { midiHandler } from './MIDIHandler';

describe('MIDIHandler', () => {
  beforeEach(() => {
    // Reset handlers before each test
    midiHandler.setNoteOnHandler(() => {});
    midiHandler.setNoteOffHandler(() => {});
    midiHandler.setControlChangeHandler(() => {});
  });

  describe('Note On messages (0x90)', () => {
    it('calls noteOn handler when note on message received', () => {
      const handler = vi.fn();
      midiHandler.setNoteOnHandler(handler);

      // MIDI Note On: channel 1, middle C (60), velocity 100
      const midiData = new Uint8Array([0x90, 60, 100]);
      const mockEvent = {
        data: midiData,
        timeStamp: Date.now(),
      } as MIDIMessageEvent;

      midiHandler.handleMessage(mockEvent);

      expect(handler).toHaveBeenCalledWith(60, 100, null, expect.any(Number));
    });

    it('extracts correct MIDI note from message', () => {
      let capturedNote = 0;
      const handler = (note: number) => {
        capturedNote = note;
      };
      midiHandler.setNoteOnHandler(handler);

      const midiData = new Uint8Array([0x90, 42, 100]); // Note 42 (closed hi-hat)
      const mockEvent = {
        data: midiData,
        timeStamp: Date.now(),
      } as MIDIMessageEvent;

      midiHandler.handleMessage(mockEvent);

      expect(capturedNote).toBe(42);
    });

    it('extracts correct velocity from message', () => {
      let capturedVelocity = 0;
      const handler = (_note: number, velocity: number) => {
        capturedVelocity = velocity;
      };
      midiHandler.setNoteOnHandler(handler);

      const midiData = new Uint8Array([0x90, 60, 75]); // Velocity 75
      const mockEvent = {
        data: midiData,
        timeStamp: Date.now(),
      } as MIDIMessageEvent;

      midiHandler.handleMessage(mockEvent);

      expect(capturedVelocity).toBe(75);
    });

    it('handles velocity 0 as note off', () => {
      const noteOnHandler = vi.fn();
      const noteOffHandler = vi.fn();
      midiHandler.setNoteOnHandler(noteOnHandler);
      midiHandler.setNoteOffHandler(noteOffHandler);

      // Note on with velocity 0 should trigger note off
      const midiData = new Uint8Array([0x90, 60, 0]);
      const mockEvent = {
        data: midiData,
        timeStamp: Date.now(),
      } as MIDIMessageEvent;

      midiHandler.handleMessage(mockEvent);

      expect(noteOffHandler).toHaveBeenCalled();
      expect(noteOnHandler).not.toHaveBeenCalled();
    });

    it('handles multiple note on messages sequentially', () => {
      const handler = vi.fn();
      midiHandler.setNoteOnHandler(handler);

      const notes = [36, 38, 42]; // Kick, snare, hi-hat
      notes.forEach((note) => {
        const midiData = new Uint8Array([0x90, note, 100]);
        const mockEvent = {
          data: midiData,
          timeStamp: Date.now(),
        } as MIDIMessageEvent;
        midiHandler.handleMessage(mockEvent);
      });

      expect(handler).toHaveBeenCalledTimes(3);
    });
  });

  describe('Note Off messages (0x80)', () => {
    it('calls noteOff handler when note off message received', () => {
      const handler = vi.fn();
      midiHandler.setNoteOffHandler(handler);

      // MIDI Note Off: channel 1, middle C (60)
      const midiData = new Uint8Array([0x80, 60, 0]);
      const mockEvent = {
        data: midiData,
        timeStamp: Date.now(),
      } as MIDIMessageEvent;

      midiHandler.handleMessage(mockEvent);

      expect(handler).toHaveBeenCalledWith(60, expect.any(Number));
    });

    it('extracts correct note from note off message', () => {
      let capturedNote = 0;
      const handler = (note: number) => {
        capturedNote = note;
      };
      midiHandler.setNoteOffHandler(handler);

      const midiData = new Uint8Array([0x80, 46, 0]); // Note 46 (open hi-hat)
      const mockEvent = {
        data: midiData,
        timeStamp: Date.now(),
      } as MIDIMessageEvent;

      midiHandler.handleMessage(mockEvent);

      expect(capturedNote).toBe(46);
    });
  });

  describe('Control Change messages (0xB0)', () => {
    it('calls control change handler for CC messages', () => {
      const handler = vi.fn();
      midiHandler.setControlChangeHandler(handler);

      // MIDI CC: controller 7 (volume), value 100
      const midiData = new Uint8Array([0xb0, 7, 100]);
      const mockEvent = {
        data: midiData,
        timeStamp: Date.now(),
      } as MIDIMessageEvent;

      midiHandler.handleMessage(mockEvent);

      expect(handler).toHaveBeenCalledWith(7, 100, expect.any(Number));
    });

    it('extracts correct controller and value', () => {
      let capturedController = 0;
      let capturedValue = 0;
      const handler = (controller: number, value: number) => {
        capturedController = controller;
        capturedValue = value;
      };
      midiHandler.setControlChangeHandler(handler);

      const midiData = new Uint8Array([0xb0, 64, 127]); // Sustain pedal, max value
      const mockEvent = {
        data: midiData,
        timeStamp: Date.now(),
      } as MIDIMessageEvent;

      midiHandler.handleMessage(mockEvent);

      expect(capturedController).toBe(64);
      expect(capturedValue).toBe(127);
    });
  });

  describe('Edge cases', () => {
    it('ignores messages with null data', () => {
      const handler = vi.fn();
      midiHandler.setNoteOnHandler(handler);

      const mockEvent = {
        data: null,
        timeStamp: Date.now(),
      } as any;

      midiHandler.handleMessage(mockEvent);

      expect(handler).not.toHaveBeenCalled();
    });

    it('ignores incomplete messages (less than 3 bytes)', () => {
      const handler = vi.fn();
      midiHandler.setNoteOnHandler(handler);

      const midiData = new Uint8Array([0x90, 60]); // Missing velocity byte
      const mockEvent = {
        data: midiData,
        timeStamp: Date.now(),
      } as MIDIMessageEvent;

      midiHandler.handleMessage(mockEvent);

      expect(handler).not.toHaveBeenCalled();
    });

    it('ignores messages with empty data', () => {
      const handler = vi.fn();
      midiHandler.setNoteOnHandler(handler);

      const midiData = new Uint8Array([]);
      const mockEvent = {
        data: midiData,
        timeStamp: Date.now(),
      } as MIDIMessageEvent;

      midiHandler.handleMessage(mockEvent);

      expect(handler).not.toHaveBeenCalled();
    });

    it('handles system messages gracefully', () => {
      const noteHandler = vi.fn();
      const ccHandler = vi.fn();
      midiHandler.setNoteOnHandler(noteHandler);
      midiHandler.setControlChangeHandler(ccHandler);

      // System exclusive message
      const midiData = new Uint8Array([0xf0, 0x00, 0xf7]);
      const mockEvent = {
        data: midiData,
        timeStamp: Date.now(),
      } as MIDIMessageEvent;

      midiHandler.handleMessage(mockEvent);

      // Should not trigger any note or CC handlers
      expect(noteHandler).not.toHaveBeenCalled();
      expect(ccHandler).not.toHaveBeenCalled();
    });
  });

  describe('MIDI note ranges', () => {
    it('handles MIDI note 0 (C-2)', () => {
      const handler = vi.fn();
      midiHandler.setNoteOnHandler(handler);

      const midiData = new Uint8Array([0x90, 0, 100]);
      const mockEvent = {
        data: midiData,
        timeStamp: Date.now(),
      } as MIDIMessageEvent;

      midiHandler.handleMessage(mockEvent);

      expect(handler).toHaveBeenCalledWith(0, expect.any(Number), expect.any(Object), expect.any(Number));
    });

    it('handles MIDI note 127 (G8)', () => {
      const handler = vi.fn();
      midiHandler.setNoteOnHandler(handler);

      const midiData = new Uint8Array([0x90, 127, 100]);
      const mockEvent = {
        data: midiData,
        timeStamp: Date.now(),
      } as MIDIMessageEvent;

      midiHandler.handleMessage(mockEvent);

      expect(handler).toHaveBeenCalledWith(127, expect.any(Number), expect.any(Object), expect.any(Number));
    });

    it('handles common drum kit MIDI notes', () => {
      const handler = vi.fn();
      midiHandler.setNoteOnHandler(handler);

      const drumNotes = [36, 38, 42, 46]; // Kick, snare, closed hat, open hat
      drumNotes.forEach((note) => {
        handler.mockClear();
        const midiData = new Uint8Array([0x90, note, 100]);
        const mockEvent = {
          data: midiData,
          timeStamp: Date.now(),
        } as MIDIMessageEvent;
        midiHandler.handleMessage(mockEvent);

        expect(handler).toHaveBeenCalledWith(note, expect.any(Number), expect.any(Object), expect.any(Number));
      });
    });
  });
});
