// midi-handler.js - MIDI Message Processing Module

import { getDrumNameFromNote, getGrooveVoiceFromNote } from './drum-mapping.js';

class MIDIHandler {
  constructor() {
    this.onNoteOn = null;  // Callback: (note, velocity, drumName, grooveVoice) => {}
    this.onNoteOff = null; // Callback: (note) => {}
    this.onControlChange = null; // Callback: (controller, value) => {}
  }

  /**
   * Process incoming MIDI message
   * @param {MIDIMessageEvent} event - MIDI message event
   */
  handleMessage(event) {
    const [status, note, velocity] = event.data;
    const cmd = status & 0xf0; // Extract command (high nibble)
    const channel = status & 0x0f; // Extract channel (low nibble)

    switch (cmd) {
      case 0x90: // Note ON
        if (velocity > 0) {
          this.handleNoteOn(note, velocity, event.timeStamp);
        } else {
          // Velocity 0 is treated as note off
          this.handleNoteOff(note, event.timeStamp);
        }
        break;

      case 0x80: // Note OFF
        this.handleNoteOff(note, event.timeStamp);
        break;

      case 0xb0: // Control Change
        this.handleControlChange(note, velocity, event.timeStamp);
        break;

      default:
        // Ignore other message types (pitch bend, program change, etc.)
        break;
    }
  }

  /**
   * Handle note on event
   * @private
   */
  handleNoteOn(note, velocity, timestamp) {
    const drumName = getDrumNameFromNote(note);
    const grooveVoice = getGrooveVoiceFromNote(note);

    console.log('MIDI Note ON:', {
      note,
      velocity,
      drumName,
      grooveVoice,
      timestamp
    });

    if (this.onNoteOn) {
      this.onNoteOn(note, velocity, drumName, grooveVoice, timestamp);
    }
  }

  /**
   * Handle note off event
   * @private
   */
  handleNoteOff(note, timestamp) {
    console.log('MIDI Note OFF:', note);

    if (this.onNoteOff) {
      this.onNoteOff(note, timestamp);
    }
  }

  /**
   * Handle control change event
   * @private
   */
  handleControlChange(controller, value, timestamp) {
    console.log('MIDI Control Change:', { controller, value });

    if (this.onControlChange) {
      this.onControlChange(controller, value, timestamp);
    }
  }

  /**
   * Set callback for note on events
   * @param {Function} callback - (note, velocity, drumName, grooveVoice, timestamp) => {}
   */
  setNoteOnHandler(callback) {
    this.onNoteOn = callback;
  }

  /**
   * Set callback for note off events
   * @param {Function} callback - (note, timestamp) => {}
   */
  setNoteOffHandler(callback) {
    this.onNoteOff = callback;
  }

  /**
   * Set callback for control change events
   * @param {Function} callback - (controller, value, timestamp) => {}
   */
  setControlChangeHandler(callback) {
    this.onControlChange = callback;
  }
}

// Export singleton instance
export const midiHandler = new MIDIHandler();
