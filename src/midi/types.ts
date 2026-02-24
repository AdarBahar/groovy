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
 * Velocity threshold configuration per drum pad
 */
export interface VelocityThresholdConfig {
  [note: number]: number; // MIDI note -> minimum velocity to accept (1-127)
}

/**
 * Double-trigger suppression (refractory) window per pad in milliseconds
 */
export interface DoubleTriggerConfig {
  [note: number]: number; // MIDI note -> refractory window in ms
}

/**
 * Latency compensation configuration
 */
export interface LatencyCompensationConfig {
  enabled: boolean;
  offsetMs: number; // Measured latency to subtract from all hits (ms)
  calibrationDate?: string; // When this was last calibrated
  calibrationDevice?: string; // Device ID it was calibrated on
}

/**
 * MIDI event filtering configuration
 */
export interface MIDIEventFiltering {
  velocityThresholds?: VelocityThresholdConfig; // Per-pad minimum velocity
  doubleTriggerWindows?: DoubleTriggerConfig; // Per-pad refractory window (ms)
  latencyCompensation?: LatencyCompensationConfig; // Global latency offset
}

/**
 * Extended MIDI configuration with filtering
 */
export interface MIDIConfig extends MIDIEventFiltering {
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
  velocityThresholds: {}, // Empty = use global defaults
  doubleTriggerWindows: {}, // Empty = use global defaults
  latencyCompensation: {
    enabled: true,
    offsetMs: 950, // Compensates for system audio latency (~950ms total)
  },
};

/**
 * Global default velocity thresholds (used when device config not available)
 * These are conservative estimates - actual values should be calibrated per device
 */
export const DEFAULT_VELOCITY_THRESHOLDS: VelocityThresholdConfig = {
  // Kick drum - stable
  36: 3,
  // Snare - snappy, needs moderate velocity
  38: 4,
  // Hi-hat pedal
  42: 3,
  // Hi-hat stick
  46: 3,
  // Tom-high
  50: 3,
  // Tom-mid
  45: 3,
  // Tom-low
  41: 3,
  // Crash 1
  49: 2,
  // Crash 2
  57: 2,
  // Ride
  51: 2,
};

/**
 * Global default double-trigger suppression windows (ms)
 * Prevent near-duplicate hits from being counted twice
 */
export const DEFAULT_DOUBLE_TRIGGER_WINDOWS: DoubleTriggerConfig = {
  // Kick - low frequency, needs longer window
  36: 20,
  // Snare - tight for rolls
  38: 15,
  // Hi-hat pedal - tight for swing patterns
  42: 12,
  // Hi-hat stick
  46: 15,
  // Toms - moderate
  50: 12,
  45: 12,
  41: 12,
  // Cymbals - wider window for sustain artifacts
  49: 35,
  57: 35,
  // Ride - similar to crash
  51: 30,
};
