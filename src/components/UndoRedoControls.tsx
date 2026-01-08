import './UndoRedoControls.css';

interface UndoRedoControlsProps {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
}

/**
 * Undo/Redo controls component
 */
function UndoRedoControls({ canUndo, canRedo, onUndo, onRedo }: UndoRedoControlsProps) {
  return (
    <div className="undo-redo-controls">
      <button
        className="undo-button"
        onClick={onUndo}
        disabled={!canUndo}
        title="Undo (Ctrl+Z / ⌘+Z)"
        aria-label="Undo"
      >
        <i className="fa fa-undo" aria-hidden="true"></i>
        <span className="button-label">Undo</span>
      </button>
      <button
        className="redo-button"
        onClick={onRedo}
        disabled={!canRedo}
        title="Redo (Ctrl+Shift+Z / ⌘+Shift+Z)"
        aria-label="Redo"
      >
        <i className="fa fa-repeat" aria-hidden="true"></i>
        <span className="button-label">Redo</span>
      </button>
    </div>
  );
}

export default UndoRedoControls;

