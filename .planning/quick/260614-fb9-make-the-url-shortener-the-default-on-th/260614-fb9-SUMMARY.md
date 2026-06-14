---
phase: quick-260614-fb9
plan: "01"
subsystem: share-modal
tags: [url-shortener, qr-code, react, ux]
dependency_graph:
  requires: [src/services/urlShortener.ts]
  provides: [QR tab auto-shorten with loading and fallback states]
  affects: [src/components/production/ShareModal.tsx, src/components/production/ShareModal.test.tsx]
tech_stack:
  added: []
  patterns: [stale-async guard via cancelled flag, per-session cache reuse via urlShortener.ts module-level cache]
key_files:
  created: []
  modified:
    - src/components/production/ShareModal.tsx
    - src/components/production/ShareModal.test.tsx
decisions:
  - Separate QR state (qrShortURL, isShorteningQR) from Link tab state to prevent regressions
  - isURLTooLongForQR evaluated on qrURL (not shareableURL) so short URLs never trip the wall
  - qrShortURL reset alongside shortURL in the shareableURL-change effect so urlMode toggles start fresh
  - Spinner shown while isShorteningQR; failure leaves qrShortURL null for graceful fallback
  - trackShareMethod emitted on each successful QR auto-shorten (mirrors Link tab behavior)
metrics:
  duration: "2 minutes"
  completed: "2026-06-14T08:06:35Z"
  tasks_completed: 2
  files_changed: 2
---

# Phase quick-260614-fb9 Plan 01: QR Auto-Shorten Summary

**One-liner:** QR tab auto-shortens the groove URL on activation via shortenURL(), encoding the short URL into the QR code with spinner + graceful long-URL fallback.

## What Was Built

### Task 1: Auto-shorten the QR URL on QR tab activation (feat, 8218374)

Added QR-specific shortener state to `ShareModal.tsx`:

- `qrShortURL: string | null` — the resolved short URL for the QR, null while pending or on failure
- `isShorteningQR: boolean` — true while the shorten request is in flight

A `useEffect` keyed on `[activeTab, shareableURL, urlMode]` fires when the QR tab becomes active:
1. Returns early if `activeTab !== 'qr'` or `!isShortenerConfigured()`
2. Sets `isShorteningQR` true and calls `shortenURL(shareableURL)`
3. On success: stores result in `qrShortURL` and emits `trackShareMethod('shorten', { urlMode })`
4. On failure: leaves `qrShortURL` null (graceful fallback to long URL)
5. `cancelled` flag guards against stale async updates when `shareableURL` changes mid-flight
6. `finally` clears `isShorteningQR`

The `shareableURL` change effect now also resets `qrShortURL` so urlMode toggles start clean.

`qrURL = qrShortURL ?? shareableURL` is the value encoded into the QR. `isURLTooLongForQR` is evaluated against `qrURL` so successfully shortened URLs never trigger the too-long wall, while the long-URL fallback path still does.

`renderQRTab()` now has three branches:
- `isShorteningQR`: centered Loader2 spinner with animate-spin
- `isURLTooLongForQR`: existing too-long wall (unchanged copy, unchanged Link tab reference)
- Otherwise: `<QRCodeSVG value={qrURL} ... />` with all existing props

Link tab state (`isShortening`, `shortURL`, `shortenError`, `handleShortenURL`) is untouched.

### Task 2: Extend ShareModal tests for QR auto-shorten behavior (test, 9b6f1b1)

Added `vi.mock('../../services/urlShortener', ...)` at module level with `isShortenerConfigured`, `shortenURL`, and `getShortenerErrorMessage`. A `beforeEach` with `vi.clearAllMocks()` resets state between tests; default is shortener not configured so existing tests are unaffected.

New `describe('QR tab auto-shorten', ...)` block covers four cases:
1. **Configured + success**: `isShortenerConfigured` true, `shortenURL` resolves to short URL. Activates QR tab, asserts `shortenURL` called once with the long URL, then spinner clears.
2. **Not configured**: `isShortenerConfigured` false. Activates QR tab. Asserts `shortenURL` not called.
3. **No request before activation**: Renders with default link tab. Asserts `shortenURL` not called.
4. **Failure fallback**: `shortenURL` rejects. Spinner clears, no crash, QR area content still visible.

All 7 tests pass (3 original + 4 new).

## Verification

- `npx tsc -b`: passes with no errors
- `npx vitest run src/components/production/ShareModal.test.tsx`: 7/7 tests pass

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None. The QR auto-shorten effect reuses the existing `shortenURL` function which already validates the response shape and throws `ShortenerError` on malformed output (T-fb9-03 mitigated). Quota abuse is prevented by the `shortUrlCache` memoization in `urlShortener.ts` (T-fb9-01 mitigated).

## Self-Check: PASSED

- [x] `src/components/production/ShareModal.tsx` modified: confirmed
- [x] `src/components/production/ShareModal.test.tsx` modified: confirmed
- [x] Commit 8218374 exists: confirmed (feat — Task 1)
- [x] Commit 9b6f1b1 exists: confirmed (test — Task 2)
- [x] All 7 tests pass: confirmed
- [x] tsc -b clean: confirmed
