import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { useTheme } from '../../contexts/ThemeContext';
import { logger } from '../../utils/logger';
import { isAnalyticsOptedOut, isAnalyticsOptedOutOnPageLoad, setAnalyticsOptOut } from '../../utils/analytics';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const { isDark } = useTheme();
  const [debugMode, setDebugMode] = useState(logger.isDebugMode());

  const [shareUsage, setShareUsage] = useState(!isAnalyticsOptedOut());
  // The analytics script loads (or not) one time, when the page loads.
  // A change to the opt-out applies fully only after a reload.
  const [isAnalyticsOptedOutAtLoad] = useState(isAnalyticsOptedOutOnPageLoad);

  const [isShareUsageSaveFailed, setIsShareUsageSaveFailed] = useState(false);

  const handleShareUsageToggle = () => {
    const next = !shareUsage;
    const isSaved = setAnalyticsOptOut(!next);
    setIsShareUsageSaveFailed(!isSaved);
    setShareUsage(next);
  };

  const handleDebugToggle = () => {
    const newMode = logger.toggleDebugMode();
    setDebugMode(newMode);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent
        aria-describedby={undefined}
        className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} max-w-2xl p-0 gap-0 sm:p-0`}
      >
        {/* Header */}
        <DialogHeader className={`px-6 py-4 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <DialogTitle className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>About Groovy</DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className={`px-6 py-6 ${isDark ? 'text-slate-300' : 'text-slate-600'} space-y-4 max-h-[70vh] overflow-y-auto`}>
          <p>
            Groovy is a modern, web-based drum pattern sequencer for drummers,
            educators, and producers. Create and share patterns with an intuitive
            grid-based interface.
          </p>

          <div className="space-y-2">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Features</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Interactive drum grid with 8th, 16th, 32nd, and triplet divisions</li>
              <li>Real-time playback with tempo and swing controls</li>
              <li>Multiple articulations (ghost notes, accents, open hi-hats)</li>
              <li>Drag-to-paint and bulk pattern operations</li>
              <li>Sheet music notation display</li>
              <li>Auto Speed-up for tempo practice</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Quick Start</h3>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li><strong>Click</strong> cells to add/remove notes</li>
              <li><strong>Right-click</strong> for articulation variations</li>
              <li><strong>Space</strong> to play/pause</li>
              <li><strong>Ctrl+Drag</strong> to paint, <strong>Alt+Drag</strong> to erase</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Credits</h3>
            <p className="text-sm">
              Inspired by{' '}
              <a
                href="https://www.mikeslessons.com/groove/"
                target="_blank"
                rel="noopener noreferrer"
                className={`${isDark ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'} underline`}
              >
                GrooveScribe
              </a>{' '}
              by Mike Johnston and Lou Montulli.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Links</h3>
            <p className="text-sm">
              <a
                href="https://github.com/AdarBahar/groovy"
                target="_blank"
                rel="noopener noreferrer"
                className={`${isDark ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'} underline`}
              >
                GitHub Repository
              </a>
            </p>
          </div>

          <div className={`pt-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'} text-sm text-slate-400`}>
            <p>Version 1.0.0 • MIT License</p>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                id="share-usage-statistics"
                checked={shareUsage}
                onChange={handleShareUsageToggle}
                className="accent-purple-600"
              />
              <label htmlFor="share-usage-statistics" className="text-sm cursor-pointer">
                Share anonymous usage statistics
              </label>
            </div>
            {isShareUsageSaveFailed ? (
              <p role="alert" className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                Your browser did not save this choice. It applies only until you reload the page.
              </p>
            ) : (
              shareUsage === isAnalyticsOptedOutAtLoad && (
                <p className="mt-1 text-xs">Reload the page to apply this change fully.</p>
              )
            )}
            <p className="mt-1">
              © 2026 Groovy. Created by{' '}
              <button
                onClick={handleDebugToggle}
                className={`${isDark ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'} underline cursor-pointer transition-colors`}
                title={debugMode ? 'Click to disable debug mode' : 'Click to enable debug mode'}
              >
                Adar Bahar
              </button>
              {debugMode && (
                <span className="ml-2 text-xs px-2 py-1 rounded bg-purple-600 text-white">
                  Debug Mode ON
                </span>
              )}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
