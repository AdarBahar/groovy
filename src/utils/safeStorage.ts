/**
 * Safe localStorage wrapper with quota handling
 *
 * Provides methods that handle QuotaExceededError gracefully
 * Implements cleanup strategies when storage is full (5MB limit)
 */

import { logger } from './logger';

const STORAGE_QUOTA_THRESHOLD = 4.5 * 1024 * 1024; // 4.5MB warning threshold (5MB limit)

/**
 * Result of a storage operation
 */
export interface StorageResult {
  success: boolean;
  error?: string;
  quotaExceeded?: boolean;
}

/**
 * Get current localStorage usage (estimated)
 */
export function getStorageUsage(): number {
  let total = 0;
  for (const key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      const value = localStorage.getItem(key) || '';
      // Estimate: key length + value length * 2 bytes per char (UTF-16)
      total += (key.length + value.length) * 2;
    }
  }
  return total;
}

/**
 * Check if storage is near quota
 */
export function isStorageNearQuota(): boolean {
  return getStorageUsage() > STORAGE_QUOTA_THRESHOLD;
}

/**
 * Safe wrapper for localStorage.setItem with quota handling
 */
export function safeSetItem(key: string, value: string): StorageResult {
  try {
    // Check if we're approaching quota before setting
    const currentUsage = getStorageUsage();
    const estimatedSize = (key.length + value.length) * 2;

    if (currentUsage + estimatedSize > STORAGE_QUOTA_THRESHOLD) {
      logger.warn(`localStorage approaching quota: ${(currentUsage / 1024 / 1024).toFixed(2)}MB used`);
    }

    localStorage.setItem(key, value);
    return { success: true };
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      logger.error('localStorage quota exceeded');
      return {
        success: false,
        error: 'Storage quota exceeded. Please delete some saved grooves.',
        quotaExceeded: true,
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save to localStorage',
    };
  }
}

/**
 * Safe wrapper for localStorage.getItem
 */
export function safeGetItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    logger.error('Failed to read from localStorage:', error);
    return null;
  }
}

/**
 * Safe wrapper for localStorage.removeItem
 */
export function safeRemoveItem(key: string): StorageResult {
  try {
    localStorage.removeItem(key);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove from localStorage',
    };
  }
}

/**
 * Get storage usage statistics
 */
export function getStorageStats(): {
  usedBytes: number;
  usedMB: number;
  percentUsed: number;
  isNearQuota: boolean;
} {
  const usedBytes = getStorageUsage();
  const estimatedQuota = 5 * 1024 * 1024; // 5MB typical browser limit

  return {
    usedBytes,
    usedMB: usedBytes / 1024 / 1024,
    percentUsed: (usedBytes / estimatedQuota) * 100,
    isNearQuota: isStorageNearQuota(),
  };
}

/**
 * Clear old items to make space (cleanup strategy)
 * Can be extended with custom cleanup logic
 */
export function cleanupOldItems(keyPrefix: string): StorageResult {
  try {
    const keysToCheck: string[] = [];

    // Find all keys with the given prefix
    for (const key in localStorage) {
      if (key.startsWith(keyPrefix)) {
        keysToCheck.push(key);
      }
    }

    if (keysToCheck.length === 0) {
      return {
        success: false,
        error: 'No items found to cleanup',
      };
    }

    // Sort keys (assuming they have timestamps or sequential IDs)
    keysToCheck.sort();

    // Remove oldest 25% of items
    const itemsToRemove = Math.max(1, Math.floor(keysToCheck.length * 0.25));
    for (let i = 0; i < itemsToRemove; i++) {
      localStorage.removeItem(keysToCheck[i]);
    }

    logger.log(`Cleaned up ${itemsToRemove} old items from localStorage`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to cleanup localStorage',
    };
  }
}

// Export as namespace for convenience
export const safeStorage = {
  setItem: safeSetItem,
  getItem: safeGetItem,
  removeItem: safeRemoveItem,
  getUsage: getStorageUsage,
  getStats: getStorageStats,
  isNearQuota: isStorageNearQuota,
  cleanup: cleanupOldItems,
};
