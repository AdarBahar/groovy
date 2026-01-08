import { Undo2, Redo2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Division, TimeSignature } from '../../types';

interface SidebarProps {
  isNotesOnly: boolean;
  onToggleNotesOnly: () => void;
  timeSignature: TimeSignature;
  division: Division;
  onDivisionChange: (division: Division) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

export function Sidebar({
  isNotesOnly,
  onToggleNotesOnly,
  timeSignature,
  division,
  onDivisionChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo
}: SidebarProps) {
  const noteOptions: { label: string; value: Division; sublabel: string }[] = [
    { label: '1/8', value: 8, sublabel: 'Notes' },
    { label: '1/16', value: 16, sublabel: 'Notes' },
    { label: '1/32', value: 32, sublabel: 'Notes' },
    { label: '1/8', value: 12, sublabel: 'Triplets' },
    { label: '1/16', value: 24, sublabel: 'Triplets' },
  ];

  return (
    <div className="w-20 bg-slate-800 border-r border-slate-700 flex flex-col items-center py-6 gap-6">
      {/* Toggle button at top */}
      <Button
        onClick={onToggleNotesOnly}
        className={`w-16 text-white flex items-center justify-center h-auto py-4 px-3 ${
          isNotesOnly
            ? 'bg-purple-600 hover:bg-purple-700'
            : 'bg-slate-700 hover:bg-slate-600'
        }`}
      >
        <span className="text-xs uppercase font-semibold text-center leading-tight">
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
      </Button>

      {!isNotesOnly && (
        <>
          {/* Time signature display */}
          <div className="flex flex-col items-center justify-center text-white mb-2">
            <div className="text-3xl font-bold">{timeSignature.beats}</div>
            <div className="w-8 h-px bg-white my-1"></div>
            <div className="text-3xl font-bold">{timeSignature.noteValue}</div>
          </div>

          {/* Division selectors */}
          <div className="flex flex-col gap-2 w-full px-2">
            {noteOptions.map((option) => (
              <Button
                key={option.value}
                variant={division === option.value ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onDivisionChange(option.value)}
                className={`w-full h-auto py-2 px-2 flex flex-col items-center justify-center text-xs ${
                  division === option.value
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <div className="font-bold">{option.label}</div>
                <div className="text-[10px] opacity-80 whitespace-nowrap">{option.sublabel}</div>
              </Button>
            ))}
          </div>

          {/* Spacer */}
          <div className="flex-1"></div>

          {/* Undo/Redo */}
          <div className="flex flex-col gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onUndo}
              disabled={!canUndo}
              className="text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30"
            >
              <Undo2 className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onRedo}
              disabled={!canRedo}
              className="text-slate-400 hover:text-white hover:bg-slate-700 disabled:opacity-30"
            >
              <Redo2 className="w-5 h-5" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

