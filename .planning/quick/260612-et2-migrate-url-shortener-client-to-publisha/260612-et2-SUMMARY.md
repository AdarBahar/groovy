---
phase: quick-260612-et2
plan: 01
subsystem: url-shortener-client
tags: [security, api-migration, publishable-key, shortener, tests]
requires: []
provides: [publishable-key-shortener-client, forbidden-error-type, retry-after-parsing, shorturl-memoization, shortener-test-coverage]
affects: [src/services, .env.example]
tech-stack:
  added: []
  patterns: [module-level-memoization-map, env-stub-dynamic-import-testing, distinct-403-vs-401-error-mapping]
key-files:
  created:
    - src/services/urlShortener.test.ts
  modified:
    - src/services/urlShortener.ts
    - .env.example
decisions:
  - "retryAfter (not retryAfterSeconds) as the ShortenerError field name, per PLAN.md <interfaces> target spec; JSDoc documents the unit as seconds"
  - "getShortenerErrorMessage 'forbidden' returns 'URL shortening unavailable' (mirrors 'unauthorized'), keeping the copy-the-long-URL UX"
  - "Network branch matches bare `error instanceof TypeError` (dropped `.includes('fetch')`) so browser-varying CORS-block messages map to 'network'"
  - "Cache only successes; errors are never memoized so a 429/403 can be retried by the user"
metrics:
  duration_minutes: 12
  completed: 2026-06-12
---

# Quick Task 260612-et2: Migrate URL Shortener Client to Publishable API Key Summary

**One-liner:** Shortener client now reads VITE_URL_SHORTENER_PUBLISHABLE_KEY (no old-var fallback), sends X-API-Key only, accepts any 2xx, handles 403 as a logged 'forbidden' type, exposes Retry-After on 429, and memoizes longUrl → shortUrl per session — with 16 new colocated vitest cases (#113, G-1/G-3/G-4/G-8/G-10/G-11/G-12/G-13).

## What Was Done

### Task 1 — feat: migrate shortener client + tests (commit 8a6ce78)

`src/services/urlShortener.ts`:
- Key read renamed to `import.meta.env.VITE_URL_SHORTENER_PUBLISHABLE_KEY || ''` with NO fallback to the compromised `VITE_URL_SHORTENER_KEY` (G-1, G-3). `VITE_URL_SHORTENER_API` base-URL read unchanged.
- Headers now Accept + X-API-Key + Content-Type only; `Authorization: Bearer` removed (G-4). Body stays exactly `{ url: longUrl }` (G-6).
- Success = `response.ok && data.success` (any 2xx, incl. 201) returning `data.data.shortUrl`, with a guard throwing 'unknown' on a malformed body missing `shortUrl` (G-8).
- `ShortenerErrorType` extended with `'forbidden'`; 403 branch logs via `logger.error` (always logs per CLAUDE.md) before throwing — no silent retry (G-12). 401 stays 'unauthorized'.
- `ShortenerError` gained optional `retryAfter?: number` as a 4th constructor param (backward compatible); 429 parses the `Retry-After` header via `parseRetryAfter()` with NaN→undefined guard (G-11).
- Network branch broadened to bare `error instanceof TypeError` so CORS-block TypeErrors with browser-varying messages map to 'network' (G-13).
- Module-level `const shortUrlCache = new Map<string, string>()` memoizes successes only; cache hit returns without fetch (G-10).
- Stale header comment updated to document the publishable bundle-safe key.
- `getShortenerErrorMessage` extended with `case 'forbidden'` → 'URL shortening unavailable'.

`src/services/urlShortener.test.ts` (new, TDD — written first, 14/16 RED against old code, all GREEN after):
- 201 success; 200 (any-2xx) success; request shape (POST /api/shorten, exact JSON body, X-API-Key present, Authorization absent).
- 401 → 'unauthorized'; 403 → 'forbidden' + logger.error spy called; 429 + Retry-After '30' → 'rate_limited' with retryAfter 30; 429 without header → retryAfter undefined.
- TypeError('Failed to fetch') and TypeError('Load failed') → 'network'.
- Memoization: same URL twice → one fetch; different URL → second fetch; failures not cached.
- isShortenerConfigured true/false; unconfigured shortenURL throws 'unauthorized' without fetching.
- getShortenerErrorMessage 'forbidden' case + existing-message regression guards.
- Env-at-module-top-level handled via vi.stubEnv + vi.stubGlobal('fetch') + vi.resetModules + dynamic import per test; afterEach unstubs all envs/globals, restores mocks, resets modules (also isolates the module-level cache).

### Task 2 — docs: .env.example (commit 94a7462)

- `VITE_URL_SHORTENER_KEY=sk_live_...` line replaced with `VITE_URL_SHORTENER_PUBLISHABLE_KEY=pk_live_your_publishable_key_here`.
- Section comment notes the key is publishable/bundle-safe and that local dev must use the SEPARATE development publishable key (origins `http://localhost:*`), not the production key (G-2).
- No `sk_` or old-var reference remains anywhere in the file (G-3).

## Verification

- `npx vitest run`: 231 tests passed (215 baseline + 16 new), green before and after each commit.
- `npm run build`: clean, no TypeScript errors, before and after each commit.
- Grep gates: `VITE_URL_SHORTENER_KEY` absent from src/ and .env.example; `Authorization` absent from urlShortener.ts; `sk_` absent from .env.example; `forbidden` present in type union, error branch, and message switch.
- Call sites unchanged and verified: ShareModal.tsx imports shortenURL/isShortenerConfigured/getShortenerErrorMessage; PrintPreviewModal.tsx imports shortenURL/isShortenerConfigured. Exported API surface preserved (constructor extended with optional param only).

## Deviations from Plan

None — plan executed exactly as written. Note: the orchestrator prompt mentioned `retryAfterSeconds` as the field name; PLAN.md's `<interfaces>` section explicitly specifies `retryAfter?: number`, which was followed (unit documented as seconds in JSDoc).

## TDD Gate Compliance

Task 1 was tdd="true" but PLAN.md explicitly specified a single commit for the migrated service + test file ("Two commits — (1) the migrated service + new test file, (2) the .env.example doc update"). RED was verified before implementation (14/16 failing against the old module; the 2 passing were intentional regression guards for preserved behavior), GREEN verified after. Both phases landed in one commit (8a6ce78) per the plan's commit spec rather than separate test/feat commits.

## Out-of-Band / Ops (not part of this change)

- Actual `pk_live_...` key values are delivered out-of-band by the shortener team.
- CI/hosting env updates and revocation of the old `sk_` key are user-side ops (G-3 ops portion) tracked separately under #113.

## Self-Check: PASSED

- src/services/urlShortener.ts: FOUND
- src/services/urlShortener.test.ts: FOUND
- .env.example updated: FOUND
- Commit 8a6ce78: FOUND
- Commit 94a7462: FOUND
