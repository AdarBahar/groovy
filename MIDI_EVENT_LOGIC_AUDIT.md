# MIDI Event Logic Audit

**Status**: Partial implementation. Core hit detection works, but noise filtering and advanced timing features are missing.

---

## A) Hit Detection

**Specification**: Accept Note On with velocity 1–127. Ignore Note Off and Note On velocity 0.

**Current Implementation**: ✅ **COMPLIANT**
- `MIDIHandler.ts:33-38` correctly filters:
  - Note On (0x90) with velocity > 0 → `handleNoteOn()`
  - Note On with velocity 0 → treated as Note Off
  - Note Off (0x80) → ignored for timing

**Code**:
```typescript
case 0x90: // Note ON
  if (velocity > 0) {
    this.handleNoteOn(note, velocity, event.timeStamp);
  } else {
    this.handleNoteOff(note, event.timeStamp);
  }
```

---

## B) Velocity Thresholds (Noise Filtering)

**Specification**: Per-pad minimum velocity to reject vibration/crosstalk:
- Kick/Snare/Toms: ignore < 3–6
- Cymbals/Hi-hat: ignore < 2–5

**Current Implementation**: ❌ **NOT IMPLEMENTED**

No velocity filtering exists. All Note On events with velocity ≥ 1 are accepted.

**Impact**: Low-velocity noise events (especially from cymbals and hi-hats) will trigger false hits and degrade timing accuracy.

**Recommendation**:
1. Add velocity thresholds to `MIDIConfig`
2. Create a `VelocityFilter` class in `src/midi/`
3. Filter in `useMIDIInput.ts` before emitting `midi-note-hit` event
4. Allow per-kit or global configuration

---

## C) De-bounce / Double-Trigger Suppression

**Specification**: Per-note refractory window:
- Snare/Toms: 10–18 ms
- Kick: 15–25 ms
- Cymbals/Ride/Crash: 25–50 ms
- Hi-hat edge/bow: 15–30 ms

**Current Implementation**: ❌ **NOT IMPLEMENTED**

No de-bounce logic. Duplicate hits within milliseconds are treated as separate events.

**Impact**: Quick cymbal hits or hardware bounces create phantom hits that corrupt timing accuracy.

**Recommendation**:
1. Create `DoubleTriggerFilter` class
2. Track `lastHitTime[note]` per MIDI note
3. Compare timestamps and suppress if within refractory window
4. Allow selecting by note or by `DrumVoice` (can map notes to voice, then to window)
5. Implement in `useMIDIInput.ts` after velocity filter

---

## D) Hi-Hat Openness Thresholds (CC4)

**Specification**:
- Receive CC4 (controller 0x04) for pedal position
- Closed: CC4 ≤ 15
- Semi: 16–79
- Open: ≥ 80
- Associate CC4 with strike within [-30 ms, +10 ms] window

**Current Implementation**: ❌ **NOT IMPLEMENTED**

Control Change events are received (`MIDIHandler.ts:45-46`), but:
- No CC4 state tracking
- No hi-hat openness classification
- No temporal association with strikes
- UI/MIDI feedback ignores hi-hat state

**Impact**: Hi-hat hits are indistinguishable from fully closed to fully open.

**Recommendation**:
1. Create `HiHatController` class
2. Track `lastCC4Value` and `lastCC4Time`
3. On hi-hat strike, sample CC4 within [-30, +10 ms]
4. Create `HiHatState` type: `'closed' | 'semi' | 'open'`
5. Include in `midi-note-hit` event detail: `{ voice, velocity, timestamp, hiHatState? }`
6. Update `useMIDITracking` to use state in note accuracy calculation

---

## E) Cymbal Choke (Aftertouch / Poly Pressure)

**Specification**:
- Treat poly pressure ≥ 64 as "choke engaged"
- value 0 as "choke released"
- Choke is a state change, not a hit

**Current Implementation**: ❌ **NOT IMPLEMENTED**

Aftertouch messages (0xA0) are not handled. Only Note On/Off and CC (0xB0) are processed.

**Impact**: Cymbal choke/mute feedback is unavailable.

**Recommendation**:
1. Add aftertouch handler to `MIDIHandler.ts`:
   ```typescript
   case 0xa0: // Poly Pressure / Aftertouch
     this.handleAftertouch(note, velocity, event.timeStamp);
   ```
2. Create `CymbalChokeTracker` to track per-note choke state
3. Update note mapping to identify cymbals (crash, ride, etc.)
4. Emit `midi-cymbal-choke` custom event
5. Update UI feedback to show choke state

---

## Timing & Tempo: Hit Accuracy Calculation

### 1) Monotonic High-Resolution Timestamps

**Specification**: Use monotonic clock, not MIDI message ordering.

**Current Implementation**: ✅ **COMPLIANT**
- `MIDIHandler.ts:34` uses `event.timeStamp` (high-resolution timestamp from Web MIDI API)
- Not relying on message order

---

### 2) Pulse Source Selection

**Specification**: Pick one of:
- Kick only (simplest, most stable)
- Hi-hat only (if playing steady eighths)
- Any hit + inference logic (harder)

**Current Implementation**: ❌ **NOT IMPLEMENTED**

`PerformanceTracker.ts` treats all hits equally. No pulse detection or tempo inference.

**Impact**: Timing feedback doesn't distinguish between intentional beat references and fills/off-beats.

**Recommendation**:
1. Add `pulseSource` to `PerformanceTracker` config
2. Filter which voices count toward beat detection
3. Example: `pulseSource: 'kick-drum' | 'hi-hat' | 'any'`
4. Only analyze hits from selected source for tempo/timing

---

### 3) Beat Matching Window (Grading)

**Specification**:
- On time: |Δ| ≤ 20 ms
- Slightly early/late: 20–40 ms
- Early/late: 40–80 ms
- Very off: > 80 ms

**Current Implementation**: ⚠️ **PARTIAL**

`PerformanceTracker.ts:123-139` uses:
- Max error = quarter beat (≈250 ms at 120 BPM)
- Scales 0–100% accuracy linearly over that window

**Mismatch**: The grading bands are much tighter (20, 40, 80 ms) than the quarter-beat window (250 ms).

**Current Formula**:
```typescript
const maxError = beatDurationMs / 4;  // 250 ms at 120 BPM
const accuracy = Math.max(0, 100 - (timingError / maxError) * 100);
```

**Recommended Fix**:
```typescript
const timingError = Math.abs(elapsedMs - expectedTime);
let accuracy: number;

if (timingError <= 20) accuracy = 100;           // Perfect
else if (timingError <= 40) accuracy = 75;       // Good
else if (timingError <= 80) accuracy = 50;       // Fair
else if (timingError <= 150) accuracy = 25;      // Poor
else accuracy = 0;                               // Miss
```

---

### 4) Latency Compensation

**Specification**:
- Have user tap ~20 hits exactly on click
- Measure median Δ
- Subtract as constant offset to all hits

**Current Implementation**: ❌ **NOT IMPLEMENTED**

No calibration UI or offset compensation.

**Impact**: If computer's audio output has 50 ms latency, all hits will appear 50 ms late.

**Recommendation**:
1. Create `LatencyCalibration` component (React)
2. Show metronome click in-browser
3. Collect 20 taps from user
4. Compute median offset
5. Store in `MIDIConfig`
6. Apply in `useMIDITracking.ts` before dispatching events:
   ```typescript
   const calibratedTimestamp = timestamp - (config.latencyOffsetMs || 0);
   ```

---

### 5) Drummer's Tempo Estimation

**Specification**:
- Track inter-onset intervals (IOI) from pulse source
- Convert to BPM
- Use median over last N (8–16)
- Compare to metronome BPM

**Current Implementation**: ❌ **NOT IMPLEMENTED**

No IOI tracking or tempo inference. Only compares each hit to expected beat positions.

**Recommendation**:
1. Create `TempoEstimator` class
2. Track `lastHitTime[pulseNote]`
3. On each pulse hit, compute `IOI = timestamp - lastHitTime`
4. Keep rolling buffer of last 16 IOIs
5. Calculate `BPM = 60 / median(IOI_ms) * 1000`
6. Compare to metronome BPM; emit tempo tracking event
7. Use for UI feedback: "Running 4 BPM fast"

---

## Summary Table

| Feature | Spec | Implemented | Priority |
|---------|------|-------------|----------|
| Hit Detection (Note On velocity > 0) | A | ✅ Yes | — |
| Velocity Thresholds | B | ❌ No | **High** |
| De-bounce / Double-Trigger | C | ❌ No | **High** |
| Hi-Hat Openness (CC4) | D | ❌ No | **Medium** |
| Cymbal Choke (Aftertouch) | E | ❌ No | **Medium** |
| Monotonic Timestamps | 1 | ✅ Yes | — |
| Pulse Source Selection | 2 | ❌ No | **Medium** |
| Beat Matching Window | 3 | ⚠️ Partial | **High** |
| Latency Compensation | 4 | ❌ No | **High** |
| Tempo Estimation | 5 | ❌ No | **Medium** |

---

## Recommended Implementation Order

1. **Velocity Thresholds** (High)
   - Quick wins; prevents obvious false hits
   - 1–2 hours

2. **De-bounce Filter** (High)
   - Eliminates double-triggers; improves timing stability
   - 1–2 hours

3. **Beat Matching Window Fix** (High)
   - Aligns timing feedback with user expectations
   - 30 minutes

4. **Latency Compensation** (High)
   - Calibration UI + integration
   - 2–3 hours

5. **Tempo Estimation** (Medium)
   - Nice-to-have for "running fast/slow" feedback
   - 1–2 hours

6. **Hi-Hat Openness** (Medium)
   - More nuanced performance tracking
   - 2 hours

7. **Cymbal Choke** (Medium)
   - Niche but useful for advanced players
   - 1 hour

---

## Files to Create/Modify

### New Files (src/midi/)
- `VelocityFilter.ts` – Per-pad velocity thresholds
- `DoubleTriggerFilter.ts` – Refractory window suppression
- `HiHatController.ts` – CC4 state tracking and association
- `CymbalChokeTracker.ts` – Poly pressure handling
- `TempoEstimator.ts` – IOI-based BPM tracking

### Modified Files
- `MIDIHandler.ts` – Add aftertouch case (0xA0)
- `PerformanceTracker.ts` – Update beat matching window, add pulse filtering
- `useMIDIInput.ts` – Integrate filters; dispatch enhanced event data
- `useMIDITracking.ts` – Apply latency offset; track tempo

### New UI Components
- `LatencyCalibrationModal.tsx` – Calibration workflow

---

## Testing Recommendations

1. **Unit Tests**: Add to existing test files
   - `VelocityFilter.test.ts`
   - `DoubleTriggerFilter.test.ts`
   - `TempoEstimator.test.ts`

2. **Integration Test**: Simulate realistic drum machine input
   - E.g., `MIDIEventReplay.test.ts` – replay captured MIDI session

3. **Manual Testing**: Use a real e-drum kit
   - Verify thresholds don't suppress intentional light hits
   - Check de-bounce doesn't affect rapid legitimate rolls
   - Calibrate latency with your hardware setup

---

**Generated**: $(date)
**Audit Status**: Comprehensive review of hit detection, filtering, and timing logic.
