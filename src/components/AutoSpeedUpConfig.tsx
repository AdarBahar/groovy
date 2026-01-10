import { AutoSpeedUpConfig as Config } from '../types';
import './AutoSpeedUpConfig.css';

interface AutoSpeedUpConfigProps {
  config: Config;
  onConfigChange: (config: Config) => void;
  onSaveAsDefault: () => void;
  onClose: () => void;
}

/**
 * Configuration panel for Auto Speed Up feature
 */
function AutoSpeedUpConfig({
  config,
  onConfigChange,
  onSaveAsDefault,
  onClose,
}: AutoSpeedUpConfigProps) {
  const handleStepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange({ ...config, stepBpm: Number(e.target.value) });
  };

  const handleIntervalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange({ ...config, intervalMinutes: Number(e.target.value) });
  };

  const handleKeepGoingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onConfigChange({ ...config, keepGoing: e.target.checked });
  };

  return (
    <div className="auto-speed-up-config">
      <div className="config-header">
        <h3>⏫ Auto Speed Up</h3>
        <button className="close-button" onClick={onClose} title="Close">
          ✕
        </button>
      </div>

      <div className="config-body">
        <div className="config-field">
          <label htmlFor="step-bpm">
            Increase by: <strong>{config.stepBpm} BPM</strong>
          </label>
          <input
            id="step-bpm"
            type="range"
            min="1"
            max="20"
            value={config.stepBpm}
            onChange={handleStepChange}
          />
          <div className="range-labels">
            <span>1</span>
            <span>20</span>
          </div>
        </div>

        <div className="config-field">
          <label htmlFor="interval">
            Every: <strong>{config.intervalMinutes} minute{config.intervalMinutes !== 1 ? 's' : ''}</strong>
          </label>
          <input
            id="interval"
            type="range"
            min="1"
            max="10"
            value={config.intervalMinutes}
            onChange={handleIntervalChange}
          />
          <div className="range-labels">
            <span>1 min</span>
            <span>10 min</span>
          </div>
        </div>

        <div className="config-field checkbox-field">
          <label>
            <input
              type="checkbox"
              checked={config.keepGoing}
              onChange={handleKeepGoingChange}
            />
            <span>Keep increasing (no limit)</span>
          </label>
        </div>
      </div>

      <div className="config-footer">
        <button className="save-default-button" onClick={onSaveAsDefault}>
          💾 Save as Default
        </button>
      </div>
    </div>
  );
}

export default AutoSpeedUpConfig;

