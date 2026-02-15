/**
 * useMIDIFeedback - Visual Feedback for MIDI Hits
 *
 * Listens for MIDI note hits and provides visual feedback by highlighting
 * the corresponding drum voice in the grid.
 *
 * Uses direct DOM manipulation for performance (similar to usePlaybackHighlight).
 */

import { useEffect } from 'react';
import { DrumVoice } from '../types';

interface MIDINoteHitDetail {
  voice: DrumVoice;
  velocity: number;
  timestamp: number;
}

/**
 * Hook to highlight drum pads when MIDI notes are received
 * Adds a CSS class to the corresponding row/cell for visual feedback
 */
export function useMIDIFeedback() {
  useEffect(() => {
    const handleMIDINoteHit = (event: CustomEvent<MIDINoteHitDetail>) => {
      const { voice } = event.detail;

      // Find the drum row element for this voice
      const rowElement = document.querySelector(`[data-voice-group="${voice}"]`);
      if (!rowElement) return;

      // Add the MIDI hit class for animation
      rowElement.classList.add('midi-hit');

      // Remove the class after animation completes (200ms)
      setTimeout(() => {
        rowElement.classList.remove('midi-hit');
      }, 200);
    };

    // Listen for MIDI note hit events
    window.addEventListener('midi-note-hit', handleMIDINoteHit as EventListener);

    return () => {
      window.removeEventListener('midi-note-hit', handleMIDINoteHit as EventListener);
    };
  }, []);
}
