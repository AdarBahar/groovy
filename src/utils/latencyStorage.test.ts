/** Tests for latencyStorage — migration from snake_case to kebab-case key (C7) */

import { describe, it, expect, beforeEach } from 'vitest';
import { loadLatencyConfig, saveLatencyConfig, deleteLatencyConfig, getAllLatencyConfigs, clearAllLatencyConfigs } from './latencyStorage';

const DEVICE_ID = 'test-device-001';
const NEW_KEY = 'groovy-midi-latency-config';
const OLD_KEY = 'groovy_midi_latency_config';

const SAMPLE_CONFIG = {
  enabled: true,
  offsetMs: 50,
  calibrationDate: '2025-01-01T00:00:00.000Z',
  calibrationDevice: DEVICE_ID,
};

let mockStorage: Record<string, string>;

beforeEach(() => {
  // Replace global localStorage with a functional in-memory mock (setup.ts stubs it as no-op).
  mockStorage = {};
  global.localStorage = {
    getItem: (key: string) => mockStorage[key] ?? null,
    setItem: (key: string, value: string) => { mockStorage[key] = value; },
    removeItem: (key: string) => { delete mockStorage[key]; },
    clear: () => { mockStorage = {}; },
    key: (index: number) => Object.keys(mockStorage)[index] ?? null,
    length: 0,
  } as Storage;
});

describe('C7: latency config key migration (snake_case → kebab-case)', () => {
  it('loads from new kebab-case key when only new key exists', () => {
    localStorage.setItem(NEW_KEY, JSON.stringify({ [DEVICE_ID]: SAMPLE_CONFIG }));

    const config = loadLatencyConfig(DEVICE_ID);
    expect(config).not.toBeNull();
    expect(config?.offsetMs).toBe(50);
  });

  it('returns null when neither key exists', () => {
    expect(loadLatencyConfig(DEVICE_ID)).toBeNull();
  });

  it('migrates from old snake_case key to new kebab-case key', () => {
    // Simulate legacy data stored under old key
    localStorage.setItem(OLD_KEY, JSON.stringify({ [DEVICE_ID]: SAMPLE_CONFIG }));
    expect(localStorage.getItem(NEW_KEY)).toBeNull();

    const config = loadLatencyConfig(DEVICE_ID);

    // Data must be readable
    expect(config).not.toBeNull();
    expect(config?.offsetMs).toBe(50);

    // New key must now exist with the migrated data
    expect(localStorage.getItem(NEW_KEY)).not.toBeNull();

    // Old key must be removed after migration
    expect(localStorage.getItem(OLD_KEY)).toBeNull();
  });

  it('subsequent load after migration reads from new key (no double-migration)', () => {
    localStorage.setItem(OLD_KEY, JSON.stringify({ [DEVICE_ID]: SAMPLE_CONFIG }));

    // First load triggers migration
    loadLatencyConfig(DEVICE_ID);
    // Old key gone, new key present
    expect(localStorage.getItem(OLD_KEY)).toBeNull();
    expect(localStorage.getItem(NEW_KEY)).not.toBeNull();

    // Second load should still return the same data via new key
    const config2 = loadLatencyConfig(DEVICE_ID);
    expect(config2?.offsetMs).toBe(50);
  });

  it('getAllLatencyConfigs migrates and returns all device configs', () => {
    const multiDeviceData = {
      [DEVICE_ID]: SAMPLE_CONFIG,
      'other-device': { ...SAMPLE_CONFIG, offsetMs: 30, calibrationDevice: 'other-device' },
    };
    localStorage.setItem(OLD_KEY, JSON.stringify(multiDeviceData));

    const all = getAllLatencyConfigs();
    expect(Object.keys(all).length).toBe(2);
    expect(all[DEVICE_ID]?.offsetMs).toBe(50);
    expect(all['other-device']?.offsetMs).toBe(30);

    // Old key removed, new key present
    expect(localStorage.getItem(OLD_KEY)).toBeNull();
    expect(localStorage.getItem(NEW_KEY)).not.toBeNull();
  });

  it('saveLatencyConfig writes to new key', () => {
    saveLatencyConfig(DEVICE_ID, SAMPLE_CONFIG);

    expect(localStorage.getItem(NEW_KEY)).not.toBeNull();
    expect(localStorage.getItem(OLD_KEY)).toBeNull();
  });

  it('clearAllLatencyConfigs removes new key', () => {
    saveLatencyConfig(DEVICE_ID, SAMPLE_CONFIG);
    clearAllLatencyConfigs();
    expect(localStorage.getItem(NEW_KEY)).toBeNull();
  });
});

describe('latency store validation (corrupt or partially invalid storage)', () => {
  it.each([
    ['invalid JSON', 'not json'],
    ['an array', '[]'],
    ['a primitive', '42'],
  ])('a store that is %s reads as empty and can be overwritten by the next save', (_label, raw) => {
    localStorage.setItem(NEW_KEY, raw);

    expect(getAllLatencyConfigs()).toEqual({});
    expect(loadLatencyConfig(DEVICE_ID)).toBeNull();

    saveLatencyConfig(DEVICE_ID, SAMPLE_CONFIG);

    expect(loadLatencyConfig(DEVICE_ID)?.offsetMs).toBe(50);
    expect(Object.keys(getAllLatencyConfigs())).toEqual([DEVICE_ID]);
  });

  it('keeps valid entries and drops invalid ones', () => {
    localStorage.setItem(
      NEW_KEY,
      JSON.stringify({
        [DEVICE_ID]: SAMPLE_CONFIG,
        'bad-device': { enabled: 'yes', offsetMs: -5 },
      })
    );

    expect(Object.keys(getAllLatencyConfigs())).toEqual([DEVICE_ID]);
    expect(loadLatencyConfig('bad-device')).toBeNull();
    expect(loadLatencyConfig(DEVICE_ID)?.offsetMs).toBe(50);

    deleteLatencyConfig(DEVICE_ID);
    expect(getAllLatencyConfigs()).toEqual({});
    expect(JSON.parse(localStorage.getItem(NEW_KEY)!)).toEqual({});
  });
});
