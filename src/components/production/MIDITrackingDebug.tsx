/**
 * MIDI Tracking Debug Component - Temporary POC
 *
 * Shows real-time visualization of:
 * - Which notes are found in the sheet music
 * - Which note is being highlighted on MIDI hits
 * - Tracking analysis scores
 * - All possible highlighting cases
 *
 * Can be easily removed later - just delete this file and remove from ProductionPage
 */

import { useState, useEffect } from 'react';
import { X, Eye } from 'lucide-react';
import { Button } from '../ui/button';

interface TrackingEvent {
  position: number;
  noteIndex: number;
  score: number;
  isGoodHit: boolean;
  timestamp: number;
}

interface FoundNote {
  index: number;
  element: SVGElement;
  highlighted: boolean;
}

export function MIDITrackingDebug() {
  const [isOpen, setIsOpen] = useState(false);
  const [foundNotes, setFoundNotes] = useState<FoundNote[]>([]);
  const [recentEvents, setRecentEvents] = useState<TrackingEvent[]>([]);
  const [isHighlighting, setIsHighlighting] = useState(false);

  // Find all notes in SVG on mount and when toggled
  useEffect(() => {
    if (!isOpen) return;

    const updateNotes = () => {
      const svg = document.querySelector('svg');
      if (!svg) {
        console.log('No SVG found');
        return;
      }

      const notes = Array.from(svg.querySelectorAll('.abcjs-note')) as SVGElement[];
      console.log(`Found ${notes.length} notes in SVG`, notes);

      setFoundNotes(
        notes.map((element, index) => ({
          index,
          element,
          highlighted: false,
        }))
      );
    };

    // Initial check
    updateNotes();

    // Also check periodically in case SVG renders after component mounts
    const interval = setInterval(updateNotes, 500);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Listen for MIDI tracking hits and log them
  useEffect(() => {
    const handleTrackingHit = (event: CustomEvent) => {
      const { position, analysis } = event.detail;
      const noteIndex = Math.floor(position / 2);

      const newEvent: TrackingEvent = {
        position,
        noteIndex,
        score: analysis.overall,
        isGoodHit: analysis.overall > 70,
        timestamp: Date.now(),
      };

      console.log('MIDI Tracking Hit:', newEvent);
      setRecentEvents((prev) => [newEvent, ...prev].slice(0, 10)); // Keep last 10
    };

    window.addEventListener('midi-tracking-hit', handleTrackingHit as EventListener);
    return () => window.removeEventListener('midi-tracking-hit', handleTrackingHit as EventListener);
  }, []);

  // Test highlighting a specific note
  const highlightNote = (noteIndex: number, isGood: boolean) => {
    if (noteIndex < 0 || noteIndex >= foundNotes.length) {
      console.log(`Note index ${noteIndex} out of range (0-${foundNotes.length - 1})`);
      return;
    }

    const note = foundNotes[noteIndex];
    const className = isGood ? 'midi-tracking-good' : 'midi-tracking-bad';

    console.log(`Highlighting note ${noteIndex} as ${className}`);

    // Add highlight
    note.element.classList.add(className);
    setIsHighlighting(true);

    // Remove after animation
    setTimeout(() => {
      note.element.classList.remove(className);
      setIsHighlighting(false);
    }, 500);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-full shadow-lg z-40"
        title="Open MIDI Tracking Debug (remove before production)"
      >
        <Eye className="w-4 h-4" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 bg-white dark:bg-slate-800 border-2 border-purple-500 rounded-lg shadow-xl p-4 z-50 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-300 dark:border-slate-600">
        <h3 className="font-bold text-purple-600 dark:text-purple-400">MIDI Tracking Debug POC</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Notes Found */}
      <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700/30 rounded">
        <p className="text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">
          Found Notes: {foundNotes.length}
        </p>
        {foundNotes.length === 0 ? (
          <p className="text-xs text-red-600 dark:text-red-400">
            ❌ No notes found! Check if SVG is rendered with .abcjs-note elements.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {foundNotes.slice(0, 16).map((note) => (
              <button
                key={note.index}
                onClick={() => highlightNote(note.index, true)}
                className="px-2 py-1 text-xs bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/50 rounded border border-green-300 dark:border-green-700 cursor-pointer"
                title={`Click to highlight (good hit)`}
              >
                N{note.index}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Test Controls */}
      <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-700/30 rounded">
        <p className="text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Test Highlighting</p>
        <div className="space-y-2">
          {foundNotes.length > 0 ? (
            <>
              <div className="flex gap-2">
                <Button
                  onClick={() => highlightNote(0, true)}
                  size="sm"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  Test Good Hit (N0)
                </Button>
                <Button
                  onClick={() => highlightNote(0, false)}
                  size="sm"
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  Test Bad Hit (N0)
                </Button>
              </div>
              {foundNotes.length > 5 && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => highlightNote(5, true)}
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    Test Good Hit (N5)
                  </Button>
                  <Button
                    onClick={() => highlightNote(5, false)}
                    size="sm"
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    Test Bad Hit (N5)
                  </Button>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400">No notes found to test</p>
          )}
        </div>
      </div>

      {/* Recent Events */}
      <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded">
        <p className="text-sm font-semibold mb-2 text-slate-700 dark:text-slate-300">Recent MIDI Hits</p>
        {recentEvents.length === 0 ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">No hits yet. Try hitting MIDI pads...</p>
        ) : (
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {recentEvents.map((event, i) => (
              <div
                key={i}
                className={`text-xs p-2 rounded ${
                  event.isGoodHit
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
                }`}
              >
                <div>
                  Pos: {event.position} → Note#{event.noteIndex} | Score: {event.score.toFixed(0)}
                </div>
                <div className="text-[10px] opacity-75">
                  {event.isGoodHit ? '✓ Good Hit' : '✗ Bad Hit'} ({new Date(event.timestamp).toLocaleTimeString()})
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Status */}
      <div className="mt-3 pt-3 border-t border-slate-300 dark:border-slate-600 text-xs text-slate-600 dark:text-slate-400">
        <p>
          Status: {isHighlighting ? '🟢 Highlighting...' : '⚪ Ready'} | Notes found: {foundNotes.length}
        </p>
        <p className="mt-1 text-[10px]">
          💡 This is a temporary POC. Delete MIDITrackingDebug.tsx when visualization is working!
        </p>
      </div>
    </div>
  );
}
