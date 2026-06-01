import { useMemo } from 'react';
import { TimeSignature, Division } from '../../types';
import { GrooveUtils } from '../../core';

export interface CountRowProps {
  /** Division: number of subdivisions per quarter note */
  division: Division;
  /** Time signature of the measure */
  timeSignature: TimeSignature;
  /** Current measure index (for accessibility) */
  measureIndex: number;
}

/**
 * Returns the count label for a specific subdivision position.
 * Accounts for the time signature and division to display beat positions.
 * Examples:
 * - 4/4 with 8th notes: 1, &, 2, &, 3, &, 4, &
 * - 4/4 with 16th notes: 1, e, &, a, 2, e, &, a, 3, e, &, a, 4, e, &, a
 */
function getCountLabel(position: number, timeSignature: TimeSignature, division: Division): string {
  const label = GrooveUtils.getCountLabel(position, division, timeSignature.beats);
  return Number.parseInt(label, 10) > timeSignature.beats ? '' : label;
}

/**
 * CountRow displays the beat counting above the drum grid.
 * Shows measure numbers and beat subdivisions (1, &, 2, &, etc.)
 * aligned with the sticking row and drum grid columns.
 */
export default function CountRow({
  division,
  timeSignature,
  measureIndex,
}: CountRowProps) {
  // Calculate total subdivisions in this measure
  const notesPerMeasure = useMemo(() => {
    return (division / timeSignature.noteValue) * timeSignature.beats;
  }, [division, timeSignature]);

  // Generate count labels for each subdivision
  const countLabels = useMemo(() => {
    const labels: string[] = [];
    for (let i = 0; i < notesPerMeasure; i++) {
      labels.push(getCountLabel(i, timeSignature, division));
    }
    return labels;
  }, [notesPerMeasure, timeSignature, division]);

  return (
    <div
      role="group"
      aria-label={`Counting for measure ${measureIndex + 1}`}
      className="flex items-center mb-1"
    >
      {/* Label column — matches drum row label width and sticking row width */}
      <div className="w-16 sm:w-20 md:w-20 flex-shrink-0 px-1 sm:px-2 md:px-2 py-1 text-right text-xs font-semibold text-slate-500 dark:text-slate-400">
        Count
      </div>

      {/* Count cells — one per subdivision, matching grid cell widths */}
      {countLabels.map((label, index) => (
        <div
          key={index}
          className={`
            w-11 h-8 sm:w-12 sm:h-8 md:w-10 md:h-7
            border border-slate-200 dark:border-slate-600
            flex items-center justify-center
            text-xs font-semibold leading-none
            bg-slate-50 dark:bg-slate-700/30
            text-slate-600 dark:text-slate-400
          `}
        >
          {label}
        </div>
      ))}
    </div>
  );
}
