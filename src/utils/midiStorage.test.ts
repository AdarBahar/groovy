/**
 * Tests for MIDI Configuration Storage
 *
 * Verifies localStorage persistence of MIDI settings
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { loadMIDIConfig, saveMIDIConfig, clearMIDIConfig } from './midiStorage';
import { DEFAULT_MIDI_CONFIG } from '../midi/types';

describe('MIDI Storage', () => {
  let mockStorage: Record<string, string>;

  beforeEach(() => {
    // Create a mock localStorage for testing
    mockStorage = {};

    global.localStorage = {
      getItem: (key: string) => mockStorage[key] || null,
      setItem: (key: string, value: string) => { mockStorage[key] = value; },
      removeItem: (key: string) => { delete mockStorage[key]; },
      clear: () => { mockStorage = {}; },
      key: (index: number) => {
        const keys = Object.keys(mockStorage);
        return keys[index] || null;
      },
      length: 0,
    } as any;
  });

  describe('loadMIDIConfig', () => {
    it('returns default config when nothing is saved', () => {
      const config = loadMIDIConfig();

      expect(config).toEqual(DEFAULT_MIDI_CONFIG);
    });

    it('returns default config structure with required properties', () => {
      const config = loadMIDIConfig();

      expect(config).toHaveProperty('enabled');
      expect(config).toHaveProperty('selectedDeviceId');
      expect(config).toHaveProperty('selectedKitName');
      expect(config).toHaveProperty('throughEnabled');
    });

    it('loads previously saved config', () => {
      const customConfig = {
        ...DEFAULT_MIDI_CONFIG,
        selectedDeviceId: 'device-123',
        selectedKitName: 'Alesis Nitro',
        throughEnabled: false,
      };

      saveMIDIConfig(customConfig);
      const loaded = loadMIDIConfig();

      expect(loaded).toEqual(customConfig);
    });

    it('merges saved config with defaults for missing properties', () => {
      // Save only partial config
      localStorage.setItem('groovy-midi-config', JSON.stringify({
        selectedDeviceId: 'device-456',
      }));

      const loaded = loadMIDIConfig();

      expect(loaded.selectedDeviceId).toBe('device-456');
      expect(loaded.throughEnabled).toBe(DEFAULT_MIDI_CONFIG.throughEnabled);
      expect(loaded.selectedKitName).toBe(DEFAULT_MIDI_CONFIG.selectedKitName);
    });

    it('handles corrupted localStorage gracefully', () => {
      // Store invalid JSON
      localStorage.setItem('groovy-midi-config', 'invalid-json-{]');

      const config = loadMIDIConfig();

      // Should return default config instead of crashing
      expect(config).toEqual(DEFAULT_MIDI_CONFIG);
    });
  });

  describe('saveMIDIConfig', () => {
    it('saves config to localStorage', () => {
      const config = {
        ...DEFAULT_MIDI_CONFIG,
        selectedDeviceId: 'device-789',
      };

      saveMIDIConfig(config);
      const stored = localStorage.getItem('groovy-midi-config');

      expect(stored).toBeTruthy();
      expect(JSON.parse(stored!)).toEqual(config);
    });

    it('persists config changes', () => {
      const config1 = {
        ...DEFAULT_MIDI_CONFIG,
        selectedDeviceId: 'device-1',
      };

      saveMIDIConfig(config1);

      const config2 = {
        ...DEFAULT_MIDI_CONFIG,
        selectedDeviceId: 'device-2',
      };

      saveMIDIConfig(config2);
      const loaded = loadMIDIConfig();

      expect(loaded.selectedDeviceId).toBe('device-2');
    });

    it('saves all config properties', () => {
      const config = {
        ...DEFAULT_MIDI_CONFIG,
        enabled: true,
        selectedDeviceId: 'device-abc',
        selectedKitName: 'Yamaha DTX',
        throughEnabled: true,
      };

      saveMIDIConfig(config);
      const loaded = loadMIDIConfig();

      expect(loaded).toEqual(config);
    });

    it('handles null values correctly', () => {
      const config = {
        ...DEFAULT_MIDI_CONFIG,
        selectedDeviceId: null,
      };

      saveMIDIConfig(config);
      const loaded = loadMIDIConfig();

      expect(loaded.selectedDeviceId).toBeNull();
    });
  });

  describe('clearMIDIConfig', () => {
    it('removes config from localStorage', () => {
      saveMIDIConfig({
        ...DEFAULT_MIDI_CONFIG,
        selectedDeviceId: 'device-123',
      });

      clearMIDIConfig();

      const stored = localStorage.getItem('groovy-midi-config');
      expect(stored).toBeNull();
    });

    it('next load returns default config after clear', () => {
      saveMIDIConfig({
        ...DEFAULT_MIDI_CONFIG,
        selectedDeviceId: 'device-123',
      });

      clearMIDIConfig();

      const loaded = loadMIDIConfig();
      expect(loaded).toEqual(DEFAULT_MIDI_CONFIG);
    });

    it('handles clearing when nothing is saved', () => {
      // Should not throw error
      expect(() => clearMIDIConfig()).not.toThrow();
    });
  });

  describe('DEFAULT_MIDI_CONFIG', () => {
    it('has correct default values', () => {
      expect(DEFAULT_MIDI_CONFIG.enabled).toBe(false);
      expect(DEFAULT_MIDI_CONFIG.selectedDeviceId).toBeNull();
      expect(DEFAULT_MIDI_CONFIG.selectedKitName).toBe('TD-17');
      expect(DEFAULT_MIDI_CONFIG.throughEnabled).toBe(true);
    });

    it('is a valid MIDI config object', () => {
      const config = DEFAULT_MIDI_CONFIG;

      expect(typeof config.enabled).toBe('boolean');
      expect(config.selectedDeviceId === null || typeof config.selectedDeviceId === 'string').toBe(true);
      expect(typeof config.selectedKitName).toBe('string');
      expect(typeof config.throughEnabled).toBe('boolean');
    });
  });

  describe('Round-trip persistence', () => {
    it('config survives save and load cycle', () => {
      const original = {
        ...DEFAULT_MIDI_CONFIG,
        enabled: true,
        selectedDeviceId: 'device-xyz',
        selectedKitName: 'Alesis Nitro',
        throughEnabled: false,
      };

      saveMIDIConfig(original);
      const loaded = loadMIDIConfig();

      expect(loaded).toEqual(original);
    });

    it('multiple configs can be saved and retrieved sequentially', () => {
      const configs = [
        { ...DEFAULT_MIDI_CONFIG, selectedKitName: 'TD-17' },
        { ...DEFAULT_MIDI_CONFIG, selectedKitName: 'Alesis Nitro' },
        { ...DEFAULT_MIDI_CONFIG, selectedKitName: 'Yamaha DTX' },
      ];

      configs.forEach((config) => {
        saveMIDIConfig(config);
        const loaded = loadMIDIConfig();
        expect(loaded.selectedKitName).toBe(config.selectedKitName);
      });
    });
  });
});
