/**
 * GrooveStorage
 * 
 * Manages saved grooves in localStorage with CRUD operations.
 * Framework-agnostic core storage logic.
 */

import { GrooveData } from '../types';
import { encodeGrooveToURL, decodeURLToGroove } from './GrooveURLCodec';
import { logger } from '../utils/logger';
import { safeStorage } from '../utils/safeStorage';

const STORAGE_KEY = 'groovy-my-grooves';

/**
 * Saved groove metadata stored in localStorage
 */
export interface SavedGroove {
  id: string;
  name: string;
  url: string;  // Full URL-encoded groove state
  createdAt: number;
  modifiedAt: number;
  // Cached metadata for display (derived from groove)
  tempo: number;
  timeSignature: string;
  measureCount: number;
}

/**
 * Result of a save operation
 */
export interface SaveResult {
  success: boolean;
  groove?: SavedGroove;
  error?: string;
}

/**
 * Check if a groove name already exists
 */
export function grooveNameExists(name: string): boolean {
  const grooves = loadAllGrooves();
  return grooves.some(g => g.name.toLowerCase() === name.toLowerCase());
}

/**
 * Generate a unique ID for a new groove
 */
function generateId(): string {
  return `groove-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Save a groove to localStorage
 * @param groove The groove data to save
 * @param name Display name for the groove
 * @param existingId If provided, updates existing groove instead of creating new
 */
export function saveGroove(
  groove: GrooveData,
  name: string,
  existingId?: string
): SaveResult {
  try {
    const grooves = loadAllGrooves();
    const now = Date.now();
    const url = encodeGrooveToURL(groove);
    
    const savedGroove: SavedGroove = {
      id: existingId || generateId(),
      name: name.trim() || 'Untitled Groove',
      url,
      createdAt: existingId 
        ? (grooves.find(g => g.id === existingId)?.createdAt || now)
        : now,
      modifiedAt: now,
      tempo: groove.tempo,
      timeSignature: `${groove.timeSignature.beats}/${groove.timeSignature.noteValue}`,
      measureCount: groove.measures?.length || 1,
    };

    if (existingId) {
      // Update existing
      const index = grooves.findIndex(g => g.id === existingId);
      if (index >= 0) {
        grooves[index] = savedGroove;
      } else {
        grooves.push(savedGroove);
      }
    } else {
      // Add new
      grooves.push(savedGroove);
    }

    const result = safeStorage.setItem(STORAGE_KEY, JSON.stringify(grooves));
    if (!result.success) {
      if (result.quotaExceeded) {
        // Attempt cleanup and retry once
        logger.warn('Storage quota exceeded, attempting cleanup...');
        safeStorage.cleanup('groove-');
        const retryResult = safeStorage.setItem(STORAGE_KEY, JSON.stringify(grooves));
        if (!retryResult.success) {
          return {
            success: false,
            error: 'Storage full. Please delete some saved grooves to make space.',
          };
        }
      } else {
        return {
          success: false,
          error: result.error || 'Failed to save groove',
        };
      }
    }
    return { success: true, groove: savedGroove };
  } catch (error) {
    logger.error('Failed to save groove:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save groove'
    };
  }
}

/**
 * Load all saved grooves from localStorage
 */
export function loadAllGrooves(): SavedGroove[] {
  try {
    const data = safeStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) {
      logger.warn('Invalid grooves data format, resetting');
      return [];
    }
    
    // Sort by most recently modified first
    return parsed.sort((a, b) => b.modifiedAt - a.modifiedAt);
  } catch (error) {
    logger.error('Failed to load grooves:', error);
    return [];
  }
}

/**
 * Load a specific groove by ID
 */
export function loadGrooveById(id: string): SavedGroove | null {
  const grooves = loadAllGrooves();
  return grooves.find(g => g.id === id) || null;
}

/**
 * Decode a saved groove's URL back to GrooveData
 */
export function decodeGroove(saved: SavedGroove): GrooveData {
  return decodeURLToGroove(saved.url);
}

/**
 * Delete a groove by ID
 */
export function deleteGroove(id: string): boolean {
  try {
    const grooves = loadAllGrooves().filter(g => g.id !== id);
    const result = safeStorage.setItem(STORAGE_KEY, JSON.stringify(grooves));
    return result.success;
  } catch (error) {
    logger.error('Failed to delete groove:', error);
    return false;
  }
}

/**
 * Clear all saved grooves
 */
export function clearAllGrooves(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Export all grooves as JSON string (for backup)
 */
export function exportGrooves(): string {
  return JSON.stringify(loadAllGrooves(), null, 2);
}

