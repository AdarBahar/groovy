import { useState } from 'react';
import { Play, Pause, Plus } from 'lucide-react';
import { Button } from './ui/button';
import { Slider } from './ui/slider';

export function PlaybackControls() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState([80]);
  const [swing, setSwing] = useState([0]);

  return (
    <div className="flex items-center gap-8">
      {/* Time and Play button */}
      <div className="flex items-center gap-4">
        <div className="text-xs text-purple-400 font-semibold">
          <div>TIME</div>
          <div className="text-white text-lg mt-1">4/4</div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={() => setIsPlaying(!isPlaying)}
            size="lg"
            className="w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-lg shadow-purple-500/20"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-white" />
            ) : (
              <Play className="w-6 h-6 fill-white ml-0.5" />
            )}
          </Button>
          
          <div className="relative">
            <Button
              size="lg"
              className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg shadow-blue-500/20"
            >
              <Play className="w-6 h-6 fill-white ml-0.5" />
            </Button>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
              <Plus className="w-4 h-4 text-blue-600" strokeWidth={3} />
            </div>
          </div>
        </div>
        
        <div className="text-white">
          <div className="text-3xl font-bold">0:08</div>
          <div className="text-xs text-purple-400 uppercase tracking-wider">Loop Active</div>
        </div>
      </div>

      {/* Tempo Slider */}
      <div className="flex-1 max-w-md">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm text-slate-400">Tempo (BPM)</label>
          <span className="text-sm text-purple-400 font-semibold">{tempo[0]}</span>
        </div>
        <Slider
          value={tempo}
          onValueChange={setTempo}
          min={40}
          max={240}
          step={1}
          className="[&_[data-slot=slider-range]]:bg-purple-500 [&_[data-slot=slider-thumb]]:bg-purple-500 [&_[data-slot=slider-thumb]]:border-purple-400 [&_[data-slot=slider-track]]:bg-slate-700"
        />
      </div>

      {/* Swing Slider */}
      <div className="flex-1 max-w-md">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm text-slate-400">Swing</label>
          <span className="text-sm text-purple-400 font-semibold">{swing[0]}%</span>
        </div>
        <Slider
          value={swing}
          onValueChange={setSwing}
          min={0}
          max={100}
          step={1}
          className="[&_[data-slot=slider-range]]:bg-purple-500 [&_[data-slot=slider-thumb]]:bg-purple-500 [&_[data-slot=slider-thumb]]:border-purple-400 [&_[data-slot=slider-track]]:bg-slate-700"
        />
      </div>
    </div>
  );
}