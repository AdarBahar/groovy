---
phase: quick-261102-h1c
plan: 01
subsystem: security
tags: [dependencies, csp, headers, supply-chain]

# Dependency graph
requires: []
provides:
  - "Direct runtime deps (jspdf, dompurify, zod, react-router-dom) outside advisory ranges"
  - "Enforcing Content-Security-Policy for the /groovy/ path in .htaccess"
affects: [build, deployment, export, share]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "CSP allow-list is derived from the origins the source actually loads (head.tsx, analytics.ts, urlShortener.ts, exporters) and documented inline next to the header"

key-files:
  created: []
  modified:
    - package.json
    - package-lock.json
    - .htaccess

key-decisions:
  - "frame-ancestors * kept open because Share > Embed hands users an iframe snippet for third-party sites; X-Frame-Options is unset for this path so the CSP directive is the single source of truth"
  - "Both Amplitude zones (US + EU) are allow-listed in connect-src even though the loader is pinned to EU, so a zone change cannot silently drop analytics"
  - "style-src keeps 'unsafe-inline' (React style attributes, abcjs); script-src grants neither inline nor eval"
  - "Transitive advisories (fflate under jspdf; vite/rollup/postcss toolchain) left for a separate task"

patterns-established:
  - "Verification greps for the header line reject 'unsafe-eval' and bare https: so regressions are caught before deploy"

requirements-completed: [SEC-P1-DEPS, SEC-P1-CSP]

# Metrics
duration: 25min
completed: 2026-11-02
---

# Quick Task 261102-h1c: Fix P1 Security Items Summary

**Four direct runtime dependencies moved out of their advisory ranges, and the app now ships its own enforcing CSP with no eval allowance and no bare https: sources.**

## Performance

- **Duration:** 25 min
- **Started:** 2026-11-02T12:16:00Z
- **Completed:** 2026-11-02T12:41:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- `jspdf ^4.0.0 -> ^4.2.1` (critical), `dompurify ^3.3.1 -> ^3.4.17` (high, SVG-export sanitizer), `zod ^4.3.5 -> ^4.6.7` (high), `react-router-dom ^7.12.0 -> ^7.18.5` (high). `npm audit --omit=dev` went from 12 findings (1 critical) to 7, none of them direct.
- `.htaccess` sets `Content-Security-Policy` for `/groovy/`, replacing the site-wide policy's `'unsafe-eval'` and bare `https:` sources with the exact origins the app loads: self, `www.bahar.co.il` + `cdn.amplitude.com` (analytics), Google Fonts, Font Awesome on cdnjs, `go.bahar.co.il` (shortener), Amplitude ingest/remote-config hosts, and `data:`/`blob:` for QR codes and image export.
- Stale `/scribe/` upload-path comment corrected to `/groovy/`.

## Task Commits

1. **Task 1: Upgrade advisory-range direct dependencies** - `4cf46a9` (fix)
2. **Task 2: Add an enforcing CSP to .htaccess** - `52b5b19` (fix)

## Files Created/Modified
- `package.json`, `package-lock.json` - four dependency ranges bumped; no source changes needed.
- `.htaccess` - CSP header with inline rationale per directive; `X-Frame-Options` unset in favour of `frame-ancestors`.

## Verification
- `npx vitest run`: 22 files, 245 tests pass (unchanged).
- `npx tsc --noEmit`: clean.
- `NODE_ENV=production npx vite build`: succeeds.
- `.htaccess` checks: exactly one CSP header line, balanced quotes, no `unsafe-eval`, no bare `https:`, every expected origin present.

## Decisions Made
- Framing stays allowed (`frame-ancestors *`): the embed feature is a product requirement and the live site already permits it.
- Amplitude US and EU hosts both allow-listed; the loader is EU-pinned today.

## Deviations from Plan
- Comment wording in `.htaccess` avoids quoting the literal `'unsafe-eval'` so the verification grep stays meaningful.

## Issues Encountered
- `cdn.amplitude.com` is blocked from this sandbox, so the SDK's ingest hostnames were taken from the loader's `serverZone = 'EU'` setting and SDK defaults rather than read from the SDK source. The live site should be spot-checked after deploy (see below).

## User Setup Required
- The header only takes effect once the updated `.htaccess` is uploaded to `/groovy/` on the Apache host (GitHub Pages ignores `.htaccess`). After deploying, open the live site with DevTools and confirm no CSP violations appear for analytics, fonts, QR/PNG export, and the URL shortener.
