/**
 * Tests for MIDIAccess - fake keyboard MIDI handler lifecycle (#120)
 *
 * Verifies:
 * - Disconnect clears fakeMIDIMessageHandler so sendFakeMIDIMessage is a no-op
 * - getCurrentDevice() returns null after fake device disconnect
 * - Switching from fake to real device clears the fake handler
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { midiAccess, FAKE_MIDI_DEVICE_ID_EXPORT } from './MIDIAccess';

// Force isLocalhost=true so the fake device is available
Object.defineProperty(window, 'location', {
  value: { hostname: 'localhost' },
  writable: true,
});

describe('MIDIAccess fake keyboard handler lifecycle (#120)', () => {
  const messageHandlerSpy = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();
    // Initialize with no Web MIDI API (simulates localhost-only mode)
    // navigator.requestMIDIAccess is not defined in jsdom, so initialize() will
    // fall through to the localhost fallback and return true.
    await midiAccess.initialize();
  });

  afterEach(() => {
    midiAccess.disconnect();
  });

  describe('disconnect clears fake handler', () => {
    it('sendFakeMIDIMessage is a no-op after disconnect()', () => {
      // Bind the fake device
      const bound = midiAccess.bindInput(FAKE_MIDI_DEVICE_ID_EXPORT, messageHandlerSpy);
      expect(bound).toBe(true);

      // Disconnect
      midiAccess.disconnect();

      // Handler must not be called
      midiAccess.sendFakeMIDIMessage(60, 100, performance.now());
      expect(messageHandlerSpy).not.toHaveBeenCalled();
    });

    it('getCurrentDevice() returns null after fake device disconnect()', () => {
      midiAccess.bindInput(FAKE_MIDI_DEVICE_ID_EXPORT, messageHandlerSpy);
      expect(midiAccess.getCurrentDevice()).not.toBeNull();

      midiAccess.disconnect();

      expect(midiAccess.getCurrentDevice()).toBeNull();
    });
  });

  describe('switching from fake to real device clears fake handler', () => {
    it('sendFakeMIDIMessage is inert after binding a real device', async () => {
      // Set up a mock MIDIAccess with a real device
      const mockMidiInput = {
        id: 'real-device-id',
        name: 'Real Drum Kit',
        manufacturer: 'Roland',
        state: 'connected',
        onmidimessage: null as ((e: MIDIMessageEvent) => void) | null,
      };
      const mockMidiAccess = {
        inputs: new Map([['real-device-id', mockMidiInput]]),
        onstatechange: null,
      };
      // Stub navigator.requestMIDIAccess to return our mock
      const requestMIDIAccessSpy = vi.fn().mockResolvedValue(mockMidiAccess);
      Object.defineProperty(navigator, 'requestMIDIAccess', {
        value: requestMIDIAccessSpy,
        writable: true,
        configurable: true,
      });

      // Re-initialize to pick up the mock
      await midiAccess.initialize();

      // First bind fake device
      const fakeBound = midiAccess.bindInput(FAKE_MIDI_DEVICE_ID_EXPORT, messageHandlerSpy);
      expect(fakeBound).toBe(true);
      expect(midiAccess.getCurrentDevice()?.id).toBe(FAKE_MIDI_DEVICE_ID_EXPORT);

      // Now switch to real device
      const realHandlerSpy = vi.fn();
      const realBound = midiAccess.bindInput('real-device-id', realHandlerSpy);
      expect(realBound).toBe(true);

      // Sending fake MIDI message must not call the original fake handler
      midiAccess.sendFakeMIDIMessage(60, 100, performance.now());
      expect(messageHandlerSpy).not.toHaveBeenCalled();

      // getCurrentDevice should report the real device
      expect(midiAccess.getCurrentDevice()?.id).toBe('real-device-id');
    });
  });
});

describe('MIDIAccess teardown (no listener accumulation)', () => {
  function makeMockAccess(id: string) {
    const input = {
      id,
      name: `Kit ${id}`,
      manufacturer: 'Test',
      state: 'connected' as string,
      onmidimessage: null as ((e: MIDIMessageEvent) => void) | null,
    };
    const access = {
      inputs: new Map([[id, input]]),
      onstatechange: null as ((e: Event) => void) | null,
    };
    return { input, access };
  }

  function stubRequestMIDIAccess(access: unknown): void {
    Object.defineProperty(navigator, 'requestMIDIAccess', {
      value: vi.fn().mockResolvedValue(access),
      writable: true,
      configurable: true,
    });
  }

  afterEach(() => {
    midiAccess.dispose();
  });

  it('re-initialize clears the statechange handler on the previous MIDIAccess object', async () => {
    const first = makeMockAccess('a');
    stubRequestMIDIAccess(first.access);
    await midiAccess.initialize();
    expect(first.access.onstatechange).toBeTypeOf('function');

    const second = makeMockAccess('b');
    stubRequestMIDIAccess(second.access);
    await midiAccess.initialize();

    expect(first.access.onstatechange).toBeNull();
    expect(second.access.onstatechange).toBeTypeOf('function');
  });

  it('dispose() clears every handler and forgets the access object', async () => {
    const { input, access } = makeMockAccess('a');
    stubRequestMIDIAccess(access);
    await midiAccess.initialize();
    midiAccess.onDeviceListChange = vi.fn();
    expect(midiAccess.bindInput('a', vi.fn())).toBe(true);
    expect(input.onmidimessage).toBeTypeOf('function');

    midiAccess.dispose();

    expect(input.onmidimessage).toBeNull();
    expect(access.onstatechange).toBeNull();
    expect(midiAccess.getCurrentDevice()).toBeNull();
    expect(midiAccess.onDeviceListChange).toBeNull();
    const realDevices = midiAccess.getInputDevices().filter((d) => d.id !== FAKE_MIDI_DEVICE_ID_EXPORT);
    expect(realDevices).toHaveLength(0);
  });

  it('a disconnect event for the bound port clears its message handler', async () => {
    const { input, access } = makeMockAccess('a');
    stubRequestMIDIAccess(access);
    await midiAccess.initialize();
    midiAccess.bindInput('a', vi.fn());
    expect(input.onmidimessage).toBeTypeOf('function');

    input.state = 'disconnected';
    access.onstatechange!({ port: input } as unknown as Event);

    expect(input.onmidimessage).toBeNull();
    expect(midiAccess.getCurrentDevice()).toBeNull();
  });

  it('dispose() is safe when never initialized or called twice', () => {
    midiAccess.dispose();
    expect(() => midiAccess.dispose()).not.toThrow();
  });
});

describe('MIDIAccess availability (#155)', () => {
  const originalHostname = window.location.hostname;

  function setHostname(hostname: string): void {
    Object.defineProperty(window.location, 'hostname', { value: hostname, writable: true, configurable: true });
  }

  function stubRequest(impl: (() => Promise<unknown>) | undefined): void {
    Object.defineProperty(navigator, 'requestMIDIAccess', {
      value: impl ? vi.fn().mockImplementation(impl) : undefined,
      writable: true,
      configurable: true,
    });
  }

  function okAccess() {
    return { inputs: new Map(), onstatechange: null };
  }

  afterEach(() => {
    midiAccess.dispose();
    setHostname(originalHostname);
    stubRequest(undefined);
  });

  it('is unsupported when requestMIDIAccess is missing on a non-localhost host', async () => {
    setHostname('example.com');
    stubRequest(undefined);
    expect(await midiAccess.initialize()).toBe(false);
    expect(midiAccess.getAvailability()).toBe('unsupported');
  });

  it.each(['NotAllowedError', 'SecurityError'])('is denied on %s', async (name) => {
    setHostname('example.com');
    stubRequest(() => Promise.reject(new DOMException('x', name)));
    expect(await midiAccess.initialize()).toBe(false);
    expect(midiAccess.getAvailability()).toBe('denied');
  });

  it('is error for another failure', async () => {
    setHostname('example.com');
    stubRequest(() => Promise.reject(new Error('boom')));
    expect(await midiAccess.initialize()).toBe(false);
    expect(midiAccess.getAvailability()).toBe('error');
  });

  it('is available when requestMIDIAccess resolves', async () => {
    setHostname('example.com');
    stubRequest(() => Promise.resolve(okAccess()));
    expect(await midiAccess.initialize()).toBe(true);
    expect(midiAccess.getAvailability()).toBe('available');
  });

  it('is available on localhost when requestMIDIAccess is missing or rejects', async () => {
    setHostname('localhost');
    stubRequest(undefined);
    expect(await midiAccess.initialize()).toBe(true);
    expect(midiAccess.getAvailability()).toBe('available');

    stubRequest(() => Promise.reject(new DOMException('x', 'NotAllowedError')));
    expect(await midiAccess.initialize()).toBe(true);
    expect(midiAccess.getAvailability()).toBe('available');
  });

  it('a stale rejected init does not overwrite the newest availability', async () => {
    setHostname('example.com');
    let rejectFirst!: (e: unknown) => void;
    const first = new Promise<unknown>((_, reject) => {
      rejectFirst = reject;
    });
    const queue: Promise<unknown>[] = [first, Promise.resolve(okAccess())];
    stubRequest(() => queue.shift() as Promise<unknown>);

    const p1 = midiAccess.initialize();
    const p2 = midiAccess.initialize();
    expect(await p2).toBe(true);
    expect(midiAccess.getAvailability()).toBe('available');
    rejectFirst(new DOMException('x', 'NotAllowedError'));
    expect(await p1).toBe(false);
    expect(midiAccess.getAvailability()).toBe('available');
  });

  it('a rejected init after dispose() does not set denied', async () => {
    setHostname('example.com');
    let rejectFirst!: (e: unknown) => void;
    const first = new Promise<unknown>((_, reject) => {
      rejectFirst = reject;
    });
    stubRequest(() => first);
    const before = midiAccess.getAvailability();

    const p1 = midiAccess.initialize();
    midiAccess.dispose();
    rejectFirst(new DOMException('x', 'NotAllowedError'));
    expect(await p1).toBe(false);
    expect(midiAccess.getAvailability()).toBe(before);
    expect(midiAccess.getAvailability()).not.toBe('denied');
  });
});

describe('MIDIAccess pending initialization is invalidated by dispose()/re-init', () => {
  function makeMockAccess(id: string) {
    const input = { id, name: `Kit ${id}`, manufacturer: 'Test', state: 'connected' as string, onmidimessage: null };
    return {
      input,
      access: { inputs: new Map([[id, input]]), onstatechange: null as ((e: Event) => void) | null },
    };
  }

  function deferred<T>() {
    let resolve!: (value: T) => void;
    const promise = new Promise<T>((r) => {
      resolve = r;
    });
    return { promise, resolve };
  }

  /** Each call to requestMIDIAccess returns the next promise in the queue */
  function stubRequestMIDIAccessQueue(promises: Promise<unknown>[]): void {
    const queue = [...promises];
    Object.defineProperty(navigator, 'requestMIDIAccess', {
      value: vi.fn().mockImplementation(() => queue.shift()),
      writable: true,
      configurable: true,
    });
  }

  function realDeviceIds(): string[] {
    return midiAccess.getInputDevices().map((d) => d.id).filter((id) => id !== FAKE_MIDI_DEVICE_ID_EXPORT);
  }

  afterEach(() => {
    midiAccess.dispose();
  });

  it('an initialize() that resolves after dispose() attaches nothing', async () => {
    const { access } = makeMockAccess('a');
    const d = deferred<unknown>();
    stubRequestMIDIAccessQueue([d.promise]);

    const pending = midiAccess.initialize();
    midiAccess.dispose();
    d.resolve(access);

    expect(await pending).toBe(false);
    expect(access.onstatechange).toBeNull();
    expect(realDeviceIds()).toEqual([]);
  });

  it('overlapping initializations resolved in order: only the newest keeps a handler', async () => {
    const a = makeMockAccess('a');
    const b = makeMockAccess('b');
    const da = deferred<unknown>();
    const db = deferred<unknown>();
    stubRequestMIDIAccessQueue([da.promise, db.promise]);

    const first = midiAccess.initialize();
    const second = midiAccess.initialize();
    da.resolve(a.access);
    expect(await first).toBe(false);
    db.resolve(b.access);
    expect(await second).toBe(true);

    expect(a.access.onstatechange).toBeNull();
    expect(b.access.onstatechange).toBeTypeOf('function');
    expect(realDeviceIds()).toEqual(['b']);
  });

  it('overlapping initializations resolved out of order: the stale one cannot overwrite the newest', async () => {
    const a = makeMockAccess('a');
    const b = makeMockAccess('b');
    const da = deferred<unknown>();
    const db = deferred<unknown>();
    stubRequestMIDIAccessQueue([da.promise, db.promise]);

    const first = midiAccess.initialize();
    const second = midiAccess.initialize();
    db.resolve(b.access);
    expect(await second).toBe(true);
    da.resolve(a.access);
    expect(await first).toBe(false);

    expect(a.access.onstatechange).toBeNull();
    expect(b.access.onstatechange).toBeTypeOf('function');
    expect(realDeviceIds()).toEqual(['b']);
  });
});
