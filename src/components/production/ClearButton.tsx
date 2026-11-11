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
        className={`flex items-center gap-2 h-9 px-3 has-[>svg]:px-3 font-normal ${
          isOpen
            ? 'text-ink-1 bg-surface-3'
            : 'text-ink-2 hover:text-ink-1 hover:bg-surface-3 dark:hover:bg-surface-3'
        }`}
      >
        <Trash2 className="w-4 h-4" />
        <span className="text-sm">Clear</span>
      </Button>

      {isOpen && dropdownPosition && createPortal(
        <div
          ref={dropdownRef}
          className="fixed bg-surface-2 dark:bg-surface-3 border border-line-strong rounded-lg px-3 py-2 shadow-[0_8px_24px_rgba(0,0,0,0.06)] dark:shadow-none flex items-center gap-3 whitespace-nowrap z-[100]"
          style={{ top: dropdownPosition.top, left: dropdownPosition.left }}
        >
          {state === 'confirmation' ? (
            <>
              <span className="text-ink-2 text-xs">Are you sure?</span>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleConfirm}
                  className="bg-ink-1 hover:bg-ink-1/90 text-surface-1 text-xs px-3 h-8"
                >
                  Yes
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                  className="text-ink-2 hover:text-ink-1 hover:bg-surface-4 dark:hover:bg-surface-4 text-xs font-normal px-3 h-8"
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <span role="status" aria-live="polite" className="text-ink-2 text-xs">Clearing editor…</span>
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
