/**
 * MIDIDrumMapping - MIDI Note to DrumVoice Mapping
 *
 * Provides bidirectional mapping between MIDI notes and Groovy's DrumVoice types.
 * Supports multiple drum kits with custom MIDI mappings.
 */

import { DrumVoice, DRUM_VOICE_CONFIG, DRUM_VOICE_TO_MIDI } from '../core/DrumVoiceConfig';
import { getDrumKitMappings, DEFAULT_DRUM_KIT } from './config/drumKits';

class MIDIDrumMapping {
  private midiToVoice: Map<number, DrumVoice>;
  private currentKit: string;

  constructor() {
    this.currentKit = DEFAULT_DRUM_KIT;
    this.midiToVoice = this.buildMIDIToVoiceMap();
  }

  /**
   * Set the active drum kit
   * @param kitName - Name of the drum kit from DRUM_KITS
   */
  setKit(kitName: string): void {
    this.currentKit = kitName;
    this.midiToVoice = this.buildMIDIToVoiceMap();
    console.log(`Switched to drum kit: ${kitName}`);
  }

  /**
   * Get the current active drum kit name
   */
  getCurrentKit(): string {
    return this.currentKit;
  }

  /**
   * Build MIDI mapping from the current drum kit
   *
   * @private
   */
  private buildMIDIToVoiceMap(): Map<number, DrumVoice> {
    const map = new Map<number, DrumVoice>();
    const kitMappings = getDrumKitMappings(this.currentKit);

    // Use drum kit mappings directly
    for (const [noteStr, voice] of Object.entries(kitMappings)) {
      const note = parseInt(noteStr, 10);
      map.set(note, voice as DrumVoice);
    }

    return map;
  }

  /**
   * Get DrumVoice from MIDI note number
   * @param note - MIDI note number (0-127)
   * @returns DrumVoice or null if not mapped
   */
  getVoiceFromNote(note: number): DrumVoice | null {
    return this.midiToVoice.get(note) || null;
  }

  /**
   * Get MIDI note number from DrumVoice
   * @param voice - DrumVoice identifier
   * @returns MIDI note number or null if not found
   */
  getNoteFromVoice(voice: DrumVoice): number | null {
    return DRUM_VOICE_TO_MIDI[voice] || null;
  }

  /**
   * Get display name for a MIDI note
   * @param note - MIDI note number
   * @returns Display name or null
   */
  getVoiceDisplayName(note: number): string | null {
    const voice = this.getVoiceFromNote(note);
    if (!voice) return null;
    return DRUM_VOICE_CONFIG[voice]?.name || null;
  }

  /**
   * Debug: Get all MIDI note to voice mappings
   * @returns Object mapping MIDI notes to voices
   */
  getAllMappings(): Record<number, DrumVoice> {
    const result: Record<number, DrumVoice> = {};
    for (const [note, voice] of this.midiToVoice.entries()) {
      result[note] = voice;
    }
    return result;
  }
}

// Export singleton instance
export const midiDrumMapping = new MIDIDrumMapping();
