/**
 * Error Boundary Component
 *
 * Catches unhandled errors in React component tree and displays fallback UI
 * Prevents the entire app from crashing due to a component error
 */

import React, { Component, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { logger } from '../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Log error details for debugging
    logger.error('ErrorBoundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Report to analytics or error tracking service if available
    if (typeof window !== 'undefined' && window.BaharAnalytics) {
      window.BaharAnalytics.trackError(
        'React Error Boundary',
        error.message,
        errorInfo.componentStack || 'unknown'
      );
    }
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoHome = (): void => {
    window.location.href = '/';
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Custom fallback UI provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl max-w-2xl w-full p-8">
            {/* Error Icon */}
            <div className="flex justify-center mb-6">
              <div className="bg-red-100 dark:bg-red-900/30 rounded-full p-4">
                <AlertTriangle className="w-12 h-12 text-red-600 dark:text-red-400" />
              </div>
            </div>

            {/* Error Title */}
            <h1 className="text-2xl font-bold text-center text-slate-900 dark:text-white mb-4">
              Oops! Something went wrong
            </h1>

            {/* Error Message */}
            <p className="text-center text-slate-600 dark:text-slate-300 mb-6">
              We're sorry, but something unexpected happened. Don't worry, your grooves are safe!
            </p>

            {/* Error Details (Debug Mode) */}
            {logger.isDebugMode() && this.state.error && (
              <details className="mb-6 bg-slate-100 dark:bg-slate-900 rounded-lg p-4">
                <summary className="cursor-pointer font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Technical Details
                </summary>
                <div className="text-sm text-slate-600 dark:text-slate-400 space-y-2">
                  <div>
                    <strong>Error:</strong>
                    <pre className="mt-1 overflow-x-auto bg-white dark:bg-slate-950 p-2 rounded text-xs">
                      {this.state.error.toString()}
                    </pre>
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <strong>Component Stack:</strong>
                      <pre className="mt-1 overflow-x-auto bg-white dark:bg-slate-950 p-2 rounded text-xs max-h-40">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </details>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                Reload Page
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-900 dark:text-white rounded-lg font-semibold transition-colors"
              >
                <Home className="w-5 h-5" />
                Go Home
              </button>
            </div>

            {/* Help Text */}
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mt-6">
              If this problem persists, please{' '}
              <a
                href="https://github.com/AdarBahar/groovy/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-600 dark:text-purple-400 underline hover:text-purple-700"
              >
                report it on GitHub
              </a>
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
