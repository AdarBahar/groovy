import { useEffect } from 'react';
import { Undo2, Redo2, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Division, TimeSignature } from '../../types';

interface SidebarProps {
  isNotesOnly: boolean;
  onToggleNotesOnly: () => void;
  timeSignature: TimeSignature;
  onTimeSignatureClick: () => void;
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
  onTimeSignatureClick,
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

  // Escape closes the open mobile drawer
  useEffect(() => {
    if (!isOpen || !onClose) return;
    const handleEscape = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

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
      <aside
        className={`
          w-20 bg-surface-0 border-r border-line
          flex flex-col items-center py-4 gap-6 overscroll-contain
          fixed inset-y-0 left-0 z-50 transition-[transform,visibility] duration-300 ease-out
          ${isOpen ? 'translate-x-0 visible' : '-translate-x-full max-md:invisible'}
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
            aria-label="Close sidebar"
            className="absolute top-2 right-2 md:hidden text-ink-3 hover:text-ink-1 hover:bg-surface-3 dark:hover:bg-surface-3"
          >
            <X className="size-[18px]" />
          </Button>
        )}

        {/* Toggle button at top */}
        <Button
          onClick={() => handleAction(onToggleNotesOnly)}
          className={`w-16 flex items-center justify-center h-12 px-2 max-md:mt-10 ${
            isNotesOnly
              ? 'bg-ink-1 hover:bg-ink-1/90 text-surface-0'
              : 'bg-surface-3 hover:bg-surface-4 text-ink-1 shadow-[inset_0_0_0_1px_var(--ui-line)]'
          }`}
        >
          <span className="text-xs font-medium text-center leading-4">
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
            {/* Time signature button - clickable to open selector */}
            <button
              onClick={onTimeSignatureClick}
              className="w-16 flex flex-col items-center justify-center text-ink-1 hover:bg-surface-3 rounded-lg py-2 transition-colors cursor-pointer"
              title="Click to change time signature"
            >
              <div className="text-[28px] leading-8 font-medium">{timeSignature.beats}</div>
              <div className="w-8 h-px bg-ink-1 my-1"></div>
              <div className="text-[28px] leading-8 font-medium">{timeSignature.noteValue}</div>
            </button>

            {/* Division selectors */}
            <div className="flex flex-col gap-1 w-full px-2">
              {noteOptions.map((option) => (
                <Button
                  key={option.value}
                  variant={division === option.value ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleAction(() => onDivisionChange(option.value))}
                  className={`w-full h-12 px-2 flex flex-col items-center justify-center gap-0 text-xs font-normal ${
                    division === option.value
                      ? 'bg-surface-3 hover:bg-surface-3 text-ink-1 shadow-[inset_0_0_0_1px_var(--ui-line),inset_2px_0_0_var(--ui-brass-text)]'
                      : 'bg-transparent text-ink-2 hover:text-ink-1 hover:bg-surface-3 dark:hover:bg-surface-3'
                  }`}
                >
                  <div className="text-[13px] leading-4 font-medium">{option.label}</div>
                  <div className="text-xs leading-4 whitespace-nowrap">{option.sublabel}</div>
                </Button>
              ))}
            </div>

            {/* Spacer */}
            <div className="flex-1"></div>

            {/* Undo/Redo */}
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={onUndo}
                disabled={!canUndo}
                aria-label="Undo"
                title="Undo"
                className="text-ink-3 hover:text-ink-1 hover:bg-surface-3 dark:hover:bg-surface-3 disabled:opacity-40"
              >
                <Undo2 className="size-[18px]" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onRedo}
                disabled={!canRedo}
                aria-label="Redo"
                title="Redo"
                className="text-ink-3 hover:text-ink-1 hover:bg-surface-3 dark:hover:bg-surface-3 disabled:opacity-40"
              >
                <Redo2 className="size-[18px]" />
              </Button>
            </div>
          </>
        )}
      </aside>
    </>
  );
}

