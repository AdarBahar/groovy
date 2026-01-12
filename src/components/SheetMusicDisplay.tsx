/**
 * SheetMusicDisplay Component
 *
 * Renders ABC notation as SVG sheet music using abcjs.
 * Updates in real-time as the groove changes.
 * Includes a vertical playback cursor that moves smoothly across the notation.
 * Supports multi-line notation with cursor tracking across lines.
 */

import { useRef, useEffect, useState, useMemo } from 'react';
import { GrooveData } from '../types';
import { grooveToABC, renderABC, GrooveUtils } from '../core';
import './SheetMusicDisplay.css';

/** Number of measures per line (must match ABCTranscoder.MEASURES_PER_LINE) */
const MEASURES_PER_LINE = 3;

interface LineBounds {
  top: number;      // Top of this line (percentage)
  bottom: number;   // Bottom of this line (percentage)
  left: number;     // Left edge of notes (percentage)
  right: number;    // Right edge of notes (percentage)
  startPos: number; // First position index on this line
  endPos: number;   // Last position index on this line
}

interface SheetMusicDisplayProps {
  groove: GrooveData;
  visible?: boolean;
  title?: string;
  currentPosition?: number;
  isPlaying?: boolean;
}

function SheetMusicDisplay({
  groove,
  visible = true,
  title,
  currentPosition = -1,
  isPlaying = false
}: SheetMusicDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const cursorRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [lineBounds, setLineBounds] = useState<LineBounds[]>([]);

  // Store lineBounds in ref for use in position update effect
  const lineBoundsRef = useRef<LineBounds[]>([]);
  lineBoundsRef.current = lineBounds;

  // Track previous position to detect loop reset
  const prevPositionRef = useRef<number>(-1);
  const isResettingRef = useRef<boolean>(false);

  // Total positions across all measures
  const totalPositions = useMemo(() => GrooveUtils.getTotalPositions(groove), [groove]);

  // Positions per measure
  const positionsPerMeasure = useMemo(() => {
    const ts = groove.timeSignature;
    return (groove.division / ts.noteValue) * ts.beats;
  }, [groove]);

  // Calculate transition duration for smooth cursor movement
  const transitionDurationMs = useMemo(() => {
    const beatDuration = 60 / groove.tempo;
    const subdivisionsPerBeat = groove.division / 4;
    return (beatDuration / subdivisionsPerBeat) * 1000;
  }, [groove.tempo, groove.division]);

  // Update cursor position via direct DOM manipulation (performance optimization)
  // This avoids React re-renders for high-frequency position updates
  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    const bounds = lineBoundsRef.current;
    const prevPos = prevPositionRef.current;

    // Detect loop reset
    const isLoopReset = prevPos >= totalPositions - 2 &&
                        currentPosition === 0 &&
                        isPlaying &&
                        prevPos !== -1;

    if (isLoopReset) {
      isResettingRef.current = true;
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          isResettingRef.current = false;
        });
      });
    }

    // Hide cursor if not playing or invalid position
    if (!isPlaying || currentPosition < 0 || bounds.length === 0) {
      cursor.style.display = 'none';
      prevPositionRef.current = currentPosition;
      return;
    }

    // Find the line for the current position
    const currentLine = bounds.find(
      line => currentPosition >= line.startPos && currentPosition <= line.endPos
    ) || bounds[0];

    if (!currentLine) {
      cursor.style.display = 'none';
      prevPositionRef.current = currentPosition;
      return;
    }

    // Calculate cursor position
    const targetPosition = isResettingRef.current ? 0 : currentPosition + 1;
    const linePositions = currentLine.endPos - currentLine.startPos + 1;
    const clampedTarget = Math.min(targetPosition, currentLine.endPos + 1);
    const posInLine = clampedTarget - currentLine.startPos;
    const lineWidth = currentLine.right - currentLine.left;
    let cursorLeft = currentLine.left + (posInLine / linePositions) * lineWidth;
    cursorLeft = Math.min(cursorLeft, currentLine.right);

    // Check if we're transitioning between lines
    const prevLine = bounds.find(
      line => prevPos >= line.startPos && prevPos <= line.endPos
    );
    const isLineTransition = prevLine !== currentLine && prevPos >= 0;

    // Update cursor styles directly
    cursor.style.display = 'block';
    cursor.style.left = `${cursorLeft}%`;
    cursor.style.top = `${currentLine.top}%`;
    cursor.style.height = `${currentLine.bottom - currentLine.top}%`;
    cursor.style.transition = (isResettingRef.current || isLineTransition)
      ? 'none'
      : `left ${transitionDurationMs}ms linear`;

    prevPositionRef.current = currentPosition;
  }, [currentPosition, isPlaying, totalPositions, transitionDurationMs]);

  // Reset state when playback stops
  useEffect(() => {
    if (!isPlaying) {
      prevPositionRef.current = -1;
      isResettingRef.current = false;
      if (cursorRef.current) {
        cursorRef.current.style.display = 'none';
      }
    }
  }, [isPlaying]);

  // Note highlighting disabled - abcjs note indices don't map 1:1 to positions
  // because rests don't create note elements. The cursor provides visual feedback instead.
  // TODO: Implement proper note-to-position mapping using abcjs timing info
  useEffect(() => {
    if (!containerRef.current) return;
    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;
    // Clear any previous highlighting
    svg.querySelectorAll('.abcjs-note.playing').forEach((el) => {
      el.classList.remove('playing');
    });
  }, [currentPosition, isPlaying]);

  useEffect(() => {
    if (!visible || !containerRef.current) {
      return;
    }

    try {
      // Convert groove to ABC notation
      const abc = grooveToABC(groove, { title });

      // Render ABC to SVG
      const result = renderABC(abc, containerRef.current, {
        staffWidth: 740,
        scale: 1.0,
        responsive: true,
        padding: 10,
      });

      if (!result.success) {
        setError(result.error || 'Failed to render notation');
      } else {
        setError(null);

        // After rendering, calculate line bounds for multi-line cursor support
        setTimeout(() => {
          if (containerRef.current && wrapperRef.current) {
            const svg = containerRef.current.querySelector('svg');
            if (svg) {
              const wrapperRect = wrapperRef.current.getBoundingClientRect();
              const svgRect = svg.getBoundingClientRect();
              const numMeasures = groove.measures.length;
              const posPerMeasure = positionsPerMeasure;
              const numLines = Math.ceil(numMeasures / MEASURES_PER_LINE);

              // Get barlines to determine measure boundaries (more accurate than notes)
              const barlines = Array.from(svg.querySelectorAll('.abcjs-bar'));
              // Get all notes/rests for fallback
              const notes = Array.from(svg.querySelectorAll('.abcjs-note, .abcjs-rest'));

              if (notes.length === 0) {
                setLineBounds([]);
                return;
              }

              // For multi-line, divide the SVG height evenly based on number of lines
              // Each "line" contains 2 staves (hands + feet)
              const bounds: LineBounds[] = [];
              const svgHeight = svgRect.height;
              const lineHeight = svgHeight / numLines;

              for (let lineIdx = 0; lineIdx < numLines; lineIdx++) {
                // Calculate vertical bounds for this line
                const lineTop = svgRect.top + lineIdx * lineHeight;
                const lineBottom = lineTop + lineHeight;

                // Convert to percentage relative to wrapper
                const topPct = ((lineTop - wrapperRect.top) / wrapperRect.height) * 100;
                const bottomPct = ((lineBottom - wrapperRect.top) / wrapperRect.height) * 100;

                // Calculate which positions are on this line
                const measuresOnLine = Math.min(MEASURES_PER_LINE, numMeasures - lineIdx * MEASURES_PER_LINE);
                const startPos = lineIdx * MEASURES_PER_LINE * posPerMeasure;
                const endPos = startPos + measuresOnLine * posPerMeasure - 1;

                // Find barlines on this line to get accurate measure boundaries
                const barlinesOnLine = barlines.filter(bar => {
                  const rect = bar.getBoundingClientRect();
                  const barY = rect.top + rect.height / 2;
                  return barY >= lineTop && barY < lineBottom;
                });

                // Find bounds for this line
                // Left bound: first note position (where beat 1 starts)
                // Right bound: last barline position (end of measure)
                let minX = Infinity;
                let maxX = -Infinity;

                // Find leftmost note on this line for the start position
                notes.forEach(note => {
                  const rect = note.getBoundingClientRect();
                  const noteY = rect.top + rect.height / 2;
                  if (noteY >= lineTop && noteY < lineBottom) {
                    const relLeft = ((rect.left - wrapperRect.left) / wrapperRect.width) * 100;
                    minX = Math.min(minX, relLeft);
                  }
                });

                // Use last barline for right bound (end of measure)
                if (barlinesOnLine.length > 0) {
                  const lastBarline = barlinesOnLine[barlinesOnLine.length - 1];
                  const lastRect = lastBarline.getBoundingClientRect();
                  maxX = ((lastRect.right - wrapperRect.left) / wrapperRect.width) * 100;
                } else {
                  // Fallback: use rightmost note
                  notes.forEach(note => {
                    const rect = note.getBoundingClientRect();
                    const noteY = rect.top + rect.height / 2;
                    if (noteY >= lineTop && noteY < lineBottom) {
                      const relRight = ((rect.right - wrapperRect.left) / wrapperRect.width) * 100;
                      maxX = Math.max(maxX, relRight);
                    }
                  });
                }

                // Final fallback
                if (minX === Infinity) minX = 5;
                if (maxX === -Infinity) maxX = 95;

                bounds.push({
                  top: Math.max(0, topPct),
                  bottom: Math.min(100, bottomPct),
                  left: minX,
                  right: maxX,
                  startPos,
                  endPos,
                });
              }

              setLineBounds(bounds);
            }
          }
        }, 50);
      }
    } catch (err) {
      console.error('SheetMusicDisplay error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [groove, visible, title, positionsPerMeasure, totalPositions]);

  if (!visible) {
    return null;
  }

  return (
    <div className="sheet-music-display">
      {error ? (
        <div className="sheet-music-error">
          <span>⚠️ {error}</span>
        </div>
      ) : (
        <div ref={wrapperRef} className="sheet-music-wrapper">
          <div
            ref={containerRef}
            className="sheet-music-container"
            aria-label="Sheet music notation"
          />
          {/* Vertical playback cursor line - position updated via direct DOM manipulation */}
          <div
            ref={cursorRef}
            className="sheet-music-cursor"
            style={{ display: 'none' }}
          />
        </div>
      )}
    </div>
  );
}

export default SheetMusicDisplay;

