// drum-mapping.js - Drum Mapping Utilities

import { DRUM_KITS, DEFAULT_KIT } from '../config/drum-kits.js';

class DrumMapping {
  constructor() {
    this.currentKit = DEFAULT_KIT;
  }

  /**
   * Set the active drum kit
   * @param {string} kitName - Name of the kit from DRUM_KITS
   */
  setKit(kitName) {
    if (!DRUM_KITS[kitName]) {
      console.warn(`Unknown drum kit: ${kitName}. Using default.`);
      this.currentKit = DEFAULT_KIT;
    } else {
      this.currentKit = kitName;
      console.log(`Active drum kit: ${kitName}`);
    }
  }

  /**
   * Get current kit configuration
   * @private
   */
  getKit() {
    return DRUM_KITS[this.currentKit];
  }

  /**
   * Convert MIDI note number to drum name
   * @param {number} note - MIDI note number (0-127)
   * @returns {string|null} Drum name or null if unknown
   */
  getDrumName(note) {
    const kit = this.getKit();
    return kit.midiMap[note] || null;
  }

  /**
   * Convert drum name to Groovy voice identifier
   * @param {string} drumName - Drum name (e.g., "Snare Head")
   * @returns {string|null} Groovy voice (H/S/K/T1-T4/C/R) or null
   */
  getGrooveVoice(drumName) {
    const kit = this.getKit();
    return kit.voiceMap[drumName] || null;
  }

  /**
   * Convert MIDI note directly to Groovy voice
   * @param {number} note - MIDI note number
   * @returns {string|null} Groovy voice or null
   */
  getNoteToVoice(note) {
    const drumName = this.getDrumName(note);
    if (!drumName) return null;
    return this.getGrooveVoice(drumName);
  }

  /**
   * Get all voices used by current kit
   * @returns {Array<string>} Array of voice identifiers
   */
  getAllVoices() {
    const kit = this.getKit();
    const voices = new Set();

    Object.values(kit.voiceMap).forEach(voice => {
      if (voice) voices.add(voice);
    });

    return Array.from(voices).sort();
  }
}

// Export singleton instance
const drumMapping = new DrumMapping();

// Export utility functions for convenience
export const setDrumKit = (kitName) => drumMapping.setKit(kitName);
export const getDrumNameFromNote = (note) => drumMapping.getDrumName(note);
export const getGrooveVoiceFromDrumName = (drumName) => drumMapping.getGrooveVoice(drumName);
export const getGrooveVoiceFromNote = (note) => drumMapping.getNoteToVoice(note);
export const getAllVoices = () => drumMapping.getAllVoices();

export default drumMapping;
