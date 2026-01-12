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
}: MetronomeOptionsMenuProps) {
  const { isDark } = useTheme();

  if (!isOpen) return null;

  const frequencyOptions: { value: MetronomeFrequency; label: string }[] = [
    { value: 0, label: 'OFF' },
    { value: 4, label: '4th' },
    { value: 8, label: '8th' },
    { value: 16, label: '16th' },
  ];

  // Colors based on theme
  const trackColor = isDark ? '#334155' : '#cbd5e1';
  const thumbBorderColor = isDark ? '#1e293b' : '#ffffff';

  return (
    <div className={`absolute top-full left-0 mt-1 rounded-lg shadow-xl w-80 p-5 border z-50 ${
      isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
    }`}>
      {/* Frequency Selection */}
      <div className="mb-5">
        <label className={`text-sm mb-2 block font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          Metronome
        </label>
        <div className="flex gap-2">
          {frequencyOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onFrequencyChange(option.value)}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                config.frequency === option.value
                  ? 'bg-purple-600 text-white'
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
        <label className={`text-sm mb-2 block font-medium ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          Volume: <span className={`font-semibold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{Math.round(config.volume)}%</span>
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={config.volume}
          onChange={(e) => onVolumeChange(Number(e.target.value))}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer metronome-slider"
          style={{
            background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${config.volume}%, ${trackColor} ${config.volume}%, ${trackColor} 100%)`
          }}
        />
      </div>

      {/* Checkboxes */}
      <div className={`space-y-3 pt-4 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={config.solo}
            onChange={(e) => onSoloChange(e.target.checked)}
            className="w-4 h-4 accent-purple-500 cursor-pointer"
          />
          <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Solo (mute drums)</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={config.countIn}
            onChange={(e) => onCountInChange(e.target.checked)}
            className="w-4 h-4 accent-purple-500 cursor-pointer"
          />
          <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Count-in (4 beats before start)</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
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
          className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-2 rounded text-sm font-medium uppercase"
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
          background: #a855f7;
          cursor: pointer;
          border: 2px solid ${thumbBorderColor};
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .metronome-slider::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #a855f7;
          cursor: pointer;
          border: 2px solid ${thumbBorderColor};
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
      `}</style>
    </div>
  );
}

