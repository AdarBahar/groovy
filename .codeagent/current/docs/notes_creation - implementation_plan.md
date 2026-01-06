# Note Creation Feature - Implementation Plan (Issue #3)

## Executive Summary

This plan outlines the implementation of the note creation and drum part mapping feature for Groovy, migrating from the legacy GrooveScribe implementation to a modern React/TypeScript architecture. The current POC has basic note toggling; this plan extends it to support all articulations, advanced editing modes, drag-to-paint, and bulk operations.

---

## Current State Analysis

### ✅ What's Already Working

1. **Basic Grid Structure** (`src/poc/components/DrumGrid.tsx`)
   - Drum rows with voice labels
   - Note cells with click handlers
   - Context menus for variations (hi-hat, snare, kick)
   - Visual indicators for active notes and current position
   - Downbeat highlighting
   - Count labels (1, e, &, a)

2. **Core Architecture**
   - `GrooveData` type with `notes: Record<DrumVoice, boolean[]>`
   - `onNoteToggle` callback for state updates
   - `onPreview` for sound preview
   - Voice selection tracking per position

3. **Supported Articulations**
   - Hi-Hat: closed, open, accent, crash, ride, ride-bell, cowbell, stacker
   - Snare: normal, accent, ghost, cross-stick, flam, rim
   - Toms: tom-10, tom-16, tom-floor (single variation each)
   - Kick: kick, hihat-foot, kick+hihat-foot combination

### ❌ What's Missing (Per Requirements)

1. **Advanced Edit Mode**
   - No toggle for advanced mode
   - Left-click doesn't delegate to right-click in advanced mode
   - No visual indicator for mode state

2. **Drag-to-Paint**
   - No Ctrl+drag to paint notes
   - No Alt+drag to erase notes
   - No `onMouseEnter` handlers with modifier key detection

3. **Bulk Operations**
   - Voice labels don't open bulk operation dialogs
   - No patterns like "all on", "upbeats only", "foot on beats"

4. **Additional Articulations**
   - Missing snare: drag, buzz (requirements mention these)
   - Missing hi-hat: metronome-normal, metronome-accent, cross, open/close states

5. **Visual Representation**
   - Simple dot (●) for all notes - no articulation-specific icons
   - No layered elements for complex states (e.g., snare accent + flam)
   - No distinction between kick circle and foot splash visually

---

## Implementation Phases

### Phase 1: Foundation & Data Model Enhancements

**Goal:** Extend type system and data model to support all articulations

#### Tasks:

1. **Add Missing DrumVoice Types** (`src/types.ts`)
   - Add: `snare-drag`, `snare-buzz`
   - Add: `hihat-metronome-normal`, `hihat-metronome-accent`, `hihat-cross`
   - Update `DEFAULT_GROOVE` to include these voices

2. **Create Articulation Metadata** (new file: `src/core/ArticulationConfig.ts`)
   ```typescript
   interface ArticulationMeta {
     voice: DrumVoice;
     label: string;
     icon?: string; // FontAwesome class or emoji
     shortcut?: string;
     category: 'hihat' | 'snare' | 'kick' | 'tom' | 'cymbal' | 'percussion';
   }
   ```

3. **Update DRUM_ROWS Configuration** (`src/poc/components/DrumGrid.tsx`)
   - Add all missing variations to each row
   - Include metadata for visual rendering

**Deliverables:**
- Extended type system
- Articulation metadata configuration
- Updated default groove with all voices

**Estimated Effort:** 2-3 hours

---

### Phase 2: Advanced Edit Mode

**Goal:** Implement advanced editing mode toggle and behavior

#### Tasks:

1. **Add Mode State** (`src/poc/PocApp.tsx`)
   ```typescript
   const [advancedEditMode, setAdvancedEditMode] = useState(false);
   ```

2. **Create Mode Toggle UI** (new component: `src/poc/components/EditModeToggle.tsx`)
   - Toggle button with visual indicator
   - Keyboard shortcut (e.g., 'E' key)
   - Tooltip explaining the difference

3. **Update Click Handlers** (`src/poc/components/DrumGrid.tsx`)
   ```typescript
   const handleLeftClick = (rowIndex: number, position: number) => {
     if (advancedEditMode) {
       // Delegate to right-click behavior
       handleRightClick(syntheticEvent, rowIndex, position);
     } else {
       // Simple toggle (existing behavior)
       // ...
     }
   };
   ```

4. **Visual Feedback**
   - Add CSS class to grid when in advanced mode
   - Change cursor style
   - Add mode indicator badge

**Deliverables:**
- Advanced mode toggle component
- Updated click behavior
- Visual mode indicators

**Estimated Effort:** 3-4 hours

---

### Phase 3: Drag-to-Paint Functionality

**Goal:** Implement Ctrl+drag (paint) and Alt+drag (erase) interactions

#### Tasks:

1. **Add Mouse State Tracking** (`src/poc/components/DrumGrid.tsx`)
   ```typescript
   const [isDragging, setIsDragging] = useState(false);
   const [dragMode, setDragMode] = useState<'paint' | 'erase' | null>(null);
   ```

2. **Implement Mouse Handlers**
   ```typescript
   const handleMouseDown = (e: React.MouseEvent, rowIndex: number, position: number) => {
     if (e.ctrlKey || e.altKey) {
       setIsDragging(true);
       setDragMode(e.ctrlKey ? 'paint' : 'erase');
       // Apply action to current cell
     }
   };

   const handleMouseEnter = (e: React.MouseEvent, rowIndex: number, position: number) => {
     if (isDragging && dragMode) {
       // Apply paint/erase action
     }
   };

   const handleMouseUp = () => {
     setIsDragging(false);
     setDragMode(null);
   };
   ```

3. **Global Mouse Event Listeners**
   - Add `mouseup` listener to document to catch drag end outside grid
   - Clean up on unmount

4. **Visual Feedback**
   - Change cursor during drag (crosshair for paint, eraser for erase)
   - Highlight cells as they're painted/erased
   - Add CSS transitions for smooth feedback

**Deliverables:**
- Drag-to-paint functionality
- Drag-to-erase functionality
- Visual feedback during drag operations

**Estimated Effort:** 4-5 hours

---

### Phase 4: Bulk Operations

**Goal:** Implement row-level bulk pattern operations

#### Tasks:

1. **Create Bulk Operations Dialog** (new component: `src/poc/components/BulkOperationsDialog.tsx`)
   ```typescript
   interface BulkOperation {
     label: string;
     pattern: (position: number, notesPerMeasure: number) => boolean;
     voices: DrumVoice[];
   }
   ```

2. **Define Patterns per Instrument**
   - **Hi-Hat:**
     - All on (every position)
     - Upbeats only (e, &, a positions)
     - Downbeats only (1, 2, 3, 4)
     - Eighth notes (1, &, 2, &, 3, &, 4, &)
   - **Snare:**
     - All on (accent/normal/ghost variants)
     - Backbeat (2 & 4)
     - All ghost notes
   - **Kick:**
     - All on
     - Four on the floor
     - Foot on beats (1, 2, 3, 4)
     - Foot on "&"s

3. **Update Voice Label Click Handler**
   ```typescript
   const handleVoiceLabelClick = (rowIndex: number, measureIndex: number) => {
     // Show bulk operations dialog for this row/measure
     setBulkDialog({ visible: true, rowIndex, measureIndex });
   };
   ```

4. **Apply Bulk Operations**
   - Iterate through measure positions
   - Apply pattern logic
   - Batch update notes
   - Preview sound after application

**Deliverables:**
- Bulk operations dialog component
- Pattern definitions for each instrument
- Integration with voice labels

**Estimated Effort:** 5-6 hours

---

### Phase 5: Enhanced Visual Representation

**Goal:** Implement articulation-specific icons and layered visual states

#### Tasks:

1. **Create Note Icon Component** (new: `src/poc/components/NoteIcon.tsx`)
   ```typescript
   interface NoteIconProps {
     voices: DrumVoice[];
     isActive: boolean;
   }
   ```

2. **Icon Mapping**
   - Use FontAwesome icons (already in requirements)
   - Map each articulation to specific icon
   - Support layered icons (e.g., accent arrow + note)

3. **Update Note Cell Rendering**
   - Replace simple dot with `<NoteIcon>`
   - Show multiple layers for complex states
   - Add color coding per instrument category

4. **CSS Enhancements**
   - Icon sizing and positioning
   - Layering with z-index
   - Animations for state changes

**Icon Examples (from requirements):**
- Hi-hat closed: `fa-plus`
- Hi-hat open: `fa-circle-o`
- Crash: `fa-asterisk`
- Ride: `fa-dot-circle-o`
- Snare accent: `fa-chevron-right`
- Snare ghost: `fa-circle` (smaller, dimmed)
- Kick: filled circle
- Foot splash: `fa-times`

**Deliverables:**
- NoteIcon component
- Icon mapping configuration
- Enhanced visual styling

**Estimated Effort:** 4-5 hours

---

### Phase 6: Testing & Refinement

**Goal:** Ensure all interactions work correctly and match requirements

#### Tasks:

1. **Unit Tests**
   - Test voice selection logic
   - Test bulk operation patterns
   - Test drag-to-paint state management

2. **Integration Tests**
   - Test mode switching
   - Test context menu interactions
   - Test keyboard shortcuts

3. **Manual Testing Scenarios**
   - Create complex grooves with all articulations
   - Test drag operations across measures
   - Test bulk operations on different time signatures
   - Verify playback matches visual state

4. **Performance Optimization**
   - Optimize re-renders during drag
   - Debounce preview sounds
   - Memoize expensive calculations

5. **Accessibility**
   - Keyboard navigation for grid
   - ARIA labels for screen readers
   - Focus management in dialogs

**Deliverables:**
- Test suite
- Performance optimizations
- Accessibility improvements

**Estimated Effort:** 6-8 hours

---

## Technical Architecture

### Component Hierarchy

```
PocApp
├── EditModeToggle
├── DrumGrid
│   ├── MeasureContainer (x2)
│   │   ├── CountLabels
│   │   └── DrumRow (x6)
│   │       ├── VoiceLabel (clickable for bulk ops)
│   │       └── NoteCell (x division)
│   │           └── NoteIcon (articulation-specific)
│   ├── ContextMenu (for variations)
│   └── BulkOperationsDialog
└── MiniPlayer
```

### State Management

```typescript
// App-level state
- groove: GrooveData
- advancedEditMode: boolean

// DrumGrid state
- voiceSelections: Record<string, DrumVoice[]>
- contextMenu: { visible, x, y, rowIndex, position } | null
- bulkDialog: { visible, rowIndex, measureIndex } | null
- isDragging: boolean
- dragMode: 'paint' | 'erase' | null
```

### Data Flow

1. **User clicks note cell**
   → `handleLeftClick` / `handleRightClick`
   → Update `voiceSelections` (if context menu)
   → Call `onNoteToggle` for each voice
   → Parent updates `groove.notes`
   → Re-render with new state

2. **User drags with Ctrl/Alt**
   → `handleMouseDown` sets drag mode
   → `handleMouseEnter` applies action to cells
   → Batch `onNoteToggle` calls
   → `handleMouseUp` clears drag state

3. **User clicks voice label**
   → Show `BulkOperationsDialog`
   → User selects pattern
   → Apply pattern to all positions in measure
   → Batch update notes

---

## File Structure

### New Files to Create

```
src/poc/components/
  ├── EditModeToggle.tsx
  ├── EditModeToggle.css
  ├── BulkOperationsDialog.tsx
  ├── BulkOperationsDialog.css
  ├── NoteIcon.tsx
  └── NoteIcon.css

src/core/
  ├── ArticulationConfig.ts
  └── BulkPatterns.ts

src/poc/components/__tests__/
  ├── DrumGrid.test.tsx
  ├── BulkOperationsDialog.test.tsx
  └── NoteIcon.test.tsx
```

### Files to Modify

```
src/types.ts                      # Add missing DrumVoice types
src/poc/components/DrumGrid.tsx   # Add drag handlers, bulk ops
src/poc/components/DrumGrid.css   # Enhanced styling
src/poc/PocApp.tsx                # Add advancedEditMode state
```

---

## Success Criteria

### Functional Requirements

- ✅ All articulations from requirements are supported
- ✅ Advanced mode toggle works correctly
- ✅ Left-click delegates to right-click in advanced mode
- ✅ Ctrl+drag paints notes with default articulation
- ✅ Alt+drag erases notes
- ✅ Voice labels open bulk operations dialog
- ✅ All bulk patterns work correctly
- ✅ Context menus show all variations
- ✅ Keyboard shortcuts work in context menus

### Visual Requirements

- ✅ Each articulation has distinct icon
- ✅ Complex states show layered icons
- ✅ Downbeats are highlighted
- ✅ Current position is animated
- ✅ Mode indicator shows current edit mode
- ✅ Drag operations show visual feedback

### Performance Requirements

- ✅ Grid renders smoothly with 48 divisions
- ✅ Drag operations don't lag
- ✅ Preview sounds don't overlap excessively
- ✅ No memory leaks from event listeners

---

## Risk Mitigation

### Risk 1: Complex State Management
**Mitigation:** Use React state carefully, consider useReducer for complex updates

### Risk 2: Performance with Many Notes
**Mitigation:** Memoize components, use React.memo, optimize re-renders

### Risk 3: Browser Compatibility
**Mitigation:** Test on Chrome, Firefox, Safari; use polyfills if needed

### Risk 4: Touch Device Support
**Mitigation:** Add touch event handlers alongside mouse events

---

## Timeline Estimate

| Phase | Effort | Dependencies |
|-------|--------|--------------|
| Phase 1: Foundation | 2-3 hours | None |
| Phase 2: Advanced Mode | 3-4 hours | Phase 1 |
| Phase 3: Drag-to-Paint | 4-5 hours | Phase 2 |
| Phase 4: Bulk Operations | 5-6 hours | Phase 1 |
| Phase 5: Visual Enhancement | 4-5 hours | Phase 1 |
| Phase 6: Testing | 6-8 hours | All phases |
| **Total** | **24-31 hours** | |

---

## Next Steps

1. Review this plan with stakeholders
2. Prioritize phases (can be done in parallel where dependencies allow)
3. Set up task tracking for each phase
4. Begin Phase 1 implementation
5. Iterate based on feedback

---

## References

- Requirements: `.codeagent/current/docs/notes_creation - requirements.md`
- Issue: #3 - [Feature] notes creation
- Current Implementation: `src/poc/components/DrumGrid.tsx`
- Type Definitions: `src/types.ts`


