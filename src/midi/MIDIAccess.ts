/**
 * MIDIAccess - MIDI Device Management
 *
 * Handles Web MIDI API initialization, device enumeration, connection management,
 * and device state changes.
 *
 * Converted from /docs/groovy-midi-transfer/midi/midi-access.js
 */

import { MIDIDeviceInfo } from './types';

class MIDIAccessManager {
  private midiAccess: MIDIAccess | null = null;
  private currentInput: MIDIInput | null = null;
  private messageHandler: ((event: MIDIMessageEvent) => void) | null = null;
  public onDeviceListChange: ((devices: MIDIDeviceInfo[]) => void) | null = null;

  /**
   * Initialize Web MIDI API access
   * @returns Promise<boolean> Success status
   */
  async initialize(): Promise<boolean> {
    if (!navigator.requestMIDIAccess) {
      console.error('Web MIDI API not supported in this browser');
      return false;
    }

    try {
      this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });
      this.midiAccess.onstatechange = (e: Event) => this.handleStateChange(e as unknown as MIDIConnectionEvent);
      console.log('MIDI Access initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize MIDI access:', error);
      return false;
    }
  }

  /**
   * Get list of available MIDI input devices
   * @returns Array of input devices
   */
  getInputDevices(): MIDIDeviceInfo[] {
    if (!this.midiAccess) return [];

    const devices: MIDIDeviceInfo[] = [];
    for (const input of this.midiAccess.inputs.values()) {
      devices.push({
        id: input.id,
        name: input.name || 'Unknown Device',
        manufacturer: input.manufacturer || '',
        state: input.state as 'connected' | 'disconnected',
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
    if (!this.midiAccess) {
      console.error('MIDI access not initialized');
      return false;
    }

    // Disconnect previous input
    if (this.currentInput) {
      this.currentInput.onmidimessage = null;
      console.log('Disconnected from previous MIDI input');
    }

    // Find and bind new input
    const input = this.midiAccess.inputs.get(deviceId);
    if (!input) {
      console.error('MIDI input device not found:', deviceId);
      return false;
    }

    this.currentInput = input;
    this.messageHandler = messageHandler;
    this.currentInput.onmidimessage = (event) => this.handleMIDIMessage(event);

    console.log('Connected to MIDI input:', input.name);
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

    console.log('MIDI device state changed:', event.port.name, event.port.state);

    // Notify listener of device list change
    if (this.onDeviceListChange) {
      this.onDeviceListChange(this.getInputDevices());
    }

    // If current device disconnected, clear it
    if (this.currentInput && event.port.id === this.currentInput.id && event.port.state === 'disconnected') {
      console.warn('Current MIDI input device disconnected');
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
      console.log('Disconnected from MIDI input');
    }
  }

  /**
   * Get currently connected device info
   * @returns Device info or null
   */
  getCurrentDevice(): MIDIDeviceInfo | null {
    if (!this.currentInput) return null;

    return {
      id: this.currentInput.id,
      name: this.currentInput.name || 'Unknown Device',
      manufacturer: (this.currentInput as any).manufacturer || '',
      state: this.currentInput.state as 'connected' | 'disconnected',
    };
  }
}

// Export singleton instance
export const midiAccess = new MIDIAccessManager();
