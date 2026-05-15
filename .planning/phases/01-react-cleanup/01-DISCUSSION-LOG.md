# Phase 1: React Event Handler Cleanup - Discussion Log

**Date:** 2026-05-15
**Participants:** Adar (User), Claude (Facilitator)
**Phase:** 1 - React Event Handler Cleanup

## Discussion Summary

### Area 1: Handler Lifecycle Pattern
**Question:** How should handlers read fresh config without re-creating on every config change?

**Options Presented:**
- useRef + direct read pattern (selected)
- useCallback with dependencies
- Custom hook or ref stabilization

**Decision:** useRef + direct read pattern
- Store config in ref; handlers read latest from ref, never close over stale config
- Single attachment, no re-creation on config changes
- Applies to: useMIDIInput MIDI note handler, device list listener

**Rationale:** Prevents stale closures that plagued the original useCallback pattern; handlers always see fresh config.

---

### Area 2: MIDI Listener Dependencies  
**Question:** When should listeners re-attach vs update in-place?

**Options Presented:**
- Attach once on mount, update via refs (selected)
- Re-attach only when device actually changes
- Keep current pattern

**Decision:** Attach once on mount, update via refs
- Single attachment in useEffect with empty dependency array
- State changes (isConnected, selectedDeviceId) update refs, not re-attachment
- Applies to: useMIDIInput device list listener (lines 82-104) and note handler (lines 140-201)

**Rationale:** Eliminates dependency churn in lines 82-104 and 140-201; refs make state changes transparent without forcing re-attachment.

---

### Area 3: AbortController vs Manual Cleanup
**Question:** Cleanup strategy — manual handler reset vs AbortController?

**Options Presented:**
- Keep manual: setNoteOnHandler(() {}) (selected)
- Migrate to AbortController + addEventListener
- Hybrid: Refs + AbortController

**Decision:** Keep manual cleanup pattern
- Continue using midiHandler.setNoteOnHandler(() => {}) on unmount
- Explicit, integrates cleanly with existing MIDIHandler API
- Not a blocker for Phase 1 memory leak fix

**Rationale:** Keeps scope focused; AbortController migration is valuable but Phase 2+ work.

---

### Area 4: Memory Verification & Testing
**Question:** How to prove listeners attach exactly once per connection?

**Options Presented:**
- Memory profiling hook (selected)
- Unit tests + manual inspection
- Integration test + browser DevTools

**Decision:** Create useMemoryProfiler hook
- New hook in src/hooks/useMemoryProfiler.ts
- Tracks listener attachment count for debugging
- Component displays count (e.g., "MIDI listeners: 1 active")
- Verify count stays 1 across config changes, reconnects, multi-session use

**Rationale:** Simple, observable metric for acceptance testing; no need for full browser memory profiling.

---

## Deferred Ideas

- **AbortController cleanup refactor** — Valuable pattern, but Phase 2+ work
- **VolumeKnob listener consistency** — Document listener pattern OK for Phase 1; can improve in later phase
- **Full memory profiling UI** — Memory hook is diagnostic only, not user-facing

---

## Key Decisions Summary

| Decision | Chosen | Rationale |
|----------|--------|-----------|
| Handler pattern | useRef + direct reads | Avoid stale closures |
| Listener re-attachment | Once on mount + refs | Eliminate dependency churn |
| Cleanup strategy | Manual setNoteOnHandler | Scope-focused; API-clean |
| Verification approach | useMemoryProfiler hook | Simple, observable metric |

---

*Discussion completed: 2026-05-15*
*Facilitator: Claude*
*Next: Plan Phase 1*
