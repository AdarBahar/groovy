# Roadmap: Groovy MIDI Performance Tracking

**Milestone:** v1.0 — MVP Stability & MIDI Event Handling Foundation
**Created:** 2026-05-15
**Phases:** 6
**Requirements mapped:** 14/14 ✓

---

## Phase 1: React Event Handler Cleanup

**Goal:** Fix memory leaks in event listener lifecycle — prevent stacked handlers and listener accumulation

**Mode:** mvp

**Requirements:** MEM-01, MEM-02, MEM-03

**Success Criteria:**
1. useMIDIInput listeners attach once per device connection, verified with memory profiling hook
2. VolumeKnob document listeners clean up completely on unmount (no persistence on mid-drag exit)
3. No stale closures in event handlers — handlers read fresh state via refs/useEffectEvent pattern

**Key Files to Modify:**
- `src/hooks/useMIDIInput.ts` (lines 82-104)
- `src/components/production/VolumeKnob.tsx` (lines 88-122)

**Implementation Approach:**
- useEffectEvent for handler functions (prevents dependency churn)
- AbortController pattern for cleanup
- Memory profiling hook to detect stacked listeners

**Plans:** 2 plans

Plans:
- [ ] 01-01-PLAN.md — Refactor useMIDIInput.ts: ref-based config + state, empty-dep listener effects (MEM-01, MEM-03)
- [ ] 01-02-PLAN.md — Create useMemoryProfiler hook + Vitest tests for useMIDIInput and VolumeKnob (MEM-01, MEM-02, MEM-03)

---

## Phase 2: Config State Management

**Goal:** Eliminate config race conditions — connectDevice captures fresh config, not stale closure

**Mode:** mvp

**Requirements:** CFG-01, CFG-02

**Success Criteria:**
1. connectDevice reads latest config without closing over stale values
2. Rapid setting changes (BPM, swing, effects) apply consistently without losing preferences
3. Config race condition fix verified with rapid-change stress test

**Key Files to Modify:**
- `src/hooks/useMIDIInput.ts` (lines 203-235)
- `src/contexts/AppContext.tsx` (config provider)

**Implementation Approach:**
- Ref-based config pattern (store latest in ref, read in handlers)
- useEffectEvent for async device operations
- Stress test: rapid setting changes while device connected

---

## Phase 3: Performance — Remove Debug Logging

**Goal:** Eliminate 68 console.log statements from hot paths — target <1ms per MIDI event

**Mode:** mvp

**Requirements:** PERF-01, PERF-02

**Success Criteria:**
1. All console.log removed from MIDI event handlers and hot paths
2. MIDI event handler execution time <1ms under 1000+ events/minute load
3. Performance regression test added to prevent re-introduction

**Key Files to Modify:**
- `src/hooks/useMIDIInput.ts`
- `src/midi/PerformanceTracker.ts`
- `src/hooks/useMIDITracking.ts`
- Other hot-path files (identified via grep)

**Implementation Approach:**
- Conditional logging (dev-only gates)
- Remove console.log entirely from release paths
- Add performance benchmark test

---

## Phase 4: Type Safety — LatencyCompensation

**Goal:** Prevent NaN timing errors via discriminated union type for LatencyCompensation

**Mode:** mvp

**Requirements:** TYPE-01, TYPE-02

**Success Criteria:**
1. LatencyCompensation.offsetMs has type safety — undefined prevented via discriminated union
2. Timing calculations validated with `Number.isFinite()` before use
3. All timing arithmetic guarded against NaN propagation

**Key Files to Modify:**
- `src/midi/types.ts`
- `src/utils/latencyStorage.ts`
- `src/hooks/useMIDITracking.ts`

**Implementation Approach:**
- Discriminated union: `{ enabled: false } | { enabled: true; offsetMs: number }`
- `Number.isFinite()` guards before arithmetic
- Type test to ensure undefined offset fails compilation

---

## Phase 5: Error Handling — AudioContext & Graceful Failures

**Goal:** Handle AudioContext creation failure gracefully — no silent failures, user feedback

**Mode:** mvp

**Requirements:** ERR-01, ERR-02

**Success Criteria:**
1. AudioContext creation failure caught and logged (not silent)
2. User receives feedback if audio initialization fails
3. Timing signal doesn't corrupt if audio unavailable
4. All error paths logged and contained (no unhandled promise rejections)

**Key Files to Modify:**
- `src/audio/DrumSynth.ts` (lines 53-63)
- Error boundary wrapper if needed

**Implementation Approach:**
- Try-catch around AudioContext creation
- Fallback UI state or graceful degradation
- Error logging to console + user-facing message

---

## Phase 6: Verification & Documentation

**Goal:** Verify timing accuracy under load, document MIDI event pipeline and error boundaries

**Mode:** mvp

**Requirements:** VER-01, VER-02, VER-03

**Success Criteria:**
1. Memory profiling hook confirms no listener leaks across 1-hour session
2. Timing accuracy verified to ±5ms under 1000+ MIDI events/minute load
3. MIDI event pipeline documented (input → filters → latency compensation → audio)
4. Error boundaries documented and tested

**Key Files:**
- `.planning/MIDI_EVENT_PIPELINE.md` (new documentation)
- Memory profiling test
- Timing accuracy benchmark test

**Implementation Approach:**
- Create memory profiling hook
- Add timing accuracy benchmark test
- Document MIDI pipeline in .planning/
- Error scenario testing

---

## Phase Breakdown

| Phase | Name | Goal | Requirements | Complexity |
|-------|------|------|--------------|------------|
| 1 | React Cleanup | Fix memory leaks | MEM-01, MEM-02, MEM-03 | Medium |
| 2 | Config State | Eliminate race conditions | CFG-01, CFG-02 | Medium |
| 3 | Performance | Remove console.log | PERF-01, PERF-02 | Low |
| 4 | Type Safety | LatencyCompensation types | TYPE-01, TYPE-02 | Medium |
| 5 | Error Handling | AudioContext & graceful failures | ERR-01, ERR-02 | Low |
| 6 | Verification | Timing accuracy & docs | VER-01, VER-02, VER-03 | High |

---

## Success Criteria (Milestone)

All requirements implemented and verified:
- ✓ No memory leaks (listeners attach once)
- ✓ No config race conditions (fresh config in handlers)
- ✓ <1ms event handler execution
- ✓ Type-safe timing calculations
- ✓ No silent failures (error handling)
- ✓ ±5ms timing accuracy verified
- ✓ MIDI pipeline documented

---

*Roadmap created: 2026-05-15*
*Last updated: 2026-05-15 after initialization*
