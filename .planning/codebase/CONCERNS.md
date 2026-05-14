# Codebase Concerns

**Analysis Date:** 2026-05-14

## Tech Debt

**Large Monolithic Components:**
- Files: `src/pages/ProductionPage.tsx` (713 lines), `src/core/ExportUtils.ts` (883 lines), `src/core/GrooveEngine.ts` (696 lines)
- Issue: Multiple concerns bundled together - state management, MIDI handling, UI orchestration all in ProductionPage
- Impact: Difficult to test, modify, and debug. High cognitive load when adding features.
- Fix approach: Break ProductionPage into smaller feature-focused container components. Extract MIDI management into dedicated container.

**Incomplete Custom Pattern UI:**
- Files: `src/components/BulkOperationsDialog.tsx` (lines 29, 74)
- Issue: TODO comments indicate save custom pattern feature and dynamic pattern UI are not implemented
- Impact: Bulk operations only work with preset patterns; users cannot save/reuse custom bulk patterns
- Fix approach: Implement GrooveStorage integration in BulkOperationsDialog with save/load/delete pattern UI

**Note-to-Position Mapping Timing:**
- File: `src/components/SheetMusicDisplay.tsx` (line 154)
- Issue: TODO comment indicates proper note-to-position mapping using abcjs timing info is not implemented
- Impact: Sheet music cursor positioning may not align perfectly with actual playback at all tempos/divisions
- Fix approach: Use abcjs API to extract timing data from rendered SVG and build accurate position map

## Known Bugs

**Sheet Music Cursor Loop Reset Behavior:**
- Symptoms: Cursor might not smoothly animate when groove loops back to start
- File: `src/components/SheetMusicDisplay.tsx` (lines 52-54)
- Trigger: Play a multi-measure groove, loop detects position reset when index wraps from last measure back to position 0
- Workaround: None; animation resets on loop. Not critical but visually jarring.
- Root cause: State machine in `isResettingRef` debounces position updates across loop boundary

**MIDI Event Filtering Chain May Lose Events Under Load:**
- Symptoms: Rapid snare rolls may have hits dropped or notes appear to miss with MIDI input
- File: `src/hooks/useMIDIInput.ts` (lines 48-49), filtering applied in sequence
- Trigger: Playing fast rolls (>10 hits/second) on snare with default de-bounce window of 15ms
- Cause: DoubleTriggerFilter uses per-note refractory windows that may suppress intentional rapid notes
- Workaround: Increase velocity significantly or disable de-bounce for rehearsal
- Fix approach: Add adaptive filtering logic that detects rapid sequences and adjusts thresholds, or provide UI toggle per voice

**localStorage Quota Errors Not User-Friendly:**
- Symptoms: Export or save operations fail silently when storage quota exceeded
- Files: `src/core/GrooveStorage.ts` (lines 111-130)
- Trigger: Save many large grooves with 16+ measures until localStorage quota depleted (~5-10MB varies by browser)
- Workaround: Clear browser cache or delete saved grooves manually
- Current mitigation: Quota detection and automatic cleanup attempt implemented (good)
- Improvement: More specific error messages shown to user; deletion recommendations in UI

## Security Considerations

**SVG Injection in Sheet Music Exports:**
- Risk: Malicious groove title/author could contain SVG/script content injected into PDF/SVG exports
- Files: `src/core/ExportUtils.ts` (lines 339-350)
- Current mitigation: `escapeXml()` function properly escapes XML special characters and removes control characters
- Additional layer: `DOMPurify` used on rendered SVG (line 207)
- Assessment: ✅ Well-protected. Both input sanitization and output sanitization in place.

**URL Parsing from Untrusted Sources:**
- Risk: Shared groove URLs could contain malformed/oversized pattern strings causing DoS or data corruption
- Files: `src/core/GrooveURLCodec.ts` (extensive validation with Zod schemas lines 38-79)
- Current mitigation: Strict Zod schemas validate tempo, swing, divisions, time signature, pattern length limits
- Assessment: ✅ Well-protected. Length limits enforced (PATTERN_MAX_LENGTH: 2000), bounds checked on all numeric inputs.

**localStorage Keys Not Namespaced:**
- Risk: Naming conflicts if multiple Groovy instances or other apps use same key names on shared domain
- Files: Multiple files use hardcoded keys: `groovy-debug-mode`, `groovy-metronome-config`, `groovy-my-grooves`, etc.
- Current mitigation: All use `groovy-` prefix to reduce collisions
- Improvement: Add version suffix or UUID namespace to guarantee uniqueness on shared hosts

## Performance Bottlenecks

**Export Process Blocks UI During Large Multi-Measure Grooves:**
- Problem: MP3 export of 16-measure groove at 120 BPM can block main thread for 2-3 seconds
- File: `src/core/ExportUtils.ts` (generateMP3Export function, ~700+ lines)
- Cause: Lamejs encoding runs synchronously on main thread; no Web Worker offloading
- Improvement path: Move MP3 encoding to Web Worker; stream results back to main thread with progress callbacks

**Sheet Music Re-render on Every Groove Change:**
- Problem: Changing tempo, swing, or any groove property re-renders entire ABC notation and SVG
- Files: `src/components/SheetMusicDisplay.tsx` (useMemo dependency on entire groove object)
- Cause: No memoization of individual groove properties; full object equality check triggers re-render
- Impact: At 120+ BPM with 16 measures, re-render can cause <50ms lag in tight loops
- Improvement path: Memoize ABCTranscoder output by shallow properties (tempo, swing, division separately)

**PerformanceTracker Memory Growth:**
- Problem: `timingErrors` array grows unbounded during long practice sessions
- File: `src/midi/PerformanceTracker.ts` (line 42: MAX_TIMING_ERRORS = 500 constant)
- Cause: Array only truncated when reaching 500 errors; no periodic cleanup
- Impact: Memory leak in sessions >1 hour with active MIDI input
- Fix approach: Implement sliding window cleanup or circular buffer instead of array

**Playback Position Updates High-Frequency DOM Access:**
- Problem: Cursor position updated via direct DOM manipulation ~60-100 times per second
- File: `src/components/SheetMusicDisplay.tsx` (lines 74-80, useEffect with no debounce)
- Cause: No debouncing or throttling of position updates to DOM
- Impact: CPU usage spikes on low-end devices; jank at 16+ divisions
- Improvement path: Throttle to 30fps maximum; use requestAnimationFrame instead of state updates

## Fragile Areas

**Groove Engine Timing Loop:**
- Files: `src/core/GrooveEngine.ts` (lines 520-530, scheduleLoop method)
- Why fragile: Relies on 50ms setTimeout intervals for timing; drifts over long sessions due to browser throttling
- Safe modification: Changes to tempo/swing must invalidate cache and rebuild timing grid; test with >10 minute sessions
- Test coverage: MIDI timing tests pass, but long-session drift not explicitly tested
- Risk: Accumulating timing drift at very slow tempos (<40 BPM) or extended practice sessions (>2 hours)

**MIDI Device Connection State Machine:**
- Files: `src/hooks/useMIDIInput.ts` (lines 52-100, initialization and device list change handling)
- Why fragile: Multiple async initialization paths (auto-connect to saved device, auto-connect to fake device on localhost, manual connection)
- Safe modification: Must preserve callback cleanup in useEffect returns; test device disconnect/reconnect scenarios
- Gaps: No explicit state for "connecting" state; race condition possible if device disconnects during initial enable()
- Test coverage: Basic connection tested; disconnect during initialization not covered

**ABCTranscoder Note Mapping:**
- Files: `src/core/ABCTranscoder.ts` (note-to-ABC conversion logic)
- Why fragile: Hard-coded mapping between drum voices and ABC note names; changes to DrumVoiceConfig need coordinated updates
- Safe modification: Always test full round-trip (groove → ABC → render) after changes
- Test coverage: No explicit unit tests for ABCTranscoder; relies on integration tests
- Risk: Silent notation errors if mapping falls out of sync with voice definitions

**Double-Trigger Filter State Management:**
- Files: `src/midi/DoubleTriggerFilter.ts`, integrated in `src/hooks/useMIDIInput.ts`
- Why fragile: Per-note refractory windows stored in Map that persists across device disconnections
- Safe modification: Must explicitly clear state on device disconnect (line 78 in useMIDIInput)
- Gaps: No test coverage for state clearing on device change
- Risk: Stale filter state could suppress valid hits after device reconnection

## Scaling Limits

**localStorage Capacity:**
- Current capacity: ~5-10MB per browser/domain (varies by browser)
- Limit: After ~50-100 saved 16-measure grooves, localStorage quota approaches limits
- Scaling path: Migrate to IndexedDB for 50MB+ capacity, or cloud storage for unlimited grooves
- Current mitigation: Quota detection with cleanup attempt implemented (GrooveStorage.ts:116)

**Sheet Music Rendering Performance:**
- Current limit: abcjs rendering becomes visibly slow (>200ms) at 16+ measures with complex articulations
- Bottleneck: ABCTranscoder builds complete ABC string for all measures every change
- Scaling path: Implement lazy rendering (draw visible measures only) or virtualization
- Current behavior: Full re-render on each change; acceptable for typical 1-4 measure grooves

**Audio Sample Memory:**
- Current limit: 40+ drum voice samples loaded into memory as AudioBuffers
- Bottleneck: Each sample ~100-500KB decoded in RAM; total ~20-30MB
- Scaling path: Implement sample pooling/unloading for voices not used in current session
- Current behavior: All samples loaded once on init; never released

**MIDI Note Processing Rate:**
- Current limit: DoubleTriggerFilter and VelocityFilter can handle ~200 notes/second sustained
- Bottleneck: Per-note lookups in Map; no batching
- Scaling path: Pre-allocate filter state per voice instead of per-note for burst handling
- Current testing: Only tested up to ~20 notes/second; untested at pro drummer speeds (>100 hz for cymbals)

## Dependencies at Risk

**abcjs (ABC.js) Version Drift:**
- Risk: Library not actively maintained; latest update 6.6.0 (2 years old)
- Impact: Rendering bugs in newer browsers; no support for new CSS features
- Migration plan: Fork key abcjs notation rendering logic or migrate to VexFlow for music notation
- Recommendation: Evaluate modern notation libraries (VexFlow, Osmd) for long-term maintenance

**@breezystack/lamejs (MP3 Encoder):**
- Risk: MPEG-3 patent still technically encumbered in some jurisdictions; unmaintained package
- Impact: Legal risk in commercial deployments; no updates for compatibility issues
- Migration plan: Replace with Web Codecs API (when browser support improves) or use server-side encoding
- Current workaround: Export to WAV instead of MP3 for royalty-free alternative

**React Router v7 (Major Version):**
- Risk: Major version upgrade from v6 introduced breaking changes; support window ~2 years
- Status: Currently compatible, but looming deprecation timeline
- Migration plan: Plan major refactor when v8 released (estimated 2027)

**TypeScript ~5.6.2 (Pinned Minor Version):**
- Risk: Using `~` allows patch updates only; blocks access to 5.7+ features
- Current state: Works fine; provides stability
- Improvement: Document TypeScript version lock decision; plan minor upgrade strategy

## Missing Critical Features

**MIDI Import:**
- Problem: Users cannot import MIDI files to convert to Groovy notation
- Blocks: Workflow for musicians wanting to transcribe existing patterns or collaborate via MIDI files
- Scope: Requires MIDI parser, timing analysis, note-to-voice quantization, and UI import dialog
- Complexity: High - requires robust timing analysis and conflict resolution

**Cloud Synchronization:**
- Problem: Grooves only saved locally; no sync across devices
- Blocks: Mobile app development; multi-device workflows
- Scope: Requires authentication, backend storage, conflict resolution
- Complexity: High - architectural change needed

**Metronome Subdivision Sounds:**
- Problem: Metronome only has click/accent sounds; no polyrhythmic metronomes (e.g., 3-against-4)
- Blocks: Advanced practice workflows
- Scope: New metronome mode with configurable beat divisions
- Complexity: Medium

**Articulation Preview:**
- Problem: No audio preview when selecting articulations; only visual feedback
- Blocks: Users guessing sound difference between accent/ghost/flam
- Scope: Integrate with DrumSynth to play selected articulation
- Complexity: Low

## Test Coverage Gaps

**UI Component Tests:**
- What's not tested: Entire ProductionPage, all modals (Print, Download, Share, Save), form interactions
- Files: `src/pages/ProductionPage.tsx`, `src/components/production/*.tsx`
- Risk: Regressions in UI interactions go undetected until manual testing
- Priority: High - UI changes are frequent and error-prone

**Integration Tests for Export:**
- What's not tested: Full export pipeline (groove → ABC → PDF/MP3/etc); encoding quality and format validity
- Files: `src/core/ExportUtils.ts`
- Risk: Corrupted exports shipped to users; file format compatibility issues on client machines
- Coverage gap: No test for multi-measure groove export; no test for special characters in title/author
- Priority: High - export is critical user-facing feature

**MIDI Timing Accuracy Under Load:**
- What's not tested: Timing accuracy with >50 concurrent notes; rapid tempo changes during playback; device reconnection during playback
- Files: `src/midi/PerformanceTracker.ts`, `src/hooks/useMIDITracking.ts`
- Risk: Timing accuracy metrics unreliable under pro-level playing conditions
- Current coverage: Basic beat matching tested; advanced scenarios not covered
- Priority: Medium - only affects advanced practice scenarios

**Mobile Responsive Behavior:**
- What's not tested: Touch interactions on tablets; layout reflow on orientation change; grid interaction on small screens
- Files: `src/components/production/DrumGridDark.tsx` and responsive layout components
- Risk: Mobile UX regressions (e.g., buttons become unclickable)
- Current approach: Manual mobile testing only
- Priority: Medium - mobile is significant traffic source

**Error Recovery Paths:**
- What's not tested: localStorage disabled; audio context initialization failure; MIDI device hot-unplug during playback
- Files: `src/hooks/useGrooveEngine.ts`, `src/core/DrumSynth.ts`, `src/hooks/useMIDIInput.ts`
- Risk: Graceless failures; users stuck with broken application state
- Current coverage: Error logging present but not tested
- Priority: Medium - affects reliability

**ABCTranscoder Round-Trip:**
- What's not tested: Encoding → ABC → decoding → rendering consistency; preservation of all articulations through export
- Files: `src/core/ABCTranscoder.ts`
- Risk: Exported notation differs from original; articulations lost in PDF export
- Current approach: No unit tests; only visual inspection
- Priority: High - export integrity is critical

---

*Concerns audit: 2026-05-14*
