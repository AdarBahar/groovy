import { Play, Pause, Plus } from 'lucide-react';
import { Button } from '../ui/button';
import { Slider } from '../ui/slider';
import { TimeSignature } from '../../types';

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
  isEmbedded = false,
}: PlaybackControlsProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8">
      {/* Time and Play button - centered on mobile, left on desktop */}
      <div className="flex items-center justify-center lg:justify-start gap-4">
        {/* Time signature - hidden on mobile to save space */}
        {!isEmbedded &&    (  
          <div>    
            <div className="hidden sm:block text-xs text-purple-600 dark:text-purple-400 font-semibold">
            <div>TIME</div>
            <div className="text-slate-900 dark:text-white text-lg mt-1">{timeSignature.beats}/{timeSignature.noteValue}</div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
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
              )}
            </Button>
          <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-white rounded-full flex items-center justify-center shadow-md">
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600" strokeWidth={3} />
          </div>
        </div>
        </div>
        <div className="text-slate-900 dark:text-white text-center sm:text-left">
          <div className="text-2xl sm:text-3xl font-bold">{elapsedTime}</div>
          <div className="text-xs text-purple-600 dark:text-purple-400 uppercase tracking-wider">
            {isPlaying ? 'Loop Active' : 'Stopped'}
          </div>
        </div>        
      </div>)}

      </div>
       {/* Sliders - stacked on mobile, side by side on desktop */}
      {/* Sliders - stacked on mobile, side by side on desktop */}
      <div className="flex flex-col sm:flex-row gap-4 lg:flex-1">
        {/* Tempo Slider */}
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
    </div>
  );
}

