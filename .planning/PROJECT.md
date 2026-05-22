# Groovy MIDI Performance Tracking

## What This Is

Groovy is a drum tutorial web application that helps drummers learn by creating drum patterns, practicing them at variable tempos, and receiving real-time feedback. The MIDI integration allows drummers to connect their drums via MIDI and get live feedback on their timing accuracy — showing whether they're playing on-beat, rushing, or dragging compared to the metronome. Future phases will add note-by-note accuracy tracking and real-time mistake detection during playback.

## Core Value

Drummers must trust the real-time timing feedback to make effective practice decisions. The system must be rock-solid: accurate, responsive, and free of timing artifacts caused by memory leaks, stale configuration, or silent failures.

## Requirements

### Validated

- ✓ MIDI input detection and velocity filtering — existing
- ✓ BPM calculation from inter-onset intervals — existing
- ✓ Performance grading (Perfect/Good/Fair/Poor/Miss) — existing
- ✓ Real-time visual feedback on timing (on-time/slower/faster) — existing
- ✓ Latency compensation framework — existing
- ✓ Double-trigger suppression — existing

### Active

- [ ] Fix memory leak in useMIDIInput (Line 82-104) — device listeners re-attach repeatedly
- [ ] Fix config race condition (Line 203-235) — connectDevice captures stale config
- [ ] Remove 68 console.log statements blocking performance on slower devices
- [ ] Add type safety for LatencyCompensation.offsetMs to prevent NaN timing errors
- [ ] Fix VolumeKnob event listener cleanup (Line 88-122) — listeners persist on unmount
- [ ] Add error handling for AudioContext creation failure (DrumSynth.ts:53-63)
- [ ] Stabilize and verify MVP timing accuracy under load
- [ ] Document MIDI event pipeline and error boundaries

### Out of Scope

- Note-by-note accuracy tracking — Phase 2
- Real-time mistake detection — Phase 2+
- Multi-device support — Phase 2+
- Video sync — Future
- Mobile app — Future

## Context

**Current State:**
The MVP MIDI performance tracking is functionally complete but has critical stability issues. The codebase has been mapped (architecture, stack, concerns, structure documented). The 6 issues below are high-priority because they directly impact the core feedback loop: MIDI events fire at 1000+ events/minute during playing, and any memory leaks, stale config, or silent failures degrade the drummer's ability to trust the timing signal.

**Known Issues:**
1. **Memory Leak** — Event listeners attach multiple times due to useEffect dependency churn, creating stacked handlers that fire redundantly
2. **Config Race** — connectDevice closes over stale config in closure; rapid setting changes can lose user preferences
3. **Performance Regression** — 68 console.log statements throughout hot paths (MIDI event handlers fire hundreds per second)
4. **Type Unsafety** — LatencyCompensation.offsetMs can be undefined, leading to NaN calculations with no error handling
5. **Listener Cleanup** — VolumeKnob listeners persist on document if component unmounts mid-drag, accumulating over sessions
6. **Silent Failure** — AudioContext creation failure goes unhandled; no fallback or user feedback

**Tech Stack:**
- React 18 with TypeScript
- Web Audio API for synthesis
- Web MIDI API for input
- Vite for build
- Vitest for testing

## Constraints

- **Performance**: MIDI event handler code must execute <1ms per event (1000+ events/min during playing)
- **Reliability**: No stale closures, no silent failures, no listener accumulation over multi-session use
- **Timing Precision**: All timing calculations must be verified to ±5ms accuracy before shipping
- **Browser Compatibility**: Must work on Chrome/Edge (Web MIDI API standard), graceful degradation on others

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Fix MVP stability before Phase 2 features | High-frequency event handling demands rock-solid foundations | — Pending |
| Group related bugs (coarse granularity) | Parallelizable fix groups reduce cycle time | — Pending |
| Research React cleanup + MIDI patterns | Avoid common pitfalls in the fixes | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition:**
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone:**
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-14 after project initialization*
