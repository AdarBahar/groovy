import { useState } from 'react';

interface DrumNote {
  beat: number;
  subdivision: number;
}

export function TrackEditor() {
  const [kicks, setKicks] = useState<DrumNote[]>([
    { beat: 0, subdivision: 0 },
    { beat: 2, subdivision: 0 },
  ]);

  const beats = 4;
  const subdivisions = 4;
  const measures = 4;

  const toggleNote = (beat: number, subdivision: number) => {
    const existingIndex = kicks.findIndex(
      n => n.beat === beat && n.subdivision === subdivision
    );

    if (existingIndex >= 0) {
      setKicks(kicks.filter((_, i) => i !== existingIndex));
    } else {
      setKicks([...kicks, { beat, subdivision }]);
    }
  };

  return (
    <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden">
      {/* Beat numbers on the right */}
      <div className="relative">
        <div className="absolute right-4 top-0 bottom-0 flex flex-col justify-around text-purple-400 text-xs py-4">
          {Array.from({ length: beats }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-0.5">
              <div className="font-bold">{i + 1}</div>
              <div className="text-slate-600">e</div>
              <div className="text-slate-600">+</div>
              <div className="text-slate-600">a</div>
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="p-6 pb-0">
          <div className="grid gap-0" style={{ gridTemplateColumns: `repeat(${beats * subdivisions * measures}, 1fr)` }}>
            {Array.from({ length: beats * subdivisions * measures }).map((_, colIndex) => {
              const beat = Math.floor(colIndex / subdivisions);
              const subdivision = colIndex % subdivisions;
              const hasNote = kicks.some(
                n => n.beat === beat && n.subdivision === subdivision
              );
              const isBeatStart = subdivision === 0;

              return (
                <div
                  key={colIndex}
                  className={`h-12 border-l border-b ${
                    isBeatStart ? 'border-l-slate-600' : 'border-l-slate-700/20'
                  } border-b-slate-700/20 hover:bg-purple-500/10 cursor-pointer relative`}
                  onClick={() => toggleNote(beat, subdivision)}
                >
                  {hasNote && (
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 bg-purple-500 rounded-full"></div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Purple bar at bottom */}
          <div className="h-20 bg-gradient-to-b from-purple-500 to-purple-600 mt-4"></div>
        </div>
      </div>
    </div>
  );
}
