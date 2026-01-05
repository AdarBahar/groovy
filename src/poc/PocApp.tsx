import { useState } from 'react';
import { GrooveData, DEFAULT_GROOVE, DrumVoice } from '../types';
import { SyncMode } from '../core';
import { useGrooveEngine } from '../hooks/useGrooveEngine';
import DrumGrid from './components/DrumGrid';
import PlaybackControls from './components/PlaybackControls';
import TempoControl from './components/TempoControl';
import PresetSelector from './components/PresetSelector';
import SyncControl from './components/SyncControl';
import './PocApp.css';

function App() {
  const [groove, setGroove] = useState<GrooveData>(DEFAULT_GROOVE);
  const [syncMode, setSyncMode] = useState<SyncMode>('middle');

  // Use the GrooveEngine hook (this is the ONLY React-specific integration)
  const {
    isPlaying,
    currentPosition,
    hasPendingChanges,
    togglePlayback,
    updateGroove,
    setSyncMode: setEngineSyncMode,
    playPreview,
  } = useGrooveEngine();

  const handleNoteToggle = (voice: DrumVoice, position: number) => {
    const newGroove = {
      ...groove,
      notes: {
        ...groove.notes,
        [voice]: groove.notes[voice].map((note, i) => (i === position ? !note : note)),
      },
    };
    setGroove(newGroove);
    updateGroove(newGroove);
  };

  const handlePlay = async () => {
    await togglePlayback(groove);
  };

  const handleTempoChange = (tempo: number) => {
    const newGroove = { ...groove, tempo };
    setGroove(newGroove);
    updateGroove(newGroove);
  };

  const handleSwingChange = (swing: number) => {
    const newGroove = { ...groove, swing };
    setGroove(newGroove);
    updateGroove(newGroove);
  };

  const handlePresetChange = (preset: GrooveData) => {
    setGroove(preset);
    updateGroove(preset);
  };

  const handlePreview = async (voice: DrumVoice) => {
    await playPreview(voice);
  };

  const handleSyncModeChange = (mode: SyncMode) => {
    setSyncMode(mode);
    setEngineSyncMode(mode);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🥁 GrooveScribe POC</h1>
        <p className="subtitle">Drum Timing & Sound Test</p>
      </header>

      <main className="main">
        <section className="controls-section">
          <PresetSelector onPresetChange={handlePresetChange} />

          <TempoControl
            tempo={groove.tempo}
            swing={groove.swing}
            onTempoChange={handleTempoChange}
            onSwingChange={handleSwingChange}
          />

          <SyncControl
            syncMode={syncMode}
            onSyncModeChange={handleSyncModeChange}
          />

          <PlaybackControls
            isPlaying={isPlaying}
            onPlay={handlePlay}
          />
        </section>

        <section className="grid-section">
          <DrumGrid
            groove={groove}
            currentPosition={currentPosition}
            onNoteToggle={handleNoteToggle}
            onPreview={handlePreview}
          />
        </section>

        <section className="info-section">
          <div className="info-card">
            <h3>Test Objectives</h3>
            <ul>
              <li>✓ Verify drum timing accuracy at different BPMs</li>
              <li>✓ Test swing feel (0% = straight, 100% = triplet)</li>
              <li>✓ Confirm drum sounds are distinct and clear</li>
              <li>✓ Check synchronization between voices</li>
            </ul>
          </div>

          <div className="info-card">
            <h3>Current Settings</h3>
            <ul>
              <li><strong>Tempo:</strong> {groove.tempo} BPM</li>
              <li><strong>Swing:</strong> {groove.swing}%</li>
              <li><strong>Division:</strong> {groove.division}th notes</li>
              <li><strong>Time Signature:</strong> {groove.timeSignature.beats}/{groove.timeSignature.noteValue}</li>
            </ul>
          </div>

          <div className="info-card">
            <h3>Instructions</h3>
            <ul>
              <li>Click cells to toggle drum hits</li>
              <li>Click voice labels to preview sounds</li>
              <li>Use presets to test different patterns</li>
              <li>Adjust tempo and swing to test timing</li>
              <li><strong>New:</strong> Changes during playback apply on next loop! 🔄</li>
            </ul>
          </div>

          {isPlaying && hasPendingChanges && (
            <div className="info-card" style={{ background: '#fff3cd', borderColor: '#ffc107' }}>
              <h3>⏳ Changes Pending</h3>
              <p>Your changes will take effect at the start of the next loop.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;

