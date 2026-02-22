/**
 * Analytics utility for Groovy
 *
 * Wraps window.BaharAnalytics to provide type-safe tracking methods.
 * Analytics is only enabled on the production domain (bahar.co.il).
 * For other deployments, all tracking functions are no-ops.
 */

// Production domain where analytics should be enabled (configurable via env)
const ANALYTICS_DOMAIN = import.meta.env.VITE_ANALYTICS_DOMAIN || 'bahar.co.il';
const ANALYTICS_SCRIPT_URL = import.meta.env.VITE_ANALYTICS_SCRIPT_URL || 'https://www.bahar.co.il/assets/universal-analytics.js';

// Check if we're on the production domain
const isAnalyticsEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.endsWith(ANALYTICS_DOMAIN);
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

export function trackPlay(mode: 'normal' | 'speed-up', tempo: number, timeSignature: string) {
  analytics.track('Groovy Playback Started', { mode, tempo, time_signature: timeSignature });
}

export function trackStop(mode: 'normal' | 'speed-up', duration_seconds: number) {
  analytics.track('Groovy Playback Stopped', { mode, duration_seconds });
}

// ============================================================================
// Groove Editing Events
// ============================================================================

export function trackNoteToggle(voice: string, position: number, isAdding: boolean) {
  analytics.track('Groovy Note Toggled', { voice, position, action: isAdding ? 'add' : 'remove' });
}

export function trackDivisionChange(division: number) {
  analytics.track('Groovy Division Changed', { division });
}

export function trackTempoChange(tempo: number) {
  analytics.track('Groovy Tempo Changed', { tempo });
}

export function trackSwingChange(swing: number) {
  analytics.track('Groovy Swing Changed', { swing });
}

export function trackMeasureAction(action: 'add' | 'duplicate' | 'remove' | 'clear', measureIndex: number) {
  analytics.track('Groovy Measure Action', { action, measure_index: measureIndex });
}

export function trackClearAll() {
  analytics.track('Groovy Clear All Notes');
}

// ============================================================================
// Groove Library Events
// ============================================================================

export function trackLibraryOpen() {
  analytics.track('Groovy Library Opened');
}

export function trackLibraryStyleSelect(styleName: string) {
  analytics.track('Groovy Library Style Selected', { style_name: styleName });
}

export function trackLibraryGrooveLoad(grooveName: string, styleName: string) {
  analytics.track('Groovy Library Groove Loaded', { groove_name: grooveName, style_name: styleName });
}

export function trackLibraryGrooveSave(grooveName: string, styleName: string) {
  analytics.track('Groovy Library Groove Saved to My Groovies', { groove_name: grooveName, style_name: styleName });
}

// ============================================================================
// My Groovies Events
// ============================================================================

export function trackMyGroovesOpen() {
  analytics.track('Groovy My Groovies Opened');
}

export function trackGrooveSave(grooveName: string, isOverwrite: boolean) {
  analytics.track('Groovy Groove Saved', { groove_name: grooveName, is_overwrite: isOverwrite });
}

export function trackGrooveLoad(grooveName: string) {
  analytics.track('Groovy Groove Loaded', { groove_name: grooveName });
}

export function trackGrooveDelete(grooveName: string) {
  analytics.track('Groovy Groove Deleted', { groove_name: grooveName });
}

// ============================================================================
// Export/Share Events
// ============================================================================

export function trackShare() {
  analytics.track('Groovy URL Shared');
}

export function trackShareModalOpen() {
  analytics.track('Groovy Share Modal Opened');
}

export function trackShareMethod(
  method: 'link' | 'twitter' | 'facebook' | 'reddit' | 'embed' | 'qr' | 'email' | 'shorten',
  properties?: Record<string, unknown>
) {
  analytics.track('Groovy Share Method Used', { method, ...properties });
}

export function trackShareModeToggle(mode: 'embed' | 'editor') {
  analytics.track('Groovy Share Mode Toggled', { mode });
}

export function trackDownloadOpen() {
  analytics.track('Groovy Download Modal Opened');
}

export function trackDownload(format: string) {
  analytics.track('Groovy Downloaded', { format });
}

export function trackPrintOpen() {
  analytics.track('Groovy Print Preview Opened');
}

export function trackPrint() {
  analytics.track('Groovy Printed');
}

// ============================================================================
// UI Events
// ============================================================================

export function trackThemeToggle(isDark: boolean) {
  analytics.track('Groovy Theme Toggled', { theme: isDark ? 'dark' : 'light' });
}

export function trackCountInToggle(enabled: boolean) {
  analytics.track('Groovy Count In Toggled', { enabled });
}

export function trackMetronomeChange(frequency: string) {
  analytics.track('Groovy Metronome Changed', { frequency });
}

export function trackNotesOnlyToggle(enabled: boolean) {
  analytics.track('Groovy Notes Only Mode Toggled', { enabled });
}

export function trackAutoSpeedUpConfigOpen() {
  analytics.track('Groovy Auto Speed Up Config Opened');
}

export function trackAutoSpeedUpConfigSave(config: { bpmIncrease: number; everyNLoops: number }) {
  analytics.track('Groovy Auto Speed Up Config Saved', config);
}

export function trackUndoRedo(action: 'undo' | 'redo') {
  analytics.track('Groovy Undo/Redo', { action });
}

/**
 * Generic track function for custom events
 * Useful for one-off tracking that doesn't have a specific wrapper
 * Note: Consider adding a 'Groovy' prefix if this is used for app-specific events
 */
export function track(eventName: string, properties?: Record<string, unknown>) {
  analytics.track(eventName, properties);
}

