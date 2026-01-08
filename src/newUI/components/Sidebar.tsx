import { Undo2, Redo2 } from 'lucide-react';
import { Button } from './ui/button';
import { useState } from 'react';

interface SidebarProps {
  isNotesOnly: boolean;
  onToggleNotesOnly: () => void;
}

export function Sidebar({ isNotesOnly, onToggleNotesOnly }: SidebarProps) {
  const [selectedNote, setSelectedNote] = useState('1/16');

  const noteOptions = [
    { label: '1/8', value: '1/8' },
    { label: '1/16', value: '1/16' },
    { label: '1/32', value: '1/32' },
    { label: '1/8', value: '1/8-triplet', sublabel: 'Triplets' },
    { label: '1/16', value: '1/16-triplet', sublabel: 'Triplets' },
    { label: 'Mixed', value: 'mixed' },
  ];

  return (
    <div className="w-20 bg-slate-800 border-r border-slate-700/50 flex flex-col items-center py-6 gap-6">
      {/* Toggle button at top */}
      <button
        onClick={onToggleNotesOnly}
        className={`w-14 h-14 mt-[15px] flex items-center justify-center rounded border-2 transition-colors ${
          isNotesOnly
            ? 'bg-purple-600 border-purple-600 hover:bg-purple-700 hover:border-purple-700'
            : 'bg-transparent border-slate-500 hover:border-slate-400'
        }`}
      >
        <span className="text-[10px] uppercase font-semibold text-white text-center leading-tight">
          {isNotesOnly ? (
            <>
              <div>Back to</div>
              <div>Edit</div>
            </>
          ) : (
            <>
              <div>Notes</div>
              <div>Only</div>
            </>
          )}
        </span>
      </button>

      {!isNotesOnly && (
        <>
          {/* Time signature */}
          <div className="flex flex-col items-center text-white">
            <div className="text-2xl font-bold leading-none">4</div>
            <div className="w-6 h-px bg-white my-0.5"></div>
            <div className="text-2xl font-bold leading-none">4</div>
          </div>

          {/* Note selectors */}
          <div className="flex flex-col gap-1 w-full px-2">
            {noteOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedNote(option.value)}
                className={`w-full py-1.5 px-1 flex flex-col items-center justify-center rounded transition-colors ${
                  selectedNote === option.value
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-transparent text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <div className="text-xs font-bold leading-tight">{option.label}</div>
                <div className="text-[9px] opacity-70 whitespace-nowrap leading-tight">
                  {option.sublabel || 'Notes'}
                </div>
              </button>
            ))}
          </div>

          {/* Spacer */}
          <div className="flex-1"></div>

          {/* Undo/Redo */}
          <div className="flex flex-col gap-1">
            <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-400 hover:text-white hover:bg-slate-700">
              <Undo2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-400 hover:text-white hover:bg-slate-700">
              <Redo2 className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}