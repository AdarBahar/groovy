/**
 * Bulk pattern operations for drum grid
 * Defines common patterns that can be applied to entire rows/measures
 */

import { DrumVoice } from '../types';

export interface BulkPattern {
  id: string;
  label: string;
  description: string;
  voices: DrumVoice[];
  pattern: (position: number, notesPerMeasure: number) => boolean;
}

/**
 * Calculate if a position is a downbeat (1, 2, 3, 4)
 */
const isDownbeat = (position: number, notesPerMeasure: number, beats: number): boolean => {
  const notesPerBeat = notesPerMeasure / beats;
  return position % notesPerBeat === 0;
};

/**
 * Calculate if a position is an upbeat (e, &, a)
 */
const isUpbeat = (position: number, notesPerMeasure: number, beats: number): boolean => {
  return !isDownbeat(position, notesPerMeasure, beats);
};

/**
 * Calculate if a position is on the "&" (and) of a beat
 */
const isAnd = (position: number, notesPerMeasure: number, beats: number): boolean => {
  const notesPerBeat = notesPerMeasure / beats;
  const positionInBeat = position % notesPerBeat;
  return positionInBeat === notesPerBeat / 2;
};

/**
 * Calculate if a position is on an eighth note (1, &, 2, &, 3, &, 4, &)
 */
const isEighthNote = (position: number, notesPerMeasure: number, beats: number): boolean => {
  const notesPerBeat = notesPerMeasure / beats;
  const positionInBeat = position % notesPerBeat;
  return positionInBeat === 0 || positionInBeat === notesPerBeat / 2;
};

/**
 * Hi-Hat bulk patterns
 */
export const HI_HAT_PATTERNS: BulkPattern[] = [
  {
    id: 'hihat-all-on',
    label: 'All On',
    description: 'Turn on all positions',
    voices: ['hihat-closed'],
    pattern: () => true,
  },
  {
    id: 'hihat-upbeats',
    label: 'Upbeats Only',
    description: 'Only e, &, a positions',
    voices: ['hihat-closed'],
    pattern: (pos, npm) => isUpbeat(pos, npm, 4),
  },
  {
    id: 'hihat-downbeats',
    label: 'Downbeats Only',
    description: 'Only 1, 2, 3, 4',
    voices: ['hihat-closed'],
    pattern: (pos, npm) => isDownbeat(pos, npm, 4),
  },
  {
    id: 'hihat-eighths',
    label: 'Eighth Notes',
    description: '1, &, 2, &, 3, &, 4, &',
    voices: ['hihat-closed'],
    pattern: (pos, npm) => isEighthNote(pos, npm, 4),
  },
  {
    id: 'hihat-clear',
    label: 'Clear All',
    description: 'Turn off all positions',
    voices: [],
    pattern: () => false,
  },
];

/**
 * Snare bulk patterns
 */
export const SNARE_PATTERNS: BulkPattern[] = [
  {
    id: 'snare-all-on',
    label: 'All On (Normal)',
    description: 'Turn on all positions with normal snare',
    voices: ['snare-normal'],
    pattern: () => true,
  },
  {
    id: 'snare-backbeat',
    label: 'Backbeat (2 & 4)',
    description: 'Snare on beats 2 and 4',
    voices: ['snare-normal'],
    pattern: (pos, npm) => {
      const notesPerBeat = npm / 4;
      const beat = Math.floor(pos / notesPerBeat);
      const positionInBeat = pos % notesPerBeat;
      return positionInBeat === 0 && (beat === 1 || beat === 3); // beats 2 and 4 (0-indexed)
    },
  },
  {
    id: 'snare-all-ghost',
    label: 'All Ghost Notes',
    description: 'Turn on all positions with ghost notes',
    voices: ['snare-ghost'],
    pattern: () => true,
  },
  {
    id: 'snare-all-accent',
    label: 'All Accents',
    description: 'Turn on all positions with accents',
    voices: ['snare-accent'],
    pattern: () => true,
  },
  {
    id: 'snare-clear',
    label: 'Clear All',
    description: 'Turn off all positions',
    voices: [],
    pattern: () => false,
  },
];

/**
 * Kick bulk patterns
 */
export const KICK_PATTERNS: BulkPattern[] = [
  {
    id: 'kick-all-on',
    label: 'All On',
    description: 'Turn on all positions',
    voices: ['kick'],
    pattern: () => true,
  },
  {
    id: 'kick-four-floor',
    label: 'Four on the Floor',
    description: 'Kick on every beat (1, 2, 3, 4)',
    voices: ['kick'],
    pattern: (pos, npm) => isDownbeat(pos, npm, 4),
  },
  {
    id: 'kick-foot-beats',
    label: 'Foot on Beats',
    description: 'Hi-hat foot on 1, 2, 3, 4',
    voices: ['hihat-foot'],
    pattern: (pos, npm) => isDownbeat(pos, npm, 4),
  },
  {
    id: 'kick-foot-ands',
    label: 'Foot on "&"s',
    description: 'Hi-hat foot on &',
    voices: ['hihat-foot'],
    pattern: (pos, npm) => isAnd(pos, npm, 4),
  },
  {
    id: 'kick-clear',
    label: 'Clear All',
    description: 'Turn off all positions',
    voices: [],
    pattern: () => false,
  },
];

