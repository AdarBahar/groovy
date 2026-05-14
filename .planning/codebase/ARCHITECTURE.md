<!-- refreshed: 2026-05-14 -->
# Architecture

**Analysis Date:** 2026-05-14

## System Overview

Groovy is a drum notation editor and player with strict separation between core logic and React UI. The core engine is completely framework-agnostic and can be used standalone. MIDI support includes real-time performance tracking with swing-aware quantization.

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                           React UI Layer                                     │
│  ProductionPage / EmbedPage / NewUIPage                                     │
│  Components: DrumGridDark, Header, Sidebar, PlaybackControls, Modals       │
└────────────────┬────────────────────────────┬────────────────┬──────────────┘
                 │                            │                │
                 ▼                            ▼                ▼
┌────────────────────────────┐  ┌────────────────────┐  ┌──────────────────┐
│  React Hooks               │  │  MIDI System       │  │  Storage Layer   │
│  `src/hooks/`              │  │  `src/midi/`       │  │  `src/core/`     │
│  useGrooveEngine           │  │  MIDIAccess        │  │  GrooveStorage   │
│  useGrooveActions          │  │  MIDIHandler       │  │  GrooveURLCodec  │
│  useMIDIInput              │  │  PerformanceTracker│  │  GrooveUtils     │
│  useMIDITracking           │  │  Filters (V/DT)    │  │                  │
│  useHistory, useURLSync    │  │                    │  │                  │
│  useMIDITimingAccuracy     │  │                    │  │                  │
└─────────┬──────────────────┘  └──────┬─────────────┘  └────────┬─────────┘
          │                            │                         │
          │                            ▼                         │
          │                    ┌──────────────────────┐           │
          │                    │  Voice Mapping       │           │
          │                    │  MIDIDrumMapping     │           │
          │                    │  DrumKitMapping      │           │
          │                    └──────────────────────┘           │
          │                            │                         │
          ▼                            ▼                         ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                         Core Engine (Framework-Agnostic)                   │
│                            `src/core/`                                      │
│                                                                             │
│  ┌─────────────────────────┐        ┌──────────────────────────────────┐   │
│  │  GrooveEngine           │        │  Playback Synthesis              │   │
│  │  • Main playback loop   │◄─────▶ │  DrumSynth (Web Audio API)       │   │
│  │  • Event emission       │        │  • Sample loading & caching      │   │
│  │  • Position tracking    │        │  • Audio context management      │   │
│  │  • Metronome control    │        │  • Rate limiting (anti-spam)     │   │
│  │  • Swing calculations   │        │  • Gain control                  │   │
│  └─────────────────────────┘        └──────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  GrooveData Processing                                               │   │
│  │  • GrooveUtils: normalize, validate, transform grooves             │   │
│  │  • GrooveURLCodec: compress/decompress groove state to URL params   │   │
│  │  • GrooveStorage: CRUD operations on localStorage                  │   │
│  │  • PatternManager: bulk operations on notes                        │   │
│  │  • ArticulationConfig: drum voice properties                       │   │
│  │  • BulkPatterns: preset patterns                                   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  Export/Import                                                       │   │
│  │  • ExportUtils: PDF, MIDI file, SVG/PNG generation                 │   │
│  │  • ABCTranscoder: drum notation ↔ ABC standard notation            │   │
│  │  • ABCRenderer: ABC to visual rendering                            │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────┬──────────────────────────────────────────────────────────────────┘
          │
          ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                       External Services                                     │
│  • Web Audio API (sample playback)                                          │
│  • Web MIDI API (drum machine input)                                        │
│  • localStorage (groove persistence)                                        │
│  • URL parameters (groove sharing)                                          │
└────────────────────────────────────────────────────────────────────────────┘
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

**Overall:** Strict separation of concerns with framework-agnostic core and React UI layer.

**Key Characteristics:**
- **Core engine is React-free**: `GrooveEngine` and `DrumSynth` have zero React dependencies. Can be used in any context (Node.js, vanilla JS, other frameworks).
- **Hook layer as bridge**: React hooks (`useGrooveEngine`, `useMIDIInput`, `useMIDITracking`) are the only place mixing React with core logic.
- **Event-driven architecture**: Core engine uses typed event emitters. MIDI events flow as DOM CustomEvents for UI reactivity.
- **Type-safe data flow**: All groove data flows through `GrooveData` interface. Optional `GroovePattern` subset for performance tracking.
- **Composable filters**: MIDI event pipeline (velocity → double-trigger → latency) uses composable filter classes.
- **Persistence abstraction**: `GrooveStorage` and `GrooveURLCodec` decouple how grooves are stored/shared from how they're used.

## Layers

**Presentation Layer (React Components):**
- Purpose: Render UI, capture user input, manage component-level state
- Location: `src/components/`, `src/pages/`, `src/contexts/`
- Contains: Modal dialogs, grid editor, controls (tempo/swing/volume), sheet music display
- Depends on: React hooks (custom), UI component library (Radix + Tailwind)
- Used by: Users through browser UI

**Integration Layer (React Hooks):**
- Purpose: Connect React component tree to core logic and external services
- Location: `src/hooks/`
- Contains: `useGrooveEngine`, `useMIDIInput`, `useMIDITracking`, `useHistory`, `useURLSync`, `useMIDITimingAccuracy`
- Depends on: React (useState, useEffect, useRef, useCallback), core modules, MIDI modules, storage utilities
- Used by: Components in presentation layer

**Core Engine (Framework-Agnostic):**
- Purpose: Playback scheduling, synthesis, groove data processing
- Location: `src/core/`
- Contains: `GrooveEngine`, `DrumSynth`, `GrooveStorage`, `GrooveURLCodec`, export/import utilities
- Depends on: Web Audio API, localStorage, native browser APIs only (no React)
- Used by: Integration layer (hooks) and tests

**MIDI System (Framework-Agnostic):**
- Purpose: Real-time MIDI device handling, performance tracking, event filtering
- Location: `src/midi/`
- Contains: `MIDIAccess`, `MIDIHandler`, `MIDIDrumMapping`, `PerformanceTracker`, filters (velocity/double-trigger)
- Depends on: Web MIDI API, Web Audio API, groove data types
- Used by: Integration layer (hooks)

**Storage Layer:**
- Purpose: Persist and retrieve groove data
- Location: `src/utils/` (storage helpers), `src/core/` (GrooveStorage/GrooveURLCodec)
- Contains: localStorage wrappers, error handling, data validation (Zod)
- Depends on: browser localStorage API, Zod (validation)
- Used by: Components, hooks, core engine

## Data Flow

### Primary Request Path: User plays groove with MIDI device

1. User clicks "Play" button in UI (`src/pages/ProductionPage.tsx` line 100+)
2. `useGrooveEngine.play()` hook called
3. Hook calls `engine.play()` on GrooveEngine instance → GrooveEngine starts scheduling
4. GrooveEngine emits `playbackStateChange` event → UI updates `isPlaying` state
5. MIDI device connected via `useMIDIInput` hook
6. User taps drum pad → MIDIAccess detects MIDI note on event
7. `useMIDIInput` applies filters:
   - `VelocityFilter.isValid(note, velocity)` → suppress if below threshold
   - `DoubleTriggerFilter.isValid(note, timestamp)` → suppress if within refractory window
8. Latency compensation applied: `timestamp - config.latencyCompensation.offsetMs`
9. Voice mapped via `MIDIDrumMapping` → gets `DrumVoice` (e.g., "kick")
10. Custom event `midi-hit` dispatched: `window.dispatchEvent(new CustomEvent('midi-hit', { detail: { voice, timestamp } }))`
11. `useMIDITracking` listens for event → calls `performanceTracker.analyzeHit(voice, timestamp)`
12. PerformanceTracker returns `HitAnalysis` → dispatches `midi-tracking-hit` event to UI
13. UI receives event → updates timing indicator feedback

### Groove Playback Loop

```
GrooveEngine.play() 
  → enable() 
    → scheduledNotes = extract all notes from groove
    → startTime = performance.now()
  → requestAnimationFrame loop:
    - elapsed = performance.now() - startTime
    - currentPosition = Math.floor(elapsed / beatDuration)
    - Emit positionChange event
    - Schedule ahead 150ms: if elapsed >= scheduleAheadTime:
      - For each note with position in [currentScheduledIndex, currentPosition + scheduleAheadTime]:
        - Look up swing offset via calculateSwingOffset()
        - Call synth.play(voice, velocity, scheduledTime)
        - Mark as scheduled
    - If position >= measureLength, loop (emit grooveChange with same groove)
```

### Groove Sharing via URL

1. User clicks "Share" → `ShareModal` opened (`src/components/production/ShareModal.tsx`)
2. Current groove state passed to `GrooveURLCodec.encodeGrooveToURL(groove)`
3. Encoder compresses groove using custom binary format (time signature, tempo, notes, etc.)
4. Compressed string encoded to URL-safe base64 and appended to share link
5. Link shared with others → URL loaded in browser
6. `App.tsx` reads URL parameters → `URLSync` hook decodes via `GrooveURLCodec.decodeURLToGroove()`
7. Decoded groove set as current groove in UI

### MIDI Performance Tracking (Spec #264)

1. Playback starts with groove loaded
2. `useMIDITracking` calls `performanceTracker.enable(groove, startTime)` 
3. PerformanceTracker builds swing-aware quantization grid:
   - For division 8/16/32: straight 16ths + swing offset on odd positions
   - For division 12/24/48: triplet grid (3 notes per beat)
   - Swing: `offsetMs = swing * (1/6)` ratio (internal 0-100 → 0-0.33 ratio)
4. User taps MIDI pad → `useMIDITracking.handleMIDIHit()` called with timestamp
5. PerformanceTracker.analyzeHit():
   - Calculate elapsed time from session start
   - Map to global step index (grid position)
   - Find closest quantized position on offset grid
   - Calculate signed timing error: `errorMs = actualTime - quantizedTime`
   - Grade accuracy using tempo-aware bands: `acceptWindow = min(90, beatDurMs * 0.18)`
   - Return `HitAnalysis` with timing/note scores and feedback
6. EWMA performed BPM estimation (optional):
   - On each hit, update `bpmEstimate` using exponential moving average
   - `alpha = 0.05` for smoothing
   - Detects if drummer speeding up/slowing down relative to grid

**State Management:**
- Groove state: React component state (ProductionPage) + GrooveEngine internal state
- Playback position: Managed by GrooveEngine, synced via `useGrooveEngine` hook
- MIDI config: localStorage via `midiStorage` utility, also in React state
- Latency config: Per-device localStorage via `latencyStorage` utility
- Performance stats: PerformanceTracker internal state, dispatched to UI via events

## Key Abstractions

**GrooveData:**
- Purpose: Represents a complete groove pattern with timing metadata
- Examples: `{ timeSignature, division, tempo, swing, measures[] }`
- Pattern: Immutable data structure; mutations create new objects via spreads or utilities
- Used in: GrooveEngine (scheduling), UI (display), storage (persistence), MIDI tracking (quantization)

**DrumVoice:**
- Purpose: Semantic identifier for drum sounds (distinguishes "snare-normal" from "snare-ghost")
- Examples: `'kick'`, `'snare-normal'`, `'hihat-closed'`, `'tom-rack'`
- Pattern: Union type of 30+ strings; mapped to Web Audio samples in `DrumSynth` and MIDI notes in `MIDIDrumMapping`
- Used in: Note representation, synthesis, MIDI mapping, performance tracking

**HitAnalysis:**
- Purpose: Encapsulates MIDI hit timing analysis for performance feedback
- Fields: `timingErrorMs` (signed), `timingAccuracy` (0-100%), `noteAccuracy`, `overall`, `feedback` (string)
- Pattern: Immutable result from `PerformanceTracker.analyzeHit()`, dispatched as CustomEvent detail
- Used in: MIDI timing UI feedback, performance logging

**MeasureConfig:**
- Purpose: Represents a single measure with optional time signature override
- Fields: `notes` (per-voice boolean arrays), `timeSignature` (optional override)
- Pattern: Immutable; accessed via array index (measure position in groove)
- Used in: Grid rendering, note editing, playback scheduling

## Entry Points

**Browser:**
- Location: `src/main.tsx`
- Triggers: Page load → React app initialization
- Responsibilities: Create React root, render App, initialize ThemeProvider

**App Router:**
- Location: `src/App.tsx`
- Triggers: Route matching via React Router
- Responsibilities: Conditional render ProductionPage vs EmbedPage based on `?embed=true`, error boundary, analytics tracking for share links

**Production Page (Main Editor):**
- Location: `src/pages/ProductionPage.tsx`
- Triggers: Navigation to `/` or `?embed=false`
- Responsibilities: Orchestrate all hooks, render drum grid + sheet music + controls + modals, manage groove state transitions

**Embed Page (Minimal Player):**
- Location: `src/pages/EmbedPage.tsx`
- Triggers: Navigation to `/?embed=true`
- Responsibilities: Simplified UI for embedded grooves (playback only, no editing)

**MIDI System Initialization:**
- Location: `src/hooks/useMIDIInput.ts` in `useEffect`
- Triggers: Component mount
- Responsibilities: Initialize Web MIDI API, scan devices, auto-connect to saved device, set up event listeners

**Playback Scheduler:**
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

**What happens:** Components directly modify groove arrays/objects instead of creating new objects.

**Why it's wrong:** React relies on reference changes to detect updates. Mutations cause stale renders and inconsistent state.

**Do this instead:** Use `GrooveUtils` functions or spread operators:
```typescript
// ✗ Wrong
groove.measures[0].notes['kick'][0] = true;

// ✓ Right
const newMeasure = { 
  ...groove.measures[0],
  notes: { ...groove.measures[0].notes, kick: [...groove.measures[0].notes.kick] }
};
const newGroove = { 
  ...groove, 
  measures: [...groove.measures.slice(0, 0), newMeasure, ...groove.measures.slice(1)] 
};
setState(newGroove);
```

### Calling React Hooks from MIDI Handlers

**What happens:** Developers add `useState` or other hooks directly in MIDI event handlers, breaking React rules.

**Why it's wrong:** Hooks must be called at the top level of components/hooks in the same order every render. Calling in event handlers causes undefined behavior.

**Do this instead:** Use CustomEvent pattern. MIDI handlers dispatch events; hooks listen:
```typescript
// ✗ Wrong
midiHandler.onNote = (note) => {
  setHits([...hits, note]); // ❌ Hook call in event handler
};

// ✓ Right
midiHandler.onNote = (note) => {
  window.dispatchEvent(new CustomEvent('midi-note', { detail: note }));
};
useEffect(() => {
  window.addEventListener('midi-note', (e) => {
    setHits([...hits, e.detail]);
  });
}, []);
```

### Storing Complex State in localStorage as JSON Strings

**What happens:** Directly stringify/parse complex objects, losing error handling and forward compatibility.

**Why it's wrong:** JSON serialization can fail silently, invalid data corrupts state, schema changes cause parsing errors.

**Do this instead:** Use `safeStorage` utility with Zod validation:
```typescript
// ✗ Wrong
localStorage.setItem('config', JSON.stringify(config));
const restored = JSON.parse(localStorage.getItem('config'));

// ✓ Right
import { safeStorage } from '../utils/safeStorage';
safeStorage.save('config', config, ConfigSchema);
const restored = safeStorage.load('config', ConfigSchema);
```

### Hardcoding MIDI Note Numbers

**What happens:** Developers use magic numbers (36, 38, 42, etc.) directly in conditionals instead of using drum kit mappings.

**Why it's wrong:** Hard to maintain, brittle when changing drum kits, unclear what notes map to which drums.

**Do this instead:** Use `MIDIDrumMapping` singleton:
```typescript
// ✗ Wrong
if (midiNote === 36) { /* kick */ }

// ✓ Right
const voice = midiDrumMapping.getNoteToVoiceMap(kitName).get(midiNote);
```

### Blocking the Audio Thread

**What happens:** Synchronous operations (JSON parsing, complex calculations) in audio scheduling code.

**Why it's wrong:** Causes audio glitches and dropouts.

**Do this instead:** Pre-calculate in `enable()` or idle time, use precomputed grids in hot paths:
```typescript
// ✗ Wrong
play(voice) {
  const grid = buildQuantizationGrid(); // Slow, blocks audio thread
  this.synth.play(voice);
}

// ✓ Right
enable(groove) {
  this.beatOffsets = this.buildOffsetGrid(); // Pre-calculate
}
play(voice) {
  this.synth.play(voice); // Fast, hot path
}
```

## Error Handling

**Strategy:** Graceful degradation. Errors in non-critical paths (MIDI, exports) don't crash the app. Critical errors (playback, groove loading) show user feedback.

**Patterns:**
- **MIDI initialization failures:** Log error, continue with MIDI disabled. User can re-enable in settings.
- **Sample loading failures:** Load what's available. Log missing samples. App plays with available sounds.
- **localStorage failures:** Use `safeStorage` wrapper with try-catch. Fall back to defaults if load fails.
- **URL decode failures:** Show "Invalid groove URL" toast. Offer to start fresh.
- **Zod validation failures:** Log validation error with field details. Use sensible defaults.
- **Web Audio context errors:** Log `processorerror` events. Allow recovery via context resume.

## Cross-Cutting Concerns

**Logging:** `src/utils/logger.ts` exports simple `logger` object. Used in core modules for non-sensitive debug info (timing, MIDI events, feature status). Level determined by console filters.

**Validation:** Zod schemas in storage layer and MIDI types. All external data (URL params, localStorage) validated before use. `GrooveData` validated in `GrooveEngine.enable()`.

**Authentication:** Not applicable. App is fully client-side, no auth layer.

**Analytics:** `src/utils/analytics.ts` tracks user actions (groove creation, shares, MIDI connections). Events include context (tempo, device name, referrer). Respects browser privacy settings.

---

*Architecture analysis: 2026-05-14*
