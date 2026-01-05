import { Division, TimeSignature } from '../../types';
import { GrooveUtils } from '../../core';
import './DivisionSelector.css';

interface DivisionSelectorProps {
  division: Division;
  timeSignature: TimeSignature;
  onDivisionChange: (div: Division) => void;
}

function DivisionSelector({ division, timeSignature, onDivisionChange }: DivisionSelectorProps) {
  const compatibleDivisions = GrooveUtils.getCompatibleDivisions(
    timeSignature.beats,
    timeSignature.noteValue
  );

  // UI divisions (excluding quarter notes which have no UI button per spec)
  const uiDivisions: Division[] = [8, 16, 32, 12, 24, 48];
  
  const handleDivisionClick = (div: Division) => {
    const isCompatible = compatibleDivisions.includes(div);
    if (isCompatible) {
      onDivisionChange(div);
    }
  };

  return (
    <div className="division-selector">
      <div className="division-label">Note Division:</div>
      <div className="division-buttons">
        {uiDivisions.map(div => {
          const info = GrooveUtils.getDivisionInfo(div, timeSignature.beats, timeSignature.noteValue);
          const isCompatible = compatibleDivisions.includes(div);
          const isActive = division === div;
          
          const incompatibleReason = !isCompatible
            ? GrooveUtils.isTripletDivision(div)
              ? `Triplets only work in x/4 time (current: ${timeSignature.beats}/${timeSignature.noteValue})`
              : `Would create fractional notes in ${timeSignature.beats}/${timeSignature.noteValue} time`
            : '';
          
          return (
            <button
              key={div}
              className={`division-btn ${isActive ? 'active' : ''} ${!isCompatible ? 'disabled' : ''} ${info.type === 'triplet' ? 'triplet' : ''}`}
              onClick={() => handleDivisionClick(div)}
              disabled={!isCompatible}
              title={isCompatible ? `${info.label} (${info.notesPerMeasure} notes per measure)` : incompatibleReason}
            >
              <span className="division-label-text">{info.label}</span>
              {isActive && (
                <div className="division-info-active">
                  <span className="notes-count">{info.notesPerMeasure} notes</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {division && (
        <div className="division-current-info">
          <div className="info-row">
            <span className="info-label">Current:</span>
            <span className="info-value">{GrooveUtils.getDivisionInfo(division, timeSignature.beats, timeSignature.noteValue).label}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Notes per measure:</span>
            <span className="info-value">{GrooveUtils.getDivisionInfo(division, timeSignature.beats, timeSignature.noteValue).notesPerMeasure}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Type:</span>
            <span className="info-value">
              {GrooveUtils.isTripletDivision(division) ? '🎵 Triplet' : '📏 Straight'}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Swing:</span>
            <span className="info-value">
              {GrooveUtils.doesDivisionSupportSwing(division) ? '✅ Supported' : '❌ Not available'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

export default DivisionSelector;

