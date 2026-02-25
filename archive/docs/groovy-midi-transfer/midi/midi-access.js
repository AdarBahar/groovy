// midi-access.js - MIDI Device Management Module

class MIDIAccess {
  constructor() {
    this.midiAccess = null;
    this.currentInput = null;
    this.messageHandler = null;
    this.onDeviceListChange = null; // Callback when devices change
  }

  /**
   * Initialize Web MIDI API access
   * @returns {Promise<boolean>} Success status
   */
  async initialize() {
    if (!navigator.requestMIDIAccess) {
      console.error('Web MIDI API not supported in this browser');
      return false;
    }

    try {
      this.midiAccess = await navigator.requestMIDIAccess();
      this.midiAccess.onstatechange = (e) => this.handleStateChange(e);
      console.log('MIDI Access initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize MIDI access:', error);
      return false;
    }
  }

  /**
   * Get list of available MIDI input devices
   * @returns {Array<{id: string, name: string}>} Array of input devices
   */
  getInputDevices() {
    if (!this.midiAccess) return [];

    const devices = [];
    for (const input of this.midiAccess.inputs.values()) {
      devices.push({
        id: input.id,
        name: input.name || 'Unknown Device',
        manufacturer: input.manufacturer || '',
        state: input.state
      });
    }
    return devices;
  }

  /**
   * Bind to a specific MIDI input device
   * @param {string} deviceId - The MIDI device ID
   * @param {Function} messageHandler - Callback for MIDI messages
   * @returns {boolean} Success status
   */
  bindInput(deviceId, messageHandler) {
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
  handleMIDIMessage(event) {
    if (this.messageHandler) {
      this.messageHandler(event);
    }
  }

  /**
   * Handle MIDI device state changes (connect/disconnect)
   * @private
   */
  handleStateChange(event) {
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
  disconnect() {
    if (this.currentInput) {
      this.currentInput.onmidimessage = null;
      this.currentInput = null;
      console.log('Disconnected from MIDI input');
    }
  }

  /**
   * Get currently connected device info
   * @returns {Object|null} Device info or null
   */
  getCurrentDevice() {
    if (!this.currentInput) return null;

    return {
      id: this.currentInput.id,
      name: this.currentInput.name,
      manufacturer: this.currentInput.manufacturer,
      state: this.currentInput.state
    };
  }
}

// Export singleton instance
export const midiAccess = new MIDIAccess();
