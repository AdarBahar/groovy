/**
 * Keyboard MIDI Simulator - For Development & Testing
 *
 * Allows testing MIDI input using keyboard keys without needing a physical MIDI device.
 * Generates synthetic MIDI note-on events with realistic timing.
 *
 * Key Mappings:
 * - K: Kick (MIDI note 36, velocity 100)
 * - S: Snare (MIDI note 38, velocity 90)
 * - Space: Hi-hat (MIDI note 46, velocity 80)
 */

export interface KeyboardMIDIConfig {
  enabled: boolean;
  keyMap: Record<string, { note: number; velocity: number; label: string }>;
}

export const DEFAULT_KEYBOARD_MIDI_CONFIG: KeyboardMIDIConfig = {
  enabled: false,
  keyMap: {
    k: { note: 36, velocity: 100, label: 'Kick' },
    s: { note: 38, velocity: 90, label: 'Snare' },
    ' ': { note: 46, velocity: 80, label: 'Hi-hat' },
  },
};

type KeyboardMIDICallback = (note: number, velocity: number, timestamp: number) => void;

/**
 * Simulates MIDI input from keyboard events
 */
export class KeyboardMIDISimulator {
  private enabled: boolean = false;
  private keyMap: Record<string, { note: number; velocity: number; label: string }>;
  private callback: KeyboardMIDICallback | null = null;
  private boundKeyHandler: ((event: KeyboardEvent) => void) | null = null;

  constructor(config: KeyboardMIDIConfig = DEFAULT_KEYBOARD_MIDI_CONFIG) {
    this.enabled = config.enabled;
    this.keyMap = config.keyMap;
  }

  /**
   * Start listening to keyboard input
   * @param callback - Function to call when a key is pressed
   */
  start(callback: KeyboardMIDICallback): void {
    if (this.enabled && this.boundKeyHandler) {
      return; // Already started
    }

    this.callback = callback;
    this.boundKeyHandler = (event: KeyboardEvent) => this.handleKeyDown(event);
    window.addEventListener('keydown', this.boundKeyHandler);
    console.log('🎹 Keyboard MIDI Simulator started');
  }

  /**
   * Stop listening to keyboard input
   */
  stop(): void {
    if (this.boundKeyHandler) {
      window.removeEventListener('keydown', this.boundKeyHandler);
      this.boundKeyHandler = null;
      console.log('🎹 Keyboard MIDI Simulator stopped');
    }
  }

  /**
   * Enable/disable the simulator
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    if (enabled && !this.boundKeyHandler && this.callback) {
      this.start(this.callback);
    } else if (!enabled) {
      this.stop();
    }
  }

  /**
   * Check if simulator is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Handle keyboard key press
   * @private
   */
  private handleKeyDown(event: KeyboardEvent): void {
    if (!this.enabled || !this.callback) {
      return;
    }

    const target = event.target as HTMLElement | null;
    if (target) {
      const tagName = target.tagName;
      const isEditableField =
        tagName === 'INPUT' ||
        tagName === 'TEXTAREA' ||
        tagName === 'SELECT' ||
        target.isContentEditable;

      if (isEditableField) {
        return;
      }
    }

    const key = event.key.toLowerCase();
    const mapping = this.keyMap[key];

    if (mapping) {
      // Prevent default browser behavior for mapped keys
      event.preventDefault();

      // Generate MIDI event with current timestamp
      const timestamp = performance.now();
      this.callback(mapping.note, mapping.velocity, timestamp);

      // Visual feedback
      console.log(`🥁 ${mapping.label} (note ${mapping.note}, velocity ${mapping.velocity})`);
    }
  }

  /**
   * Get current key map
   */
  getKeyMap(): Record<string, { note: number; velocity: number; label: string }> {
    return { ...this.keyMap };
  }

  /**
   * Update key map
   */
  setKeyMap(keyMap: Record<string, { note: number; velocity: number; label: string }>): void {
    this.keyMap = keyMap;
  }
}

/**
 * Global keyboard MIDI simulator instance
 */
export const keyboardMIDISimulator = new KeyboardMIDISimulator();
