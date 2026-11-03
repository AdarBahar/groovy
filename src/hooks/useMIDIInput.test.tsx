import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMIDIInput } from './useMIDIInput';
import { midiHandler } from '../midi/MIDIHandler';
import { midiAccess } from '../midi/MIDIAccess';
import type { DrumSynth } from '../core/DrumSynth';

// Mock all MIDI singletons
vi.mock('../midi/MIDIAccess', () => {
  let onDeviceListChange: ((devices: unknown[]) => void) | null = null;
  return {
    midiAccess: {
      initialize: vi.fn().mockResolvedValue(false),
      getInputDevices: vi.fn().mockReturnValue([]),
      onDeviceListChange: { get: () => onDeviceListChange, set: (fn: ((devices: unknown[]) => void) | null) => { onDeviceListChange = fn; } },
      bindInput: vi.fn().mockReturnValue(false),
      disconnect: vi.fn(),
      dispose: vi.fn(),
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
const createdSynths: Array<{
  resume: ReturnType<typeof vi.fn>;
  playDrum: ReturnType<typeof vi.fn>;
  dispose: ReturnType<typeof vi.fn>;
}> = [];
vi.mock('../core/DrumSynth', () => {
  class MockDrumSynth {
    resume = vi.fn().mockResolvedValue(undefined);
    playDrum = vi.fn();
    dispose = vi.fn();
    constructor() {
      drumSynthInstanceCount++;
      createdSynths.push(this);
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
    createdSynths.length = 0;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  type NoteCallback = (note: number, velocity: number, voice: unknown, timestamp: number) => void;

  async function mountWithNoteHandler<P>(
    useProps: (props: P) => DrumSynth | undefined,
    initialProps: P
  ) {
    const spy = vi.spyOn(midiHandler, 'setNoteOnHandler');
    let rendered!: ReturnType<typeof renderHook<unknown, P>>;
    await act(async () => {
      rendered = renderHook((props: P) => useMIDIInput(useProps(props)), { initialProps });
    });
    const calls = spy.mock.calls.filter((c) => typeof c[0] === 'function');
    const handler = calls[calls.length - 1][0] as unknown as NoteCallback;
    return { ...rendered, handler, spy };
  }

  it('constructs no fallback DrumSynth on mount or rerender (no synth provided)', async () => {
    const { rerender } = await mountWithNoteHandler((s: DrumSynth | undefined) => s, undefined);
    await act(async () => {
      rerender(undefined);
    });
    expect(drumSynthInstanceCount).toBe(0);
  });

  it('uses a synth that the parent provides later and constructs nothing', async () => {
    const provided = { resume: vi.fn().mockResolvedValue(undefined), playDrum: vi.fn(), dispose: vi.fn() };
    const { rerender, handler } = await mountWithNoteHandler(
      (s: DrumSynth | undefined) => s,
      undefined as DrumSynth | undefined
    );
    await act(async () => {
      rerender(provided as unknown as DrumSynth);
    });
    act(() => handler(36, 100, null, 0));
    expect(drumSynthInstanceCount).toBe(0);
    expect(provided.resume).toHaveBeenCalled();
    expect(provided.playDrum).toHaveBeenCalledWith('kick', 0, 100);
  });

  it('creates one fallback synth at the first note and reuses it', async () => {
    const { handler } = await mountWithNoteHandler((s: DrumSynth | undefined) => s, undefined);
    act(() => handler(36, 100, null, 0));
    act(() => handler(38, 90, null, 1));
    expect(drumSynthInstanceCount).toBe(1);
    expect(createdSynths[0].resume).toHaveBeenCalled();
    expect(createdSynths[0].playDrum).toHaveBeenCalledWith('kick', 0, 100);
  });

  it('disposes the owned fallback when a provided synth arrives', async () => {
    const provided = { resume: vi.fn().mockResolvedValue(undefined), playDrum: vi.fn(), dispose: vi.fn() };
    const { rerender, handler } = await mountWithNoteHandler(
      (s: DrumSynth | undefined) => s,
      undefined as DrumSynth | undefined
    );
    act(() => handler(36, 100, null, 0));
    await act(async () => {
      rerender(provided as unknown as DrumSynth);
    });
    expect(createdSynths[0].dispose).toHaveBeenCalledTimes(1);
    act(() => handler(38, 100, null, 1));
    expect(provided.playDrum).toHaveBeenCalledTimes(1);
  });

  it('disposes the owned fallback on unmount', async () => {
    const { handler, unmount } = await mountWithNoteHandler((s: DrumSynth | undefined) => s, undefined);
    act(() => handler(36, 100, null, 0));
    unmount();
    expect(createdSynths[0].dispose).toHaveBeenCalledTimes(1);
  });

  it('does not dispose a provided synth on unmount', async () => {
    const provided = { resume: vi.fn().mockResolvedValue(undefined), playDrum: vi.fn(), dispose: vi.fn() };
    const { unmount } = await mountWithNoteHandler(
      (s: DrumSynth | undefined) => s,
      provided as unknown as DrumSynth
    );
    unmount();
    expect(provided.dispose).not.toHaveBeenCalled();
  });

  it('adopts the provided synth when one is given and constructs no fallback DrumSynth', async () => {
    const providedSynth = {
      resume: vi.fn().mockResolvedValue(undefined),
      playDrum: vi.fn(),
    } as unknown as DrumSynth;

    await act(async () => {
      renderHook(() => useMIDIInput(providedSynth));
    });

    // When a synth is provided, no DrumSynth fallback should be constructed
    expect(drumSynthInstanceCount).toBe(0);
  });
});

describe('useMIDIInput - Listener Attachment', () => {
  let setNoteOnHandlerSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    setNoteOnHandlerSpy = vi.spyOn(midiHandler, 'setNoteOnHandler');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('attaches MIDI note handler exactly once on mount', async () => {
    const drumSynthStub = {
      resume: vi.fn().mockResolvedValue(undefined),
      playDrum: vi.fn(),
    } as unknown as DrumSynth;

    await act(async () => {
      renderHook(() => useMIDIInput(drumSynthStub));
    });

    expect(setNoteOnHandlerSpy).toHaveBeenCalledTimes(1);
  });

  it('does NOT re-attach when config.throughEnabled changes', async () => {
    const drumSynthStub = {
      resume: vi.fn().mockResolvedValue(undefined),
      playDrum: vi.fn(),
    } as unknown as DrumSynth;

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
      resume: vi.fn().mockResolvedValue(undefined),
      playDrum: vi.fn(),
    } as unknown as DrumSynth;

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
      resume: vi.fn().mockResolvedValue(undefined),
      playDrum: vi.fn(),
    } as unknown as DrumSynth;

    const { result } = await act(async () => {
      return renderHook(() => useMIDIInput(drumSynthStub));
    });

    // Capture the installed handler
    const handler = setNoteOnHandlerSpy.mock.calls[0][0];
    const initialPlayDrumCalls = vi.mocked(drumSynthStub.playDrum).mock.calls.length;

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
      resume: vi.fn().mockResolvedValue(undefined),
      playDrum: vi.fn(),
    } as unknown as DrumSynth;

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

describe('useMIDIInput - pending initialization after unmount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.mocked(midiAccess.getInputDevices).mockReturnValue([]);
  });

  it('does not bind a device or touch state when initialize() resolves after unmount', async () => {
    let resolveInit!: (value: boolean) => void;
    vi.mocked(midiAccess.initialize).mockReturnValueOnce(
      new Promise<boolean>((resolve) => {
        resolveInit = resolve;
      })
    );
    // A device list that would trigger the localhost auto-connect path if the
    // stale continuation were allowed to run (jsdom's hostname is localhost).
    vi.mocked(midiAccess.getInputDevices).mockReturnValue([
      { id: 'fake-midi-device', name: 'Fake', manufacturer: '', state: 'connected' },
    ]);
    const drumSynthStub = { resume: vi.fn().mockResolvedValue(undefined), playDrum: vi.fn() } as unknown as DrumSynth;

    const { unmount } = renderHook(() => useMIDIInput(drumSynthStub));
    unmount();
    expect(midiAccess.dispose).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveInit(true);
    });

    expect(midiAccess.bindInput).not.toHaveBeenCalled();
  });
});
