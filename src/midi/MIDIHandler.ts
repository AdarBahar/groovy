/**
 * MIDIHandler - MIDI Message Processing
 *
 * Processes incoming MIDI messages, parses note on/off and control change events,
 * and triggers callbacks for UI and audio subsystems.
 *
 * Converted from /docs/groovy-midi-transfer/midi/midi-handler.js
 */

import { DrumVoice } from '../types';

type NoteOnCallback = (note: number, velocity: number, grooveVoice: DrumVoice | null, timestamp: number) => void;
type NoteOffCallback = (note: number, timestamp: number) => void;
type ControlChangeCallback = (controller: number, value: number, timestamp: number) => void;

class MIDIHandler {
  private onNoteOn: NoteOnCallback | null = null;
  private onNoteOff: NoteOffCallback | null = null;
  private onControlChange: ControlChangeCallback | null = null;

  /**
   * Process incoming MIDI message
   * @param event - MIDI message event
   */
  handleMessage(event: MIDIMessageEvent): void {
    if (!event.data || event.data.length < 3) return;

    const [status, note, velocity] = event.data;
    const cmd = status & 0xf0; // Extract command (high nibble)

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
  private handleNoteOn(note: number, velocity: number, timestamp: number): void {
    console.log('MIDI Note ON:', {
      note,
      velocity,
      timestamp,
    });

    if (this.onNoteOn) {
      // Note: grooveVoice mapping is done in the callback (from MIDIDrumMapping)
      this.onNoteOn(note, velocity, null, timestamp);
    }
  }

  /**
   * Handle note off event
   * @private
   */
  private handleNoteOff(note: number, timestamp: number): void {
    console.log('MIDI Note OFF:', note);

    if (this.onNoteOff) {
      this.onNoteOff(note, timestamp);
    }
  }

  /**
   * Handle control change event
   * @private
   */
  private handleControlChange(controller: number, value: number, timestamp: number): void {
    console.log('MIDI Control Change:', { controller, value });

    if (this.onControlChange) {
      this.onControlChange(controller, value, timestamp);
    }
  }

  /**
   * Set callback for note on events
   * @param callback - (note, velocity, grooveVoice, timestamp) => {}
   */
  setNoteOnHandler(callback: NoteOnCallback): void {
    this.onNoteOn = callback;
  }

  /**
   * Set callback for note off events
   * @param callback - (note, timestamp) => {}
   */
  setNoteOffHandler(callback: NoteOffCallback): void {
    this.onNoteOff = callback;
  }

  /**
   * Set callback for control change events
   * @param callback - (controller, value, timestamp) => {}
   */
  setControlChangeHandler(callback: ControlChangeCallback): void {
    this.onControlChange = callback;
  }
}

// Export singleton instance
export const midiHandler = new MIDIHandler();
