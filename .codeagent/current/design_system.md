# Design System

UI patterns, design decisions, and style guide for Groovy.

---

## Design Philosophy

1. **Clean & Minimal** - Focus on functionality, avoid clutter
2. **Musical & Playful** - Reflect the joy of making music
3. **Accessible** - Usable by everyone, including keyboard-only users
4. **Responsive** - Works on desktop, tablet, and mobile
5. **Performance** - Fast, smooth interactions

---

## Color Palette

### POC Page (Current)
- **Background**: `#1a1a1a` (dark gray)
- **Card Background**: `#2a2a2a` (lighter gray)
- **Primary**: `#4CAF50` (green) - Play button, active states
- **Danger**: `#f44336` (red) - Stop button
- **Accent**: `#2196F3` (blue) - Links, highlights
- **Text**: `#ffffff` (white)
- **Muted Text**: `rgba(255, 255, 255, 0.7)` (semi-transparent white)

### Production Page (Current)
- **Background**: `linear-gradient(135deg, #667eea 0%, #764ba2 100%)` (purple gradient)
- **Text**: `#ffffff` (white)
- **Card Background**: `rgba(255, 255, 255, 0.1)` (semi-transparent white)

### Future Considerations
- Define primary, secondary, tertiary colors
- Define semantic colors (success, warning, error, info)
- Support light/dark mode toggle
- Ensure WCAG AA contrast ratios (4.5:1 for text)

---

## Typography

### Current
- **Font Family**: System font stack (default browser fonts)
- **Headings**: Bold, larger sizes
- **Body**: Regular weight, 16px base size

### Recommended (Future)
```css
--font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
--font-family-mono: 'Courier New', Courier, monospace;

--font-size-xs: 0.75rem;   /* 12px */
--font-size-sm: 0.875rem;  /* 14px */
--font-size-base: 1rem;    /* 16px */
--font-size-lg: 1.125rem;  /* 18px */
--font-size-xl: 1.25rem;   /* 20px */
--font-size-2xl: 1.5rem;   /* 24px */
--font-size-3xl: 1.875rem; /* 30px */
--font-size-4xl: 2.25rem;  /* 36px */
```

---

## Spacing

### Current (Inconsistent)
- Various pixel values used throughout

### Recommended (Future)
```css
--spacing-xs: 0.25rem;  /* 4px */
--spacing-sm: 0.5rem;   /* 8px */
--spacing-md: 1rem;     /* 16px */
--spacing-lg: 1.5rem;   /* 24px */
--spacing-xl: 2rem;     /* 32px */
--spacing-2xl: 3rem;    /* 48px */
--spacing-3xl: 4rem;    /* 64px */
```

---

## Components

### DrumGrid (POC)
**Purpose**: Interactive drum pattern editor with articulation support

**Design**:
- Grid layout with rows for each drum voice (hihat, snare, kick)
- Columns for each beat position (16 by default)
- Cells show articulation-specific icons (Font Awesome)
- Active cells highlighted with voice-specific color
- Current playback position highlighted
- Touch-friendly sizing (44x44px minimum)

**Colors**:
- Hihat: `#FFD700` (gold)
- Snare: `#FF6B6B` (red)
- Kick: `#4ECDC4` (teal)
- Active cell: Voice color with opacity
- Current position: Bright highlight

**Interaction** (2026-01-05 enhancements):
- **Simple Mode (default)**:
  - Left-click to toggle note on/off
  - Right-click to open articulation menu
- **Advanced Mode** (toggle with 'E'):
  - Left-click to open articulation menu
  - Right-click to open articulation menu
- **Drag-to-Paint**:
  - Ctrl+drag to paint notes (crosshair cursor)
  - Alt+drag to erase notes (not-allowed cursor)
- **Touch Support**:
  - Tap to toggle note
  - Drag to paint notes
  - Long-press (500ms) to open articulation menu
- **Visual Feedback**:
  - Hover shows pointer cursor
  - Drag mode shows crosshair or not-allowed cursor
  - Icons change based on articulation

---

### PlaybackControls (POC)
**Purpose**: Play/stop buttons

**Design**:
- Large, prominent buttons
- Play button: Green background, ▶ icon
- Stop button: Red background, ■ icon
- Disabled state: Grayed out

**States**:
- Default: Colored background
- Hover: Slightly lighter
- Active: Slightly darker
- Disabled: Gray, no pointer

---

### TempoControl (POC)
**Purpose**: Adjust tempo and swing

**Design**:
- Labeled sliders with current value display
- Tempo: 40-240 BPM
- Swing: 0-100%
- Value updates in real-time

**Layout**:
- Label on left
- Slider in middle
- Value on right

---

### PresetSelector (POC)
**Purpose**: Load preset patterns

**Design**:
- Dropdown or button grid
- Preset names: "Basic Rock", "Disco", "Funk", etc.
- Click to load preset

**Interaction**:
- Click to load
- Visual feedback on selection
- Applies immediately (or on next loop if playing)

---

### SyncControl (POC)
**Purpose**: Select sync mode (start/middle/end)

**Design**:
- Radio buttons or segmented control
- Options: "Start", "Middle", "End"
- Selected option highlighted
- **Default**: "Start" (as of 2026-01-05)

**Sync Modes**:
- **Start**: Visual playhead appears at the beginning of each note (default)
- **Middle**: Visual playhead appears in the middle of each note
- **End**: Visual playhead appears at the end of each note

**Reasoning for Default**:
- "Start" is more intuitive for most users
- Matches common DAW behavior
- Playhead appears when note starts playing

---

### Navigation (Shared)
**Purpose**: Switch between POC and Production pages

**Design**:
- Fixed position (top-right corner)
- Button with link to other page
- Minimal, non-intrusive

**States**:
- Default: Semi-transparent
- Hover: Fully opaque

---

### EditModeToggle (POC) - NEW 2026-01-05
**Purpose**: Toggle between simple and advanced edit modes

**Design**:
- Toggle switch with label
- Shows current mode (Simple/Advanced)
- Purple accent color when advanced mode active
- Keyboard shortcut: 'E' key

**States**:
- Simple Mode: Gray background, "Simple" label
- Advanced Mode: Purple background, "Advanced" label
- Hover: Slightly lighter background

---

### BulkOperationsDialog (POC) - NEW 2026-01-05
**Purpose**: Select bulk patterns to apply to entire measure

**Design**:
- Modal dialog overlay
- Pattern buttons in grid layout
- Built-in patterns section
- Custom patterns section (with star icons)
- Save current pattern button (gradient purple)
- Delete buttons for custom patterns (red)

**Patterns**:
- **Hi-Hat**: All On, Upbeats, Downbeats, Eighths, Clear
- **Snare**: All On, Backbeat, Ghost Notes, Accents, Clear
- **Kick**: All On, Four on Floor, Foot on Beats, Foot on "&"s, Clear

**Interaction**:
- Click voice label (Hi-Hat, Snare, Kick) to open
- Click pattern to apply and close
- Click save button to save current pattern
- Click delete button to remove custom pattern
- Click outside or X to close without applying

---

### NoteIcon (POC) - NEW 2026-01-05
**Purpose**: Display articulation-specific icons in grid cells

**Design**:
- Font Awesome icons
- Different icon for each articulation
- Scales with cell size
- Color matches voice color

**Icon Mappings**:
- Normal: `fa-circle`
- Accent: `fa-circle-exclamation`
- Ghost: `fa-circle-o`
- Rim: `fa-circle-dot`
- Drag/Buzz: `fa-wave-square`
- Open: `fa-circle-o`
- Half-Open: `fa-adjust`
- Pedal: `fa-shoe-prints`
- Cross-Stick: `fa-xmark`
- Metronome: `fa-bell`

---

### UndoRedoControls (POC) - NEW 2026-01-05
**Purpose**: Undo/redo buttons with keyboard shortcuts

**Design**:
- Two buttons side-by-side
- Undo button: `fa-undo` icon + "Undo" label
- Redo button: `fa-repeat` icon + "Redo" label
- Disabled state when no actions available
- Tooltips show keyboard shortcuts

**States**:
- Enabled: White background, colored on hover
- Disabled: Gray, 40% opacity, no pointer
- Hover: Purple border and text

**Keyboard Shortcuts**:
- Undo: Ctrl+Z (⌘+Z on Mac)
- Redo: Ctrl+Shift+Z or Ctrl+Y (⌘+Shift+Z or ⌘+Y on Mac)

**Responsive**:
- Desktop: Show icon + label
- Mobile: Show icon only (labels hidden)

---

## Layout Patterns

### POC Page
- **Structure**: Centered card layout
- **Max Width**: 1200px
- **Padding**: 2rem
- **Background**: Dark gradient

### Production Page
- **Structure**: Full-screen with header, main, footer
- **Header**: Centered title and subtitle
- **Main**: Centered content
- **Footer**: Links and navigation

---

## Interaction Patterns

### Button Clicks
- Visual feedback (color change, scale)
- Haptic feedback (if supported)
- Disabled state prevents clicks

### Slider Changes
- Real-time value updates
- Smooth dragging
- Snap to integer values (for tempo)

### Grid Cell Toggles
- Immediate visual feedback
- Sound preview on click (optional)
- Pending changes indicator during playback

---

## Accessibility

### Current
- Basic semantic HTML
- Some ARIA labels

### Improvements Needed
- **Keyboard Navigation**: Tab through all interactive elements
- **Focus Indicators**: Visible focus outlines
- **ARIA Labels**: Descriptive labels for screen readers
- **Color Contrast**: Ensure WCAG AA compliance
- **Alt Text**: For any images/icons
- **Skip Links**: Skip to main content

### Keyboard Shortcuts (Future)
- `Space`: Play/pause
- `Arrow Keys`: Navigate grid
- `Enter`: Toggle cell
- `+/-`: Adjust tempo
- `[/]`: Adjust swing

---

## Responsive Design

### Breakpoints (Recommended)
```css
--breakpoint-sm: 640px;   /* Mobile */
--breakpoint-md: 768px;   /* Tablet */
--breakpoint-lg: 1024px;  /* Desktop */
--breakpoint-xl: 1280px;  /* Large desktop */
```

### Mobile Considerations
- Larger touch targets (min 44x44px)
- Simplified layout (stack vertically)
- Reduce grid columns on small screens
- Hide non-essential controls

---

## Animation & Transitions

### Current
- Button hover transitions (0.3s)
- Smooth color changes

### Recommended
```css
--transition-fast: 150ms ease-in-out;
--transition-base: 300ms ease-in-out;
--transition-slow: 500ms ease-in-out;
```

### Use Cases
- Button hover: `transition-fast`
- Panel open/close: `transition-base`
- Page transitions: `transition-slow`

---

## Icons

### Current
- Text-based icons (▶, ■, etc.)

### Future Considerations
- Use icon library (Heroicons, Feather Icons, Material Icons)
- Consistent size and style
- Accessible (with ARIA labels)

---

## Forms (Future)

### Input Fields
- Clear labels
- Placeholder text (optional)
- Validation messages
- Error states (red border, error text)
- Success states (green border, checkmark)

### Buttons
- Primary: Solid background, white text
- Secondary: Outline, colored text
- Tertiary: Text only, no border

---

## Loading States (Future)

### Spinner
- Centered, animated spinner
- Used for async operations (sample loading, saving, etc.)

### Skeleton Screens
- Placeholder content while loading
- Matches final layout

### Progress Bars
- For long operations (e.g., exporting MIDI)

---

## Error States (Future)

### Error Messages
- Red background or border
- Clear, actionable message
- Dismiss button (X icon)

### Empty States
- Friendly message ("No patterns yet")
- Call-to-action button ("Create your first pattern")

---

## Dark Mode (Future)

### Strategy
- Use CSS custom properties for colors
- Toggle with button or system preference
- Persist preference in localStorage

### Example
```css
:root {
  --bg-primary: #ffffff;
  --text-primary: #000000;
}

[data-theme="dark"] {
  --bg-primary: #1a1a1a;
  --text-primary: #ffffff;
}
```

---

## Design Tokens (Future)

### Recommended Structure
```css
:root {
  /* Colors */
  --color-primary: #4CAF50;
  --color-secondary: #2196F3;
  --color-danger: #f44336;

  /* Spacing */
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;

  /* Typography */
  --font-size-base: 1rem;
  --font-weight-normal: 400;
  --font-weight-bold: 700;

  /* Borders */
  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
}
```

---

## Component Library (Future)

### Candidates
- **Material-UI (MUI)**: Comprehensive, well-documented
- **Chakra UI**: Accessible, customizable
- **Tailwind CSS**: Utility-first, fast development
- **Custom**: Full control, smaller bundle size

### Recommendation
- Start with custom components (current approach)
- Consider component library if UI complexity grows
- Prioritize accessibility and performance

---

## Notes

- POC design is functional but not polished (intentional)
- Production UI should be more refined and user-friendly
- Design system should evolve as features are added
- Consistency is key: use same patterns across all pages
