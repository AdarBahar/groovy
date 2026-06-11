---
phase: quick-260611-g5v
plan: 01
subsystem: midi-performance-cleanup
tags: [performance, refactor, cleanup, midi, bundle, latency, codec]
depends_on: []
provides: [hot-path-logging, single-subscription-listener, abcjs-chunk, deferred-stop, cleanup-batch, latency-migration, codec-alignment]
affects: [src/midi, src/hooks, src/core, src/utils, src/components/production, vite.config.ts, CLAUDE.md]
tech-stack:
  added: []
  patterns: [debug-gated-logging, single-subscription-pattern, manualChunks-bundle-split, deferred-setTimeout-stop, localStorage-key-migration]
key-files:
  created:
    - src/utils/latencyStorage.test.ts
  modified:
    - src/hooks/useMIDITimingAccuracy.ts
    - src/midi/PerformanceTracker.ts
    - src/midi/MIDIAccess.ts
    - src/hooks/useMIDITracking.ts
    - src/hooks/useMIDITracking.test.ts
    - src/hooks/useGrooveEngine.ts
    - vite.config.ts
    - src/core/GrooveEngine.ts
    - src/core/GrooveEngine.test.ts
    - src/components/production/ShareModal.tsx
    - src/midi/MIDIHandler.ts
    - src/midi/KeyboardMIDISimulator.ts
    - src/hooks/useMIDIInput.ts
    - src/utils/safeStorage.ts
    - src/utils/latencyStorage.ts
    - src/core/GrooveURLCodec.ts
    - src/core/GrooveURLCodec.test.ts
    - CLAUDE.md
decisions:
  - P3 abcjs manualChunks over dynamic-import: renderABC is synchronous and consumed at 4 call sites; converting would require async plumbing across >5 files
  - P4 isDebugMode guard over removing usage check: preserves warning in debug mode while keeping happy path O(1)
  - P6 window.setTimeout defer over immediate stop: last scheduled note needs its full duration before state changes
  - C8 trim-then-split over filter: defensive alignment fix, backward-compatible with existing full-width encoders
metrics:
  duration_minutes: 85
  tasks_completed: 6
  tasks_total: 6
  tests_before: 199
  tests_after: 215
  completed_date: 2026-06-11
  bundle_main_before_kb: ~804
  bundle_main_after_kb: 347
---

# Phase quick-260611-g5v Plan 01: Performance and Cleanup Improvements SUMMARY

**One-liner:** Debug-gated MIDI hot-path logging, single-subscription listener, abcjs bundle chunk split, deferred non-loop stop, timingScores rename, latency key migration, codec alignment fix.

**Note:** Execution was resumed after an interruption. Task 1 was already committed (0c78fda). Task 2 had uncommitted changes present in the worktree at resume time; they were reviewed, verified correct, and committed as the first action.

---

## Tasks Completed

| Task | Name | Commit | Result |
|------|------|--------|--------|
| 1 | P1 hot-path logging | 0c78fda | `logger` replaces `console.*` in 3 hot-path files |
| 2 | P2 listener churn + P5 hook memoization | 0fe0f69 | Single-subscription MIDI listener; 7 useCallback wrappers |
| 3 | P3 abcjs bundle split | c4b9f13 | abcjs in own chunk; main 804→347 kB |
| 4 | P6 deferred stop + C1 dead scheduledNotes | 28c3655 | setTimeout-deferred stop; dead field removed |
| 5 | C2/C3/C4/C5/C6/C9/C10 + P4 | 6adbb28 | Cleanup batch; timingScores, no-any, hi-hat 'h', cheap writes |
| 6 | C7 latency migration + C8 codec alignment | 0688a42 | kebab-case key; positional measure alignment |

---

## Implementation Details

### P1 — MIDI hot-path logging (Task 1)
Replaced all `console.*` calls in `useMIDITimingAccuracy.ts`, `PerformanceTracker.ts`, and `MIDIAccess.ts` with `logger.log/warn/error`. Hot-path code now incurs zero console overhead outside debug mode.

### P2 — Single-subscription MIDI listener (Task 2)
In `useMIDITracking.ts`, the `'midi-note-hit'` listener effect now has deps `[trackingEnabled, isPlaying]` only. `currentPosition`, `groove.tempo`, and `groove` are kept in refs updated on every render; the handler reads from refs, not stale closure values. 4 regression tests added.

### P3 — abcjs manualChunks split (Task 3)
Added `'abcjs': ['abcjs']` to `vite.config.ts` `manualChunks`. Main chunk reduced from ~804 kB to 347 kB. abcjs lands in its own 505 kB chunk (gzip: 151 kB). No `>810 kB` warning.

**Dynamic-import deferral rationale:** `renderABC` is synchronous and consumed at 4 call sites (`ExportUtils`, `SheetMusicDisplay`, `PrintPreviewModal`, and `core/index.ts`). Converting to async would require async plumbing across >5 files — the balloon scenario the issue warns about. `manualChunks` achieves the bundle goal (own chunk + smaller main) with zero source churn.

### P4 — Cheap storage writes (Task 5)
`safeSetItem` now gates the `getStorageUsage()` pre-write scan behind `logger.isDebugMode()`. Normal writes are O(1) (just `localStorage.setItem`). The expensive loop only runs when debug mode is active. `QuotaExceededError` handling is byte-for-byte identical.

### P5 — Hook memoization (Task 2)
`play`, `stop`, `togglePlayback`, `updateGroove`, `setSyncMode`, `getSyncMode`, `playPreview` in `useGrooveEngine.ts` are wrapped in `useCallback` with empty deps. `isPlaying` is read from an `isPlayingRef` to avoid dep instability.

### P6 — Deferred non-loop stop (Task 4)
When the schedule loop reaches `absolutePosition === totalPositions - 1` and `!this.loopEnabled`, a `window.setTimeout(() => this.stop(), delayMs)` is scheduled for `grooveEndTime - currentTime` ms. The ID is stored in `endStopTimerID` and cleared in `stop()` and `play()` to prevent duplicate fires.

### C1 — Dead scheduledNotes removed (Task 4)
`private scheduledNotes: number[] = []` and its `forEach/clearTimeout` loop in `stop()` were removed. The field was never populated.

### C2 — Metronome setter deduplication (Task 5)
`setMetronomeFrequency/Solo/CountIn/OffsetClick/Volume` are thin wrappers delegating to the central `setMetronomeConfig` useCallback. Engine method calls and React state updates happen exactly once.

### C3 — ShareModal clipboard helper (Task 5)
Extracted `copyToClipboard(text, kind)` helper. `handleCopyURL`, `handleCopyEmbed`, `handleCopyShortURL` delegate to it. Per-kind analytics calls (`trackShareMethod`) remain at the call sites.

### C4 — timingErrors → timingScores rename (Task 5)
`PerformanceStats.timingErrors` renamed to `timingScores` (stores accuracy scores 0-100, not ms errors). Interface, initializers, push site, MAX trim, getStats clone, and 3 test references all updated.

### C5 — GroovePattern no-any (Task 5)
Removed `[key: string]: any` index signature from `GroovePattern` interface.

### C6 — import.meta.env.DEV (Task 5)
Three `process.env.NODE_ENV === 'development'` checks in `MIDIHandler.ts` replaced with `import.meta.env.DEV`.

### C7 — Latency config key migration (Task 6)
`LATENCY_CONFIG_KEY` renamed from `'groovy_midi_latency_config'` to `'groovy-midi-latency-config'`. `migrateLatencyConfigKey()` called from `loadLatencyConfig` and `getAllLatencyConfigs`: reads old key, writes to new key, removes old key. No-op if new key present or old key absent.

### C8 — Codec measure alignment (Task 6)
Two `.split(MEASURE_SEP).filter(p => p.length > 0)` calls in `GrooveURLCodec.ts` (voice pattern decode and sticking decode) replaced with trim-leading/trailing-sep then split without filtering. Empty middle measures preserve positional index. Backward-compatible: existing full-width encoders never produce empty segments.

### C9 — Hi-hat key rebind (Task 5)
`DEFAULT_KEYBOARD_MIDI_CONFIG` changed `' '` (Space) → `'h'` (H key) for hi-hat. File header, hint strings in `MIDIAccess.ts` and `useMIDIInput.ts` updated to "H=Hi-hat (Space=play/pause)".

### C10 — CLAUDE.md dompurify claim (Task 5)
Fixed stale claim "dompurify - HTML sanitization for ShareModal and display" → "dompurify - HTML sanitization in ExportUtils".

---

## Test Results

| Metric | Value |
|--------|-------|
| Tests before | 199 |
| Tests after | 215 |
| New tests added | 16 |
| Test files added | 1 (latencyStorage.test.ts) |
| Test files extended | 4 (useMIDITracking.test.ts, GrooveEngine.test.ts, GrooveURLCodec.test.ts, PerformanceTracker.test.ts) |

New test coverage:
- P2: 4 tests (no churn on position/tempo change; current values dispatched)
- P6: 3 tests (deferred stop fires; fires no earlier than groove end; scheduledNotes gone)
- C7: 7 tests (new key, migration, double-migration protection, getAllLatencyConfigs, save, clear)
- C8: 2 tests (empty-middle-measure alignment; backward-compat existing URLs)

---

## Bundle Size

| Chunk | Before | After |
|-------|--------|-------|
| main (index) | ~804 kB | 347 kB |
| abcjs | (inside main) | 505 kB (own chunk) |
| No >810 kB warning | | ✓ |

---

## Deviations from Plan

### Auto-fix issues

**1. [Rule 2 - Missing] Added logger import to useGrooveEngine.ts**
- Found during: Task 5
- Issue: C2 refactor moved from direct `engine.*` calls but the existing `console.warn` calls in storage helpers were still raw console
- Fix: Added `import { logger }` and replaced all `console.warn` in useGrooveEngine.ts with `logger.warn`
- Files modified: src/hooks/useGrooveEngine.ts
- Commit: 6adbb28

**2. [Rule 2 - Missing] Added logger import and calls to KeyboardMIDISimulator.ts**
- Found during: Task 5 (C9 work)
- Issue: KeyboardMIDISimulator had raw `console.log` calls with emoji (out of convention)
- Fix: Added `import { logger }` and replaced all console calls
- Files modified: src/midi/KeyboardMIDISimulator.ts
- Commit: 6adbb28

**3. [Rule 1 - Bug] latencyStorage.test.ts required in-memory localStorage mock**
- Found during: Task 6
- Issue: setup.ts stubs `global.localStorage` as a no-op mock; tests calling `localStorage.setItem` appeared to succeed but `getItem` always returned null
- Fix: Added `beforeEach` block replacing `global.localStorage` with a functional in-memory mock (same pattern as midiStorage.test.ts)
- Files modified: src/utils/latencyStorage.test.ts
- Commit: 0688a42

---

## Known Stubs

None.

---

## Self-Check: PASSED

All 13 key files verified present. All 6 commits verified in git log. Full test suite: 215/215 green. Build clean, no oversize warnings.
