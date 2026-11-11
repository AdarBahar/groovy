import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Info, Sun, Moon, FolderOpen, Library, Settings, Menu, MoreVertical, Cable, Clock, Zap } from 'lucide-react';
import { Button } from '../ui/button';
import { useTheme } from '../../contexts/ThemeContext';
import { AutoSpeedUpModal } from './AutoSpeedUpModal';
import { AboutModal } from './AboutModal';
import { MetronomeOptionsMenu } from './MetronomeOptionsMenu';
import { MobileMoreMenu } from './MobileMoreMenu';
import { MIDISettingsModal } from './MIDISettingsModal';
import { AutoSpeedUpConfig, MetronomeConfig, MetronomeFrequency, MetronomeOffsetClick } from '../../types';
import { MIDIAvailability, MIDIConfig, MIDIDeviceInfo } from '../../midi/types';
import { trackThemeToggle, trackAutoSpeedUpConfigOpen } from '../../utils/analytics';
import { METRONOME_OPTIONS, type MetronomeOption } from '../../utils/metronomeConstants';

interface HeaderProps {
  metronome?: MetronomeOption;
  onMetronomeChange?: (value: MetronomeOption) => void;
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
  onOpenMyGrooves?: () => void;
  onOpenGrooveLibrary?: () => void;
  savedGroovesCount?: number;
  // MIDI props
  midiConfig?: MIDIConfig;
  midiDevices?: MIDIDeviceInfo[];
  midiAvailability?: MIDIAvailability;
  midiCurrentDevice?: MIDIDeviceInfo | null;
  onMIDIConfigChange?: (updates: Partial<MIDIConfig>) => void;
  onMIDIConnectDevice?: (deviceId: string) => void;
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
  onOpenMyGrooves,
  onOpenGrooveLibrary,
  savedGroovesCount = 0,
  midiConfig,
  midiDevices = [],
  midiAvailability = 'pending',
  midiCurrentDevice = null,
  onMIDIConfigChange,
  onMIDIConnectDevice,
  onToggleSidebar,
}: HeaderProps) {
  const { toggleTheme, isDark } = useTheme();
  const [showSpeedUpModal, setShowSpeedUpModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const aboutButtonRef = useRef<HTMLButtonElement>(null);
  const moreOptionsButtonRef = useRef<HTMLButtonElement>(null);
  // The control that opened the About dialog. Focus returns to it on close.
  const aboutReturnFocusRef = useRef<HTMLElement | null>(null);
  const [showMetronomeOptions, setShowMetronomeOptions] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showMIDIModal, setShowMIDIModal] = useState(false);

  return (
    <header className="flex items-center justify-between h-14 md:h-16 px-4 md:px-6 bg-surface-0 border-b border-line">
      <div className="flex items-center gap-3 md:gap-8">
        {/* Mobile hamburger menu button */}
        {onToggleSidebar && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleSidebar}
            className="md:hidden size-10 text-ink-2 hover:text-ink-1 hover:bg-surface-3 dark:hover:bg-surface-3 transition-colors touch-target"
            aria-label="Toggle sidebar"
          >
            <Menu className="size-[18px]" />
          </Button>
        )}

        <Link to="/" className="group flex items-center gap-2 no-underline">
          <div className="w-7 h-7 bg-ink-1 rounded-md flex items-center justify-center">
            <span className="text-surface-0 font-display text-base leading-none">G</span>
          </div>
          <span translate="no" className="text-ink-1 group-hover:text-brass-text transition-colors font-display text-xl leading-none hidden sm:inline">Groovy</span>
        </Link>

        {/* Desktop metronome controls - hidden on mobile */}
        <div className="hidden lg:flex items-center gap-3 text-sm relative">
          <span className="text-ink-3">Metronome:</span>
          <div role="group" aria-label="Metronome" className="flex items-center gap-1">
            {METRONOME_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => onMetronomeChange?.(option)}
                aria-pressed={metronome === option}
                className={`h-9 px-2 rounded-md text-[13px] lowercase first-letter:uppercase ${metronome === option ? 'text-ink-1 font-medium underline underline-offset-8 decoration-2 decoration-brass-text' : 'text-ink-2'} hover:text-ink-1 hover:bg-surface-3 transition-colors`}
              >
                {option === 'off' ? 'OFF' : option}
              </button>
            ))}
          </div>
          {/* Metronome Options Button */}
          {metronomeConfig && onMetronomeFrequencyChange && (
            <>
              <button
                onClick={() => setShowMetronomeOptions(!showMetronomeOptions)}
                className={`size-9 inline-flex items-center justify-center rounded-md transition-colors ${
                  showMetronomeOptions
                    ? 'text-ink-1 bg-surface-3'
                    : 'text-ink-3 hover:text-ink-1 hover:bg-surface-3'
                }`}
                title="Metronome Options"
                aria-label="Metronome Options"
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

      <div className="flex items-center gap-1">
        {/* Desktop navigation buttons - hidden on mobile */}
        <div className="hidden md:flex items-center gap-1 flex-shrink-0">
          {/* My Groovies Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenMyGrooves}
            className="text-ink-2 hover:text-ink-1 hover:bg-surface-3 dark:hover:bg-surface-3 h-9 gap-2 px-3 has-[>svg]:px-3 font-normal transition-colors relative flex-shrink-0"
            title="My Groovies"
            aria-label="My Groovies"
          >
            <FolderOpen className="w-4 h-4" />
            <span className="hidden xl:inline">My Groovies</span>
            {savedGroovesCount > 0 && (
              <span className="absolute top-0 right-0 min-w-4 h-4 px-1 text-xs leading-4 bg-surface-4 text-ink-1 rounded flex items-center justify-center">
                {savedGroovesCount > 9 ? '9+' : savedGroovesCount}
              </span>
            )}
          </Button>

          {/* Groove Library Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenGrooveLibrary}
            className="text-ink-2 hover:text-ink-1 hover:bg-surface-3 dark:hover:bg-surface-3 h-9 gap-2 px-3 has-[>svg]:px-3 font-normal transition-colors flex-shrink-0"
            title="Groove Library"
            aria-label="Groove Library"
          >
            <Library className="w-4 h-4" />
            <span className="hidden xl:inline">Library</span>
          </Button>

          {/* Count In Toggle - hidden at tablet width */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onCountInToggle}
            aria-label={`Count in - ${countInEnabled ? 'ON' : 'OFF'}`}
            title="Count in"
            className={`hidden lg:flex items-center h-9 gap-2 px-3 has-[>svg]:px-3 font-normal transition-colors ${
              countInEnabled
                ? 'text-ink-1 bg-surface-3 hover:bg-surface-4 dark:hover:bg-surface-4 shadow-[inset_0_-2px_0_var(--ui-brass-text)]'
                : 'text-ink-2 hover:text-ink-1 hover:bg-surface-3 dark:hover:bg-surface-3'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span className="hidden xl:inline">Count in - {countInEnabled ? 'ON' : 'OFF'}</span>
          </Button>

          {/* Auto Speed Up Button with Dropdown - hidden at tablet width */}
          {autoSpeedUpConfig && onAutoSpeedUpConfigChange && (
            <div className="hidden lg:flex relative">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { if (!showSpeedUpModal) trackAutoSpeedUpConfigOpen(); setShowSpeedUpModal(!showSpeedUpModal); }}
                aria-label="Auto Speed up"
                title="Auto Speed up"
                className={`flex items-center h-9 gap-2 px-3 has-[>svg]:px-3 font-normal transition-colors ${
                  showSpeedUpModal
                    ? 'text-ink-1 bg-surface-3'
                    : 'text-ink-2 hover:text-ink-1 hover:bg-surface-3 dark:hover:bg-surface-3'
                }`}
              >
                <Zap className="w-4 h-4" />
                <span className="hidden xl:inline">Auto Speed up</span>
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

          {/* About Button - hidden at tablet width */}
          <Button
            variant="ghost"
            size="sm"
            ref={aboutButtonRef}
            onClick={() => {
              aboutReturnFocusRef.current = aboutButtonRef.current;
              setShowAboutModal(!showAboutModal);
            }}
            aria-label="About"
            title="About"
            className={`hidden lg:flex h-9 gap-2 px-3 has-[>svg]:px-3 font-normal transition-colors ${
              showAboutModal
                ? 'text-ink-1 bg-surface-3'
                : 'text-ink-2 hover:text-ink-1 hover:bg-surface-3 dark:hover:bg-surface-3'
            }`}
          >
            <Info className="w-4 h-4" />
            <span className="hidden xl:inline">About</span>
          </Button>

          {/* MIDI Settings Button - Beta */}
          {midiConfig && onMIDIConfigChange && onMIDIConnectDevice && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMIDIModal(true)}
                className="text-ink-2 hover:text-ink-1 hover:bg-surface-3 dark:hover:bg-surface-3 h-9 gap-2 px-3 has-[>svg]:px-3 font-normal transition-colors"
                title="MIDI Settings"
                aria-label="MIDI Settings"
              >
                <Cable className="w-4 h-4" />
                <span className="hidden xl:inline">MIDI</span>
                <span
                  aria-hidden="true"
                  className={`size-1.5 rounded-full ${midiCurrentDevice ? 'bg-positive' : 'bg-negative'}`}
                />
              </Button>
              <span className="hidden xl:inline text-xs text-ink-3 mr-2">
                Beta
              </span>
            </div>
          )}
        </div>

        {/* Theme toggle - always visible */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => { trackThemeToggle(!isDark); toggleTheme(); }}
          className="size-9 max-md:size-10 text-ink-2 hover:text-ink-1 hover:bg-surface-3 dark:hover:bg-surface-3 transition-colors touch-target"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {isDark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
        </Button>

        {/* Mobile more menu button */}
        <div className="relative md:hidden">
          <Button
            variant="ghost"
            size="icon"
            ref={moreOptionsButtonRef}
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="size-10 text-ink-2 hover:text-ink-1 hover:bg-surface-3 dark:hover:bg-surface-3 transition-colors touch-target"
            aria-label="More options"
          >
            <MoreVertical className="size-[18px]" />
          </Button>

          <MobileMoreMenu
            isOpen={showMobileMenu}
            onClose={() => setShowMobileMenu(false)}
            onOpenMyGrooves={onOpenMyGrooves}
            onOpenGrooveLibrary={onOpenGrooveLibrary}
            countInEnabled={countInEnabled}
            onCountInToggle={onCountInToggle}
            autoSpeedUpConfig={autoSpeedUpConfig}
            onAutoSpeedUpConfigChange={onAutoSpeedUpConfigChange}
            onAutoSpeedUpSaveDefault={onAutoSpeedUpSaveDefault}
            onShowAbout={() => {
              // The menu item unmounts, so focus returns to the menu button.
              aboutReturnFocusRef.current = moreOptionsButtonRef.current;
              setShowAboutModal(true);
            }}
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
            // MIDI props for mobile menu
            midiCurrentDevice={midiCurrentDevice}
            onShowMIDISettings={() => setShowMIDIModal(true)}
          />
        </div>
      </div>

      <AboutModal
        isOpen={showAboutModal}
        onClose={() => setShowAboutModal(false)}
        returnFocusRef={aboutReturnFocusRef}
      />

      {/* MIDI Settings Modal */}
      {midiConfig && onMIDIConfigChange && onMIDIConnectDevice && (
        <MIDISettingsModal
          isOpen={showMIDIModal}
          onClose={() => setShowMIDIModal(false)}
          config={midiConfig}
          onConfigChange={onMIDIConfigChange}
          devices={midiDevices}
          availability={midiAvailability}
          currentDevice={midiCurrentDevice}
          onConnectDevice={onMIDIConnectDevice}
        />
      )}
    </header>
  );
}

