import { useCallback } from 'react';
import { StickingValue } from '../../types';

export interface StickingRowProps {
  /** Array of sticking values (one per subdivision). Must match measure subdivision count. */
  stickingValues: StickingValue[];
  /** Called when user changes a sticking cell. Receives the index and the new value. */
  onStickingChange: (index: number, value: StickingValue) => void;
  /** Whether the sticking row is visible and interactive */
  isActive: boolean;
  /** Current measure index (0-based, used for accessibility labels) */
  measureIndex: number;
}

/** Cycle order: null → R → L → L/R → null (per D-03) */
const CYCLE_ORDER: StickingValue[] = [null, 'R', 'L', 'L/R'];

/** Returns the next value in the click-to-cycle sequence */
function cycleValue(current: StickingValue): StickingValue {
  const idx = CYCLE_ORDER.indexOf(current);
  return CYCLE_ORDER[(idx + 1) % CYCLE_ORDER.length];
}

/** All valid sticking values for input validation (T-02-01) */
const VALID_STICKING_VALUES = new Set<StickingValue>(['L', 'R', 'L/R', null]);

function isValidStickingValue(v: unknown): v is StickingValue {
  return VALID_STICKING_VALUES.has(v as StickingValue);
}

/** Display label for a sticking value */
function displayLabel(value: StickingValue): string {
  if (value === null) return '';
  return value;
}

/** Human-readable ARIA label for a sticking value */
function ariaValueLabel(value: StickingValue): string {
  if (value === null) return 'empty';
  if (value === 'L') return 'Left';
  if (value === 'R') return 'Right';
  return 'both hands';
}

/**
 * Returns a beat position label for accessibility, e.g. "Beat 1", "Beat 1 and", "Beat 2"
 * Based on subdivision index within a measure.
 */
function beatPositionLabel(index: number, total: number): string {
  const beatsPerMeasure = total <= 4 ? total : 4;
  const subdivisionsPerBeat = total / beatsPerMeasure;
  const beat = Math.floor(index / subdivisionsPerBeat) + 1;
  const offbeatPos = index % subdivisionsPerBeat;
  if (offbeatPos === 0) {
    return `Beat ${beat}`;
  }
  if (offbeatPos === subdivisionsPerBeat / 2) {
    return `Beat ${beat} and`;
  }
  return `Beat ${beat} subdivision ${offbeatPos + 1}`;
}

/**
 * StickingRow renders a row of sticking cells aligned with the drum grid columns.
 * Each cell shows L, R, L/R, or empty (null) and supports click-to-cycle and keyboard shortcuts.
 *
 * Per D-03: Click cycles Empty → R → L → L/R → Empty
 * Per D-04: Keyboard shortcuts when cell focused (R, L, /, B, Backspace, Delete, Space, Enter)
 */
export default function StickingRow({
  stickingValues,
  onStickingChange,
  isActive,
  measureIndex,
}: StickingRowProps) {
  const handleClick = useCallback((index: number, current: StickingValue) => {
    const next = cycleValue(current);
    if (!isValidStickingValue(next)) return; // defensive: should never happen
    onStickingChange(index, next);
  }, [onStickingChange]);

  const handleKeyDown = useCallback((
    e: React.KeyboardEvent<HTMLButtonElement>,
    index: number,
    current: StickingValue
  ) => {
    let next: StickingValue | undefined;

    if (e.key === 'r' || e.key === 'R') {
      next = 'R';
    } else if (e.key === 'l' || e.key === 'L') {
      next = 'L';
    } else if (e.key === '/' || e.key === 'b' || e.key === 'B') {
      next = 'L/R';
    } else if (e.key === 'Backspace' || e.key === 'Delete') {
      next = null;
    } else if (e.key === ' ' || e.key === 'Enter') {
      next = cycleValue(current);
      e.preventDefault(); // prevent page scroll on Space
    } else {
      return; // let other keys bubble normally
    }

    if (!isValidStickingValue(next)) return; // defensive
    onStickingChange(index, next);
  }, [onStickingChange]);

  if (!isActive) return null;

  const total = stickingValues.length;

  return (
    <div
      role="group"
      aria-label={`Sticking setup for measure ${measureIndex + 1}`}
      className="flex items-center mb-1"
    >
      {/* Label column — matches drum row label width */}
      <div className="w-16 sm:w-20 md:w-20 flex-shrink-0 px-1 sm:px-2 md:px-2 py-1 text-right text-xs font-semibold text-purple-600 dark:text-purple-400">
        Sticking
      </div>

      {/* Sticking cells — one per subdivision, matching drum cell widths */}
      {stickingValues.map((value, index) => {
        const positionLabel = beatPositionLabel(index, total);
        const valueLabel = ariaValueLabel(value);

        return (
          <button
            key={index}
            tabIndex={0}
            onClick={() => handleClick(index, value)}
            onKeyDown={(e) => handleKeyDown(e, index, value)}
            aria-label={`${positionLabel} sticking: ${valueLabel}`}
            className={`
              w-11 h-8 sm:w-12 sm:h-8 md:w-10 md:h-7
              border cursor-pointer transition-colors duration-100
              flex items-center justify-center
              text-xs font-semibold leading-none
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-1
              ${value !== null
                ? 'bg-purple-100 dark:bg-purple-900/40 border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800/60'
                : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
              }
            `}
          >
            {displayLabel(value)}
          </button>
        );
      })}
    </div>
  );
}
