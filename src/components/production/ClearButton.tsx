import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { trackClearAll } from '../../utils/analytics';

type ClearButtonState = 'default' | 'confirmation' | 'processing';

interface ClearButtonProps {
  onClear: () => void;
}

export function ClearButton({ onClear }: ClearButtonProps) {
  const [state, setState] = useState<ClearButtonState>('default');
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const updateDropdownPosition = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setDropdownPosition({
      top: rect.bottom + 4,
      left: rect.left,
    });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    if (state === 'default') return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setState('default');
      }
    };

    updateDropdownPosition();
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', updateDropdownPosition);
    window.addEventListener('scroll', updateDropdownPosition, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', updateDropdownPosition);
      window.removeEventListener('scroll', updateDropdownPosition, true);
    };
  }, [state]);

  const handleButtonClick = () => {
    if (state === 'default') {
      setState('confirmation');
    } else {
      setState('default');
    }
  };

  const handleCancel = () => {
    setState('default');
  };

  const handleConfirm = () => {
    trackClearAll();
    setState('processing');
    setTimeout(() => {
      onClear();
      setState('default');
    }, 800);
  };

  const isOpen = state !== 'default';

  return (
    <div className="relative">
      <Button
        ref={buttonRef}
        variant="ghost"
        size="sm"
        onClick={handleButtonClick}
        className={`flex items-center gap-2 h-auto py-2 px-4 ${
          isOpen
            ? 'text-slate-900 dark:text-white bg-slate-200 dark:bg-slate-700'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        <Trash2 className="w-4 h-4" />
        <span className="text-xs uppercase">Clear</span>
      </Button>

      {isOpen && dropdownPosition && createPortal(
        <div
          ref={dropdownRef}
          className="fixed bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md px-3 py-2 shadow-lg flex items-center gap-3 whitespace-nowrap z-[100]"
          style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
        >
          {state === 'confirmation' ? (
            <>
              <span className="text-slate-600 dark:text-slate-300 text-xs">Are you sure?</span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleConfirm}
                  className="bg-purple-600 hover:bg-purple-700 text-white text-xs uppercase px-3 py-1 h-auto"
                >
                  Yes
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-xs uppercase px-3 py-1 h-auto"
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <span className="text-slate-600 dark:text-slate-300 text-xs">Clearing editor...</span>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
