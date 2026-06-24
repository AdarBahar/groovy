import { memo, useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Copy, Plus, Trash2, X, CopyCheck } from 'lucide-react';
import { GrooveData, DrumVoice, MAX_MEASURES, StickingValue, createEmptySticking } from '../../types';
import { GrooveUtils } from '../../core';
import { useDrumGrid, DRUM_ROWS, NoteChange } from '../../hooks/useDrumGrid';
import { useKeyboardEditor } from '../../hooks/useKeyboardEditor';
import BulkOperationsDialog from '../BulkOperationsDialog';
import NoteIcon from '../NoteIcon';
import StickingRow from './StickingRow';
import CountRow from './CountRow';

// Re-export NoteChange for backward compatibility
export type { NoteChange };

/**
 * Memoized drum cell component for performance optimization
 * Only re-renders when its specific props change
 */
interface DrumCellProps {
  measureIndex: number;
  rowIndex: number;
  pos: number;
  absolutePos: number;
  isActive: boolean;
  isDownbeat: boolean;
  variationLabel: string;
  activeVoices: DrumVoice[];
  hasVariations: boolean;
  isNonDefault: boolean;
  isKeyboardCursor: boolean;
  rowName: string;
  cellRef: (element: HTMLButtonElement | null) => void;
  onLeftClick: (e: React.MouseEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseEnter: () => void;
  onRightClick: (e: React.MouseEvent) => void;
  onFocus: () => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}

const DrumCell = memo(function DrumCell({
  measureIndex,
  rowIndex,
  pos,
  absolutePos,
  isActive,
  isDownbeat,
  variationLabel,
  activeVoices,
  hasVariations,
  isNonDefault,
  isKeyboardCursor,
  rowName,
  cellRef,
  onLeftClick,
  onMouseDown,
  onMouseEnter,
  onRightClick,
  onFocus,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}: DrumCellProps) {
  return (
    <button
      ref={cellRef}
      tabIndex={isKeyboardCursor ? 0 : -1}
      className={`drum-cell w-11 h-11 sm:w-12 sm:h-10 md:w-10 md:h-9 border cursor-pointer transition-all duration-150 flex items-center justify-center relative touch-target
        ${isActive ? 'bg-purple-600 hover:bg-purple-700 border-purple-500' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border-slate-300 dark:border-slate-600'}
        ${isDownbeat ? 'border-l-slate-400 dark:border-l-slate-500' : ''}
        ${isKeyboardCursor ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-white dark:ring-offset-slate-800 z-10' : ''}
      `}
      data-measure-index={measureIndex}
      data-row-index={rowIndex}
      data-position={pos}
      data-absolute-pos={absolutePos}
      onClick={onLeftClick}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onContextMenu={onRightClick}
      onFocus={onFocus}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      title={`${rowName} - ${variationLabel} at position ${pos + 1}${hasVariations ? ' (right-click for options)' : ''}`}
    >
      <NoteIcon voices={activeVoices} isActive={isActive} />
      {isActive && isNonDefault && hasVariations && (
        <span className="absolute top-0 right-0.5 text-xs text-white/70">*</span>
      )}
    </button>
  );
});

interface DrumGridDarkProps {
  groove: GrooveData;
  onNoteToggle: (voice: DrumVoice, position: number, measureIndex: number) => void;
  /** Batch set multiple notes at once (avoids React state batching issues) */
  onSetNotes?: (changes: NoteChange[]) => void;
  onPreview: (voice: DrumVoice) => void;
  advancedEditMode?: boolean;
  onMeasureDuplicate?: (measureIndex: number) => void;
  onMeasureAdd?: (afterIndex: number) => void;
  onMeasureRemove?: (measureIndex: number) => void;
  onMeasureClear?: (measureIndex: number) => void;
  /** Whether sticking setup mode is active (shows sticking row) */
  isStickingSetupActive?: boolean;
  /** Called when a sticking cell changes; receives measure index, subdivision index, new value */
  onStickingChange?: (measureIndex: number, subdivIndex: number, value: StickingValue) => void;
  /** Called when "Apply to Similar Measures" is clicked; receives measure index */
  onApplyToSimilar?: (measureIndex: number) => string;
  /** Called when the keyboard editor copies the current measure */
  onMeasureCopy?: (measureIndex: number) => void;
  /** Called when the keyboard editor pastes the copied measure after the current measure */
  onMeasurePaste?: (afterIndex: number) => boolean;
}

const KEYBOARD_HELP_TEXT = 'Keyboard editor. Space plays/pauses. Arrow keys move between cells. Enter toggles the default note. Tab opens variations. Shift or Alt with left and right arrows erases the adjacent cell. Control or Command with left and right arrows duplicates the current note. Control or Command C copies a measure. Control or Command V pastes it to the right.';

export function DrumGridDark({
  groove,
  onNoteToggle,
  onSetNotes,
  onPreview,
  advancedEditMode = false,
  onMeasureDuplicate,
  onMeasureAdd,
  onMeasureRemove,
  onMeasureClear,
  isStickingSetupActive = false,
  onStickingChange,
  onApplyToSimilar,
  onMeasureCopy,
  onMeasurePaste,
}: DrumGridDarkProps) {
  const grid = useDrumGrid({
    groove,
    onNoteToggle,
    onSetNotes,
    onPreview,
    advancedEditMode,
  });

  const handleStickingChange = useCallback((measureIndex: number, subdivIndex: number, value: StickingValue) => {
    onStickingChange?.(measureIndex, subdivIndex, value);
  }, [onStickingChange]);

  const {
    keyboardCursor,
    keyboardVariationIndex,
    keyboardMessage,
    cellRefs,
    getCellKey,
    registerCellRef,
    handleKeyboardEditKeyDown,
    handleKeyboardVariationSelect,
    setKeyboardCursor,
  } = useKeyboardEditor({
    groove,
    grid,
    onNoteToggle,
    onSetNotes,
    onPreview,
    onMeasureCopy,
    onMeasurePaste,
  });

  // Per-measure transient notification for "Apply to Similar" feedback
  const [applyMessages, setApplyMessages] = useState<Record<number, string>>({});
  const applyTimerRefs = useRef<Record<number, ReturnType<typeof setTimeout>>>({});

  const handleApplyToSimilarClick = useCallback((measureIndex: number) => {
    if (!onApplyToSimilar) return;
    const message = onApplyToSimilar(measureIndex);
    // Clear any existing timer for this measure
    if (applyTimerRefs.current[measureIndex]) {
      clearTimeout(applyTimerRefs.current[measureIndex]);
    }
    setApplyMessages(prev => ({ ...prev, [measureIndex]: message }));
    applyTimerRefs.current[measureIndex] = setTimeout(() => {
      setApplyMessages(prev => {
        const next = { ...prev };
        delete next[measureIndex];
        return next;
      });
    }, 2500);
  }, [onApplyToSimilar]);

  return (
    <div
      className={`flex flex-wrap gap-3 md:gap-4 mt-4 md:mt-6 ${grid.isDragging ? 'select-none' : ''}`}
      data-keyboard-editor="true"
      role="application"
      aria-label={KEYBOARD_HELP_TEXT}
      tabIndex={0}
      onKeyDown={handleKeyboardEditKeyDown}
      onFocus={(event) => {
        if (event.currentTarget === event.target) {
          const cell = cellRefs.current[getCellKey(keyboardCursor)];
          cell?.focus({ preventScroll: true });
        }
      }}
    >
      {keyboardMessage && (
        <div
          role="status"
          aria-live="polite"
          className="w-full text-xs font-medium text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/40 border border-amber-200 dark:border-amber-800 rounded-md px-3 py-2"
        >
          {keyboardMessage}
        </div>
      )}

      {groove.measures.map((measure, measureIndex) => {
        const positions = grid.getPositionsForMeasure(measureIndex);
        const ts = measure.timeSignature || groove.timeSignature;
        const canAdd = groove.measures.length < MAX_MEASURES;
        const canRemove = groove.measures.length > 1;

        return (
          <div
            key={measureIndex}
            className="inline-block bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 md:p-3 min-w-0"
          >
            {/* Measure Header */}
            <div className="flex items-center justify-between mb-2 md:mb-2">
              <span className="text-base md:text-lg font-semibold text-purple-600 dark:text-purple-400">
                Measure {measureIndex + 1}
              </span>
              <div className="flex items-center gap-1 md:gap-2">
                {/* Apply to Similar Measures button — only visible in sticking setup mode (D-11) */}
                {isStickingSetupActive && onApplyToSimilar && (
                  <button
                    onClick={() => handleApplyToSimilarClick(measureIndex)}
                    disabled={
                      !measure.sticking || !measure.sticking.some(v => v !== null)
                    }
                    className="w-9 h-9 md:w-8 md:h-8 flex items-center justify-center rounded hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed group touch-target"
                    title="Apply sticking to similar measures"
                  >
                    <CopyCheck className="w-4 h-4 text-purple-500 dark:text-purple-400 group-hover:text-purple-700 dark:group-hover:text-purple-300" />
                  </button>
                )}
                <button
                  onClick={() => onMeasureClear?.(measureIndex)}
                  className="w-9 h-9 md:w-8 md:h-8 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors group touch-target"
                  title="Clear measure"
                >
                  <Trash2 className="w-4 h-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white" />
                </button>
                <button
                  onClick={() => onMeasureDuplicate?.(measureIndex)}
                  disabled={!canAdd}
                  className="w-9 h-9 md:w-8 md:h-8 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group touch-target"
                  title="Duplicate measure"
                >
                  <Copy className="w-4 h-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white" />
                </button>
                <button
                  onClick={() => onMeasureAdd?.(measureIndex)}
                  disabled={!canAdd}
                  className="w-9 h-9 md:w-8 md:h-8 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group touch-target"
                  title="Add measure"
                >
                  <Plus className="w-4 h-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white" />
                </button>
                <button
                  onClick={() => onMeasureRemove?.(measureIndex)}
                  disabled={!canRemove}
                  className="w-9 h-9 md:w-8 md:h-8 flex items-center justify-center rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group touch-target"
                  title="Delete measure"
                >
                  <X className="w-4 h-4 text-red-500 dark:text-red-400 group-hover:text-red-600 dark:group-hover:text-red-300" />
                </button>
              </div>
            </div>

            {/* Apply to Similar feedback message */}
            {applyMessages[measureIndex] && (
              <div className="text-xs text-purple-600 dark:text-purple-400 mb-2 text-right font-medium">
                {applyMessages[measureIndex]}
              </div>
            )}

            {/* Beat Labels Row */}
            <div className="flex items-center mb-1.5">
              <div className="w-16 sm:w-20 md:w-20 flex-shrink-0" />
              {positions.map((pos) => {
                const countLabel = GrooveUtils.getCountLabel(pos, groove.division, ts.beats);
                return (
                  <div
                    key={pos}
                    className={`w-11 sm:w-12 md:w-10 text-center text-[10px] sm:text-xs leading-none font-medium ${
                      grid.isDownbeat(pos) ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    {countLabel}
                  </div>
                );
              })}
            </div>

            {/* Sticking Row — appears between beat counter and instrument rows when active */}
            {isStickingSetupActive && (
              <StickingRow
                stickingValues={
                  measure.sticking && measure.sticking.length === positions.length
                    ? measure.sticking
                    : createEmptySticking(positions.length)
                }
                onStickingChange={(subdivIndex, value) =>
                  handleStickingChange(measureIndex, subdivIndex, value)
                }
                isActive={isStickingSetupActive}
                measureIndex={measureIndex}
              />
            )}

            {/* Count Row — displays beat counting (1, &, 2, &, etc.) aligned with subdivisions */}
            <CountRow
              division={groove.division}
              timeSignature={ts}
              measureIndex={measureIndex}
            />

            {/* Drum Rows */}
            {DRUM_ROWS.map((row, rowIndex) => (
              <div key={rowIndex} className="flex items-center mb-1 last:mb-0" data-voice-group={row.defaultVoices[0]}>
                <button
                  onClick={() => grid.handleVoiceLabelClick(rowIndex, measureIndex)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    onPreview(row.defaultVoices[0]);
                  }}
                  className="w-16 sm:w-20 md:w-20 flex-shrink-0 px-1 sm:px-2 md:px-2 py-2 md:py-1.5 text-right text-xs sm:text-sm md:text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors touch-target"
                  title="Click for patterns, right-click to preview"
                >
                  {row.name}
                </button>

                {positions.map((pos) => {
                  const isActive = grid.isPositionActive(measureIndex, rowIndex, pos);
                  const absolutePos = GrooveUtils.measureToAbsolutePosition(groove, measureIndex, pos);
                  const isDown = grid.isDownbeat(pos);
                  const hasVariations = row.variations.length > 1;
                  const variationLabel = grid.getVariationLabel(measureIndex, rowIndex, pos);
                  const isNonDefault = variationLabel !== row.variations[0].label;
                  const activeVoices = grid.getActiveVoices(measureIndex, rowIndex, pos);
                  const cellCursor = { measureIndex, rowIndex, position: pos };
                  const isKeyboardCursor =
                    keyboardCursor.measureIndex === measureIndex &&
                    keyboardCursor.rowIndex === rowIndex &&
                    keyboardCursor.position === pos;

                  return (
                    <DrumCell
                      key={pos}
                      measureIndex={measureIndex}
                      rowIndex={rowIndex}
                      pos={pos}
                      absolutePos={absolutePos}
                      isActive={isActive}
                      isDownbeat={isDown}
                      variationLabel={variationLabel}
                      activeVoices={activeVoices}
                      hasVariations={hasVariations}
                      isNonDefault={isNonDefault}
                      isKeyboardCursor={isKeyboardCursor}
                      rowName={row.name}
                      cellRef={(element) => registerCellRef(cellCursor, element)}
                      onLeftClick={(e) => grid.handleLeftClick(e, measureIndex, rowIndex, pos)}
                      onMouseDown={(e) => grid.handleMouseDown(e, measureIndex, rowIndex, pos)}
                      onMouseEnter={() => grid.handleMouseEnter(measureIndex, rowIndex, pos)}
                      onRightClick={(e) => grid.handleRightClick(e, measureIndex, rowIndex, pos)}
                      onFocus={() => setKeyboardCursor(cellCursor)}
                      onTouchStart={(e) => grid.handleTouchStart(e, measureIndex, rowIndex, pos)}
                      onTouchMove={grid.handleTouchMove}
                      onTouchEnd={(e) => grid.handleTouchEnd(e, measureIndex, rowIndex, pos)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        );
      })}

      {/* Context Menu */}
      {grid.contextMenu?.visible && createPortal(
        <div
          ref={grid.contextMenuRef}
          data-placement={grid.contextMenu.placement}
          className="fixed z-50 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg py-2 min-w-[200px]"
          style={{ left: `${grid.contextMenu.x}px`, top: `${grid.contextMenu.y}px` }}
        >
          <div className="px-3 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-600 mb-1">
            {DRUM_ROWS[grid.contextMenu.rowIndex].name} - Select Sound
          </div>
          {DRUM_ROWS[grid.contextMenu.rowIndex].variations.map((variation, index) => {
            const selectedVoices = grid.getVoicesForPosition(
              grid.contextMenu!.measureIndex,
              grid.contextMenu!.rowIndex,
              grid.contextMenu!.position
            );
            const isSelected = variation.voices.length === selectedVoices.length &&
              variation.voices.every(v => selectedVoices.includes(v));
            const isKeyboardHighlighted = index === keyboardVariationIndex;

            return (
              <button
                key={index}
                className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors
                  ${isSelected ? 'text-purple-600 dark:text-purple-400' : 'text-slate-700 dark:text-slate-200'}
                  ${isKeyboardHighlighted ? 'bg-slate-100 dark:bg-slate-600' : ''}
                `}
                onClick={() => handleKeyboardVariationSelect(index)}
                onMouseEnter={() => onPreview(variation.voices[0])}
              >
                <span className="flex items-center gap-2">
                  {isSelected && <span className="text-purple-600 dark:text-purple-400">✓</span>}
                  {variation.label}
                </span>
                {variation.shortcut && (
                  <span className="text-xs text-slate-400">{variation.shortcut}</span>
                )}
              </button>
            );
          })}
        </div>,
        document.body
      )}

      {/* Bulk Operations Dialog */}
      {grid.bulkDialog?.visible && (
        <BulkOperationsDialog
          visible={grid.bulkDialog.visible}
          rowName={DRUM_ROWS[grid.bulkDialog.rowIndex].name}
          patterns={grid.getBulkPatternsForRow(grid.bulkDialog.rowIndex)}
          onPatternSelect={grid.handleBulkPatternSelect}
          onClose={() => grid.setBulkDialog(null)}
        />
      )}
    </div>
  );
}
