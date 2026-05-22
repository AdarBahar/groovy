---
phase: 02-sticking-notation
plan: "01"
subsystem: sticking-editor
tags: [types, component, interaction, sticking, editor]
dependency_graph:
  requires: []
  provides: [StickingValue-type, StickingRow-component, sticking-toggle]
  affects: [types.ts, DrumGridDark.tsx, PlaybackControls.tsx, ProductionPage.tsx]
tech_stack:
  added: []
  patterns: [click-to-cycle, keyboard-shortcuts, aria-labels, functional-update-guard]
key_files:
  created:
    - src/components/production/StickingRow.tsx
  modified:
    - src/types.ts
    - src/components/production/PlaybackControls.tsx
    - src/components/production/DrumGridDark.tsx
    - src/pages/ProductionPage.tsx
decisions:
  - "Render StickingRow inside DrumGridDark (per measure card) to achieve exact column alignment"
  - "Pass sticking props through DrumGridDark rather than lifting StickingRow to ProductionPage"
  - "Use useHistory setState (full object) not functional updater since useHistory lacks functional update"
  - "Validate sticking array length before state update to enforce T-02-03"
metrics:
  duration_seconds: 343
  completed_date: "2026-05-22"
  tasks_completed: 3
  tasks_total: 3
  files_created: 1
  files_modified: 4
---

# Phase 02 Plan 01: Sticking Data Model and Row Editor Summary

**One-liner:** StickingValue type with click-to-cycle and keyboard shortcuts editor row rendered per-measure inside the drum grid.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Extend types.ts with StickingValue and Measure interface | 526f132 | src/types.ts |
| 2 | Create StickingRow component with full interaction logic | 7b62a75 | src/components/production/StickingRow.tsx |
| 3 | Add Sticking button to PlaybackControls and wire state | 9f6bd7d | PlaybackControls.tsx, DrumGridDark.tsx, ProductionPage.tsx |

## Files Modified

| File | Change | Lines Added |
|------|--------|-------------|
| src/types.ts | StickingValue type, MeasureConfig.sticking field, createEmptySticking helper, StickingValueSchema | +34 |
| src/components/production/StickingRow.tsx | New component (full) | +153 |
| src/components/production/PlaybackControls.tsx | isStickingSetupActive/onStickingSetupToggle props + Hand icon button | +28 |
| src/components/production/DrumGridDark.tsx | isStickingSetupActive/onStickingChange props + StickingRow render | +30 |
| src/pages/ProductionPage.tsx | State, handler, prop wiring; removed skeleton button | +25 net |

## Type Definitions Added

- `StickingValue = 'L' | 'R' | 'L/R' | null` — exported from `src/types.ts`
- `MeasureConfig.sticking?: StickingValue[]` — optional field with invariant comment
- `StickingValueSchema` — Zod schema for runtime validation in persistence layer
- `createEmptySticking(subdivisionCount: number): StickingValue[]` — helper to initialize arrays

## Component Exported

- **Default export:** `StickingRow` — functional component with click-to-cycle and keyboard shortcuts
- **Named export:** `StickingRowProps` — interface for consumers

## Interaction Coverage

- Click-to-cycle: Empty → R → L → L/R → Empty (D-03)
- Keyboard shortcuts when focused (D-04):
  - `R` / `r` → sets R
  - `L` / `l` → sets L
  - `/` / `B` / `b` → sets L/R
  - `Backspace` / `Delete` → clears (null)
  - `Space` / `Enter` → cycles to next value
- ARIA: `role="group"` on row; each cell has `aria-label` with beat position and value
- Invalid sticking values rejected before setState (T-02-01 mitigated)
- Sticking array length validated before update (T-02-03 mitigated)

## Test Coverage

No new tests added in this plan. Component interaction logic is covered by:
- TypeScript strict mode (type-level guarantees for StickingValue union)
- The VALID_STICKING_VALUES set check in StickingRow before dispatch

## Known Limitations / Future Work

- Sticking is not yet persisted to localStorage or URL encoding (Phase 02 Plan 02+)
- Sticking is not yet rendered in ABCjs notes view (Phase 02 Plan 02+)
- "Apply to Similar Measures" feature is not implemented (future plan)
- Division changes do not yet resize sticking arrays (will need same treatment as notes resize in handleDivisionChange)
- Measure clear action does not yet clear sticking (future plan per D-09)
- Measure duplicate does not yet copy sticking (future plan per D-09)

## Architecture Notes

The StickingRow is rendered **inside** each DrumGridDark measure card between the Beat Labels Row and Drum Rows. This ensures exact column alignment with the grid cells (matching `w-11 sm:w-12 md:w-10` widths). Props flow: `ProductionPage → DrumGridDark → StickingRow`.

Sticking changes call `setGroove` with a full new `GrooveData` object (useHistory does not support functional updaters), so the current groove is captured from the closure. The `handleStickingChange` depends on `[groove, setGroove]` ensuring it re-creates when groove changes.

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written, with one structural decision:

**Architectural choice (within plan scope):** Rendered StickingRow inside DrumGridDark rather than directly in ProductionPage. This was not a deviation from requirements but a necessary implementation decision to achieve column alignment (the plan noted "ensure exact column alignment with grid columns"). This kept the row aligned with the grid's per-cell widths without duplicating layout logic.

## Self-Check

- [x] src/components/production/StickingRow.tsx exists
- [x] src/types.ts contains StickingValue export
- [x] src/components/production/PlaybackControls.tsx contains isStickingSetupActive
- [x] Commits 526f132, 7b62a75, 9f6bd7d exist
- [x] npm run type-check passes (0 errors)
- [x] npm run build succeeds

## Self-Check: PASSED
