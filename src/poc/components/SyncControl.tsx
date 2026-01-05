import { SyncMode } from '../../core';
import './SyncControl.css';

interface SyncControlProps {
  syncMode: SyncMode;
  onSyncModeChange: (mode: SyncMode) => void;
}

function SyncControl({ syncMode, onSyncModeChange }: SyncControlProps) {
  return (
    <div className="sync-control">
      <label className="control-label">
        <span className="label-text">Visual Sync</span>
        <span className="label-hint">When to show visual highlight</span>
      </label>
      
      <div className="sync-buttons">
        <button
          className={`sync-button ${syncMode === 'start' ? 'active' : ''}`}
          onClick={() => onSyncModeChange('start')}
          title="Visual appears at the start of the beat"
        >
          <span className="sync-icon">◀</span>
          <span className="sync-label">Start</span>
        </button>
        
        <button
          className={`sync-button ${syncMode === 'middle' ? 'active' : ''}`}
          onClick={() => onSyncModeChange('middle')}
          title="Visual appears in the middle of the beat (default)"
        >
          <span className="sync-icon">●</span>
          <span className="sync-label">Middle</span>
        </button>
        
        <button
          className={`sync-button ${syncMode === 'end' ? 'active' : ''}`}
          onClick={() => onSyncModeChange('end')}
          title="Visual appears at the end of the beat"
        >
          <span className="sync-icon">▶</span>
          <span className="sync-label">End</span>
        </button>
      </div>
      
      <div className="sync-description">
        {syncMode === 'start' && (
          <p>Visual moves to next position when sound plays</p>
        )}
        {syncMode === 'middle' && (
          <p>Visual moves halfway before sound (centered)</p>
        )}
        {syncMode === 'end' && (
          <p>Visual moves one beat ahead of sound</p>
        )}
      </div>
    </div>
  );
}

export default SyncControl;

