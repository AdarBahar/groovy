---
phase: quick-261102-kv8
plan: 01
subsystem: services, storage, share
tags: [url-shortener, error-handling, localstorage, zod, tabnabbing]

# Dependency graph
requires: []
provides:
  - "Status-first shortener error mapping tolerant of non-JSON bodies"
  - "Validated latency store on every read/write path"
  - "noopener,noreferrer on social share windows"
affects: [share-modal, midi-latency, url-shortener]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Wrap only fetch() for network errors; derive error types from status; parse the body as optional context"
    - "localStorage containers are read through one validated reader that drops bad entries and treats a corrupt container as empty"

key-files:
  created: []
  modified:
    - src/services/urlShortener.ts
    - src/services/urlShortener.test.ts
    - src/utils/latencyStorage.ts
    - src/utils/latencyStorage.test.ts
    - src/components/production/ShareModal.tsx
    - src/components/production/ShareModal.test.tsx

key-decisions:
  - "A 2xx without a parseable success body reports 'Malformed shortener response'; other unmapped statuses report the HTTP status"
  - "Invalid latency entries are dropped individually rather than discarding the whole store, so one bad device cannot erase other calibrations"
  - "midiStorage left untouched: loadMIDIConfig already validates with MIDIConfigSchema (the review item was stale)"
  - "The 'popup blocked after await' claim was wrong (handleSocialShare is synchronous); the real fix on that line is noopener"

patterns-established:
  - "Negative verification: each new test group was run against the pre-fix source and fails there"

requirements-completed: [REL-P2-SHORTENER-ERRORS, REL-P2-LATENCY-STORE, SEC-P2-SHARE-NOOPENER]

# Metrics
duration: 35min
completed: 2026-11-02
---

# Quick Task 261102-kv8: Fix P2 Shortener, Latency Store and Share Window Summary

**Shortener errors now follow the HTTP status even when a gateway answers with HTML; a corrupt latency store can no longer wedge calibration saves; share windows no longer hand window.opener to third-party sites.**

## Performance

- **Duration:** 35 min
- **Tasks:** 3
- **Files modified:** 6

## Accomplishments
- `urlShortener.shortenURL`: only a rejected `fetch()` is a network error; the body is parsed after the status checks and a non-JSON body is treated as absent, so 429 keeps `rate_limited` + `Retry-After` and 5xx keeps its status.
- `latencyStorage`: new `readLatencyStore()` validates the container and each entry; load/save/delete/getAll all use it.
- `ShareModal`: `window.open(..., 'width=600,height=400,noopener,noreferrer')`.

## Task Commits

1. **Task 1: Status-first error mapping in urlShortener** - `f47b465` (fix)
2. **Task 2: Validated latency store** - `f97b50e` (fix)
3. **Task 3: noopener on social share windows** - `4c27f65` (fix)

## Verification
- `npx vitest run`: 24 files, 276 tests pass (12 new).
- `npx tsc --noEmit`: clean. `npx eslint` on touched files: clean.
- `NODE_ENV=production npx vite build`: succeeds.
- Negative check: with each source file reverted to `main`, its new tests fail (4 / 4 / 1).

## Review Follow-up (PR #145, P2)
- Status mapping still depended on reading the body: a 429 whose body stream failed threw inside `parseResponseBody()` before the status was mapped. Fixed in `da21374` by making `parseResponseBody()` never throw (a failed read is "no body"), so the status-first mapping always runs. Four tests cover failing streams, including a real `Response` over an erroring `ReadableStream`; all fail without the fix.

## Deviations from Plan
- None in scope; two review items were corrected as stale (see key-decisions).

## Issues Encountered
- First cut reported an empty 2xx body as "Failed to shorten URL (HTTP 201)"; adjusted so a 2xx with no parseable body is "Malformed shortener response".

## User Setup Required
None.
