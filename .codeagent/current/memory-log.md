# Memory Log

Durable knowledge: decisions, patterns, "how we do things here", gotchas.

---

## Bundle Optimization

### Manual Chunk Splitting (2026-01-13)
**Decision**: Use Vite's `manualChunks` to split heavy export libraries into separate chunks.

**Reasoning**:
- Main bundle was 1,407 kB, causing slow initial page loads
- Export libraries (jspdf, lamejs, midi-writer-js, qrcode) only needed when user exports
- Lazy loading these reduces initial bundle to 787 kB (44% smaller)

**Pattern**:
```typescript
// vite.config.ts
manualChunks: {
  'react-vendor': ['react', 'react-dom', 'react-router-dom'],
  jspdf: ['jspdf'],
  lamejs: ['@breezystack/lamejs'],
  'midi-writer': ['midi-writer-js'],
  qrcode: ['qrcode'],
  lucide: ['lucide-react'],
}
```

**Gotcha**:
- The `qrcode` module exports functions directly, NOT on `.default`
- Use `QRCodeModule.toDataURL()`, not `QRCodeModule.default.toDataURL()`

---

## Metronome Patterns

### Metronome Offset Calculation (2026-01-12)
**Decision**: Support offset clicks at different subdivisions (E, AND, A for 16ths; TI, TA for triplets).

**Reasoning**:
- Common practice technique to internalize subdivisions
- Clicking on off-beats develops rhythmic independence
- ROTATE mode helps practice all subdivision positions

**Pattern**:
```typescript
// Calculate offset positions based on division and offset type
private getOffsetPositions(division: number, offsetClick: MetronomeOffsetClick): number[] {
  const positionsPerBeat = division / 4;

  if (offsetClick === '1') return [0]; // On the beat
  if (offsetClick === 'AND') return [positionsPerBeat / 2]; // Half-way
  if (offsetClick === 'E') return [positionsPerBeat / 4]; // First e
  if (offsetClick === 'A') return [positionsPerBeat * 3 / 4]; // First a
  // ... triplet positions
}

// Check if current position should have metronome click
private shouldPlayMetronome(position: number, division: number): 'accent' | 'normal' | null {
  if (this.metronomeConfig.frequency === 0) return null;
  const positionsPerMetronomeBeat = division / this.metronomeConfig.frequency;
  const beatPosition = position % positionsPerMetronomeBeat;
  const offsetPositions = this.getOffsetPositions(division, this.metronomeConfig.offsetClick);
  if (offsetPositions.includes(beatPosition)) {
    return position === 0 ? 'accent' : 'normal';
  }
  return null;
}
```

**Gotcha**:
- Offset positions are relative to each metronome beat, not the measure
- ROTATE mode increments offset index on each loop
- Triplet divisions (12, 24) use TI/TA; non-triplet use E/AND/A

---

### Metronome Volume Boost (2026-01-12)
**Decision**: Apply 2.5x volume boost to metronome samples in DrumSynth.

**Reasoning**:
- Metronome audio files are inherently quieter than drum samples
- Without boost, metronome is barely audible at 100% volume
- Boost makes metronome volume slider useful across full range

**Pattern**:
```typescript
// In DrumSynth.playDrum()
let volume = velocity / 127;
if (voice.startsWith('hihat-metronome')) {
  volume *= 2.5;
}
```

**Gotcha**:
- Only boost metronome samples, not regular hi-hat sounds
- Metronome voices: `hihat-metronome-normal`, `hihat-metronome-accent`

---

### Metronome Settings Persistence (2026-01-12)
**Decision**: Store metronome config in localStorage, not URL.

**Reasoning**:
- Metronome settings are user preferences, not groove data
- Different from tempo/time signature which are part of the groove
- localStorage is simpler for user preferences
- No need to share metronome settings in URLs

**Pattern**:
```typescript
const METRONOME_STORAGE_KEY = 'groovy-metronome-config';

function loadMetronomeConfig(): MetronomeConfig {
  try {
    const saved = localStorage.getItem(METRONOME_STORAGE_KEY);
    if (saved) return { ...DEFAULT_METRONOME_CONFIG, ...JSON.parse(saved) };
  } catch (e) { /* ignore */ }
  return DEFAULT_METRONOME_CONFIG;
}

function saveMetronomeConfig(config: MetronomeConfig): void {
  localStorage.setItem(METRONOME_STORAGE_KEY, JSON.stringify(config));
}
```

**Gotcha**:
- Merge with defaults to handle missing fields from older saved configs
- Initialize engine with loaded config on mount

---

## Analytics Patterns

### Conditional Analytics Loading (2026-01-12)
**Decision**: Load analytics script dynamically only on production domain (bahar.co.il).

**Reasoning**:
- Open-source deployments shouldn't have analytics
- No external script loaded for non-production domains
- All tracking functions become no-ops when disabled
- Zero performance/network overhead for generic deployments

**Pattern**:
```typescript
// In src/utils/analytics.ts
const ANALYTICS_DOMAIN = 'bahar.co.il';

const isAnalyticsEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.endsWith(ANALYTICS_DOMAIN);
};

// Load script only on production
function loadAnalyticsScript(): void {
  if (!isAnalyticsEnabled()) return;
  // ...dynamically create script tag
}

// All tracking functions check before sending
const analytics = {
  track: (eventName: string, props?: Record<string, unknown>) => {
    if (!isAnalyticsEnabled()) return;
    window.BaharAnalytics?.track(eventName, props);
  },
};
```

**Gotcha**:
- Script must be loaded before any tracking calls
- Module initialization calls `loadAnalyticsScript()` automatically
- `window.BaharAnalytics` is undefined until script loads (use optional chaining)

---

## Groove Library Patterns

### Library Data Storage (2026-01-12)
**Decision**: Store library grooves as URL-encoded strings in a JSON file bundled with the app.

**File Location**: `src/data/libraryGrooves.json`

**Reasoning**:
- Same format as shareable URLs - reuses existing URL codec
- No runtime parsing needed beyond URL decoding
- Easy to add new grooves by copying URL from browser
- JSON file is statically imported and bundled

**Pattern**:
```json
{
  "styles": [
    {
      "id": "rock",
      "name": "Rock / Pop",
      "grooves": [
        {
          "name": "Basic Rock",
          "url": "TimeSig=4/4&Div=16&Tempo=120&Measures=1&H=|x-x-x-x-x-x-x-x-|&S=|----o-------o---|&K=|o-------o-------|"
        }
      ]
    }
  ]
}
```

**Gotcha**:
- URL must NOT include the `?` prefix - just the query string
- When decoding, prefix with `?` before calling `decodeURLToGroove`

---

### Library vs My Groovies (2026-01-12)
**Decision**: Library grooves are read-only; users must "Save Copy" to edit.

**Reasoning**:
- Library provides stable, curated presets
- Users can customize without affecting original
- Clear separation of built-in vs user content
- My Groovies uses localStorage for persistence

**Pattern**:
```typescript
// Load library groove (read-only, from bundled JSON)
const grooveData = decodeGroove(libraryGroove);
setGroove(grooveData);

// Save to My Groovies (editable, stored in localStorage)
onSaveToMyGroovies(grooveData, libraryGroove.name);
```

---

## Audio Scheduling Patterns

### Audio Scheduling Tuning (2026-01-10)
**Decision**: Increase `scheduleAheadTime` to 150ms and scheduler interval to 50ms for better timing stability.

**Reasoning**:
- 100ms look-ahead was sometimes insufficient during heavy UI operations (context menus, state updates)
- 25ms scheduler interval was causing unnecessary CPU wake-ups
- 150ms provides enough buffer without noticeable latency
- 50ms interval (20x/sec) still stays well ahead of the 150ms window

**Pattern**:
```typescript
// In GrooveEngine.ts
private scheduleAheadTime = 0.15;  // 150ms look-ahead (was 0.1)

// Scheduler interval
setTimeout(() => this.scheduler(), 50);  // 50ms (was 25ms)
```

**Gotcha**:
- Don't set scheduleAheadTime too high or notes will feel delayed to user input
- Don't set interval too low or CPU usage increases unnecessarily
- Balance: schedule far enough ahead for jitter, but not so far that latency is noticeable

---

## React State Patterns

### Batch Note Updates (2026-01-10)
**Decision**: Use batch `onSetNotes` instead of multiple `onNoteToggle` calls when changing multiple notes atomically.

**Reasoning**:
- React state batching causes stale closures when calling setState multiple times in sequence
- Each call captures the original state value, not the updated one from previous calls
- Only the last update "wins", previous updates are lost

**Gotcha**:
- `handleVoiceSelect` was calling `onNoteToggle` to clear old voices, then `onNoteToggle` to set new voice
- All calls used stale `groove` state, so clears were overwritten by the set operation
- Notes appeared to "stack" instead of replacing

**Pattern**:
```typescript
// DON'T do this - each call uses stale state
voices.forEach(voice => onNoteToggle(voice, position, measureIndex));

// DO collect changes and apply in one batch
const changes: NoteChange[] = [];
// Add clear changes
oldVoices.forEach(voice => {
  if (measure.notes[voice]?.[position]) {
    changes.push({ voice, position, measureIndex, value: false });
  }
});
// Add set changes
newVoices.forEach(voice => {
  changes.push({ voice, position, measureIndex, value: true });
});
// Apply all at once
onSetNotes(changes);
```

**Best Practice**:
- When updating multiple notes that depend on each other's state, use batch updates
- `NoteChange` interface: `{ voice, position, measureIndex, value: boolean }`
- `onSetNotes(changes)` applies all changes in single state update

---

## CSS & Styling Patterns

### CSS Bundling & Global Scope (2026-01-08)
**Decision**: Avoid universal CSS resets in component-specific stylesheets.

**Reasoning**:
- Vite bundles ALL CSS files together regardless of which page imports them
- Universal selectors (`*`) have low specificity but affect everything
- CSS cascade order (later = wins) can cause unexpected overrides

**Gotcha**:
- A `* { margin: 0; padding: 0; }` in `PocApp.css` was overriding Tailwind utilities like `mt-[15px]` on the NewUI page
- Both had same specificity, but POC reset came later in bundle
- **Fix**: Remove aggressive resets; let Tailwind's preflight handle normalization

**Pattern**:
```css
/* DON'T do this in component CSS - affects entire app */
* {
  margin: 0;
  padding: 0;
}

/* DO use scoped selectors */
.poc-app * {
  /* Only affects .poc-app children */
}
```

**Best Practice**:
- Use Tailwind's preflight for normalization
- Scope CSS to specific components/containers
- Avoid universal selectors in non-root CSS files

---

## Practice Features

### Auto Speed Up (2026-01-07)
**Decision**: Implement automatic tempo increase as a practice feature.

**Reasoning**:
- Common practice technique: start slow, gradually increase tempo
- Automated progression removes manual intervention
- Loop-based increases feel natural musically

**Pattern**:
```typescript
// Hook handles all state and timing
const autoSpeedUp = useAutoSpeedUp({
  tempo: groove.tempo,
  onTempoChange: (newTempo) => { ... },
  isPlaying,
});

// Check on each loop
useEffect(() => {
  if (loopCount > 0) {
    autoSpeedUp.onLoopComplete();
  }
}, [loopCount]);
```

**Gotcha**:
- Must sync with groove engine's loop count, not position
- Auto-disable when target reached to prevent runaway tempo
- Store config in localStorage for persistence

---

### A/V Sync Offset (2026-01-07)
**Decision**: Allow users to adjust visual cursor timing relative to audio.

**Reasoning**:
- Different systems have different audio/visual latency
- Bluetooth speakers can add significant delay
- User-adjustable offset provides personalized fix

**Pattern**:
```typescript
// Convert ms offset to beat positions
const msPerPosition = (60000 / tempo) / (division / 4);
const positionOffset = Math.round(syncOffset / msPerPosition);

// Apply to visual position only (not audio)
const visualPosition = currentPosition - positionOffset;
```

**Gotcha**:
- Positive offset = delay visual (if visual is ahead of sound)
- Negative offset = advance visual (if sound is ahead of visual)
- Must wrap position around when it goes negative or exceeds total

---

## Sheet Music Patterns

### Cursor Bounds Calculation (2026-01-07)
**Decision**: Use barlines for right bound, first note for left bound.

**Reasoning**:
- abcjs only renders barlines at END of measures, not start
- First note position accurately marks beat 1
- Last barline accurately marks end of measure (even with rests)

**Pattern**:
```typescript
// Left bound: first note on line
notes.forEach(note => {
  if (noteOnLine) minX = Math.min(minX, note.left);
});

// Right bound: last barline on line
if (barlinesOnLine.length > 0) {
  maxX = barlinesOnLine[barlinesOnLine.length - 1].right;
}
```

**Gotcha**:
- Note elements exist only for actual notes, not rests
- Can't use note indices as position indices (they don't match)
- Barlines are `.abcjs-bar` class in SVG

---

## URL Sharing & State Persistence

### URL Encoding for Groove State (2026-01-06)
**Decision**: Encode entire groove state in URL params for sharing and bookmarking.

**Reasoning**:
- Users can share grooves by copying URL
- No backend needed for sharing
- Browser history works with groove state
- Bookmarks capture exact groove state

**Pattern**:
```typescript
// useURLSync hook handles all URL sync
const { copyURLToClipboard } = useURLSync(groove, setGroove);

// URL params: TimeSig, Div, Tempo, Measures, Swing, H, S, K, Title, Author, Comments
// Example: ?TimeSig=4/4&Div=16&Tempo=120&H=|x-x-x-x-x-x-x-x-|&Title=My+Groove
```

**Gotcha**:
- Use `history.replaceState` (not `pushState`) to avoid polluting browser history
- Debounce URL updates (300ms) to avoid excessive updates during editing
- Metadata is optional - encode only when non-empty

---

### Metadata Fields (2026-01-06)
**Decision**: Add optional title, author, comments to GrooveData.

**Reasoning**:
- Allows naming/attribution of shared grooves
- Comments can include tempo markings, style notes
- All optional to keep default case simple

**Pattern**:
```typescript
interface GrooveData {
  // ... core fields ...
  title?: string;    // max 100 chars
  author?: string;   // max 50 chars
  comments?: string; // max 500 chars
}
```

**Gotcha**:
- Use `|| undefined` not `|| ''` when clearing - empty strings still encode in URL
- Metadata changes don't affect audio, so don't call `updateGroove()` on engine

---

## Sheet Music Patterns

### Multi-line Sheet Music (2026-01-06)
**Decision**: Break sheet music to new line after every 3 measures.

**Reasoning**:
- Improves readability for long patterns
- 3 measures fits well in standard width
- Matches common sheet music conventions

**Pattern**:
```typescript
// In ABCTranscoder.ts
const MEASURES_PER_LINE = 3;

// Add newline after every 3 measures
if (measureNumber % MEASURES_PER_LINE === 0 && measureIndex < groove.measures.length - 1) {
  parts.push('\n');
}
```

**Gotcha**:
- Must match `MEASURES_PER_LINE` in both ABCTranscoder and SheetMusicDisplay
- Newline goes after the bar line (`|`), not before

---

### Per-line Cursor Tracking (2026-01-06)
**Decision**: Cursor appears only on the currently playing line, not spanning all lines.

**Reasoning**:
- Visual clarity - shows exactly where in the music we are
- Works correctly with multi-line notation
- Smooth animation within line, instant jump between lines

**Pattern**:
```typescript
// Calculate line bounds by dividing SVG height by number of lines
const lineHeight = svgHeight / numLines;
const lineTop = svgRect.top + lineIdx * lineHeight;

// Find which line current position is on
const currentLine = lineBounds.find(
  line => currentPosition >= line.startPos && currentPosition <= line.endPos
);

// Clamp cursor to line boundaries
cursorLeft = Math.min(cursorLeft, currentLine.right);
```

**Gotcha**:
- Use instant transition (no animation) when jumping between lines
- Clamp cursor position to prevent it from going past line end

---

### Hidden Empty Beats (2026-01-06)
**Decision**: Use invisible rests (`x`) instead of visible rests (`z`) in ABC notation.

**Reasoning**:
- Cleaner sheet music appearance
- Preserves rhythmic spacing
- Focus on what's played, not what's silent

**Pattern**:
```typescript
// In ABCConstants.ts
export const ABC_REST = 'x';  // invisible rest (was 'z')
```

**Gotcha**:
- `x` preserves timing/spacing but doesn't render
- `z` would show rest symbols

---

### Default Division (2026-01-06)
**Decision**: Default to 1/8 notes (division: 8) instead of 1/16 notes (division: 16).

**Reasoning**:
- Simpler starting point for beginners
- 8 positions per measure is easier to work with
- Can always switch to 16ths for more detail

**Pattern**:
```typescript
// In types.ts
export const DEFAULT_GROOVE: GrooveData = {
  division: 8,  // was 16
  // ...
};

// In GrooveUtils.ts
static getDefaultDivision(beats, noteValue): Division {
  if (this.isDivisionCompatible(8, beats, noteValue)) {
    return 8;  // was 16
  }
  // ...
}
```

---

## Note Creation & Editing Patterns

### Mac Keyboard Modifier Compatibility (2026-01-06)
**Decision**: Use Shift+drag as alternative to Alt+drag for erasing notes.

**Reasoning**:
- On Mac, Option (Alt) + click can trigger special characters or behaviors
- Shift key is more reliable across platforms
- Both modifiers now work for erasing

**Pattern**:
```typescript
// Handle both Alt and Shift for erase
if (event.altKey || event.shiftKey) {
  setDragMode('erase');
}
```

**Gotcha**:
- Test keyboard modifiers on both Mac and Windows
- Mac: ⌘ = metaKey, ⌥ = altKey, ⇧ = shiftKey
- Windows: Ctrl = ctrlKey, Alt = altKey, Shift = shiftKey

---

### Keyboard Shortcuts Footer (2026-01-06)
**Decision**: Add persistent footer with all keyboard shortcuts visible at all times.

**Reasoning**:
- Users don't need to discover shortcuts through trial and error
- Quick reference always available
- Uses `<kbd>` HTML element for proper semantics

**Pattern**:
```tsx
<footer className="shortcuts-footer">
  <span><kbd>Space</kbd> Play/Pause</span>
  <span><kbd>E</kbd> Edit Mode</span>
  <span><kbd>⌘/Ctrl</kbd>+drag Paint</span>
  ...
</footer>
```

**Gotcha**:
- Use Unicode symbols for Mac keys (⌘ ⇧ ⌥)
- Make responsive for mobile (smaller font, tighter gaps)

---

### Undo/Redo Implementation (2026-01-05)
**Decision**: Use custom `useHistory` hook with configurable history limit (default 50 actions).

**Reasoning**:
- Generic, reusable hook for any state management
- Prevents memory bloat with configurable limit
- Simple API: `undo()`, `redo()`, `canUndo`, `canRedo`
- Works seamlessly with React state

**Pattern**:
```typescript
const { state, setState, undo, redo, canUndo, canRedo } = useHistory<T>(initialState, limit);
```

**Gotcha**: When undoing/redoing, must manually sync with engine:
```typescript
undo();
setTimeout(() => updateGroove(groove), 0);  // Sync after state updates
```

---

### Touch Support for Mobile (2026-01-05)
**Decision**: Implement touch events alongside mouse events for full mobile support.

**Reasoning**:
- Mobile users need drag-to-paint functionality
- Long-press provides context menu access
- Touch targets must be 44x44px minimum for accessibility
- Prevent default behaviors to avoid text selection and callouts

**Pattern**:
```typescript
// Touch start
onTouchStart={(e) => {
  e.preventDefault();
  longPressTimer = setTimeout(() => openContextMenu(), 500);
}}

// Touch move
onTouchMove={(e) => {
  e.preventDefault();
  clearTimeout(longPressTimer);
  // Paint notes as user drags
}}

// Touch end
onTouchEnd={(e) => {
  e.preventDefault();
  clearTimeout(longPressTimer);
}}
```

**Gotcha**:
- Must call `e.preventDefault()` to prevent default touch behaviors
- Long-press timer must be cleared on move/end to avoid false triggers
- Touch coordinates are in `e.touches[0]`, not `e.clientX/Y`
- Use `document.elementFromPoint()` to find cell under touch

---

### Custom Pattern Saving (2026-01-05)
**Decision**: Use localStorage for custom pattern persistence with category organization.

**Reasoning**:
- No backend required for POC
- Patterns persist across page reloads
- Category organization (hi-hat, snare, kick, tom) keeps patterns organized
- JSON export/import allows sharing patterns

**Pattern**:
```typescript
// Save pattern
PatternManager.savePattern({
  id: 'my-pattern',
  label: 'My Groove',
  description: 'Custom pattern',
  category: 'hihat',
  pattern: (notes) => { /* transform notes */ },
  createdAt: Date.now()
});

// Load patterns by category
const patterns = PatternManager.loadPatternsByCategory('hihat');
```

**Gotcha**:
- localStorage has ~5-10MB limit (varies by browser)
- Pattern functions can't be serialized - must reconstruct on load
- Must validate imported JSON to prevent malicious code
- Consider adding pattern count limit to prevent storage overflow

---

### Bulk Pattern Operations (2026-01-05)
**Decision**: Centralize bulk patterns in `BulkPatterns.ts` with metadata and pattern functions.

**Reasoning**:
- Single source of truth for all patterns
- Easy to add new patterns
- Testable (each pattern is a pure function)
- Metadata (label, description) improves UX

**Pattern**:
```typescript
export const HI_HAT_PATTERNS: BulkPattern[] = [
  {
    id: 'hihat-all-on',
    label: 'All On',
    description: 'Fill every position',
    pattern: (notes) => notes.map(() => true)
  },
  // ... more patterns
];
```

**Gotcha**: Pattern functions receive current notes array and return new array - must not mutate original.

---

### Articulation Icons (2026-01-05)
**Decision**: Use Font Awesome icons with custom mappings for each articulation.

**Reasoning**:
- Visual distinction between articulations
- No need for custom SVG assets
- Accessible with ARIA labels
- Consistent sizing and styling

**Pattern**:
```typescript
const iconMap: Record<string, string> = {
  'normal': 'fa-circle',
  'accent': 'fa-circle-exclamation',
  'ghost': 'fa-circle-o',
  // ... more mappings
};
```

**Gotcha**: Font Awesome must be loaded in `index.html` - icons won't show without CDN link.

---

### Advanced Edit Mode (2026-01-05)
**Decision**: Toggle between simple mode (click to toggle) and advanced mode (click to open menu).

**Reasoning**:
- Simple mode is faster for basic editing
- Advanced mode is better when frequently changing articulations
- Toggle with 'E' key for quick switching
- Visual indicator shows current mode

**Pattern**:
```typescript
const [advancedEditMode, setAdvancedEditMode] = useState(false);

const handleCellClick = (voice, position) => {
  if (advancedEditMode) {
    openArticulationMenu(voice, position);
  } else {
    toggleNote(voice, position);
  }
};
```

**Gotcha**: Must handle both left-click and right-click in advanced mode - right-click always opens menu.

---

## Testing Patterns

### Unit Testing with Vitest (2026-01-05)
**Decision**: Use Vitest for unit testing core logic (bulk patterns, utilities, etc.).

**Reasoning**:
- Fast, modern test runner built on Vite
- Compatible with Vite build setup
- Supports TypeScript out of the box
- UI mode for interactive testing

**Pattern**:
```typescript
import { describe, it, expect } from 'vitest';

describe('BulkPatterns', () => {
  it('should fill all positions', () => {
    const notes = [false, false, false, false];
    const result = ALL_ON_PATTERN.pattern(notes);
    expect(result).toEqual([true, true, true, true]);
  });
});
```

**Commands**:
- `npm test` - Run tests once
- `npm run test:watch` - Watch mode
- `npm run test:ui` - Interactive UI

**Gotcha**: Vitest config must be in root directory (`vitest.config.ts`), not in `src/`.

---

---

## Playback & UI Patterns

### Playback Restart on Division/Time Signature Change (2026-01-05)
**Decision**: When user changes division or time signature during playback, stop and restart from position 0.

**Reasoning**:
- Prevents audio/visual desync (visual progress indicator would be at wrong position in new division)
- Makes the change clear and predictable to the user
- Avoids confusing mid-loop transitions
- Ensures timing calculations are correct from the start

**Pattern**:
```typescript
const handleDivisionChange = async (division: Division) => {
  const wasPlaying = isPlaying;

  // Stop playback if playing
  if (wasPlaying) {
    stop();
  }

  // Update groove data
  const newGroove = { ...groove, division, notes: resizedNotes };
  setGroove(newGroove);
  updateGroove(newGroove);

  // Restart playback from beginning if it was playing
  if (wasPlaying) {
    await play(newGroove);
  }
};
```

**Gotcha**: Must use `async/await` to ensure proper sequencing of stop → update → play. Without `await`, play might start before stop completes.

---

### Default Sync Mode (2026-01-05)
**Decision**: Default sync mode is "start" (visual playhead at beginning of note).

**Reasoning**:
- More intuitive for most users (playhead appears when note starts)
- Matches common DAW behavior
- "Middle" was confusing for new users

**Pattern**:
```typescript
const [syncMode, setSyncMode] = useState<SyncMode>('start');

useEffect(() => {
  setEngineSyncMode('start');
}, [setEngineSyncMode]);
```

**Gotcha**: Must initialize both React state AND engine state. React state controls UI, engine state controls playback.

---

## Deployment & Configuration

### Configurable Base Path (2026-01-05)
**Decision**: Use single `PRODUCTION_BASE_PATH` constant in `vite.config.ts` for all path configuration.

**Reasoning**:
- Single source of truth for deployment subdirectory
- Easy to change for different environments (staging, production, etc.)
- Automatically propagates to Vite, React Router, and asset loading
- Prevents hardcoded paths scattered throughout codebase

**Pattern**:
```typescript
// vite.config.ts
const PRODUCTION_BASE_PATH = '/scribe2/';  // Change this to deploy elsewhere
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? PRODUCTION_BASE_PATH : '/',
});

// React Router automatically uses import.meta.env.BASE_URL
const basename = import.meta.env.BASE_URL;
<BrowserRouter basename={basename}>

// Asset loading automatically uses import.meta.env.BASE_URL
const soundPath = `${import.meta.env.BASE_URL}sounds/${fileName}`;
```

**Gotcha**:
- Must rebuild after changing `PRODUCTION_BASE_PATH`
- Path must start and end with `/` (e.g., `/scribe2/`, not `/scribe2`)
- Development always uses `/` for simplicity

---

### Subdirectory Deployment (2026-01-05)
**Decision**: Deploy to subdirectory (`/scribe2/`) instead of root, with proper Apache configuration.

**Reasoning**:
- Allows multiple apps on same domain
- Follows existing pattern on www.bahar.co.il (MyTrips, fantasybroker, etc.)
- Requires proper .htaccess configuration for React Router

**Pattern**:
1. Set `PRODUCTION_BASE_PATH` in `vite.config.ts`
2. Build with `npm run build:prod`
3. Upload `dist/` contents to subdirectory on server
4. Upload `.htaccess` to subdirectory for React Router support
5. Add exclusion to root `.htaccess`: `RewriteCond %{REQUEST_URI} !^/scribe2/`

**Gotcha**:
- Root `.htaccess` can interfere with subdirectory routing - must add exclusion
- React Router needs `basename` prop to maintain subdirectory in URLs
- All asset paths must use `import.meta.env.BASE_URL`, not hardcoded `/`
- Sounds must load from `/scribe2/sounds/`, not `/sounds/`

---

## Architecture Decisions

### Core Logic Separation (2025-12-XX)
**Decision**: Keep core engine (GrooveEngine, DrumSynth) completely framework-agnostic with ZERO React dependencies.

**Reasoning**:
- Makes core logic testable without UI
- Allows UI framework to be replaced without touching core
- Enables reuse across different frameworks (React, Vue, Svelte, vanilla JS)
- Future-proof architecture

**Pattern**:
- Core emits events (`playbackStateChange`, `positionChange`, `grooveChange`)
- UI listens to events and updates state
- UI calls core methods (`play()`, `stop()`, `updateGroove()`)
- Adapter layer (`useGrooveEngine` hook) bridges core and React

**Gotcha**: Never import React or any UI framework in `src/core/`. If you need to, you're doing it wrong.

---

### Dual-Page Setup (2025-12-XX)
**Decision**: Maintain separate POC testing page (`/poc`) and production UI (`/`) using React Router.

**Reasoning**:
- POC provides lightweight interface for testing core logic changes
- Production UI can be built incrementally without breaking testing workflow
- Clear separation between testing and production concerns
- POC serves as reference implementation

**Pattern**:
1. Make changes to core logic (`src/core/`)
2. Test on POC page (`/poc`) to verify functionality
3. Once validated, implement in production UI (`/`)

**Gotcha**: Don't delete the POC page - it's valuable for testing and validation.

---

### Event-Based Communication (2025-12-XX)
**Decision**: Use observer pattern for core-to-UI communication.

**Reasoning**:
- Decouples core from UI
- Allows multiple listeners (useful for debugging, analytics, etc.)
- Standard pattern for framework-agnostic code

**Pattern**:
```typescript
// Core emits events
engine.on('playbackStateChange', (isPlaying) => { ... });
engine.on('positionChange', (position) => { ... });
engine.on('grooveChange', (groove) => { ... });

// UI listens and updates state
const [isPlaying, setIsPlaying] = useState(false);
engine.on('playbackStateChange', setIsPlaying);
```

**Gotcha**: Always clean up listeners on unmount to prevent memory leaks.

---

## Development Patterns

### How We Handle Groove Updates During Playback
**Pattern**: Changes apply on next loop, not immediately.

**Implementation**:
- User edits groove → UI calls `engine.updateGroove(newGroove)`
- Engine stores as `pendingGroove`
- On loop completion, `pendingGroove` becomes `currentGroove`
- UI shows "pending changes" indicator during playback

**Reasoning**: Prevents jarring mid-loop changes, maintains musical timing.

---

### How We Load Drum Samples
**Pattern**: DrumSynth loads samples on construction, stores in Map.

**Implementation**:
```typescript
private sampleFiles: Record<DrumVoice, string> = {
  kick: 'Kick.mp3',
  snare: 'Snare Normal.mp3',
  hihat: 'Hi Hat Normal.mp3',
};
```

**Location**: `/public/sounds/` (30 samples available)

**Gotcha**: Web Audio API requires user interaction before playing audio. Always call `synth.resume()` on first user action.

---

### How We Calculate Swing
**Pattern**: Swing delays every other note by a percentage of the note duration.

**Implementation**:
- Swing 0% = straight timing
- Swing 50% = triplet feel
- Swing 100% = maximum delay
- Formula: `swingOffset = (position % 2 === 1) ? (swing / 100) : 0`

**Gotcha**: Swing only affects odd-numbered positions (1, 3, 5, etc.).

---

## Tech Stack Decisions

### Why Vite?
- Fast dev server with HMR
- Modern build tool optimized for React + TypeScript
- Better than Create React App (CRA is deprecated)

### Why TypeScript?
- Type safety prevents bugs
- Better IDE support and autocomplete
- Self-documenting code

### Why Web Audio API?
- Native browser support (no external dependencies)
- Precise timing for musical applications
- Sample-based playback with gain control

---

## Gotchas & Lessons Learned

### Web Audio Context Timing
**Issue**: `audioContext.currentTime` is in seconds, not milliseconds.

**Solution**: Always use seconds for timing calculations.

---

### React Router Basename
**Issue**: If deploying to subdirectory (e.g., GitHub Pages), routes may break.

**Solution**: Set `basename` prop on `<BrowserRouter>` if needed.

---

### Sample Loading Race Condition
**Issue**: User might click play before samples are loaded.

**Solution**: DrumSynth checks `isLoaded` flag before playing. Could add loading indicator in UI.

---

### Pending Groove Updates
**Issue**: User might forget changes are pending during playback.

**Solution**: Show visual indicator (`hasPendingChanges` state) in UI.

---

## File Organization

### Core Logic (`src/core/`)
- Framework-agnostic
- No React imports
- Pure TypeScript/JavaScript
- Event-based API

### Hooks (`src/hooks/`)
- React-specific adapters
- Bridge between core and UI
- Only place where React meets core

### POC (`src/poc/`)
- Testing interface
- Reference implementation
- Lightweight components

### Pages (`src/pages/`)
- Route components
- Minimal logic (delegate to components)

### Components (`src/components/`)
- Shared/production components
- Reusable UI elements

---

## Naming Conventions

- **Core classes**: PascalCase (GrooveEngine, DrumSynth)
- **React components**: PascalCase (DrumGrid, PlaybackControls)
- **Hooks**: camelCase with `use` prefix (useGrooveEngine)
- **Types**: PascalCase (GrooveData, DrumVoice)
- **Files**: Match export name (GrooveEngine.ts, useGrooveEngine.ts)

---

## Testing Strategy (Future)

### Core Logic
- Unit tests for GrooveEngine (timing, scheduling, loop management)
- Unit tests for DrumSynth (sample loading, playback)
- No UI dependencies needed

### UI Components
- Integration tests with React Testing Library
- Test user interactions (click, input changes)
- Mock core engine for predictable tests

### E2E
- Playwright or Cypress for full user flows
- Test on POC page first, then production

---

## Performance Notes

### Audio Scheduling
- Schedule notes 100ms ahead (`scheduleAheadTime = 0.1`)
- Use `setTimeout` for visual updates (less precise, but fine for UI)
- Use Web Audio API scheduling for audio (precise timing)

### React Rendering
- Use `useState` for UI state
- Use `useRef` for engine instance (doesn't trigger re-renders)
- Minimize re-renders by keeping state minimal

---

## Future Considerations

### Multi-Measure Support
- Will need to extend `GrooveData` type
- May need to refactor scheduling logic
- POC can test core changes first

### MIDI Export
- Core logic should generate MIDI events
- UI provides download button
- Keep MIDI generation in core (framework-agnostic)

### Notation Rendering
- Consider separate library (ABC.js, VexFlow)
- Keep rendering logic separate from core
- Core provides data, UI renders notation
