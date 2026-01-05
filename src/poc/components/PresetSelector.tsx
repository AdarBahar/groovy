import { GrooveData } from '../../types';
import './PresetSelector.css';

interface PresetSelectorProps {
  onPresetChange: (preset: GrooveData) => void;
}

const PRESETS: Record<string, GrooveData> = {
  'Basic Rock': {
    timeSignature: { beats: 4, noteValue: 4 },
    division: 16,
    tempo: 120,
    swing: 0,
    notes: {
      hihat: [
        true, false, true, false,
        true, false, true, false,
        true, false, true, false,
        true, false, true, false,
      ],
      snare: [
        false, false, false, false,
        true, false, false, false,
        false, false, false, false,
        true, false, false, false,
      ],
      kick: [
        true, false, false, false,
        false, false, false, false,
        true, false, false, false,
        false, false, false, false,
      ],
    },
  },
  'Four on Floor': {
    timeSignature: { beats: 4, noteValue: 4 },
    division: 16,
    tempo: 128,
    swing: 0,
    notes: {
      hihat: [
        true, false, true, false,
        true, false, true, false,
        true, false, true, false,
        true, false, true, false,
      ],
      snare: [
        false, false, false, false,
        true, false, false, false,
        false, false, false, false,
        true, false, false, false,
      ],
      kick: [
        true, false, false, false,
        true, false, false, false,
        true, false, false, false,
        true, false, false, false,
      ],
    },
  },
  'Shuffle': {
    timeSignature: { beats: 4, noteValue: 4 },
    division: 16,
    tempo: 100,
    swing: 66,
    notes: {
      hihat: [
        true, false, true, false,
        true, false, true, false,
        true, false, true, false,
        true, false, true, false,
      ],
      snare: [
        false, false, false, false,
        true, false, false, false,
        false, false, false, false,
        true, false, false, false,
      ],
      kick: [
        true, false, false, false,
        false, false, true, false,
        false, false, true, false,
        false, false, false, false,
      ],
    },
  },
  'Motown': {
    timeSignature: { beats: 4, noteValue: 4 },
    division: 16,
    tempo: 110,
    swing: 0,
    notes: {
      hihat: [
        true, false, true, false,
        true, false, true, false,
        true, false, true, false,
        true, false, true, false,
      ],
      snare: [
        false, false, false, false,
        true, false, false, true,
        false, false, false, false,
        true, false, false, true,
      ],
      kick: [
        true, false, false, false,
        false, false, true, false,
        false, true, false, false,
        false, false, true, false,
      ],
    },
  },
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

