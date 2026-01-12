/**
 * useMyGrooves Hook
 * 
 * React hook for managing saved grooves with localStorage persistence.
 * Provides state management and actions for My Grooves feature.
 */

import { useState, useCallback, useEffect } from 'react';
import { GrooveData } from '../types';
import {
  SavedGroove,
  SaveResult,
  loadAllGrooves,
  saveGroove as coreSaveGroove,
  deleteGroove as coreDeleteGroove,
  decodeGroove,
  grooveNameExists,
} from '../core';

interface UseMyGroovesReturn {
  /** List of all saved grooves */
  grooves: SavedGroove[];
  /** Whether grooves are loading */
  isLoading: boolean;
  /** Error message if any */
  error: string | null;
  /** Save current groove with given name */
  saveGroove: (groove: GrooveData, name: string, existingId?: string) => SaveResult;
  /** Delete a saved groove by ID */
  deleteGroove: (id: string) => boolean;
  /** Decode a saved groove to GrooveData */
  getGrooveData: (saved: SavedGroove) => GrooveData;
  /** Check if a name already exists */
  nameExists: (name: string) => boolean;
  /** Find existing groove by name */
  findByName: (name: string) => SavedGroove | undefined;
  /** Refresh the grooves list from storage */
  refresh: () => void;
}

/**
 * Hook for managing My Grooves (saved grooves in localStorage)
 */
export function useMyGrooves(): UseMyGroovesReturn {
  const [grooves, setGrooves] = useState<SavedGroove[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load grooves on mount
  const refresh = useCallback(() => {
    setIsLoading(true);
    setError(null);
    try {
      const loaded = loadAllGrooves();
      setGrooves(loaded);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load grooves');
      setGrooves([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Save groove
  const saveGroove = useCallback((
    groove: GrooveData,
    name: string,
    existingId?: string
  ): SaveResult => {
    const result = coreSaveGroove(groove, name, existingId);
    if (result.success) {
      refresh(); // Reload list after save
    }
    return result;
  }, [refresh]);

  // Delete groove
  const deleteGroove = useCallback((id: string): boolean => {
    const success = coreDeleteGroove(id);
    if (success) {
      refresh(); // Reload list after delete
    }
    return success;
  }, [refresh]);

  // Decode saved groove to GrooveData
  const getGrooveData = useCallback((saved: SavedGroove): GrooveData => {
    return decodeGroove(saved);
  }, []);

  // Check if name exists
  const nameExists = useCallback((name: string): boolean => {
    return grooveNameExists(name);
  }, []);

  // Find groove by name
  const findByName = useCallback((name: string): SavedGroove | undefined => {
    return grooves.find(g => g.name.toLowerCase() === name.toLowerCase());
  }, [grooves]);

  return {
    grooves,
    isLoading,
    error,
    saveGroove,
    deleteGroove,
    getGrooveData,
    nameExists,
    findByName,
    refresh,
  };
}

