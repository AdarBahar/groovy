import { DrumVoice } from '../../types';
import { getArticulationMeta } from '../../core';
import './NoteIcon.css';

interface NoteIconProps {
  voices: DrumVoice[];
  isActive: boolean;
  isCurrent?: boolean;
}

/**
 * Renders articulation-specific icons for drum notes
 * Supports layered icons for complex articulations
 */
function NoteIcon({ voices, isActive, isCurrent = false }: NoteIconProps) {
  if (!isActive || voices.length === 0) {
    return null;
  }

  // Get metadata for all active voices
  const metas = voices.map(voice => getArticulationMeta(voice));

  // Determine primary icon (first voice)
  const primaryMeta = metas[0];

  // Check if icon is FontAwesome or emoji/text
  const isFontAwesome = primaryMeta.icon?.startsWith('fa-');

  const containerClass = `note-icon-container${isCurrent ? ' playing' : ''}`;

  return (
    <div className={containerClass}>
      {/* Primary icon */}
      {isFontAwesome ? (
        <i className={`fa ${primaryMeta.icon} note-icon primary-icon`} aria-hidden="true"></i>
      ) : (
        <span className="note-icon primary-icon text-icon">{primaryMeta.icon}</span>
      )}

      {/* Additional layered icons for complex articulations */}
      {metas.slice(1).map((meta, index) => {
        const isFA = meta.icon?.startsWith('fa-');
        return isFA ? (
          <i
            key={index}
            className={`fa ${meta.icon} note-icon layered-icon layer-${index + 1}`}
            aria-hidden="true"
          ></i>
        ) : (
          <span key={index} className={`note-icon layered-icon layer-${index + 1} text-icon`}>
            {meta.icon}
          </span>
        );
      })}
    </div>
  );
}

export default NoteIcon;

