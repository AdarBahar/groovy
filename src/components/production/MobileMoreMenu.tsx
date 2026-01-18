import { useEffect, useRef } from 'react';
import { Save, FolderOpen, Library, Info, Zap } from 'lucide-react';
import { AutoSpeedUpConfig, MetronomeConfig, MetronomeFrequency, MetronomeOffsetClick } from '../../types';

interface MobileMoreMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveGroove?: () => void;
  onOpenMyGrooves?: () => void;
  onOpenGrooveLibrary?: () => void;
  countInEnabled?: boolean;
  onCountInToggle?: () => void;
  autoSpeedUpConfig?: AutoSpeedUpConfig;
  onAutoSpeedUpConfigChange?: (config: AutoSpeedUpConfig) => void;
  onAutoSpeedUpSaveDefault?: () => void;
  onShowAbout?: () => void;
  savedGroovesCount?: number;
  // Metronome props
  metronome?: 'off' | '4th' | '8th' | '16th';
  onMetronomeChange?: (value: 'off' | '4th' | '8th' | '16th') => void;
  metronomeConfig?: MetronomeConfig;
  onMetronomeFrequencyChange?: (frequency: MetronomeFrequency) => void;
  onMetronomeSoloChange?: (solo: boolean) => void;
  onMetronomeCountInChange?: (countIn: boolean) => void;
  onMetronomeVolumeChange?: (volume: number) => void;
  onMetronomeOffsetClickChange?: (offsetClick: MetronomeOffsetClick) => void;
}

export function MobileMoreMenu({
  isOpen,
  onClose,
  onSaveGroove,
  onOpenMyGrooves,
  onOpenGrooveLibrary,
  countInEnabled = false,
  onCountInToggle,
  onShowAbout,
  savedGroovesCount = 0,
  metronome = 'off',
  onMetronomeChange,
}: MobileMoreMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const metronomeOptions: Array<'off' | '4th' | '8th' | '16th'> = ['off', '4th', '8th', '16th'];

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    // Add listener after a small delay to avoid immediate close
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Close on escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAction = (action?: () => void) => {
    action?.();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-2 z-50"
    >
      {/* Metronome Section */}
      <div className="px-4 py-2 border-b border-slate-200 dark:border-slate-700">
        <div className="text-xs uppercase text-slate-500 dark:text-slate-400 mb-2 font-semibold">
          Metronome
        </div>
        <div className="flex items-center gap-2">
          {metronomeOptions.map((option) => (
            <button
              key={option}
              onClick={() => onMetronomeChange?.(option)}
              className={`flex-1 py-2 px-2 rounded text-xs font-medium transition-colors ${
                metronome === option
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              {option === 'off' ? 'OFF' : option}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="py-1">
        <button
          onClick={() => handleAction(onSaveGroove)}
          className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <Save className="w-5 h-5" />
          <span>Save Groove</span>
        </button>

        <button
          onClick={() => handleAction(onOpenMyGrooves)}
          className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <FolderOpen className="w-5 h-5" />
          <span>My Groovies</span>
          {savedGroovesCount > 0 && (
            <span className="ml-auto w-5 h-5 bg-purple-600 text-white text-xs rounded-full flex items-center justify-center">
              {savedGroovesCount > 9 ? '9+' : savedGroovesCount}
            </span>
          )}
        </button>

        <button
          onClick={() => handleAction(onOpenGrooveLibrary)}
          className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <Library className="w-5 h-5" />
          <span>Library</span>
        </button>

        <div className="border-t border-slate-200 dark:border-slate-700 my-1" />

        <button
          onClick={() => handleAction(onCountInToggle)}
          className="w-full flex items-center justify-between px-4 py-3 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5" />
            <span>Count In</span>
          </div>
          <span className={`text-xs font-semibold px-2 py-1 rounded ${
            countInEnabled
              ? 'bg-purple-600 text-white'
              : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
          }`}>
            {countInEnabled ? 'ON' : 'OFF'}
          </span>
        </button>

        <div className="border-t border-slate-200 dark:border-slate-700 my-1" />

        <button
          onClick={() => handleAction(onShowAbout)}
          className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          <Info className="w-5 h-5" />
          <span>About</span>
        </button>
      </div>
    </div>
  );
}
