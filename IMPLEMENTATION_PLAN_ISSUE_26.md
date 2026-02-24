# Implementation Plan: Issue #26 - God Component Pattern Refactoring

**Date:** February 2026
**Issue:** [P3] God Component Pattern
**Status:** PLANNING
**Priority:** Low (P3 - Optimization)

---

## Executive Summary

This document provides a comprehensive analysis of Issue #26 (God Component Pattern in `GrooveEditor.tsx`) with two implementation options, detailed risk assessment, and a thorough testing plan.

**Recommendation:** **Option B (Minimal - Documentation + Selective Hook Extraction)** - Low risk, high value approach that documents the component structure and extracts only the most complex logic into hooks.

---

## Current State Analysis

### Component Overview

**File:** `src/components/GrooveEditor.tsx`
**Current Size:** 464 lines
**Status:** Partially decomposed with custom hooks

### Current Architecture

```
GrooveEditor (464 lines)
├── useHistory() → undo/redo state management
├── useGrooveEngine() → audio playback logic
├── useURLSync() → URL serialization/sync
├── useAutoSpeedUp() → auto tempo logic
├── useGrooveActions() → note/measure/metadata operations
└── Component Logic
    ├── Render state (7 useState calls)
    ├── Effects (3 useEffect calls)
    ├── Event handlers (~200 lines)
    └── Render JSX (~100 lines)
```

### Current Responsibilities

| Category | Lines | Status | Hook? |
|----------|-------|--------|-------|
| Undo/Redo | ~20 | Extracted | ✅ `useHistory` |
| URL Sync | ~20 | Extracted | ✅ `useURLSync` |
| Audio Engine | ~30 | Extracted | ✅ `useGrooveEngine` |
| Auto Speed-Up | ~40 | Extracted | ✅ `useAutoSpeedUp` |
| Groove Actions | ~60 | Extracted | ✅ `useGrooveActions` |
| View State | ~50 | Not extracted | ❌ Candidates for extraction |
| Effects | ~60 | Partially extracted | ⚠️ Some sync logic remains |
| Event Handlers | ~80 | Not extracted | ❌ Candidates for extraction |
| Render JSX | ~50 | N/A | N/A |

---

## Implementation Options

### Option A: Full Refactoring (High Risk, High Effort)

**Approach:** Extract all remaining logic into custom hooks

#### Changes Required

1. **Extract `useMeasureActions` hook** (40 lines)
   ```tsx
   // hooks/useMeasureActions.ts
   export function useMeasureActions(groove: GrooveData, setGroove: SetGrooveState) {
     return {
       addMeasure: useCallback(...),
       duplicateMeasure: useCallback(...),
       removeMeasure: useCallback(...),
       clearMeasure: useCallback(...),
     };
   }
   ```
   - Time: 1.5 hours
   - Files: 2 (new hook + update component)

2. **Extract `useMetadataActions` hook** (30 lines)
   ```tsx
   // hooks/useMetadataActions.ts
   export function useMetadataActions(groove: GrooveData, setGroove: SetGrooveState) {
     return {
       updateTitle: useCallback(...),
       updateAuthor: useCallback(...),
       updateComments: useCallback(...),
     };
   }
   ```
   - Time: 1 hour
   - Files: 2

3. **Extract `useViewState` hook** (40 lines)
   ```tsx
   // hooks/useViewState.ts
   export function useViewState() {
     const [syncMode, setSyncMode] = useState<SyncMode>('start');
     const [advancedEditMode, setAdvancedEditMode] = useState(false);
     const [showSheetMusic, setShowSheetMusic] = useState(true);
     const [showSpeedUpConfig, setShowSpeedUpConfig] = useState(false);
     const [syncOffset, setSyncOffset] = useState(loadSyncOffset);

     return { syncMode, setSyncMode, ... };
   }
   ```
   - Time: 1 hour
   - Files: 2

4. **Extract `useGrooveSync` hook** (50 lines)
   ```tsx
   // hooks/useGrooveSync.ts
   export function useGrooveSync(groove: GrooveData, updateGroove: Function) {
     // Centralized engine sync logic
     const prevGrooveRef = useRef(null);
     useEffect(() => { /* sync logic */ }, [groove, updateGroove]);
   }
   ```
   - Time: 1 hour
   - Files: 2

5. **Update GrooveEditor component**
   - Time: 1 hour
   - Files: 1 (update component)

6. **Update Tests**
   - Time: 2-3 hours
   - Files: 5+ (test files)

#### Resulting Structure

```
GrooveEditor (120 lines) - Pure presentation
├── useViewState()
├── useMeasureActions()
├── useMetadataActions()
├── useGrooveSync()
├── useHistory()
├── useGrooveEngine()
├── useURLSync()
├── useAutoSpeedUp()
└── useGrooveActions()
```

**Total Effort:** 6-7 hours (1 day)

---

### Option B: Minimal Refactoring (Low Risk, Medium Effort) ⭐ RECOMMENDED

**Approach:** Documentation + selective hook extraction for most complex logic only

#### Changes Required

1. **Create component documentation** (30 min)
   - Add comprehensive JSDoc comments
   - Document responsibility boundaries
   - Link to related issues
   - Create ASCII diagram in comments

2. **Extract `useGrooveSync` hook only** (1 hour)
   - Most complex logic: engine synchronization
   - Highest likelihood of bugs
   - Already partially encapsulated
   - Reduces component coupling

3. **Update GrooveEditor to use new hook** (30 min)
   - Minimal changes
   - Already using other hooks

4. **Update related tests** (1 hour)
   - Only affected by `useGrooveSync` extraction
   - Lower test change scope

5. **Optional: Extract `useViewState` in future** (deferred)
   - Lower complexity
   - Can be done later if needed

#### Resulting Structure

```
GrooveEditor (350 lines) - Orchestrator component
├── useViewState() - internal (not extracted yet)
├── useGrooveSync() - ✅ NEW extracted hook
├── useHistory()
├── useGrooveEngine()
├── useURLSync()
├── useAutoSpeedUp()
└── useGrooveActions()
```

**Total Effort:** 2.5-3 hours (3-4 hours including tests)

---

### Option C: No Changes (Lowest Risk, No Effort)

**Approach:** Keep current structure with inline documentation

#### Changes Required

1. Add comprehensive JSDoc to GrooveEditor
2. Document hook responsibilities
3. Add ASCII diagrams in comments

**Total Effort:** 30 minutes

---

## Risk Management Assessment

### Risk Scoring Methodology

**Formula:** Risk Score = (Impact × Likelihood × Complexity) / Testability

- **Impact:** 1-5 (1=minimal, 5=critical)
- **Likelihood:** 1-5 (1=rare, 5=certain)
- **Complexity:** 1-5 (1=simple, 5=very complex)
- **Testability:** 1-5 (1=hard to test, 5=easy to test)

---

### Option A: Full Refactoring - Risk Assessment

| Risk Category | Score | Notes |
|---------------|-------|-------|
| **Breaking Changes** | 3/5 | Multiple refactoring points, potential import errors |
| **Test Failures** | 3.5/5 | Must update 5+ test files, complex mocking |
| **Logic Bugs** | 2/5 | Logic not changing, just moving |
| **Performance** | 2/5 | Additional hook overhead (minimal) |
| **Integration** | 3/5 | Multiple hooks need proper integration |
| **Over-engineering** | 4/5 | May add unnecessary complexity |
| **Maintenance** | 2/5 | Easier to maintain once done |
| **Rollback Difficulty** | 3/5 | Multiple files to revert |

**Average Risk Score (Full Refactoring):** 2.9/5 = **MODERATE RISK**

**High-Risk Areas:**
- Test updates (multiple affected files)
- Hook integration complexity
- Over-engineering concerns
- Potential for new bugs in hooks

**Confidence Level:** 75% success on first attempt

---

### Option B: Minimal Refactoring - Risk Assessment

| Risk Category | Score | Notes |
|---------------|-------|-------|
| **Breaking Changes** | 1/5 | Single hook extraction, minimal impact |
| **Test Failures** | 1.5/5 | Only 1-2 test files affected |
| **Logic Bugs** | 1.5/5 | Extracting existing logic only |
| **Performance** | 1/5 | Single additional hook (negligible) |
| **Integration** | 1/5 | Only one new hook to integrate |
| **Over-engineering** | 0.5/5 | Addresses documentation, minimal extraction |
| **Maintenance** | 1/5 | Clearer documentation improves maintenance |
| **Rollback Difficulty** | 1/5 | Single file rollback |

**Average Risk Score (Minimal Refactoring):** 1.1/5 = **LOW RISK** ✅

**High-Risk Areas:** None identified

**Confidence Level:** 95% success on first attempt

---

### Option C: No Changes - Risk Assessment

| Risk Category | Score | Notes |
|---------------|-------|-------|
| **All Categories** | 0/5 | No code changes = no risk |

**Average Risk Score (No Changes):** 0/5 = **ZERO RISK** ✅

**Confidence Level:** 100% success

---

## Testing Plan

### Phase 1: Pre-Implementation Testing (Baseline)

**Objective:** Establish baseline functionality before any changes

#### Unit Tests

```bash
# Test existing hook functionality
npm test -- useHistory.test.ts
npm test -- useGrooveEngine.test.ts
npm test -- useURLSync.test.ts
npm test -- useAutoSpeedUp.test.ts
npm test -- useGrooveActions.test.ts

# Test GrooveEditor component
npm test -- GrooveEditor.test.ts
```

**Success Criteria:**
- All tests pass
- Coverage maintained at current level (aim for >80%)

#### Integration Tests

```bash
npm test -- integration/GrooveEditor.integration.test.ts
```

**Test Scenarios:**
1. Create new groove
2. Add/remove measures
3. Toggle notes
4. Undo/redo operations
5. Play/pause playback
6. Adjust tempo
7. Change time signature
8. Update metadata
9. Copy URL
10. Enable auto speed-up

**Success Criteria:** All scenarios pass

---

### Phase 2: Implementation Testing (Option B)

#### Test `useGrooveSync` Hook

**File:** `src/hooks/__tests__/useGrooveSync.test.ts`

```typescript
describe('useGrooveSync', () => {
  it('should sync groove changes to engine', () => {
    // Test that engine.updateGroove is called when groove changes
    // Test that metadata changes don't trigger unnecessary syncs
    // Test performance: no excessive re-renders
  });

  it('should skip sync when only metadata changes', () => {
    // Verify title/author/comments don't trigger sync
  });

  it('should handle rapid groove changes', () => {
    // Verify debouncing or batching works
  });

  it('should work with all audio properties', () => {
    // Test tempo, swing, division, timeSignature, measures
  });
});
```

**Time:** 1 hour

#### Update GrooveEditor Tests

**File:** `src/components/__tests__/GrooveEditor.test.ts`

```typescript
describe('GrooveEditor with useGrooveSync', () => {
  it('should render without errors', () => {
    // Basic render test
  });

  it('should initialize with default groove', () => {
    // Verify default state
  });

  it('should sync to engine on mount', () => {
    // Mock useGrooveSync and verify it's called
  });

  it('should handle all user interactions', () => {
    // Click tests, state updates, etc.
  });
});
```

**Time:** 1.5 hours

#### Integration Tests

```bash
npm test -- integration/GrooveEditor.integration.test.ts

# Critical paths to test:
# 1. Playback audio sync
# 2. URL sharing functionality
# 3. Undo/redo with sync
# 4. Auto speed-up with sync
# 5. Measure operations
```

**Time:** 1 hour

#### Manual Testing Checklist

**Scenario:** Basic Playback
- [ ] Click play button → sound plays
- [ ] Adjust tempo → pitch changes correctly
- [ ] Adjust swing → timing changes
- [ ] Stop playback → sound stops

**Scenario:** Measure Operations
- [ ] Add measure → appears in grid
- [ ] Remove measure → removed from grid and audio
- [ ] Duplicate measure → exact copy appears
- [ ] Undo measure operations → reverts correctly

**Scenario:** URL Sharing
- [ ] Copy URL → works without errors
- [ ] Load from URL → groove loads correctly
- [ ] Modify groove → URL updates

**Scenario:** Auto Speed-Up
- [ ] Enable auto speed-up → tempo increases after N loops
- [ ] Disable auto speed-up → tempo stays constant
- [ ] Adjust settings → changes take effect

**Time:** 2 hours

**Total Phase 2 Testing Time:** 5.5 hours

---

### Phase 3: Regression Testing (All Options)

#### Full Test Suite

```bash
npm run test -- --coverage
```

**Success Criteria:**
- All tests pass
- Coverage maintained or improved
- No new warnings

#### Performance Tests

```bash
npm run build
npm run test:performance
```

**Metrics to Monitor:**
- Build time (should not increase > 2%)
- Bundle size (should not increase > 1KB)
- Component render time (should not increase > 5%)
- Hook initialization time (should not increase > 1ms)

**Time:** 1 hour

#### End-to-End Tests (E2E)

```bash
npm run test:e2e
```

**Critical User Journeys:**
1. Create groove → Adjust parameters → Play → Save URL → Share
2. Load saved groove → Modify → Undo changes → Play
3. Create pattern → Use auto speed-up → Export

**Time:** 1 hour

---

### Phase 4: Browser Compatibility Testing

**Browsers to Test:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Platform Testing:**
- Desktop (Windows, macOS, Linux)
- Tablet (iPad, Android tablets)
- Mobile (iPhone, Android phones)

**Tests:**
- Audio playback works
- UI responsive
- No console errors
- Touch interactions work (mobile/tablet)

**Time:** 1.5 hours

---

## Testing Summary

### Option A: Full Refactoring - Total Testing Time

| Phase | Time | Risk |
|-------|------|------|
| Phase 1: Baseline | 1.5h | Low |
| Phase 2: Implementation | 7h | Medium |
| Phase 3: Regression | 2h | Medium |
| Phase 4: Browser | 1.5h | Low |
| **Total** | **12h** | **Medium** |

**Note:** 5 different hooks to test, 6+ test files to update, increased complexity

---

### Option B: Minimal Refactoring - Total Testing Time

| Phase | Time | Risk |
|-------|------|------|
| Phase 1: Baseline | 1.5h | Low |
| Phase 2: Implementation | 5.5h | Low |
| Phase 3: Regression | 2h | Low |
| Phase 4: Browser | 1.5h | Low |
| **Total** | **10.5h** | **Low** |

**Note:** Single hook extraction, 1-2 test files affected, straightforward testing

---

### Option C: No Changes - Total Testing Time

| Phase | Time | Risk |
|-------|------|------|
| Phase 1: Baseline | 1.5h | Low |
| Phase 3: Regression | 2h | Low |
| **Total** | **3.5h** | **None** |

**Note:** Verification only, no implementation testing needed

---

## Detailed Testing Procedures

### Testing Procedure: Option B (Recommended)

#### Step 1: Setup (30 min)

```bash
# 1. Create new branch
git checkout -b feature/issue-26-minimal-refactor

# 2. Run baseline tests
npm test

# 3. Document baseline coverage
npm test -- --coverage > baseline-coverage.txt
```

#### Step 2: Extract useGrooveSync Hook (1 hour)

```bash
# 1. Create new hook file
touch src/hooks/useGrooveSync.ts

# 2. Extract sync logic
# (Move lines 73-94 from GrooveEditor.tsx)

# 3. Update GrooveEditor imports
# Add: import { useGrooveSync } from '../hooks/useGrooveSync';

# 4. Update component to use hook
# Replace useEffect with useGrooveSync hook call
```

#### Step 3: Unit Test useGrooveSync (1 hour)

```bash
# 1. Create test file
touch src/hooks/__tests__/useGrooveSync.test.ts

# 2. Write tests (see test specs above)
# 3. Run tests
npm test -- useGrooveSync.test.ts

# Success: All tests pass
```

#### Step 4: Update Component Tests (1.5 hours)

```bash
# 1. Update GrooveEditor tests to mock useGrooveSync
# 2. Add tests for hook integration
# 3. Run component tests
npm test -- GrooveEditor.test.ts

# Success: Component tests pass, coverage maintained
```

#### Step 5: Integration Testing (1 hour)

```bash
# 1. Run integration tests
npm test -- integration/GrooveEditor.integration.test.ts

# 2. Verify all scenarios pass
# - Playback works
# - Measure operations work
# - URL sharing works
# - Auto speed-up works
```

#### Step 6: Manual Testing (2 hours)

```bash
# 1. Start dev server
npm run dev

# 2. Run through manual checklist (see above)
# 3. Test on different browsers
# 4. Check mobile responsiveness
```

#### Step 7: Regression Testing (2 hours)

```bash
# 1. Full test suite
npm test -- --coverage

# 2. Build verification
npm run build

# 3. Check for warnings
npm run lint

# 4. Performance check
npm run test:performance
```

#### Step 8: Documentation (30 min)

```bash
# 1. Add JSDoc to GrooveEditor
# 2. Add JSDoc to useGrooveSync
# 3. Update component responsibility diagram
# 4. Add link to issue #26
```

#### Step 9: Commit & Review (30 min)

```bash
# 1. Stage changes
git add .

# 2. Commit
git commit -m "refactor: Extract useGrooveSync hook from GrooveEditor

- Extract engine synchronization logic into useGrooveSync hook
- Reduces GrooveEditor complexity
- Improves testability of sync logic
- Maintains all existing functionality
- Fixes #26 (Partial - Phase 1)

Testing:
- All unit tests pass
- All integration tests pass
- Manual testing complete
- Performance verified
- No new warnings"

# 3. Push for review
git push origin feature/issue-26-minimal-refactor

# 4. Create PR
gh pr create --title "refactor: Extract useGrooveSync hook (Issue #26)" \
  --body "Addresses Issue #26 - God Component Pattern\n\n..."
```

---

## Success Criteria

### All Options Must Pass

- ✅ All tests pass (Unit, Integration, E2E)
- ✅ No new console warnings or errors
- ✅ No regressions in functionality
- ✅ Performance metrics maintained
- ✅ Browser compatibility verified
- ✅ Code review approved
- ✅ Documentation updated

### Option B Specific Criteria

- ✅ `useGrooveSync` hook properly extracts sync logic
- ✅ GrooveEditor size reduced by ~50 lines
- ✅ Component cohesion maintained
- ✅ Testing coverage ≥ 80%
- ✅ No breaking changes to public API

---

## Recommendations & Decision Matrix

| Criteria | Option A | Option B ⭐ | Option C |
|----------|----------|----------|----------|
| **Risk Level** | Moderate | Low | None |
| **Effort** | 6-7h | 3-4h | 0.5h |
| **Testing Time** | 12h | 10.5h | 3.5h |
| **Value Delivered** | High | Medium | Low |
| **Long-term Maintenance** | Better | Improved | Current |
| **Breaking Changes** | Possible | None | None |
| **Code Clarity** | Best | Good | Fair |
| **Recommended** | ❌ | ✅ YES | ⚠️ |

---

## Final Recommendation

### Chosen Approach: **Option B - Minimal Refactoring**

**Rationale:**
1. **Best Risk/Reward Ratio:** Low risk (1.1/5) with significant value (50-line reduction, better documentation)
2. **Sustainable Pace:** Can be completed in 3-4 hours within current development velocity
3. **Future Extensibility:** Leaves room for Option A refactoring in future if needed
4. **Testing Feasibility:** 10.5 hours of testing is manageable and thorough
5. **Technical Debt Reduction:** Addresses documentation and extracts most complex logic
6. **Stakeholder Alignment:** P3 priority suggests optimization rather than critical fix

**Implementation Timeline:**
- Week 1: Extract `useGrooveSync` + Write tests (4 hours)
- Week 2: Integration testing + Manual QA (4 hours)
- Week 3: Code review + Merge (1 hour)

**Total Commitment:** 9 hours over 3 weeks

---

## Appendix: Rollback Plan

### If Issues Occur During Testing

**Trigger Points:**
- Test coverage drops below 75%
- Performance regression > 5%
- Any critical functionality fails

**Rollback Steps:**

```bash
# 1. Identify issue
# 2. Document in issue comment
# 3. Revert commit
git revert HEAD

# 4. Notify team
# 5. Schedule retrospective

# Alternative: Cherry-pick fix
git cherry-pick [bugfix-commit]
```

**Estimated Rollback Time:** 15 minutes

---

## Appendix: Future Enhancements

### Post-Implementation (If Time Allows)

1. **Extract `useViewState` hook** (deferred)
   - Combine all view state management
   - Risk: Low
   - Value: Medium

2. **Extract `useMetadataActions` hook** (deferred)
   - Separate metadata concerns
   - Risk: Low
   - Value: Low

3. **Create component composition diagram** (deferred)
   - Visual representation of component tree
   - Risk: None
   - Value: Medium

---

## References

- **Issue:** #26 - [P3] God Component Pattern
- **Related:** #19 (Parent Issue), #18 (Original Review)
- **Documentation:** Component structure in GrooveEditor.tsx
- **Testing Resources:** Jest, React Testing Library, Playwright

---

**Document Version:** 1.0
**Last Updated:** February 2026
**Status:** Ready for Implementation
