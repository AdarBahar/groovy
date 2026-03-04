# MIDI Timing Accuracy Debug Guide

**Enhanced Debugging**: Added detailed console logging to trace the timing calculation flow.

## Console Log Sequence

When you hit a MIDI note on beat, you should see this sequence of logs:

### 1. MIDI Input Phase
```
✅ MIDI: Note 46 → hi-hat-open (velocity: 80)
```
The keyboard input was received and mapped to a voice.

### 2. Timing Calculation Phase
```
⏱️ Timing: elapsed=500ms, beat=1, expected=500ms, error=0ms, tempo=120BPM, analysis=100
```

**Key values**:
- `elapsed`: Time since playback started (ms)
- `beat`: Which beat number we're on
- `expected`: Expected time for that beat
- `error`: Difference (negative=slow, positive=fast)
- `tempo`: Current BPM
- `analysis`: Overall accuracy score (0-100)

### 3. Scaling Phase
```
📊 Timing Accuracy: error=0ms, quarterBeat=125ms, scaled=0, rounded=0
```

**Key values**:
- `error`: Signed timing error in milliseconds
- `quarterBeat`: Quarter note duration at current tempo
- `scaled`: -100 to +100 scale (before rounding)
- `rounded`: Final accuracy value (-100 to +100)

### 4. UI Update Phase
```
🎯 Timing Indicator: accuracy=0, position=50%, label=On-Time, color=var(--timing-perfect)
```

**Key values**:
- `accuracy`: Final value being displayed (-100 to +100)
- `position`: Where dot appears (0%=slow, 50%=on-time, 100%=fast)
- `label`: Text shown (Slow, On-Time, Fast)
- `color`: CSS variable for color (green=perfect, red=slow/fast)

---

## Testing Procedure

### Step 1: Open Console & Filter Logs
```javascript
// In DevTools console, filter for debugging:
// - Type "⏱️" to see timing logs
// - Type "📊" to see accuracy logs
// - Type "🎯" to see indicator logs
```

### Step 2: Start Playback
1. Create a simple 1/8 note groove
2. Click **Play**
3. Enable **MIDI Tracking**

### Step 3: Hit On Beat
- Press **Space** (hi-hat) exactly when you hear the metronome click
- Watch console for the four-phase log sequence

### Step 4: Analyze the Logs

**Example - Perfect On-Time Hit**:
```
⏱️ Timing: elapsed=500ms, beat=1, expected=500ms, error=0ms, tempo=120BPM, analysis=100
📊 Timing Accuracy: error=0ms, quarterBeat=125ms, scaled=0, rounded=0
🎯 Timing Indicator: accuracy=0, position=50%, label=On-Time, color=var(--timing-perfect)
```

**Expected**: Green "On-Time" centered

---

**Example - Slow Hit (50ms late)**:
```
⏱️ Timing: elapsed=550ms, beat=1, expected=500ms, error=50ms, tempo=120BPM, analysis=60
📊 Timing Accuracy: error=50ms, quarterBeat=125ms, scaled=40, rounded=40
🎯 Timing Indicator: accuracy=40, position=70%, label=Fast, color=var(--timing-warning)
```

**Expected**: Amber/Red "Fast" positioned right (because 50ms error scales to +40)

---

**Example - Actually Slow Hit (50ms early, -50ms)**:
```
⏱️ Timing: elapsed=450ms, beat=1, expected=500ms, error=-50ms, tempo=120BPM, analysis=60
📊 Timing Accuracy: error=-50ms, quarterBeat=125ms, scaled=-40, rounded=-40
🎯 Timing Indicator: accuracy=-40, position=30%, label=Slow, color=var(--timing-warning)
```

**Expected**: Amber/Red "Slow" positioned left

---

## Verification Checklist

- [ ] **Perfect hit (0ms error)** → accuracy=0, position=50%, label="On-Time", green
- [ ] **Slow hit (-50ms)** → accuracy=-40, position=30%, label="Slow", red
- [ ] **Fast hit (+50ms)** → accuracy=+40, position=70%, label="Fast", red
- [ ] **Very slow (-125ms)** → accuracy=-100, position=0%, label="Slow", red
- [ ] **Very fast (+125ms)** → accuracy=+100, position=100%, label="Fast", red

---

## Common Issues

### Issue 1: All hits show "error=0ms"

**Cause**: `playStartTimeRef` not initialized or timing calculation wrong

**Check**:
1. Did you start playback before hitting MIDI?
2. Is MIDI Tracking enabled?
3. Look for the very first hit - does it have a non-zero error?

### Issue 2: `error` is huge (> 1000ms)

**Cause**: MIDI timestamp is not being used correctly, or reference time is wrong

**Check**:
1. Look at the `elapsed` value - should match the beat duration pattern
2. For 120 BPM: should see ~500ms, ~1000ms, ~1500ms, etc.
3. For 100 BPM: should see ~600ms, ~1200ms, ~1800ms, etc.

### Issue 3: Indicator shows opposite direction

**Cause**: Sign convention might be inverted somewhere

**Check**:
1. Hit early (before click) - should show "Slow" on left
2. Hit late (after click) - should show "Fast" on right
3. If reversed, error sign is inverted

### Issue 4: Position doesn't match accuracy value

**Cause**: Position calculation is using wrong formula

**Check**:
- `position = (accuracy + 100) / 200 * 100`
- accuracy=0 → position=50% ✓
- accuracy=-100 → position=0% ✓
- accuracy=+100 → position=100% ✓

---

## Timing Calculation Formulas

### Beat Reference
```
beatDurationMs = (60 / tempo) * 1000
```

At 120 BPM: 500ms per beat
At 100 BPM: 600ms per beat

### Expected Beat Time
```
beatNumber = round(elapsedMs / beatDurationMs)
expectedTime = beatNumber * beatDurationMs
```

### Timing Error
```
signedTimingError = elapsedMs - expectedTime
```

Negative = hit early (slow)
Positive = hit late (fast)

### Scaling to -100 to +100
```
quarterBeatMs = beatDurationMs / 4
scaledAccuracy = (timingError / quarterBeatMs) * 100
scaledAccuracy = clamped to [-100, +100]
```

At 120 BPM: quarter beat = 125ms
- ±125ms → ±100 accuracy
- ±62.5ms → ±50 accuracy
- ±12.5ms → ±10 accuracy

---

## Performance Expectations

**Typical values** when hitting on beat with 120 BPM:

| Timing | Error | Accuracy | Position | Label |
|--------|-------|----------|----------|-------|
| Perfect | 0ms | 0 | 50% | On-Time |
| 10ms early | -10ms | -8 | 46% | On-Time |
| 10ms late | +10ms | +8 | 54% | On-Time |
| 30ms early | -30ms | -24 | 38% | Slow |
| 30ms late | +30ms | +24 | 62% | Fast |
| 80ms early | -80ms | -64 | 18% | Slow |
| 80ms late | +80ms | +64 | 82% | Fast |

---

## Debug Logging Levels

The code includes conditional logging:

```javascript
if (process.env.NODE_ENV === 'development') {
  console.log(...); // Only shows in dev mode
}
```

**Dev server** (`npm run dev`): All logs visible
**Production build** (`npm run build`): Logs removed for performance

---

## Next Steps

1. **Run the test**:
   ```bash
   npm run dev
   ```

2. **Open DevTools** (F12) and go to Console tab

3. **Follow the test procedure** above

4. **Share the console output** if the timing seems wrong

5. **Check each phase** of the calculation to identify where the issue is

---

**Last Updated**: February 2026
**Status**: Debug logging enabled in development
