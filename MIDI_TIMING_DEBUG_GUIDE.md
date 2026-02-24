# MIDI Timing Debug Guide

**Status**: ✅ Timing calculation fixed, keyboard simulator added

## What Was Fixed

### 1. Tempo-Based Timing Calculation

**Problem**: The timing indicator was using a hardcoded 125ms quarter-beat assumption (for 120 BPM) regardless of actual tempo. If you were playing at 100 BPM or 140 BPM, the calculation would be wrong.

**Solution**:
- `useMIDITracking.ts` now passes the actual `tempo` in the event detail
- `useMIDITimingAccuracy.ts` uses the passed tempo to calculate the correct quarter-beat window
- Formula: `beatDurationMs = (60 / tempo) * 1000`, then `quarterBeatMs = beatDurationMs / 4`

**Example**:
```
At 100 BPM:  beatDurationMs = 600ms,  quarterBeatMs = 150ms
At 120 BPM:  beatDurationMs = 500ms,  quarterBeatMs = 125ms
At 140 BPM:  beatDurationMs = 428ms,  quarterBeatMs = 107ms
```

### 2. Keyboard MIDI Simulator

**What it is**: A development-only keyboard input system that lets you test MIDI input using your keyboard without needing a physical MIDI device.

**How it works**:
- Only enabled on `localhost` or `127.0.0.1`
- Disabled on production deployment
- Maps keyboard keys to MIDI notes and velocities

**Key Bindings**:
| Key | Drum | MIDI Note | Velocity |
|-----|------|-----------|----------|
| **K** | Kick | 36 | 100 |
| **S** | Snare | 38 | 90 |
| **Space** | Hi-hat | 46 | 80 |

---

## How to Debug Timing

### 1. Open Browser Console
- Press **F12** or **Cmd+Opt+I** (Mac)
- Go to **Console** tab

### 2. Start Playback with MIDI Tracking
- Click **Play** button
- Enable **MIDI Tracking** checkbox (if MIDI device connected OR using keyboard simulator)

### 3. Use Keyboard to Send MIDI Events
```
Press: K  →  🥁 Kick (note 36, velocity 100)
Press: S  →  🥁 Snare (note 38, velocity 90)
Press: Space →  🥁 Hi-hat (note 46, velocity 80)
```

### 4. Watch Console Logs
You'll see detailed logging:

```
✅ MIDI: Note 36 → kick-drum (velocity: 100)
  ↳ This means the kick was accepted and played

✅ MIDI: Note 38 → snare-normal (velocity: 90, latency: 0ms)
  ↳ Snare played, latency compensation applied

❌ MIDI: Note 49 velocity 2 filtered (threshold: 3)
  ↳ Event was rejected by velocity filter

❌ MIDI: Note 46 filtered (double-trigger within 15ms)
  ↳ Event rejected as double-trigger (too soon after last hit)
```

### 5. Check Timing Indicator Display

The timing indicator should show:
- **Green text "On-Time"** centered when you hit on the beat
- **Red text "Slow"** left-aligned when you hit behind the beat
- **Red text "Fast"** right-aligned when you hit ahead of the beat

The colored dot should move smoothly along the "Slow ← On-Time → Fast" spectrum.

---

## Testing Scenarios

### Scenario 1: Test On-Time Hits

1. Click Play
2. Enable MIDI Tracking
3. Hit **Space** (hi-hat) **exactly** when you hear the metronome click
4. Watch the indicator - it should show green "On-Time" with the dot in the center

**Expected result**: Timing indicator centered, green, "On-Time"

### Scenario 2: Test Slow Hits

1. Click Play
2. Enable MIDI Tracking
3. Deliberately hit **S** (snare) **late** - after the click
4. Watch the indicator - it should show red "Slow" and dot moving left

**Expected result**: Red "Slow" on the left side

### Scenario 3: Test Fast Hits

1. Click Play
2. Enable MIDI Tracking
3. Deliberately hit **K** (kick) **early** - before the click
4. Watch the indicator - it should show red "Fast" and dot moving right

**Expected result**: Red "Fast" on the right side

### Scenario 4: Test Different Tempos

1. Adjust the **Tempo** slider to a different BPM (e.g., 80, 140, 180)
2. Click Play with MIDI Tracking enabled
3. Hit keyboard keys on-beat
4. Verify that the indicator still shows "On-Time" correctly

**Expected result**: Accurate timing display regardless of tempo

---

## Console Commands for Deep Debugging

### Check Keyboard Simulator Status
```javascript
// In browser console:
console.log(keyboardMIDISimulator.isEnabled());
// → true (if on localhost)

console.log(keyboardMIDISimulator.getKeyMap());
// → { k: {note: 36, velocity: 100, label: 'Kick'}, ... }
```

### Check Velocity Filter Thresholds
```javascript
// These require inspection of React state, but you can see logs:
// → "MIDI: Note 49 velocity 2 filtered (threshold: 3)"
```

### Check Double-Trigger Filter History
```javascript
// Get the history of last hits per note
// Look for logs like:
// → "MIDI: Note 46 filtered (double-trigger within 15ms)"
```

### Monitor Timing Events

```javascript
// Listen to all timing events
window.addEventListener('midi-tracking-hit', (e) => {
  console.log('Timing Event:', {
    timingError: e.detail.timingError,
    tempo: e.detail.tempo,
    analysis: e.detail.analysis,
  });
});
```

---

## Common Issues & Solutions

### Issue 1: Timing always shows "Fast" even when on-time

**Cause**: Latency compensation might be applying a negative offset incorrectly.

**Solution**:
1. Check if latency compensation is enabled
2. If enabled, try disabling it temporarily
3. If that fixes it, the offset value needs calibration

**Debug**:
```javascript
// Check in console
// Look for logs like: "latency: -42ms"
// Positive values are correct (subtracting latency)
```

### Issue 2: Keyboard input not working

**Cause**: You're not on localhost, or keyboard simulator didn't start.

**Solution**:
1. Verify you're on `http://localhost:5173` (not `127.0.0.1` unless you prefer)
2. Check console for: `🎹 Keyboard MIDI input enabled on localhost`
3. If not present, hard refresh browser (Cmd+Shift+R / Ctrl+Shift+R)

### Issue 3: Hits are being filtered out unexpectedly

**Cause**: Velocity thresholds or double-trigger windows are too strict.

**Solution**:
1. Watch console for filter logs
2. If velocity filter: check threshold for that note
3. If double-trigger: space out your hits more (wait > window duration)

### Issue 4: Timing seems inverted (slow shows right instead of left)

**Cause**: Potential sign inversion in calculation

**Solution**:
1. Check the console logs for `timingError` value
2. Look for "fast" or "slow" in the logs
3. Verify tempo is being passed correctly

---

## Performance Tuning

### If Timing Feels Laggy

1. Check browser console for errors
2. Look at CPU usage (DevTools → Performance tab)
3. Try reducing complexity:
   - Disable other browser tabs
   - Disable browser extensions
   - Close other applications

### If MIDI Events Feel Delayed

1. Check if latency compensation is enabled and set correctly
2. Run through the latency calibration process (when UI is added)
3. Check for double-trigger suppression delays in console

---

## Files Modified for Debugging

✅ `src/midi/KeyboardMIDISimulator.ts` - New keyboard input simulator
✅ `src/hooks/useMIDIInput.ts` - Integrated keyboard simulator
✅ `src/hooks/useMIDITracking.ts` - Passes tempo to event
✅ `src/hooks/useMIDITimingAccuracy.ts` - Uses actual tempo for calculation

---

## Future Improvements

### 1. Visual Metronome Click
Add a visual click on screen so users can see exactly when the beat occurs.

### 2. Latency Calibration UI
Interactive modal to measure and save device latency per MIDI device.

### 3. Filter Configuration UI
Adjust velocity thresholds and double-trigger windows per-pad in settings.

### 4. Performance Analytics
Track timing distribution, identify bias (fast vs slow), suggest improvements.

### 5. Playback-Synced Keyboard
Highlight which pads should be hit based on current groove pattern.

---

## Quick Reference

**Keyboard Keys**: K=Kick, S=Snare, Space=Hi-hat

**Timing Indicator Zones**:
- Left (Red "Slow"): Behind the beat
- Center (Green "On-Time"): Perfect timing
- Right (Red "Fast"): Ahead of the beat

**Console Indicators**:
- ✅ = Note accepted and played
- ❌ = Note filtered out
- 🥁 = Drum hit detected
- 🎹 = Keyboard simulator info

**Debug Checklist**:
- [ ] Open console (F12)
- [ ] Click Play
- [ ] Enable MIDI Tracking
- [ ] Press K/S/Space
- [ ] Watch timing indicator
- [ ] Check console logs
- [ ] Adjust tempo and test again

---

**Last Updated**: February 2026
**Build Status**: ✅ Working
**Localhost Only**: Keyboard simulator disabled on production
