/**
 * Analytics utility for Groovy
 *
 * Wraps window.BaharAnalytics to provide type-safe tracking methods.
 * All tracking is done through the universal analytics script loaded in index.html.
 */

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

/**
 * Safe wrapper for analytics - no-op if analytics not loaded
 */
const analytics = {
  track: (eventName: string, properties?: Record<string, unknown>) => {
    window.BaharAnalytics?.track(eventName, properties);
  },

  trackButtonClick: (buttonName: string, location?: string, properties?: Record<string, unknown>) => {
    window.BaharAnalytics?.trackButtonClick(buttonName, location, properties);
  },

  trackError: (errorType: string, errorMessage: string, location?: string) => {
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

