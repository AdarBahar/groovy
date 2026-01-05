import './PlaybackControls.css';

interface PlaybackControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
}

function PlaybackControls({ isPlaying, onPlay }: PlaybackControlsProps) {
  return (
    <div className="playback-controls">
      <button className={`play-button ${isPlaying ? 'playing' : ''}`} onClick={onPlay}>
        {isPlaying ? '⏸ Pause' : '▶ Play'}
      </button>
    </div>
  );
}

export default PlaybackControls;

