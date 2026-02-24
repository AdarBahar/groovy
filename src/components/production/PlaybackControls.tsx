import { Play, Pause, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { TimeSignature } from '../../types';
import { MIDITimingIndicator } from '../MIDITimingIndicator';
import VolumeKnob from '../VolumeKnob';
import { useMIDITimingAccuracy } from '../../hooks/useMIDITimingAccuracy';
import { trackMIDITrackingToggle } from '../../utils/analytics';

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
  isEmbedded?: boolean;
  midiConnected?: boolean;
  trackingEnabled?:boolean;
  onTrackingToggle?: () => void;
  masterVolume?: number;
  onMasterVolumeChange?: (volume: number) => void;
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
  midiConnected = false,
<<<<<<< Updated upstream
  trackingEnabled = false,
  onTrackingToggle,
  masterVolume = 1,
  onMasterVolumeChange,
=======
  trackingEnabled = false
>>>>>>> Stashed changes
}: PlaybackControlsProps) {
  // Use the enhanced MIDI timing accuracy hook
  const {
    timingAccuracy,
    averageScore,
    showingAverage,
  } = useMIDITimingAccuracy(isPlaying, trackingEnabled);

  const showVolumeControl = masterVolume !== undefined && !!onMasterVolumeChange;
  const showSecondRow = midiConnected || showVolumeControl;

  return (
<<<<<<< Updated upstream
    <div className="flex flex-col gap-0">
      {/* Top row: Play buttons, Elapsed time, TIME, Tempo, Swing */}
      <div className="flex flex-wrap items-start gap-3 lg:gap-5">
        {/* Play buttons */}
        <div className="flex items-center gap-2">
          <Button
            onClick={onPlay}
            size="lg"
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-lg shadow-purple-500/20 touch-target"
          >
            {countingInButton === 'play' && countdownNumber !== null ? (
              <span className="text-white text-xl sm:text-2xl font-bold">{countdownNumber}</span>
            ) : isPlaying && !isAutoSpeedUpActive ? (
              <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-white" />
            ) : (
              <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-white ml-0.5" />
            )}
          </Button>

          <div className="relative">
            <Button
              onClick={onPlayWithSpeedUp}
=======
    <div className="flex items-center justify-center lg:justify-start gap-4">
          {/* Time and Play button - centered on mobile, left on desktop */}
          {/* Time signature - hidden on mobile to save space */}
        {!isEmbedded && (  
          <div>
            <div className="hidden sm:block text-xs text-purple-600 dark:text-purple-400 font-semibold">
              <div>TIME</div>
              <div className="text-slate-900 dark:text-white text-lg mt-1">{timeSignature.beats}/{timeSignature.noteValue}</div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Button
              onClick={onPlay}
>>>>>>> Stashed changes
              size="lg"
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-lg shadow-purple-500/20 touch-target"
              >
              {countingInButton === 'play' && countdownNumber !== null ? (
                <span className="text-white text-xl sm:text-2xl font-bold">{countdownNumber}</span>
                ) : isPlaying && !isAutoSpeedUpActive ? (
                <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-white" />
                ) : (
                <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-white ml-0.5" />
              )}
<<<<<<< Updated upstream
            </Button>
            <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full flex items-center justify-center shadow-md">
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" strokeWidth={3} />
            </div>
          </div>
        </div>

        {/* Elapsed time */}
        <div className="text-slate-900 dark:text-white text-center">
          <div className="text-2xl sm:text-3xl font-bold">{elapsedTime}</div>
          <div className="text-xs text-purple-600 dark:text-purple-400 uppercase tracking-wider">
            {isPlaying ? 'Loop Active' : 'Stopped'}
          </div>
        </div>

        {/* Time signature - hidden on mobile to save space */}
        <div className="hidden sm:flex sm:flex-col sm:items-start sm:justify-start">
          <div className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
            <div>TIME</div>
            <div className="text-slate-900 dark:text-white text-lg mt-1">{timeSignature.beats}/{timeSignature.noteValue}</div>
          </div>
        </div>

        {/* Tempo Slider */}
        <div className="flex-1 min-w-48 mr-6">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm text-slate-500 dark:text-slate-400">Tempo (BPM)</label>
            <span className="text-sm text-purple-600 dark:text-purple-400 font-semibold">{tempo}</span>
          </div>
          <Slider
            value={[tempo]}
            onValueChange={(v) => onTempoChange(v[0])}
            min={40}
            max={240}
            step={1}
            className="[&_[data-slot=slider-range]]:bg-purple-500 [&_[data-slot=slider-thumb]]:bg-purple-500 [&_[data-slot=slider-thumb]]:border-purple-400 [&_[data-slot=slider-track]]:bg-slate-200 dark:[&_[data-slot=slider-track]]:bg-slate-700"
          />
        </div>

        {/* Swing Slider */}
        <div className="flex-1 min-w-48 mr-6">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm text-slate-500 dark:text-slate-400">Swing</label>
            <span className="text-sm text-purple-600 dark:text-purple-400 font-semibold">{swing}%</span>
          </div>
          <Slider
            value={[swing]}
            onValueChange={(v) => onSwingChange(v[0])}
            min={0}
            max={100}
            step={1}
            className="[&_[data-slot=slider-range]]:bg-purple-500 [&_[data-slot=slider-thumb]]:bg-purple-500 [&_[data-slot=slider-thumb]]:border-purple-400 [&_[data-slot=slider-track]]:bg-slate-200 dark:[&_[data-slot=slider-track]]:bg-slate-700"
          />
        </div>
      </div>

      {/* Second row: MIDI Tracking and MIDI Indicator */}
      {showSecondRow && (
        <div className="flex flex-col gap-2 -mt-1">
          <div className="flex items-center gap-3 w-full">
            {midiConnected && (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 dark:bg-purple-900/20 rounded-lg w-fit">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={trackingEnabled}
                      onChange={() => {
                        trackMIDITrackingToggle(!trackingEnabled);
                        onTrackingToggle?.();
                      }}
                      className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 cursor-pointer"
                    />
                    <span className="text-slate-700 dark:text-slate-300">
                      MIDI Tracking
                    </span>
                  </label>
                </div>

                {/* MIDI Timing Indicator */}
                <div className="flex-1 max-w-[500px]">
                  <MIDITimingIndicator
                    timingAccuracy={timingAccuracy}
                    isPlaying={isPlaying}
                    trackingEnabled={trackingEnabled}
                    averageScore={averageScore}
                    showingAverage={showingAverage}
                  />
                </div>
              </>
            )}

            {/* Master Volume Knob */}
            {showVolumeControl && (
              <div className="ml-auto">
                <VolumeKnob
                  volume={masterVolume}
                  onVolumeChange={onMasterVolumeChange}
                  label="Master Volume:"
                />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
=======
              </Button>
              <div className="relative">
                <Button
                onClick={onPlayWithSpeedUp}
                size="lg"
                className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-lg touch-target ${
                  isAutoSpeedUpActive
                    ? 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-green-500/20'
                    : 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-500/20'
                  }`}
                >
                  {countingInButton === 'playPlus' && countdownNumber !== null ? (
                      <span className="text-white text-xl sm:text-2xl font-bold">{countdownNumber}</span>
                      ) : isPlaying && isAutoSpeedUpActive ? (
                        <Pause className="w-5 h-5 sm:w-6 sm:h-6 fill-white" />
                      ) : (
                        <Play className="w-5 h-5 sm:w-6 sm:h-6 fill-white ml-0.5" />
                    )
                  }
                </Button>
              </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full flex items-center justify-center shadow-md">
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" strokeWidth={3} />
            </div>
            <div className="text-slate-900 dark:text-white text-center sm:text-left">
              <div className="text-2xl sm:text-3xl font-bold">{elapsedTime}</div>
              <div className="text-xs text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                {isPlaying ? 'Loop Active' : 'Stopped'}
              </div>
            </div>
            <div className="flex-1 lg:max-w-md">
              <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-slate-500 dark:text-slate-400">Tempo (BPM)</label>
              <span className="text-sm text-purple-600 dark:text-purple-400 font-semibold">{tempo}</span>
              </div>
              <Slider
                value={[tempo]}
                onValueChange={(v) => onTempoChange(v[0])}
                min={40}
                max={240}
                step={1}
                className="[&_[data-slot=slider-range]]:bg-purple-500 [&_[data-slot=slider-thumb]]:bg-purple-500 [&_[data-slot=slider-thumb]]:border-purple-400 [&_[data-slot=slider-track]]:bg-slate-200 dark:[&_[data-slot=slider-track]]:bg-slate-700"
              />
            </div>
            {/* Swing Slider */}
            <div className="flex-1 lg:max-w-md">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-slate-500 dark:text-slate-400">Swing</label>
                <span className="text-sm text-purple-600 dark:text-purple-400 font-semibold">{swing}%</span>
              </div>
              <Slider
                value={[swing]}
                onValueChange={(v) => onSwingChange(v[0])}
                min={0}
                max={100}
                step={1}
                className="[&_[data-slot=slider-range]]:bg-purple-500 [&_[data-slot=slider-thumb]]:bg-purple-500 [&_[data-slot=slider-thumb]]:border-purple-400 [&_[data-slot=slider-track]]:bg-slate-200 dark:[&_[data-slot=slider-track]]:bg-slate-700"
              />
            </div>
          </div>
        )}
    </div>
  );}
>>>>>>> Stashed changes
