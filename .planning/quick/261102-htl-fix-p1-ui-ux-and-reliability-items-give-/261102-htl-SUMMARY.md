---
phase: quick-261102-htl
plan: 01
subsystem: midi, ui
tags: [midi, lifecycle, accessibility, a11y, transport]

# Dependency graph
requires: []
provides:
  - "MIDIAccessManager.dispose() and idempotent initialize() (no listener accumulation)"
  - "State-reflecting accessible names on every transport button"
affects: [midi, production-page, embed-page]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Singleton managers that attach browser handlers expose dispose(); React hooks call it from the mount effect cleanup"
    - "Icon-only buttons derive aria-label/title from the same conditions that pick the icon"

key-files:
  created:
    - src/components/production/PlaybackControls.test.tsx
  modified:
    - src/midi/MIDIAccess.ts
    - src/midi/MIDIAccess.test.ts
    - src/hooks/useMIDIInput.ts
    - src/hooks/useMIDIInput.test.tsx
    - src/components/production/PlaybackControls.tsx
    - src/pages/EmbedPage.tsx

key-decisions:
  - "initialize() tears down before re-acquiring access, so the hook does not need to guard against StrictMode double-invocation"
  - "disconnect() semantics unchanged for device switching; dispose() is the full teardown"
  - "Labels say Pause (matching the icon) even though the transport resets the clock; changing the icon/semantics is a separate UX decision"
  - "Embed page expander and edit link also labelled: their visible text is display:none until hover, so they had no accessible name either"

patterns-established:
  - "Component tests find transport controls by role + name instead of DOM structure"

requirements-completed: [REL-P1-MIDI-TEARDOWN, UX-P1-TRANSPORT-A11Y]

# Metrics
duration: 30min
completed: 2026-11-02
---

# Quick Task 261102-htl: Fix P1 UI/UX and Reliability Items Summary

**MIDI access now has a real teardown (no handler survives unmount or re-init) and every transport button announces its state to assistive tech.**

## Performance

- **Duration:** 30 min
- **Tasks:** 2
- **Files modified:** 7 (1 created)

## Accomplishments
- `MIDIAccessManager.dispose()` clears `onstatechange`, the bound port's `onmidimessage`, the message handler and the device-list callback; `initialize()` is idempotent; a port-disconnect event clears the port handler before the reference is dropped. `useMIDIInput` unmount now calls `dispose()`.
- Transport buttons in `PlaybackControls` and `EmbedPage` carry `aria-label`/`title` reflecting Play / Pause / Counting in / auto speed-up state. Embed page expander (`aria-expanded`) and edit link labelled too.
- Cleared two pre-existing lint errors in touched files (`as any` in MIDIAccess, unused destructured values in PlaybackControls).

## Task Commits

1. **Task 1: MIDIAccess teardown and stale-handler clearing** - `aecea9d` (fix)
2. **Task 2: Accessible names on transport buttons** - `6b2e3ea` (fix)

## Verification
- `npx vitest run`: 24 files, 260 tests pass (8 new).
- `npx tsc --noEmit`: clean.
- `npx eslint` on touched files: 0 errors (1 pre-existing exhaustive-deps warning).
- `NODE_ENV=production npx vite build`: succeeds.

## Deviations from Plan
- Also labelled the embed page's expander button and edit link (same category, same file, hover-only text).
- Fixed two pre-existing lint errors in touched files so the files lint clean.

## Issues Encountered
- Radix `Slider` is mocked in the new component test; jsdom lacks the layout APIs it needs and it is not under test.

## User Setup Required
None.
