import { Button } from '../ui/button';
import { AutoSpeedUpConfig } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';

interface AutoSpeedUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: AutoSpeedUpConfig;
  onConfigChange: (config: AutoSpeedUpConfig) => void;
  onSaveAsDefault: () => void;
}

export function AutoSpeedUpModal({
  isOpen,
  onClose,
  config,
  onConfigChange,
  onSaveAsDefault,
}: AutoSpeedUpModalProps) {
  const { isDark } = useTheme();

  if (!isOpen) return null;

  const bpmSpeedUp = config.stepBpm;
  const minutesInterval = config.intervalMinutes;

  const handleBpmChange = (value: number) => {
    onConfigChange({ ...config, stepBpm: value });
  };

  const handleIntervalChange = (value: number) => {
    onConfigChange({ ...config, intervalMinutes: value });
  };

  const handleSaveAndClose = () => {
    onSaveAsDefault();
    onClose();
  };

  // Colors based on theme
  const trackColor = isDark ? '#334155' : '#cbd5e1';
  const thumbBorderColor = isDark ? '#1e293b' : '#ffffff';

  return (
    <div className={`absolute top-full right-0 mt-1 rounded-lg shadow-xl w-[calc(100vw-2rem)] sm:w-96 max-w-96 p-4 sm:p-6 border z-50 ${
      isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
    }`}>
      {/* Title */}
      <h2 className={`text-lg font-semibold mb-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
        Speed up by <span className={`font-bold text-xl ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{bpmSpeedUp}</span> BPM every{' '}
        <span className={`font-bold text-xl ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{minutesInterval}</span> minute{minutesInterval !== 1 ? 's' : ''}
      </h2>

      {/* Amount in BPM */}
      <div className="mb-6">
        <label className={`text-sm mb-3 block ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          BPM speed up: <span className={`font-semibold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{bpmSpeedUp}</span>
        </label>
        <div className="relative">
          <input
            type="range"
            min="1"
            max="20"
            value={bpmSpeedUp}
            onChange={(e) => handleBpmChange(Number(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer auto-speed-slider"
            style={{
              background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${((bpmSpeedUp - 1) / 19) * 100}%, ${trackColor} ${((bpmSpeedUp - 1) / 19) * 100}%, ${trackColor} 100%)`
            }}
          />
        </div>
      </div>

      {/* Interval in Minutes */}
      <div className="mb-6">
        <label className={`text-sm mb-3 block ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
          Every (minutes): <span className={`font-semibold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{minutesInterval}</span>
        </label>
        <div className="relative">
          <input
            type="range"
            min="1"
            max="10"
            value={minutesInterval}
            onChange={(e) => handleIntervalChange(Number(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer auto-speed-slider"
            style={{
              background: `linear-gradient(to right, #a855f7 0%, #a855f7 ${((minutesInterval - 1) / 9) * 100}%, ${trackColor} ${((minutesInterval - 1) / 9) * 100}%, ${trackColor} 100%)`
            }}
          />
        </div>
      </div>

      {/* Set as default checkbox */}
      <div className={`mb-6 pt-2 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
        <label className="flex items-center gap-2 cursor-pointer mt-4">
          <input
            type="checkbox"
            checked={config.keepGoing}
            onChange={(e) => onConfigChange({ ...config, keepGoing: e.target.checked })}
            className="w-4 h-4 accent-purple-500 cursor-pointer"
          />
          <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>Keep increasing (no limit)</span>
        </label>
      </div>

      {/* Done button */}
      <div className="flex justify-center">
        <Button
          onClick={handleSaveAndClose}
          className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-3 sm:py-2 rounded text-sm font-medium uppercase touch-target"
        >
          Done
        </Button>
      </div>

      <style>{`
        .auto-speed-slider::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #a855f7;
          cursor: pointer;
          border: 2px solid ${thumbBorderColor};
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        .auto-speed-slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #a855f7;
          cursor: pointer;
          border: 2px solid ${thumbBorderColor};
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        @media (min-width: 640px) {
          .auto-speed-slider::-webkit-slider-thumb {
            width: 18px;
            height: 18px;
          }
          .auto-speed-slider::-moz-range-thumb {
            width: 18px;
            height: 18px;
          }
        }
      `}</style>
    </div>
  );
}

