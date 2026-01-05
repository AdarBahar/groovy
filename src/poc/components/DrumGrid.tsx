import { GrooveData, DrumVoice } from '../../types';
import './DrumGrid.css';

interface DrumGridProps {
  groove: GrooveData;
  currentPosition: number;
  onNoteToggle: (voice: DrumVoice, position: number) => void;
  onPreview: (voice: DrumVoice) => void;
}

const VOICE_LABELS: Record<DrumVoice, string> = {
  hihat: '🎩 Hi-Hat',
  snare: '🥁 Snare',
  kick: '🦶 Kick',
};

function DrumGrid({ groove, currentPosition, onNoteToggle, onPreview }: DrumGridProps) {
  const voices: DrumVoice[] = ['hihat', 'snare', 'kick'];
  const positions = Array.from({ length: groove.division }, (_, i) => i);

  // Determine if a position is a downbeat (every 4th position for 16th notes)
  const isDownbeat = (pos: number) => pos % 4 === 0;

  return (
    <div className="drum-grid">
      <div className="grid-header">
        <div className="voice-label-header">Voice</div>
        {positions.map((pos) => (
          <div
            key={pos}
            className={`beat-label ${isDownbeat(pos) ? 'downbeat' : ''}`}
          >
            {isDownbeat(pos) ? Math.floor(pos / 4) + 1 : ''}
          </div>
        ))}
      </div>

      {voices.map((voice) => (
        <div key={voice} className="drum-row">
          <button
            className="voice-label"
            onClick={() => onPreview(voice)}
            title={`Click to preview ${voice}`}
          >
            {VOICE_LABELS[voice]}
          </button>

          {positions.map((pos) => {
            const isActive = groove.notes[voice][pos];
            const isCurrent = pos === currentPosition;
            const isDown = isDownbeat(pos);

            return (
              <button
                key={pos}
                className={`note-cell ${isActive ? 'active' : ''} ${
                  isCurrent ? 'current' : ''
                } ${isDown ? 'downbeat' : ''}`}
                onClick={() => onNoteToggle(voice, pos)}
                title={`${voice} at position ${pos + 1}`}
              >
                {isActive && <span className="note-dot">●</span>}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default DrumGrid;

