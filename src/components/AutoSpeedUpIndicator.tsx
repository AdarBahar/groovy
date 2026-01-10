import { AutoSpeedUpConfig, AutoSpeedUpState } from '../types';
import './AutoSpeedUpIndicator.css';

interface AutoSpeedUpIndicatorProps {
  config: AutoSpeedUpConfig;
  state: AutoSpeedUpState;
  currentTempo: number;
}

/**
 * Format milliseconds as M:SS
 */
function formatTime(ms: number): string {
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Indicator showing Auto Speed Up status
 */
function AutoSpeedUpIndicator({
  config,
  state,
  currentTempo,
}: AutoSpeedUpIndicatorProps) {
  if (!state.isActive) {
    return null;
  }

  const nextTempo = Math.min(currentTempo + config.stepBpm, 300);

  return (
    <div className="auto-speed-up-indicator">
      <span className="indicator-icon">⏫</span>
      <span className="indicator-text">
        Auto Speed Up: <strong>+{config.stepBpm} BPM</strong> every{' '}
        <strong>{config.intervalMinutes}m</strong>
      </span>
      <span className="indicator-divider">—</span>
      <span className="indicator-countdown">
        Next in <strong>{formatTime(state.timeRemaining)}</strong> →{' '}
        <strong>{nextTempo} BPM</strong>
      </span>
      {state.totalIncreased > 0 && (
        <span className="indicator-total">
          (↑{state.totalIncreased} from {state.baseTempo})
        </span>
      )}
    </div>
  );
}

export default AutoSpeedUpIndicator;

