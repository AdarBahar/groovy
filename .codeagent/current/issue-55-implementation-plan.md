# Implementation Plan: Add Cymbals Row (Issue #55)

**Issue**: https://github.com/AdarBahar/groovy/issues/55
**Title**: Add a new row to editor - Cymbals
**Date**: 2026-01-14
**Status**: Planning

---

## 1. Scope

### In Scope
- Add new "Cymbals" row at the TOP of the drum grid (above Hi-Hat)
- Move 5 drum voices from Hi-Hat row to new Cymbals row:
  - Crash
  - Ride
  - Ride Bell
  - Cowbell
  - Stacker
- Ensure cymbals can be played simultaneously with other rows (no conflicts)
- Maintain existing sheet music positions (no ABC notation changes)
- Update UI to reflect new row structure
- Update all references to DRUM_ROWS array

### Out of Scope
- Changing ABC notation positions or MIDI mapping
- Adding new drum voices beyond the 5 being moved
- Changing sound samples or audio files
- Modifying playback engine logic (GrooveEngine, DrumSynth)
- Changing existing saved grooves or library patterns

### Assumptions
- The 5 cymbal voices already exist in DrumVoice type and DrumSynth
- Moving cymbals to separate row won't break existing URL-encoded grooves (they use voice names, not row indices)
- Sheet music rendering uses voice names, not row positions
- Users want cymbals at top for easier access and visual separation

---

## 2. Design

### Proposed Approach

**Why Move to New Row?**
- **Musical Logic**: Cymbals are typically played with hands (like hi-hat), not feet
- **Better UX**: Separates sustained sounds (cymbals) from tight closed hi-hat patterns
- **Reduced Clutter**: Hi-Hat row currently has 10 variations (too many for dropdown)
- **Simultaneous Play**: Cymbal row can play while hi-hat plays (common in drumming)

**Row Structure After Change**:
```typescript
const DRUM_ROWS: DrumRow[] = [
  {
    name: 'Cymbals',  // NEW ROW (position 0)
    defaultVoices: ['crash'],  // Default to crash cymbal
    variations: [
      { voices: ['crash'], label: 'Crash', shortcut: '1' },
      { voices: ['ride'], label: 'Ride', shortcut: '2' },
      { voices: ['ride-bell'], label: 'Ride Bell', shortcut: '3' },
      { voices: ['cowbell'], label: 'Cowbell', shortcut: '4' },
      { voices: ['stacker'], label: 'Stacker', shortcut: '5' },
    ],
  },
  {
    name: 'Hi-Hat',  // Now position 1 (was 0)
    defaultVoices: ['hihat-closed'],
    variations: [
      { voices: ['hihat-closed'], label: 'Closed', shortcut: '1' },
      { voices: ['hihat-open'], label: 'Open', shortcut: '2' },
      { voices: ['hihat-accent'], label: 'Accent', shortcut: '3' },
      { voices: ['hihat-metronome-normal'], label: 'Metronome', shortcut: '4' },
      { voices: ['hihat-metronome-accent'], label: 'Metronome Accent', shortcut: '5' },
    ],
  },
  // Tom 1, Snare, Tom 2, Floor Tom, Kick (unchanged, positions shift by 1)
  // ...
];
```

### Integration Points

**Files to Modify**:
1. **`src/components/production/DrumGridDark.tsx`** (PRIMARY)
   - Update DRUM_ROWS array
   - Move 5 cymbal variations from Hi-Hat to new Cymbals row
   - Adjust keyboard shortcuts (Cymbals: 1-5, Hi-Hat: 1-5)
   - No logic changes needed (row iteration is generic)

2. **`src/components/DrumGrid.tsx`** (if exists/used)
   - Apply same DRUM_ROWS changes
   - Keep consistency across grid implementations

3. **`src/poc/components/DrumGrid.tsx`** (POC testing interface)
   - Update DRUM_ROWS for POC page consistency
   - May have simpler structure (verify first)

**Files to Verify (likely no changes)**:
- `src/core/DrumSynth.ts` - Sample mappings unchanged (voice names stay same)
- `src/core/ABCTranscoder.ts` - ABC notation unchanged (uses voice names)
- `src/types.ts` - DrumVoice type unchanged (all 5 voices already exist)
- `src/core/GrooveEngine.ts` - Playback logic unchanged
- `src/data/libraryGrooves.json` - Library patterns unchanged (use voice names)

### Data Model Changes
**None required** - This is purely a UI reorganization. The underlying data structure (GrooveData, MeasureConfig, DrumVoice) remains unchanged. Grooves are stored by voice name, not row index.

### Security Considerations
- **No security impact** - This is a UI-only change
- No new user input or data processing
- No new external dependencies
- No changes to analytics tracking or storage

---

## 3. Task Breakdown

### Task 1: Update Primary Drum Grid Component
**Files**: `src/components/production/DrumGridDark.tsx`

**Changes**:
1. Insert new Cymbals row at index 0 in DRUM_ROWS array
2. Remove 5 cymbal variations from Hi-Hat row
3. Update keyboard shortcuts for both rows
4. Verify row count increases from 6 to 7

**Acceptance Criteria**:
- Cymbals row appears at top of grid
- Hi-Hat row appears below Cymbals
- All 5 cymbal variations accessible in Cymbals dropdown
- Hi-Hat row reduced to 5 variations
- Keyboard shortcuts work (1-5 for both rows)
- No console errors or warnings

**Code Snippet** (DRUM_ROWS update):
```typescript
const DRUM_ROWS: DrumRow[] = [
  {
    name: 'Cymbals',
    defaultVoices: ['crash'],
    variations: [
      { voices: ['crash'], label: 'Crash', shortcut: '1' },
      { voices: ['ride'], label: 'Ride', shortcut: '2' },
      { voices: ['ride-bell'], label: 'Ride Bell', shortcut: '3' },
      { voices: ['cowbell'], label: 'Cowbell', shortcut: '4' },
      { voices: ['stacker'], label: 'Stacker', shortcut: '5' },
    ],
  },
  {
    name: 'Hi-Hat',
    defaultVoices: ['hihat-closed'],
    variations: [
      { voices: ['hihat-closed'], label: 'Closed', shortcut: '1' },
      { voices: ['hihat-open'], label: 'Open', shortcut: '2' },
      { voices: ['hihat-accent'], label: 'Accent', shortcut: '3' },
      { voices: ['hihat-metronome-normal'], label: 'Metronome', shortcut: '4' },
      { voices: ['hihat-metronome-accent'], label: 'Metronome Accent', shortcut: '5' },
    ],
  },
  // Existing rows (Tom 1, Snare, Tom 2, Floor Tom, Kick) remain unchanged
  // ...
];
```

---

### Task 2: Update Secondary Drum Grid Component (if exists)
**Files**: `src/components/DrumGrid.tsx`

**Changes**:
1. Check if this file exists and is actively used
2. If yes, apply same DRUM_ROWS changes as Task 1
3. If no, skip this task

**Acceptance Criteria**:
- If file exists: Same criteria as Task 1
- If file doesn't exist or is unused: Skip verified

---

### Task 3: Update POC Drum Grid
**Files**: `src/poc/components/DrumGrid.tsx` or `src/poc/PocApp.tsx`

**Changes**:
1. Locate POC drum grid implementation
2. Update DRUM_ROWS array to match production
3. Ensure POC remains functional for testing

**Acceptance Criteria**:
- POC page loads without errors
- Cymbals row appears at top
- Can toggle cymbal notes in POC
- Audio playback works for cymbal voices

---

### Task 4: Manual Testing
**Scope**: Comprehensive UI and playback testing

**Test Cases**:
1. **Visual Layout**
   - [ ] Cymbals row at top of grid
   - [ ] Row labels correct (Cymbals, Hi-Hat, Tom 1, Snare, Tom 2, Floor Tom, Kick)
   - [ ] Row order makes musical sense

2. **Dropdown Menus**
   - [ ] Cymbals dropdown shows 5 options
   - [ ] Hi-Hat dropdown shows 5 options
   - [ ] Keyboard shortcuts work (1-5 in both)

3. **Note Entry**
   - [ ] Can add crash cymbal notes
   - [ ] Can add ride cymbal notes
   - [ ] Can add cowbell/stacker notes
   - [ ] Can add hi-hat notes independently

4. **Simultaneous Play**
   - [ ] Crash + Hi-Hat play together
   - [ ] Ride + Snare + Kick play together
   - [ ] No audio conflicts or stuttering

5. **Sheet Music**
   - [ ] ABC notation still renders correctly
   - [ ] Cymbal positions unchanged on staff
   - [ ] No visual glitches in sheet music

6. **Saved Grooves**
   - [ ] Load existing groove with crash/ride
   - [ ] Notes appear in correct rows
   - [ ] Save new groove with cymbals
   - [ ] Reload saved groove successfully

7. **URL Sharing**
   - [ ] Create groove with cymbals
   - [ ] Copy URL
   - [ ] Open URL in new tab/browser
   - [ ] Groove loads correctly

8. **Library Patterns**
   - [ ] Load groove from library with cymbals
   - [ ] Notes appear in Cymbals row
   - [ ] Playback sounds correct

9. **Export Functions**
   - [ ] Export MIDI (verify cymbal notes present)
   - [ ] Export PDF (verify cymbal notes on staff)
   - [ ] Export MP3 (verify cymbals audible)

**Acceptance Criteria**:
- All test cases pass
- No regressions in existing functionality
- No console errors during testing

---

### Task 5: Documentation Update
**Files**:
- `.codeagent/current/project_history.md`
- `.codeagent/current/memory-log.md`

**Changes**:
1. Add entry to project_history.md for 2026-01-14
2. Document DRUM_ROWS pattern in memory-log.md
3. Note that cymbals moved to separate row

**Acceptance Criteria**:
- project_history.md updated with change summary
- memory-log.md documents DRUM_ROWS structure pattern
- Future developers understand why cymbals have separate row

---

## 4. Rollout Plan

### Migration Strategy
**Not required** - This is a UI-only change with no data migration needed.

### Backward Compatibility
- ✅ **Existing Grooves**: Compatible (use voice names, not row indices)
- ✅ **URL Sharing**: Compatible (voice names in URL params)
- ✅ **Library Patterns**: Compatible (JSON uses voice names)
- ✅ **Saved Grooves**: Compatible (localStorage uses voice names)
- ✅ **Sheet Music**: Compatible (ABC uses voice names)
- ✅ **MIDI Export**: Compatible (MIDI uses voice names)

### Feature Flags
**Not needed** - Change is non-breaking and improves UX immediately.

### Deployment Steps
1. Merge PR to main branch
2. Run `npm run build:prod`
3. Deploy to production (www.bahar.co.il/scribe/)
4. Monitor for errors (check analytics, error boundary)
5. No rollback plan needed (change is safe)

---

## 5. Testing Plan

### Unit Tests
**Not required** - This change is purely UI structure (no new logic to unit test).

### Integration Tests
**Manual testing covers integration** - See Task 4 test cases above.

### E2E Tests
**Key Test Scenarios** (if E2E tests exist):
1. Create groove with crash + ride + hi-hat simultaneously
2. Save groove and reload from My Groovies
3. Share via URL and verify correct loading
4. Export to MIDI/PDF and verify cymbal notes present

### Key Test Cases
See Task 4 for comprehensive test case list (9 categories, 18+ individual tests).

---

## 6. Open Questions

### Question 1: POC Grid Implementation
**Q**: Does POC page (`/poc`) use a separate DRUM_ROWS array, or does it use the production one?
**Impact**: Determines if we need to update 2 or 3 files
**Research Needed**: Check `src/poc/components/DrumGrid.tsx` and `src/poc/PocApp.tsx`
**Decision**: Will investigate during implementation

### Question 2: Existing Grooves with Cymbals
**Q**: Are there many saved grooves in production with crash/ride/cowbell on hi-hat row?
**Impact**: None (voice names stay same), but good to know for testing
**Research Needed**: Check analytics or localStorage data if available
**Decision**: Not critical, but worth checking during manual testing

### Question 3: Visual Spacing
**Q**: Should Cymbals row have any visual distinction (color, spacing, divider)?
**Impact**: Minor UX improvement potential
**Research Needed**: Review design system and user feedback
**Decision**: Start with no visual changes, iterate based on user feedback

### Question 4: Row Reordering
**Q**: Is there value in allowing users to reorder rows in the future?
**Impact**: Would require state management and localStorage persistence
**Research Needed**: User feedback after this change
**Decision**: Out of scope for this issue, but note for future enhancement

---

## 7. Risk Assessment

### Low Risk
- ✅ No data model changes
- ✅ No API changes
- ✅ No new dependencies
- ✅ Backward compatible with all existing data
- ✅ Easy to verify (visual change)

### Potential Issues
1. **POC Page Inconsistency**: If POC uses separate DRUM_ROWS, it might become out of sync
   - **Mitigation**: Update both in same commit

2. **User Confusion**: Existing users might expect cymbals in Hi-Hat row
   - **Mitigation**: Cymbals at top is more intuitive (users will adapt quickly)

3. **Keyboard Shortcut Muscle Memory**: Users familiar with "4 = Crash" will need to adjust
   - **Mitigation**: New shortcut "1 = Crash" is even easier (both rows start at 1)

---

## 8. Success Metrics

### Immediate Success Criteria
- [ ] Cymbals row appears at top of grid
- [ ] All 5 cymbal variations accessible
- [ ] No console errors or warnings
- [ ] All manual test cases pass
- [ ] No regressions in existing functionality

### Long-term Success Metrics (Analytics)
- Track cymbal usage before/after change
- Monitor error rates (should remain stable)
- Collect user feedback on new row structure
- Measure if users play cymbals + hi-hat simultaneously more often

---

## 9. Implementation Estimate

### Time Estimate
- **Task 1** (Primary Grid): 15 minutes
- **Task 2** (Secondary Grid): 5 minutes (if exists)
- **Task 3** (POC Grid): 10 minutes
- **Task 4** (Manual Testing): 30 minutes
- **Task 5** (Documentation): 10 minutes

**Total**: ~70 minutes (~1.2 hours)

### Complexity: LOW
- Simple array restructuring
- No new logic or algorithms
- No external dependencies
- Easy to test and verify

---

## 10. Next Steps

1. ✅ Plan approved by user
2. ⏳ Implement Task 1 (Primary Grid)
3. ⏳ Implement Task 2 (Secondary Grid if exists)
4. ⏳ Implement Task 3 (POC Grid)
5. ⏳ Execute Task 4 (Manual Testing)
6. ⏳ Complete Task 5 (Documentation)
7. ⏳ Create commit with clear message
8. ⏳ Push to GitHub and update issue #55

---

**Plan Status**: Ready for Approval
**Awaiting**: User confirmation to proceed with implementation
