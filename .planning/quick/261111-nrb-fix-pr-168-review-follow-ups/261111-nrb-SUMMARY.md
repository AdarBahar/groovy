# Quick Task 261111-nrb: Fix PR 168 review follow-ups

Ten review items from PR #168 are fixed. The embed slider tokens, metronome menu semantics, control sizes, and a useHistory regression test are in place.

## Commits

- af11510: embed slider tokens, error title font, CSS comments, focus ring, indicator label
- 7dcf7c5: metronome menu (aria-pressed, Escape, tokens) and header control height
- 0b2d2d0: measure and Clear control height, useHistory replace() test

## Changes

- The second `.embed` block sets `--primary`, `--primary-foreground`, `--muted`, `--background`, and `--ring` to light values.
- The ErrorBoundary title uses `font-sans`.
- Comments in NoteIcon.css and SheetMusicDisplay.css name the real colors.
- The form-field focus rule uses `var(--ring)`.
- The "MIDI Tracking disabled" label uses `text-ink-3`.
- The frequency buttons have `aria-pressed` and a bold underline for the selected state.
- Escape closes the metronome menu and returns focus to the trigger. It does nothing if an open dialog exists or the event has `defaultPrevented`.
- The trigger button has `aria-expanded`.
- MetronomeOptionsMenu.tsx uses `var(--ui-surface-4)` and `var(--ui-surface-2)`, not hex colors.
- Header, measure, and Clear controls are 40px tall (`h-10` / `size-10`).

## Tests

- New: MetronomeOptionsMenu.test.tsx (5 tests), useHistory.test.ts (3 tests). The menu tests failed before the fix (5 of 5) and pass now. The useHistory tests passed at once, as the plan expected.
- `npx tsc -b`: pass.
- `npx vitest run`: 35 files passed, 344 tests passed, 0 failed.
- `npm run lint`: pass, no output errors.
- `npm run build`: pass.

## Deviations from Plan

None. The plan ran as written. The embed page uses native range inputs in TempoControl.tsx and the shared slider; the listed tokens covered both, so no extra tokens were added. The header has a 56px height, so the 40px controls fit.

## Self-Check: PASSED

Files and commits above exist.
