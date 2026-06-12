# Context: Migrate URL shortener client to publishable API key (#113)

The URL shortener team (go.bahar.co.il) has implemented and deployed Option A
(origin-scoped publishable keys) from `docs/URL_SHORTENER_API_REQUIREMENTS.md`.
Their integration requirements for Groovy are below, verbatim. Groovy's side is
step 2 of the migration checklist: apply G-1 through G-13.

Current state of the Groovy client:

- `src/services/urlShortener.ts` reads `VITE_URL_SHORTENER_API` and
  `VITE_URL_SHORTENER_KEY`, sends the key in BOTH `Authorization: Bearer` and
  `X-API-Key`, requires `response.ok && data.success`, special-cases only 401
  and 429, maps network `TypeError` to a `'network'` error type.
- Call sites: `src/components/production/ShareModal.tsx` and
  `src/components/production/PrintPreviewModal.tsx` (both use `shortenURL`,
  `isShortenerConfigured`, `getShortenerErrorMessage`).
- No test file exists for the service yet.
- `.env.example` documents the old `VITE_URL_SHORTENER_KEY` (sk_ style).
- The actual `pk_live_…` key values are delivered out-of-band; code must only
  rename the env var. `.env.local` currently has the shortener vars commented
  out.

---

# Groovy Integration — Requirements for Migrating to Publishable API Keys (from shortener team, 2026-06-12)

## Summary

The shortener now supports publishable API keys (`pk_live_…`) that are safe to
embed in Groovy's static bundle. Server enforces: endpoint restriction (only
`POST /api/shorten`), origin allowlist (403 otherwise), target-domain allowlist
(only `www.bahar.co.il`), per-key daily cap + per-IP rate limit (429 with
Retry-After). The old secret key will be revoked after migration.

## Keys

- Production `pk_live_…`: origins `https://www.bahar.co.il`
- Development `pk_live_…`: origins `http://localhost:*`
- Both: target-domain allowlist `www.bahar.co.il`, 1,000 creations/UTC day.

## Requirements for Groovy

- **G-1** — Rename `VITE_URL_SHORTENER_KEY` → `VITE_URL_SHORTENER_PUBLISHABLE_KEY`
  (build-time env). It may appear in the public bundle.
- **G-2** — Development key in separate env file for local dev; do not add
  localhost origins to the production key.
- **G-3** — Remove old secret key from all locations (env files, CI/CD,
  hosting config). Treat as compromised. (Mostly user-side ops; code side =
  stop reading the old var.)
- **G-4** — Drop the `Authorization: Bearer` header; keep `X-API-Key` only.
- **G-5** — No `Origin` handling needed in browser code; non-browser callers
  (tests) must set an allowed `Origin` explicitly or get 403.
- **G-6** — Body must be exactly `{ "url": string }`; `customCode`,
  `expiresAt`, `ttl` are rejected 400 for publishable keys.
- **G-7** — URLs up to 16,384 chars accepted; must be HTTP(S) pointing at
  `www.bahar.co.il` or 403.
- **G-8** — Success is **201** (not 200); accept any 2xx as success rather
  than strictly 200. Response shape unchanged:
  `{ success: true, data: { shortUrl, shortCode, originalUrl, createdAt, expiresAt: null } }`
- **G-9** — Links have no expiry (`expiresAt: null`). No change needed.
- **G-10** — No server-side dedup. Recommended: memoize `longUrl → shortUrl`
  client-side (in-memory or sessionStorage) so repeated share clicks in one
  session don't burn quota.
- **G-11** — Keep existing 429 handling; optionally read `Retry-After`.
- **G-12** — Handle `403` distinctly from `401`: 403 in production means
  allowlist/config problem or tampering — log loudly (logger.error), do not
  silently retry. 401 = key missing/invalid/expired → fall back to copying the
  long URL.
- **G-13** — CORS-blocked responses surface as fetch `TypeError` with no HTTP
  status — degrade gracefully: offer the full-length URL for manual copying.

Error body shape unchanged:
`{ "success": false, "error": { "message": "...", "statusCode": n } }`

## Acceptance criteria relevant to client code

- Accept 201/2xx as success.
- 403 handled distinctly and reported (logged), not lumped with 401.
- 429 keeps existing message; `Retry-After` read if surfacing countdown.
- Network/CORS failure degrades to "copy the long link" UX.
- No secret-class (`sk_`) credential in the bundle.
