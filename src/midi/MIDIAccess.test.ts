/**
 * Tests for MIDIAccess - fake keyboard MIDI handler lifecycle (#120)
 *
 * Verifies:
 * - Disconnect clears fakeMIDIMessageHandler so sendFakeMIDIMessage is a no-op
 * - getCurrentDevice() returns null after fake device disconnect
 * - Switching from fake to real device clears the fake handler
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { midiAccess, FAKE_MIDI_DEVICE_ID_EXPORT } from './MIDIAccess';

// Force isLocalhost=true so the fake device is available
Object.defineProperty(window, 'location', {
  value: { hostname: 'localhost' },
  writable: true,
});

describe('MIDIAccess fake keyboard handler lifecycle (#120)', () => {
  const messageHandlerSpy = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();
    // Initialize with no Web MIDI API (simulates localhost-only mode)
    // navigator.requestMIDIAccess is not defined in jsdom, so initialize() will
    // fall through to the localhost fallback and return true.
    await midiAccess.initialize();
  });

  afterEach(() => {
    midiAccess.disconnect();
  });

  describe('disconnect clears fake handler', () => {
    it('sendFakeMIDIMessage is a no-op after disconnect()', () => {
      // Bind the fake device
      const bound = midiAccess.bindInput(FAKE_MIDI_DEVICE_ID_EXPORT, messageHandlerSpy);
      expect(bound).toBe(true);

      // Disconnect
      midiAccess.disconnect();

      // Handler must not be called
      midiAccess.sendFakeMIDIMessage(60, 100, performance.now());
      expect(messageHandlerSpy).not.toHaveBeenCalled();
    });

    it('getCurrentDevice() returns null after fake device disconnect()', () => {
      midiAccess.bindInput(FAKE_MIDI_DEVICE_ID_EXPORT, messageHandlerSpy);
      expect(midiAccess.getCurrentDevice()).not.toBeNull();

      midiAccess.disconnect();

      expect(midiAccess.getCurrentDevice()).toBeNull();
    });
  });

  describe('switching from fake to real device clears fake handler', () => {
    it('sendFakeMIDIMessage is inert after binding a real device', async () => {
      // Set up a mock MIDIAccess with a real device
      const mockMidiInput = {
        id: 'real-device-id',
        name: 'Real Drum Kit',
        manufacturer: 'Roland',
        state: 'connected',
        onmidimessage: null as ((e: MIDIMessageEvent) => void) | null,
      };
      const mockMidiAccess = {
        inputs: new Map([['real-device-id', mockMidiInput]]),
        onstatechange: null,
      };
      // Stub navigator.requestMIDIAccess to return our mock
      const requestMIDIAccessSpy = vi.fn().mockResolvedValue(mockMidiAccess);
      Object.defineProperty(navigator, 'requestMIDIAccess', {
        value: requestMIDIAccessSpy,
        writable: true,
        configurable: true,
      });

      // Re-initialize to pick up the mock
      await midiAccess.initialize();

      // First bind fake device
      const fakeBound = midiAccess.bindInput(FAKE_MIDI_DEVICE_ID_EXPORT, messageHandlerSpy);
      expect(fakeBound).toBe(true);
      expect(midiAccess.getCurrentDevice()?.id).toBe(FAKE_MIDI_DEVICE_ID_EXPORT);

      // Now switch to real device
      const realHandlerSpy = vi.fn();
      const realBound = midiAccess.bindInput('real-device-id', realHandlerSpy);
      expect(realBound).toBe(true);

      // Sending fake MIDI message must not call the original fake handler
      midiAccess.sendFakeMIDIMessage(60, 100, performance.now());
      expect(messageHandlerSpy).not.toHaveBeenCalled();

      // getCurrentDevice should report the real device
      expect(midiAccess.getCurrentDevice()?.id).toBe('real-device-id');
    });
  });
});
