/** Tests for DrumSynth AudioContext lifecycle */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DrumSynth } from './DrumSynth';

interface FakeGain {
  gain: { value: number };
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
}

const contexts: FakeAudioContext[] = [];
const gains: FakeGain[] = [];

class FakeAudioContext {
  state = 'suspended';
  currentTime = 5;
  destination = {};
  sampleRate = 44100;
  close = vi.fn(async () => {
    this.state = 'closed';
  });
  decodeAudioData = vi.fn(async () => ({ fake: true }));
  createBuffer = vi.fn((_c: number, length: number) => ({
    getChannelData: () => new Float32Array(length),
  }));
  createBufferSource = vi.fn(() => ({ buffer: null, connect: vi.fn(), start: vi.fn() }));
  constructor() {
    contexts.push(this);
  }
  resume = vi.fn(async () => {
    this.state = 'running';
  });
  addEventListener = vi.fn();
  createGain = vi.fn((): FakeGain => {
    const gain = { gain: { value: 1 }, connect: vi.fn(), disconnect: vi.fn() };
    gains.push(gain);
    return gain;
  });
}

class FakeOfflineAudioContext {
  sampleRate = 44100;
  decodeAudioData = vi.fn(async () => ({ fake: true }));
  createBuffer = vi.fn((_c: number, length: number) => ({
    getChannelData: () => new Float32Array(length),
  }));
}

async function loadedSynth(): Promise<DrumSynth> {
  const synth = new DrumSynth();
  // Wait for the sample load promises to settle
  await vi.waitFor(() => {
    expect(fetch).toHaveBeenCalled();
  });
  await new Promise((resolve) => setTimeout(resolve, 20));
  return synth;
}

describe('DrumSynth AudioContext lifecycle', () => {
  beforeEach(() => {
    contexts.length = 0;
    gains.length = 0;
    vi.stubGlobal('AudioContext', FakeAudioContext);
    vi.stubGlobal('OfflineAudioContext', FakeOfflineAudioContext);
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(8) }))
    );
    if (typeof AbortSignal.timeout !== 'function') {
      vi.stubGlobal('AbortSignal', { timeout: () => undefined });
    }
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('creates no AudioContext in the constructor', () => {
    new DrumSynth();
    expect(contexts).toHaveLength(0);
  });

  it('creates exactly one AudioContext at the first resume', async () => {
    const synth = new DrumSynth();
    await synth.resume();
    await synth.resume();
    expect(contexts).toHaveLength(1);
  });

  it('schedules a sound after a non-awaited resume', async () => {
    const synth = await loadedSynth();
    void synth.resume();
    synth.playDrum('kick', 0.1, 100);
    expect(contexts).toHaveLength(1);
    expect(contexts[0].createBufferSource).toHaveBeenCalledTimes(1);
  });

  it('applies the volume set before the first resume', async () => {
    const synth = new DrumSynth();
    synth.setMasterVolume(0.4);
    expect(synth.getMasterVolume()).toBe(0.4);
    await synth.resume();
    expect(gains[0].gain.value).toBe(0.4);
    expect(synth.getMasterVolume()).toBe(0.4);
    synth.setMasterVolume(5);
    expect(synth.getMasterVolume()).toBe(1);
    synth.setMasterVolume(-1);
    expect(synth.getMasterVolume()).toBe(0);
  });

  it('returns 0 for the time before resume and the context time after', async () => {
    const synth = new DrumSynth();
    expect(synth.getCurrentTime()).toBe(0);
    await synth.resume();
    expect(synth.getCurrentTime()).toBe(5);
  });

  it('does not throw or use a context when playDrum runs before resume', async () => {
    const synth = await loadedSynth();
    expect(() => synth.playDrum('kick', 0, 100)).not.toThrow();
    expect(contexts).toHaveLength(0);
  });

  it('closes the real context once on dispose', async () => {
    const synth = new DrumSynth();
    await synth.resume();
    synth.dispose();
    synth.dispose();
    expect(contexts[0].close).toHaveBeenCalledTimes(1);
  });

  it('creates no context after dispose', async () => {
    const synth = await loadedSynth();
    await synth.resume();
    synth.dispose();
    await synth.resume();
    expect(() => synth.playDrum('kick', 0, 100)).not.toThrow();
    expect(contexts).toHaveLength(1);
  });

  it('allows dispose before any resume', async () => {
    const synth = new DrumSynth();
    expect(() => synth.dispose()).not.toThrow();
    await synth.resume();
    expect(contexts).toHaveLength(0);
  });

  it('creates the real context at once when OfflineAudioContext is missing', () => {
    vi.stubGlobal('OfflineAudioContext', undefined);
    new DrumSynth();
    expect(contexts).toHaveLength(1);
  });

  it('degrades without throwing when no Web Audio API exists', async () => {
    vi.stubGlobal('OfflineAudioContext', undefined);
    vi.stubGlobal('AudioContext', undefined);
    const synth = new DrumSynth();
    expect(synth.isInitialized()).toBe(false);
    expect(synth.getInitError()).not.toBeNull();
    await expect(synth.resume()).resolves.toBeUndefined();
    expect(() => synth.playDrum('kick', 0, 100)).not.toThrow();
    expect(synth.getCurrentTime()).toBe(0);
  });
});
