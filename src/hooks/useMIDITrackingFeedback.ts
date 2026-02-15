import { useEffect } from 'react';

/**
 * Hook that shows green/red note feedback on sheet music based on MIDI tracking hit analysis.
 *
 * Listens for 'midi-tracking-hit' events and applies CSS classes to abcjs note elements.
 * - Green flash: good hit (overall score > 70)
 * - Red flash: bad hit (overall score ≤ 70)
 *
 * Targets sheet music notes rendered by abcjs, highlighting visual feedback on the notation.
 * Flashes last 500ms and highlights all notes currently visible at the hit position.
 */
export function useMIDITrackingFeedback() {
  useEffect(() => {
    const handleTrackingHit = (event: CustomEvent) => {
      const { position, analysis } = event.detail;

      // Find the SVG container (sheet music)
      const svgContainer = document.querySelector('[data-sheet-music]');
      if (!svgContainer) {
        // Fallback: if no sheet music container, try to find any SVG in the page
        // This handles cases where the attribute might not be set
        const anyContainer = document.querySelector('div:has(> svg)');
        if (!anyContainer) return;
      }

      const svg = (svgContainer || document.querySelector('div:has(> svg)'))?.querySelector('svg');
      if (!svg) return;

      // Determine color based on overall score
      const isGoodHit = analysis.overall > 70;
      const className = isGoodHit ? 'midi-tracking-good' : 'midi-tracking-bad';

      // Highlight note elements for this voice
      // abcjs creates note elements with class 'abcjs-note'
      // We'll apply the highlight to currently visible notes that match the voice timing
      const notes = Array.from(svg.querySelectorAll('.abcjs-note'));

      if (notes.length === 0) return;

      // Calculate which note index corresponds to this position
      // This is approximate since rests don't have elements, but it's a good heuristic
      const noteIndex = Math.floor(position / 2); // Adjust divisor based on your time signature
      const targetNote = notes[noteIndex];

      if (targetNote) {
        targetNote.classList.add(className);

        // Remove after 500ms animation completes
        setTimeout(() => {
          targetNote.classList.remove(className);
        }, 500);
      } else {
        // If we can't find the exact note, highlight the last visible note as feedback
        const lastNote = notes[notes.length - 1];
        if (lastNote) {
          lastNote.classList.add(className);
          setTimeout(() => {
            lastNote.classList.remove(className);
          }, 500);
        }
      }
    };

    window.addEventListener('midi-tracking-hit', handleTrackingHit as EventListener);
    return () => window.removeEventListener('midi-tracking-hit', handleTrackingHit as EventListener);
  }, []);
}
