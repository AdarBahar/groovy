import { useEffect, useRef, useCallback, useMemo } from 'react';
import { GrooveData } from '../types';
import { encodeGrooveToURL, decodeURLToGroove, hasGrooveParams, validateURLLength, URLValidationResult } from '../core/GrooveURLCodec';

/**
 * Hook for syncing groove state with browser URL
 * 
 * Features:
 * - Loads groove from URL on initial mount (if URL has groove params)
 * - Updates URL on every groove change using history.replaceState
 * - Debounces URL updates to avoid excessive history entries
 */
export function useURLSync(
  groove: GrooveData,
  setGroove: (groove: GrooveData) => void,
  options: {
    /** Debounce delay in ms for URL updates (default: 300) */
    debounceMs?: number;
    /** Whether to update URL on groove changes (default: true) */
    syncToURL?: boolean;
    /** Whether to load from URL on mount (default: true) */
    loadFromURL?: boolean;
  } = {}
) {
  const { debounceMs = 300, syncToURL = true, loadFromURL = true } = options;

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoadRef = useRef(true);
  const lastEncodedURLRef = useRef<string>('');

  // Load groove from URL on initial mount
  useEffect(() => {
    if (!loadFromURL || !isInitialLoadRef.current) return;
    isInitialLoadRef.current = false;

    const searchParams = window.location.search;
    if (hasGrooveParams(searchParams)) {
      try {
        const grooveFromURL = decodeURLToGroove(searchParams);
        setGroove(grooveFromURL);
        // Store the encoded URL to avoid re-encoding on first sync
        lastEncodedURLRef.current = encodeGrooveToURL(grooveFromURL);
      } catch (error) {
        console.warn('Failed to load groove from URL:', error);
      }
    }
  }, [loadFromURL, setGroove]);

  // Sync groove to URL on changes (debounced)
  useEffect(() => {
    if (!syncToURL) return;
    
    // Skip initial render (handled by loadFromURL)
    if (isInitialLoadRef.current) return;

    // Clear any pending debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      const encoded = encodeGrooveToURL(groove);

      // Only update if URL actually changed
      if (encoded !== lastEncodedURLRef.current) {
        lastEncodedURLRef.current = encoded;
        // Use window.location.pathname (full path including base) not react-router location.pathname (route only)
        const newURL = `${window.location.pathname}?${encoded}`;
        window.history.replaceState({ groove: true }, '', newURL);

        // Update document title if groove has a title
        if (groove.title) {
          document.title = `${groove.title} - Groovy`;
        }
      }
    }, debounceMs);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [groove, syncToURL, debounceMs]);

  // Get shareable URL for current groove
  const getShareableURL = useCallback((): string => {
    const encoded = encodeGrooveToURL(groove);
    // Use window.location.pathname (full path including base)
    return `${window.location.origin}${window.location.pathname}?${encoded}`;
  }, [groove]);

  // Validate current URL length (memoized for performance)
  const urlValidation = useMemo((): URLValidationResult => {
    const url = getShareableURL();
    return validateURLLength(url);
  }, [getShareableURL]);

  // Copy URL to clipboard with validation result
  const copyURLToClipboard = useCallback(async (): Promise<{ success: boolean; validation: URLValidationResult }> => {
    const url = getShareableURL();
    const validation = validateURLLength(url);

    try {
      await navigator.clipboard.writeText(url);
      return { success: true, validation };
    } catch (error) {
      console.warn('Failed to copy URL to clipboard:', error);
      return { success: false, validation };
    }
  }, [getShareableURL]);

  return {
    getShareableURL,
    copyURLToClipboard,
    /** Current URL validation status - useful for showing warnings in UI */
    urlValidation,
  };
}

