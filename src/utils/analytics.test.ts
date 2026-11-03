/** Tests for analytics */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const OPT_OUT_KEY = 'groovy-analytics-disabled';

function stubBaharAnalytics() {
  const stub = {
    track: vi.fn(),
    trackPageView: vi.fn(),
    trackButtonClick: vi.fn(),
    trackExternalLink: vi.fn(),
    trackFormSubmission: vi.fn(),
    trackError: vi.fn(),
    getProjectName: vi.fn(),
  };
  window.BaharAnalytics = stub;
  return stub;
}

// jsdom hostname is "localhost", so enable analytics with domain "localhost"
async function loadEnabled() {
  vi.resetModules();
  vi.stubEnv('VITE_ANALYTICS_DOMAIN', 'localhost');
  return import('./analytics');
}

// The global test setup stubs localStorage with no-op functions. Use a real in-memory store.
function createMemoryStorage(): Storage {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, String(v)),
    removeItem: (k: string) => void data.delete(k),
    clear: () => data.clear(),
    key: (i: number) => Array.from(data.keys())[i] ?? null,
    get length() {
      return data.size;
    },
  };
}

beforeEach(() => {
  vi.stubGlobal('localStorage', createMemoryStorage());
});

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  delete window.BaharAnalytics;
});

describe('isAnalyticsHost', () => {
  it('accepts the exact domain and subdomains', async () => {
    const { isAnalyticsHost } = await import('./analytics');
    expect(isAnalyticsHost('bahar.co.il', 'bahar.co.il')).toBe(true);
    expect(isAnalyticsHost('www.bahar.co.il', 'bahar.co.il')).toBe(true);
    expect(isAnalyticsHost('WWW.Bahar.co.il', 'bahar.co.il')).toBe(true);
  });

  it('rejects look-alike and unrelated hosts', async () => {
    const { isAnalyticsHost } = await import('./analytics');
    expect(isAnalyticsHost('notbahar.co.il', 'bahar.co.il')).toBe(false);
    expect(isAnalyticsHost('bahar.co.il.evil.com', 'bahar.co.il')).toBe(false);
    expect(isAnalyticsHost('localhost', 'bahar.co.il')).toBe(false);
  });
});

describe('opt-out storage', () => {
  it('writes and removes the opt-out key', async () => {
    const { isAnalyticsOptedOut, setAnalyticsOptOut } = await import('./analytics');
    expect(isAnalyticsOptedOut()).toBe(false);
    setAnalyticsOptOut(true);
    expect(localStorage.getItem(OPT_OUT_KEY)).toBe('true');
    expect(isAnalyticsOptedOut()).toBe(true);
    setAnalyticsOptOut(false);
    expect(localStorage.getItem(OPT_OUT_KEY)).toBeNull();
    expect(isAnalyticsOptedOut()).toBe(false);
  });
});

describe('opted out', () => {
  it('sends no event when the user opted out', async () => {
    const mod = await loadEnabled();
    const stub = stubBaharAnalytics();
    mod.setAnalyticsOptOut(true);
    mod.trackPlay('normal', 100, '4/4');
    mod.trackGrooveSave(true, false);
    mod.trackError('React Error Boundary', 'TypeError', 'stack');
    expect(stub.track).not.toHaveBeenCalled();
    expect(stub.trackError).not.toHaveBeenCalled();
    expect(stub.trackButtonClick).not.toHaveBeenCalled();
  });

  it('sends events again after the user opts in', async () => {
    const mod = await loadEnabled();
    const stub = stubBaharAnalytics();
    mod.setAnalyticsOptOut(true);
    mod.setAnalyticsOptOut(false);
    mod.trackPlay('normal', 100, '4/4');
    expect(stub.track).toHaveBeenCalledTimes(1);
  });
});

describe('payload privacy', () => {
  it('sends has_name and no groove name', async () => {
    const mod = await loadEnabled();
    const stub = stubBaharAnalytics();
    mod.trackGrooveSave(true, false);
    expect(stub.track).toHaveBeenCalledWith('Groovy Groove Saved', {
      has_name: true,
      is_overwrite: false,
    });
    mod.trackGrooveLoad(false);
    expect(stub.track).toHaveBeenCalledWith('Groovy Groove Loaded', { has_name: false });
    mod.trackGrooveDelete(true);
    expect(stub.track).toHaveBeenCalledWith('Groovy Groove Deleted', { has_name: true });
    for (const call of stub.track.mock.calls) {
      expect(call[1]).not.toHaveProperty('groove_name');
    }
  });

  it('sends device_name and no device_id', async () => {
    const mod = await loadEnabled();
    const stub = stubBaharAnalytics();
    mod.trackMIDIDeviceConnected('TD-17');
    mod.trackMIDIDeviceDisconnected('TD-17');
    mod.trackMIDIDeviceSelected('TD-17');
    expect(stub.track).toHaveBeenCalledTimes(3);
    for (const call of stub.track.mock.calls) {
      expect(call[1]).toEqual({ device_name: 'TD-17' });
      expect(call[1]).not.toHaveProperty('device_id');
    }
  });

  it('forwards trackError values when enabled', async () => {
    const mod = await loadEnabled();
    const stub = stubBaharAnalytics();
    mod.trackError('React Error Boundary', 'TypeError', 'stack');
    expect(stub.trackError).toHaveBeenCalledWith('React Error Boundary', 'TypeError', 'stack');
  });
});

describe('default domain', () => {
  it('sends nothing on localhost', async () => {
    vi.resetModules();
    const mod = await import('./analytics');
    const stub = stubBaharAnalytics();
    mod.trackPlay('normal', 100, '4/4');
    expect(stub.track).not.toHaveBeenCalled();
  });
});
