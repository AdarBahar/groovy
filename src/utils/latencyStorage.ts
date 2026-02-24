/**
 * Latency Compensation Configuration Storage
 *
 * Persists per-device latency calibration to localStorage.
 * Allows users to calibrate their hardware setup and automatically
 * apply the offset to future sessions.
 */

import { LatencyCompensationConfig } from '../midi/types';

const LATENCY_CONFIG_KEY = 'groovy_midi_latency_config';

/**
 * Load latency configuration for a specific MIDI device
 * @param deviceId - MIDI device ID
 * @returns Latency config or null if not calibrated
 */
export function loadLatencyConfig(deviceId: string): LatencyCompensationConfig | null {
  try {
    const stored = localStorage.getItem(LATENCY_CONFIG_KEY);
    if (!stored) return null;

    const configs: Record<string, LatencyCompensationConfig> = JSON.parse(stored);
    return configs[deviceId] || null;
  } catch (error) {
    console.error('Failed to load latency config:', error);
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
    const stored = localStorage.getItem(LATENCY_CONFIG_KEY);
    const configs: Record<string, LatencyCompensationConfig> = stored ? JSON.parse(stored) : {};

    configs[deviceId] = {
      ...config,
      calibrationDate: new Date().toISOString(),
      calibrationDevice: deviceId,
    };

    localStorage.setItem(LATENCY_CONFIG_KEY, JSON.stringify(configs));
    console.log(`Saved latency config for device ${deviceId}: ${config.offsetMs}ms`);
  } catch (error) {
    console.error('Failed to save latency config:', error);
  }
}

/**
 * Delete latency configuration for a device
 * @param deviceId - MIDI device ID
 */
export function deleteLatencyConfig(deviceId: string): void {
  try {
    const stored = localStorage.getItem(LATENCY_CONFIG_KEY);
    if (!stored) return;

    const configs: Record<string, LatencyCompensationConfig> = JSON.parse(stored);
    delete configs[deviceId];

    localStorage.setItem(LATENCY_CONFIG_KEY, JSON.stringify(configs));
    console.log(`Deleted latency config for device ${deviceId}`);
  } catch (error) {
    console.error('Failed to delete latency config:', error);
  }
}

/**
 * Get all stored latency configurations
 */
export function getAllLatencyConfigs(): Record<string, LatencyCompensationConfig> {
  try {
    const stored = localStorage.getItem(LATENCY_CONFIG_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error('Failed to load all latency configs:', error);
    return {};
  }
}

/**
 * Clear all latency configurations
 */
export function clearAllLatencyConfigs(): void {
  try {
    localStorage.removeItem(LATENCY_CONFIG_KEY);
    console.log('Cleared all latency configurations');
  } catch (error) {
    console.error('Failed to clear latency configs:', error);
  }
}
