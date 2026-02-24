import { useEffect, useRef } from 'react';
import { GrooveData } from '../types';

/**
 * useGrooveSync
 *
 * Centralized engine synchronization hook for GrooveEditor.
 *
 * This hook automatically synchronizes groove changes to the audio engine,
 * eliminating the need for manual updateGroove calls throughout the component.
 *
 * The hook only triggers synchronization when audio-relevant properties change:
 * - tempo, swing, division, timeSignature, measures
 *
 * Metadata changes (title, author, comments) do NOT trigger synchronization,
 * improving performance by avoiding unnecessary engine updates.
 *
 * @param groove - Current groove state
 * @param updateGroove - Function to call when groove audio properties change
 *
 * @example
 * ```tsx
 * const { isPlaying, updateGroove } = useGrooveEngine();
 * const groove = useHistory<GrooveData>(...);
 *
 * useGrooveSync(groove, updateGroove);
 * // Now whenever groove changes, engine is automatically synced
 * ```
 */
export function useGrooveSync(groove: GrooveData, updateGroove: (groove: GrooveData) => void): void {
  const prevGrooveRef = useRef<GrooveData | null>(null);

  useEffect(() => {
    // Skip if groove hasn't actually changed (reference check first, then compare audio-relevant fields)
    if (prevGrooveRef.current) {
      const prev = prevGrooveRef.current;

      // Only sync if audio-relevant properties changed (not metadata like title/author/comments)
      const audioChanged =
        prev.tempo !== groove.tempo ||
        prev.swing !== groove.swing ||
        prev.division !== groove.division ||
        prev.timeSignature.beats !== groove.timeSignature.beats ||
        prev.timeSignature.noteValue !== groove.timeSignature.noteValue ||
        prev.measures !== groove.measures; // Reference check for measures array

      if (!audioChanged) {
        prevGrooveRef.current = groove;
        return;
      }
    }

    prevGrooveRef.current = groove;
    updateGroove(groove);
  }, [groove, updateGroove]);
}
