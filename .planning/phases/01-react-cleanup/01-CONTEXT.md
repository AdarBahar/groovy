# Phase 1: React Event Handler Cleanup - Context

**Gathered:** 2026-05-15
**Status:** Ready for planning
**Mode:** MVP

## Phase Boundary

Fix memory leaks in React event listener lifecycle — prevent listener accumulation over multi-session use. Focus on two hotspots:
1. **useMIDIInput.ts** — MIDI device listeners and note handlers
2. **VolumeKnob.tsx** — Document listeners during drag operations

Success: Listeners attach exactly once per device connection, verified with memory profiling.

## Implementation Decisions

### Handler Lifecycle Management

- **Pattern:** useRef + direct config reads (not useCallback with dependencies)
- **Rationale:** Prevent stale closures that capture config from earlier renders; handlers read live config via refs
- **How:** Store config in refs; handlers never close over state; update handler references only on mount
- **Example scope:** useMIDIInput MIDI note handler, device list change listener

### Listener Attachment & Re-attachment

- **Pattern:** Attach once on mount, update via refs (never re-attach on state change)
- **Rationale:** Eliminate dependency churn that forces re-attachment when isConnected or selectedDeviceId change
- **How:** Initialize listener in top-level useEffect (empty dependency array), store refs to state, update refs when state changes
- **Scope:** useMIDIInput device list listener (line 82-104) and note handler (line 140-201)

### Cleanup Strategy

- **Pattern:** Keep manual handler reset (`midiHandler.setNoteOnHandler(() => {})`)
- **Rationale:** Explicit, integrates cleanly with existing MIDIHandler API; not a blocker for memory leak fix
- **How:** Return cleanup function that calls setNoteOnHandler with no-op; ensure cleanup runs on unmount
- **Non-goal:** Do not migrate to AbortController in this phase

### Memory Verification

- **Approach:** Create `useMemoryProfiler` hook to count listener attachments
- **What it does:** Tracks how many times midiHandler.setNoteOnHandler is called; component displays listener count for debugging
- **Acceptance:** After fix, listener count stays 1 across config changes, device connects, and multi-session use
- **Scope:** New hook in `src/hooks/useMemoryProfiler.ts`; integrate into useMIDIInput for testing
- **Not a goal:** Full browser memory profiling; simple attachment counter is sufficient for verification

## Prior Decisions (From Project Level)

- **Core value:** Drummers must trust the real-time timing feedback. System must be rock-solid: accurate, responsive, free of timing artifacts.
- **Performance constraint:** MIDI event handlers must execute <1ms per event under 1000+ events/minute load
- **Reliability:** No stale closures, no silent failures, no listener accumulation over sessions

## Code Context & Reusable Assets

### Hot Paths (Lines to Focus On)

- `src/hooks/useMIDIInput.ts:82-104` — Device list change listener (dependency churn)
- `src/hooks/useMIDIInput.ts:140-201` — MIDI note handler (stale config closure risk)
- `src/components/VolumeKnob.tsx:88-122` — Document listeners during drag (conditional cleanup pattern)

### Existing Patterns to Reuse

- **useRef for state refs:** See `src/hooks/useGrooveEngine.ts` for examples of engine state via ref
- **useCallback with stale-prevention:** See `src/hooks/useMIDITracking.ts` for latency calculations
- **Event cleanup:** See `src/pages/ProductionPage.tsx` for window event cleanup patterns

### New Files to Create

- `src/hooks/useMemoryProfiler.ts` — Listener attachment counter hook

## Canonical References

**Mandatory reading for downstream agents:**

- `.planning/ROADMAP.md` (Phase 1 section) — Implementation approach and key files
- `.planning/REQUIREMENTS.md` (MEM-01, MEM-02, MEM-03) — Specific success criteria
- `CLAUDE.md` (Error Handling, Module Design sections) — Project patterns for cleanup and refs
- `src/hooks/useMIDIInput.ts` (lines 41-261) — Current implementation to fix
- `src/components/VolumeKnob.tsx` (lines 88-122) — Secondary listener pattern to review

### Implementation Approach

From ROADMAP.md, Phase 1 uses:
- useEffectEvent for handler functions (prevents dependency churn)
- AbortController pattern for cleanup
- Memory profiling hook to detect stacked listeners

**Note:** This context defers AbortController migration (see "Non-goals" below); manual cleanup is the chosen path.

## Specific Ideas

1. **Memory profiling hook output** — Component can log: `"MIDI listeners: 1 active"` for QA verification
2. **Test strategy** — Unit test with mock midiHandler, verify setNoteOnHandler called exactly once per mount
3. **Config ref structure** — Store entire MIDIConfig in ref to avoid "config might be stale" concerns in handler closures

## Deferred Ideas

- **AbortController migration** — Valuable cleanup pattern, but refactor scope is Phase 2+. Keep manual pattern for now.
- **VolumeKnob overhaul** — Document listener pattern is acceptable for Phase 1; can improve consistency in later phase.

## Claude's Discretion

- **Handler internal implementation** — How to structure the useRef pattern (single ref per handler vs registry) — planner chooses cleanest approach
- **Memory hook details** — Whether to export detailed metrics or just listener count — planner decides what's useful for tests
- **Testing tool** — Whether to use Vitest native or extend with memory utility — planner picks framework-native approach

---

*Phase: 01-react-cleanup*
*Context gathered: 2026-05-15*
