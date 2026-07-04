---
phase: quick-260704-t3f
plan: 01
subsystem: midi
tags: [bpm-estimation, ewma, performance-tracking, display]

# Dependency graph
requires: []
provides:
  - "getPerformedBpm() display-level snap-and-round fix removing 120.5-121.5 residual"
affects: [midi, performance-tracking]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Display-level bias correction: snap-within-tolerance-then-round, applied at the read boundary rather than the underlying estimator, to avoid destabilizing an already-tuned EWMA"

key-files:
  created: []
  modified:
    - src/midi/BPMEstimator.ts
    - src/midi/PerformanceTracker.test.ts

key-decisions:
  - "Fixed the residual upward BPM display bias at the display boundary (getPerformedBpm) rather than the EWMA estimation math itself, per plan direction — a period-averaging alternative was previously tested and rejected for over-correcting dense playing"
  - "±1 BPM snap-to-set-tempo threshold chosen to absorb Jensen's-inequality-driven upward bias without masking genuine tempo drift"

patterns-established:
  - "Snap-then-round display transform: within tolerance snap to reference value, otherwise round to display precision"

requirements-completed: [BPM-DISPLAY-SNAP]

# Metrics
duration: 15min
completed: 2026-07-04
---

# Quick Task 260704-t3f: Round Performed BPM Display Summary

**getPerformedBpm() snaps estimates within ±1 BPM of set tempo to the exact tempo and rounds everything else to an integer, eliminating the 120.5-121.5 decimal residual drummers saw when playing exactly on time**

## Performance

- **Duration:** 15 min
- **Started:** 2026-07-04T17:47:00Z
- **Completed:** 2026-07-04T18:01:43Z
- **Tasks:** 1
- **Files modified:** 2

## Accomplishments
- `getPerformedBpm(tempo)` now returns `tempo` exactly when `|estimate - tempo| <= 1` (snap)
- All other in-range estimates are rounded to the nearest integer via `Math.round(estimate)` (no more `.5` decimals)
- Existing null and >20%-deviation gate behavior preserved unchanged, including the #122 anti-oscillation invariant (internal `bpmEstimate` never zeroed)
- Added 4 direct `BPMEstimator` unit tests covering snap, round, null-seed, and deviation-gate cases

## Task Commits

Each task was committed atomically:

1. **Task 1: Snap-and-round getPerformedBpm at display level** - `d75104f` (fix)

**Plan metadata:** (docs commit handled by orchestrator)

## Files Created/Modified
- `src/midi/BPMEstimator.ts` - `getPerformedBpm()` now snaps within ±1 BPM of set tempo to the exact tempo, otherwise rounds to nearest integer; docstring updated to explain Jensen's-inequality-driven bias and the rejected period-averaging alternative
- `src/midi/PerformanceTracker.test.ts` - Added `describe('getPerformedBpm display snap + integer rounding', ...)` with 4 new tests using direct `BPMEstimator` construction; existing describe blocks untouched

## Decisions Made
- Fixed the bias at the display level (`getPerformedBpm`) rather than the EWMA estimation math, per plan direction. The estimation math is intentionally left as-is; a period-averaging alternative was tested previously and rejected for over-correcting dense playing.
- ±1 BPM snap tolerance treats sub-±1 residual as noise while still surfacing genuine tempo drift beyond that threshold.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Fix is isolated to `BPMEstimator.getPerformedBpm()`; no other consumers require changes (`PerformanceTracker.getPerformedBpm()` passes through unchanged).
- No blockers for related MIDI/BPM work.

## Self-Check: PASSED
- FOUND: src/midi/BPMEstimator.ts
- FOUND: src/midi/PerformanceTracker.test.ts
- FOUND: d75104f (git log)

---
*Phase: quick-260704-t3f*
*Completed: 2026-07-04*
