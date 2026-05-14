# Codebase Structure

**Analysis Date:** 2026-05-14

## Directory Layout

```
groovy/
├── src/
│   ├── main.tsx                    # Entry point: React app initialization
│   ├── App.tsx                     # Router setup, page routing, error boundary
│   ├── types.ts                    # Core type definitions (GrooveData, DrumVoice, TimeSignature, etc.)
│   ├── App.css                     # Global app styles
│   ├── index.css                   # Base CSS reset
│   ├── vite-env.d.ts               # Vite environment variable types
│   ├── head.tsx                    # Meta tags for shared grooves
│   │
│   ├── pages/                      # Top-level page components (router views)
│   │   ├── ProductionPage.tsx      # Main editor UI (drum grid, controls, modals, hooks orchestration)
│   │   ├── EmbedPage.tsx           # Minimal player for embedded grooves
│   │   └── NewUIPage.tsx           # Experimental UI page (under development)
│   │
│   ├── components/                 # React UI components
│   │   ├── ui/                     # Reusable UI primitives (Radix + Tailwind wrapper components)
│   │   │   ├── button.tsx          # Button with variants (size, color, state)
│   │   │   ├── slider.tsx          # Tempo/swing/volume slider wrapper
│   │   │   ├── dialog.tsx          # Modal dialog wrapper
│   │   │   ├── collapsible.tsx     # Collapsible panel wrapper
│   │   │   ├── input.tsx           # Text input wrapper
│   │   │   └── tooltip.tsx         # Tooltip wrapper
│   │   │
│   │   ├── production/             # Production UI components (main editor view)
│   │   │   ├── Header.tsx          # Top bar with title, time signature, tempo display
│   │   │   ├── Sidebar.tsx         # Left panel with drum voice selection and note controls
│   │   │   ├── PlaybackControls.tsx# Play/pause, tempo, swing, volume sliders, MIDI indicator
│   │   │   ├── BottomToolbar.tsx   # Action buttons (download, share, save, etc.)
│   │   │   ├── DrumGridDark.tsx    # Dark-theme drum grid editor (main interactive component)
│   │   │   ├── MetadataFields.tsx  # Title, author, comments editor
│   │   │   ├── KeyboardShortcuts.tsx # Help dialog with keyboard shortcuts
│   │   │   ├── ClearButton.tsx     # Clear all notes button with confirmation
│   │   │   │
│   │   │   ├── Modals/             # Modal dialogs for features
│   │   │   │   ├── SaveGrooveModal.tsx      # Save current groove to "My Grooves"
│   │   │   │   ├── MyGroovesModal.tsx       # Load/manage saved grooves
│   │   │   │   ├── ShareModal.tsx           # Generate shareable link with QR code
│   │   │   │   ├── DownloadModal.tsx        # Export to PDF/MIDI/SVG/PNG
│   │   │   │   ├── PrintPreviewModal.tsx    # Print layout preview
│   │   │   │   ├── GrooveLibraryModal.tsx   # Browse example grooves
│   │   │   │   ├── TimeSignatureSelectorModal.tsx # Time signature picker
│   │   │   │   ├── MIDISettingsModal.tsx    # MIDI device selection, filters, latency config
│   │   │   │   ├── AutoSpeedUpModal.tsx     # Auto speed-up training settings
│   │   │   │   ├── AboutModal.tsx           # About/info dialog
│   │   │   │   └── MetronomeOptionsMenu.tsx # Metronome frequency and mode selector
│   │   │   │
│   │   │   ├── MobileMoreMenu.tsx  # Hamburger menu for mobile (secondary actions)
│   │   │   ├── MIDITrackingDebug.tsx# Debug display for MIDI timing (dev only)
│   │   │
│   │   ├── DrumGrid.tsx            # Base drum grid component (legacy, see DrumGridDark)
│   │   ├── DivisionSelector.tsx    # Dropdown to select note division (8, 16, 12, etc.)
│   │   ├── PresetSelector.tsx      # Quick preset selection
│   │   ├── TempoControl.tsx        # Tempo input/slider
│   │   ├── TimeSignatureSelector.tsx # Time signature picker (standalone, see modal version)
│   │   ├── EditModeToggle.tsx       # Toggle between edit/playback modes
│   │   ├── UndoRedoControls.tsx    # Undo/redo buttons
│   │   ├── VolumeKnob.tsx          # Master volume rotary control
│   │   ├── SyncControl.tsx         # Sync mode selector (start/middle/end)
│   │   ├── SyncOffsetControl.tsx   # Fine-tune metronome offset
│   │   ├── MetadataEditor.tsx      # Edit groove metadata (standalone)
│   │   ├── BulkOperationsDialog.tsx# Bulk fill/clear/mirror operations
│   │   ├── SheetMusicDisplay.tsx   # ABC standard notation display (uses abcjs)
│   │   ├── MIDITimingIndicator.tsx # Real-time visual feedback for MIDI timing (slow/on-time/fast spectrum)
│   │   ├── NoteIcon.tsx            # Visual representation of drum voice (icon/label)
│   │   ├── AutoSpeedUpIndicator.tsx# Shows speed-up progress during auto speed-up
│   │   ├── AutoSpeedUpConfig.tsx   # Configure speed-up parameters
│   │   ├── ErrorBoundary.tsx       # React error boundary fallback UI
│   │   └── ShareButton.tsx         # Quick share button
│   │
│   ├── hooks/                      # React hooks (ONLY place mixing React + core logic)
│   │   ├── useGrooveEngine.ts      # Bridge to GrooveEngine: play/pause/stop, volume, metronome config, events
│   │   ├── useGrooveActions.ts     # Groove mutations: add/remove/duplicate measures, clear grid, bulk operations
│   │   ├── useGrooveSync.ts        # Sync groove state with GrooveEngine after edits
│   │   ├── useHistory.ts           # Undo/redo with action stack (pattern: snapshots on mutations)
│   │   ├── useURLSync.ts           # Decode groove from URL params on load, encode on share
│   │   ├── useMIDIInput.ts         # MIDI device connection, velocity/double-trigger filters, latency compensation
│   │   ├── useMIDITracking.ts      # Enable/disable PerformanceTracker based on playback, listen for hits
│   │   ├── useMIDITimingAccuracy.ts# Calculate rolling average of timing accuracy (visual feedback for UI)
│   │   ├── useMIDIFeedback.ts      # Play synth sounds on MIDI events for real-time feedback
│   │   ├── useMIDITrackingFeedback.tsx # Listen for timing analysis events, update timing indicator UI
│   │   ├── useMyGrooves.ts         # Manage "My Grooves" localStorage with CRUD operations
│   │   ├── useGrooveLibrary.ts     # Load example grooves from libraryGrooves.json
│   │   ├── usePlaybackHighlight.ts # Sync visual highlighting of current position during playback
│   │   ├── useAutoSpeedUp.ts       # Auto speed-up training feature (increment tempo on perfect bars)
│   │   ├── useDrumGrid.ts          # Grid interaction state (selected voice, active cells)
│   │   ├── useMediaQuery.ts        # Responsive breakpoints (mobile/tablet/desktop)
│   │   └── useResponsive.ts        # Alias for useMediaQuery
│   │
│   ├── contexts/                   # React Context providers
│   │   └── ThemeContext.tsx        # Dark/light theme state and provider
│   │
│   ├── core/                       # Core engine (framework-agnostic, no React)
│   │   ├── GrooveEngine.ts         # Main playback loop, note scheduling, metronome, event emission
│   │   ├── DrumSynth.ts            # Web Audio API abstraction, sample loading, playback, gain control
│   │   ├── GrooveStorage.ts        # localStorage CRUD: save/load/delete grooves with validation
│   │   ├── GrooveURLCodec.ts       # Compress/decompress groove to/from URL-safe base64
│   │   ├── GrooveUtils.ts          # Utilities: normalize, validate, transform grooves, calculate metrics
│   │   ├── PatternManager.ts       # Bulk pattern operations: fill, clear, duplicate, mirror, rotate
│   │   ├── DrumVoiceConfig.ts      # Configuration per drum voice (sample files, default velocity, gain)
│   │   ├── ArticulationConfig.ts   # Articulation config (flams, drags, etc.) and voice properties
│   │   ├── ExportUtils.ts          # Export to PDF (jspdf), MIDI file (midi-writer-js), SVG/PNG
│   │   ├── ABCTranscoder.ts        # Convert drum notation ↔ ABC standard notation
│   │   ├── ABCRenderer.ts          # Render ABC notation to visual (wrapper around abcjs)
│   │   ├── ABCConstants.ts         # ABC notation constants and mappings
│   │   ├── BulkPatterns.ts         # Preset drum patterns (rock, funk, jazz, etc.)
│   │   └── index.ts                # Barrel export of public API
│   │
│   ├── midi/                       # MIDI system (framework-agnostic, no React)
│   │   ├── MIDIAccess.ts           # Web MIDI API wrapper: device enumeration, connection, event listeners
│   │   ├── MIDIHandler.ts          # Low-level MIDI event parsing (note on/off, CC) and routing
│   │   ├── MIDIDrumMapping.ts      # Map MIDI note numbers ↔ DrumVoices based on kit selection
│   │   ├── PerformanceTracker.ts   # Real-time performance analysis: timing, quantization, EWMA BPM estimation
│   │   ├── VelocityFilter.ts       # Per-pad minimum velocity thresholds (noise suppression)
│   │   ├── DoubleTriggerFilter.ts  # Per-pad refractory windows (bounce suppression)
│   │   ├── KeyboardMIDISimulator.ts# Fake MIDI device for keyboard input (localhost testing)
│   │   ├── types.ts                # MIDI type definitions (MIDIConfig, MIDINoteEvent, filters)
│   │   ├── config/                 # MIDI configuration data
│   │   │   └── drumKits.ts         # Drum kit definitions (note mappings per kit: TD-17, etc.)
│   │   ├── midi.integration.test.ts# Integration tests (MIDI events, performance tracking)
│   │   ├── MIDIHandler.test.ts     # Unit tests for MIDI event handling
│   │   ├── MIDIDrumMapping.test.ts # Unit tests for note-to-voice mapping
│   │   └── PerformanceTracker.test.ts # Unit tests for timing analysis (93 test suites)
│   │
│   ├── utils/                      # Utility functions
│   │   ├── analytics.ts            # Track user actions (groove creation, shares, MIDI events, referrers)
│   │   ├── logger.ts               # Simple logging utility for core modules
│   │   ├── midiStorage.ts          # Load/save MIDI config (device, kit, filters) from/to localStorage
│   │   ├── latencyStorage.ts       # Load/save per-device latency calibration from/to localStorage
│   │   ├── safeStorage.ts          # Safe localStorage wrapper with Zod validation
│   │   └── midiStorage.test.ts     # Unit tests for MIDI config persistence
│   │
│   ├── types/                      # Type definitions (re-exports from src/types.ts)
│   │   (empty directory for future use)
│   │
│   ├── data/                       # Static data
│   │   └── libraryGrooves.json     # Example grooves for library (loaded by useGrooveLibrary)
│   │
│   ├── styles/                     # Global styles
│   │   ├── tailwind.css            # Tailwind CSS directives (@tailwind, @layer)
│   │   └── midi.css                # MIDI-specific styles (timing indicator, debug display)
│   │
│   └── newUI/                      # Experimental new UI implementation (under development)
│       ├── components/
│       │   └── ui/                 # New UI primitives
│       └── (other structure TBD)
│
├── public/                         # Static assets
│   └── (samples/)                  # Drum samples (MP3 files loaded by DrumSynth)
│
├── dist/                           # Build output (vite build)
│   └── stats.html                  # Bundle analyzer output (from rollup-plugin-visualizer)
│
├── docs/                           # Documentation
│   ├── MIDI_SPEC_AUDIT.md          # Specification for MIDI timing/quantization (Spec #264)
│   ├── MIDI_EVENT_LOGIC_AUDIT.md   # Comprehensive audit of MIDI event handling
│   ├── MIDI_FILTERING_IMPLEMENTATION.md # Details on velocity/double-trigger filters
│   └── (other docs)
│
├── .planning/                      # GSD planning system output
│   └── codebase/                   # Codebase maps (ARCHITECTURE.md, STRUCTURE.md, etc.)
│
├── archive/                        # Old/deprecated code
│
├── .github/                        # GitHub configuration
│   └── workflows/                  # CI/CD workflows
│
├── .claude/                        # Claude context configuration
│   ├── settings.json               # Claude configuration
│   ├── skills/                     # Project-specific patterns/rules
│   ├── commands/                   # Custom commands
│   └── get-shit-done/              # GSD framework files
│
├── package.json                    # NPM dependencies and scripts
├── tsconfig.json                   # TypeScript configuration
├── vite.config.ts                  # Vite bundler configuration
├── vitest.config.ts                # Vitest (test runner) configuration
├── eslint.config.js                # ESLint configuration
├── .env.example                    # Example environment variables
├── .env.local                      # Local env config (not committed, secrets here)
├── README.md                       # Project overview
├── GETTING_STARTED.md              # Getting started guide
├── DEPLOYMENT.md                   # Deployment instructions
└── .gitignore                      # Git ignore patterns
```

## Directory Purposes

**src/pages/:**
- Purpose: Top-level page components that React Router renders
- Contains: ProductionPage (main editor), EmbedPage (minimal player), NewUIPage (experimental)
- Key files: `ProductionPage.tsx` (orchestrates all hooks and components)

**src/components/:**
- Purpose: Reusable React UI components
- Contains: Grid editor, controls, modals, UI primitives (buttons, sliders, dialogs)
- Organization: `ui/` for primitives, `production/` for main editor features
- Key files: `DrumGridDark.tsx` (interactive grid editor)

**src/hooks/:**
- Purpose: React hooks that bridge React components to core logic
- Contains: useGrooveEngine (playback control), useMIDIInput (MIDI integration), useHistory (undo/redo)
- Pattern: Each hook is a single responsibility (playback, MIDI, URL sync, etc.)
- Key files: `useGrooveEngine.ts`, `useMIDIInput.ts`, `useMIDITracking.ts`

**src/core/:**
- Purpose: Framework-agnostic core engine and utilities
- Contains: GrooveEngine (playback loop), DrumSynth (Web Audio), storage/export/import
- Pattern: Pure functions and ES6 classes, zero React dependencies
- Key files: `GrooveEngine.ts`, `DrumSynth.ts`, `GrooveStorage.ts`

**src/midi/:**
- Purpose: Real-time MIDI input handling and performance analysis
- Contains: Device enumeration, event parsing, drum mapping, performance tracking, filters
- Pattern: Singletons (MIDIAccess, MIDIHandler) for device state; classes (PerformanceTracker, filters) for analysis
- Key files: `PerformanceTracker.ts` (timing analysis), `MIDIAccess.ts` (device connection), `VelocityFilter.ts`, `DoubleTriggerFilter.ts`

**src/utils/:**
- Purpose: Shared utility functions
- Contains: analytics, logger, storage wrappers, validation helpers
- Pattern: Pure functions and stateless utilities
- Key files: `safeStorage.ts`, `latencyStorage.ts`, `analytics.ts`

**src/contexts/:**
- Purpose: React Context providers for global state
- Contains: ThemeContext (dark/light mode)
- Pattern: Context + custom hook for consumption
- Key files: `ThemeContext.tsx`

**src/styles/:**
- Purpose: Global stylesheet definitions
- Contains: Tailwind directives, custom CSS for MIDI indicator and debug display
- Key files: `tailwind.css`, `midi.css`

**src/data/:**
- Purpose: Static data files
- Contains: Example grooves (libraryGrooves.json)
- Key files: `libraryGrooves.json`

**public/:**
- Purpose: Static assets served by Vite dev server and bundled in production
- Contains: Drum sample MP3 files
- Note: Samples loaded on-demand by DrumSynth

**dist/:**
- Purpose: Production build output
- Contains: Bundled HTML, JS, CSS
- Generated by: `npm run build`

## Key File Locations

**Entry Points:**
- `src/main.tsx`: React app root, creates React root and renders App
- `src/App.tsx`: Router setup, page routing, error boundary

**Configuration:**
- `package.json`: NPM dependencies, build scripts, project metadata
- `tsconfig.json`: TypeScript compiler options
- `vite.config.ts`: Vite bundler, asset handling, base URL
- `vitest.config.ts`: Test runner configuration
- `eslint.config.js`: Code linting rules
- `.env.local`: Local environment variables (secrets, API keys)

**Core Logic:**
- `src/core/GrooveEngine.ts`: Playback scheduling, event emission
- `src/core/DrumSynth.ts`: Web Audio sample playback
- `src/midi/PerformanceTracker.ts`: Real-time timing analysis
- `src/midi/MIDIAccess.ts`: Web MIDI API integration

**UI Pages:**
- `src/pages/ProductionPage.tsx`: Main editor UI (orchestrates all features)
- `src/pages/EmbedPage.tsx`: Minimal player for embedded grooves

**Styling:**
- `src/App.css`: Global app styles
- `src/index.css`: CSS reset and base styles
- `src/styles/tailwind.css`: Tailwind CSS configuration

**Testing:**
- `src/midi/PerformanceTracker.test.ts`: 93 test suites for timing analysis
- `src/midi/MIDIHandler.test.ts`: MIDI event parsing tests
- `src/midi/MIDIDrumMapping.test.ts`: Note-to-voice mapping tests
- `src/midi/midi.integration.test.ts`: Integration tests
- `src/utils/midiStorage.test.ts`: Storage persistence tests

## Naming Conventions

**Files:**
- Components: PascalCase, `.tsx` (e.g., `PlaybackControls.tsx`, `DrumGridDark.tsx`)
- Hooks: camelCase `use*`, `.ts` (e.g., `useGrooveEngine.ts`, `useMIDIInput.ts`)
- Utilities: camelCase, `.ts` (e.g., `safeStorage.ts`, `latencyStorage.ts`)
- Types: PascalCase, `.ts` (e.g., `types.ts` in root, `midi/types.ts`)
- Tests: match source file + `.test.ts` or `.integration.test.ts`
- Styles: kebab-case (e.g., `midi.css`)

**Directories:**
- Component groups: PascalCase (e.g., `components/production/`, `components/ui/`)
- Feature directories: lowercase (e.g., `hooks/`, `utils/`, `core/`, `midi/`)

**Functions/Variables:**
- React components: PascalCase (e.g., `PlaybackControls`, `DrumGridDark`)
- React hooks: camelCase with `use` prefix (e.g., `useGrooveEngine`, `useMIDIInput`)
- Regular functions: camelCase (e.g., `calculateSwingOffset`, `analyzeHit`)
- Constants: UPPER_SNAKE_CASE (e.g., `MAX_MEASURES`, `DEFAULT_TEMPO`)
- Private members: leading underscore (e.g., `_internal`, `#private`)

**Types:**
- Interfaces: PascalCase (e.g., `GrooveData`, `HitAnalysis`, `MIDIConfig`)
- Type aliases: PascalCase (e.g., `DrumVoice = '...' | '...'`)
- Enums: PascalCase (e.g., `SyncMode`)

## Where to Add New Code

**New Feature (e.g., playback recording):**
- Primary code: `src/core/` (recording state, save/load logic)
- React integration: `src/hooks/` (useRecording hook with React state)
- UI: `src/components/production/` (RecordingControls.tsx, RecordingModal.tsx)
- Tests: `src/core/Recording.test.ts`, `src/hooks/useRecording.test.ts`

**New Component/Module:**
- UI component: `src/components/` or `src/components/production/` (for main editor)
- Modal dialog: `src/components/production/` (e.g., `NewFeatureModal.tsx`)
- Core logic: `src/core/` (if framework-agnostic)
- MIDI feature: `src/midi/` (if MIDI-related)

**Utilities:**
- Shared helpers: `src/utils/` (with `.test.ts` if complex)
- Core algorithms: `src/core/` (e.g., `ExportUtils.ts`)
- MIDI utilities: `src/midi/` (e.g., filters, performance tracking)

**Tests:**
- Unit tests: co-located next to source file (e.g., `PerformanceTracker.test.ts` alongside `PerformanceTracker.ts`)
- Integration tests: `src/` with `.integration.test.ts` suffix (e.g., `midi.integration.test.ts`)

**Styles:**
- Global styles: `src/styles/` (e.g., `midi.css` for MIDI-specific styling)
- Component styles: Import in component file as `.module.css` or inline (Tailwind preferred)

**Data Files:**
- Static data: `src/data/` (e.g., `libraryGrooves.json`)

## Special Directories

**src/newUI/:**
- Purpose: Experimental new UI implementation
- Generated: No (manually managed)
- Committed: Yes
- Notes: Work-in-progress, not actively used in production page

**dist/:**
- Purpose: Production build output
- Generated: Yes (by `npm run build`)
- Committed: No (in .gitignore)

**node_modules/:**
- Purpose: Installed npm dependencies
- Generated: Yes (by `npm install`)
- Committed: No (in .gitignore)
- Note: Lock file (`package-lock.json`) is committed

**.planning/codebase/:**
- Purpose: GSD codebase maps (ARCHITECTURE.md, STRUCTURE.md, CONVENTIONS.md, TESTING.md, CONCERNS.md)
- Generated: Yes (by `/gsd-map-codebase`)
- Committed: Yes (tracked in git)

**archive/:**
- Purpose: Old/deprecated code
- Generated: No
- Committed: Yes

**.claude/:**
- Purpose: Claude context configuration, skills, GSD system files
- Generated: Partially (some files auto-generated by Claude)
- Committed: Yes

---

*Structure analysis: 2026-05-14*
