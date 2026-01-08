import { useState } from 'react';
import sheetMusicImage from 'figma:asset/aee06499076fa50a7b237bbc6c02e3945ed03bb4.png';

interface Note {
  beat: number;
  subdivision: number;
  row: number;
}

export function Sequencer() {
  const [notes, setNotes] = useState<Note[]>([
    { beat: 0, subdivision: 1, row: 0 },
    { beat: 1, subdivision: 0, row: 1 },
    { beat: 1, subdivision: 2, row: 0 },
    { beat: 2, subdivision: 0, row: 1 },
    { beat: 3, subdivision: 1, row: 0 },
  ]);

  const beats = 4;
  const subdivisions = 4; // 16th notes (4 per beat)
  const rows = 2;

  const toggleNote = (beat: number, subdivision: number, row: number) => {
    const existingNoteIndex = notes.findIndex(
      n => n.beat === beat && n.subdivision === subdivision && n.row === row
    );

    if (existingNoteIndex >= 0) {
      setNotes(notes.filter((_, i) => i !== existingNoteIndex));
    } else {
      setNotes([...notes, { beat, subdivision, row }]);
    }
  };

  return (
    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700">
      {/* Sheet Music Notation */}
      <div className="mb-6 p-6 bg-slate-900/50 rounded-lg border border-slate-600">
        <img 
          src={sheetMusicImage} 
          alt="Musical notation" 
          className="w-full h-auto brightness-90 contrast-110"
          style={{
            filter: 'invert(0.95) hue-rotate(220deg) saturate(0.3)'
          }}
        />
      </div>

      <div className="flex">
        {/* Time signature display */}
        <div className="flex flex-col items-center justify-center mr-8 text-white">
          <div className="text-4xl font-bold">4</div>
          <div className="w-8 h-px bg-white my-1"></div>
          <div className="text-4xl font-bold">4</div>
        </div>

        {/* Grid */}
        <div className="flex-1 relative">
          <div className="grid grid-cols-16 gap-0" style={{ gridTemplateColumns: `repeat(${beats * subdivisions}, 1fr)` }}>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <div key={rowIndex} className="contents">
                {Array.from({ length: beats * subdivisions }).map((_, colIndex) => {
                  const beat = Math.floor(colIndex / subdivisions);
                  const subdivision = colIndex % subdivisions;
                  const hasNote = notes.some(
                    n => n.beat === beat && n.subdivision === subdivision && n.row === rowIndex
                  );
                  const isBeatStart = subdivision === 0;

                  return (
                    <div
                      key={`${rowIndex}-${colIndex}`}
                      className={`h-16 border-l border-t ${
                        isBeatStart ? 'border-l-slate-600' : 'border-l-slate-700/30'
                      } border-t-slate-700/30 hover:bg-slate-700/30 cursor-pointer relative`}
                      onClick={() => toggleNote(beat, subdivision, rowIndex)}
                    >
                      {hasNote && (
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-purple-500 rounded-full shadow-lg shadow-purple-500/50"></div>
                      )}
                      {/* Beat marker */}
                      {rowIndex === 0 && isBeatStart && (
                        <div className="absolute -top-8 left-0 text-xs text-slate-500">
                          {beat + 1}
                        </div>
                      )}
                      {/* Vertical bar for beat start */}
                      {isBeatStart && rowIndex === 0 && (
                        <div className="absolute top-0 left-0 w-px h-full bg-slate-600"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Beat separators */}
          {Array.from({ length: beats + 1 }).map((_, i) => (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-px bg-slate-600"
              style={{ left: `${(i / beats) * 100}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}