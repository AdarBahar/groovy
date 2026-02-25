import './PlaybackControls.css';

interface PlaybackControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPlayWithSpeedUp?: () => void;
  isAutoSpeedUpActive?: boolean;
  onConfigureSpeedUp?: () => void;
}

function PlaybackControls({
  isPlaying,
  onPlay,
  onPlayWithSpeedUp,
  isAutoSpeedUpActive = false,
  onConfigureSpeedUp,
}: PlaybackControlsProps) {
  return (
    <div className="playback-controls">
      <button
        className={`play-button ${isPlaying && !isAutoSpeedUpActive ? 'playing' : ''}`}
        onClick={onPlay}
        title="Play/Pause"
        aria-label="Play or pause groove"
      >
        {isPlaying ? '⏸ Pause' : '▶ Play'}
      </button>

      {onPlayWithSpeedUp && (
        <div className="play-plus-container">
          <button
            className={`play-plus-button ${isPlaying && isAutoSpeedUpActive ? 'active' : ''}`}
            onClick={onPlayWithSpeedUp}
            title="Play with Auto Speed Up"
            aria-label="Play groove with automatic speed increase"
          >
            {isPlaying && isAutoSpeedUpActive ? '⏸ Stop' : '▶+ Speed Up'}
          </button>
          {onConfigureSpeedUp && (
            <button
              className="speed-up-config-button"
              onClick={onConfigureSpeedUp}
              title="Configure Auto Speed Up"
              aria-label="Configure auto speed up settings"
            >
              ⚙
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default PlaybackControls;

