/**
 * useGrooveLibrary Hook
 * 
 * Provides access to the built-in groove library.
 * Library grooves are read-only and can be duplicated to My Groovies for editing.
 */

import { useMemo } from 'react';
import { GrooveData } from '../types';
import { decodeURLToGroove } from '../core';
import libraryData from '../data/libraryGrooves.json';

/**
 * A groove from the built-in library
 */
export interface LibraryGroove {
  /** Groove display name */
  name: string;
  /** URL-encoded groove data (query string format) */
  url: string;
  /** Parent style/category ID */
  styleId: string;
  /** Parent style/category name */
  styleName: string;
}

/**
 * A style/category containing grooves
 */
export interface LibraryStyle {
  /** Style identifier */
  id: string;
  /** Display name */
  name: string;
  /** Grooves in this style */
  grooves: LibraryGroove[];
}

interface UseGrooveLibraryReturn {
  /** All styles with their grooves */
  styles: LibraryStyle[];
  /** Get all grooves across all styles */
  getAllGrooves: () => LibraryGroove[];
  /** Get grooves for a specific style */
  getGroovesByStyle: (styleId: string) => LibraryGroove[];
  /** Decode a library groove URL to GrooveData */
  decodeGroove: (groove: LibraryGroove) => GrooveData;
  /** Get a specific groove by style and name */
  findGroove: (styleId: string, name: string) => LibraryGroove | undefined;
}

/**
 * Hook for accessing the built-in groove library
 */
export function useGrooveLibrary(): UseGrooveLibraryReturn {
  // Parse and memoize the library data
  const styles = useMemo<LibraryStyle[]>(() => {
    return libraryData.styles.map(style => ({
      id: style.id,
      name: style.name,
      grooves: style.grooves.map(groove => ({
        name: groove.name,
        url: groove.url,
        styleId: style.id,
        styleName: style.name,
      })),
    }));
  }, []);

  // Get all grooves flattened
  const getAllGrooves = useMemo(() => {
    return () => styles.flatMap(style => style.grooves);
  }, [styles]);

  // Get grooves by style
  const getGroovesByStyle = useMemo(() => {
    return (styleId: string) => {
      const style = styles.find(s => s.id === styleId);
      return style?.grooves ?? [];
    };
  }, [styles]);

  // Decode a library groove to GrooveData
  const decodeGroove = useMemo(() => {
    return (groove: LibraryGroove): GrooveData => {
      // The URL is just the query string, add ? prefix for parsing
      return decodeURLToGroove('?' + groove.url);
    };
  }, []);

  // Find a specific groove
  const findGroove = useMemo(() => {
    return (styleId: string, name: string): LibraryGroove | undefined => {
      const style = styles.find(s => s.id === styleId);
      return style?.grooves.find(g => g.name === name);
    };
  }, [styles]);

  return {
    styles,
    getAllGrooves,
    getGroovesByStyle,
    decodeGroove,
    findGroove,
  };
}

