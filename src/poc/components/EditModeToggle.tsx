import { useEffect } from 'react';
import './EditModeToggle.css';

interface EditModeToggleProps {
  advancedMode: boolean;
  onToggle: (enabled: boolean) => void;
}

/**
 * Toggle component for switching between simple and advanced edit modes
 * 
 * Simple mode: Left-click toggles notes on/off with default articulation
 * Advanced mode: Left-click opens context menu (same as right-click)
 */
function EditModeToggle({ advancedMode, onToggle }: EditModeToggleProps) {
  // Handle keyboard shortcut (E key)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only trigger if not in an input field
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.key === 'e' || event.key === 'E') {
        event.preventDefault();
        onToggle(!advancedMode);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [advancedMode, onToggle]);

  return (
    <div className="edit-mode-toggle">
      <label className="toggle-container">
        <input
          type="checkbox"
          checked={advancedMode}
          onChange={(e) => onToggle(e.target.checked)}
          aria-label="Advanced edit mode"
        />
        <span className="toggle-slider"></span>
        <span className="toggle-label">
          {advancedMode ? 'Advanced Mode' : 'Simple Mode'}
        </span>
      </label>
      <div className="mode-description">
        {advancedMode ? (
          <span>
            <strong>Advanced:</strong> Left-click opens articulation menu
          </span>
        ) : (
          <span>
            <strong>Simple:</strong> Left-click toggles notes on/off
          </span>
        )}
      </div>
      <div className="keyboard-hint">
        Press <kbd>E</kbd> to toggle
      </div>
    </div>
  );
}

export default EditModeToggle;

