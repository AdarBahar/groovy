import {
  Division,
  DivisionInfo,
  GrooveData,
  MeasureConfig,
  TimeSignature,
  DrumVoice,
  ALL_DRUM_VOICES,
  MAX_MEASURES,
  createEmptyNotesRecord,
} from '../types';

/**
 * Pure calculation functions for time signatures and divisions
 * No UI dependencies - can be used anywhere
 * 
 * Based on GrooveScribe specification:
 * - Time signatures: 2/4 to 15/16
 * - Divisions: 4, 8, 12, 16, 24, 32, 48
 * - Triplets (12, 24, 48) only work in x/4 time
 */
export class GrooveUtils {
  /**
   * Calculate notes per measure
   * Formula: (division / noteValue) * beats
   * 
   * Examples:
   * - 4/4 with 16ths: (16/4) * 4 = 16
   * - 6/8 with 8ths: (8/8) * 6 = 6
   * - 7/4 with 16ths: (16/4) * 7 = 28
   */
  static calcNotesPerMeasure(
    division: Division,
    beats: number,
    noteValue: 4 | 8 | 16
  ): number {
    return (division / noteValue) * beats;
  }

  /**
   * Check if division is triplet-based
   * Triplet divisions: 12 (8th triplets), 24 (16th triplets), 48 (32nd triplets)
   */
  static isTripletDivision(division: Division): boolean {
    return division === 12 || division === 24 || division === 48;
  }

  /**
   * Check if division supports swing
   * Swing is NOT supported for:
   * - Triplet divisions (already have triplet feel)
   * - Quarter notes (too coarse)
   */
  static doesDivisionSupportSwing(division: Division): boolean {
    if (this.isTripletDivision(division) || division === 4) {
      return false;
    }
    return true;
  }

  /**
   * Validate division compatibility with time signature
   * 
   * Rules:
   * 1. Must result in whole number of notes per measure
   * 2. Triplets only work in x/4 time signatures
   * 
   * Examples:
   * - 9/16 with 8ths: (8 * 9 / 16) = 4.5 ❌ (not whole number)
   * - 6/8 with 8th triplets: ❌ (triplets need x/4)
   * - 4/4 with 16ths: (16 * 4 / 4) = 16 ✅
   */
  static isDivisionCompatible(
    division: Division,
    beats: number,
    noteValue: 4 | 8 | 16
  ): boolean {
    // Check if result is whole number
    const notesPerMeasure = (division * beats) / noteValue;
    if (notesPerMeasure % 1 !== 0) {
      return false;
    }

    // Triplets only work in x/4 time
    if (this.isTripletDivision(division) && noteValue !== 4) {
      return false;
    }

    return true;
  }

  /**
   * Get all compatible divisions for a time signature
   */
  static getCompatibleDivisions(
    beats: number,
    noteValue: 4 | 8 | 16
  ): Division[] {
    const allDivisions: Division[] = [4, 8, 12, 16, 24, 32, 48];
    return allDivisions.filter(div =>
      this.isDivisionCompatible(div, beats, noteValue)
    );
  }

  /**
   * Get default division for a time signature
   * Tries 8 first (1/8 notes), falls back to first compatible
   */
  static getDefaultDivision(
    beats: number,
    noteValue: 4 | 8 | 16
  ): Division {
    // Try 8 first (1/8 notes - default)
    if (this.isDivisionCompatible(8, beats, noteValue)) {
      return 8;
    }
    // Fall back to first compatible division, or default to 8
    const compatible = this.getCompatibleDivisions(beats, noteValue);
    return compatible.length > 0 ? compatible[0] : 8;
  }

  /**
   * Get division info with metadata
   */
  static getDivisionInfo(
    division: Division,
    beats: number,
    noteValue: 4 | 8 | 16
  ): DivisionInfo {
    const labels: Record<Division, string> = {
      4: '1/4 Notes',
      8: '1/8 Notes',
      12: '1/8 Triplets',
      16: '1/16 Notes',
      24: '1/16 Triplets',
      32: '1/32 Notes',
      48: 'Mixed',
    };

    return {
      value: division,
      type: this.isTripletDivision(division) ? 'triplet' : 'straight',
      label: labels[division],
      notesPerMeasure: this.calcNotesPerMeasure(division, beats, noteValue),
      supportsSwing: this.doesDivisionSupportSwing(division),
    };
  }

  /**
   * Resize notes array when changing division or time signature
   * Preserves as many notes as possible by scaling positions
   *
   * Examples:
   * - 8 notes → 16 notes: Each note position doubles
   * - 16 notes → 8 notes: Every other note is kept
   * - 16 notes → 12 notes: Notes are scaled proportionally
   */
  static resizeNotesArray(
    oldNotes: boolean[],
    oldLength: number,
    newLength: number
  ): boolean[] {
    const newNotes = Array(newLength).fill(false);

    if (oldLength === newLength) {
      return [...oldNotes];
    }

    // Scale positions proportionally
    const scale = newLength / oldLength;

    for (let i = 0; i < oldNotes.length; i++) {
      if (oldNotes[i]) {
        const newPos = Math.round(i * scale);
        if (newPos < newNotes.length) {
          newNotes[newPos] = true;
        }
      }
    }

    return newNotes;
  }

  /**
   * Get positions per line for grid display
   * Determines how many note positions to show per row
   */
  static getPositionsPerLine(division: Division): number {
    if (division <= 8) return division;
    if (division <= 16) return 8;
    if (division <= 24) return 12;
    return 16; // For 32, 48
  }

  /**
   * Generate count label for a position
   * Returns labels like "1", "e", "&", "a", "2", etc.
   *
   * For 16th notes in 4/4:
   * - Position 0: "1"
   * - Position 1: "e"
   * - Position 2: "&"
   * - Position 3: "a"
   * - Position 4: "2"
   *
   * For triplets:
   * - Position 0: "1"
   * - Position 1: "trip"
   * - Position 2: "let"
   * - Position 3: "2"
   */
  static getCountLabel(
    position: number,
    division: Division,
    beats: number
  ): string {
    const notesPerBeat = division / beats;
    const beatNumber = Math.floor(position / notesPerBeat) + 1;
    const positionInBeat = position % notesPerBeat;

    // For triplets
    if (this.isTripletDivision(division)) {
      const tripletLabels = ['', 'trip', 'let'];
      if (positionInBeat === 0) {
        return beatNumber.toString();
      }
      return tripletLabels[positionInBeat] || '';
    }

    // For straight divisions
    if (notesPerBeat === 1) {
      // Quarter notes
      return beatNumber.toString();
    } else if (notesPerBeat === 2) {
      // 8th notes
      const labels = ['', '&'];
      if (positionInBeat === 0) {
        return beatNumber.toString();
      }
      return labels[positionInBeat] || '';
    } else if (notesPerBeat === 4) {
      // 16th notes
      const labels = ['', 'e', '&', 'a'];
      if (positionInBeat === 0) {
        return beatNumber.toString();
      }
      return labels[positionInBeat] || '';
    } else if (notesPerBeat === 8) {
      // 32nd notes: 1 e & a + e & a (standard drum notation)
      const labels = ['', 'e', '&', 'a', '+', 'e', '&', 'a'];
      if (positionInBeat === 0) {
        return beatNumber.toString();
      }
      return labels[positionInBeat] ?? '';
    }

    // Fallback
    return positionInBeat === 0 ? beatNumber.toString() : '';
  }

  // ============================================================
  // MEASURE MANIPULATION METHODS
  // ============================================================

  /**
   * Get the effective time signature for a measure
   * Uses measure override if present, otherwise falls back to global
   */
  static getMeasureTimeSignature(
    groove: GrooveData,
    measureIndex: number
  ): TimeSignature {
    const measure = groove.measures[measureIndex];
    return measure?.timeSignature || groove.timeSignature;
  }

  /**
   * Get notes per measure for a specific measure
   */
  static getNotesPerMeasureForIndex(
    groove: GrooveData,
    measureIndex: number
  ): number {
    const ts = this.getMeasureTimeSignature(groove, measureIndex);
    return this.calcNotesPerMeasure(groove.division, ts.beats, ts.noteValue);
  }

  /**
   * Get total positions across all measures
   */
  static getTotalPositions(groove: GrooveData): number {
    return groove.measures.reduce((total, _, index) => {
      return total + this.getNotesPerMeasureForIndex(groove, index);
    }, 0);
  }

  /**
   * Convert absolute position to measure index and position within measure
   */
  static absoluteToMeasurePosition(
    groove: GrooveData,
    absolutePosition: number
  ): { measureIndex: number; positionInMeasure: number } {
    let remaining = absolutePosition;
    for (let i = 0; i < groove.measures.length; i++) {
      const notesInMeasure = this.getNotesPerMeasureForIndex(groove, i);
      if (remaining < notesInMeasure) {
        return { measureIndex: i, positionInMeasure: remaining };
      }
      remaining -= notesInMeasure;
    }
    // Fallback to last measure
    const lastIndex = groove.measures.length - 1;
    return {
      measureIndex: lastIndex,
      positionInMeasure: remaining % this.getNotesPerMeasureForIndex(groove, lastIndex),
    };
  }

  /**
   * Convert measure position to absolute position
   */
  static measureToAbsolutePosition(
    groove: GrooveData,
    measureIndex: number,
    positionInMeasure: number
  ): number {
    let absolute = 0;
    for (let i = 0; i < measureIndex && i < groove.measures.length; i++) {
      absolute += this.getNotesPerMeasureForIndex(groove, i);
    }
    return absolute + positionInMeasure;
  }

  /**
   * Duplicate a measure at the given index
   * Returns new groove with duplicated measure inserted after the original
   */
  static duplicateMeasure(groove: GrooveData, measureIndex: number): GrooveData {
    if (groove.measures.length >= MAX_MEASURES) {
      console.warn(`Cannot duplicate: already at maximum ${MAX_MEASURES} measures`);
      return groove;
    }
    if (measureIndex < 0 || measureIndex >= groove.measures.length) {
      console.warn(`Invalid measure index: ${measureIndex}`);
      return groove;
    }

    const originalMeasure = groove.measures[measureIndex];
    const duplicatedMeasure: MeasureConfig = {
      timeSignature: originalMeasure.timeSignature
        ? { ...originalMeasure.timeSignature }
        : undefined,
      notes: {} as Record<DrumVoice, boolean[]>,
    };

    // Deep copy the notes
    for (const voice of ALL_DRUM_VOICES) {
      duplicatedMeasure.notes[voice] = [...(originalMeasure.notes[voice] || [])];
    }

    const newMeasures = [...groove.measures];
    newMeasures.splice(measureIndex + 1, 0, duplicatedMeasure);

    return { ...groove, measures: newMeasures };
  }

  /**
   * Add a blank measure after the given index
   * Uses global time signature by default, or optional override
   */
  static addBlankMeasure(
    groove: GrooveData,
    afterIndex: number,
    overrideTimeSignature?: TimeSignature
  ): GrooveData {
    if (groove.measures.length >= MAX_MEASURES) {
      console.warn(`Cannot add: already at maximum ${MAX_MEASURES} measures`);
      return groove;
    }

    const ts = overrideTimeSignature || groove.timeSignature;
    const notesPerMeasure = this.calcNotesPerMeasure(
      groove.division,
      ts.beats,
      ts.noteValue
    );

    const newMeasure: MeasureConfig = {
      timeSignature: overrideTimeSignature,
      notes: createEmptyNotesRecord(notesPerMeasure),
    };

    const insertIndex = Math.min(afterIndex + 1, groove.measures.length);
    const newMeasures = [...groove.measures];
    newMeasures.splice(insertIndex, 0, newMeasure);

    return { ...groove, measures: newMeasures };
  }

  /**
   * Remove a measure at the given index
   * Cannot remove if only one measure remains
   */
  static removeMeasure(groove: GrooveData, measureIndex: number): GrooveData {
    if (groove.measures.length <= 1) {
      console.warn('Cannot remove: at least one measure must remain');
      return groove;
    }
    if (measureIndex < 0 || measureIndex >= groove.measures.length) {
      console.warn(`Invalid measure index: ${measureIndex}`);
      return groove;
    }

    const newMeasures = groove.measures.filter((_, i) => i !== measureIndex);
    return { ...groove, measures: newMeasures };
  }

  /**
   * Clear all notes in a measure (keep structure)
   */
  static clearMeasure(groove: GrooveData, measureIndex: number): GrooveData {
    if (measureIndex < 0 || measureIndex >= groove.measures.length) {
      console.warn(`Invalid measure index: ${measureIndex}`);
      return groove;
    }

    const measure = groove.measures[measureIndex];
    // Use first drum voice to determine notes length, with safe fallback
    const firstVoice = ALL_DRUM_VOICES[0];
    const notesLength = firstVoice ? (measure.notes[firstVoice]?.length ?? 16) : 16;

    const clearedMeasure: MeasureConfig = {
      timeSignature: measure.timeSignature,
      notes: createEmptyNotesRecord(notesLength),
    };

    const newMeasures = [...groove.measures];
    newMeasures[measureIndex] = clearedMeasure;

    return { ...groove, measures: newMeasures };
  }

  /**
   * Update time signature for a specific measure
   * Resizes notes arrays if needed
   */
  static updateMeasureTimeSignature(
    groove: GrooveData,
    measureIndex: number,
    newTimeSignature: TimeSignature | undefined
  ): GrooveData {
    if (measureIndex < 0 || measureIndex >= groove.measures.length) {
      console.warn(`Invalid measure index: ${measureIndex}`);
      return groove;
    }

    const measure = groove.measures[measureIndex];
    const oldTs = measure.timeSignature || groove.timeSignature;
    const newTs = newTimeSignature || groove.timeSignature;

    const oldLength = this.calcNotesPerMeasure(groove.division, oldTs.beats, oldTs.noteValue);
    const newLength = this.calcNotesPerMeasure(groove.division, newTs.beats, newTs.noteValue);

    const newNotes: Record<DrumVoice, boolean[]> = {} as Record<DrumVoice, boolean[]>;
    for (const voice of ALL_DRUM_VOICES) {
      newNotes[voice] = this.resizeNotesArray(
        measure.notes[voice] || [],
        oldLength,
        newLength
      );
    }

    const updatedMeasure: MeasureConfig = {
      timeSignature: newTimeSignature,
      notes: newNotes,
    };

    const newMeasures = [...groove.measures];
    newMeasures[measureIndex] = updatedMeasure;

    return { ...groove, measures: newMeasures };
  }
}

