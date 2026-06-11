---
phase: quick-260611-ev2
plan: "01"
subsystem: "midi-tracking, storage, share-ui"
tags: [security, reliability, timing, fix]
dependency_graph:
  requires: []
  provides:
    - escapeXml in embed snippet (XSS fix)
    - lazy DrumSynth initialization
    - beat-boundary quantization correctness
    - audio-start clock anchor for MIDI tracking
    - real quota cleanup in GrooveStorage
  affects:
    - src/components/production/ShareModal.tsx
    - src/hooks/useMIDIInput.ts
    - src/midi/PerformanceTracker.ts
    - src/core/GrooveEngine.ts
    - src/hooks/useMIDITracking.ts
    - src/core/GrooveStorage.ts
tech_stack:
  added: []
  patterns:
    - lazy-ref pattern for expensive React hook dependencies
    - beat-wrap candidate in quantization grid
    - performance.now() anchor propagation from engine to tracker
    - array-level quota cleanup with oldest-first trimming
key_files:
  created:
    - src/core/GrooveEngine.test.ts
    - src/core/GrooveStorage.test.ts
  modified:
    - src/components/production/ShareModal.tsx
    - src/components/production/ShareModal.test.tsx
    - src/core/index.ts
    - src/hooks/useMIDIInput.ts
    - src/hooks/useMIDIInput.test.tsx
    - src/midi/PerformanceTracker.ts
    - src/midi/PerformanceTracker.test.ts
    - src/core/GrooveEngine.ts
    - src/hooks/useMIDITracking.ts
    - src/hooks/useMIDITracking.test.ts
    - src/core/GrooveStorage.ts
decisions:
  - "Used EngineAnchor interface in useMIDITracking to avoid importing GrooveEngine (prevents circular imports and keeps hook testable)"
  - "Lazy-ref pattern for DrumSynth: initialize to provided synth or null, construct fallback only once in body guard rather than in useRef initializer"
  - "Beat-boundary fix: add beatDurMs as candidate after the loop rather than extending beatOffsets, keeps the grid structure clean"
metrics:
  duration: "~8 minutes"
  completed: "2026-06-11"
  tasks_completed: 5
  tasks_total: 5
  files_modified: 11
  files_created: 2
  tests_before: 155
  tests_after: 175
---

# Phase quick-260611-ev2 Plan 01: Fix Top Code Review Findings (#114-#118) Summary

Five focused correctness, security, and reliability fixes closing GitHub issues #114-#118.
XSS in embed snippet, duplicate DrumSynth construction, beat-boundary quantization error,
stale clock anchor for MIDI tracking, and no-op quota cleanup in GrooveStorage.

## Tasks Completed

| Task | Issue | Commit | Description |
|------|-------|--------|-------------|
| 1 | #114 | 63bf8a6 | Escape groove title in embed snippet with escapeXml() |
| 2 | #115 | f5e1d14 | Eliminate duplicate DrumSynth construction in useMIDIInput |
| 3 | #116 | e73a687 | Beat-boundary quantization fix in PerformanceTracker |
| 4 | #117 | 1f480e0 | Audio-start clock anchor for MIDI tracking |
| 5 | #118 | e5899b5 | Real quota cleanup (array trim) in GrooveStorage |

## Fix Details

### Task 1: Escape groove title in embed snippet (#114)

**Files:** `src/components/production/ShareModal.tsx`, `src/core/index.ts`, `src/components/production/ShareModal.test.tsx`

Wrapped the embed iframe `title` attribute with `escapeXml(grooveTitle)`. A groove titled `"><script>alert(1)</script>` now produces `&quot;&gt;&lt;script&gt;...` in the snippet, preventing attribute breakout and XSS. Also exported `escapeXml` from the `src/core` barrel.

### Task 2: Eliminate duplicate DrumSynth (#115)

**Files:** `src/hooks/useMIDIInput.ts`, `src/hooks/useMIDIInput.test.tsx`

Replaced the eager `useRef<DrumSynth>(synth || new DrumSynth())` with a lazy initialization guard: `synthRef` starts as `synth ?? null`; if null on first render, a single `new DrumSynth()` is constructed in-body. Added a `useEffect` that adopts a late-provided synth (`if (synth && synthRef.current !== synth) synthRef.current = synth`). Tests mock DrumSynth with a class-based mock to count instantiations.

### Task 3: Beat-boundary quantization (#116)

**Files:** `src/midi/PerformanceTracker.ts`, `src/midi/PerformanceTracker.test.ts`

In `calculateTimingError`, after the loop over `beatOffsets`, added `beatDurMs` (the next downbeat) as an additional candidate. A hit at `posInBeat=490` with `beatDurMs=500` now correctly reports `errorMs=-10` (10ms before the downbeat) instead of a large positive late error. Also fixed the pre-existing flaky "quantizes to grid with no swing" test which was failing due to this bug.

### Task 4: Audio-start clock anchor (#117)

**Files:** `src/core/GrooveEngine.ts`, `src/core/GrooveEngine.test.ts`, `src/hooks/useMIDITracking.ts`, `src/hooks/useMIDITracking.test.ts`

Added `playStartPerformanceTime: number | null` to `GrooveEngine`, captured via `performance.now()` adjacent to `startTime` capture in `play()`, cleared to `null` in `stop()`. New `getPlayStartPerformanceTime()` getter. `useMIDITracking` gains an optional `engine?: EngineAnchor` parameter; uses `engine.getPlayStartPerformanceTime()` when non-null, falls back to `performance.now()`. Core has no React imports.

### Task 5: Real quota cleanup (#118)

**Files:** `src/core/GrooveStorage.ts`, `src/core/GrooveStorage.test.ts`

Replaced `safeStorage.cleanup('groove-')` (no-op: all grooves live in one key) with in-memory array trimming. On quota exceeded: sort by `modifiedAt` ascending, drop `floor(len * 0.25)` oldest entries (never the currently-saved groove), retry `setItem` with trimmed array. Return friendly error if retry still fails.

## Test Results

- Baseline: 155/155 tests
- Final: 175/175 tests (+20 new tests)
- Build: clean (`npm run build` — TypeScript compiles, no errors)

## Deviations from Plan

None — plan executed exactly as written.

The pre-existing flaky test ("quantizes to grid with no swing" in PerformanceTracker.test.ts) was intermittently failing before Task 3 due to singleton state leak across test files. The beat-boundary fix in Task 3 resolved the underlying calculation issue, making that test reliably pass.

## Known Stubs

None.

## Threat Flags

No new security-relevant surface introduced. Task 1 closes an existing XSS vector (T-ev2-01 in the plan's threat register).

## Self-Check: PASSED

- `src/components/production/ShareModal.tsx` — FOUND
- `src/core/GrooveEngine.test.ts` — FOUND
- `src/core/GrooveStorage.test.ts` — FOUND
- Commit 63bf8a6 (fix #114) — FOUND
- Commit f5e1d14 (fix #115) — FOUND
- Commit e73a687 (fix #116) — FOUND
- Commit 1f480e0 (fix #117) — FOUND
- Commit e5899b5 (fix #118) — FOUND
- Full suite 175/175 — PASSED
- Build clean — PASSED
