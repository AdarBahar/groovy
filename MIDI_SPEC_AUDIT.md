# MIDI BPM Calculation & Timing Spec Audit
**Date**: 2026-02-25
**Spec Reference**: GitHub Issue #264 - Real-Time MIDI Tempo and Timing Tracking
**Repository**: Current: groovy | Spec Source: portfolio-tracker/issues/264

---

## Executive Summary

The current implementation has **several gaps** compared to the spec:

1. ❌ **No proper beat offset grid** - Missing swing/division-aware quantization grid
2. ❌ **No performed BPM estimation** - Currently lacks EWMA-smoothed tempo tracking from actual hits
3. ⚠️ **Incomplete swing handling** - Swing is applied but not integrated into quantization grid
4. ⚠️ **Beat-based quantization instead of step-based** - Uses beat level, not per-division steps
5. ⚠️ **Static grading bands** - Not dynamically adjusted for beat duration
6. ⚠️ **BPM auto speed-up not reflected in tracker** - Tracker still uses initial tempo when tempo changes
7. ✅ **Time signature support** - Correctly implemented
8. ✅ **Timing error calculation** - Uses signed errors (negative=slow, positive=fast)

---

## Detailed Findings

### 1. Beat Duration Calculation ✅ CORRECT

**Spec requirement (Section 1):**
```
beatDurMs = 60000 / bpm
```

**Current implementation:**
[useMIDITracking.ts:59](src/hooks/useMIDITracking.ts#L59)
```typescript
const beatDurationMs = (60 / groove.tempo) * 1000;
```

**Status**: ✅ Correct. Formula matches spec exactly.

---

### 2. Supported Divisions ⚠️ PARTIAL IMPLEMENTATION

**Spec requirement (Section 2):**
Map divisions to steps per beat:
- 1/8 → 2 steps
- 1/16 → 4 steps
- 1/32 → 8 steps
- 1/8T → 3 steps
- 1/16T → 6 steps

**Current implementation:**
[PerformanceTracker.ts:162](src/midi/PerformanceTracker.ts#L162)
```typescript
const stepsPerBeat = this.division / this.timeSignature.noteValue;
```

**Issues**:
- ❌ No mapping table for recognized divisions
- ❌ Division calculation is indirect (pattern.division is stored raw, not normalized)
- ⚠️ Triplet divisions handled implicitly, not via explicit mapping
- **What is stored in `pattern.division`?** Code shows values like 4, 8, 12, 16, 24, 32, 48 but unclear if these are:
  - Steps per measure?
  - Steps per bar?
  - Something else?

**Recommendation**: Add explicit division-to-steps mapping and document what `division` actually represents.

---

### 3. Swing Handling ⚠️ INCOMPLETE

**Spec requirement (Section 3):**
- User range: 0 → 0.33
- Normalize: `s = clamp(swingRatio / 0.33, 0, 1)`
- Offbeat position: `offbeatFraction = 0.5 + s * (1/6)`
- Apply only to even-step divisions (2, 4, 8)

**Current implementation:**
[PlaybackControls.tsx:59-62](src/components/production/PlaybackControls.tsx#L59-L62)
```typescript
const swingToDisplay = (v: number) => Math.round(50 + v / 6);
const swingToInternal = (v: number) => Math.min(100, Math.max(0, Math.round((v - 50) * 6)));
```

**Issues**:
- ✅ Display conversion correct (50-67% DAW convention)
- ✅ Internal storage 0-100 (matches 0-0.33 spec range scaled)
- ❌ **Swing is NOT applied to quantization grid** in PerformanceTracker
- ❌ Missing implementation in `calculateTimingAccuracy()` to adjust beat offsets by swing amount
- ⚠️ Swing affects playback audio but NOT the timing grid used for MIDI hit analysis

**Current swing integration**: Swing is passed to groove engine but not used when calculating expected hit times.

**Recommendation**: Build beat offset grid that accounts for swing when quantizing MIDI hits.

---

### 4. Beat Offset Grid Building ❌ NOT IMPLEMENTED

**Spec requirement (Section 4):**

For triplet divisions:
```
offset[i] = (i * beatDurMs) / stepsPerBeat
```

For straight divisions with swing:
```
pairLenMs = beatDurMs / (stepsPerBeat / 2)
offset[i] = pairStart + offbeatFraction * pairLenMs
```

**Current implementation:**
[PerformanceTracker.ts:195-198](src/midi/PerformanceTracker.ts#L195-L198)
```typescript
const stepNumber = Math.round(elapsedMs / stepDurationMs);
const expectedTime = stepNumber * stepDurationMs;
const timingError = Math.abs(elapsedMs - expectedTime);
```

**Issues**:
- ❌ No offset array built
- ❌ Grid is always linear: `offset = i * stepDurationMs`
- ❌ Swing modifications not applied
- ❌ **Signed timing error lost** when taking absolute value

**This is a critical gap** - the quantization grid doesn't match the audio grid when swing is applied.

---

### 5. Quantizing a Hit ⚠️ USES ABSOLUTE ERROR

**Spec requirement (Section 5):**
```
beatIndex = floor((tMs - t0) / beatDurMs)
beatStart = t0 + beatIndex * beatDurMs
x = tMs - beatStart
tExpected = beatStart + nearestOffset
errorMs = tMs - tExpected  (SIGNED)
```

**Current implementation:**
[PerformanceTracker.ts:186-198](src/midi/PerformanceTracker.ts#L186-L198)

```typescript
const elapsedMs = timestamp - this.startTime;
const beatDurationMs = (60 / this.tempo) * 1000;
const stepsPerBeat = this.division / this.timeSignature.noteValue;
const stepDurationMs = beatDurationMs / stepsPerBeat;

const stepNumber = Math.round(elapsedMs / stepDurationMs);
const expectedTime = stepNumber * stepDurationMs;
const timingError = Math.abs(elapsedMs - expectedTime);  // ❌ ABSOLUTE!
```

**Issues**:
- ❌ Uses `Math.abs()` - loses sign information (slow vs fast)
- ❌ Returns only 0-100 grading, not signed milliseconds
- ⚠️ Signed error is recalculated separately in `useMIDITracking.ts:62` as a workaround

**Workaround found:**
[useMIDITracking.ts:57-62](src/hooks/useMIDITracking.ts#L57-L62)
```typescript
const elapsedMs = timestamp - playStartTimeRef.current!;
const beatDurationMs = (60 / groove.tempo) * 1000;
const beatNumber = Math.round(elapsedMs / beatDurationMs);
const expectedTime = beatNumber * beatDurationMs;
const signedTimingError = elapsedMs - expectedTime;
```

**Problem**: This recalculation uses beat-level quantization, not step-level. If swing is active, this won't match the audio grid.

---

### 6. Hit Classification ⚠️ USES FIXED BANDS

**Spec requirement (Section 6):**
```
if abs(errorMs) > acceptWindowMs → ignored
else if errorMs < -onTimeMs     → early
else if errorMs > onTimeMs      → late
else                            → on-time
```

Recommended defaults:
```
acceptWindowMs = min(90, beatDurMs * 0.18)
onTimeMs       = min(25, beatDurMs * 0.05)
```

**Current implementation:**
[PerformanceTracker.ts:200-220](src/midi/PerformanceTracker.ts#L200-L220)

```typescript
if (timingError <= 20) {
  accuracy = 100;
} else if (timingError <= 40) {
  accuracy = 75;
} else if (timingError <= 80) {
  accuracy = 50;
} else if (timingError <= 150) {
  accuracy = 25;
} else {
  accuracy = 0;
}
```

**Issues**:
- ✅ Uses practical bands (20ms, 40ms, 80ms, 150ms)
- ❌ **Bands are HARDCODED, not calculated from beat duration**
- ❌ At 60 BPM: beatDur = 1000ms, so `acceptWindow = min(90, 180) = 90ms` ✓ matches impl
- ❌ At 240 BPM: beatDur = 250ms, so `acceptWindow = min(90, 45) = 45ms` ✗ uses 150ms
- ⚠️ Thresholds should scale with tempo but don't

**Recommendation**: Make grading bands tempo-aware.

---

### 7. Performed BPM Estimation ❌ NOT IMPLEMENTED

**Spec requirement (Section 7):**

Track global step index `g` and estimate:
```
secondsPerStep = (tMs - t0) / g
bpmEst = bpmEst + alpha * (targetBpm - bpmEst)
```

Where `alpha = 0.02 – 0.08` (EWMA smoothing).

**Current implementation**: **None found**

**Current approach**:
- No performed BPM tracking
- No EWMA smoothing
- No per-step indexing

**Missing features**:
- ❌ Global step counter across performance
- ❌ Drift estimation from grid
- ❌ EWMA smoothing for stability
- ❌ Integration with auto speed-up (see below)

---

### 8. BPM Auto Speed-Up Integration ❌ CRITICAL GAP

**Issue requirement**: "When playback is with BPM auto speed up, the calculation should be updated with the changes of BPM"

**Current flow:**
1. [useAutoSpeedUp.ts:129](src/hooks/useAutoSpeedUp.ts#L129) calls `onTempoChange(newTempo)`
2. [ProductionPage.tsx:213-217](src/pages/ProductionPage.tsx#L213-L217) updates groove state:
   ```typescript
   onTempoChange: (tempo) => {
     const newGroove = { ...groove, tempo };
     setGroove(newGroove);
   }
   ```
3. [PerformanceTracker.ts:44](src/midi/PerformanceTracker.ts#L44) has `private tempo` but is NOT updated after enable()
4. ❌ **PerformanceTracker uses stale tempo** after speed-up changes it

**Timeline:**
- T=0: `performanceTracker.enable(pattern, 120, startTime)` → tempo set to 120
- T=2min: Auto speed-up calls `onTempoChange(125)` → groove.tempo updated to 125
- T=2min: MIDI hit arrives → PerformanceTracker still uses `this.tempo = 120` ❌

**Workaround in useMIDITracking:**
[useMIDITracking.ts:59](src/hooks/useMIDITracking.ts#L59)
```typescript
const beatDurationMs = (60 / groove.tempo) * 1000;
```

Uses `groove.tempo` (current) instead of tracker's tempo, but this is inconsistent.

**Missing**:
- ❌ PerformanceTracker needs tempo callback or real-time sync
- ❌ No way to update tempo after `enable()` is called
- ❌ Tracker's timing calculations use stale tempo value

---

### 9. Time Signature Handling ✅ IMPLEMENTED

**Spec requirement (Section 8):**
- Numerator: 2–15
- Denominator: 4, 8, 16
- Bar duration: `barDurMs = beatDurMs * numerator`

**Current implementation:**
[PerformanceTracker.ts:162-167](src/midi/PerformanceTracker.ts#L162-L167)
```typescript
const stepsPerBeat = this.division / this.timeSignature.noteValue;
const stepDurationMs = beatDurationMs / stepsPerBeat;

const measureLength = (this.division / this.timeSignature.noteValue) * this.timeSignature.beats;
return stepNumber % measureLength;
```

**Status**: ✅ Correct implementation. Handles numerator and denominator per spec.

---

### 10. Practical Stability Recommendations ⚠️ PARTIAL

**Spec requirement (Section 9):**
- ✅ Ignore low velocity hits → Implemented via VelocityFilter
- ❌ Optionally ignore toms/crashes → Not implemented
- ❌ Require minimum accepted hits before switching modes → Not applicable (modes don't switch)
- ❌ Lock division for one bar → Not applicable
- ❌ Reset estimator after pauses → Not applicable (no estimator)

---

## Summary Table

| Requirement | Status | Notes |
|---|---|---|
| Beat duration formula | ✅ | Correct: `beatDurMs = 60000 / bpm` |
| Supported divisions mapping | ⚠️ | Implicit, not explicit; unclear what `division` represents |
| Swing model (0-0.33 → display 50-67%) | ⚠️ | UI correct, but NOT applied to quantization grid |
| Build beat offset grid | ❌ | No offset array; grid always linear |
| Quantize hits to grid | ⚠️ | Uses absolute error; beat-level not step-level |
| Hit classification bands | ⚠️ | Hardcoded; not tempo-scaled |
| Performed BPM estimation (EWMA) | ❌ | Completely missing |
| BPM auto speed-up sync | ❌ | CRITICAL: Tracker uses stale tempo after speed-up |
| Time signature handling | ✅ | Correct |
| Stability recommendations | ⚠️ | Velocity filtering only |

---

## Impact Assessment

### High Priority Gaps

1. **BPM Auto Speed-Up Sync** (CRITICAL)
   - When tempo changes during playback, tracker doesn't know
   - Timing calculations become increasingly inaccurate
   - Affects: Performance scoring, timing display

2. **Beat Offset Grid with Swing**
   - Swing affects audio playback but not timing analysis
   - Swung notes scored incorrectly as "late" or "early"
   - Affects: Accuracy of MIDI hit classification when swing is active

3. **Performed BPM Estimation**
   - Cannot detect if drummer is speeding up/slowing down
   - Missing drift visualization
   - Affects: User feedback, learning experience

### Medium Priority Gaps

4. **Tempo-Aware Grading Bands**
   - At fast tempos (240+ BPM), thresholds too lenient
   - At slow tempos (60-80 BPM), thresholds too strict
   - Should scale: `acceptWindow = min(90, beatDurMs * 0.18)`

5. **Signed Error Integration**
   - Workaround recalculates error at beat level
   - Should be step-level and passed from PerformanceTracker
   - Affects: Accuracy of speed/lag detection

---

## Recommended Fixes

### Phase 1: Fix Critical Auto Speed-Up Bug
- Add method to PerformanceTracker: `setTempo(tempo: number): void`
- Call from ProductionPage when auto speed-up fires
- Update beat duration calculations in real-time

### Phase 2: Implement Beat Offset Grid
- Build offset array in PerformanceTracker on each enable()
- Account for division, time signature, and swing
- Use for quantization instead of linear `i * stepDuration`

### Phase 3: Add Performed BPM Tracking
- Track global step count across performance
- Calculate `secondsPerStep = (tMs - t0) / stepCount`
- Apply EWMA smoothing with alpha = 0.05
- Expose for UI visualization

### Phase 4: Tempo-Aware Grading
- Replace hardcoded thresholds with spec formulas
- `acceptWindow = min(90, beatDurMs * 0.18)`
- `onTimeMs = min(25, beatDurMs * 0.05)`

---

## References

- **Spec**: https://github.com/AdarBahar/portfolio-tracker/issues/264
- **Key Files**:
  - [src/midi/PerformanceTracker.ts](src/midi/PerformanceTracker.ts) - Core timing logic
  - [src/hooks/useMIDITracking.ts](src/hooks/useMIDITracking.ts) - Integration point
  - [src/hooks/useAutoSpeedUp.ts](src/hooks/useAutoSpeedUp.ts) - Speed-up logic
  - [src/components/production/PlaybackControls.tsx](src/components/production/PlaybackControls.tsx) - Tempo UI
