import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Info, Sun, Moon } from 'lucide-react';
import { Button } from '../ui/button';
import { useTheme } from '../../contexts/ThemeContext';
import { AutoSpeedUpModal } from './AutoSpeedUpModal';
import { AboutModal } from './AboutModal';
import { AutoSpeedUpConfig } from '../../types';

interface HeaderProps {
  metronome?: 'off' | '4th' | '8th' | '16th';
  onMetronomeChange?: (value: 'off' | '4th' | '8th' | '16th') => void;
  countInEnabled?: boolean;
  onCountInToggle?: () => void;
  autoSpeedUpConfig?: AutoSpeedUpConfig;
  onAutoSpeedUpConfigChange?: (config: AutoSpeedUpConfig) => void;
  onAutoSpeedUpSaveDefault?: () => void;
}

export function Header({
  metronome = 'off',
  onMetronomeChange,
  countInEnabled = false,
  onCountInToggle,
  autoSpeedUpConfig,
  onAutoSpeedUpConfigChange,
  onAutoSpeedUpSaveDefault,
}: HeaderProps) {
  const metronomeOptions: Array<'off' | '4th' | '8th' | '16th'> = ['off', '4th', '8th', '16th'];
  const { toggleTheme, isDark } = useTheme();
  const [showSpeedUpModal, setShowSpeedUpModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-6">
        <Link to="/" className="flex items-center gap-2 no-underline">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">G</span>
          </div>
          <span className="text-slate-900 dark:text-white font-semibold text-lg">Groovy</span>
        </Link>

        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-500 dark:text-slate-400">Metronome:</span>
          {metronomeOptions.map((option) => (
            <button
              key={option}
              onClick={() => onMetronomeChange?.(option)}
              className={`${metronome === option ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'} hover:text-slate-900 dark:hover:text-white transition-colors uppercase`}
            >
              {option === 'off' ? 'OFF' : option}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Link to="/poc">
          <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
            📁 My Grooves
          </Button>
        </Link>

        {/* Count In Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onCountInToggle}
          className={`transition-colors ${
            countInEnabled
              ? 'text-white bg-purple-600 hover:bg-purple-700'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          Count in - {countInEnabled ? 'ON' : 'OFF'}
        </Button>

        {/* Auto Speed Up Button with Dropdown */}
        {autoSpeedUpConfig && onAutoSpeedUpConfigChange && (
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSpeedUpModal(!showSpeedUpModal)}
              className={`transition-colors ${
                showSpeedUpModal
                  ? 'text-white bg-slate-700'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Auto Speed up
            </Button>

            <AutoSpeedUpModal
              isOpen={showSpeedUpModal}
              onClose={() => setShowSpeedUpModal(false)}
              config={autoSpeedUpConfig}
              onConfigChange={onAutoSpeedUpConfigChange}
              onSaveAsDefault={onAutoSpeedUpSaveDefault || (() => {})}
            />
          </div>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAboutModal(!showAboutModal)}
          className={`transition-colors ${
            showAboutModal
              ? 'text-white bg-slate-700'
              : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Info className="w-4 h-4 mr-2" />
          About
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>
      </div>

      <AboutModal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
      />
    </header>
  );
}

