/**
 * useMemoryProfiler - Memory Leak Detection Hook
 *
 * Tracks listener attachment counts by wrapping midiHandler.setNoteOnHandler.
 * Used in tests to verify that listeners are attached exactly once and not
 * re-attached on dependency changes.
 *
 * @example
 * const metrics = useMemoryProfiler();
 * // ... trigger listener attachments via component under test ...
 * expect(metrics.listenerAttachmentCount).toBe(1);
 * expect(metrics.lastAttachmentTime).not.toBeNull();
 */

import { useRef, useEffect } from 'react';
import { midiHandler } from '../midi/MIDIHandler';

export interface MemoryMetrics {
  listenerAttachmentCount: number;
  lastAttachmentTime: number | null;
}

export function useMemoryProfiler(): MemoryMetrics {
  const metricsRef = useRef<MemoryMetrics>({
    listenerAttachmentCount: 0,
    lastAttachmentTime: null,
  });

  useEffect(() => {
    // Capture the original method
    const originalMethod = midiHandler.setNoteOnHandler;

    // Replace with wrapper that counts attachments
    midiHandler.setNoteOnHandler = function (callback: any) {
      metricsRef.current.listenerAttachmentCount++;
      metricsRef.current.lastAttachmentTime = performance.now();
      originalMethod.call(this, callback);
    };

    // Cleanup: restore original method
    return () => {
      midiHandler.setNoteOnHandler = originalMethod;
    };
  }, []);

  return metricsRef.current;
}
