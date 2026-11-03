/**
 * Analytics utility for Groovy
 *
 * Wraps window.BaharAnalytics to provide type-safe tracking methods.
 * Analytics is enabled only when the hostname equals the analytics domain
 * or ends with "." plus the domain. All other hosts get no-op functions.
 * The user can opt out. The choice is stored in localStorage key
 * "groovy-analytics-disabled" and is read on every event.
 */

import { safeGetItem, safeSetItem, safeRemoveItem } from './safeStorage';

// Production domain where analytics should be enabled (configurable via env)
const ANALYTICS_DOMAIN = import.meta.env.VITE_ANALYTICS_DOMAIN || 'bahar.co.il';
const ANALYTICS_SCRIPT_URL = import.meta.env.VITE_ANALYTICS_SCRIPT_URL || 'https://www.bahar.co.il/assets/universal-analytics.js';

const ANALYTICS_OPT_OUT_KEY = 'groovy-analytics-disabled';

/** Return true when the hostname equals the domain or is a subdomain of it */
export function isAnalyticsHost(hostname: string, domain: string): boolean {
  const host = hostname.toLowerCase();
  const root = domain.toLowerCase();
  return host === root || host.endsWith('.' + root);
}

// The choice that the user made in this page session. It has priority over storage,
// so the choice applies immediately, also when the storage write fails.
let sessionOptOut: boolean | null = null;

/** Return true when the user turned off usage statistics */
export function isAnalyticsOptedOut(): boolean {
  if (sessionOptOut !== null) return sessionOptOut;
  return safeGetItem(ANALYTICS_OPT_OUT_KEY) === 'true';
}

/**
 * Set the opt-out choice of the user. Pass true to turn analytics off.
 * The choice applies immediately. Return false when the browser did not save it,
 * because then the choice applies only until the page reloads.
 */
export function setAnalyticsOptOut(disabled: boolean): boolean {
  sessionOptOut = disabled;
  const result = disabled
    ? safeSetItem(ANALYTICS_OPT_OUT_KEY, 'true')
    : safeRemoveItem(ANALYTICS_OPT_OUT_KEY);
  return result.success;
}

// Check if analytics is allowed on this host and the user did not opt out
const isAnalyticsEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  if (isAnalyticsOptedOut()) return false;
  return isAnalyticsHost(window.location.hostname, ANALYTICS_DOMAIN);
};

// Type for the BaharAnalytics global object
interface BaharAnalytics {
  track: (eventName: string, properties?: Record<string, unknown>) => void;
  trackPageView: (pageName: string, additionalProperties?: Record<string, unknown>) => void;
  trackButtonClick: (buttonName: string, location?: string, additionalProperties?: Record<string, unknown>) => void;
  trackExternalLink: (linkName: string, url: string, location?: string) => void;
  trackFormSubmission: (formName: string, success: boolean, additionalProperties?: Record<string, unknown>) => void;
  trackError: (errorType: string, errorMessage: string, location?: string) => void;
  getProjectName: () => string;
}

declare global {
  interface Window {
    BaharAnalytics?: BaharAnalytics;
  }
}

// Load analytics script dynamically (only on production domain)
function loadAnalyticsScript(): void {
  if (!isAnalyticsEnabled()) return;
  if (document.querySelector(`script[src="${ANALYTICS_SCRIPT_URL}"]`)) return;

  const script = document.createElement('script');
  script.src = ANALYTICS_SCRIPT_URL;
  script.setAttribute('data-project-name', 'Groovy');
  script.async = true;
  document.head.appendChild(script);
}

// The opt-out value when the page loaded. The script load uses this value.
const OPTED_OUT_ON_PAGE_LOAD = isAnalyticsOptedOut();

/** Return true when the user had opted out at page load (the script did not load) */
export function isAnalyticsOptedOutOnPageLoad(): boolean {
  return OPTED_OUT_ON_PAGE_LOAD;
}

// Load analytics on module initialization
loadAnalyticsScript();

/**
 * Safe wrapper for analytics - no-op if analytics not loaded or not on production domain
 */
const analytics = {
  track: (eventName: string, properties?: Record<string, unknown>) => {
    if (!isAnalyticsEnabled()) return;
    window.BaharAnalytics?.track(eventName, properties);
  },

  trackButtonClick: (buttonName: string, location?: string, properties?: Record<string, unknown>) => {
    if (!isAnalyticsEnabled()) return;
    window.BaharAnalytics?.trackButtonClick(buttonName, location, properties);
  },

  trackError: (errorType: string, errorMessage: string, location?: string) => {
    if (!isAnalyticsEnabled()) return;
    window.BaharAnalytics?.trackError(errorType, errorMessage, location);
  },
};

// ============================================================================
// Playback Events
// ============================================================================

export function trackPlay(mode: 'normal' | 'speed-up', tempo: number, timeSignature: string): void {
  analytics.track('Groovy Playback Started', { mode, tempo, time_signature: timeSignature });
}

export function trackStop(mode: 'normal' | 'speed-up', duration_seconds: number): void {
  analytics.track('Groovy Playback Stopped', { mode, duration_seconds });
}

// ============================================================================
// Groove Editing Events
// ============================================================================

export function trackNoteToggle(voice: string, position: number, isAdding: boolean): void {
  analytics.track('Groovy Note Toggled', { voice, position, action: isAdding ? 'add' : 'remove' });
}

export function trackDivisionChange(division: number): void {
  analytics.track('Groovy Division Changed', { division });
}

export function trackTempoChange(tempo: number): void {
  analytics.track('Groovy Tempo Changed', { tempo });
}

export function trackSwingChange(swing: number): void {
  analytics.track('Groovy Swing Changed', { swing });
}

export function trackMeasureAction(action: 'add' | 'duplicate' | 'remove' | 'clear', measureIndex: number): void {
  analytics.track('Groovy Measure Action', { action, measure_index: measureIndex });
}

export function trackClearAll(): void {
  analytics.track('Groovy Clear All Notes');
}

// ============================================================================
// Groove Library Events
// ============================================================================

export function trackLibraryOpen(): void {
  analytics.track('Groovy Library Opened');
}

export function trackLibraryStyleSelect(styleName: string): void {
  analytics.track('Groovy Library Style Selected', { style_name: styleName });
}

export function trackLibraryGrooveLoad(grooveName: string, styleName: string): void {
  analytics.track('Groovy Library Groove Loaded', { groove_name: grooveName, style_name: styleName });
}

export function trackLibraryGrooveSave(grooveName: string, styleName: string): void {
  analytics.track('Groovy Library Groove Saved to My Groovies', { groove_name: grooveName, style_name: styleName });
}

// ============================================================================
// My Groovies Events
// ============================================================================

export function trackMyGroovesOpen(): void {
  analytics.track('Groovy My Groovies Opened');
}

export function trackGrooveSave(hasName: boolean, isOverwrite: boolean): void {
  analytics.track('Groovy Groove Saved', { has_name: hasName, is_overwrite: isOverwrite });
}

export function trackGrooveLoad(hasName: boolean): void {
  analytics.track('Groovy Groove Loaded', { has_name: hasName });
}

export function trackGrooveDelete(hasName: boolean): void {
  analytics.track('Groovy Groove Deleted', { has_name: hasName });
}

// ============================================================================
// Export/Share Events
// ============================================================================

export function trackShare(): void {
  analytics.track('Groovy URL Shared');
}

export function trackShareModalOpen(): void {
  analytics.track('Groovy Share Modal Opened');
}

export function trackShareMethod(
  method: 'link' | 'twitter' | 'facebook' | 'reddit' | 'embed' | 'qr' | 'email' | 'shorten',
  properties?: Record<string, unknown>
): void {
  analytics.track('Groovy Share Method Used', { method, ...properties });
}

export function trackShareModeToggle(mode: 'embed' | 'editor'): void {
  analytics.track('Groovy Share Mode Toggled', { mode });
}

export function trackDownloadOpen(): void {
  analytics.track('Groovy Download Modal Opened');
}

export function trackDownload(format: string): void {
  analytics.track('Groovy Downloaded', { format });
}

export function trackPrintOpen(): void {
  analytics.track('Groovy Print Preview Opened');
}

export function trackPrint(): void {
  analytics.track('Groovy Printed');
}

// ============================================================================
// UI Events
// ============================================================================

export function trackThemeToggle(isDark: boolean): void {
  analytics.track('Groovy Theme Toggled', { theme: isDark ? 'dark' : 'light' });
}

export function trackCountInToggle(enabled: boolean): void {
  analytics.track('Groovy Count In Toggled', { enabled });
}

export function trackMetronomeChange(frequency: string): void {
  analytics.track('Groovy Metronome Changed', { frequency });
}

export function trackNotesOnlyToggle(enabled: boolean): void {
  analytics.track('Groovy Notes Only Mode Toggled', { enabled });
}

export function trackAutoSpeedUpConfigOpen(): void {
  analytics.track('Groovy Auto Speed Up Config Opened');
}

export function trackAutoSpeedUpConfigSave(config: { bpmIncrease: number; everyNLoops: number }): void {
  analytics.track('Groovy Auto Speed Up Config Saved', config);
}

export function trackUndoRedo(action: 'undo' | 'redo'): void {
  analytics.track('Groovy Undo/Redo', { action });
}

// ============================================================================
// MIDI Events
// ============================================================================

export function trackMIDISettingsOpen(): void {
  analytics.track('Groovy MIDI Settings Opened');
}

export function trackMIDIDeviceConnected(deviceName: string): void {
  analytics.track('Groovy MIDI Device Connected', { device_name: deviceName });
}

export function trackMIDIDeviceDisconnected(deviceName: string): void {
  analytics.track('Groovy MIDI Device Disconnected', { device_name: deviceName });
}

export function trackMIDIDeviceSelected(deviceName: string): void {
  analytics.track('Groovy MIDI Device Selected', { device_name: deviceName });
}

export function trackMIDITrackingToggle(enabled: boolean): void {
  analytics.track('Groovy MIDI Tracking Toggled', { enabled });
}

export function trackMIDIThroughToggle(enabled: boolean): void {
  analytics.track('Groovy MIDI Through Toggled', { enabled });
}

export function trackMIDIDrumKitSelected(kitName: string): void {
  analytics.track('Groovy MIDI Drum Kit Selected', { kit_name: kitName });
}

/** Report an error. Send only the error name, never the error message. */
export function trackError(errorType: string, errorName: string, location: string): void {
  analytics.trackError(errorType, errorName, location);
}

/**
 * Generic track function for custom events
 * Useful for one-off tracking that doesn't have a specific wrapper
 * Note: Consider adding a 'Groovy' prefix if this is used for app-specific events
 */
export function track(eventName: string, properties?: Record<string, unknown>): void {
  analytics.track(eventName, properties);
}

