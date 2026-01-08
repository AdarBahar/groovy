import { useState, useEffect } from 'react';
import './SyncOffsetControl.css';

const STORAGE_KEY = 'groovy-sync-offset';
const STORAGE_KEY_ENABLED = 'groovy-sync-offset-enabled';
const DEFAULT_OFFSET = 0;
const MIN_OFFSET = -200;
const MAX_OFFSET = 200;

interface SyncOffsetControlProps {
  offset: number;
  onOffsetChange: (offset: number) => void;
}

/**
 * Load sync offset from localStorage
 */
export function loadSyncOffset(): number {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const value = parseInt(stored, 10);
      if (!isNaN(value) && value >= MIN_OFFSET && value <= MAX_OFFSET) {
        // Check if enabled
        const enabled = localStorage.getItem(STORAGE_KEY_ENABLED);
        if (enabled === 'false') {
          return DEFAULT_OFFSET; // Return 0 if disabled
        }
        return value;
      }
    }
  } catch {
    // Ignore localStorage errors
  }
  return DEFAULT_OFFSET;
}

/**
 * Load enabled state from localStorage
 */
export function loadSyncOffsetEnabled(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_ENABLED);
    return stored !== 'false';
  } catch {
    return true;
  }
}

/**
 * Save sync offset to localStorage
 */
export function saveSyncOffset(offset: number, enabled: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(offset));
    localStorage.setItem(STORAGE_KEY_ENABLED, String(enabled));
  } catch {
    // Ignore localStorage errors
  }
}

/**
 * Slider control for adjusting audio/visual sync offset
 */
function SyncOffsetControl({ offset, onOffsetChange }: SyncOffsetControlProps) {
  const [localValue, setLocalValue] = useState(() => {
    // Load the stored value (not the effective offset which may be 0 if disabled)
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const value = parseInt(stored, 10);
        if (!isNaN(value) && value >= MIN_OFFSET && value <= MAX_OFFSET) {
          return value;
        }
      }
    } catch {
      // Ignore
    }
    return offset;
  });
  const [isEnabled, setIsEnabled] = useState(loadSyncOffsetEnabled);

  // Sync local value with prop only if enabled
  useEffect(() => {
    if (isEnabled) {
      setLocalValue(offset);
    }
  }, [offset, isEnabled]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    setLocalValue(value);
  };

  const handleSliderRelease = () => {
    if (isEnabled) {
      onOffsetChange(localValue);
    }
    saveSyncOffset(localValue, isEnabled);
  };

  const handleReset = () => {
    setLocalValue(DEFAULT_OFFSET);
    if (isEnabled) {
      onOffsetChange(DEFAULT_OFFSET);
    }
    saveSyncOffset(DEFAULT_OFFSET, isEnabled);
  };

  const handleToggleEnabled = () => {
    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);
    if (newEnabled) {
      // Re-enable: apply the stored value
      onOffsetChange(localValue);
    } else {
      // Disable: apply 0
      onOffsetChange(DEFAULT_OFFSET);
    }
    saveSyncOffset(localValue, newEnabled);
  };

  return (
    <div className={`sync-offset-control ${!isEnabled ? 'disabled' : ''}`}>
      <label className="sync-offset-label">
        <span className="sync-offset-title">A/V Sync</span>
        <span className="sync-offset-value">
          {isEnabled ? (localValue > 0 ? '+' : '') + localValue + 'ms' : 'OFF'}
        </span>
      </label>
      <div className="sync-offset-slider-row">
        <span className="sync-offset-bound">-{Math.abs(MIN_OFFSET)}</span>
        <input
          type="range"
          min={MIN_OFFSET}
          max={MAX_OFFSET}
          step={5}
          value={localValue}
          onChange={handleSliderChange}
          onMouseUp={handleSliderRelease}
          onTouchEnd={handleSliderRelease}
          className="sync-offset-slider"
          disabled={!isEnabled}
          aria-label="Audio/Visual sync offset in milliseconds"
        />
        <span className="sync-offset-bound">+{MAX_OFFSET}</span>
        <button
          className="sync-offset-reset"
          onClick={handleReset}
          disabled={!isEnabled}
          title="Reset to 0"
          aria-label="Reset sync offset to zero"
        >
          ↺
        </button>
        <button
          className={`sync-offset-toggle ${isEnabled ? 'enabled' : ''}`}
          onClick={handleToggleEnabled}
          title={isEnabled ? 'Disable sync offset' : 'Enable sync offset'}
          aria-label={isEnabled ? 'Disable sync offset' : 'Enable sync offset'}
        >
          {isEnabled ? '✓' : '✗'}
        </button>
      </div>
      <p className="sync-offset-hint">
        + delays visual, − advances visual
      </p>
    </div>
  );
}

export default SyncOffsetControl;

