/**
 * Tests for GrooveStorage
 *
 * Verifies that quota-exceeded cleanup correctly trims oldest grooves,
 * retries the save, and never drops the groove being saved.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { StorageResult } from '../utils/safeStorage';

// Mock safeStorage before importing GrooveStorage so the module picks up the mock
vi.mock('../utils/safeStorage', () => {
  return {
    safeStorage: {
      setItem: vi.fn(),
      getItem: vi.fn(),
      removeItem: vi.fn(),
      getUsage: vi.fn().mockReturnValue(0),
      getStats: vi.fn(),
      isNearQuota: vi.fn().mockReturnValue(false),
      cleanup: vi.fn(),
    },
  };
});

// GrooveURLCodec is used internally; stub its encode/decode to avoid lz-string in tests
vi.mock('./GrooveURLCodec', () => ({
  encodeGrooveToURL: vi.fn().mockReturnValue('mock-url'),
  decodeURLToGroove: vi.fn(),
}));

import { saveGroove, loadAllGrooves } from './GrooveStorage';
import { safeStorage } from '../utils/safeStorage';
import { DEFAULT_GROOVE } from '../types';

/** Build a minimal SavedGroove-shaped JSON string for mocking getItem */
function makeStoredGrooves(count: number): string {
  const grooves = Array.from({ length: count }, (_, i) => ({
    id: `groove-${i + 1}`,
    name: `Groove ${i + 1}`,
    url: 'mock-url',
    createdAt: 1000 + i,
    modifiedAt: 1000 + i, // ascending: groove-1 is oldest, groove-N is newest
    tempo: 120,
    timeSignature: '4/4',
    measureCount: 1,
  }));
  return JSON.stringify(grooves);
}

describe('GrooveStorage - quota cleanup (#118)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('drops oldest ~25% and retries when first setItem returns quotaExceeded:true', () => {
    // Arrange: 8 existing grooves, first save attempt fails with quota exceeded
    const stored = makeStoredGrooves(8);
    vi.mocked(safeStorage.getItem).mockReturnValue(stored);
    vi.mocked(safeStorage.setItem)
      .mockReturnValueOnce({ success: false, quotaExceeded: true } as StorageResult)
      .mockReturnValueOnce({ success: true } as StorageResult);

    const result = saveGroove(DEFAULT_GROOVE, 'New Groove');

    expect(result.success).toBe(true);
    // setItem called twice: first attempt (fails) + retry after trim
    expect(safeStorage.setItem).toHaveBeenCalledTimes(2);

    // Inspect the JSON written on retry
    const retryCall = vi.mocked(safeStorage.setItem).mock.calls[1];
    const retryJson = JSON.parse(retryCall[1]);
    // 8 existing + 1 new = 9. Drop floor(9 * 0.25) = 2 oldest.
    // So retry should have 9 - 2 = 7 grooves.
    expect(retryJson.length).toBe(7);
  });

  it('keeps the newest grooves (groove-8 and groove-7 survive, groove-1 dropped)', () => {
    const stored = makeStoredGrooves(8);
    vi.mocked(safeStorage.getItem).mockReturnValue(stored);
    vi.mocked(safeStorage.setItem)
      .mockReturnValueOnce({ success: false, quotaExceeded: true } as StorageResult)
      .mockReturnValueOnce({ success: true } as StorageResult);

    saveGroove(DEFAULT_GROOVE, 'New Groove');

    const retryJson: Array<{ id: string }> = JSON.parse(
      vi.mocked(safeStorage.setItem).mock.calls[1][1]
    );
    const ids = retryJson.map((g) => g.id);

    // groove-1 is oldest (modifiedAt=1000), groove-2 second oldest (1001)
    // Drop 2 oldest → groove-1 and groove-2 must be gone
    expect(ids).not.toContain('groove-1');
    expect(ids).not.toContain('groove-2');
    // Newer grooves must survive
    expect(ids).toContain('groove-8');
    expect(ids).toContain('groove-7');
  });

  it('never drops the groove currently being saved even if it would be oldest', () => {
    // Existing 4 grooves, new groove gets the oldest-looking modifiedAt (we override via Date.now mock)
    const stored = makeStoredGrooves(4);
    vi.mocked(safeStorage.getItem).mockReturnValue(stored);

    // Make Date.now return a value lower than any existing modifiedAt so new groove looks oldest
    const dateSpy = vi.spyOn(Date, 'now').mockReturnValue(1); // older than groove-1 (1000)

    vi.mocked(safeStorage.setItem)
      .mockReturnValueOnce({ success: false, quotaExceeded: true } as StorageResult)
      .mockReturnValueOnce({ success: true } as StorageResult);

    const result = saveGroove(DEFAULT_GROOVE, 'Must-Survive Groove');

    dateSpy.mockRestore();

    expect(result.success).toBe(true);

    const retryJson: Array<{ name: string }> = JSON.parse(
      vi.mocked(safeStorage.setItem).mock.calls[1][1]
    );
    const names = retryJson.map((g) => g.name);
    expect(names).toContain('Must-Survive Groove');
  });

  it('returns success:false with friendly message when retry also fails', () => {
    const stored = makeStoredGrooves(4);
    vi.mocked(safeStorage.getItem).mockReturnValue(stored);
    vi.mocked(safeStorage.setItem)
      .mockReturnValueOnce({ success: false, quotaExceeded: true } as StorageResult)
      .mockReturnValueOnce({ success: false, quotaExceeded: true } as StorageResult);

    const result = saveGroove(DEFAULT_GROOVE, 'Will Fail');

    expect(result.success).toBe(false);
    expect(result.error).toMatch(/storage full/i);
  });
});

describe('GrooveStorage - loadAllGrooves', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns empty array when storage is empty', () => {
    vi.mocked(safeStorage.getItem).mockReturnValue(null);
    expect(loadAllGrooves()).toEqual([]);
  });

  it('returns grooves sorted by modifiedAt descending (newest first)', () => {
    const stored = makeStoredGrooves(3);
    vi.mocked(safeStorage.getItem).mockReturnValue(stored);

    const grooves = loadAllGrooves();
    expect(grooves[0].id).toBe('groove-3'); // highest modifiedAt
    expect(grooves[2].id).toBe('groove-1'); // lowest modifiedAt
  });
});
