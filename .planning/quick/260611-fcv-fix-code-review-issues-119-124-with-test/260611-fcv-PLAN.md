---
phase: quick-260611-fcv
plan: "01"
type: execute
wave: 1
depends_on: []
files_modified:
  - src/core/GrooveEngine.ts
  - src/core/GrooveEngine.test.ts
  - src/midi/MIDIAccess.ts
  - src/midi/MIDIAccess.test.ts
  - src/midi/PerformanceTracker.ts
  - src/midi/PerformanceTracker.test.ts
  - src/hooks/useMIDITracking.ts
  - src/hooks/useMIDITracking.test.ts
  - src/hooks/useAutoSpeedUp.ts
  - src/hooks/useAutoSpeedUp.test.ts
autonomous: true
requirements: ["#119", "#120", "#121", "#122", "#123", "#124"]

must_haves:
  truths:
    - "GrooveEngine.updateGroove never mutates the caller's groove object"
    - "Disconnecting the fake keyboard MIDI device stops keyboard MIDI flow and makes getCurrentDevice() return null"
    - "PerformanceTracker grades hits against the full multi-measure pattern, not just measure 1"
    - "PerformanceTracker stays in sync when the groove is edited mid-playback (updateGroove)"
    - "Performed-BPM estimate is correct when the drummer plays fewer hits than grid steps (e.g. quarters in a 16ths groove)"
    - "PerformanceTracker step grid matches the engine's note timing in non-4/4 (6/8, 3/4)"
    - "useAutoSpeedUp performs side effects outside the setState updater and clears timers on unmount"
    - "Full vitest suite stays green (175+ tests, no regression) after every commit; npm run build clean at the end"
  artifacts:
    - path: "src/core/GrooveEngine.ts"
      provides: "Non-mutating updateGroove (corrected copy)"
      contains: "{ ...groove"
    - path: "src/midi/MIDIAccess.ts"
      provides: "fakeMIDIMessageHandler cleared on disconnect and at bindInput start"
    - path: "src/midi/MIDIAccess.test.ts"
      provides: "Fake-device disconnect / switch tests"
    - path: "src/midi/PerformanceTracker.ts"
      provides: "Flattened multi-measure pattern, updateGroove(), engine-aligned grid, step-index BPM estimation"
      contains: "updateGroove"
    - path: "src/hooks/useMIDITracking.ts"
      provides: "Calls performanceTracker.updateGroove on mid-session groove change"
      contains: "updateGroove"
    - path: "src/hooks/useAutoSpeedUp.ts"
      provides: "Side-effect-free updater + unmount timer cleanup"
      contains: "useEffect"
    - path: "src/hooks/useAutoSpeedUp.test.ts"
      provides: "renderHook + fake-timer tests for tempo stepping, stop conditions, unmount cleanup"
  key_links:
    - from: "src/hooks/useMIDITracking.ts"
      to: "src/midi/PerformanceTracker.ts"
      via: "updateGroove(groove) on groove change while tracking"
      pattern: "performanceTracker\\.updateGroove"
    - from: "src/midi/PerformanceTracker.ts"
      to: "src/types.ts"
      via: "getFlattenedNotes(groove)"
      pattern: "getFlattenedNotes"
---

<objective>
Close six code-review findings (GitHub issues #119–#124), each as its own atomic commit with new tests, leaving the full vitest suite green after every commit and `npm run build` clean at the end.

These are correctness/reliability defects in the core timing and MIDI pipeline:
- #119 caller-state mutation in GrooveEngine.updateGroove
- #120 fake keyboard MIDI handler leak in MIDIAccess
- #121 single-measure grading + mid-session staleness in PerformanceTracker
- #122 wrong performed-BPM estimate (counts hits, not grid steps)
- #123 GrooveEngine vs PerformanceTracker beat-definition mismatch in non-4/4
- #124 setState-updater side effects + timer leak in useAutoSpeedUp

Purpose: Drummers must trust real-time timing feedback. Stale grids, mutated state, leaked handlers, and bad BPM estimates all silently corrupt that feedback.

Output: Patched source files plus new/extended tests; one commit per issue.
</objective>

<execution_context>
@/Users/adar/Code/groovy/.claude/get-shit-done/workflows/execute-plan.md
@/Users/adar/Code/groovy/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/quick/260611-ev2-fix-top-code-review-findings-issues-114-/260611-ev2-SUMMARY.md
@CLAUDE.md

<interfaces>
<!-- Key contracts the executor needs. Already verified against current main. -->

From src/types.ts:
```typescript
export function getFlattenedNotes(groove: GrooveData): Record<DrumVoice, boolean[]>;
// concatenates each voice's notes across ALL measures in order
export const MAX_TEMPO = 300;
export const MIN_TEMPO = 30;
```

From src/core/GrooveUtils.ts (class GrooveUtils, static methods):
```typescript
static calcNotesPerMeasure(division: Division, beats: number, noteValue: 4|8|16): number; // (division/noteValue)*beats
static isDivisionCompatible(division, beats, noteValue): boolean;
static getDefaultDivision(beats, noteValue): Division;
static doesDivisionSupportSwing(division): boolean;
```

From src/midi/PerformanceTracker.ts (current state):
```typescript
enable(groove: GrooveData, startTime: number): void;     // uses groove.measures[0]?.notes  <-- #121a bug
setTempo(tempo: number): void;                            // rebuilds offset grid only
private buildOffsetGrid(): void;                          // stepsPerBeat = division / timeSignature.noteValue  <-- #123 mismatch
private getCurrentStep(timestamp): number;                // measureLength = stepsPerBeat * beats (single measure)  <-- #121a + #123
private calculateTimingError(timestamp): { errorMs; absError };
private updatePerformedBpmEstimate(timestamp): void;      // uses globalStepIndex = count of accepted hits  <-- #122 bug
getPerformedBpm(): number | null;                         // null when >20% deviation
// singleton: export const performanceTracker = new PerformanceTracker();
```

From src/midi/MIDIAccess.ts (current state):
```typescript
private currentInput: MIDIInput | null;
private fakeMIDIMessageHandler: ((data: Uint8Array, timestamp: number) => void) | null;
bindInput(deviceId: string, messageHandler): boolean;     // does NOT clear fake handler  <-- #120
disconnect(): void;                                       // clears currentInput only  <-- #120
getCurrentDevice(): MIDIDeviceInfo | null;                // returns fake device if fakeMIDIMessageHandler set
sendFakeMIDIMessage(note, velocity, timestamp): void;     // no-op if fakeMIDIMessageHandler null
// singleton: export const midiAccess = new MIDIAccessManager();
// export const FAKE_MIDI_DEVICE_ID_EXPORT = FAKE_MIDI_DEVICE_ID;
```

ENGINE timing math (the source of truth — PerformanceTracker must match it for #123):
- Beat = quarter note. step/note duration = (60/tempo) / (division/4) seconds.
- measure length (steps) = GrooveUtils.calcNotesPerMeasure(division, beats, noteValue) = (division/noteValue)*beats.

Test infra: `@testing-library/react` (renderHook, act) is available and already used in src/hooks/*.test.*. Vitest is the runner (`npx vitest run`). Baseline = 175/175 passing.
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Stop GrooveEngine.updateGroove from mutating the caller (#119)</name>
  <files>src/core/GrooveEngine.ts, src/core/GrooveEngine.test.ts</files>
  <behavior>
    - Passing a groove whose division is incompatible with its time signature: caller's object is unchanged (same division it came in with); engine stores/uses a corrected copy.
    - Passing a groove on a non-swing division (e.g. division 4 or a triplet) with swing > 0: caller's object keeps its swing value; engine's stored groove has swing 0.
    - Passing an already-valid groove: no spurious copy semantics break existing behavior (still stored/emitted).
  </behavior>
  <action>In `updateGroove` (~lines 249-279), do NOT assign to `groove.division` or `groove.swing` on the parameter. Instead build a local corrected reference: start with the parameter, and when auto-correcting division reassign the local to `{ ...groove, division: GrooveUtils.getDefaultDivision(...) }`; when disabling swing reassign the local to `{ ...corrected, swing: 0 }`. Apply the swing check against the (possibly already corrected) division. Use that corrected local for both `this.pendingGroove = ...` / `this.currentGroove = ...` and the `emit('grooveChange', ...)`. Keep the existing logger.warn / logger.info messages. Preserve explicit return type `void` and React-free core (no new imports beyond existing GrooveUtils/logger). In the test, construct a groove with an incompatible division (e.g. triplet division 12 in 6/8, or whatever the existing helpers make easy) and assert the original object's `division`/`swing` are untouched after calling `engine.updateGroove(...)` while playing=false; assert `engine.getCurrentGroove()` (or the emitted groove captured via `engine.on('grooveChange', ...)`) reflects the correction. Reuse DEFAULT_GROOVE and existing test setup patterns already in GrooveEngine.test.ts.</action>
  <verify>
    <automated>npx vitest run src/core/GrooveEngine.test.ts</automated>
  </verify>
  <done>New test proves caller object unchanged and engine groove corrected for both division and swing; full file green. Commit: `fix: GrooveEngine.updateGroove no longer mutates caller groove (#119)`</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Detach fake keyboard MIDI handler on disconnect and device switch (#120)</name>
  <files>src/midi/MIDIAccess.ts, src/midi/MIDIAccess.test.ts</files>
  <behavior>
    - Bind fake device → disconnect() → sendFakeMIDIMessage does nothing (handler never called) AND getCurrentDevice() returns null.
    - Bind fake device → bind a real device (mocked midiAccess.inputs) → the fake handler is inert (sendFakeMIDIMessage does not call the original fake callback) and getCurrentDevice() reports the real device, not the fake one.
  </behavior>
  <action>In `disconnect()` (~line 194), after clearing `currentInput`, also set `this.fakeMIDIMessageHandler = null`. In `bindInput()` (~line 102), at the very start (before the validation/disconnect logic, or at minimum before re-binding so a fake→real switch is covered), set `this.fakeMIDIMessageHandler = null` so a stale fake handler can never survive a re-bind; it is only re-assigned in the fake-device branch. Keep existing console logging as-is (this file already uses console, not logger — do not refactor logging in this fix). Preserve explicit return types. Create `src/midi/MIDIAccess.test.ts` (new file): import `{ midiAccess, FAKE_MIDI_DEVICE_ID_EXPORT }`. Force localhost by stubbing `window.location.hostname` to 'localhost' (vi.stubGlobal or Object.defineProperty) and call `midiAccess.initialize()` (it returns true on localhost even without Web MIDI). For the switch test, assign a mock `midiAccess` private via the public API surface available — if no setter exists, mock `navigator.requestMIDIAccess` to return an object with an `inputs` Map containing a fake MIDIInput before calling initialize, then bindInput(realId). Use a spy messageHandler to assert call counts. Since `midiAccess` is a singleton, call `disconnect()` in afterEach to avoid cross-test state leak.</action>
  <verify>
    <automated>npx vitest run src/midi/MIDIAccess.test.ts</automated>
  </verify>
  <done>Both behaviors proven; getCurrentDevice() returns null after fake disconnect; full file green. Commit: `fix: detach fake keyboard MIDI handler on disconnect and device switch (#120)`</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: PerformanceTracker grades full multi-measure pattern + mid-session updateGroove (#121)</name>
  <files>src/midi/PerformanceTracker.ts, src/hooks/useMIDITracking.ts, src/midi/PerformanceTracker.test.ts, src/hooks/useMIDITracking.test.ts</files>
  <behavior>
    - Multi-measure groove: a hit landing at a measure-2 step where measure 2's pattern has the voice grades HIGH on note accuracy, whereas the old measure-1-only logic would grade it low (voice absent at that step in measure 1).
    - getCurrentStep wraps by TOTAL groove length (sum of all measures' steps), not single-measure length.
    - updateGroove(groove): rebuilds loadedPattern (flattened), swing/division/timeSignature, and offset grid, WITHOUT resetting startTime or stats (totalHits, accumulated errors preserved).
    - useMIDITracking calls performanceTracker.updateGroove(groove) when the groove changes while tracking is active (playing && trackingEnabled), and does NOT re-enable (no startTime/stats reset).
  </behavior>
  <action>In PerformanceTracker.ts: import `getFlattenedNotes` from '../types'. In `enable()`, set `voices: getFlattenedNotes(groove)` instead of `groove.measures[0]?.notes`. Store the total step count for wrapping — compute total measure length as the sum over measures of `GrooveUtils.calcNotesPerMeasure(division, ts.beats, ts.noteValue)` using each measure's effective time signature (measure.timeSignature ?? groove.timeSignature); keep a private `totalSteps: number` field. NOTE: src/midi may import from src/core when there is no cycle — verify GrooveUtils does not import from src/midi (it does not), then `import { GrooveUtils } from '../core/GrooveUtils'`; if any cycle surfaces, replicate the `(division/noteValue)*beats` formula inline with a comment citing GrooveUtils as source of truth. Update `getCurrentStep` to wrap with `stepNumber % this.totalSteps` (guard totalSteps>0). Add public `updateGroove(groove: GrooveData): void`: validate like enable (return on bad data), reassign tempo/division/swing/timeSignature/loadedPattern(flattened)/totalSteps, call buildOffsetGrid(), but do NOT touch startTime, globalStepIndex, bpmEstimate, or stats. Explicit `void` return type; use `console.warn`/`console.log` consistent with existing file style (this file uses console). In useMIDITracking.ts: add a useEffect that, when `isPlaying && trackingEnabled`, calls `performanceTracker.updateGroove(groove)` on groove identity change; dependency array `[groove, isPlaying, trackingEnabled]`. Keep the existing tempo-sync effect (setTempo) or fold tempo into updateGroove — if folding, ensure updateGroove also picks up tempo; simplest: keep both, updateGroove handles pattern/grid, setTempo handles tempo-only changes. Do not import GrooveEngine. Tests: in PerformanceTracker.test.ts add a multi-measure groove (measure 1 has snare only on step 0, measure 2 has snare on a later step) and assert analyzeHit at the corresponding measure-2 elapsed time scores high noteAccuracy; add a test that updateGroove preserves stats/startTime (record getStats().totalHits before, call updateGroove, hit again, assert totalHits incremented from the preserved base, not reset to 1). Call performanceTracker.disable() in afterEach to avoid singleton leak. In useMIDITracking.test.ts add a test that changing groove prop while playing+tracking triggers updateGroove (spy on performanceTracker.updateGroove) and does NOT call enable again.</action>
  <verify>
    <automated>npx vitest run src/midi/PerformanceTracker.test.ts src/hooks/useMIDITracking.test.ts</automated>
  </verify>
  <done>Multi-measure grading test passes; updateGroove preserves stats/startTime; hook calls updateGroove on mid-session change; both files green. Commit: `fix: PerformanceTracker grades full multi-measure pattern and stays fresh mid-session (#121)`</done>
</task>

<task type="auto" tdd="true">
  <name>Task 4: Align PerformanceTracker grid with engine beat math in non-4/4 (#123)</name>
  <files>src/midi/PerformanceTracker.ts, src/midi/PerformanceTracker.test.ts</files>
  <behavior>
    - 6/8 and 3/4 grooves: step grid spacing equals the engine's note duration = (60/tempo)/(division/4) seconds, NOT (60/tempo)/(division/noteValue).
    - A perfectly-on-grid synthetic hit sequence in a 6/8 groove grades timingAccuracy 100 (or near-perfect within onTime band).
    - measure length / wrapping uses GrooveUtils.calcNotesPerMeasure (already from Task 3); confirm it stays consistent.
  </behavior>
  <action>In PerformanceTracker.ts, change the beat-grid math so a "beat" is a quarter note (matching the engine), independent of the time-signature noteValue. Specifically: replace `stepsPerBeat = this.division / this.timeSignature.noteValue` in `buildOffsetGrid`, `getCurrentStep`, and `updatePerformedBpmEstimate` with `stepsPerBeat = this.division / 4`. The per-step duration becomes `beatDurMs / (division/4)` = `(60/tempo)/(division/4)*1000`, matching engine note duration. Keep beatDurMs = (60/tempo)*1000 (one quarter note). Verify the swing-grid offbeat logic still uses stepsPerBeat for pair indexing — it does, so it follows the corrected value. Add a comment noting the engine (GrooveEngine note duration) is the source of truth and "beat = quarter note". Tests: add a 6/8 groove (division 8, beats 6, noteValue 8) and a 3/4 groove; build a synthetic series of timestamps exactly on step boundaries using stepDur = (60/tempo)/(division/4) seconds, feed via analyzeHit at the matching voice/step, assert timingAccuracy === 100 for on-grid hits. Assert the computed step spacing equals engine note duration for these signatures.</action>
  <verify>
    <automated>npx vitest run src/midi/PerformanceTracker.test.ts</automated>
  </verify>
  <done>6/8 on-grid hits grade 100; grid spacing matches engine note duration for 6/8 and 3/4; file green. Commit: `fix: align PerformanceTracker grid with engine beat definition in non-4/4 (#123)`</done>
</task>

<task type="auto" tdd="true">
  <name>Task 5: Performed-BPM estimate from quantized step indices, not hit count (#122)</name>
  <files>src/midi/PerformanceTracker.ts, src/midi/PerformanceTracker.test.ts</files>
  <behavior>
    - Drummer hitting only quarter notes in a 16ths groove at the correct set tempo → performed BPM ≈ set tempo (not 4x slow).
    - Consistently 10% fast playing → estimate ≈ 1.1 × set tempo.
    - Simultaneous/flam hits (same quantized step) do not corrupt the estimate (stepDelta 0 samples ignored).
    - >20% deviation still makes getPerformedBpm() return null; internal EWMA seed is not reset to oscillate (document chosen approach in a comment).
  </behavior>
  <action>Replace the hit-count-based logic in `updatePerformedBpmEstimate` (~line 382) with inter-onset estimation keyed to quantized step indices. For each accepted hit (the same `absError < 100` gate used in analyzeHit), compute its ABSOLUTE quantized step index: `absStep = Math.round((timestamp - startTime) / stepDurMs)` where `stepDurMs = beatDurMs / (division/4)` (consistent with #123). Track `lastAbsStep` and `lastTimestamp` (new private fields, reset in enable() alongside globalStepIndex/bpmEstimate; updateGroove must NOT reset them). On each accepted hit: if a previous accepted hit exists, `stepDelta = absStep - lastAbsStep`; if `stepDelta < 1` ignore (simultaneous/flam) — do not update EWMA, but still advance lastTimestamp/lastAbsStep? No: skip updating last* so a later genuine step still measures from the real previous onset (choose: keep last* unchanged on stepDelta 0 so flams collapse to one onset). Otherwise compute `timeDeltaSecs = (timestamp - lastTimestamp)/1000`; guard timeDeltaSecs>0; `bpmSample = (stepDelta * 60) / ((division/4) * timeDeltaSecs)`; EWMA-smooth into bpmEstimate with EWMA_ALPHA as before. After updating, set lastAbsStep/lastTimestamp to current. Keep the >20% deviation rule but per the issue: when deviation exceeds threshold, return null from getPerformedBpm() WITHOUT nulling the internal bpmEstimate (so it doesn't oscillate) — implement via a private flag or by checking deviation inside getPerformedBpm() against this.tempo rather than zeroing the estimate. Remove the now-misused `globalStepIndex++`-driven estimation coupling: keep globalStepIndex if other code reads it, but the BPM math must use step indices. Add explanatory comment. Tests: 16ths groove (division 16), set tempo 120; simulate quarter-note hits at exact 0.5s spacing (one quarter note = 60/120) → getPerformedBpm() ≈ 120 (within rounding tolerance, e.g. ±2). Simulate hits 10% fast → ≈132. Simulate two hits at the same timestamp (flam) then continue → estimate not corrupted. Simulate >20% slow → getPerformedBpm() returns null. Use disable() in afterEach.</action>
  <verify>
    <automated>npx vitest run src/midi/PerformanceTracker.test.ts</automated>
  </verify>
  <done>Quarter-in-16ths estimate ≈ set tempo; 10%-fast ≈ 1.1×; flams ignored; >20% deviation → null; file green. Commit: `fix: performed-BPM estimate uses quantized step intervals, not hit count (#122)`</done>
</task>

<task type="auto" tdd="true">
  <name>Task 6: useAutoSpeedUp — side-effect-free updater + unmount cleanup (#124)</name>
  <files>src/hooks/useAutoSpeedUp.ts, src/hooks/useAutoSpeedUp.test.ts</files>
  <behavior>
    - Each interval, tempo increases by config.stepBpm via onTempoChange.
    - Stops at MAX_TEMPO or when config.keepGoing is false (no further onTempoChange).
    - Unmount clears timerRef and countdownRef (no act() warnings, no further onTempoChange after unmount).
    - StrictMode double-invocation of the updater does not double-increase tempo (side effects no longer live in setState updater).
  </behavior>
  <action>In useAutoSpeedUp.ts restructure `scheduleIncrease`/the setTimeout callback so NO side effects run inside a `setState` updater. Maintain a ref mirroring the latest state needed by the timer (e.g. `stateRef` updated via an effect, or capture totalIncreased/isActive from a ref). In the timeout callback: read current values from the ref first; compute `newTempo = Math.min(baseTempo + totalIncreased + stepBpm, MAX_TEMPO)`; call `onTempoChange(newTempo)` OUTSIDE any updater; decide continuation (keepGoing && newTempo < MAX_TEMPO) and call `scheduleIncrease()` again OUTSIDE the updater; THEN call `setState(plainNextState)` (a plain object or a pure functional updater with no side effects). Keep a ref to onTempoChange/config to avoid stale closures if needed. Add a `useEffect(() => () => { clear both timers }, [])` unmount cleanup clearing `timerRef` (clearTimeout) and `countdownRef` (clearInterval) and nulling them. Preserve explicit return types and the public hook API (UseAutoSpeedUpReturn unchanged). Create `src/hooks/useAutoSpeedUp.test.ts`: use `renderHook` + `vi.useFakeTimers()`. Provide an `onTempoChange` spy and a controllable `tempo`/config via rerender props. Advance timers by intervalMs (config.intervalMinutes*60*1000) inside `act()` and assert onTempoChange called with base+stepBpm, then base+2*stepBpm, etc. Test stop at MAX_TEMPO (set tempo near MAX_TEMPO so one step caps it; assert isActive becomes false and no further calls). Test keepGoing=false stops after one step. Test unmount: call start, unmount, advance timers, assert onTempoChange NOT called again and no warnings. Use vi.useRealTimers() in afterEach.</action>
  <verify>
    <automated>npx vitest run src/hooks/useAutoSpeedUp.test.ts</automated>
  </verify>
  <done>Tempo steps by stepBpm; stops at MAX_TEMPO/keepGoing=false; unmount clears timers with no further callbacks; no setState-updater side effects remain; file green. Commit: `fix: useAutoSpeedUp performs side effects outside updater and clears timers on unmount (#124)`</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| MIDI device → app | Hardware/keyboard event input crosses into timing analysis |
| React state → core engine | Caller-owned groove objects passed into engine/tracker |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-fcv-01 | Tampering | GrooveEngine.updateGroove caller-state mutation (#119) | mitigate | Build corrected copy; never write to the passed-in groove object |
| T-fcv-02 | Information disclosure / Repudiation | Fake MIDI handler leak (#120) | mitigate | Null fakeMIDIMessageHandler on disconnect and at bindInput start so stale input cannot keep flowing |
| T-fcv-03 | Denial of service | useAutoSpeedUp timer leak (#124) | mitigate | useEffect unmount cleanup clears timer/countdown refs |
| T-fcv-04 | (none) | PerformanceTracker math fixes (#121/#122/#123) | accept | Pure local timing math; no external trust boundary; correctness covered by tests |
</threat_model>

<verification>
After each task: `npx vitest run <touched test files>` green; full suite never regresses.
After all six commits, run the full suite and the build:
- `npx vitest run` → all tests pass (175 baseline + new tests, no failures)
- `npm run build` → TypeScript compiles clean, no errors
Confirm src/core and src/midi remain React-free (no `react` import added).
</verification>

<success_criteria>
- Six atomic commits, one per issue (#119–#124), each message `fix: <summary> (#NNN)`.
- Each commit leaves `npx vitest run` green (no regression from 175 baseline; net new tests added).
- Final `npm run build` passes clean.
- CLAUDE.md conventions honored: explicit return types, null over undefined, no `any`, existing logging style per file (logger in hooks, console in MIDIAccess/PerformanceTracker as already established), core/midi React-free.
- Tasks #121 → #123 → #122 land in that order (pattern/grid correctness before BPM estimation).
</success_criteria>

<output>
After completion, create `.planning/quick/260611-fcv-fix-code-review-issues-119-124-with-test/260611-fcv-SUMMARY.md`
</output>
