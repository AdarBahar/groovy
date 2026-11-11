import { Play, Square, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { TimeSignature } from '../../types';
import { useMIDITimingAccuracy } from '../../hooks/useMIDITimingAccuracy';
import { useMIDIPerformedBpm } from '../../hooks/useMIDIPerformedBpm';

interface PlaybackControlsProps {
  isPlaying: boolean;
  onPlay: () => void;
  onPlayWithSpeedUp: () => void;
  isAutoSpeedUpActive: boolean;
  timeSignature: TimeSignature;
  tempo: number;
  swing: number;
  onTempoChange: (tempo: number) => void;
  onSwingChange: (swing: number) => void;
  elapsedTime?: string;
  countdownNumber?: number | null;
  countingInButton?: 'play' | 'playPlus' | null;
  midiConnected?: boolean;
  trackingEnabled?: boolean;
  onTrackingToggle?: () => void;
  masterVolume?: number;
  onMasterVolumeChange?: (volume: number) => void;
  isEmbedded?: boolean;
}

export function PlaybackControls({
  isPlaying,
  onPlay,
  onPlayWithSpeedUp,
  isAutoSpeedUpActive,
  timeSignature,
  tempo,
  swing,
  onTempoChange,
  onSwingChange,
  elapsedTime = '0:00',
  countdownNumber,
  countingInButton,
  isEmbedded,
  trackingEnabled,
  midiConnected,
  onTrackingToggle,
}: PlaybackControlsProps) {
  // Keep the MIDI timing accuracy hook mounted for its side effects; this
  // component does not render its values.
  useMIDITimingAccuracy(isPlaying, trackingEnabled);

  // Track performed BPM from MIDI hits
  const { performedBpm } = useMIDIPerformedBpm(isPlaying, trackingEnabled);

  // Swing display conversion (internal 0–100 maps to DAW convention 50–67%)
  // 0 = no swing (straight), 100 = triplet swing (2:1 ratio)
  const swingToDisplay = (v: number) => Math.min(67, Math.max(50, Math.round(50 + v / 6)));
  const swingToInternal = (v: number) => Math.min(100, Math.max(0, Math.round((v - 50) * 6)));

  // Swing type labels based on display percentage (50–67%)
  const getSwingType = (displayPercent: number): string => {
    if (displayPercent < 55) return 'Straight';
    if (displayPercent < 61) return 'Light Shuffle';
    return 'Full Triplet';
  };

  // Accessible names for the icon-only transport buttons. They mirror the icon
  // logic below so screen readers (and tests) see the current state.
  const countingInLabel =
    countdownNumber !== null && countdownNumber !== undefined ? `Counting in: ${countdownNumber}` : null;
  const playLabel =
    countingInButton === 'play' && countingInLabel
      ? countingInLabel
      : isPlaying && !isAutoSpeedUpActive
        ? 'Stop'
        : 'Play';
  const playWithSpeedUpLabel =
    countingInButton === 'playPlus' && countingInLabel
      ? countingInLabel
      : isPlaying && isAutoSpeedUpActive
        ? 'Stop auto speed-up'
        : 'Play with auto speed-up';

  const sliderClass =
    '[&_[data-slot=slider-range]]:bg-ink-2 [&_[data-slot=slider-thumb]]:bg-ink-1 [&_[data-slot=slider-thumb]]:border-ink-1 [&_[data-slot=slider-thumb]]:shadow-none [&_[data-slot=slider-track]]:bg-surface-4';

  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-6 lg:gap-10">
      {/* Transport: play buttons, elapsed time, time signature */}
      <div className="flex items-center justify-center lg:justify-start">
        {!isEmbedded && (
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="flex items-center gap-3">
              <Button
                onClick={onPlay}
                aria-label={playLabel}
                title={playLabel}
                size="lg"
                className="w-12 h-12 p-0 has-[>svg]:px-0 rounded-full bg-ink-1 hover:bg-ink-1/90 text-surface-1 touch-target"
              >
                {countingInButton === 'play' && countdownNumber !== null ? (
                  <span className="text-xl font-medium">{countdownNumber}</span>
                ) : isPlaying && !isAutoSpeedUpActive ? (
                  <Square className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </Button>
              <div className="relative">
                <Button
                  onClick={onPlayWithSpeedUp}
                  aria-label={playWithSpeedUpLabel}
                  title={playWithSpeedUpLabel}
                  size="lg"
                  className={`w-12 h-12 p-0 has-[>svg]:px-0 rounded-full touch-target ${
                    isAutoSpeedUpActive
                      ? 'bg-brass hover:bg-brass-hover text-brass-ink shadow-[inset_0_0_0_1px_var(--ui-brass-edge)]'
                      : 'bg-surface-3 hover:bg-surface-4 text-ink-1 shadow-[inset_0_0_0_1px_var(--ui-line-strong)]'
                  }`}
                >
                  {countingInButton === 'playPlus' && countdownNumber !== null ? (
                    <span className="text-xl font-medium">{countdownNumber}</span>
                  ) : isPlaying && isAutoSpeedUpActive ? (
                    <Square className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </Button>
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-surface-1 text-ink-1 border border-line-strong rounded-full flex items-center justify-center pointer-events-none">
                  <Plus className="w-3 h-3 stroke-2" strokeWidth={3} />
                </div>
              </div>
            </div>
            <div className="text-ink-1 text-left">
              <div className="font-display text-[28px] leading-8">{elapsedTime}</div>
              <div className="text-xs leading-4 text-ink-3">
                {isPlaying ? 'Loop Active' : 'Stopped'}
              </div>
            </div>
            <div className="hidden sm:flex flex-col-reverse pl-6 border-l border-line">
              <div className="text-xs leading-4 text-ink-3 lowercase first-letter:uppercase">TIME</div>
              <div className="text-ink-2 text-[28px] leading-8">{timeSignature.beats}/{timeSignature.noteValue}</div>
            </div>
          </div>
        )}
      </div>

      {/* Sliders - stacked on mobile, side by side on desktop */}
      <div className="flex flex-col sm:flex-row gap-4 sm:gap-8 lg:flex-1">
        {/* Tempo Slider */}
        <div className="flex-1 lg:max-w-md">
          <div className="flex items-center justify-between h-5 mb-3">
            <span className="text-sm leading-5 font-normal text-ink-2">Tempo (BPM)</span>
            <div className="flex items-center gap-3">
              {performedBpm !== null && trackingEnabled && (
                <span className="text-xs text-ink-3">
                  Playing: {performedBpm}
                </span>
              )}
              <span className="text-sm leading-5 text-ink-1 font-medium">{tempo}</span>
            </div>
          </div>
          <Slider
            value={[tempo]}
            onValueChange={(v) => onTempoChange(v[0])}
            thumbAriaLabel="Tempo (BPM)"
            min={40}
            max={240}
            step={1}
            className={sliderClass}
          />
        </div>

        {/* Swing Slider */}
        <div className="flex-1 lg:max-w-md">
          <div className="flex items-center justify-between h-5 mb-3">
            <span className="text-sm leading-5 font-normal text-ink-2">Swing</span>
            <div className="flex items-center gap-3">
              <span className="text-xs leading-5 text-ink-3">{getSwingType(swingToDisplay(swing))}</span>
              <span className="text-sm leading-5 text-ink-1 font-medium">{swingToDisplay(swing)}%</span>
            </div>
          </div>
          <Slider
            value={[swingToDisplay(swing)]}
            onValueChange={(v) => onSwingChange(swingToInternal(v[0]))}
            thumbAriaLabel="Swing"
            thumbAriaValueText={`${swingToDisplay(swing)}% ${getSwingType(swingToDisplay(swing))}`}
            min={50}
            max={67}
            step={1}
            className={sliderClass}
          />
        </div>
      </div>

      {/* MIDI Tracking Toggle - shown when MIDI connected */}
      {midiConnected && (
        <div className="flex items-center gap-2 lg:border-l lg:border-line lg:pl-6">
          <Button
            onClick={onTrackingToggle}
            size="sm"
            variant={trackingEnabled ? 'default' : 'outline'}
            className={`h-9 px-3 text-sm font-normal ${
              trackingEnabled
                ? 'bg-surface-3 hover:bg-surface-4 text-ink-1 shadow-[inset_0_0_0_1px_var(--ui-line),inset_0_-2px_0_var(--ui-brass-text)]'
                : 'bg-transparent dark:bg-transparent border-line-strong dark:border-line-strong text-ink-2 hover:bg-surface-3 dark:hover:bg-surface-3 hover:text-ink-1'
            }`}
          >
            {trackingEnabled ? '✓ Tracking On' : 'Tracking Off'}
          </Button>
        </div>
      )}
    </div>
  );
}
