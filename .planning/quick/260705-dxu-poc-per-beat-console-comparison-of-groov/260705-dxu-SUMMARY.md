---
phase: quick-260705-dxu
plan: 01
subsystem: midi
tags: [midi, performance-tracking, poc, console-logging, timing]

requires:
  - phase: MIDI Performance Tracking (Spec #264)
    provides: PerformanceTracker lifecycle (enable/disable/setTempo/updateGroove/analyzeHit), signed timingErrorMs, useMIDITracking hook wiring
provides:
  - "src/midi/BeatComparator.ts — React-free class + beatComparator singleton emitting one console line per quarter-note beat"
  - "Wiring in useMIDITracking.ts: beatComparator mirrors performanceTracker's enable/disable/setTempo/updateGroove/recordHit lifecycle"
affects: [midi-tracking, future-note-by-note-accuracy-phases]

tech-stack:
  added: []
  patterns:
    - "React-free singleton class mirroring an existing tracker's lifecycle (enable/disable/setTempo/updateGroove) for a parallel, independent concern"
    - "Bucket-then-flush pattern: O(1) recordHit accumulates into per-beat Map buckets; a ~100ms setInterval flushes fully-elapsed beats (with tempo-aware grace window) so silent beats still emit"

key-files:
  created:
    - src/midi/BeatComparator.ts
    - src/midi/BeatComparator.test.ts
  modified:
    - src/hooks/useMIDITracking.ts

key-decisions:
  - "recordHit takes a pre-computed signed timingErrorMs (from PerformanceTracker.analyzeHit) rather than recomputing timing math itself — avoids duplicating the swing-aware quantization grid, keeps the two trackers' timing conventions identical by construction."
  - "Flush uses performance.now() (same clock as startTime, shared with PerformanceTracker) rather than Date.now(), and uses global setInterval/clearInterval so vi.useFakeTimers() patches it correctly in tests."
  - "Absolute 1-based beat numbering from playback start, no per-measure wrap — matches the plan's exact target console format."

patterns-established:
  - "Pattern: POC/debug-only console instrumentation lives in its own React-free module in src/midi/, wired into the hook layer only, gated behind logger.log (debug mode)."

requirements-completed: [POC-BEATCOMPARE-01]

duration: 11min
completed: 2026-07-05
---

# Quick Task 260705-dxu: Per-Beat Console Comparison of Groove vs MIDI Summary

**New `BeatComparator` class emits one `[BeatCompare]` console line per quarter-note beat, comparing the loaded groove pattern against what the drummer actually hit via MIDI, with a tempo-aware on-time/late/early verdict.**

## Performance

- **Duration:** 11 min
- **Started:** 2026-07-05T10:23:48+03:00 (worktree base reset)
- **Completed:** 2026-07-05T10:34:50+03:00
- **Tasks:** 2
- **Files modified:** 3 (2 created, 1 modified)

## Accomplishments
- `BeatComparator` (React-free, strict TS) mirrors `PerformanceTracker`'s enable/disable/setTempo/updateGroove lifecycle and timing conventions (`beatDurMs`, `stepsPerBeat = division/4`, `stepDurMs`) exactly, so the two trackers never disagree on beat/step math.
- O(1) `recordHit(voice, timestamp, timingErrorMs)` buckets hits by absolute beat index (dedup per voice, accumulate signed error sum/count) — safe inside the <1ms MIDI event handler budget.
- A ~100ms flush interval emits every beat that has fully ended (plus a tempo-aware grace window reusing the existing `acceptWindow` formula), guaranteeing silent beats still log (`midi: —`) instead of being skipped.
- Wired into `useMIDITracking.ts` alongside the existing `performanceTracker` calls at every lifecycle site (enable/disable/setTempo/updateGroove) using the same shared `startTime` clock anchor, and `recordHit` is called for every analyzed hit (including wrong/extra voices) inside the existing `if (analysis)` block.

## Task Commits

Each task was committed atomically (TDD gate sequence present: `test` → `feat`):

1. **Task 1: Create BeatComparator module + tests** — `18bb705` (test, RED) → `fc41465` (feat, GREEN)
2. **Task 2: Wire BeatComparator into useMIDITracking** — `44f487d` (feat)

**Plan metadata:** committed separately by the orchestrator.

## Files Created/Modified
- `src/midi/BeatComparator.ts` - React-free `BeatComparator` class + `beatComparator` singleton; per-beat bucket/flush logic and `[BeatCompare]` console line formatting.
- `src/midi/BeatComparator.test.ts` - 7 Vitest cases (fake timers) covering format, expected/played match, silent beats, extra/wrong voice, late/early verdicts, next-downbeat bucketing, and `disable()` cleanup.
- `src/hooks/useMIDITracking.ts` - Added `beatComparator` calls alongside every existing `performanceTracker` lifecycle call site, plus `recordHit` in `handleMIDIHit`.

## Decisions Made
- Confirmed via Vitest docs lookup that `vi.useFakeTimers()` fakes "everything globally available except `nextTick` and `queueMicrotask`" (including `performance.now()`), so tests can drive both the flush `setInterval` and the `performance.now()`-based elapsed-time math with a single `vi.advanceTimersByTime()` call — no separate `performance.now()` mock needed.
- Reused the existing `DRUM_VOICE_CONFIG` / `ALL_DRUM_VOICES` from `src/core/DrumVoiceConfig.ts` (per the plan's interfaces section) for deterministic, human-readable voice names and iteration order, rather than duplicating a name map.

## Deviations from Plan

None - plan executed exactly as written. One incidental TS strictness fix was needed and applied inline during the GREEN commit:

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed implicit-any on `mock.calls.map` callback parameter in the test file**
- **Found during:** Task 1 GREEN verification (`npx tsc -b`)
- **Issue:** `logSpy.mock.calls.map((call) => call[0])` left `call` implicitly typed `any` under `strict`/`noImplicitAny`, failing `tsc -b` (5 occurrences).
- **Fix:** Annotated the callback parameter as `(call: unknown[])` in all 5 occurrences.
- **Files modified:** `src/midi/BeatComparator.test.ts`
- **Verification:** `npx tsc -b` clean; `npx vitest run src/midi/BeatComparator.test.ts` still 7/7 passing.
- **Committed in:** `fc41465` (Task 1 GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 blocking, TS strictness only — no behavior change)
**Impact on plan:** No scope creep; test-only type annotation required to satisfy the plan's own `npx tsc -b` clean acceptance criterion.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required. This is developer-only console instrumentation gated behind `logger.log` (debug mode, off by default).

## Next Phase Readiness
- The POC is fully wired: enabling debug mode + MIDI tracking + playback will emit one `[BeatCompare]` line per beat in the browser console.
- Manual verification step from the plan (`enable debug mode, connect MIDI or keyboard sim on localhost, play a groove`) was not run in this session (requires a live browser/MIDI environment); all automated verification (`npx vitest run src/midi/BeatComparator.test.ts`, `npx tsc -b`, `npx vitest run src/midi`, full suite `npx vitest run`) passed (252/252 tests, clean build).
- No blockers. Future phases (note-by-note accuracy tracking, real-time mistake detection) can build on this same bucket/flush pattern if richer UI is desired later.

---
*Phase: quick-260705-dxu*
*Completed: 2026-07-05*

## Self-Check: PASSED

- FOUND: src/midi/BeatComparator.ts
- FOUND: src/midi/BeatComparator.test.ts
- FOUND: src/hooks/useMIDITracking.ts
- FOUND: .planning/quick/260705-dxu-poc-per-beat-console-comparison-of-groov/260705-dxu-SUMMARY.md
- FOUND: 18bb705 (test commit, RED)
- FOUND: fc41465 (feat commit, GREEN)
- FOUND: 44f487d (feat commit, Task 2 wiring)
