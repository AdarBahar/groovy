import { useState } from 'react';
import { TimeSignature } from '../../types';
import './TimeSignatureSelector.css';

interface TimeSignatureSelectorProps {
  timeSignature: TimeSignature;
  onTimeSignatureChange: (ts: TimeSignature) => void;
}

function TimeSignatureSelector({ timeSignature, onTimeSignatureChange }: TimeSignatureSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempBeats, setTempBeats] = useState(timeSignature.beats);
  const [tempNoteValue, setTempNoteValue] = useState(timeSignature.noteValue);

  const handleOpen = () => {
    setTempBeats(timeSignature.beats);
    setTempNoteValue(timeSignature.noteValue);
    setIsOpen(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  const handleApply = () => {
    onTimeSignatureChange({
      beats: tempBeats,
      noteValue: tempNoteValue,
    });
    setIsOpen(false);
  };

  // Generate beat options (2-15)
  const beatOptions = Array.from({ length: 14 }, (_, i) => i + 2);

  return (
    <div className="time-signature-selector">
      <div className="selector-label">Time Signature:</div>
      <button onClick={handleOpen} className="time-sig-button" title="Click to change time signature">
        <sup>{timeSignature.beats}</sup>
        <span className="slash">/</span>
        <sub>{timeSignature.noteValue}</sub>
      </button>

      {isOpen && (
        <>
          <div className="popup-overlay" onClick={handleCancel} />
          <div className="time-sig-popup">
            <div className="popup-header">Choose Time Signature</div>
            
            <div className="popup-controls">
              <select 
                value={tempBeats} 
                onChange={(e) => setTempBeats(Number(e.target.value))}
                className="beats-select"
              >
                {beatOptions.map(n => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
              
              <span className="popup-slash">/</span>
              
              <select 
                value={tempNoteValue} 
                onChange={(e) => setTempNoteValue(Number(e.target.value) as 4 | 8 | 16)}
                className="note-value-select"
              >
                <option value={4}>4</option>
                <option value={8}>8</option>
                <option value={16}>16</option>
              </select>
            </div>

            <div className="popup-info">
              <div className="info-text">
                <strong>{tempBeats}/{tempNoteValue}</strong> time signature
              </div>
              <div className="info-subtext">
                {tempBeats} {tempNoteValue === 4 ? 'quarter' : tempNoteValue === 8 ? 'eighth' : 'sixteenth'} notes per measure
              </div>
            </div>

            <div className="popup-buttons">
              <button onClick={handleCancel} className="cancel-button">Cancel</button>
              <button onClick={handleApply} className="apply-button">Apply</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default TimeSignatureSelector;

