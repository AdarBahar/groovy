import './TempoControl.css';

interface TempoControlProps {
  tempo: number;
  swing: number;
  onTempoChange: (tempo: number) => void;
  onSwingChange: (swing: number) => void;
}

function TempoControl({ tempo, swing, onTempoChange, onSwingChange }: TempoControlProps) {
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
          Swing: <strong>{swing}%</strong>
        </label>
        <input
          id="swing"
          type="range"
          min="0"
          max="100"
          value={swing}
          onChange={(e) => onSwingChange(Number(e.target.value))}
        />
        <div className="swing-labels">
          <span>Straight</span>
          <span>Triplet</span>
        </div>
      </div>
    </div>
  );
}

export default TempoControl;

