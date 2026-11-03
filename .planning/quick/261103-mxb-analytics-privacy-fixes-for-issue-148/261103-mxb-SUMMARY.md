---
phase: quick-261103-mxb
plan: 01
status: complete
---

# Quick 261103-mxb: Analytics privacy fixes (#148)

Analytics events no longer send groove names, device IDs, referrers or error messages. The host check is strict. Users can opt out in the About modal.

## Commits
- 70ad4b9: analytics.ts hardening and analytics.test.ts (9 tests)
- 28ae3d8: callers (ProductionPage, MIDISettingsModal, useMIDIInput, App, ErrorBoundary)
- 95dd434: About modal opt-out checkbox and ShareModal shortener notice

## Verification
- vitest: 25 files, 285 tests, all pass
- tsc -b: pass
- lint: 65 problems (43 errors, 22 warnings). The count is the same without my changes (pre-existing).

## Deviations
- The global test setup stubs localStorage with no-op functions. analytics.test.ts installs an in-memory storage with vi.stubGlobal. No change to setup.ts.
- No change was needed in useMIDIInput.test.tsx or ShareModal.test.tsx.
