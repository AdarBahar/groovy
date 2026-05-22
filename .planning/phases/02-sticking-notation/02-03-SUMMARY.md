---
phase: 02-sticking-notation
plan: "03"
subsystem: sticking-persistence
tags: [sticking, url-codec, persistence, similarity-detection, apply-to-similar]
dependency_graph:
  requires: [02-01, 02-02]
  provides: [sticking-url-encoding, sticking-save-load, findSimilarMeasures, applyStickingToSimilar, apply-to-similar-button]
  affects: [GrooveURLCodec.ts, ProductionPage.tsx, DrumGridDark.tsx]
tech_stack:
  added: []
  patterns: [url-encoding-extension, pure-function-export, transient-ui-notification, zod-validation]
key_files:
  created:
    - src/__tests__/sticking.test.ts
  modified:
    - src/core/GrooveURLCodec.ts
    - src/pages/ProductionPage.tsx
    - src/components/production/DrumGridDark.tsx
decisions:
  - "URL encoding uses custom char map (r/l/b/-) not JSON, matching existing GrooveScribe-compatible format"
  - "Sticking Stk param omitted when all values are null to avoid URL bloat"
  - "findSimilarMeasures and applyStickingToSimilar exported as named module-level exports for testability"
  - "Apply to Similar feedback via transient per-measure state (setTimeout 2.5s), no external toast library needed"
  - "Test file placed in src/__tests__/ directory (new, matches vitest include pattern src/**/*.test.ts)"
metrics:
  duration_seconds: 655
  completed_date: "2026-05-22"
  tasks_completed: 5
  tasks_total: 5
  files_created: 1
  files_modified: 3
---

# Phase 02 Plan 03: Sticking Persistence and Apply to Similar Measures Summary

**One-liner:** Sticking data persisted in URL encoding via compact char-map param; similarity-detection-based "Apply to Similar Measures" with per-measure transient feedback.

## Tasks Completed

| Task | Name | Commit | Key Files |
|------|------|--------|-----------|
| 1 | Extend GrooveURLCodec to include sticking in URL encoding/decoding | 872bc6d | src/core/GrooveURLCodec.ts |
| 2 | Implement findSimilarMeasures similarity detection | 83cd0d5 | src/pages/ProductionPage.tsx |
| 3 | Add "Apply to Similar Measures" button and handler | 6c2009f | DrumGridDark.tsx, ProductionPage.tsx |
| 4 | Write tests for similarity detection and Apply to Similar | 45dc2db | src/__tests__/sticking.test.ts |
| 4b | Fix TypeScript error in test file | 1cc6d87 | src/__tests__/sticking.test.ts |
| 5 | End-to-end verification (automated: type check + build + tests) | — | All |

## Files Modified

| File | Change | Lines Added |
|------|--------|-------------|
| src/core/GrooveURLCodec.ts | Sticking encoding/decoding with validation | +114 |
| src/pages/ProductionPage.tsx | findSimilarMeasures, applyStickingToSimilar, handleApplyToSimilar | +83 net |
| src/components/production/DrumGridDark.tsx | Apply button, notification state, onApplyToSimilar prop | +50 net |
| src/__tests__/sticking.test.ts | 16 tests for similarity and apply-to-similar | +276 |

## URL Encoding/Decoding (Task 1)

The URL codec uses a GrooveScribe-compatible custom format. Sticking is added as a new `Stk` URL parameter:

**Encoding scheme:**
- `R` → `r`, `L` → `l`, `L/R` → `b`, `null` → `-`
- Measures separated by `|` (same as note patterns)
- Example: `Stk=|rlrl----|` (Measure 1 with R-L alternating first 4 positions)
- Omitted entirely if all sticking values are null (no URL bloat)

**Security (T-02-07):** Decoded sticking parameters validated with Zod schema before use:
- Character set restricted to `[rlb|-]`
- Maximum length enforced (600 chars)
- Invalid characters treated as null

**Backward compatibility:** URLs without the `Stk` parameter decode cleanly (sticking fields remain undefined).

**localStorage save/load:** GrooveStorage encodes via `encodeGrooveToURL` and decodes via `decodeURLToGroove`. Since sticking is now included in URL encoding, saving and loading grooves automatically preserves sticking with no additional changes needed to GrooveStorage.

## Similarity Detection Algorithm (Task 2)

`findSimilarMeasures(groove, targetMeasureIndex)` returns indices of similar measures:

```
1. Get target measure's effective time signature (own or global default)
2. Calculate target notesPerMeasure = (division / ts.noteValue) * ts.beats
3. For each other measure:
   a. Check time signature matches (beats AND noteValue)
   b. Check subdivision count matches
   c. Compare notes arrays element-by-element across ALL_DRUM_VOICES
4. Return indices where all 3 checks pass
```

**Articulation handling:** `hihat-open` and `hihat-closed` are separate `DrumVoice` values in the type system. The element-wise comparison treats them as different patterns automatically — no special articulation logic needed.

**Performance:** O(n * voices * subdivisions) = O(16 * 25 * 48) = ~19,200 comparisons max. Acceptable per D-05 analysis.

## Apply to Similar Measures (Task 3)

**Button:** `CopyCheck` icon (purple color, distinguishable from other actions) in measure header, visible only when `isStickingSetupActive = true`, disabled when measure has no non-null sticking values.

**Handler flow:**
1. `handleApplyToSimilarClick(measureIndex)` → calls `onApplyToSimilar(measureIndex)`
2. `handleApplyToSimilar` in `ProductionPage` calls `applyStickingToSimilar(groove, measureIndex)` to get similar indices
3. If no similar measures: returns `"No similar measures found."`
4. If matches found: deep-copies source sticking to each target measure via `setGroove`
5. Returns `"Applied to N similar measure(s)."` for display
6. `DrumGridDark` shows message transiently for 2.5 seconds then auto-clears

**Deep copy (T-02-09):** `[...sourceSticking]` spread creates independent copies. Verified in test: mutating the copy does not affect the source.

**Undo/redo:** Changes go through `setGroove` (via `useHistory`), so undo/redo work automatically.

## Test Results (Task 4)

16 tests, all passing:

**findSimilarMeasures tests (9):**
- Finds measures with identical note patterns
- Excludes target measure from results
- Returns empty for single-measure groove
- Returns empty when no similar found
- Detects articulation differences (hihat-closed vs hihat-open = different)
- Detects different subdivision counts as not similar
- Detects different time signatures as not similar
- Finds multiple similar measures in larger grooves
- Backward compatibility: grooves without sticking field work correctly

**applyStickingToSimilar tests (6):**
- Returns similar measure indices when source has sticking
- Returns empty when no similar measures
- Returns empty when source sticking is all null
- Returns empty when source has no sticking field
- Returns multiple indices when multiple similar measures
- Backward compatibility: measures without sticking field work

**Deep copy verification (1):**
- Mutation of copy does not affect source array

## End-to-End Verification (Task 5)

Automated verification results:
- TypeScript type check: PASSED (0 errors)
- Build: PASSED (830 KB main chunk, pre-existing size warning)
- Test suite: PASSED (130 tests / 10 test files)

Manual verification checklist (code review confirmed):
- [x] URL encoding includes sticking (Stk param in encodeGrooveToURL)
- [x] URL decoding restores sticking with validation (T-02-07)
- [x] save via GrooveStorage.saveGroove → encodeGrooveToURL (sticking included)
- [x] load via GrooveStorage.decodeGroove → decodeURLToGroove (sticking restored)
- [x] findSimilarMeasures correctly identifies matching patterns
- [x] Articulation differences detected (separate DrumVoice values)
- [x] Apply to Similar button visible only in sticking setup mode (D-11)
- [x] Button disabled when no non-null sticking values
- [x] Applies sticking to all similar measures without modifying notes
- [x] Shows "No similar measures found" when no matches
- [x] Feedback messages display and auto-clear after 2.5s
- [x] Undo/redo work (changes via setGroove → useHistory)
- [x] Backward compatible: URLs without Stk param decode cleanly
- [x] Backward compatible: old grooves without sticking field work

## Backward Compatibility

- URL decode: `Stk` param absent → sticking undefined in all measures (treated as empty by editor)
- GrooveData validation: `sticking?: StickingValue[]` is optional in MeasureConfigSchema
- findSimilarMeasures: handles measures with no sticking field without errors
- DrumGridDark: falls back to `createEmptySticking` when measure.sticking is undefined

## Threat Mitigations Applied

| Threat | Mitigation | Status |
|--------|-----------|--------|
| T-02-07: URL tampering on sticking field | Zod validation (char set + length) before decoding | Applied |
| T-02-08: findSimilarMeasures O(n²) DoS | MAX_MEASURES=16 → O(16²)=256 max iterations, acceptable | Applied |
| T-02-09: Apply handler deep copy | Array spread `[...sourceSticking]` creates independent copies | Applied, verified in tests |

## Known Limitations

None. Plan fully implemented.

## Architecture Notes

The functions `findSimilarMeasures` and `applyStickingToSimilar` are exported named functions defined at module level in `ProductionPage.tsx`. They are pure functions (no side effects, no React hooks) suitable for unit testing by direct import. The `handleApplyToSimilar` handler inside the component calls these pure functions and applies the results to React state.

## Self-Check

- [x] src/__tests__/sticking.test.ts exists
- [x] src/core/GrooveURLCodec.ts contains sticking encoding
- [x] src/pages/ProductionPage.tsx contains findSimilarMeasures and applyStickingToSimilar
- [x] src/components/production/DrumGridDark.tsx contains Apply to Similar button
- [x] .planning/phases/02-sticking-notation/02-03-SUMMARY.md exists
- [x] Commits 872bc6d, 83cd0d5, 6c2009f, 45dc2db, 1cc6d87 exist
- [x] TypeScript type check passes (0 errors)
- [x] Build succeeds
- [x] All 130 tests pass (16 new sticking tests + 114 existing)
- [x] No unexpected file deletions

## Self-Check: PASSED
