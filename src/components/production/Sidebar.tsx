import { Undo2, Redo2, X } from 'lucide-react';
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
  // Mobile drawer props
  isOpen?: boolean;
  onClose?: () => void;
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
  onRedo,
  isOpen = true,
  onClose,
}: SidebarProps) {
  const noteOptions: { label: string; value: Division; sublabel: string }[] = [
    { label: '1/8', value: 8, sublabel: 'Notes' },
    { label: '1/16', value: 16, sublabel: 'Notes' },
    { label: '1/32', value: 32, sublabel: 'Notes' },
    { label: '1/8', value: 12, sublabel: 'Triplets' },
    { label: '1/16', value: 24, sublabel: 'Triplets' },
  ];

  // Handle click on sidebar actions - close drawer on mobile after action
  const handleAction = (action: () => void) => {
    action();
    // Close sidebar on mobile after selecting an option
    onClose?.();
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      {isOpen && onClose && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          w-20 bg-slate-50 dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700
          flex flex-col items-center py-6 gap-6
          fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:translate-x-0 md:z-auto md:transition-none
          gpu-accelerated
        `}
      >
        {/* Mobile close button */}
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-2 right-2 md:hidden text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </Button>
        )}

        {/* Toggle button at top */}
        <Button
          onClick={() => handleAction(onToggleNotesOnly)}
          className={`w-16 text-white flex items-center justify-center h-auto py-4 px-3 ${
            isNotesOnly
              ? 'bg-purple-600 hover:bg-purple-700'
              : 'bg-slate-300 dark:bg-slate-700 hover:bg-slate-400 dark:hover:bg-slate-600'
          }`}
        >
          <span className={`text-xs uppercase font-semibold text-center leading-tight ${isNotesOnly ? 'text-white' : 'text-slate-700 dark:text-white'}`}>
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
            <div className="flex flex-col items-center justify-center text-slate-900 dark:text-white mb-2">
              <div className="text-3xl font-bold">{timeSignature.beats}</div>
              <div className="w-8 h-px bg-slate-900 dark:bg-white my-1"></div>
              <div className="text-3xl font-bold">{timeSignature.noteValue}</div>
            </div>

            {/* Division selectors */}
            <div className="flex flex-col gap-2 w-full px-2">
              {noteOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={division === option.value ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleAction(() => onDivisionChange(option.value))}
                  className={`w-full h-auto py-2 px-2 flex flex-col items-center justify-center text-xs ${
                    division === option.value
                      ? 'bg-purple-600 hover:bg-purple-700 text-white'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
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
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
              >
                <Undo2 className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onRedo}
                disabled={!canRedo}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30"
              >
                <Redo2 className="w-5 h-5" />
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

