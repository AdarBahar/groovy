/**
 * Articulation metadata configuration
 * Maps each DrumVoice to its visual representation and metadata
 */

import { DrumVoice } from '../types';

export type InstrumentCategory = 'hihat' | 'snare' | 'kick' | 'tom' | 'cymbal' | 'percussion';

export interface ArticulationMeta {
  voice: DrumVoice;
  label: string;
  icon?: string; // FontAwesome class (e.g., 'fa-plus') or emoji
  shortcut?: string;
  category: InstrumentCategory;
  description?: string;
}

/**
 * Complete articulation metadata for all drum voices
 * Based on GrooveScribe legacy implementation
 */
export const ARTICULATION_CONFIG: Record<DrumVoice, ArticulationMeta> = {
  // Hi-Hat variations
  'hihat-closed': {
    voice: 'hihat-closed',
    label: 'Closed',
    icon: 'fa-plus',
    shortcut: '1',
    category: 'hihat',
    description: 'Closed hi-hat',
  },
  'hihat-open': {
    voice: 'hihat-open',
    label: 'Open',
    icon: 'fa-circle-o',
    shortcut: '2',
    category: 'hihat',
    description: 'Open hi-hat',
  },
  'hihat-accent': {
    voice: 'hihat-accent',
    label: 'Accent',
    icon: 'fa-angle-right',
    shortcut: '3',
    category: 'hihat',
    description: 'Accented hi-hat',
  },
  'hihat-foot': {
    voice: 'hihat-foot',
    label: 'Foot',
    icon: 'fa-times',
    shortcut: '2',
    category: 'hihat',
    description: 'Hi-hat foot splash',
  },
  'hihat-metronome-normal': {
    voice: 'hihat-metronome-normal',
    label: 'Metronome',
    icon: 'fa-neuter',
    shortcut: '9',
    category: 'hihat',
    description: 'Metronome click (normal)',
  },
  'hihat-metronome-accent': {
    voice: 'hihat-metronome-accent',
    label: 'Metronome Accent',
    icon: 'fa-map-pin',
    shortcut: '0',
    category: 'hihat',
    description: 'Metronome click (accented)',
  },
  'hihat-cross': {
    voice: 'hihat-cross',
    label: 'Cross',
    icon: 'fa-times',
    category: 'hihat',
    description: 'Cross hi-hat',
  },

  // Snare variations
  'snare-normal': {
    voice: 'snare-normal',
    label: 'Normal',
    icon: '●', // Circle
    shortcut: '1',
    category: 'snare',
    description: 'Normal snare hit',
  },
  'snare-accent': {
    voice: 'snare-accent',
    label: 'Accent',
    icon: 'fa-chevron-right',
    shortcut: '2',
    category: 'snare',
    description: 'Accented snare',
  },
  'snare-ghost': {
    voice: 'snare-ghost',
    label: 'Ghost Note',
    icon: 'fa-circle',
    shortcut: '3',
    category: 'snare',
    description: 'Ghost note (soft)',
  },
  'snare-cross-stick': {
    voice: 'snare-cross-stick',
    label: 'Cross Stick',
    icon: 'fa-times',
    shortcut: '4',
    category: 'snare',
    description: 'Cross-stick (side-stick)',
  },
  'snare-flam': {
    voice: 'snare-flam',
    label: 'Flam',
    icon: 'fa-angle-double-left',
    shortcut: '5',
    category: 'snare',
    description: 'Flam',
  },
  'snare-rim': {
    voice: 'snare-rim',
    label: 'Rimshot',
    icon: 'fa-circle',
    shortcut: '6',
    category: 'snare',
    description: 'Rimshot',
  },
  'snare-drag': {
    voice: 'snare-drag',
    label: 'Drag',
    icon: 'fa-ellipsis-h',
    shortcut: '7',
    category: 'snare',
    description: 'Drag/ruff',
  },
  'snare-buzz': {
    voice: 'snare-buzz',
    label: 'Buzz',
    icon: 'fa-bars',
    shortcut: '8',
    category: 'snare',
    description: 'Buzz roll',
  },

  // Kick
  'kick': {
    voice: 'kick',
    label: 'Kick',
    icon: '●', // Filled circle
    shortcut: '1',
    category: 'kick',
    description: 'Bass drum',
  },

  // Toms
  'tom-rack': {
    voice: 'tom-rack',
    label: 'Rack Tom',
    icon: '●',
    category: 'tom',
    description: 'Rack tom',
  },
  'tom-floor': {
    voice: 'tom-floor',
    label: 'Floor Tom',
    icon: '●',
    category: 'tom',
    description: 'Floor tom',
  },
  'tom-10': {
    voice: 'tom-10',
    label: 'Tom 1',
    icon: '●',
    category: 'tom',
    description: 'Tom 1 (10")',
  },
  'tom-16': {
    voice: 'tom-16',
    label: 'Tom 2',
    icon: '●',
    category: 'tom',
    description: 'Tom 2 (16")',
  },

  // Cymbals
  'crash': {
    voice: 'crash',
    label: 'Crash',
    icon: 'fa-asterisk',
    shortcut: '4',
    category: 'cymbal',
    description: 'Crash cymbal',
  },
  'ride': {
    voice: 'ride',
    label: 'Ride',
    icon: 'fa-dot-circle-o',
    shortcut: '5',
    category: 'cymbal',
    description: 'Ride cymbal',
  },
  'ride-bell': {
    voice: 'ride-bell',
    label: 'Ride Bell',
    icon: 'fa-bell-o',
    shortcut: '6',
    category: 'cymbal',
    description: 'Ride bell',
  },

  // Percussion
  'cowbell': {
    voice: 'cowbell',
    label: 'Cowbell',
    icon: 'fa-plus-square-o',
    shortcut: '7',
    category: 'percussion',
    description: 'Cowbell',
  },
  'stacker': {
    voice: 'stacker',
    label: 'Stacker',
    icon: 'fa-bars',
    shortcut: '8',
    category: 'percussion',
    description: 'Stacker cymbal',
  },
};

/**
 * Get articulation metadata by voice
 */
export function getArticulationMeta(voice: DrumVoice): ArticulationMeta {
  return ARTICULATION_CONFIG[voice];
}

/**
 * Get all articulations for a specific category
 */
export function getArticulationsByCategory(category: InstrumentCategory): ArticulationMeta[] {
  return Object.values(ARTICULATION_CONFIG).filter(meta => meta.category === category);
}

