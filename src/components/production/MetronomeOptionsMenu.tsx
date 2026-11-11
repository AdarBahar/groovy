import { useEffect, type RefObject } from 'react';
import { Button } from '../ui/button';
import { MetronomeConfig, MetronomeFrequency, MetronomeOffsetClick } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface MetronomeOptionsMenuProps {
  isOpen: boolean;
  onClose: () => void;
  config: MetronomeConfig;
  onFrequencyChange: (frequency: MetronomeFrequency) => void;
  onSoloChange: (solo: boolean) => void;
  onCountInChange: (countIn: boolean) => void;
  onVolumeChange: (volume: number) => void;
  onOffsetClickChange: (offsetClick: MetronomeOffsetClick) => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
}

export function MetronomeOptionsMenu({
  isOpen,
  onClose,
  config,
  onFrequencyChange,
  onSoloChange,
  onCountInChange,
  onVolumeChange,
  onOffsetClickChange,
  returnFocusRef,
}: MetronomeOptionsMenuProps) {
  const { isDark } = useTheme();

  // Close with Escape, as every menu does (docs/UI-RULES.md).
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (e.defaultPrevented) return;
      if (document.querySelector('[role="dialog"][data-state="open"]')) return;
      e.preventDefault();
      onClose();
      returnFocusRef?.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose, returnFocusRef]);

  if (!isOpen) return null;

  const frequencyOptions: { value: MetronomeFrequency; label: string }[] = [
    { value: 0, label: 'Off' },
    { value: 4, label: '4th' },
    { value: 8, label: '8th' },
    { value: 16, label: '16th' },
  ];

  // Colors based on theme
  const trackColor = 'var(--ui-surface-4)';
  const thumbBorderColor = 'var(--ui-surface-2)';

  return (
    <div className={`absolute top-full left-0 mt-1 rounded-lg shadow-xl w-80 p-5 border z-50 ${
      isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
    }`}>
      {/* Frequency Selection */}
      <div className="mb-5">
        <div id="metronome-frequency-label" className={`text-sm mb-2 block font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          Metronome
        </div>
        <div role="group" aria-labelledby="metronome-frequency-label" className="flex gap-2">
          {frequencyOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onFrequencyChange(option.value)}
              aria-pressed={config.frequency === option.value}
              className={`flex-1 min-h-10 py-2 px-3 rounded text-sm font-medium transition-colors ${
                config.frequency === option.value
                  ? 'bg-brass hover:bg-brass-hover text-brass-ink underline underline-offset-4'
                  : isDark
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Volume Slider */}
      <div className="mb-5">
        <label htmlFor="metronome-volume" className={`text-sm mb-2 block font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          Volume: <span className={`font-semibold tabular-nums text-brass-text`}>{Math.round(config.volume)}%</span>
        </label>
        <input
          type="range"
          id="metronome-volume"
          name="metronomeVolume"
          aria-label="Metronome volume"
          min="0"
          max="100"
          value={config.volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer metronome-slider"
          style={{
            background: `linear-gradient(to right, var(--ui-brass) 0%, var(--ui-brass) ${config.volume}%, ${trackColor} ${config.volume}%, ${trackColor} 100%)`
          }}
        />
      </div>

      {/* Checkboxes */}
      <div className={`space-y-3 pt-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="metronomeSolo"
            checked={config.solo}
            onChange={(e) => onSoloChange(e.target.checked)}
            className="w-4 h-4 accent-purple-500 cursor-pointer"
          />
          <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Solo (mute drums)</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="metronomeCountIn"
            checked={config.countIn}
            onChange={(e) => onCountInChange(e.target.checked)}
            className="w-4 h-4 accent-purple-500 cursor-pointer"
          />
          <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Count-in (4 beats before start)</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="metronomeOffsetClick"
            checked={config.offsetClick !== '1'}
            onChange={(e) => onOffsetClickChange(e.target.checked ? 'AND' : '1')}
            className="w-4 h-4 accent-purple-500 cursor-pointer"
          />
          <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Offset click (on off-beats)</span>
        </label>
      </div>

      {/* Done button */}
      <div className="flex justify-center mt-5">
        <Button
          onClick={onClose}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-2 rounded-md text-sm font-medium"
        >
          Done
        </Button>
      </div>

      <style>{`
        .metronome-slider::-webkit-slider-thumb {
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--ui-brass);
          cursor: pointer;
          border: 2px solid ${thumbBorderColor};
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .metronome-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--ui-brass);
          cursor: pointer;
          border: 2px solid ${thumbBorderColor};
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
}

