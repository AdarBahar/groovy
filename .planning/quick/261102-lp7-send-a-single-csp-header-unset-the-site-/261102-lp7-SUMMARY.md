---
phase: quick-261102-lp7
plan: 01
subsystem: deployment
tags: [csp, headers, apache, htaccess]

requires: []
provides:
  - "Single CSP header on /groovy/ responses"
  - "public/.htaccess as the only copy of the file"
affects: [deployment]

tech-stack:
  added: []
  patterns:
    - "When overriding a header set at a parent level, unset it in the same Apache header table it was set in (onsuccess vs always)"

key-files:
  created: []
  modified:
    - public/.htaccess
    - .htaccess (deleted)

key-decisions:
  - "Unset rather than re-set in the onsuccess table: one policy, one table, no intersection semantics to reason about"
  - "Root .htaccess removed; it was byte-identical to public/.htaccess and no longer part of the deploy path"

requirements-completed: [SEC-P2-SINGLE-CSP]

duration: 10min
completed: 2026-11-02
---

# Quick Task 261102-lp7: Single CSP Header Summary

**/groovy/ will send exactly one Content-Security-Policy header once deployed; the repo has one source of truth for the file.**

## Task Commits
1. **Task 1: Send a single CSP header and drop the duplicate file** - `6c1e1de` (fix)

## Verification
- Static: one `Content-Security-Policy "` line, one `Header unset Content-Security-Policy`, balanced quotes, no `unsafe-eval`.
- `NODE_ENV=production npx vite build`: `dist/.htaccess` is byte-identical to `public/.htaccess`.
- Live check after deploy (user): `curl -sI https://www.bahar.co.il/groovy/ | grep -ci content-security-policy` should print 1.

## Deviations from Plan
None.

## User Setup Required
Deploy via the inmotion-deploy service; then run the live check above.
