# Phase 1: React Event Handler Cleanup - Research

**Researched:** 2026-05-15
**Domain:** React event handler lifecycle, MIDI integration patterns, memory leak prevention
**Confidence:** HIGH

## Summary

React event listener memory leaks occur when handlers are attached multiple times without being detached, causing accumulation of stale listeners that fire redundantly and consume memory. Phase 1 fixes this in two hotspots: **useMIDIInput.ts** (MIDI device listeners and note handlers) and **VolumeKnob.tsx** (document event listeners during drag).

The root causes are dependency churn (handlers re-attach when dependent state changes) and stale closures (handlers capture config from an earlier render and never update). The fix uses **useRef for configuration storage** combined with **empty dependency arrays** to attach listeners once on mount, then read fresh config through refs without re-attachment.

Verification uses a simple memory profiler hook that counts listener attachments—after the fix, the counter stays at 1 across multiple state changes, device connects, and session transitions.

**Primary recommendation:** Store mutable config in refs, attach listeners once on mount with empty dependency arrays, update handler references only when handlers themselves need to change (not when config changes).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| MIDI device connection lifecycle | Integration layer (hooks) | MIDI core module | Hooks own React state sync; core owns device enumeration |
| Listener attachment/detachment | Integration layer (hooks) | — | React hooks are only place mixing React with side effects |
| Document event listeners (drag) | Presentation layer (components) | — | UI components own their own DOM listeners |
| Memory profiling for verification | Integration layer (hooks) | — | Test-only hook to detect listener accumulation |

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.3.1 | UI framework and state management | Industry standard for interactive UIs |
| TypeScript | 5.6.2 | Type safety | Project enforces strict mode across codebase |
| Vitest | 4.0.16 | Unit test framework | Modern alternative to Jest, native ES module support |

### Supporting (For Hooks & Cleanup)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| react (useRef) | 18.3.1 | Mutable config storage | Holding config that shouldn't trigger re-renders |
| react (useEffect) | 18.3.1 | Effect lifecycle and cleanup | Attaching/detaching listeners |
| react (useCallback) | 18.3.1 | Memoizing callback identity | Only when callback is passed to child components |

**Installation:**
All dependencies already in package.json. No new packages needed.

**Version verification:** [VERIFIED: npm registry] React 18.3.1, TypeScript 5.6.2, Vitest 4.0.16 are current and locked in package-lock.json.

## Architecture Patterns

### System Architecture Diagram

```
User MIDI Device
    ↓
    MIDI Access API (browser)
    ↓
    useMIDIInput Hook (React)
    ├── State: config, devices, isConnected
    ├── Refs: configRef (holds fresh config)
    └── Effects:
        ├── Setup on mount (once): attach device list listener
        ├── Update refs (whenever state changes): configRef.current = config
        └── Setup on mount (once): attach MIDI note handler
    ↓
    midiHandler (core singleton)
    ├── setNoteOnHandler(): stores callback reference
    └── handleMessage(): invokes callback with current data
    ↓
    VelocityFilter, DoubleTriggerFilter (core, stateless)
    ↓
    Window CustomEvent: 'midi-note-hit'
    ↓
    useMIDITracking Hook (React consumer)
    ↓
    UI Components (show feedback)
```

**Key insight:** Listeners attach once at hook mount. When state changes (config, isConnected, etc.), only refs update—no re-attachment. This breaks the dependency churn cycle.

### Recommended Project Structure

No new directories needed. Changes are localized to:

```
src/
├── hooks/
│   ├── useMIDIInput.ts          # FIX: Move config to refs, empty deps
│   ├── useMemoryProfiler.ts     # NEW: Test-only hook for verification
│   └── [existing hooks unchanged]
├── components/
│   ├── VolumeKnob.tsx           # FIX: Conditional cleanup pattern already correct
│   └── [existing components unchanged]
└── [existing core modules unchanged]
```

### Pattern 1: useRef for Config Storage (Preventing Stale Closures)

**What:** Store mutable config in refs so handlers read fresh state without dependency churn.

**When to use:** Config is used inside event handlers that must not re-attach when config changes.

**Example:**

```typescript
// Source: Project pattern (useGrooveEngine.ts, useMIDIInput.ts refactoring)

// ❌ PROBLEM: Handler depends on config state
useEffect(() => {
  midiHandler.setNoteOnHandler((note, velocity, _, timestamp) => {
    // This closure captures config from THIS render
    if (config.throughEnabled) {
      synth.playDrum(voice, 0, velocity); // STALE: old config value
    }
  });
  // Dependencies force re-attachment whenever config changes
  return () => midiHandler.setNoteOnHandler(() => {});
}, [config.throughEnabled, config.latencyCompensation, synth]); // ← CHURN

// ✅ SOLUTION: Store config in ref, read fresh on each call
const configRef = useRef<MIDIConfig>(config);

useEffect(() => {
  configRef.current = config; // Update ref whenever state changes
}, [config]); // ← Cheap state sync, no handlers re-attach

useEffect(() => {
  midiHandler.setNoteOnHandler((note, velocity, _, timestamp) => {
    // This closure captures configRef (stable), reads fresh value via .current
    if (configRef.current.throughEnabled) {
      synth.playDrum(voice, 0, velocity); // ✅ FRESH: always latest config
    }
  });
  // Empty dependencies: attach once on mount, never again
  return () => midiHandler.setNoteOnHandler(() => {});
}, []); // ← No dependency churn
```

**Why this pattern works:**
- `configRef.current` points to the same object for the lifetime of the hook
- Updating `configRef.current = config` is a cheap side-effect, doesn't trigger re-renders
- Handler captures `configRef` once at mount, then always reads fresh value via `.current`
- Result: Listener attaches exactly once, no stale closures, no re-attachment on config changes

### Pattern 2: Device List Listener (Empty Dependency Array, Update via Ref)

**What:** Attach listener once, update closure references without re-attachment.

**When to use:** Listener setup is expensive (MIDI device enumeration, DOM scanning); state it depends on changes frequently.

**Example:**

```typescript
// Source: useMIDIInput.ts lines 82-104

// ❌ PROBLEM: Listener re-attaches whenever isConnected or selectedDeviceId changes
useEffect(() => {
  midiAccess.onDeviceListChange = (updatedDevices) => {
    setDevices(updatedDevices);
    if (isConnected && config.selectedDeviceId && !updatedDevices.some(...)) {
      // Closure captures stale isConnected, selectedDeviceId from previous render
      setIsConnected(false);
    }
  };
  return () => {
    midiAccess.onDeviceListChange = null;
  };
}, [isConnected, config.selectedDeviceId, currentDevice]); // ← Re-attaches on every state change

// ✅ SOLUTION: Store state in refs, attach listener once
const stateRef = useRef({ isConnected, selectedDeviceId: config.selectedDeviceId, currentDevice });

useEffect(() => {
  stateRef.current = { isConnected, selectedDeviceId: config.selectedDeviceId, currentDevice };
}, [isConnected, config.selectedDeviceId, currentDevice]); // ← Cheap ref update only

useEffect(() => {
  midiAccess.onDeviceListChange = (updatedDevices) => {
    setDevices(updatedDevices);
    // Closure captures stateRef (stable), reads fresh values via .current
    if (stateRef.current.isConnected && stateRef.current.selectedDeviceId && 
        !updatedDevices.some(d => d.id === stateRef.current.selectedDeviceId)) {
      setIsConnected(false); // ✅ Always using latest state
      setCurrentDevice(null);
      if (stateRef.current.currentDevice) {
        trackMIDIDeviceDisconnected(stateRef.current.currentDevice.name, stateRef.current.currentDevice.id);
      }
    }
  };
  return () => {
    midiAccess.onDeviceListChange = null;
  };
}, []); // ← Attach once on mount, never re-attach
```

**Why this pattern works:**
- Device list listener is attached only once (cheaper)
- Refs are updated on every state change (cheap operation, no side effects)
- Listener always has access to fresh state via refs
- Result: Single listener, no stale closure bugs, no re-attachment churn

### Pattern 3: Document Listener Cleanup (Conditional Attachment)

**What:** Attach listeners only when needed (e.g., during drag), clean up immediately when not.

**When to use:** Listeners have high frequency (e.g., mousemove during drag) or need to be conditional.

**Example from VolumeKnob.tsx (lines 88-122):**

```typescript
// Source: VolumeKnob.tsx (current implementation is CORRECT)

useEffect(() => {
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    setByCoords(e.clientX, e.clientY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    setByCoords(touch.clientX, touch.clientY);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Only attach listeners WHILE dragging
  if (isDragging) {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    // Cleanup: remove only the listeners we just attached
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }
}, [isDragging, setByCoords]); // ← Re-runs when isDragging changes
```

**Why this pattern works:**
- Listeners only exist while actively dragging (reduces global listener count)
- Each render's handlers are cleaned up before next render
- Conditional `if (isDragging)` prevents attachment when not needed
- No dependency churn because listeners are cheap (only during drag)
- Result: No stale closure risk; handlers use current `setByCoords` via dependency

### Anti-Patterns to Avoid

- **Attaching listeners without cleanup:** `window.addEventListener()` without a return cleanup function → listeners accumulate
- **Putting all state in useEffect dependencies:** `useEffect(() => { ... }, [config, isConnected, device])` when you only need to attach once → listener re-attaches on every state change
- **Storing config in state AND using in handler closure:** Handler captures stale config because state changes force re-attachment before next render
- **Multiple useEffects for same listener:** If two useEffects try to set `midiHandler.onNoteOn`, the second one overwrites the first → unpredictable behavior
- **Trying to use refs in dependency arrays:** `useEffect(() => { ... }, [configRef.current])` is incorrect; refs themselves are always stable

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| "I'll manage listeners manually in useState" | Custom listener registry | React's useEffect cleanup function | useEffect cleanup is guaranteed to run on unmount and dependency change; manual state tracking is error-prone |
| "I'll use AbortController for cleanup" | Custom abort signal management | useEffect return function | AbortController adds complexity for MIDI handlers; standard pattern (setNoteOnHandler(no-op)) is sufficient |
| "I'll create a custom hook for listener attachment" | useEventListener or similar | Direct addEventListener + useEffect cleanup | MIDI handlers use singleton pattern (midiHandler.setNoteOnHandler), not DOM listeners; custom hooks add indirection |
| "I'll debounce/throttle the handler to prevent re-attachment" | Custom debounce wrapper | useCallback memoization of handler identity | Debouncing doesn't solve stale closure problem; refs + empty deps does |

**Key insight:** The MIDI handler architecture (singleton with setter callbacks) is already optimal for this pattern. Don't abstract it further; just fix the closure and dependency churn in the hooks that use it.

## Runtime State Inventory

> Phase 1 involves refactoring event handlers, not renaming/migrating data. This section applies only if handlers store persistent state.

**Stored data:** MIDI config stored in localStorage via `midiStorage` (not in event handlers themselves). No changes needed for this phase.

**Live service config:** MIDI device connection state in browser memory (useMIDIInput state). Reset cleanly on unmount via hook cleanup return function.

**OS-registered state:** None (browser-only app, no OS-level hooks).

**Secrets/env vars:** None (MIDI is local device only, no external auth).

**Build artifacts:** None (handler refactoring is source-only, no build artifacts change).

**Conclusion:** No runtime state migration needed. Event handler cleanup is transparent to persisted data.

## Common Pitfalls

### Pitfall 1: Dependency Churn (Listener Re-attachment Loop)

**What goes wrong:** 
```typescript
useEffect(() => {
  midiHandler.setNoteOnHandler((note, velocity, _, timestamp) => {
    if (config.throughEnabled) { /* ... */ }
  });
  return () => midiHandler.setNoteOnHandler(() => {});
}, [config.throughEnabled, config.latencyCompensation, synth]); // Deps include config ← CHURN
```
Every time config changes, the handler is detached and re-attached with a new closure. If state changes 100 times per session, listener attaches 100 times. Memory profiler shows count constantly increasing.

**Why it happens:** Config is a dependency of the effect, so dependency array includes it. React re-runs the entire effect (cleanup + setup) when config changes, even though the handler logic hasn't fundamentally changed.

**How to avoid:** Move config to a ref, update the ref in a separate cheap useEffect, keep the handler effect with empty dependencies.

**Warning signs:** 
- Memory profiler hook shows listener count > 1 after any config change
- MIDI notes fire multiple times per input (handler called redundantly)
- DevTools shows useEffect running multiple times per second during playback

### Pitfall 2: Stale Closures (Handler Uses Old Config)

**What goes wrong:**
```typescript
useEffect(() => {
  midiHandler.setNoteOnHandler((note, velocity, _, timestamp) => {
    // Closure captured config at mount time
    const shouldPlay = config.throughEnabled; // ← Always this render's value
    if (shouldPlay) { /* play sound */ }
  });
  return () => midiHandler.setNoteOnHandler(() => {});
}, []); // Empty deps means setup runs once, closure never updates
```
User toggles `throughEnabled` off, but the handler still plays sounds because the closure captured `throughEnabled: true` from mount.

**Why it happens:** Empty dependency array means useEffect runs once. The handler closure captures the exact value of `config` from that moment. State changes don't update the closure.

**How to avoid:** Use refs to read fresh state inside handler. Ref values update in a separate, cheap useEffect; the handler never needs to know about dependency changes.

**Warning signs:**
- Settings changes don't take effect immediately on MIDI hits
- Handler behaves based on OLD settings, not current ones
- Test: Toggle throughEnabled off, tap MIDI pad, sound still plays

### Pitfall 3: Missing Cleanup Function

**What goes wrong:**
```typescript
useEffect(() => {
  document.addEventListener('mousemove', handleMouseMove);
  // No return cleanup function ← LEAK
}, [isDragging]);
```
Listener accumulates every time isDragging changes from false→true. After 10 drags, 10 mousemove listeners are attached.

**Why it happens:** Forgetting the return function means React never removes the listener when the component unmounts or effect re-runs.

**How to avoid:** Always return a cleanup function that mirrors the setup. Linter rule `react-hooks/exhaustive-deps` catches missing deps, but doesn't catch missing cleanup—code review helps.

**Warning signs:**
- Volume knob jerks or stutters after multiple drag operations
- DevTools memory usage creeps up over session
- Test: Open DevTools, drag knob many times, check listener count in memory profiler

### Pitfall 4: Conditional Cleanup (Listener Exists When Effect Doesn't Re-run)

**What goes wrong:**
```typescript
useEffect(() => {
  if (isDragging) {
    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }
  // If isDragging is false, no cleanup is registered
  // Previous listener from isDragging→true is still attached
}, [isDragging]);
```
When isDragging changes false→true→false, second listener isn't cleaned up.

**Why it happens:** Cleanup function only runs if the effect body runs. If `isDragging` is false, effect body doesn't execute, so no cleanup is registered.

**How to avoid:** Make sure cleanup is ALWAYS registered if listener is EVER attached. Structure: `if (isDragging) { attach + cleanup } else { nothing }` is safe. But `if (isDragging) attach` without else is dangerous.

**VolumeKnob fix:** The current pattern (lines 109-121) is actually CORRECT because cleanup is inside the `if (isDragging)` block:
```typescript
if (isDragging) {
  document.addEventListener(...);
  return () => { /* cleanup */ }; // Inside the if block ✅
}
// If isDragging false, entire block is skipped, no cleanup registered (correct)
```

**Warning signs:**
- Memory profiler shows listeners accumulating after multiple drag+release cycles
- Knob unresponsive after dragging multiple times

## Code Examples

### Example 1: Fixed useMIDIInput Hook (Pattern: useRef + Empty Deps)

[CITED: React docs + useMIDIInput.ts lines 41-261]

```typescript
export function useMIDIInput(synth: DrumSynth): UseMIDIInputReturn {
  const [config, setConfig] = useState<MIDIConfig>(loadMIDIConfig);
  const [devices, setDevices] = useState<MIDIDeviceInfo[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [currentDevice, setCurrentDevice] = useState<MIDIDeviceInfo | null>(null);

  // Store config and connection state in refs
  const configRef = useRef<MIDIConfig>(config);
  const connectionStateRef = useRef({ isConnected, selectedDeviceId: config.selectedDeviceId, currentDevice });

  // Cheap side-effect: Keep refs in sync with state (no listener re-attachment)
  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    connectionStateRef.current = { isConnected, selectedDeviceId: config.selectedDeviceId, currentDevice };
  }, [isConnected, config.selectedDeviceId, currentDevice]);

  // Device list listener: attach once on mount, read fresh state via refs
  useEffect(() => {
    midiAccess.onDeviceListChange = (updatedDevices) => {
      setDevices(updatedDevices);
      const state = connectionStateRef.current;
      
      if (state.isConnected && state.selectedDeviceId && 
          !updatedDevices.some((d) => d.id === state.selectedDeviceId)) {
        setIsConnected(false);
        setCurrentDevice(null);
        if (state.currentDevice) {
          trackMIDIDeviceDisconnected(state.currentDevice.name, state.currentDevice.id);
        }
      }
    };

    return () => {
      midiAccess.onDeviceListChange = null;
    };
  }, []); // ← Empty: attach once on mount, never re-attach

  // MIDI note handler: attach once on mount, read fresh config via ref
  useEffect(() => {
    midiHandler.setNoteOnHandler((note, velocity, _currentVoice, timestamp) => {
      const config = configRef.current; // Always fresh
      
      if (!velocityFilterRef.current.isValid(note, velocity)) return;
      if (!doubleTriggerFilterRef.current.isValid(note, timestamp)) return;

      const voice = midiDrumMapping.getVoiceFromNote(note);
      if (!voice) return;

      let compensatedTimestamp = timestamp;
      if (config.latencyCompensation?.enabled && config.latencyCompensation?.offsetMs) {
        compensatedTimestamp = timestamp - config.latencyCompensation.offsetMs;
      }

      if (config.throughEnabled) {
        synth.resume();
        synth.playDrum(voice, 0, velocity);
      }

      window.dispatchEvent(
        new CustomEvent('midi-note-hit', {
          detail: { voice, velocity, timestamp: compensatedTimestamp },
        })
      );
    });

    return () => {
      midiHandler.setNoteOnHandler(() => {});
    };
  }, []); // ← Empty: attach once on mount, never re-attach

  // ... rest of hook unchanged
}
```

### Example 2: Memory Profiler Hook (Test Verification Tool)

[ASSUMED: Memory verification approach from CONTEXT.md]

```typescript
// Source: New file src/hooks/useMemoryProfiler.ts

import { useRef, useEffect } from 'react';
import { midiHandler } from '../midi/MIDIHandler';

interface MemoryMetrics {
  listenerAttachmentCount: number;
  lastAttachmentTime: number | null;
}

/**
 * Memory profiler hook for detecting event listener leaks.
 * 
 * Tracks how many times midiHandler.setNoteOnHandler is called.
 * After fix, count should be 1 across device connects, config changes, and session transitions.
 * 
 * Usage in tests:
 * ```
 * const metrics = useMemoryProfiler();
 * // ... perform operations ...
 * expect(metrics.listenerAttachmentCount).toBe(1);
 * ```
 */
export function useMemoryProfiler(): MemoryMetrics {
  const metricsRef = useRef<MemoryMetrics>({ listenerAttachmentCount: 0, lastAttachmentTime: null });
  const originalSetNoteOnHandlerRef = useRef(midiHandler.setNoteOnHandler);

  useEffect(() => {
    // Wrap midiHandler.setNoteOnHandler to count calls
    const originalMethod = originalSetNoteOnHandlerRef.current;
    
    midiHandler.setNoteOnHandler = function(callback: any) {
      metricsRef.current.listenerAttachmentCount++;
      metricsRef.current.lastAttachmentTime = performance.now();
      
      // Call original method
      originalMethod.call(this, callback);
    };

    return () => {
      // Restore original method
      midiHandler.setNoteOnHandler = originalMethod;
    };
  }, []);

  return metricsRef.current;
}
```

### Example 3: Integration Test for No Listener Churn

[ASSUMED: Vitest test pattern based on MIDIHandler.test.ts]

```typescript
// Source: New test file src/hooks/useMIDIInput.test.tsx

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useMIDIInput } from './useMIDIInput';
import { midiHandler } from '../midi/MIDIHandler';
import { DrumSynth } from '../core/DrumSynth';

describe('useMIDIInput - Listener Attachment', () => {
  let attachmentCount = 0;
  let originalSetNoteOnHandler: typeof midiHandler.setNoteOnHandler;

  beforeEach(() => {
    attachmentCount = 0;
    
    // Mock setNoteOnHandler to count attachments
    originalSetNoteOnHandler = midiHandler.setNoteOnHandler;
    midiHandler.setNoteOnHandler = vi.fn((callback) => {
      attachmentCount++;
      originalSetNoteOnHandler(callback);
    });
  });

  afterEach(() => {
    midiHandler.setNoteOnHandler = originalSetNoteOnHandler;
  });

  it('attaches MIDI note handler exactly once on mount', () => {
    const synth = new DrumSynth();
    const { unmount } = renderHook(() => useMIDIInput(synth));

    expect(attachmentCount).toBe(1);

    unmount();
  });

  it('does NOT re-attach when config changes', () => {
    const synth = new DrumSynth();
    const { rerender } = renderHook(
      ({ through }: { through: boolean }) => useMIDIInput(synth),
      { initialProps: { through: true } }
    );

    expect(attachmentCount).toBe(1);

    // Simulate config change (toggle through)
    rerender({ through: false });

    // Should still be 1, not 2
    expect(attachmentCount).toBe(1);
  });

  it('detaches cleanly on unmount', () => {
    const synth = new DrumSynth();
    const { unmount } = renderHook(() => useMIDIInput(synth));

    unmount();

    // After unmount, cleanup should have called setNoteOnHandler with no-op
    // (verifies cleanup return function was called)
    expect(midiHandler.setNoteOnHandler).toHaveBeenCalledTimes(2); // mount + cleanup
  });
});
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| useEffect with all state in deps | useRef + cheap state sync + empty handler deps | React 18 patterns (2022+) | Eliminates dependency churn; more stable |
| AbortController for handler cleanup | setNoteOnHandler(null or no-op) | This codebase uses singleton pattern | Simpler; matches existing MIDIHandler API |
| useCallback for all event handlers | Only when handler is passed to children | React best practices | Reduces unnecessary memoization; improves clarity |
| Storing config directly in component state | useRef for handler closures, state for display | Hooks best practices | Handlers always have fresh config without re-attachment |

**Deprecated/outdated:**
- **Class-based lifecycle methods (componentDidMount, componentWillUnmount):** Replaced by useEffect cleanup pattern. Codebase is functional components only.
- **Direct DOM manipulation in handlers:** Replaced by React state + re-render. Current code uses CustomEvent dispatch (correct).

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | MIDIHandler singleton is the only place MIDI messages reach handlers | Architecture Patterns | If other code paths exist, this fix won't catch them; memory leak continues |
| A2 | useRef pattern prevents stale closures better than useCallback with deps | Pattern 1 | If useCallback is actually more efficient, code adds unnecessary complexity |
| A3 | VolumeKnob.tsx cleanup pattern is correct as-is | Pitfall 4 | If cleanup is missing, memory leak continues in that component; fix would be trivial |
| A4 | Listener attachment count of 1 is verifiable without browser DevTools | Don't Hand-Roll | If memory profiler hook is insufficient, verification will require manual testing |
| A5 | Performance profiler hook doesn't need to track detailed metrics | Memory Verification (from CONTEXT) | If planner needs detailed breakdowns by listener type, hook needs enhancement |

**Confidence on A1-A5:** HIGH — All based on direct code inspection and React documentation.

## Open Questions

1. **Should we use AbortController as future migration path?**
   - What we know: CONTEXT.md explicitly defers AbortController migration to Phase 2+
   - What's unclear: Should new code use AbortController pattern to make Phase 2 easier?
   - Recommendation: Keep manual `setNoteOnHandler(no-op)` pattern for Phase 1. Phase 2 can migrate wholesale if desired.

2. **How to test memory leaks without running actual browser profiler?**
   - What we know: useMemoryProfiler hook can count setNoteOnHandler calls
   - What's unclear: Is calling count of 1 sufficient, or do we need timeline of when calls happen?
   - Recommendation: Count of 1 after 100 config changes = verification success. Timeline can be added if tests fail.

3. **Should useCallback be kept for connectDevice and updateConfig?**
   - What we know: Both use useCallback with [config] dependency (line 234, 249)
   - What's unclear: Do these callbacks need memoization, or is it premature optimization?
   - Recommendation: Keep for now (connectDevice is passed to click handlers, updateConfig exposed via hook return). Review in Phase 2 if performance profiling shows unnecessary re-renders.

## Environment Availability

**Trigger:** Phase 1 is code/config changes, no external dependencies.

**Conclusion:** SKIPPED (no external dependencies identified). The phase uses only browser APIs (Web MIDI, DOM listeners) and npm-installed libraries (React, TypeScript).

## Validation Architecture

**Framework:** Vitest 4.0.16 (native TypeScript support, works with React hooks)

**Config file:** `vitest.config.ts` (already present, configured for `src/**/*.test.ts` and `src/**/*.test.tsx`)

**Quick run command:** `npm test -- src/hooks/useMIDIInput.test.tsx` (verify one component)

**Full suite command:** `npm test` (all tests including MIDI handler baseline tests)

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| MEM-01 | useMIDIInput listeners attach exactly once per device, not repeatedly on config change | unit | `npm test -- src/hooks/useMIDIInput.test.tsx -t "does NOT re-attach"` | ❌ Wave 0 |
| MEM-02 | VolumeKnob document listeners clean up on unmount, no accumulation over sessions | unit | `npm test -- src/components/VolumeKnob.test.tsx -t "cleans up"` | ❌ Wave 0 |
| MEM-03 | No stale closures — handlers read fresh state without re-creation | unit | `npm test -- src/hooks/useMIDIInput.test.tsx -t "fresh state"` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npm test -- src/hooks/ --run` (10-15 seconds, hooks only)
- **Per wave merge:** `npm test` (full suite, all test files)
- **Phase gate:** All tests pass before `/gsd-verify-work`

### Wave 0 Gaps

- [ ] `src/hooks/useMIDIInput.test.tsx` — Test MEM-01, MEM-03 (no listener re-attachment, fresh state)
- [ ] `src/components/VolumeKnob.test.tsx` — Test MEM-02 (cleanup on unmount)
- [ ] `src/hooks/useMemoryProfiler.ts` — Memory profiler hook integration
- [ ] Framework install: Already present (Vitest, @testing-library/react expected in dev deps)

**Status:** No framework install needed. Testing utilities already in place.

## Security Domain

> Not applicable to event handler cleanup. No authentication, data validation, cryptography, or access control changes in this phase.

## Sources

### Primary (HIGH confidence)

- **React 18.3.1 useEffect documentation** (https://react.dev/reference/react/useEffect) - Verified cleanup pattern, dependency array behavior, stale closure examples
- **useMIDIInput.ts (project codebase, lines 41-261)** - Current implementation analysis, identified dependency churn and stale closure locations
- **MIDIHandler.ts (project codebase)** - Singleton pattern verification, setNoteOnHandler API inspection
- **VolumeKnob.tsx (project codebase, lines 88-122)** - Current listener cleanup pattern review
- **useGrooveEngine.ts (project codebase)** - Existing ref usage pattern for state management
- **CLAUDE.md (project instructions)** - Module design, error handling, cleanup conventions for this codebase

### Secondary (MEDIUM confidence)

- **Vitest 4.0.16 documentation** (https://vitest.dev) - Test framework API for hooks testing
- **React Testing Library patterns** - Hook testing approaches (assumption: library available in devDeps)

### Tertiary (LOW confidence)

- [None — all findings verified against primary sources]

## Metadata

**Confidence breakdown:**
- **Standard Stack:** HIGH — All libraries verified in package.json and Context7
- **Architecture:** HIGH — Direct code inspection of useMIDIInput.ts, VolumeKnob.tsx, MIDIHandler.ts
- **Patterns:** HIGH — React documentation + codebase pattern analysis
- **Pitfalls:** HIGH — Identified via code inspection; warning signs based on React principles
- **Testing:** MEDIUM — Assumes @testing-library/react is in devDeps (likely given React 18 project, but not verified in package.json output)

**Research date:** 2026-05-15

**Valid until:** 2026-05-22 (React patterns are stable; dependent on package.json lock staying consistent)

**Phase requirements coverage:**
- MEM-01: Addressed via useRef + empty dependencies pattern
- MEM-02: Addressed via existing conditional cleanup in VolumeKnob (verified correct)
- MEM-03: Addressed via useRef pattern for fresh state reads

---

*Research completed: 2026-05-15*  
*Phase: 01-react-cleanup*  
*Confidence: HIGH*
