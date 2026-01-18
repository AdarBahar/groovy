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
  analytics.track('Playback Started', { mode, tempo, time_signature: timeSignature });
}

export function trackStop(mode: 'normal' | 'speed-up', duration_seconds: number) {
  analytics.track('Playback Stopped', { mode, duration_seconds });
}

// ============================================================================
// Groove Editing Events
// ============================================================================

export function trackNoteToggle(voice: string, position: number, isAdding: boolean) {
  analytics.track('Note Toggled', { voice, position, action: isAdding ? 'add' : 'remove' });
}

export function trackDivisionChange(division: number) {
  analytics.track('Division Changed', { division });
}

export function trackTempoChange(tempo: number) {
  analytics.track('Tempo Changed', { tempo });
}

export function trackSwingChange(swing: number) {
  analytics.track('Swing Changed', { swing });
}

export function trackMeasureAction(action: 'add' | 'duplicate' | 'remove' | 'clear', measureIndex: number) {
  analytics.track('Measure Action', { action, measure_index: measureIndex });
}

export function trackClearAll() {
  analytics.track('Clear All Notes');
}

// ============================================================================
// Groove Library Events
// ============================================================================

export function trackLibraryOpen() {
  analytics.track('Library Opened');
}

export function trackLibraryStyleSelect(styleName: string) {
  analytics.track('Library Style Selected', { style_name: styleName });
}

export function trackLibraryGrooveLoad(grooveName: string, styleName: string) {
  analytics.track('Library Groove Loaded', { groove_name: grooveName, style_name: styleName });
}

export function trackLibraryGrooveSave(grooveName: string, styleName: string) {
  analytics.track('Library Groove Saved to My Groovies', { groove_name: grooveName, style_name: styleName });
}

// ============================================================================
// My Groovies Events
// ============================================================================

export function trackMyGroovesOpen() {
  analytics.track('My Groovies Opened');
}

export function trackGrooveSave(grooveName: string, isOverwrite: boolean) {
  analytics.track('Groove Saved', { groove_name: grooveName, is_overwrite: isOverwrite });
}

export function trackGrooveLoad(grooveName: string) {
  analytics.track('Groove Loaded', { groove_name: grooveName });
}

export function trackGrooveDelete(grooveName: string) {
  analytics.track('Groove Deleted', { groove_name: grooveName });
}

// ============================================================================
// Export/Share Events
// ============================================================================

export function trackShare() {
  analytics.track('URL Shared');
}

export function trackShareModalOpen() {
  analytics.track('Share Modal Opened');
}

export function trackShareMethod(method: 'link' | 'twitter' | 'facebook' | 'reddit' | 'embed' | 'qr' | 'email') {
  analytics.track('Share Method Used', { method });
}

export function trackDownloadOpen() {
  analytics.track('Download Modal Opened');
}

export function trackDownload(format: string) {
  analytics.track('Downloaded', { format });
}

export function trackPrintOpen() {
  analytics.track('Print Preview Opened');
}

export function trackPrint() {
  analytics.track('Printed');
}

// ============================================================================
// UI Events
// ============================================================================

export function trackThemeToggle(isDark: boolean) {
  analytics.track('Theme Toggled', { theme: isDark ? 'dark' : 'light' });
}

export function trackCountInToggle(enabled: boolean) {
  analytics.track('Count In Toggled', { enabled });
}

export function trackMetronomeChange(frequency: string) {
  analytics.track('Metronome Changed', { frequency });
}

export function trackNotesOnlyToggle(enabled: boolean) {
  analytics.track('Notes Only Mode Toggled', { enabled });
}

export function trackAutoSpeedUpConfigOpen() {
  analytics.track('Auto Speed Up Config Opened');
}

export function trackAutoSpeedUpConfigSave(config: { bpmIncrease: number; everyNLoops: number }) {
  analytics.track('Auto Speed Up Config Saved', config);
}

export function trackUndoRedo(action: 'undo' | 'redo') {
  analytics.track('Undo/Redo', { action });
}

