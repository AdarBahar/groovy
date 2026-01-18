import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Info, Sun, Moon, Save, FolderOpen, Library, Settings, Menu, MoreVertical } from 'lucide-react';
import { Button } from '../ui/button';
import { useTheme } from '../../contexts/ThemeContext';
import { AutoSpeedUpModal } from './AutoSpeedUpModal';
import { AboutModal } from './AboutModal';
import { MetronomeOptionsMenu } from './MetronomeOptionsMenu';
import { MobileMoreMenu } from './MobileMoreMenu';
import { AutoSpeedUpConfig, MetronomeConfig, MetronomeFrequency, MetronomeOffsetClick } from '../../types';
import { trackThemeToggle, trackAutoSpeedUpConfigOpen } from '../../utils/analytics';

interface HeaderProps {
  metronome?: 'off' | '4th' | '8th' | '16th';
  onMetronomeChange?: (value: 'off' | '4th' | '8th' | '16th') => void;
  // Metronome options
  metronomeConfig?: MetronomeConfig;
  onMetronomeFrequencyChange?: (frequency: MetronomeFrequency) => void;
  onMetronomeSoloChange?: (solo: boolean) => void;
  onMetronomeCountInChange?: (countIn: boolean) => void;
  onMetronomeVolumeChange?: (volume: number) => void;
  onMetronomeOffsetClickChange?: (offsetClick: MetronomeOffsetClick) => void;
  // Other props
  countInEnabled?: boolean;
  onCountInToggle?: () => void;
  autoSpeedUpConfig?: AutoSpeedUpConfig;
  onAutoSpeedUpConfigChange?: (config: AutoSpeedUpConfig) => void;
  onAutoSpeedUpSaveDefault?: () => void;
  onSaveGroove?: () => void;
  onOpenMyGrooves?: () => void;
  onOpenGrooveLibrary?: () => void;
  savedGroovesCount?: number;
  // Mobile sidebar control
  onToggleSidebar?: () => void;
}

export function Header({
  metronome = 'off',
  onMetronomeChange,
  metronomeConfig,
  onMetronomeFrequencyChange,
  onMetronomeSoloChange,
  onMetronomeCountInChange,
  onMetronomeVolumeChange,
  onMetronomeOffsetClickChange,
  countInEnabled = false,
  onCountInToggle,
  autoSpeedUpConfig,
  onAutoSpeedUpConfigChange,
  onAutoSpeedUpSaveDefault,
  onSaveGroove,
  onOpenMyGrooves,
  onOpenGrooveLibrary,
  savedGroovesCount = 0,
  onToggleSidebar,
}: HeaderProps) {
  const metronomeOptions: Array<'off' | '4th' | '8th' | '16th'> = ['off', '4th', '8th', '16th'];
  const { toggleTheme, isDark } = useTheme();
  const [showSpeedUpModal, setShowSpeedUpModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showMetronomeOptions, setShowMetronomeOptions] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  return (
    <header className="flex items-center justify-between px-4 md:px-6 py-3 md:py-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-3 md:gap-6">
        {/* Mobile hamburger menu button */}
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="md:hidden text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white touch-target"
            aria-label="Toggle sidebar"
          >
            <Menu className="w-6 h-6" />
          </Button>
        )}

        <Link to="/" className="flex items-center gap-2 no-underline">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-700 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">G</span>
          </div>
          <span className="text-slate-900 dark:text-white font-semibold text-lg hidden sm:inline">Groovy</span>
        </Link>

        {/* Desktop metronome controls - hidden on mobile */}
        <div className="hidden lg:flex items-center gap-4 text-sm relative">
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
          {/* Metronome Options Button */}
          {metronomeConfig && onMetronomeFrequencyChange && (
            <>
              <button
                onClick={() => setShowMetronomeOptions(!showMetronomeOptions)}
                className={`ml-2 p-1 rounded transition-colors ${
                  showMetronomeOptions
                    ? 'text-purple-500 bg-purple-100 dark:bg-purple-900/30'
                    : 'text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
                title="Metronome Options"
              >
                <Settings className="w-4 h-4" />
              </button>
              <MetronomeOptionsMenu
                isOpen={showMetronomeOptions}
                onClose={() => setShowMetronomeOptions(false)}
                config={metronomeConfig}
                onFrequencyChange={onMetronomeFrequencyChange}
                onSoloChange={onMetronomeSoloChange || (() => {})}
                onCountInChange={onMetronomeCountInChange || (() => {})}
                onVolumeChange={onMetronomeVolumeChange || (() => {})}
                onOffsetClickChange={onMetronomeOffsetClickChange || (() => {})}
              />
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        {/* Desktop navigation buttons - hidden on mobile */}
        <div className="hidden md:flex items-center gap-4">
          {/* Save Groove Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onSaveGroove}
            className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            Save
          </Button>

          {/* My Groovies Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenMyGrooves}
            className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white relative"
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            My Groovies
            {savedGroovesCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-purple-600 text-white text-xs rounded-full flex items-center justify-center">
                {savedGroovesCount > 9 ? '9+' : savedGroovesCount}
              </span>
            )}
          </Button>

          {/* Groove Library Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenGrooveLibrary}
            className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
          >
            <Library className="w-4 h-4 mr-2" />
            Library
          </Button>

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
                onClick={() => { if (!showSpeedUpModal) trackAutoSpeedUpConfigOpen(); setShowSpeedUpModal(!showSpeedUpModal); }}
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
        </div>

        {/* Theme toggle - always visible */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => { trackThemeToggle(!isDark); toggleTheme(); }}
          className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white touch-target"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </Button>

        {/* Mobile more menu button */}
        <div className="relative md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white touch-target"
            aria-label="More options"
          >
            <MoreVertical className="w-6 h-6" />
          </Button>

          <MobileMoreMenu
            isOpen={showMobileMenu}
            onClose={() => setShowMobileMenu(false)}
            onSaveGroove={onSaveGroove}
            onOpenMyGrooves={onOpenMyGrooves}
            onOpenGrooveLibrary={onOpenGrooveLibrary}
            countInEnabled={countInEnabled}
            onCountInToggle={onCountInToggle}
            autoSpeedUpConfig={autoSpeedUpConfig}
            onAutoSpeedUpConfigChange={onAutoSpeedUpConfigChange}
            onAutoSpeedUpSaveDefault={onAutoSpeedUpSaveDefault}
            onShowAbout={() => setShowAboutModal(true)}
            savedGroovesCount={savedGroovesCount}
            // Metronome props for mobile menu
            metronome={metronome}
            onMetronomeChange={onMetronomeChange}
            metronomeConfig={metronomeConfig}
            onMetronomeFrequencyChange={onMetronomeFrequencyChange}
            onMetronomeSoloChange={onMetronomeSoloChange}
            onMetronomeCountInChange={onMetronomeCountInChange}
            onMetronomeVolumeChange={onMetronomeVolumeChange}
            onMetronomeOffsetClickChange={onMetronomeOffsetClickChange}
          />
        </div>
      </div>

      <AboutModal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
      />
    </header>
  );
}

