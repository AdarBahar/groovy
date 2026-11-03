---
status: complete
plan: 261103-o2j
issue: 24
commits: [56243b7, ab6db71]
---

# Quick 261103-o2j: AudioContext lifecycle (issue #24)

DrumSynth now creates the real AudioContext at the first resume(). The constructor decodes samples with an OfflineAudioContext. GrooveEngine closes the synth it owns. useMIDIInput creates its fallback synth at the first note and disposes it.

## Commits
- 56243b7: DrumSynth lazy context, dispose(), 11 new tests (src/core/DrumSynth.test.ts)
- ab6db71: GrooveEngine ownsSynth, useMIDIInput lazy owned fallback, tests

## Gate results
- npm run lint: 0 problems
- npx tsc -b: clean
- npx vitest run: 26 files, 305 tests pass (baseline 276)
- npm run build: success
- Grep for `new AudioContext` / `new DrumSynth` outside tests: DrumSynth.ts createRealContext, GrooveEngine constructor, useMIDIInput note handler only.

## Deviations
- None from the plan logic. The branch was `worktree-agent-a4a46d3541e544691`, not `fix/24-audiocontext-lifecycle`, as the orchestrator set up.
- Test details: stub `resume` mocks in useMIDIInput.test.tsx now return a resolved promise (the handler calls `.catch`). Fallback tests use note 38 for the second note, because the double-trigger filter drops a repeat of note 36.
- Scheduling math in playDrum, play() and playPreview is unchanged.
