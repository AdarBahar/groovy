import { useEffect } from 'react';

/**
 * Hook that shows green/red cell feedback based on MIDI tracking hit analysis.
 *
 * Listens for 'midi-tracking-hit' events and applies CSS classes to cells.
 * - Green flash: good hit (overall score > 70)
 * - Red flash: bad hit (overall score ≤ 70)
 *
 * Flashes last 500ms and only apply to specific cells (row + position intersection).
 */
export function useMIDITrackingFeedback() {
  useEffect(() => {
    const handleTrackingHit = (event: CustomEvent) => {
      const { voice, position, analysis } = event.detail;

      // Find the specific cell (row + position intersection)
      const row = document.querySelector(`[data-voice-group="${voice}"]`);
      if (!row) return;

      const cell = row.querySelector(`[data-absolute-pos="${position}"]`);
      if (!cell) return;

      // Determine color based on overall score
      const isGoodHit = analysis.overall > 70;
      const className = isGoodHit ? 'midi-tracking-good' : 'midi-tracking-bad';

      // Add class to cell to trigger animation
      cell.classList.add(className);

      // Remove after 500ms animation completes
      setTimeout(() => {
        cell.classList.remove(className);
      }, 500);
    };

    window.addEventListener('midi-tracking-hit', handleTrackingHit as EventListener);
    return () => window.removeEventListener('midi-tracking-hit', handleTrackingHit as EventListener);
  }, []);
}
