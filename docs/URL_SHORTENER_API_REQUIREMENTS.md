# URL Shortener API — Requirements for Secure Client-Side Use

**Audience:** URL shortener team (`go.bahar.co.il`)
**Requested by:** Groovy (drum tutorial web app)
**Related issue:** [AdarBahar/groovy#113](https://github.com/AdarBahar/groovy/issues/113)
**Date:** 2026-06-11
**Status:** Proposed

---

## 1. Context & Problem

Groovy is a **fully static single-page app** (Vite/React, served from static hosting — no backend of its own). It calls the shortener to turn long groove-sharing URLs (often 1,500–8,000 chars of encoded pattern data) into short links.

Current integration (`src/services/urlShortener.ts`):

```
POST {SHORTENER_API}/api/shorten
Authorization: Bearer {VITE_URL_SHORTENER_KEY}
X-API-Key: {VITE_URL_SHORTENER_KEY}
Content-Type: application/json

{ "url": "<long groove URL>" }
```

**The problem:** `VITE_URL_SHORTENER_KEY` is baked into the public JavaScript bundle at build time. Anyone can extract it from the deployed site and:

- consume the API quota attributed to Groovy,
- create arbitrary short links (spam/phishing) under Groovy's key,
- get the key revoked, breaking the feature for legitimate users.

Because Groovy has no server, **no client-side change can fix this** — the fix must come from the shortener service.

## 2. Immediate Action (independent of any option below)

- **R-0.1 — Rotate the currently issued key.** The key shipped in every deployed Groovy bundle to date must be treated as compromised and revoked as soon as a replacement mechanism (Section 4) is live.

## 3. Goals & Non-Goals

**Goals**

- Groovy can shorten URLs directly from the browser with **no secret in the bundle**.
- Abuse of the endpoint (spam links, quota exhaustion) is bounded by server-side controls.
- Existing response contract is preserved where possible (see Section 5.3).

**Non-Goals**

- Per-user accounts / authentication of Groovy end users.
- Analytics or click-tracking changes.
- Groovy standing up its own backend (out of scope for a static app — see Option B trade-offs).

## 4. Solution Options (pick one — Option A preferred)

### Option A — Origin-scoped public key (preferred)

Issue a **publishable key** that is safe to embed because the server enforces its scope (same model as Google Maps / Stripe publishable keys).

A request with a publishable key is only accepted when **all** scope checks pass:

| Check | Requirement |
|---|---|
| Origin allowlist | `Origin` / `Referer` must match the key's registered origins (see R-A.2) |
| Target-domain allowlist | The submitted `url` must resolve to an allowed host (see R-A.3) |
| Rate limit | Per-IP and per-key limits (see Section 5.2) |

**Requirements**

- **R-A.1** — Support a key type `publishable` distinguishable from secret keys; secret-key privileges (delete links, list links, stats) MUST NOT be available to publishable keys. Publishable keys may only call `POST /api/shorten`.
- **R-A.2** — Each publishable key has a configurable **origin allowlist** (exact scheme+host, wildcard subdomains acceptable). For Groovy: `https://www.bahar.co.il` and `http://localhost:*` (dev). Requests without a matching `Origin`/`Referer` are rejected `403`.
- **R-A.3** — Each publishable key has a configurable **target-domain allowlist**: the `url` payload must be HTTP(S) and its host must match (for Groovy: `www.bahar.co.il`). This is the critical anti-phishing control — the key cannot be used to shorten arbitrary third-party URLs even if stolen.
- **R-A.4** — CORS: `Access-Control-Allow-Origin` restricted to the key's origin allowlist (no `*`), `POST` + preflight support.
- **R-A.5** — Key management: ability to rotate a publishable key without downtime (old + new valid during an overlap window).

**Why preferred:** zero new infrastructure for either side; the key in the bundle becomes worthless to an attacker (it can only create links to Groovy's own domain, from Groovy's origin, at a bounded rate).

### Option B — Server-side proxy endpoint (fallback)

The shortener team (or Groovy's hosting) exposes a proxy, e.g. `POST https://go.bahar.co.il/api/groovy/shorten`, that holds the real secret server-side and accepts unauthenticated browser requests subject to the same controls as R-A.2–R-A.4 (origin allowlist, target-domain allowlist, rate limits).

- **R-B.1** — Endpoint requires no credentials from the browser.
- **R-B.2** — Same origin, target-domain, and rate-limit controls as Option A.
- **R-B.3** — The internal secret never appears in any client-visible response or error.

Functionally equivalent to Option A but adds a routing layer; only choose this if key-type scoping (R-A.1) is too costly to implement.

## 5. Common API Requirements (both options)

### 5.1 Endpoint behavior

- **R-C.1** — `POST /api/shorten` accepts `{ "url": string }` with URLs up to **8,192 characters** (Groovy share URLs are legitimately long).
- **R-C.2** — Validate `url` is well-formed HTTP(S); reject others with `400` and a machine-readable error.
- **R-C.3** — Idempotency (nice-to-have): shortening the same URL twice may return the same short code, reducing storage abuse.

### 5.2 Abuse controls

- **R-C.4** — Rate limit per client IP: suggested **10 requests/minute, burst 20** (Groovy users shorten at most a few links per session).
- **R-C.5** — Rate limit per key/endpoint overall: suggested **1,000/day** cap for Groovy, adjustable.
- **R-C.6** — `429` responses include `Retry-After` (Groovy already surfaces a "rate limited" message keyed off status 429).
- **R-C.7** — Logging/alerting on anomalous volume per key so abuse is detected, not just throttled.
- **R-C.8** — (Optional) Support for a proof-of-work or CAPTCHA/Turnstile challenge mode that can be switched on under attack without breaking the API contract (e.g. `403` + challenge token flow).

### 5.3 Response contract (keep compatible)

Groovy currently parses:

```json
{
  "success": true,
  "data": {
    "shortUrl": "https://go.bahar.co.il/abc123",
    "shortCode": "abc123",
    "originalUrl": "...",
    "createdAt": "ISO-8601",
    "expiresAt": "ISO-8601 (optional)"
  },
  "error": { "message": "...", "statusCode": 400 }
}
```

- **R-C.9** — Preserve this shape (or version the endpoint and document the new one).
- **R-C.10** — Document link lifetime/expiry policy for links created via the public/publishable path. Groovy shares are long-lived; **no expiry (or ≥ 1 year)** preferred.

## 6. Acceptance Criteria

1. A request from an allowed origin, with an allowed target domain, within rate limits → `200` with the contract in 5.3.
2. Same request from a non-allowed origin → `403`; browser preflight also fails (no permissive CORS).
3. Request shortening `https://evil.example/...` with Groovy's publishable key → `400`/`403` (target-domain check), regardless of origin.
4. Exceeding per-IP rate → `429` + `Retry-After`.
5. Publishable key cannot call any endpoint other than `POST /api/shorten` (Option A).
6. The old secret key is revoked, and no Groovy build after the migration contains a secret-class credential.
7. Key rotation procedure documented and tested (overlap window works).

## 7. Migration Plan

| Step | Owner | Action |
|---|---|---|
| 1 | Shortener team | Implement chosen option (A preferred) on staging; share publishable key / proxy URL |
| 2 | Groovy | Update `src/services/urlShortener.ts`: drop `Authorization: Bearer` secret usage; send publishable key (header `X-API-Key`) or call proxy endpoint; keep error handling (`401`/`429`/network) |
| 3 | Both | Verify acceptance criteria 1–5 against staging |
| 4 | Groovy | Deploy production build with new integration |
| 5 | Shortener team | **Revoke the old secret key** (R-0.1) |
| 6 | Both | Monitor logs/quota for one week; tune rate limits if needed |

## 8. Open Questions for the Shortener Team

1. Is key-type scoping (publishable vs secret) feasible in the current API, or is the proxy (Option B) faster to ship?
2. What is the current link expiry policy, and can it be configured per key?
3. Can the `Origin` allowlist support localhost for development, or should dev builds use a separate key?
4. Is there an existing idempotency behavior for duplicate URLs (R-C.3)?

---

*Contact: Adar Bahar — adar.bahar@gmail.com. Generated from the Groovy code review, see issue #113 for the vulnerability details.*
