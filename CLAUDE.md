<!-- GSD:project-start source:PROJECT.md -->
## Project

**Groovy MIDI Performance Tracking**

Groovy is a drum tutorial web application that helps drummers learn by creating drum patterns, practicing them at variable tempos, and receiving real-time feedback. The MIDI integration allows drummers to connect their drums via MIDI and get live feedback on their timing accuracy — showing whether they're playing on-beat, rushing, or dragging compared to the metronome. Future phases will add note-by-note accuracy tracking and real-time mistake detection during playback.

**Core Value:** Drummers must trust the real-time timing feedback to make effective practice decisions. The system must be rock-solid: accurate, responsive, and free of timing artifacts caused by memory leaks, stale configuration, or silent failures.

### Constraints

- **Performance**: MIDI event handler code must execute <1ms per event (1000+ events/min during playing)
- **Reliability**: No stale closures, no silent failures, no listener accumulation over multi-session use
- **Timing Precision**: All timing calculations must be verified to ±5ms accuracy before shipping
- **Browser Compatibility**: Must work on Chrome/Edge (Web MIDI API standard), graceful degradation on others
<!-- GSD:project-end -->

<!-- GSD:stack-start source:codebase/STACK.md -->
## Technology Stack

## Languages
- TypeScript ~5.6.2 - Full application codebase, strict mode enabled
- JSX (React) - UI components and pages
- JavaScript (ES2020) - Build configuration and utilities
## Runtime
- Node.js - Build and development (no .nvmrc specified, uses system Node)
- Browser runtime - Web Audio API, Web MIDI API, localStorage
- npm - Lockfile present (`package-lock.json`)
## Frameworks
- React 18.3.1 - UI framework and component library
- React Router DOM 7.12.0 - Client-side routing
- React DOM 18.3.1 - React rendering engine
- Radix UI (multiple components) - Unstyled, accessible primitives
- Tailwind CSS 4.1.18 - Utility-first CSS framework
- @tailwindcss/vite 4.1.18 - Vite plugin for Tailwind
- class-variance-authority 0.7.1 - Component variant management
- tailwind-merge 3.4.0 - Merge Tailwind classes with conflicts
- tw-animate-css 1.4.0 - Animation utilities
- clsx 2.1.1 - Conditional className joining
- Vitest 4.0.16 - Unit test framework (React, Node environment)
- Configuration: `vitest.config.ts`
- Vite 6.0.5 - Build tool and dev server
- @vitejs/plugin-react 4.3.4 - JSX support for Vite
- TypeScript 5.6.2 - Compilation via `tsc -b`
- rollup-plugin-visualizer 6.0.5 - Bundle analysis (stats.html)
- ESLint 9.17.0 - Linting
- jspdf 4.0.0 - PDF generation (dynamically imported)
- midi-writer-js 3.1.1 - MIDI file export (dynamically imported)
- qrcode 1.5.4 - QR code generation (dynamically imported)
- qrcode.react 4.2.0 - React QR code component
- @breezystack/lamejs 1.2.7 - MP3 encoding (dynamically imported)
- abcjs 6.6.0 - ABC notation rendering
- zod 4.3.5 - Schema validation and parsing
- lz-string 1.5.0 - LZ compression for URL encoding
- dompurify 3.3.1 - HTML sanitization
- lucide-react 0.562.0 - Icon library
## Key Dependencies
- React ecosystem - Core UI framework
- Vite - Fast dev server and production builds
- Tailwind CSS - Styling and responsive design
- TypeScript - Type safety across codebase
- Radix UI - Accessible component primitives
- zod - Type-safe validation for data structures
- dompurify - HTML sanitization in ExportUtils
- lz-string - URL compression for groove data encoding
- Web Audio API (built-in) - Audio playback and synthesis
- Web MIDI API (built-in) - MIDI device input
## Configuration
- Environment variables via Vite: `import.meta.env.VITE_*`
- Loaded from `.env.local` (not committed)
- See `.env.example` for all available variables
- TypeScript config: `tsconfig.json`
- Vite config: `vite.config.ts`
- ESLint config: `eslint.config.js`
## Platform Requirements
- Node.js (recent version, LTS recommended)
- npm 6+ (or compatible package manager)
- Modern browser with Web Audio API and Web MIDI API support (or localhost with fake MIDI)
- Static file hosting (Nginx, Apache, S3, etc.)
- Base path configurable via `VITE_BASE_PATH` env variable
- Default base path: `/groovy/`
- Requires HTML5 history fallback (redirect all routes to index.html)
- ES2020 features required
- Web Audio API for playback
- Web MIDI API for device input (optional, with keyboard fallback on localhost)
- localStorage for groove storage
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

## Naming Patterns
- PascalCase for React components: `PlaybackControls.tsx`, `DrumGridDark.tsx`
- camelCase for utilities and services: `midiStorage.ts`, `latencyStorage.ts`, `logger.ts`
- camelCase for hooks: `useGrooveEngine.ts`, `useMIDIInput.ts`, `useMIDITracking.ts`
- SCREAMING_SNAKE_CASE for constants: `DEFAULT_MIDI_CONFIG`, `MAX_MEASURES`, `FAKE_MIDI_DEVICE_ID`
- `.test.ts` or `.test.tsx` suffix for test files: `PerformanceTracker.test.ts`, `MIDIDrumMapping.test.ts`
- camelCase for all function names (including React components that are functions): `createEmptyNotesRecord()`, `getVoiceFromNote()`, `loadMIDIConfig()`
- Private class methods prefix with underscore: `buildMIDIToVoiceMap()`, `buildOffsetGrid()`
- Boolean variables prefix with `is` or `has`: `isPlaying`, `hasError`, `isEnabled()`
- Callback handlers suffix with Handler: `setNoteOnHandler()`, `setControlChangeHandler()`
- PascalCase for all types and interfaces: `DrumVoice`, `MIDIDeviceInfo`, `GrooveData`, `HitAnalysis`
- Record types for mappings: `Record<DrumVoice, boolean[]>`, `Record<number, DrumVoice>`
- Use specific type names over generic `any`: `DrumVoice | null` not `any`
- SCREAMING_SNAKE_CASE for module-level constants: `DEFAULT_GROOVE`, `DEFAULT_MIDI_CONFIG`, `MIN_PLAY_INTERVAL_AUDIO_TIME`
- Config objects follow the pattern `DEFAULT_*`: `DEFAULT_VELOCITY_THRESHOLDS`, `DEFAULT_KEYBOARD_MIDI_CONFIG`
- Storage keys use kebab-case: `'groovy-debug-mode'`, `'groovy-midi-config'`, `'groovy-theme'`
## Code Style
- Prettier configured implicitly (no `.prettierrc` file found, using defaults)
- 2-space indentation (inferred from codebase)
- Semicolons required (TypeScript strict mode enforces)
- Single quotes in most cases, double quotes for JSX attributes
- Line length appears to be ~100 characters (files don't exceed this significantly)
- ESLint with `@eslint/js` and `typescript-eslint`
- React plugin with hooks recommended rules: `eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`
- TypeScript strict mode enabled: `strict: true`, `noUnusedLocals: true`, `noUnusedParameters: true`
- File configuration: `.eslintignore` covers `dist`, `node_modules`, `.vite`
- Named exports preferred for utility functions and classes: `export function loadMIDIConfig()`, `export class DrumSynth`
- Export objects for namespaced functionality: `export const ABCTranscoder = { ... }`
- Default exports for React components: `export default function HomePage()`
- Re-exports for barrel files: `export { GrooveEngine, DrumSynth } from './core'` in `src/core/index.ts`
## Import Organization
- Relative imports used throughout (`../types`, `../utils`, `../components`)
- No path aliases configured (no `jsconfig.json` or `tsconfig.json` paths)
- Shallow relative imports preferred: `import from '../types'` not `import from '../../../../types'`
## Error Handling
- Try-catch blocks for async operations and external API calls: Used in `DrumSynth.ts` for audio loading
- Graceful degradation: Log errors but continue execution. Example: `GrooveStorage.ts` catches JSON parse errors and returns default
- Error reporting: Use `logger.error()` which always logs (unlike `logger.log()` which respects debug mode)
- Error Boundary for React tree: `ErrorBoundary.tsx` catches component errors and shows fallback UI
- Return objects for error states: `{ success: boolean; error?: string }` pattern in `GrooveStorage.ts`
## Logging
- Debug logging: `logger.log()` - only visible when debug mode enabled via UI or localStorage
- Warning logging: `logger.warn()` - debug mode only, for non-critical issues
- Error logging: `logger.error()` - always visible, for critical issues
- Toggle debug mode: Click "Adar Bahar" in About modal, stored in `groovy-debug-mode` localStorage key
## Comments
- File headers explain module purpose: Every test file starts with `/** Tests for X */`
- Complex business logic: Commented in `PerformanceTracker.ts` swing-aware quantization
- Non-obvious algorithms: Swing offset calculation in `GrooveEngine.ts` includes explanation
- Avoid redundant comments: If code is clear, no comment needed
- TODO/FIXME comments mark known issues (use sparingly, prefer issues on GitHub)
- Function documentation includes:
- Interface/Type documentation explains intent: `/** MIDI device information */`
- No parameter type tags needed (TypeScript already has types): Use JSDoc for intent only
## Function Design
- Most functions are 5-30 lines
- Complex algorithms broken into private helper methods: `buildOffsetGrid()` helper in `PerformanceTracker.ts`
- Pure functions preferred (no side effects): `createEmptyNotesRecord()`, `getArticulationsByCategory()`
- Single responsibility: Classes and functions do one thing well
- Maximum 3-4 parameters; use destructured objects for more: `{ voice, velocity, timestamp }` in `MIDINoteEvent`
- Options/config params as objects: `ABCRenderOptions { staffWidth?, scale?, padding? }`
- No default parameters in function signatures (use in body or let calling code decide)
- Explicit return types required (TypeScript strict mode): `string | null`, `HitAnalysis | null`
- Use `null` not `undefined` for "no value": `getVoiceFromNote()` returns `DrumVoice | null`
- Return objects for multiple values: `{ success: boolean; error?: string }`
- Return empty arrays not `null` for collections: `loadPatterns()` returns `CustomPattern[]`
## Module Design
- Each module exports what it "owns": `MIDIDrumMapping.ts` exports the mapping, not the voices
- Avoid re-exporting everything: `src/core/index.ts` is the only barrel file, re-exports key items
- Class instances as singletons: `export const performanceTracker = new PerformanceTracker()`
- Core modules are framework-agnostic: No React imports in `src/core/`, `src/midi/`, `src/utils/`
- Only `src/core/index.ts` acts as a barrel file
- Pattern: Re-export all public classes, functions, and types from module subdirectories
- Imports use barrel file: `import { GrooveEngine, DrumSynth } from '../core'`
## React Component Conventions
- Hooks imported from `src/hooks/`: `import { useGrooveEngine, useMIDIInput } from '../hooks'`
- Each hook is a separate file: `useGrooveEngine.ts`, `useMIDITracking.ts`, `useMIDIInput.ts`
- Hooks return objects with state and callbacks: `{ config, updateConfig, devices, isConnected }`
- Event handlers inline in component: `onTempoChange={(tempo) => setTempo(tempo)}`
## Type Safety
- Zod schemas for runtime validation: `SavedGrooveSchema`, `MIDI_CONFIG` validation in storage functions
- Type guards for discriminated unions: `voice === null` checks before using voice
- Exhaustive type checks: TypeScript's `noFallthroughCasesInSwitch` ensures all switch cases covered
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

## System Overview
```text
```
## Component Responsibilities
| Component | Responsibility | File |
|-----------|----------------|------|
| **GrooveEngine** | Main playback loop, scheduling, event emission, metronome control | `src/core/GrooveEngine.ts` |
| **DrumSynth** | Web Audio API abstraction, sample loading, playback, gain control | `src/core/DrumSynth.ts` |
| **GrooveData** | Type definition for groove state (measures, notes, tempo, swing, time signature) | `src/types.ts` |
| **ProductionPage** | Main editor UI, orchestrates hooks, renders grid/sheet music/controls | `src/pages/ProductionPage.tsx` |
| **useGrooveEngine** | React bridge to GrooveEngine, maintains isPlaying/position/groove state | `src/hooks/useGrooveEngine.ts` |
| **useMIDIInput** | MIDI device connection, velocity/double-trigger filtering, latency compensation | `src/hooks/useMIDIInput.ts` |
| **useMIDITracking** | Bridges playback state to PerformanceTracker, dispatches timing analysis events | `src/hooks/useMIDITracking.ts` |
| **PerformanceTracker** | Real-time timing analysis, swing-aware quantization grids, BPM estimation (EWMA) | `src/midi/PerformanceTracker.ts` |
| **MIDIHandler** | Low-level MIDI event handling (note on/off, CC) | `src/midi/MIDIHandler.ts` |
| **MIDIDrumMapping** | Maps MIDI note numbers to drum voices based on kit selection | `src/midi/MIDIDrumMapping.ts` |
| **VelocityFilter** | Per-pad minimum velocity thresholds (noise suppression) | `src/midi/VelocityFilter.ts` |
| **DoubleTriggerFilter** | Per-pad refractory windows (bounce suppression) | `src/midi/DoubleTriggerFilter.ts` |
| **GrooveStorage** | localStorage CRUD for saved grooves with validation | `src/core/GrooveStorage.ts` |
| **GrooveURLCodec** | Compress/decompress groove state to URL parameters for sharing | `src/core/GrooveURLCodec.ts` |
| **ExportUtils** | PDF, MIDI file, SVG/PNG generation | `src/core/ExportUtils.ts` |
| **ABCTranscoder** | Convert drum notation ↔ ABC standard notation | `src/core/ABCTranscoder.ts` |
## Pattern Overview
- **Core engine is React-free**: `GrooveEngine` and `DrumSynth` have zero React dependencies. Can be used in any context (Node.js, vanilla JS, other frameworks).
- **Hook layer as bridge**: React hooks (`useGrooveEngine`, `useMIDIInput`, `useMIDITracking`) are the only place mixing React with core logic.
- **Event-driven architecture**: Core engine uses typed event emitters. MIDI events flow as DOM CustomEvents for UI reactivity.
- **Type-safe data flow**: All groove data flows through `GrooveData` interface. Optional `GroovePattern` subset for performance tracking.
- **Composable filters**: MIDI event pipeline (velocity → double-trigger → latency) uses composable filter classes.
- **Persistence abstraction**: `GrooveStorage` and `GrooveURLCodec` decouple how grooves are stored/shared from how they're used.
## Layers
- Purpose: Render UI, capture user input, manage component-level state
- Location: `src/components/`, `src/pages/`, `src/contexts/`
- Contains: Modal dialogs, grid editor, controls (tempo/swing/volume), sheet music display
- Depends on: React hooks (custom), UI component library (Radix + Tailwind)
- Used by: Users through browser UI
- Purpose: Connect React component tree to core logic and external services
- Location: `src/hooks/`
- Contains: `useGrooveEngine`, `useMIDIInput`, `useMIDITracking`, `useHistory`, `useURLSync`, `useMIDITimingAccuracy`
- Depends on: React (useState, useEffect, useRef, useCallback), core modules, MIDI modules, storage utilities
- Used by: Components in presentation layer
- Purpose: Playback scheduling, synthesis, groove data processing
- Location: `src/core/`
- Contains: `GrooveEngine`, `DrumSynth`, `GrooveStorage`, `GrooveURLCodec`, export/import utilities
- Depends on: Web Audio API, localStorage, native browser APIs only (no React)
- Used by: Integration layer (hooks) and tests
- Purpose: Real-time MIDI device handling, performance tracking, event filtering
- Location: `src/midi/`
- Contains: `MIDIAccess`, `MIDIHandler`, `MIDIDrumMapping`, `PerformanceTracker`, filters (velocity/double-trigger)
- Depends on: Web MIDI API, Web Audio API, groove data types
- Used by: Integration layer (hooks)
- Purpose: Persist and retrieve groove data
- Location: `src/utils/` (storage helpers), `src/core/` (GrooveStorage/GrooveURLCodec)
- Contains: localStorage wrappers, error handling, data validation (Zod)
- Depends on: browser localStorage API, Zod (validation)
- Used by: Components, hooks, core engine
## Data Flow
### Primary Request Path: User plays groove with MIDI device
### Groove Playback Loop
```
```
### Groove Sharing via URL
### MIDI Performance Tracking (Spec #264)
- Groove state: React component state (ProductionPage) + GrooveEngine internal state
- Playback position: Managed by GrooveEngine, synced via `useGrooveEngine` hook
- MIDI config: localStorage via `midiStorage` utility, also in React state
- Latency config: Per-device localStorage via `latencyStorage` utility
- Performance stats: PerformanceTracker internal state, dispatched to UI via events
## Key Abstractions
- Purpose: Represents a complete groove pattern with timing metadata
- Examples: `{ timeSignature, division, tempo, swing, measures[] }`
- Pattern: Immutable data structure; mutations create new objects via spreads or utilities
- Used in: GrooveEngine (scheduling), UI (display), storage (persistence), MIDI tracking (quantization)
- Purpose: Semantic identifier for drum sounds (distinguishes "snare-normal" from "snare-ghost")
- Examples: `'kick'`, `'snare-normal'`, `'hihat-closed'`, `'tom-rack'`
- Pattern: Union type of 30+ strings; mapped to Web Audio samples in `DrumSynth` and MIDI notes in `MIDIDrumMapping`
- Used in: Note representation, synthesis, MIDI mapping, performance tracking
- Purpose: Encapsulates MIDI hit timing analysis for performance feedback
- Fields: `timingErrorMs` (signed), `timingAccuracy` (0-100%), `noteAccuracy`, `overall`, `feedback` (string)
- Pattern: Immutable result from `PerformanceTracker.analyzeHit()`, dispatched as CustomEvent detail
- Used in: MIDI timing UI feedback, performance logging
- Purpose: Represents a single measure with optional time signature override
- Fields: `notes` (per-voice boolean arrays), `timeSignature` (optional override)
- Pattern: Immutable; accessed via array index (measure position in groove)
- Used in: Grid rendering, note editing, playback scheduling
## Entry Points
- Location: `src/main.tsx`
- Triggers: Page load → React app initialization
- Responsibilities: Create React root, render App, initialize ThemeProvider
- Location: `src/App.tsx`
- Triggers: Route matching via React Router
- Responsibilities: Conditional render ProductionPage vs EmbedPage based on `?embed=true`, error boundary, analytics tracking for share links
- Location: `src/pages/ProductionPage.tsx`
- Triggers: Navigation to `/` or `?embed=false`
- Responsibilities: Orchestrate all hooks, render drum grid + sheet music + controls + modals, manage groove state transitions
- Location: `src/pages/EmbedPage.tsx`
- Triggers: Navigation to `/?embed=true`
- Responsibilities: Simplified UI for embedded grooves (playback only, no editing)
- Location: `src/hooks/useMIDIInput.ts` in `useEffect`
- Triggers: Component mount
- Responsibilities: Initialize Web MIDI API, scan devices, auto-connect to saved device, set up event listeners
- Location: `src/core/GrooveEngine.ts:play()` → `requestAnimationFrame` loop
- Triggers: `engine.play()` called from `useGrooveEngine`
- Responsibilities: Main timing loop (per-frame scheduling), event emission, state management
## Architectural Constraints
- **Threading:** Single-threaded event loop (browser JS). Web Audio API runs on separate audio thread but is accessed from main thread.
- **Global state:** `GrooveEngine` instance stored in `useGrooveEngine` ref (singleton per app instance). `performanceTracker` singleton exported from `PerformanceTracker.ts`. MIDI services (MIDIAccess, MIDIHandler) singletons in `src/midi/` modules.
- **Circular imports:** Minimal risk due to hook-based architecture. Core modules (`src/core/`) don't import from `src/hooks/` or `src/components/`.
- **Audio timing:** GrooveEngine uses `performance.now()` for scheduling (matches MIDI event timestamps). Web Audio API uses audio context time for synthesis.
- **MIDI latency:** System audio latency (~950ms) compensated via `latencyStorage` config, applied transparently to all hits.
- **Event loop scheduling:** 150ms schedule-ahead window to prevent audio glitches. RAF-based visual updates (30-60 FPS) separate from precise audio scheduling.
## Anti-Patterns
### Mutating Groove State Directly
```typescript
```
### Calling React Hooks from MIDI Handlers
```typescript
```
### Storing Complex State in localStorage as JSON Strings
```typescript
```
### Hardcoding MIDI Note Numbers
```typescript
```
### Blocking the Audio Thread
```typescript
```
## Error Handling
- **MIDI initialization failures:** Log error, continue with MIDI disabled. User can re-enable in settings.
- **Sample loading failures:** Load what's available. Log missing samples. App plays with available sounds.
- **localStorage failures:** Use `safeStorage` wrapper with try-catch. Fall back to defaults if load fails.
- **URL decode failures:** Show "Invalid groove URL" toast. Offer to start fresh.
- **Zod validation failures:** Log validation error with field details. Use sensible defaults.
- **Web Audio context errors:** Log `processorerror` events. Allow recovery via context resume.
## Cross-Cutting Concerns
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->
## Project Skills

No project skills found. Add skills to any of: `.claude/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
