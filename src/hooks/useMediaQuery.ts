import { useState, useEffect, useCallback } from 'react';

/**
 * Breakpoint definitions matching Tailwind CSS defaults
 * - sm: 640px (small mobile)
 * - md: 768px (tablet) - PRIMARY
 * - lg: 1024px (desktop) - PRIMARY
 * - xl: 1280px (large desktop)
 */
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * Hook to detect if a media query matches
 * @param query - CSS media query string
 * @returns boolean indicating if the query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    setMatches(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
    // Legacy browsers (Safari < 14)
    mediaQuery.addListener(handler);
    return () => mediaQuery.removeListener(handler);
  }, [query]);

  return matches;
}

/**
 * Hook providing responsive breakpoint information
 * Uses mobile-first approach matching Tailwind CSS
 */
export function useResponsive() {
  const isMobile = !useMediaQuery(`(min-width: ${BREAKPOINTS.md}px)`);
  const isTablet = useMediaQuery(`(min-width: ${BREAKPOINTS.md}px)`) &&
                   !useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`);
  const isDesktop = useMediaQuery(`(min-width: ${BREAKPOINTS.lg}px)`);
  const isLargeDesktop = useMediaQuery(`(min-width: ${BREAKPOINTS.xl}px)`);

  // Touch device detection
  const isTouchDevice = useMediaQuery('(hover: none) and (pointer: coarse)');

  // Orientation detection
  const isLandscape = useMediaQuery('(orientation: landscape)');
  const isPortrait = useMediaQuery('(orientation: portrait)');

  // Current breakpoint name
  const breakpoint: Breakpoint | 'xs' = isLargeDesktop ? 'xl' :
                                         isDesktop ? 'lg' :
                                         isTablet ? 'md' :
                                         isMobile ? 'sm' : 'xs';

  return {
    // Boolean flags
    isMobile,      // < 768px
    isTablet,      // 768px - 1023px
    isDesktop,     // >= 1024px
    isLargeDesktop, // >= 1280px
    isTouchDevice,
    isLandscape,
    isPortrait,

    // Current breakpoint
    breakpoint,

    // Utility functions
    isAbove: useCallback((bp: Breakpoint) => {
      if (typeof window === 'undefined') return false;
      return window.innerWidth >= BREAKPOINTS[bp];
    }, []),

    isBelow: useCallback((bp: Breakpoint) => {
      if (typeof window === 'undefined') return true;
      return window.innerWidth < BREAKPOINTS[bp];
    }, []),
  };
}

/**
 * Hook to detect if user prefers reduced motion
 * Important for accessibility
 */
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

/**
 * Hook to detect if user prefers dark mode
 */
export function usePrefersDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)');
}

export default useMediaQuery;
