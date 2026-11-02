/**
 * Latency Compensation Configuration Storage
 *
 * Persists per-device latency calibration to localStorage.
 * Allows users to calibrate their hardware setup and automatically
 * apply the offset to future sessions. Validates data using Zod schema.
 */

import { z } from 'zod';
import { LatencyCompensationConfig, LatencyCompensationConfigSchema } from '../midi/types';
import { logger } from './logger';

/** The store is a plain object keyed by device id; entries are validated one by one */
const LatencyStoreSchema = z.record(z.string(), z.unknown());

const LATENCY_CONFIG_KEY = 'groovy-midi-latency-config';
/** Previous snake_case key — kept only for one-time migration on first load (C7) */
const OLD_LATENCY_CONFIG_KEY = 'groovy_midi_latency_config';

/**
 * Migrate latency config from old snake_case key to new kebab-case key (C7).
 * Runs once: reads old value, writes to new key, removes old key.
 * No-op if new key already present or old key absent.
 */
function migrateLatencyConfigKey(): void {
  try {
    if (localStorage.getItem(LATENCY_CONFIG_KEY) !== null) return; // already migrated
    const oldValue = localStorage.getItem(OLD_LATENCY_CONFIG_KEY);
    if (oldValue === null) return; // nothing to migrate
    localStorage.setItem(LATENCY_CONFIG_KEY, oldValue);
    localStorage.removeItem(OLD_LATENCY_CONFIG_KEY);
    logger.log('Migrated latency config from legacy key to groovy-midi-latency-config');
  } catch (error) {
    logger.error('Failed to migrate latency config key:', error);
  }
}

/**
 * Read and validate the whole latency store.
 * A corrupt container (invalid JSON, array, primitive) reads as empty so the next
 * save can overwrite it; invalid entries are dropped while valid ones are kept.
 * Throws only if localStorage itself is unavailable (callers catch that).
 */
function readLatencyStore(): Record<string, LatencyCompensationConfig> {
  const stored = localStorage.getItem(LATENCY_CONFIG_KEY);
  if (!stored) return {};

  let parsed: unknown;
  try {
    parsed = JSON.parse(stored);
  } catch (error) {
    logger.warn('Latency config store is not valid JSON; treating it as empty:', error);
    return {};
  }

  const container = LatencyStoreSchema.safeParse(parsed);
  if (!container.success) {
    logger.warn('Latency config store has an unexpected shape; treating it as empty');
    return {};
  }

  const configs: Record<string, LatencyCompensationConfig> = {};
  for (const [deviceId, entry] of Object.entries(container.data)) {
    const result = LatencyCompensationConfigSchema.safeParse(entry);
    if (result.success) {
      configs[deviceId] = result.data;
    } else {
      logger.warn(`Dropping invalid latency config for device ${deviceId}:`, result.error);
    }
  }
  return configs;
}

/**
 * Load latency configuration for a specific MIDI device
 * @param deviceId - MIDI device ID
 * @returns Latency config or null if not calibrated
 */
export function loadLatencyConfig(deviceId: string): LatencyCompensationConfig | null {
  migrateLatencyConfigKey();
  try {
    return readLatencyStore()[deviceId] ?? null;
  } catch (error) {
    logger.error('Failed to load latency config:', error);
    return null;
  }
}

/**
 * Save latency configuration for a specific MIDI device
 * @param deviceId - MIDI device ID
 * @param config - Latency configuration
 */
export function saveLatencyConfig(deviceId: string, config: LatencyCompensationConfig): void {
  try {
    const configs = readLatencyStore();

    configs[deviceId] = {
      ...config,
      calibrationDate: new Date().toISOString(),
      calibrationDevice: deviceId,
    };

    localStorage.setItem(LATENCY_CONFIG_KEY, JSON.stringify(configs));
    logger.log(`Saved latency config for device ${deviceId}: ${config.offsetMs}ms`);
  } catch (error) {
    logger.error('Failed to save latency config:', error);
  }
}

/**
 * Delete latency configuration for a device
 * @param deviceId - MIDI device ID
 */
export function deleteLatencyConfig(deviceId: string): void {
  try {
    const configs = readLatencyStore();
    if (!(deviceId in configs)) return;
    delete configs[deviceId];

    localStorage.setItem(LATENCY_CONFIG_KEY, JSON.stringify(configs));
    logger.log(`Deleted latency config for device ${deviceId}`);
  } catch (error) {
    logger.error('Failed to delete latency config:', error);
  }
}

/**
 * Get all stored latency configurations
 */
export function getAllLatencyConfigs(): Record<string, LatencyCompensationConfig> {
  migrateLatencyConfigKey();
  try {
    return readLatencyStore();
  } catch (error) {
    logger.error('Failed to load all latency configs:', error);
    return {};
  }
}

/**
 * Clear all latency configurations
 */
export function clearAllLatencyConfigs(): void {
  try {
    localStorage.removeItem(LATENCY_CONFIG_KEY);
    logger.log('Cleared all latency configurations');
  } catch (error) {
    logger.error('Failed to clear latency configs:', error);
  }
}
