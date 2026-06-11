import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMIDIInput } from './useMIDIInput';
import { midiHandler } from '../midi/MIDIHandler';

// Mock all MIDI singletons
vi.mock('../midi/MIDIAccess', () => {
  let onDeviceListChange: ((devices: any[]) => void) | null = null;
  return {
    midiAccess: {
      initialize: vi.fn().mockResolvedValue(false),
      getInputDevices: vi.fn().mockReturnValue([]),
      onDeviceListChange: { get: () => onDeviceListChange, set: (fn: any) => { onDeviceListChange = fn; } },
      bindInput: vi.fn().mockReturnValue(false),
      disconnect: vi.fn(),
      getCurrentDevice: vi.fn().mockReturnValue(null),
      sendFakeMIDIMessage: vi.fn(),
    },
    FAKE_MIDI_DEVICE_ID_EXPORT: 'fake-midi-device',
  };
});

vi.mock('../midi/KeyboardMIDISimulator', () => ({
  keyboardMIDISimulator: {
    setEnabled: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  },
}));

vi.mock('../utils/midiStorage', () => ({
  loadMIDIConfig: vi.fn().mockReturnValue({
    selectedDeviceId: null,
    selectedKitName: 'default',
    throughEnabled: true,
    performanceTrackingEnabled: false,
    velocityThresholds: {},
    doubleTriggerWindows: {},
    latencyCompensation: { enabled: true, offsetMs: 950 },
  }),
  saveMIDIConfig: vi.fn(),
}));

vi.mock('../utils/latencyStorage', () => ({
  loadLatencyConfig: vi.fn().mockReturnValue(null),
}));

// Track DrumSynth constructor calls to verify no duplicates are created
let drumSynthInstanceCount = 0;
vi.mock('../core/DrumSynth', () => {
  class MockDrumSynth {
    resume = vi.fn();
    playDrum = vi.fn();
    constructor() {
      drumSynthInstanceCount++;
    }
  }
  return { DrumSynth: MockDrumSynth };
});

vi.mock('../utils/analytics', () => ({
  trackMIDIDeviceDisconnected: vi.fn(),
}));

vi.mock('../midi/MIDIDrumMapping', () => ({
  midiDrumMapping: {
    setKit: vi.fn(),
    getVoiceFromNote: vi.fn((note) => {
      if (note === 36) return 'kick';
      if (note === 38) return 'snare';
      return null;
    }),
  },
}));

describe('useMIDIInput - DrumSynth instantiation (#115)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset instance counter before each test
    drumSynthInstanceCount = 0;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('constructs at most one fallback DrumSynth across multiple renders (no synth provided)', async () => {
    const { rerender } = await act(async () => {
      return renderHook(() => useMIDIInput(undefined));
    });

    const instancesAfterMount = drumSynthInstanceCount;

    // Re-render with undefined synth — must NOT construct a second DrumSynth
    await act(async () => {
      rerender();
    });

    expect(drumSynthInstanceCount).toBe(instancesAfterMount);
    // Exactly one fallback should have been created
    expect(instancesAfterMount).toBe(1);
  });

  it('adopts the provided synth when one is given and constructs no fallback DrumSynth', async () => {
    const providedSynth = {
      resume: vi.fn(),
      playDrum: vi.fn(),
    } as any;

    await act(async () => {
      renderHook(() => useMIDIInput(providedSynth));
    });

    // When a synth is provided, no DrumSynth fallback should be constructed
    expect(drumSynthInstanceCount).toBe(0);
  });
});

describe('useMIDIInput - Listener Attachment', () => {
  let setNoteOnHandlerSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    setNoteOnHandlerSpy = vi.spyOn(midiHandler, 'setNoteOnHandler');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('attaches MIDI note handler exactly once on mount', async () => {
    const drumSynthStub = {
      resume: vi.fn(),
      playDrum: vi.fn(),
    } as any;

    await act(async () => {
      renderHook(() => useMIDIInput(drumSynthStub));
    });

    expect(setNoteOnHandlerSpy).toHaveBeenCalledTimes(1);
  });

  it('does NOT re-attach when config.throughEnabled changes', async () => {
    const drumSynthStub = {
      resume: vi.fn(),
      playDrum: vi.fn(),
    } as any;

    const { result } = await act(async () => {
      return renderHook(() => useMIDIInput(drumSynthStub));
    });

    const initialCallCount = setNoteOnHandlerSpy.mock.calls.length;
    expect(initialCallCount).toBe(1);

    // Change throughEnabled
    await act(async () => {
      result.current.updateConfig({ throughEnabled: !result.current.config.throughEnabled });
    });

    // Should still be 1, not 2
    expect(setNoteOnHandlerSpy).toHaveBeenCalledTimes(1);
  });

  it('does NOT re-attach when config.latencyCompensation changes', async () => {
    const drumSynthStub = {
      resume: vi.fn(),
      playDrum: vi.fn(),
    } as any;

    const { result } = await act(async () => {
      return renderHook(() => useMIDIInput(drumSynthStub));
    });

    const initialCallCount = setNoteOnHandlerSpy.mock.calls.length;
    expect(initialCallCount).toBe(1);

    // Change latencyCompensation
    await act(async () => {
      result.current.updateConfig({
        latencyCompensation: {
          enabled: !result.current.config.latencyCompensation?.enabled,
          offsetMs: result.current.config.latencyCompensation?.offsetMs || 0,
        },
      });
    });

    // Should still be 1, not 2
    expect(setNoteOnHandlerSpy).toHaveBeenCalledTimes(1);
  });

  it('note handler reads fresh config.throughEnabled via ref', async () => {
    const drumSynthStub = {
      resume: vi.fn(),
      playDrum: vi.fn(),
    } as any;

    const { result } = await act(async () => {
      return renderHook(() => useMIDIInput(drumSynthStub));
    });

    // Capture the installed handler
    const handler = setNoteOnHandlerSpy.mock.calls[0][0];
    const initialPlayDrumCalls = drumSynthStub.playDrum.mock.calls.length;

    // Change config to disable playback
    await act(async () => {
      result.current.updateConfig({ throughEnabled: false });
    });

    // Invoke the handler with throughEnabled=false - should NOT call playDrum
    const now = performance.now();
    handler(36, 100, null, now);

    expect(drumSynthStub.playDrum).toHaveBeenCalledTimes(initialPlayDrumCalls);

    // Change config back to enable playback
    await act(async () => {
      result.current.updateConfig({ throughEnabled: true });
    });

    // Invoke the handler again with throughEnabled=true using a different timestamp
    // to avoid double-trigger filtering (default window is 20ms for kick)
    handler(38, 100, null, now + 100);

    expect(drumSynthStub.playDrum).toHaveBeenCalledTimes(initialPlayDrumCalls + 1);

    // Verify no re-attachment occurred
    expect(setNoteOnHandlerSpy).toHaveBeenCalledTimes(1);
  });

  it('calls setNoteOnHandler with no-op on unmount', async () => {
    const drumSynthStub = {
      resume: vi.fn(),
      playDrum: vi.fn(),
    } as any;

    const { unmount } = await act(async () => {
      return renderHook(() => useMIDIInput(drumSynthStub));
    });

    expect(setNoteOnHandlerSpy).toHaveBeenCalledTimes(1);

    await act(async () => {
      unmount();
    });

    // After unmount, cleanup should have called setNoteOnHandler with a no-op
    expect(setNoteOnHandlerSpy).toHaveBeenCalledTimes(2);
  });
});
