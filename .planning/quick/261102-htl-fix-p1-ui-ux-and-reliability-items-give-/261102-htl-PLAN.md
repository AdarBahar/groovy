---
phase: quick-261102-htl
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/midi/MIDIAccess.ts
  - src/midi/MIDIAccess.test.ts
  - src/hooks/useMIDIInput.ts
  - src/components/production/PlaybackControls.tsx
  - src/components/production/PlaybackControls.test.tsx
  - src/pages/EmbedPage.tsx
autonomous: true
requirements: [REL-P1-MIDI-TEARDOWN, UX-P1-TRANSPORT-A11Y]
must_haves:
  truths:
    - "Re-initializing MIDI access never leaves a handler on a previous MIDIAccess object"
    - "dispose() clears onstatechange, the bound input's onmidimessage, the message handler and the device-list callback"
    - "When the bound device disconnects, its port's onmidimessage is cleared before the reference is dropped"
    - "useMIDIInput's unmount cleanup performs the full teardown, not just disconnect()"
    - "Every transport button (ProductionPage PlaybackControls x2, EmbedPage) has an accessible name that reflects its current state"
    - "Existing 245 tests keep passing; new tests cover teardown and the accessible names"
  artifacts:
    - path: "src/midi/MIDIAccess.ts"
      provides: "dispose() + idempotent initialize() + port handler clearing on disconnect events"
      contains: "dispose(): void"
    - path: "src/components/production/PlaybackControls.tsx"
      provides: "aria-label/title on both transport buttons"
      contains: "aria-label"
  key_links:
    - from: "src/hooks/useMIDIInput.ts"
      to: "src/midi/MIDIAccess.ts"
      via: "unmount cleanup calls midiAccess.dispose()"
      pattern: "midiAccess\\.dispose\\(\\)"
---

<objective>
Close the two remaining P1 findings from the 2026-11-02 review that are not security items.

Reliability: `MIDIAccessManager` sets `midiAccess.onstatechange` in `initialize()` and never clears it; there is no teardown. Re-initialization (React StrictMode double-mount, HMR, a future re-init on permission change) stacks `statechange` handlers on abandoned `MIDIAccess` objects, which CLAUDE.md forbids ("no listener accumulation over multi-session use"). `handleStateChange` also drops `currentInput` without clearing its `onmidimessage`, so a reconnecting port can fire a stale handler.

UI/UX: the play/stop transport buttons render only an icon (lucide `Play`/`Pause`, or a unicode glyph on the embed page) with no `aria-label`, so screen readers announce "button" and automated tests cannot find them (confirmed in the 2026-11-02 live smoke test).

Purpose: keep the MIDI pipeline free of stale handlers across the component lifecycle, and make the transport operable by assistive tech and testable by role.
Output: `dispose()` on `MIDIAccessManager`, hook cleanup wired to it, labelled transport buttons, tests for both.
</objective>

<context>
@.planning/STATE.md
@./CLAUDE.md

<interfaces>
src/midi/MIDIAccess.ts (singleton `midiAccess`):
- `initialize(): Promise<boolean>` — sets `this.midiAccess` and `this.midiAccess.onstatechange`.
- `bindInput(id, handler)` — sets `currentInput.onmidimessage`, `messageHandler`.
- `disconnect()` — clears `currentInput.onmidimessage`, `currentInput`, `fakeMIDIMessageHandler`. Leaves `onstatechange`, `messageHandler`, `midiAccess`.
- `handleStateChange(event)` — on current-port disconnect sets `currentInput = null` WITHOUT clearing `onmidimessage`.
- `onDeviceListChange` public callback, owned by useMIDIInput (set in one effect, nulled in that effect's cleanup).

src/hooks/useMIDIInput.ts: init effect cleanup currently calls `midiAccess.disconnect()`.

src/components/production/PlaybackControls.tsx: two `<Button>`s — main (`onPlay`) and auto-speed-up (`onPlayWithSpeedUp`). Icon chosen by `countingInButton`/`countdownNumber`, `isPlaying`, `isAutoSpeedUpActive`. Uses `useMIDITimingAccuracy` and `useMIDIPerformedBpm` hooks (mock in tests).

src/pages/EmbedPage.tsx:140 — `<button onClick={handlePlay}>` rendering ' ⏸ ' / '▶ '.
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: MIDIAccess teardown and stale-handler clearing</name>
  <files>src/midi/MIDIAccess.ts, src/midi/MIDIAccess.test.ts, src/hooks/useMIDIInput.ts</files>
  <behavior>
    - initialize() twice with two different mock MIDIAccess objects: the first object's onstatechange is null afterwards; only the second has a handler.
    - dispose() after bindInput to a real mock device: port.onmidimessage null, mock access onstatechange null, getCurrentDevice() null, getInputDevices() lists no real devices, onDeviceListChange null.
    - Fire the statechange handler with the bound port in state 'disconnected': port.onmidimessage is null and getCurrentDevice() is null.
    - dispose() on a never-initialized / already-disposed manager does not throw.
  </behavior>
  <action>
    In MIDIAccess.ts add a private `releaseAccess()` that nulls `midiAccess.onstatechange` (if any) and `midiAccess`; call it at the top of `initialize()` (after `disconnect()`) so re-init is idempotent. Add public `dispose(): void` = `disconnect()` + `releaseAccess()` + null `messageHandler` and `onDeviceListChange`. In `handleStateChange`, clear `this.currentInput.onmidimessage` before nulling `currentInput`. Keep `disconnect()` semantics unchanged for callers that only switch devices.
    In useMIDIInput.ts change the init-effect cleanup to `midiAccess.dispose()`.
    Add a `describe('MIDIAccess teardown (no listener accumulation)')` block in MIDIAccess.test.ts implementing <behavior>, following the existing mock-MIDIAccess pattern in that file. Do not modify existing describe blocks.
  </action>
  <verify>
    <automated>npx vitest run src/midi/MIDIAccess.test.ts src/hooks/useMIDIInput.test.tsx && npx tsc --noEmit</automated>
  </verify>
  <done>dispose() exists and is called from the hook cleanup; re-init leaves no handler on old access objects; disconnect events clear the port handler; new tests pass; existing suites unchanged.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Accessible names on transport buttons</name>
  <files>src/components/production/PlaybackControls.tsx, src/components/production/PlaybackControls.test.tsx, src/pages/EmbedPage.tsx</files>
  <behavior>
    Render PlaybackControls (hooks mocked) and assert by role:
    - stopped: a button named /^play$/i and a button named /play with auto speed-up/i.
    - isPlaying, !isAutoSpeedUpActive: main button named /^pause$/i.
    - isPlaying, isAutoSpeedUpActive: speed-up button named /pause auto speed-up/i.
    - countingInButton='play', countdownNumber=3: main button name contains "Counting in" and "3".
  </behavior>
  <action>
    Derive label strings next to the icon logic (same conditions) and set `aria-label` and `title` on both Buttons. Labels: "Play" / "Pause" / "Counting in: N" for the main button; "Play with auto speed-up" / "Pause auto speed-up" / "Counting in: N" for the second. In EmbedPage.tsx give the play button `aria-label={isPlaying ? 'Pause' : 'Play'}` and the same `title`. Create PlaybackControls.test.tsx with vi.mock for the two MIDI hooks and the four cases above.
  </action>
  <verify>
    <automated>npx vitest run src/components/production/PlaybackControls.test.tsx && npx tsc --noEmit && npx eslint src/components/production/PlaybackControls.tsx src/components/production/PlaybackControls.test.tsx src/pages/EmbedPage.tsx src/midi/MIDIAccess.ts src/hooks/useMIDIInput.ts</automated>
  </verify>
  <done>All three transport buttons expose a state-reflecting accessible name; the new component test passes; lint on touched files introduces no new errors.</done>
</task>

</tasks>

<verification>
- `npx vitest run` — full suite green (245 existing + new).
- `npx tsc --noEmit` — clean.
- `NODE_ENV=production npx vite build` — succeeds.
</verification>

<success_criteria>
- No path leaves a `statechange` or `midimessage` handler on an object the manager no longer owns.
- Hook unmount performs the full teardown.
- Transport buttons are findable by `getByRole('button', { name })` and announce their state.
</success_criteria>

<output>
After completion, create `.planning/quick/261102-htl-fix-p1-ui-ux-and-reliability-items-give-/261102-htl-SUMMARY.md`
</output>
