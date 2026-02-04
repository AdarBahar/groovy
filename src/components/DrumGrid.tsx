import { GrooveData, DrumVoice, MAX_MEASURES } from '../types';
import { GrooveUtils } from '../core';
import { useDrumGrid, DRUM_ROWS, NoteChange } from '../hooks/useDrumGrid';
import BulkOperationsDialog from './BulkOperationsDialog';
import NoteIcon from './NoteIcon';
import './DrumGrid.css';

// Re-export NoteChange for backward compatibility
export type { NoteChange };

interface DrumGridProps {
  groove: GrooveData;
  currentPosition: number;
  onNoteToggle: (voice: DrumVoice, position: number, measureIndex: number) => void;
  /** Batch set multiple notes at once (avoids React state batching issues) */
  onSetNotes?: (changes: NoteChange[]) => void;
  onPreview: (voice: DrumVoice) => void;
  advancedEditMode?: boolean;
  // Measure manipulation callbacks
  onMeasureDuplicate?: (measureIndex: number) => void;
  onMeasureAdd?: (afterIndex: number) => void;
  onMeasureRemove?: (measureIndex: number) => void;
  onMeasureClear?: (measureIndex: number) => void;
}

function DrumGrid({
  groove,
  currentPosition,
  onNoteToggle,
  onSetNotes,
  onPreview,
  advancedEditMode = false,
  onMeasureDuplicate,
  onMeasureAdd,
  onMeasureRemove,
  onMeasureClear,
}: DrumGridProps) {
  const grid = useDrumGrid({
    groove,
    onNoteToggle,
    onSetNotes,
    onPreview,
    advancedEditMode,
  });

  return (
    <div className={`drum-grid ${grid.isDragging ? 'dragging' : ''}`}>
      <div className="measures-container">
        {groove.measures.map((measure, measureIndex) => {
          const positions = grid.getPositionsForMeasure(measureIndex);
          const ts = measure.timeSignature || groove.timeSignature;

          const canAdd = groove.measures.length < MAX_MEASURES;
          const canRemove = groove.measures.length > 1;

          return (
            <div key={measureIndex} className="measure">
              {/* Measure header with label and action buttons */}
              <div className="measure-header">
                <div className="measure-label">Measure {measureIndex + 1}</div>
                <div className="measure-actions">
                  <button
                    className="measure-action-btn"
                    onClick={() => onMeasureClear?.(measureIndex)}
                    title="Clear all notes in this measure"
                    aria-label="Clear measure"
                  >
                    🗑️
                  </button>
                  <button
                    className="measure-action-btn"
                    onClick={() => onMeasureDuplicate?.(measureIndex)}
                    disabled={!canAdd}
                    title={canAdd ? "Duplicate this measure" : "Maximum measures reached"}
                    aria-label="Duplicate measure"
                  >
                    📋
                  </button>
                  <button
                    className="measure-action-btn"
                    onClick={() => onMeasureAdd?.(measureIndex)}
                    disabled={!canAdd}
                    title={canAdd ? "Add empty measure after this one" : "Maximum measures reached"}
                    aria-label="Add measure"
                  >
                    ➕
                  </button>
                  <button
                    className="measure-action-btn remove"
                    onClick={() => onMeasureRemove?.(measureIndex)}
                    disabled={!canRemove}
                    title={canRemove ? "Remove this measure" : "Cannot remove last measure"}
                    aria-label="Remove measure"
                  >
                    ❌
                  </button>
                </div>
              </div>

              {/* Count labels header */}
              <div className="grid-header">
                <div className="voice-label-header">Drum</div>
                {positions.map((pos) => {
                  const countLabel = GrooveUtils.getCountLabel(
                    pos,
                    groove.division,
                    ts.beats
                  );
                  return (
                    <div
                      key={pos}
                      className={`count-label ${grid.isDownbeat(pos) ? 'downbeat' : ''}`}
                    >
                      {countLabel}
                    </div>
                  );
                })}
              </div>

              {/* Drum rows */}
              {DRUM_ROWS.map((row, rowIndex) => (
                <div key={rowIndex} className="drum-row">
                  <button
                    className="voice-label"
                    onClick={() => grid.handleVoiceLabelClick(rowIndex, measureIndex)}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      onPreview(row.defaultVoices[0]);
                    }}
                    title={`Click for bulk operations, right-click to preview ${row.name}`}
                  >
                    {row.name}
                  </button>

                  {positions.map((pos) => {
                    const isActive = grid.isPositionActive(measureIndex, rowIndex, pos);
                    const absolutePos = GrooveUtils.measureToAbsolutePosition(groove, measureIndex, pos);
                    const isCurrent = absolutePos === currentPosition;
                    const isDown = grid.isDownbeat(pos);
                    const variationLabel = grid.getVariationLabel(measureIndex, rowIndex, pos);
                    const hasVariations = row.variations.length > 1;
                    const isNonDefault = variationLabel !== row.variations[0].label;
                    const activeVoices = grid.getActiveVoices(measureIndex, rowIndex, pos);

                    return (
                      <button
                        key={pos}
                        className={`note-cell ${isActive ? 'active' : ''} ${
                          isCurrent ? 'current' : ''
                        } ${isDown ? 'downbeat' : ''} ${hasVariations ? 'has-variations' : ''} ${isNonDefault ? 'non-default' : ''} ${advancedEditMode ? 'advanced-mode' : ''} ${grid.isDragging ? (grid.dragMode === 'paint' ? 'drag-paint' : 'drag-erase') : ''}`}
                        data-measure-index={measureIndex}
                        data-row-index={rowIndex}
                        data-position={pos}
                        onClick={(e) => grid.handleLeftClick(e, measureIndex, rowIndex, pos)}
                        onMouseDown={(e) => grid.handleMouseDown(e, measureIndex, rowIndex, pos)}
                        onMouseEnter={() => grid.handleMouseEnter(measureIndex, rowIndex, pos)}
                        onContextMenu={(e) => grid.handleRightClick(e, measureIndex, rowIndex, pos)}
                        onTouchStart={(e) => grid.handleTouchStart(e, measureIndex, rowIndex, pos)}
                        onTouchMove={grid.handleTouchMove}
                        onTouchEnd={(e) => grid.handleTouchEnd(e, measureIndex, rowIndex, pos)}
                        title={`${row.name} - ${variationLabel} at position ${pos + 1}${hasVariations ? (advancedEditMode ? ' (click for options)' : ' (right-click for options)') : ''}`}
                      >
                        <NoteIcon voices={activeVoices} isActive={isActive} />
                        {isActive && isNonDefault && hasVariations && (
                          <span className="variation-indicator">*</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Context Menu */}
      {grid.contextMenu?.visible && (
        <div
          ref={grid.contextMenuRef}
          className="context-menu"
          style={{
            position: 'fixed',
            left: `${grid.contextMenu.x}px`,
            top: `${grid.contextMenu.y}px`,
          }}
        >
          <div className="context-menu-header">
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

            return (
              <button
                key={index}
                className={`context-menu-item ${isSelected ? 'selected' : ''}`}
                onClick={() => grid.handleVoiceSelect(variation.voices)}
                onMouseEnter={() => onPreview(variation.voices[0])}
              >
                <span className="menu-item-label">{variation.label}</span>
                {variation.shortcut && (
                  <span className="menu-item-shortcut">{variation.shortcut}</span>
                )}
              </button>
            );
          })}
        </div>
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

export default DrumGrid;
