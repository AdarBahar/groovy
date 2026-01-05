import { Division, DivisionInfo } from '../types';

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
   * Tries 16 first (most common), falls back to first compatible
   */
  static getDefaultDivision(
    beats: number,
    noteValue: 4 | 8 | 16
  ): Division {
    // Try 16 first (most common)
    if (this.isDivisionCompatible(16, beats, noteValue)) {
      return 16;
    }
    // Fall back to first compatible
    const compatible = this.getCompatibleDivisions(beats, noteValue);
    return compatible[0] || 16;
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
      // 32nd notes
      const labels = ['', 'e', '&', 'a', 'e', '&', 'a', ''];
      if (positionInBeat === 0) {
        return beatNumber.toString();
      }
      return labels[positionInBeat] || '';
    }

    // Fallback
    return positionInBeat === 0 ? beatNumber.toString() : '';
  }
}

