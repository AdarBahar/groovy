---
phase: quick-261103-os8
plan: 01
status: complete
requirements: [GH-155]
---

# Quick 261103-os8: Stop label and MIDI availability status (#155)

Renamed the transport Pause affordance to Stop (Square icon). Added `MIDIAvailability` tracking in `MIDIAccess`, exposed it through `useMIDIInput`, and showed a `role="status"` message in `MIDISettingsModal`. Item 3 (EmbedPage focus-visible labels) is also done.

## Commits
- 790734c: fix(261103-os8): rename the Pause transport button to Stop (Task 1, includes item 3)
- Task 2 commit: fix(261103-os8): show the reason when MIDI is not available

## Verification
- npm run lint: 0 problems
- npx tsc -b: clean
- npx vitest run: 322 passed (28 files), baseline 306
- npm run build: succeeded
- No change in src/core; no change in handleMIDIMessage or the bindInput handler

## Deviations from Plan
- EmbedPage has no render test. The item 3 test (src/pages/EmbedPage.test.ts) reads the source file and checks the classes and the Stop label. It does not render the component.
- Also added `group-focus-visible:hidden` to the ExternalLink icon in the Edit Groove link, so the icon swaps with the label on focus as on hover.
- MIDIAccess 'pending' state is not tested in MIDIAccess.test.ts (singleton keeps state, per plan); it is covered in the hook test.
- MIDISettingsModal tests use `textContent` checks because jest-dom matchers are not installed.
