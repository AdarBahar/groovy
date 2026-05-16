---
plan: 01-01
phase: 01-react-cleanup
status: complete
timestamp: 2026-05-16
---

# Plan 01-01 Summary: Refactor useMIDIInput.ts

## What Changed

Refactored `src/hooks/useMIDIInput.ts` to eliminate listener re-attachment churn and stale closures by using `useRef` for state storage and empty dependency arrays on listener effects.

### Three Core Changes

#### 1. Added configRef and stateRef (Lines 51-70)
- **configRef**: Stores fresh MIDIConfig, synced via cheap useEffect whenever config changes
- **stateRef**: Stores fresh connection state (isConnected, selectedDeviceId, currentDevice), synced whenever these change
- Both refs initialized with current values, updated via dedicated sync effects
- No handler re-attachment during ref updates (they're cheap operations)

#### 2. Rewrote Note Handler useEffect (Lines 172-224)
- **Before**: Dependency array `[config.throughEnabled, config.latencyCompensation, synth]` → handler re-attached on each config change
- **After**: Empty dependency array `[]` → handler attached once on mount
- Handler now reads fresh config via `const config = configRef.current;` on each invocation
- All existing behavior preserved: velocity filtering, double-trigger filtering, voice mapping, latency compensation, audio playback, event dispatch

#### 3. Rewrote Device-List-Change useEffect (Lines 83-105)
- **Before**: Dependency array `[isConnected, config.selectedDeviceId, currentDevice]` → listener re-assigned on each state change
- **After**: Empty dependency array `[]` → listener attached once on mount
- Listener now reads fresh state via `const state = stateRef.current;` on each invocation
- All existing disconnection detection and analytics preserved

## Verification Results

✅ **TypeScript**: `npm run type-check` exits 0 — no new errors  
✅ **Tests**: `npm test -- --run` passes all 93 tests across 5 test files  
✅ **No regressions**: Existing MIDI pipeline behavior intact  

### Test Output
- Test Files: 5 passed
- Tests: 93 passed (unchanged count)
- Duration: 203ms

## Requirements Met

**Requirement MEM-01 (Prevent listener re-attachment on dependency churn)**
- ✅ Note-on handler attached exactly once per hook mount (no re-attachment on config.throughEnabled/config.latencyCompensation changes)
- ✅ Device-list-change listener attached exactly once per hook mount (no re-attachment on isConnected/selectedDeviceId/currentDevice changes)

**Requirement MEM-03 (No stale closures — handlers read fresh state)**
- ✅ Note handler reads fresh config via configRef.current
- ✅ Device-list listener reads fresh connection state via stateRef.current
- ✅ Both listeners always get latest values, never capture stale mount-time closures

## Hand-off to Plan 01-02

Plan 01-02 will verify these changes using a memory profiler hook (`useMemoryProfiler`) that counts listener attachments. The profiler will confirm:
- Listener count stays at 1 across multiple config changes
- Listener count stays at 1 across connection state changes
- Velocity/double-trigger filters still integrate correctly

## Files Modified

- `src/hooks/useMIDIInput.ts` — Only file changed in this plan

## No Breaking Changes

- All imports, exports, and hook signatures remain unchanged
- All existing tests pass without modification
- Velocity filter and double-trigger filter integration preserved
- MIDI device connection/disconnection behavior unchanged
- Audio playback behavior (synth.playDrum) unchanged
- Custom event dispatch ('midi-note-hit') unchanged
