---
phase: quick-260705-dxu
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/midi/BeatComparator.ts
  - src/midi/BeatComparator.test.ts
  - src/hooks/useMIDITracking.ts
autonomous: true
requirements:
  - POC-BEATCOMPARE-01  # per-beat console comparison of groove pattern vs MIDI hits

must_haves:
  truths:
    - "While playing with MIDI tracking + debug mode on, one console line is emitted per quarter-note beat"
    - "Each line shows the groove's expected voices (player) vs the voices the drummer hit (midi) for that beat"
    - "Beats where the drummer hit nothing still log with 'midi: —' (silent beats are not skipped)"
    - "Timing verdict (on time / late / early / —) is derived from the mean signed timingErrorMs of the beat's hits"
    - "A voice the drummer hit that is not in the pattern still appears in the 'midi:' column"
  artifacts:
    - path: "src/midi/BeatComparator.ts"
      provides: "React-free BeatComparator class + beatComparator singleton mirroring PerformanceTracker lifecycle"
      contains: "class BeatComparator"
      exports: ["BeatComparator", "beatComparator"]
    - path: "src/midi/BeatComparator.test.ts"
      provides: "Vitest suite driving the flush interval with fake timers"
      contains: "describe"
    - path: "src/hooks/useMIDITracking.ts"
      provides: "Integration: enable/disable/setTempo/updateGroove/recordHit wired alongside performanceTracker"
      contains: "beatComparator"
  key_links:
    - from: "src/hooks/useMIDITracking.ts"
      to: "src/midi/BeatComparator.ts"
      via: "beatComparator.recordHit(voice, timestamp, analysis.timingErrorMs) in handleMIDIHit"
      pattern: "beatComparator\\.recordHit"
    - from: "src/midi/BeatComparator.ts"
      to: "src/utils/logger.ts"
      via: "logger.log('[BeatCompare] ...') on beat flush"
      pattern: "logger\\.log"
---

<objective>
POC: emit one console line per quarter-note beat comparing the loaded groove pattern
(the "player" — expected voices) against what the drummer actually hit via MIDI (the "midi"
column), plus a timing verdict, while playing with MIDI tracking enabled.

Exact target format (one line per beat, absolute 1-based beat numbering from playback start):

  [BeatCompare] beat 1 | player: Closed Hi-Hat & Kick | midi: Closed Hi-Hat & Kick | time: on time
  [BeatCompare] beat 2 | player: Closed Hi-Hat | midi: Open Hi-Hat | time: late
  [BeatCompare] beat 3 | player: Closed Hi-Hat & Snare | midi: Closed Hi-Hat & Tom 1 | time: early

Purpose: Give the developer a plain-text, per-beat diff of expected-vs-played to validate that
MIDI tracking, voice mapping, and timing math line up before building richer UI.
Output: New React-free module `src/midi/BeatComparator.ts` (+ tests), wired into the existing
`useMIDITracking` hook. Console output is gated behind `logger.log` (debug mode only), per project convention.
</objective>

<execution_context>
@/Users/adar/Code/groovy/.claude/get-shit-done/workflows/execute-plan.md
@/Users/adar/Code/groovy/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@CLAUDE.md

<interfaces>
<!-- Contracts the executor needs. Extracted from codebase — do not re-explore. -->

From src/types.ts:
  export interface GrooveData {
    timeSignature: TimeSignature;   // { beats: number; noteValue: 4 | 8 | 16 }
    division: Division;             // 4 | 8 | 12 | 16 | 24 | 32 | 48
    tempo: number;                  // BPM
    swing: number;                  // 0-100
    measures: MeasureConfig[];
  }
  export type DrumVoice = /* union, e.g. 'hihat-closed' | 'snare-normal' | 'kick' | ... */;
  // Flattened boolean[] per voice, concatenated across ALL measures. All voice arrays share one length.
  export function getFlattenedNotes(groove: GrooveData): Record<DrumVoice, boolean[]>;

From src/core/DrumVoiceConfig.ts:
  export const DRUM_VOICE_CONFIG: Record<DrumVoice, { name: string; /* ... */ }>;
  //  DRUM_VOICE_CONFIG['hihat-closed'].name === 'Closed Hi-Hat'
  //  DRUM_VOICE_CONFIG['hihat-open'].name   === 'Open Hi-Hat'
  //  DRUM_VOICE_CONFIG['tom-10'].name       === 'Tom 1'
  export const ALL_DRUM_VOICES: DrumVoice[]; // stable iteration order for deterministic union output

From src/utils/logger.ts:
  export const logger; // logger.log(...args) → console.log only when debug mode enabled

From src/midi/PerformanceTracker.ts (lifecycle to MIRROR — same clock, same stepsPerBeat, same wrap logic):
  performanceTracker.enable(groove: GrooveData, startTime: number): void
  performanceTracker.disable(): void
  performanceTracker.setTempo(tempo: number): void
  performanceTracker.updateGroove(groove: GrooveData): void
  performanceTracker.analyzeHit(voice, timestamp): HitAnalysis | null  // HitAnalysis.timingErrorMs is signed
  // Canonical timing conventions used across the codebase:
  //   beatDurMs   = (60 / tempo) * 1000               // beat = quarter note
  //   stepsPerBeat = division / 4                      // NOT division/noteValue (engine source of truth, #123)
  //   stepDurMs   = beatDurMs / stepsPerBeat
  //   currentStep = round(elapsedMs / stepDurMs) % totalSteps   // getCurrentStep()
  //   timingErrorMs sign: NEGATIVE = slow (behind the grid), POSITIVE = fast (ahead of the grid)

From src/midi/performanceGrader.ts (grading band already used elsewhere):
  onTimeMs = Math.min(25, beatDurMs * 0.05)           // "on time" threshold
  acceptWindow = Math.min(90, beatDurMs * 0.18)        // reuse as the per-beat flush grace window

From src/hooks/useMIDITracking.ts handleMIDIHit (the wiring site):
  const { voice, timestamp } = event.detail;                 // 'midi-note-hit' CustomEvent
  const analysis = performanceTracker.analyzeHit(voice, timestamp);  // analysis.timingErrorMs is signed
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Create BeatComparator module + tests</name>
  <files>src/midi/BeatComparator.ts, src/midi/BeatComparator.test.ts</files>
  <behavior>
    Tests (Vitest, spy on `logger.log`, drive the interval with `vi.useFakeTimers()`):
    - enable(groove, 0) then recordHit for beat 0 and vi.advanceTimersByTime past beat 0 end + grace →
      exactly one `[BeatCompare] beat 1 | player: ... | midi: ... | time: ...` line, format matches the
      target string shape (single line, ' & '-joined distinct names, absolute 1-based beat number).
    - Expected/played match: pattern with hihat-closed+kick on beat-0 downbeat, drummer hits both on time →
      player and midi columns both read "Closed Hi-Hat & Kick", time: on time.
    - Silent beat: a beat with an empty pattern column and NO recorded hits still logs, with "midi: —"
      (and "player: —" when the pattern is also empty for that beat).
    - Extra/wrong voice: pattern expects Closed Hi-Hat, drummer hits Open Hi-Hat → midi column shows
      "Open Hi-Hat" (voice not in pattern still appears).
    - Timing verdicts from signed mean: mean error negative (beyond onTimeMs) → "late";
      positive (beyond onTimeMs) → "early"; |mean| <= onTimeMs → "on time"; no hits → "—".
    - Next-downbeat assignment: a hit whose elapsedMs quantizes (round(elapsedMs/stepDurMs)) to the first
      step of beat N is bucketed into beat N, not beat N-1 (a hit just before a downbeat counts to the next beat).
    - disable(): after disable(), advancing timers produces NO further `[BeatCompare]` lines and the interval is cleared.
  </behavior>
  <action>
    Create `src/midi/BeatComparator.ts` — a React-free class mirroring PerformanceTracker's lifecycle and
    timing conventions (import DrumVoice/GrooveData/getFlattenedNotes/ALL_DRUM_VOICES from '../types' or
    DrumVoiceConfig as appropriate; DRUM_VOICE_CONFIG from '../core/DrumVoiceConfig'; logger from '../utils/logger').

    Public API (match performanceTracker naming exactly for symmetry):
      enable(groove: GrooveData, startTime: number): void
      disable(): void
      setTempo(tempo: number): void
      updateGroove(groove: GrooveData): void
      recordHit(voice: DrumVoice, timestamp: number, timingErrorMs: number): void
    Export the class AND a singleton: `export const beatComparator = new BeatComparator()` (matches the
    performanceTracker export pattern).

    Internal state: enabled flag, startTime, tempo, division, flattened pattern (Record<DrumVoice, boolean[]>),
    totalSteps (length of any flattened voice array; 0-guard), a Map<number, { voices: DrumVoice[]; errSum: number; errCount: number }>
    keyed by absolute beat index, a `nextBeatToFlush` counter, and an interval handle typed
    `ReturnType<typeof setInterval> | null`.

    Timing math — use the codebase-canonical formulas verbatim (do NOT invent variants):
      beatDurMs = (60 / tempo) * 1000; stepsPerBeat = division / 4; stepDurMs = beatDurMs / stepsPerBeat.
    recordHit MUST be O(1) (<1ms MIDI budget): compute elapsedMs = timestamp - startTime;
      step = Math.round(elapsedMs / stepDurMs); beat = Math.floor(step / stepsPerBeat);
      push distinct voice into that beat's bucket (dedupe against existing bucket voices), add timingErrorMs to errSum, errCount++.
      Guard: if not enabled or startTime null, return early.

    Flush loop: on enable(), start setInterval(~100ms) that flushes every beat that has fully ended plus a
      grace window. grace = Math.min(90, beatDurMs * 0.18) (reuse acceptWindow). elapsed = now - startTime
      where now = performance.now(); maxFlushable = Math.floor((elapsed - grace) / beatDurMs) - 1. Flush all
      beats from nextBeatToFlush..maxFlushable inclusive (this guarantees SILENT beats still emit). Use the
      global `setInterval`/`clearInterval` (not window.*) so vi.useFakeTimers patches them; guard the callback
      with `if (!this.enabled) return;`.

    Per-beat flush emits ONE logger.log line:
      expected voices for beat b: for s in [b*stepsPerBeat, (b+1)*stepsPerBeat): stepInPattern = ((s % totalSteps) + totalSteps) % totalSteps
        (guard totalSteps>0); collect voices where flattened[voice][stepInPattern] === true, iterating ALL_DRUM_VOICES
        for deterministic order, deduped.
      played voices: the bucket's voices (already distinct, insertion order).
      names: map each voice → DRUM_VOICE_CONFIG[voice].name; join distinct with ' & '; empty list → '—'.
      verdict: no hits (errCount === 0) → '—'; else mean = errSum / errCount; onTimeMs = Math.min(25, beatDurMs*0.05);
        if Math.abs(mean) <= onTimeMs → 'on time'; else if mean < 0 → 'late' (slow/behind); else 'early' (fast/ahead).
        Add a comment documenting the sign→verdict mapping (negative=slow=late, positive=fast=early) referencing
        performanceGrader / PerformanceTracker convention.
      line: `[BeatCompare] beat ${b + 1} | player: ${playerStr} | midi: ${midiStr} | time: ${verdict}` (absolute, 1-based, no per-measure wrap of the beat number).
      Delete the flushed bucket from the Map after logging; advance nextBeatToFlush.

    disable(): set enabled=false, clearInterval + null the handle, and do NOT flush remaining beats.
    setTempo(tempo): if enabled and tempo>0, update this.tempo (rebuilds beatDurMs/stepDurMs implicitly on next use).
      Add a one-line comment noting the POC simplification: absolute beat index is computed from the current
      tempo only (same simplification PerformanceTracker makes; acceptable mid-session drift for a POC).
    updateGroove(groove): if enabled, rebuild flattened pattern + totalSteps + division/tempo (do NOT reset startTime,
      buckets, or nextBeatToFlush — preserve in-flight beats), mirroring performanceTracker.updateGroove semantics.

    Respect strict TS (explicit return types, no `any`, `null` for no-value), React-free (no React imports),
    named exports, and existing file-header doc-comment style.

    Create `src/midi/BeatComparator.test.ts` covering every case in <behavior>. Use vi.useFakeTimers() /
    vi.advanceTimersByTime, and vi.spyOn(logger, 'log'). Pick a tempo where the math is clean (e.g. 120 BPM →
    beatDurMs=500, division=8 → stepsPerBeat=2, stepDurMs=250) and assert on the emitted line strings.
  </action>
  <verify>
    <automated>npx vitest run src/midi/BeatComparator.test.ts</automated>
  </verify>
  <done>BeatComparator.ts exports class + beatComparator singleton; all new tests pass; `npx tsc -b` clean for the module (React-free, strict TS).</done>
</task>

<task type="auto">
  <name>Task 2: Wire BeatComparator into useMIDITracking</name>
  <files>src/hooks/useMIDITracking.ts</files>
  <action>
    Integrate `beatComparator` alongside the existing `performanceTracker` in `src/hooks/useMIDITracking.ts`
    (this is the ONLY file changed here). Import: `import { beatComparator } from '../midi/BeatComparator';`.

    - Enable/disable effect (the `[isPlaying, trackingEnabled, groove]` effect): call
      `beatComparator.enable(groove, playStartTimeRef.current)` immediately after
      `performanceTracker.enable(...)`, using the SAME startTime anchor. On the disable branch call
      `beatComparator.disable()` right after `performanceTracker.disable()`.
    - Tempo sync effect: add `beatComparator.setTempo(groove.tempo)` next to `performanceTracker.setTempo(...)`.
    - Groove sync effect: add `beatComparator.updateGroove(groove)` next to `performanceTracker.updateGroove(...)`.
    - In `handleMIDIHit`, inside the existing `if (analysis) { ... }` block (so it only records analyzed hits),
      call `beatComparator.recordHit(voice, timestamp, analysis.timingErrorMs);`. Record ALL analyzed hits —
      including wrong/extra voices — so mistakes surface in the "midi:" column (that is the point of the POC).
      Do not add any new deps to the handler effect's dependency array (values already come from refs).

    Do not alter the existing PerformanceTracker calls, the event dispatch, or the effect dependency arrays
    beyond the additions above.
  </action>
  <verify>
    <automated>npx tsc -b && npx vitest run src/midi</automated>
  </verify>
  <done>useMIDITracking calls beatComparator.enable/disable/setTempo/updateGroove/recordHit at the correct sites with the shared startTime; `npx tsc -b` clean; existing MIDI tests still pass.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| MIDI device → app | Note events already validated/filtered upstream (VelocityFilter, DoubleTriggerFilter, voice mapping) before reaching handleMIDIHit. BeatComparator consumes already-sanitized `voice`/`timestamp`. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-poc-01 | Denial of Service | BeatComparator flush interval | mitigate | Flush is O(beats-elapsed) and deletes buckets after logging; recordHit is O(1). disable() clears the interval so no leak accumulates across play/stop cycles. |
| T-poc-02 | Information Disclosure | Console log output | accept | Output is developer-only (logger.log gated behind debug mode, off by default). No PII; drum voice names only. |
</threat_model>

<verification>
- `npx vitest run src/midi/BeatComparator.test.ts` — all new tests pass (format, silent beat, extra voice, verdicts, next-downbeat, disable).
- `npx tsc -b` — clean (strict TS, React-free module).
- `npx vitest run src/midi` — existing MIDI suites still pass (no regression from the hook wiring).
- Manual (optional): enable debug mode, connect MIDI (or keyboard sim on localhost), play a groove → one `[BeatCompare]` line per quarter-note beat in the console.
</verification>

<success_criteria>
- One console line per quarter-note beat while playing with MIDI tracking + debug mode on.
- Line format matches: `[BeatCompare] beat N | player: ... | midi: ... | time: on time|late|early|—`.
- Silent beats still emit (`midi: —`); extra/wrong voices appear in the `midi:` column.
- Verdict derived from mean signed timingErrorMs using the existing tempo-aware onTime band.
- Module is React-free, strict-TS clean, exports `beatComparator` singleton; only new module + tests + useMIDITracking.ts touched.
</success_criteria>

<output>
After completion, create `.planning/quick/260705-dxu-poc-per-beat-console-comparison-of-groov/260705-dxu-SUMMARY.md`
</output>
