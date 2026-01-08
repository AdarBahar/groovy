import { Division } from '../../types';
import { GrooveUtils } from '../../core';
import './TempoControl.css';

interface TempoControlProps {
  tempo: number;
  swing: number;
  division: Division;
  onTempoChange: (tempo: number) => void;
  onSwingChange: (swing: number) => void;
}

function TempoControl({ tempo, swing, division, onTempoChange, onSwingChange }: TempoControlProps) {
  const swingSupported = GrooveUtils.doesDivisionSupportSwing(division);
  const swingDisabledReason = GrooveUtils.isTripletDivision(division)
    ? 'Triplet divisions already have a triplet feel'
    : 'Quarter notes are too coarse for swing';

  return (
    <div className="tempo-control">
      <div className="control-group">
        <label htmlFor="tempo">
          Tempo: <strong>{tempo} BPM</strong>
        </label>
        <input
          id="tempo"
          type="range"
          min="40"
          max="240"
          value={tempo}
          onChange={(e) => onTempoChange(Number(e.target.value))}
        />
      </div>

      <div className="control-group">
        <label htmlFor="swing">
          Swing: <strong>{swingSupported ? `${swing}%` : 'N/A'}</strong>
          {!swingSupported && (
            <span className="swing-disabled-note" title={swingDisabledReason}>
              {' '}(Not available)
            </span>
          )}
        </label>
        <input
          id="swing"
          type="range"
          min="0"
          max="60"
          value={swing}
          onChange={(e) => onSwingChange(Number(e.target.value))}
          disabled={!swingSupported}
          className={!swingSupported ? 'disabled' : ''}
        />
        <div className="swing-labels">
          <span>Straight</span>
          <span>Shuffle</span>
        </div>
      </div>
    </div>
  );
}

export default TempoControl;

