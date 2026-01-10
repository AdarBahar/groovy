import { useEffect, useRef, useState } from 'react';
import { BulkPattern } from '../core/BulkPatterns';
import { PatternManager, CustomPattern } from '../core/PatternManager';
import './BulkOperationsDialog.css';

interface BulkOperationsDialogProps {
  visible: boolean;
  rowName: string;
  patterns: BulkPattern[];
  onPatternSelect: (pattern: BulkPattern) => void;
  onClose: () => void;
  onSaveCurrentPattern?: () => void;
}

/**
 * Dialog for selecting bulk operations to apply to a drum row
 */
function BulkOperationsDialog({
  visible,
  rowName,
  patterns,
  onPatternSelect,
  onClose,
  onSaveCurrentPattern,
}: BulkOperationsDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [customPatterns, setCustomPatterns] = useState<CustomPattern[]>([]);
  const [_showSaveDialog, _setShowSaveDialog] = useState(false);
  void _showSaveDialog; void _setShowSaveDialog; // TODO: implement save custom pattern feature

  // Load custom patterns for this category
  useEffect(() => {
    if (!visible) return;

    const category = rowName.toLowerCase() as 'hihat' | 'snare' | 'kick' | 'tom';
    const loaded = PatternManager.loadPatternsByCategory(category);
    setCustomPatterns(loaded);
  }, [visible, rowName]);

  // Close on click outside
  useEffect(() => {
    if (!visible) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dialogRef.current && !dialogRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [visible, onClose]);

  const handleDeletePattern = (id: string) => {
    PatternManager.deletePattern(id);
    const category = rowName.toLowerCase() as 'hihat' | 'snare' | 'kick' | 'tom';
    setCustomPatterns(PatternManager.loadPatternsByCategory(category));
  };

  if (!visible) return null;

  const _allPatterns = [...patterns, ...customPatterns];
  void _allPatterns; // TODO: use when custom patterns UI is added

  return (
    <div className="bulk-operations-overlay">
      <div ref={dialogRef} className="bulk-operations-dialog">
        <div className="bulk-dialog-header">
          <h3>Bulk Operations - {rowName}</h3>
          <button className="close-button" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="bulk-dialog-content">
          <p className="bulk-dialog-description">
            Select a pattern to apply to all positions in this measure:
          </p>

          {onSaveCurrentPattern && (
            <button
              className="save-pattern-button"
              onClick={() => _setShowSaveDialog(true)}
            >
              <i className="fa fa-save" aria-hidden="true"></i>
              Save Current Pattern
            </button>
          )}

          <div className="pattern-list">
            {/* Built-in patterns */}
            {patterns.length > 0 && (
              <>
                <div className="pattern-section-header">Built-in Patterns</div>
                {patterns.map((pattern) => (
                  <button
                    key={pattern.id}
                    className="pattern-button"
                    onClick={() => {
                      onPatternSelect(pattern);
                      onClose();
                    }}
                  >
                    <div className="pattern-label">{pattern.label}</div>
                    <div className="pattern-description">{pattern.description}</div>
                  </button>
                ))}
              </>
            )}

            {/* Custom patterns */}
            {customPatterns.length > 0 && (
              <>
                <div className="pattern-section-header">Custom Patterns</div>
                {customPatterns.map((pattern) => (
                  <div key={pattern.id} className="custom-pattern-row">
                    <button
                      className="pattern-button custom"
                      onClick={() => {
                        onPatternSelect(pattern);
                        onClose();
                      }}
                    >
                      <div className="pattern-label">
                        <i className="fa fa-star" aria-hidden="true"></i>
                        {pattern.label}
                      </div>
                      <div className="pattern-description">{pattern.description}</div>
                    </button>
                    <button
                      className="delete-pattern-button"
                      onClick={() => handleDeletePattern(pattern.id)}
                      title="Delete pattern"
                      aria-label="Delete pattern"
                    >
                      <i className="fa fa-trash" aria-hidden="true"></i>
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BulkOperationsDialog;

