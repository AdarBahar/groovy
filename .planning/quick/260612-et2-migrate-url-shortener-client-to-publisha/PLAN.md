---
phase: quick-260612-et2
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/services/urlShortener.ts
  - src/services/urlShortener.test.ts
  - .env.example
autonomous: true
requirements: [G-1, G-3, G-4, G-8, G-10, G-11, G-12, G-13]
must_haves:
  truths:
    - "Full test suite (215 + new shortener tests) stays green and `npm run build` is clean"
    - "urlShortener.ts reads VITE_URL_SHORTENER_PUBLISHABLE_KEY and NEVER reads the old VITE_URL_SHORTENER_KEY (compromised key cannot leak via fallback)"
    - "Requests send X-API-Key only — no Authorization: Bearer header"
    - "Any 2xx response (incl. 201) is treated as success"
    - "403 is a distinct 'forbidden' error type that is logged via logger.error; 401 stays 'unauthorized'"
    - "429 exposes the parsed Retry-After value on the thrown ShortenerError"
    - "Network/CORS TypeError still maps to 'network' so call sites can offer the long URL"
    - "Repeated shortening of the same longUrl in one session returns the cached short URL without a second fetch"
    - "Exported API surface (shortenURL, isShortenerConfigured, getShortenerErrorMessage, ShortenerError) is unchanged so ShareModal and PrintPreviewModal keep working"
    - ".env.example documents the publishable (bundle-safe) key and the separate dev key"
  artifacts:
    - path: "src/services/urlShortener.ts"
      provides: "Publishable-key shortener client with forbidden/rate-limit/network handling and in-memory memoization"
      contains: "VITE_URL_SHORTENER_PUBLISHABLE_KEY"
    - path: "src/services/urlShortener.test.ts"
      provides: "Vitest coverage for 201/2xx success, 401/403/429/network mapping, memoization, isShortenerConfigured"
    - path: ".env.example"
      provides: "Documentation of VITE_URL_SHORTENER_PUBLISHABLE_KEY (pk_live_...)"
      contains: "VITE_URL_SHORTENER_PUBLISHABLE_KEY"
  key_links:
    - from: "src/services/urlShortener.ts"
      to: "src/utils/logger.ts"
      via: "import { logger }; logger.error on 403"
      pattern: "logger\\.error"
    - from: "src/components/production/ShareModal.tsx"
      to: "src/services/urlShortener.ts"
      via: "shortenURL / isShortenerConfigured / getShortenerErrorMessage imports unchanged"
      pattern: "from '\\.\\./\\.\\./services/urlShortener'"
---

<objective>
Migrate the URL shortener client (`src/services/urlShortener.ts`) to the shortener team's new publishable-API-key model, closing the client side of GitHub issue #113. Apply requirements G-1, G-3, G-4, G-8, G-10, G-11, G-12, G-13 verbatim from CONTEXT.md.

Purpose: The old secret (`sk_`) key is compromised and must die. The server now issues origin-scoped publishable (`pk_live_`) keys safe to embed in the static bundle, enforces an origin/target allowlist (403), accepts only `X-API-Key`, returns 201 on success, and rate-limits with `Retry-After` (429). The client must match this contract, handle 403 distinctly (log loudly, no silent retry), and memoize results so repeated share clicks don't burn the daily quota.

Output: Two commits — (1) the migrated service + new test file, (2) the `.env.example` doc update. Existing API surface preserved so the two call sites need no changes.
</objective>

<execution_context>
@/Users/adar/Code/groovy/.claude/get-shit-done/workflows/execute-plan.md
@/Users/adar/Code/groovy/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@.planning/quick/260612-et2-migrate-url-shortener-client-to-publisha/CONTEXT.md
@src/services/urlShortener.ts

<key_findings>
Pre-verified facts (re-verify line numbers on read):

- Current `urlShortener.ts` reads both `VITE_URL_SHORTENER_API` (base URL, keep) and `VITE_URL_SHORTENER_KEY` (key, RENAME). The API base URL var is NOT being renamed — only the key var.
- Both header forms are sent today (`Authorization: Bearer` + `X-API-Key`); drop Bearer, keep `X-API-Key`.
- Success today requires `response.ok && data.success`. New rule: any 2xx is success (G-8); 201 is the normal success code. Still read `data.data.shortUrl` from the body.
- Only 401 and 429 are special-cased today. Add a distinct 403 → `'forbidden'` branch BEFORE the generic fallthrough, and call `logger.error(...)` on it (G-12). Keep 401 → `'unauthorized'`.
- Network mapping currently checks `error instanceof TypeError && error.message.includes('fetch')`. CORS-blocked fetches throw a `TypeError` whose message varies by browser ("Failed to fetch", "NetworkError when attempting to fetch resource", "Load failed"). To reliably cover CORS blocks (G-13), match `error instanceof TypeError` for the network branch (the `.includes('fetch')` substring check is too narrow and would misclassify a real CORS TypeError as 'unknown'). Keep mapping it to `'network'`.
- Call sites already degrade gracefully and need NO changes:
  - `ShareModal.tsx` (line ~85): catches, calls `getShortenerErrorMessage(error)`, sets `shortenError`, and the original long URL stays visible/copyable via `handleCopyURL`. The new `'forbidden'` type flows through `getShortenerErrorMessage` once that switch is extended.
  - `PrintPreviewModal.tsx` (line ~65): silently falls back to the full `shareableURL` on any throw. No type-specific handling.
  Verify both at execute time; only edit if a behavior gap appears (none expected).
- `logger` is in `src/utils/logger.ts` and is React-free; `src/services/` may import it. `logger.error` always logs (per CLAUDE.md), which is exactly what G-12 wants.
- Test env: vitest, jsdom, `globals: true`, setup at `src/test/setup.ts` (stubs localStorage + requestMIDIAccess; does NOT stub fetch). `SHORTENER_API_KEY` is read at module top level, so tests MUST `vi.stubEnv(...)` + `vi.stubGlobal('fetch', ...)` BEFORE `vi.resetModules()` and a dynamic `await import('./urlShortener')`. Reset/unstub in `afterEach` (`vi.unstubAllEnvs()`, `vi.unstubAllGlobals()`, `vi.resetModules()`).
- Suite is at 215 tests, all green; build is clean. Keep it that way after each commit.
</key_findings>

<interfaces>
Current exported surface (MUST stay intact — call sites depend on it):
```typescript
export type ShortenerErrorType = 'unauthorized' | 'rate_limited' | 'network' | 'unknown';
export class ShortenerError extends Error {
  type: ShortenerErrorType;
  statusCode?: number;
  constructor(message: string, type: ShortenerErrorType, statusCode?: number);
}
export function isShortenerConfigured(): boolean;
export function shortenURL(longUrl: string): Promise<string>;
export function getShortenerErrorMessage(error: unknown): string;
```

Target changes:
- Extend `ShortenerErrorType` with `'forbidden'`.
- Add an optional `retryAfter?: number` field to `ShortenerError` (seconds parsed from the `Retry-After` header on 429); keep the existing `(message, type, statusCode)` constructor signature compatible (extend, don't break — e.g. add an optional 4th param or set the field after construction).

logger (src/utils/logger.ts):
```typescript
export const logger: {
  log(...args: unknown[]): void;   // debug-gated
  warn(...args: unknown[]): void;  // debug-gated
  error(...args: unknown[]): void; // ALWAYS logs
  isDebugMode(): boolean;
};
```

Success response body shape (unchanged):
`{ success: true, data: { shortUrl, shortCode, originalUrl, createdAt, expiresAt: null } }`
Error response body shape (unchanged):
`{ success: false, error: { message: string, statusCode: number } }`
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1 (Commit 1 — feat: migrate shortener client to publishable key + tests)</name>
  <files>src/services/urlShortener.ts, src/services/urlShortener.test.ts</files>
  <behavior>
    Write src/services/urlShortener.test.ts FIRST (RED), mocking fetch + env. Pattern per test: stub `VITE_URL_SHORTENER_PUBLISHABLE_KEY` to `'pk_live_test'` (and `VITE_URL_SHORTENER_API` where needed) via vi.stubEnv, stub fetch via vi.stubGlobal, then vi.resetModules() and `const mod = await import('./urlShortener')`. afterEach: vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules(). Cases:
    - 201 success: fetch resolves an object with ok:true, status:201, and json() returning { success:true, data:{ shortUrl:'https://www.bahar.co.il/x' } } — shortenURL(url) resolves to that shortUrl.
    - 2xx acceptance: status 200 (or 202) with a valid body also resolves to shortUrl (proves "any 2xx", not just 201).
    - Request shape: fetch called once with the '/api/shorten' path, method POST, body exactly the JSON {"url": <longUrl>}, headers include X-API-Key and DO NOT include Authorization.
    - 401: throws ShortenerError with type === 'unauthorized', statusCode === 401.
    - 403: throws ShortenerError with type === 'forbidden', statusCode === 403, AND logger.error was called (spy on the logger import via vi.spyOn).
    - 429: throws ShortenerError with type === 'rate_limited', statusCode === 429, and retryAfter parsed from a Retry-After header of '30' equals 30. Provide a response whose headers.get('Retry-After') returns '30'.
    - Network/CORS: fetch rejects with new TypeError('Failed to fetch') — throws ShortenerError with type === 'network'.
    - Memoization: two shortenURL(sameUrl) calls in the same module instance — fetch called exactly ONCE; both resolve to the same short URL. A different URL triggers a second fetch.
    - isShortenerConfigured: true when the publishable key env is set, false when stubbed empty/absent.
  </behavior>
  <action>
Rewrite `src/services/urlShortener.ts` per CONTEXT.md G-1/G-3/G-4/G-8/G-10/G-11/G-12/G-13:

1. Update the stale module header comment: document `VITE_URL_SHORTENER_PUBLISHABLE_KEY` (publishable, bundle-safe `pk_live_` key) instead of `VITE_URL_SHORTENER_KEY`; keep the `VITE_URL_SHORTENER_API` base-URL line.
2. Config (G-1, G-3): set the key constant from `import.meta.env.VITE_URL_SHORTENER_PUBLISHABLE_KEY || ''`. Do NOT add any fallback read of `VITE_URL_SHORTENER_KEY` — the old key must die. Keep the base-URL constant reading `VITE_URL_SHORTENER_API`.
3. Error type (G-12): extend `ShortenerErrorType` to include `'forbidden'`. Add `retryAfter?: number` to `ShortenerError` (G-11) without breaking the existing constructor signature — extend with an optional 4th param `retryAfter?: number` or assign the field after super(). Leave the field undefined when absent (matches the existing optional-field pattern; do not coerce to null).
4. Memoization (G-10): module-level `const shortUrlCache = new Map<string, string>();`. In `shortenURL`, if the cache has `longUrl`, return the cached value immediately (no fetch). On a successful response, set `shortUrlCache.set(longUrl, shortUrl)` before returning. Only cache successes — never cache thrown errors.
5. Headers (G-4): send Accept, X-API-Key, and Content-Type only. Remove the `Authorization: Bearer` header. Body stays exactly the JSON { url: longUrl } (G-6 — no customCode/ttl).
6. Success (G-8): treat any 2xx (response.ok, i.e. status 200–299, which includes 201) as success and return `data.data.shortUrl`. Read the JSON body to extract shortUrl. Guard for a missing data.data.shortUrl and throw 'unknown' if absent.
7. Error branches (G-11, G-12): on non-2xx, branch in order:
   - 401 → ShortenerError('Invalid API key', 'unauthorized', 401).
   - 403 → call logger.error with a clear message noting origin/target allowlist or key config problem, then throw ShortenerError(<server message or 'Request not allowed'>, 'forbidden', 403). Do NOT retry.
   - 429 → parse the Retry-After header (read it, Number()-coerce, guard NaN to undefined); throw ShortenerError('Rate limit reached. Try again later.', 'rate_limited', 429, retryAfter).
   - else → ShortenerError(data.error?.message || 'Failed to shorten URL', 'unknown', response.status).
8. Catch block (G-13): re-throw ShortenerError as-is. For network/CORS, match `error instanceof TypeError` (broaden from the current `.includes('fetch')` so CORS-block TypeErrors with varying messages map correctly) → ShortenerError('Network error. Please check your connection.', 'network'). Else → ShortenerError(<message>, 'unknown').
9. `isShortenerConfigured` (G-1): unchanged logic — returns Boolean(key) (now reading the renamed var).
10. `getShortenerErrorMessage`: add a `case 'forbidden':` returning a user-facing string (e.g. 'URL shortening unavailable' to mirror 'unauthorized', keeping the copy-the-long-URL UX). Keep existing cases.

Import `{ logger }` from `'../utils/logger'`. Conventions: explicit return types, named exports unchanged, no `any`, `.test.ts` colocated. Do not touch ShareModal/PrintPreviewModal in this task.
  </action>
  <verify>
    <automated>npx vitest run src/services/urlShortener.test.ts</automated>
  </verify>
  <done>New test file covers all behaviors above and passes. `grep -n VITE_URL_SHORTENER_KEY src/services/urlShortener.ts` returns nothing (old var gone). `grep -n Authorization src/services/urlShortener.ts` returns nothing. `grep -n forbidden src/services/urlShortener.ts` shows the new branch plus the getShortenerErrorMessage case. Full suite green (`npx vitest run`) — at least 215 tests plus the new ones. Commit: `feat: migrate URL shortener client to publishable API key (#113)`</done>
</task>

<task type="auto">
  <name>Task 2 (Commit 2 — docs: update .env.example for publishable key)</name>
  <files>.env.example</files>
  <action>
In `.env.example`, replace the `# VITE_URL_SHORTENER_KEY=sk_live_your_api_key_here` line with `# VITE_URL_SHORTENER_PUBLISHABLE_KEY=pk_live_your_publishable_key_here`. Keep the `# VITE_URL_SHORTENER_API=https://go.bahar.co.il` line above it. Update the section comment to note this is a publishable (bundle-safe) `pk_live_` key that may appear in the public bundle, and that local development should use the SEPARATE development publishable key (origins `http://localhost:*`) per the shortener team's G-2 — not the production key. Do NOT leave any `sk_` / secret-key reference in the file (G-3: the old secret key must not be documented anywhere).
  </action>
  <verify>
    <automated>grep -q "VITE_URL_SHORTENER_PUBLISHABLE_KEY=pk_live_your_publishable_key_here" /Users/adar/Code/groovy/.env.example; grep -Eq "sk_|VITE_URL_SHORTENER_KEY" /Users/adar/Code/groovy/.env.example && echo "FAIL: stale key reference" || echo "OK: no stale key"</automated>
  </verify>
  <done>.env.example documents VITE_URL_SHORTENER_PUBLISHABLE_KEY=pk_live_your_publishable_key_here with a publishable/bundle-safe + dev-key comment, and contains no `sk_` or `VITE_URL_SHORTENER_KEY` reference. Build still clean. Commit: `docs: document publishable URL shortener key in .env.example (#113)`</done>
</task>

</tasks>

<verification>
After both commits:
- `npx vitest run` → 215 + new shortener tests, all green.
- `npm run build` → clean (no TypeScript errors; the publishable key may appear in the bundle, which is intended).
- Grep gates (filtered): `grep -rn VITE_URL_SHORTENER_KEY src/ .env.example` returns nothing; `grep -n Authorization src/services/urlShortener.ts` returns nothing; `grep -rnE "sk_" .env.example` returns nothing.
- Call-site spot check: ShareModal still imports shortenURL/isShortenerConfigured/getShortenerErrorMessage; PrintPreviewModal still imports shortenURL/isShortenerConfigured. No signature changes required.
</verification>

<success_criteria>
- urlShortener.ts reads only VITE_URL_SHORTENER_PUBLISHABLE_KEY (no fallback to the compromised old var), sends X-API-Key only, accepts any 2xx, handles 403 as a distinct logged 'forbidden' error, exposes Retry-After on 429, maps CORS/network TypeError to 'network', and memoizes longUrl → shortUrl in-memory for the session.
- Exported API surface unchanged; both call sites keep working unmodified and degrade gracefully (long URL still copyable).
- New colocated test file covers 201 + 2xx success, request shape (X-API-Key present, Authorization absent), 401/403/429/network mappings, retryAfter parsing, memoization (single fetch on repeat), and isShortenerConfigured.
- .env.example documents the publishable key and the separate dev key; no secret-class credential referenced anywhere in the file.
- Full suite green and build clean after each commit.
</success_criteria>

<output>
After completion, create `.planning/quick/260612-et2-migrate-url-shortener-client-to-publisha/260612-et2-SUMMARY.md`. Note: the actual `pk_live_…` key values are delivered out-of-band by the shortener team and are NOT part of this change; CI/hosting env updates and the old-key revocation are user-side ops (G-3 ops portion) tracked separately under #113.
</output>
