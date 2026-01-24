/**
 * Logger utility with debug mode toggle
 *
 * Provides console logging that can be disabled in production
 * Debug mode can be toggled by clicking "Adar Bahar" in the About modal
 */

const DEBUG_MODE_KEY = 'groovy-debug-mode';

class Logger {
  private debugMode: boolean;

  constructor() {
    // Check localStorage for saved debug mode preference
    const saved = localStorage.getItem(DEBUG_MODE_KEY);
    this.debugMode = saved === 'true';
  }

  /**
   * Toggle debug mode on/off
   * @returns new debug mode state
   */
  toggleDebugMode(): boolean {
    this.debugMode = !this.debugMode;
    localStorage.setItem(DEBUG_MODE_KEY, String(this.debugMode));
    console.log(`🔧 Debug mode ${this.debugMode ? 'ENABLED' : 'DISABLED'}`);
    return this.debugMode;
  }

  /**
   * Get current debug mode state
   */
  isDebugMode(): boolean {
    return this.debugMode;
  }

  /**
   * Log message (only in debug mode)
   */
  log(...args: unknown[]): void {
    if (this.debugMode) {
      console.log(...args);
    }
  }

  /**
   * Log warning (only in debug mode)
   */
  warn(...args: unknown[]): void {
    if (this.debugMode) {
      console.warn(...args);
    }
  }

  /**
   * Log error (always logs, even in production)
   */
  error(...args: unknown[]): void {
    console.error(...args);
  }

  /**
   * Log info message (only in debug mode)
   */
  info(...args: unknown[]): void {
    if (this.debugMode) {
      console.info(...args);
    }
  }
}

// Export singleton instance
export const logger = new Logger();
