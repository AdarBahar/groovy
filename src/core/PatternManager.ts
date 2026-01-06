import { BulkPattern } from './BulkPatterns';

const STORAGE_KEY = 'groovy-custom-patterns';

export interface CustomPattern extends BulkPattern {
  category: 'hihat' | 'snare' | 'kick' | 'tom';
  createdAt: number;
}

/**
 * Manages custom bulk patterns with localStorage persistence
 */
export class PatternManager {
  /**
   * Save a custom pattern
   */
  static savePattern(pattern: CustomPattern): void {
    const patterns = this.loadPatterns();
    patterns.push(pattern);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patterns));
  }

  /**
   * Load all custom patterns
   */
  static loadPatterns(): CustomPattern[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load custom patterns:', error);
      return [];
    }
  }

  /**
   * Load patterns for a specific category
   */
  static loadPatternsByCategory(category: 'hihat' | 'snare' | 'kick' | 'tom'): CustomPattern[] {
    return this.loadPatterns().filter(p => p.category === category);
  }

  /**
   * Delete a custom pattern by ID
   */
  static deletePattern(id: string): void {
    const patterns = this.loadPatterns().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(patterns));
  }

  /**
   * Clear all custom patterns
   */
  static clearAllPatterns(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * Export patterns as JSON
   */
  static exportPatterns(): string {
    return JSON.stringify(this.loadPatterns(), null, 2);
  }

  /**
   * Import patterns from JSON
   */
  static importPatterns(json: string): boolean {
    try {
      const patterns = JSON.parse(json);
      if (!Array.isArray(patterns)) {
        throw new Error('Invalid format: expected array');
      }
      
      // Validate each pattern
      patterns.forEach(p => {
        if (!p.id || !p.label || !p.category || typeof p.pattern !== 'function') {
          throw new Error('Invalid pattern format');
        }
      });

      localStorage.setItem(STORAGE_KEY, json);
      return true;
    } catch (error) {
      console.error('Failed to import patterns:', error);
      return false;
    }
  }
}

