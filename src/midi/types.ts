/**
 * MIDI Module Type Definitions
 *
 * Defines all TypeScript interfaces for the MIDI subsystem.
 */

import { DrumVoice } from '../types';

/**
 * MIDI device information
 */
export interface MIDIDeviceInfo {
  id: string;
  name: string;
  manufacturer?: string;
  state: 'connected' | 'disconnected';
}

/**
 * MIDI note event data
 */
export interface MIDINoteEvent {
  note: number; // 0-127
  velocity: number; // 0-127
  grooveVoice: DrumVoice | null; // e.g., 'snare-normal'
  timestamp: number;
}

/**
 * MIDI Control Change event
 */
export interface MIDIControlChangeEvent {
  controller: number; // CC number (0-127)
  value: number; // 0-127
  timestamp: number;
}

/**
 * MIDI configuration (persisted to localStorage)
 */
export interface MIDIConfig {
  enabled: boolean;
  selectedDeviceId: string | null;
  selectedKitName: string;
  throughEnabled: boolean; // Play sounds when hitting MIDI device
  performanceTrackingEnabled?: boolean;
}

/**
 * Drum kit mapping definition
 */
export interface DrumKitMapping {
  name: string;
  midiToVoice: Map<number, DrumVoice>;
}

/**
 * Default MIDI configuration
 */
export const DEFAULT_MIDI_CONFIG: MIDIConfig = {
  enabled: false,
  selectedDeviceId: null,
  selectedKitName: 'TD-17',
  throughEnabled: true,
  performanceTrackingEnabled: false,
};
