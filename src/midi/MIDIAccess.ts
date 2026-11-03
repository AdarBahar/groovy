/**
 * MIDIAccess - MIDI Device Management
 *
 * Handles Web MIDI API initialization, device enumeration, connection management,
 * and device state changes.
 *
 * Converted from /docs/groovy-midi-transfer/midi/midi-access.js
 */

import { MIDIAvailability, MIDIDeviceInfo } from './types';
import { logger } from '../utils/logger';

const FAKE_MIDI_DEVICE_ID = '__groovy_keyboard_midi_localhost__';
const FAKE_MIDI_DEVICE_NAME = '🎹 Keyboard (Testing - Localhost Only)';

class MIDIAccessManager {
  private midiAccess: MIDIAccess | null = null;
  private currentInput: MIDIInput | null = null;
  private messageHandler: ((event: MIDIMessageEvent) => void) | null = null;
  private fakeMIDIMessageHandler: ((data: Uint8Array, timestamp: number) => void) | null = null;
  public onDeviceListChange: ((devices: MIDIDeviceInfo[]) => void) | null = null;
  private isLocalhost: boolean = false;
  /**
   * Bumped by every initialize() and dispose(). An initialize() whose
   * requestMIDIAccess() resolves after a newer initialize() or a dispose()
   * sees a different generation and discards its result instead of attaching
   * a handler to an object nobody owns.
   */
  private initGeneration: number = 0;
  /** Why MIDI is or is not usable. Set once per current initialize() call. */
  private availability: MIDIAvailability = 'pending';

  /**
   * Initialize Web MIDI API access
   * @returns Promise<boolean> Success status
   */
  async initialize(): Promise<boolean> {
    // Detect localhost for fake MIDI device
    this.isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    // Re-initialization starts from a clean slate: drop any bound input and
    // release the previous MIDIAccess object (and its statechange handler) so
    // handlers never accumulate across StrictMode double-mounts, HMR or re-init.
    this.disconnect();
    this.releaseAccess();
    const generation = ++this.initGeneration;

    if (!navigator.requestMIDIAccess) {
      logger.error('Web MIDI API not supported in this browser');
      // Even if Web MIDI API is not supported, we can still use the keyboard simulator on localhost
      if (this.isLocalhost) {
        logger.log('🎹 Using keyboard MIDI simulator (Web MIDI API not available)');
        this.availability = 'available';
        return true;
      }
      this.availability = 'unsupported';
      return false;
    }

    try {
      const access = await navigator.requestMIDIAccess({ sysex: false });
      if (generation !== this.initGeneration) {
        // Superseded by a newer initialize() or torn down by dispose() while
        // the permission/access request was pending: leave this object untouched.
        logger.log('MIDI access resolved after re-init/dispose; discarding stale initialization');
        return false;
      }
      this.midiAccess = access;
      this.midiAccess.onstatechange = (e: Event) => this.handleStateChange(e as unknown as MIDIConnectionEvent);
      this.availability = 'available';
      logger.log('MIDI Access initialized successfully');

      if (this.isLocalhost) {
        logger.log('🎹 Fake MIDI device available for localhost testing');
      }

      return true;
    } catch (error) {
      if (generation !== this.initGeneration) {
        return false;
      }
      logger.error('Failed to initialize MIDI access:', error);
      if (this.isLocalhost) {
        logger.log('🎹 Falling back to keyboard MIDI simulator');
        this.availability = 'available';
        return true;
      }
      this.availability = this.classifyInitError(error);
      return false;
    }
  }

  /**
   * Get the result of the last current initialize() call.
   * Stale calls do not change this value.
   */
  getAvailability(): MIDIAvailability {
    return this.availability;
  }

  /** Map an error from requestMIDIAccess() to an availability value. */
  private classifyInitError(error: unknown): MIDIAvailability {
    const name = (error as { name?: unknown } | null)?.name;
    if (name === 'NotAllowedError' || name === 'SecurityError') {
      return 'denied';
    }
    return 'error';
  }

  /**
   * Get list of available MIDI input devices
   * @returns Array of input devices (sorted by name, fake device last)
   */
  getInputDevices(): MIDIDeviceInfo[] {
    const devices: MIDIDeviceInfo[] = [];

    // Add real devices if MIDI Access is available
    if (this.midiAccess) {
      for (const input of this.midiAccess.inputs.values()) {
        devices.push({
          id: input.id,
          name: input.name || 'Unknown Device',
          manufacturer: input.manufacturer || '',
          state: input.state as 'connected' | 'disconnected',
        });
      }
    }

    // Sort real devices by name for stable UI ordering (Issue #100)
    devices.sort((a, b) => a.name.localeCompare(b.name));

    // Add fake keyboard device on localhost (always at end)
    if (this.isLocalhost) {
      devices.push({
        id: FAKE_MIDI_DEVICE_ID,
        name: FAKE_MIDI_DEVICE_NAME,
        manufacturer: 'Groovy (Development)',
        state: 'connected',
      });
    }

    return devices;
  }

  /**
   * Bind to a specific MIDI input device
   * @param deviceId - The MIDI device ID
   * @param messageHandler - Callback for MIDI messages
   * @returns boolean Success status
   */
  bindInput(deviceId: string, messageHandler: (event: MIDIMessageEvent) => void): boolean {
    // Issue #92: Validate new device BEFORE disconnecting current connection
    // This prevents losing working connection if new device doesn't exist

    // Clear any stale fake handler at bind-start so a fake→real (or fake→fake) switch
    // never leaves the old fake handler alive (#120).
    this.fakeMIDIMessageHandler = null;

    // Validate fake keyboard device request
    if (deviceId === FAKE_MIDI_DEVICE_ID) {
      if (!this.isLocalhost) {
        logger.error('Fake MIDI device only available on localhost');
        return false;
      }
      // Validation passed, OK to proceed
    } else {
      // Validate real device exists
      if (!this.midiAccess) {
        logger.error('MIDI access not initialized');
        return false;
      }

      const input = this.midiAccess.inputs.get(deviceId);
      if (!input) {
        logger.error('MIDI input device not found:', deviceId);
        return false;
      }
    }

    // NOW that we've validated the new device, disconnect previous input
    if (this.currentInput) {
      this.currentInput.onmidimessage = null;
      logger.log('Disconnected from previous MIDI input');
    }

    // Handle fake keyboard device on localhost
    if (deviceId === FAKE_MIDI_DEVICE_ID) {
      this.currentInput = null; // Fake device has no currentInput
      this.fakeMIDIMessageHandler = (data: Uint8Array, timestamp: number) => {
        // Convert to MIDIMessageEvent-like object
        const fakeEvent = {
          data: data,
          timeStamp: timestamp,
        } as MIDIMessageEvent;
        messageHandler(fakeEvent);
      };

      logger.log(`✅ Connected to fake MIDI device: ${FAKE_MIDI_DEVICE_NAME}`);
      logger.log('Use keyboard: K=Kick, S=Snare, H=Hi-hat (Space=play/pause)');
      return true;
    }

    // Bind real MIDI input (we already validated it exists above)
    const input = this.midiAccess!.inputs.get(deviceId)!;
    this.currentInput = input;
    this.messageHandler = messageHandler;
    this.currentInput.onmidimessage = (event) => this.handleMIDIMessage(event);

    logger.log('Connected to MIDI input:', input.name);
    return true;
  }

  /**
   * Handle incoming MIDI message
   * @private
   */
  private handleMIDIMessage(event: MIDIMessageEvent): void {
    if (this.messageHandler) {
      this.messageHandler(event);
    }
  }

  /**
   * Handle MIDI device state changes (connect/disconnect)
   * @private
   */
  private handleStateChange(event: MIDIConnectionEvent): void {
    if (!event.port) return;

    logger.log('MIDI device state changed:', event.port.name, event.port.state);

    // Notify listener of device list change
    if (this.onDeviceListChange) {
      this.onDeviceListChange(this.getInputDevices());
    }

    // If current device disconnected, clear it
    if (this.currentInput && event.port.id === this.currentInput.id && event.port.state === 'disconnected') {
      logger.warn('Current MIDI input device disconnected');
      // Clear the port handler before dropping the reference so a reconnecting
      // port cannot fire a stale closure.
      this.currentInput.onmidimessage = null;
      this.currentInput = null;
    }
  }

  /**
   * Disconnect from current input device
   */
  disconnect(): void {
    if (this.currentInput) {
      this.currentInput.onmidimessage = null;
      this.currentInput = null;
      logger.log('Disconnected from MIDI input');
    }
    // Clear fake handler so sendFakeMIDIMessage is a no-op and
    // getCurrentDevice() returns null after a fake-device disconnect (#120).
    this.fakeMIDIMessageHandler = null;
  }

  /**
   * Release the underlying MIDIAccess object and its statechange handler.
   * @private
   */
  private releaseAccess(): void {
    if (this.midiAccess) {
      this.midiAccess.onstatechange = null;
      this.midiAccess = null;
    }
  }

  /**
   * Full teardown: disconnect the bound input, release the MIDIAccess object
   * and drop every callback. Safe to call when never initialized or already
   * disposed. Call initialize() again to reuse the manager.
   */
  dispose(): void {
    // Invalidate any initialize() still awaiting requestMIDIAccess().
    this.initGeneration++;
    this.disconnect();
    this.releaseAccess();
    this.messageHandler = null;
    this.onDeviceListChange = null;
  }

  /**
   * Get currently connected device info
   * @returns Device info or null
   */
  getCurrentDevice(): MIDIDeviceInfo | null {
    if (this.currentInput) {
      return {
        id: this.currentInput.id,
        name: this.currentInput.name || 'Unknown Device',
        manufacturer: this.currentInput.manufacturer || '',
        state: this.currentInput.state as 'connected' | 'disconnected',
      };
    }

    // If using fake device, return its info
    if (this.fakeMIDIMessageHandler) {
      return {
        id: FAKE_MIDI_DEVICE_ID,
        name: FAKE_MIDI_DEVICE_NAME,
        manufacturer: 'Groovy (Development)',
        state: 'connected',
      };
    }

    return null;
  }

  /**
   * Send a fake MIDI message (for keyboard simulator on localhost)
   * @param note - MIDI note number (0-127)
   * @param velocity - MIDI velocity (0-127)
   * @param timestamp - Event timestamp
   * @internal
   */
  sendFakeMIDIMessage(note: number, velocity: number, timestamp: number): void {
    if (!this.fakeMIDIMessageHandler) {
      return; // Not connected to fake device
    }

    // Create Note On message: [0x90 (note on), note, velocity]
    const data = new Uint8Array([0x90, note, velocity]);
    this.fakeMIDIMessageHandler(data, timestamp);
  }
}

// Export singleton instance
export const midiAccess = new MIDIAccessManager();

// Export fake device ID for testing
export const FAKE_MIDI_DEVICE_ID_EXPORT = FAKE_MIDI_DEVICE_ID;
