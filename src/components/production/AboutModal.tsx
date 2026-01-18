import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { logger } from '../../utils/logger';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
  const { isDark } = useTheme();
  const [debugMode, setDebugMode] = useState(logger.isDebugMode());

  const handleDebugToggle = () => {
    const newMode = logger.toggleDebugMode();
    setDebugMode(newMode);
  };

  // Handle ESC key press
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={`fixed inset-0 ${isDark ? 'bg-black/60' : 'bg-black/40'} flex items-center justify-center z-50`}
      onClick={handleBackdropClick}
    >
      <div className={`${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} rounded-lg shadow-2xl w-full max-w-2xl mx-4 border`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
          <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>About Groovy</h2>
          <button
            onClick={onClose}
            className={`${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'} transition-colors`}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

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
      </div>
    </div>
  );
}

