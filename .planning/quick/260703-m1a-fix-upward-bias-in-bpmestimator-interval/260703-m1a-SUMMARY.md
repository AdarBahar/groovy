---
phase: quick-260703-m1a
plan: 01
subsystem: midi
tags: [bpm-estimation, timing-accuracy, performance-tracker, ewma, regression-test]

# Dependency graph
requires: []
provides:
  - Unbiased performed-BPM estimation in BPMEstimator (interval-rounded stepDelta)
  - Sub-beat (8th/16th note) BPM sampling without a stale null estimate
  - Regression tests proving constant-grid-offset immunity and dense-playing coverage
affects: [midi-performance-tracking, timing-feedback-ui]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Compute rate estimates from INTERVALS between events (both numerator and
      denominator derived from the same interval), not from differencing
      separately-rounded absolute positions — avoids rounding-boundary bias
      when a constant offset is present."

key-files:
  created: []
  modified:
    - src/midi/BPMEstimator.ts
    - src/midi/PerformanceTracker.ts
    - src/midi/PerformanceTracker.test.ts

key-decisions:
  - "Replaced absolute-step differencing (round(t/step) - round(t_prev/step)) with
    direct interval rounding (round((t - t_prev)/step)) so a constant grid offset
    cancels exactly instead of causing an upward-only bias."
  - "Removed the stepDelta < stepsPerBeat sub-beat censoring branch entirely —
    it was the sole cause of both the upward bias and dense-playing staying null."
  - "Added a 100ms minimum-interval floor (covers flam/simultaneous hits and
    micro-interval noise) that skips WITHOUT advancing the reference timestamp."
  - "Dropped the now-unused startTime parameter from BPMEstimator.update() to
    satisfy strict noUnusedParameters; updated the sole caller in
    PerformanceTracker.analyzeHit()."

requirements-completed: [M1A-BPM-BIAS]

# Metrics
duration: 4min
completed: 2026-07-03
---

# Quick Task 260703-m1a: Fix upward bias in BPMEstimator interval rounding Summary

**Rewrote BPMEstimator.update() to compute stepDelta from the inter-onset interval instead of differenced absolute step indices, eliminating an upward-only BPM bias from constant grid offsets and fixing dense sub-beat playing producing no estimate.**

## Performance

- **Duration:** 4 min (15:57:24 - 16:01:08 local commit timestamps)
- **Started:** 2026-07-03T12:57:24Z
- **Completed:** 2026-07-03T13:01:08Z
- **Tasks:** 2/2 completed
- **Files modified:** 3

## Accomplishments
- Fixed the root-cause upward bias: a drummer playing exactly 120 BPM with a constant grid offset (uncalibrated latency) now reads within 115-125 BPM instead of 123-126 BPM.
- Fixed dense 8th/16th-note playing producing no BPM estimate at all (previously stayed `null` forever because every interval was sub-beat and got censored).
- Preserved flam/near-zero-interval skip behavior and genuinely-fast-drummer detection.
- Added debug-gated logging (`logger.log`) of each accepted BPM sample for diagnosability, without adding loops or heavy allocation to the hot MIDI path.
- Added two new regression tests (constant-offset, dense-8th-note) and updated stale comments in two existing tests to reflect interval-rounding reasoning.

## Task Commits

Each task was committed atomically:

1. **Task 1: Rewrite BPMEstimator.update to use interval rounding and remove censoring bias** - `56df204` (fix)
2. **Task 2: Update BPM estimation tests with bias regression coverage** - `52e75c9` (test)

**Plan metadata:** _(pending final docs commit by orchestrator)_

## Files Created/Modified
- `src/midi/BPMEstimator.ts` - Rewrote `update()`: interval-rounded `stepDelta`, removed `absStep`/`lastAbsStep`, removed sub-beat censoring branch, added 100ms minimum-interval floor, added debug logging, dropped unused `startTime` param, rewrote class docstring explaining the bias and the fix.
- `src/midi/PerformanceTracker.ts` - Updated the sole caller (`analyzeHit`) to the new 3-arg `update(timestamp, tempo, division)` signature.
- `src/midi/PerformanceTracker.test.ts` - Added `groove8` fixture (division 8); added constant-grid-offset regression test and dense-8th-note test; updated stale `absStep`-based comments in the "clearly-fast hitting" and "large deviation" tests to interval-rounding reasoning (assertions unchanged, both were already written leniently).

## Decisions Made
- Kept the minimum-interval floor at 100ms as specified by the plan (covers flam and sub-16th noise at typical tempos); this is a deliberate tradeoff documented in the class docstring, not treated as a bug.
- Left the "clearly-fast hitting" test's title and lenient assertions unchanged per plan instruction; only the explanatory comment was corrected since under interval rounding a constant 400ms spacing consistently rounds to `stepDelta=3` (not the old alternating 3/4), converging toward ~112.5 BPM rather than "above 120" — the test's assertion was already lenient enough not to depend on direction.

## Deviations from Plan

None — plan executed exactly as written for both tasks (interval-rounding rewrite, signature change, docstring, and the exact two new regression tests specified).

### Self-corrected tooling mistake (not a plan deviation)

While verifying Task 2, I ran `npx tsc -b --noEmit false` to double check typechecking, which conflicted with the project's `tsconfig.json` (`noEmit: true` combined with `allowImportingTsExtensions`) and caused `tsc` to emit ~159 stray `.js` build artifacts alongside existing `.ts`/`.tsx` source files across `src/`. This was caught immediately via `git status` before any commit. Every stray file was verified to have a matching `.ts`/`.tsx` sibling and was removed individually with `rm` (never `git clean`, per the destructive-git prohibition). No stray files were committed; `git log` and `git status` confirm only the intended source files are tracked. Root verification thereafter used the plan-specified `npx tsc -b` (no extra flags), which is clean.

**Total deviations:** 0 plan deviations. 1 self-corrected tooling mistake (caught and cleaned up before commit, no impact on repo state).
**Impact on plan:** None — plan scope, files, and behavior match exactly what was specified.

## Issues Encountered
None blocking. See the self-corrected tooling note above.

## User Setup Required
None - no external service configuration required.

## Verification Results
- `npx tsc -b` — clean, no errors.
- `npx vitest run` — 241/241 tests pass across 22 test files (44/44 in `PerformanceTracker.test.ts`, including the 2 new regression tests).
- `grep -n "Math.round((timestamp - this.lastTimestamp)" src/midi/BPMEstimator.ts` — present (line 73).
- `stepDelta < stepsPerBeat` censoring branch — confirmed absent.
- Sole caller `bpmEstimator.update(timestamp, this.tempo, this.division)` — confirmed updated in `PerformanceTracker.ts`.
- Manual code review: `update()` contains no loops or heap-heavy allocations on the hot path (one `Math.round`, one division, one EWMA step, one debug-gated `logger.log` call with a single object literal) — preserves the <1ms/event MIDI handler constraint (CLAUDE.md Performance constraint).

## Next Phase Readiness
- No follow-up work required by this fix; BPM estimation is now correct for both grid-offset and dense-playing scenarios.
- No blockers for future MIDI/performance-tracking work.

---
*Phase: quick-260703-m1a*
*Completed: 2026-07-03*

## Self-Check: PASSED

All modified/created files verified present on disk; both task commits (`56df204`, `52e75c9`) verified present in `git log --oneline --all`.
