# Requirements: Groovy MIDI Performance Tracking

**Defined:** 2026-05-15
**Core Value:** Drummers must trust the real-time timing feedback to make effective practice decisions. The system must be rock-solid: accurate, responsive, and free of timing artifacts caused by memory leaks, stale configuration, or silent failures.

## v1 Requirements

MVP Stability Phase — Fix 6 critical MIDI event handling bugs before shipping Phase 2 features.

### Memory & Cleanup

- [ ] **MEM-01**: useMIDIInput event listeners attach exactly once per device, not repeatedly on dependency churn
- [ ] **MEM-02**: VolumeKnob document listeners clean up on unmount, preventing accumulation over sessions
- [ ] **MEM-03**: No stale closures in event handler lifecycle — handlers read fresh state without re-creation

### Config & State

- [ ] **CFG-01**: connectDevice handler doesn't capture stale config in closure — reads fresh config on each call
- [ ] **CFG-02**: Rapid setting changes don't lose user preferences — config ref pattern prevents race conditions

### Performance

- [ ] **PERF-01**: Remove 68 console.log statements from hot MIDI paths (handlers fire 1000+/minute)
- [ ] **PERF-02**: MIDI event handler code executes <1ms per event under load

### Type Safety & Error Handling

- [ ] **TYPE-01**: LatencyCompensation.offsetMs has type safety — undefined prevented via discriminated union
- [ ] **TYPE-02**: Timing calculations guarded against NaN — `Number.isFinite()` validation on arithmetic results
- [ ] **ERR-01**: AudioContext creation failure handled gracefully — fallback or user feedback, no silent failure
- [ ] **ERR-02**: Error handling prevents timing signal corruption — all errors logged and contained

### Verification

- [ ] **VER-01**: Memory profiling hook detects listener leaks — no stacked handlers firing redundantly
- [ ] **VER-02**: Timing accuracy verified to ±5ms before shipping — measured under load
- [ ] **VER-03**: MIDI event pipeline documented and error boundaries defined

## v2 Requirements

Phase 2+ features (deferred until MVP stability achieved).

### Accuracy Tracking

- **ACC-01**: Note-by-note accuracy — identify which drum pads user hit vs notation
- **ACC-02**: Real-time mistake detection — flag wrong notes during playback
- **ACC-03**: Performed BPM estimation — detect drummer speeding up/slowing down

### Advanced Features

- **ADV-01**: Multi-device support — switch between multiple MIDI devices mid-session
- **ADV-02**: Hi-hat openness tracking via CC4 pedal
- **ADV-03**: Cymbal choke detection via aftertouch
- **ADV-04**: Advanced filter configuration UI — adjust velocity thresholds & de-bounce windows

### Future (Out of Scope for this milestone)

- **FUT-01**: Video sync with audio/MIDI
- **FUT-02**: Mobile app
- **FUT-03**: Cloud progress sync

## Out of Scope

| Feature | Reason |
|---------|--------|
| Note-by-note accuracy tracking | Phase 2+ — requires confidence in timing baseline first |
| Real-time mistake detection | Phase 2+ — builds on accurate timing |
| Multi-device support | Phase 2+ — MVP single-device only |
| Video sync | Future — architectural work after MVP stable |
| Mobile app | Future — web-first, then mobile |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| MEM-01 | Phase 1 | Pending |
| MEM-02 | Phase 1 | Pending |
| MEM-03 | Phase 1 | Pending |
| CFG-01 | Phase 2 | Pending |
| CFG-02 | Phase 2 | Pending |
| PERF-01 | Phase 3 | Pending |
| PERF-02 | Phase 3 | Pending |
| TYPE-01 | Phase 4 | Pending |
| TYPE-02 | Phase 4 | Pending |
| ERR-01 | Phase 5 | Pending |
| ERR-02 | Phase 5 | Pending |
| VER-01 | Phase 6 | Pending |
| VER-02 | Phase 6 | Pending |
| VER-03 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 14 total
- Mapped to phases: 14
- Unmapped: 0 ✓

---
*Requirements defined: 2026-05-15*
*Last updated: 2026-05-15 after project initialization*
