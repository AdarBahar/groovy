import { GrooveData, DrumVoice, createEmptyNotesRecord, createMeasureFromNotes } from '../types';
import './PresetSelector.css';

interface PresetSelectorProps {
  onPresetChange: (preset: GrooveData) => void;
}

// Helper to create a preset with only specific voices filled
const createPreset = (
  tempo: number,
  swing: number,
  voices: Partial<Record<DrumVoice, boolean[]>>
): GrooveData => {
  const notes = {
    ...createEmptyNotesRecord(16),
    ...voices,
  };
  return {
    timeSignature: { beats: 4, noteValue: 4 },
    division: 16,
    tempo,
    swing,
    measures: [createMeasureFromNotes(notes)],
  };
};

const PRESETS: Record<string, GrooveData> = {
  'Basic Rock': createPreset(120, 0, {
    'hihat-closed': [
      true, false, true, false,
      true, false, true, false,
      true, false, true, false,
      true, false, true, false,
    ],
    'snare-normal': [
      false, false, false, false,
      true, false, false, false,
      false, false, false, false,
      true, false, false, false,
    ],
    'kick': [
      true, false, false, false,
      false, false, false, false,
      true, false, false, false,
      false, false, false, false,
    ],
  }),
  'Four on Floor': createPreset(128, 0, {
    'hihat-closed': [
      true, false, true, false,
      true, false, true, false,
      true, false, true, false,
      true, false, true, false,
    ],
    'snare-normal': [
      false, false, false, false,
      true, false, false, false,
      false, false, false, false,
      true, false, false, false,
    ],
    'kick': [
      true, false, false, false,
      true, false, false, false,
      true, false, false, false,
      true, false, false, false,
    ],
  }),
  'Shuffle': createPreset(100, 66, {
    'hihat-closed': [
      true, false, true, false,
      true, false, true, false,
      true, false, true, false,
      true, false, true, false,
    ],
    'snare-normal': [
      false, false, false, false,
      true, false, false, false,
      false, false, false, false,
      true, false, false, false,
    ],
    'kick': [
      true, false, false, false,
      false, false, true, false,
      false, false, true, false,
      false, false, false, false,
    ],
  }),
  'Motown': createPreset(110, 0, {
    'hihat-closed': [
      true, false, true, false,
      true, false, true, false,
      true, false, true, false,
      true, false, true, false,
    ],
    'snare-normal': [
      false, false, false, false,
      true, false, false, true,
      false, false, false, false,
      true, false, false, true,
    ],
    'kick': [
      true, false, false, false,
      false, false, true, false,
      false, true, false, false,
      false, false, true, false,
    ],
  }),
};

function PresetSelector({ onPresetChange }: PresetSelectorProps) {
  return (
    <div className="preset-selector">
      <label htmlFor="preset">Preset:</label>
      <select
        id="preset"
        onChange={(e) => {
          const preset = PRESETS[e.target.value];
          if (preset) {
            onPresetChange(preset);
          }
        }}
      >
        <option value="">Select a preset...</option>
        {Object.keys(PRESETS).map((name) => (
          <option key={name} value={name}>
            {name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default PresetSelector;

