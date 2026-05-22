# Phase v1.1.1: Sticking Notation — Context

**Gathered:** 2026-05-22
**Status:** Ready for planning
**Source:** Requirements document (docs/groovy_sticking_requirements.md)

---

<domain>

## Phase Boundary

Add **sticking support** to the Groovy editor so users can define which hand (Left, Right, Both) should play each subdivision. Sticking appears in the editor grid (when sticking setup is active) and in the rendered music notes view. This helps drummers practice grooves with clear hand assignment guidance.

### What's In Scope

- Sticking row in the editor (shows when user clicks Sticking button)
- Click-to-cycle interaction (Empty → R → L → L/R → Empty)
- Keyboard shortcuts for fast editing (R/L/B for values, Backspace to clear, Space/Enter to cycle)
- Display in notes view as ABC annotations above the staff
- Persistence in saved grooves, shared URLs, and exports
- Measure actions (duplicate copies sticking, delete removes sticking, clear resets both notes and sticking)
- "Apply to Similar Measures" feature to copy sticking to measures with matching note patterns
- Accessibility (keyboard navigation, ARIA labels for screen readers)

### What's Out of Scope

- Automatic sticking generation
- Validation that sticking matches a specific drum voice
- Per-instrument or per-note sticking (sticking is global per subdivision)
- Advanced sticking values beyond L, R, L/R, and empty
- Auto-fill patterns (like R L R L)

</domain>

<decisions>

## Implementation Decisions (Locked)

### D-01: Sticking Scope — Global per Subdivision

**Decision:** Sticking applies globally to each beat subdivision, not per instrument.

**Why:** Simpler mental model for users. If multiple instruments play on the same subdivision, they share one sticking value (e.g., kick + hi-hat both on "1" both get marked R).

**Acceptance:** Multiple instruments on same subdivision all use the same sticking value.

---

### D-02: Sticking Values — Four States

**Decision:** Support exactly four sticking values:
- `L` (left hand)
- `R` (right hand)
- `L/R` (both hands)
- Empty/null (no sticking set)

**Why:** Covers all practical hand assignments. Default is empty (no value set).

**Acceptance:** Only these four values allowed in the UI and data model. Empty is the default.

---

### D-03: Editor Interaction — Click-to-Cycle

**Decision:** Clicking a sticking cell cycles through values in order: Empty → R → L → L/R → Empty.

**Why:** Fast, discoverable interaction. One click per subdivision to set sticking.

**Acceptance:** Clicking any sticking cell advances to the next value in the cycle. No confirmation needed.

---

### D-04: Keyboard Shortcuts — Fast Value Entry

**Decision:** When a sticking cell has keyboard focus:
- `R` sets sticking to R
- `L` sets sticking to L
- `/` or `B` sets sticking to L/R
- `Backspace` or `Delete` clears sticking
- `Space` or `Enter` cycles to next value

**Why:** Enables rapid hand entry without reaching for the mouse. Shortcuts only active when cell is focused (no conflict with editor shortcuts).

**Acceptance:** All shortcuts work without confirmation. Changes apply immediately.

---

### D-05: Measure Similarity — Structural Match on Notes

**Decision:** Similar measures are measures with:
- Same time signature
- Same subdivision count
- Same playable notes at same instrument positions (including articulation differences)

Ignore sticking values, UI selection state, and display metadata during comparison.

**Why:** "Apply to Similar Measures" should only apply sticking to measures that have identical drum patterns. Articulation differences (open vs closed hi-hat) count as different.

**Acceptance:** Measures with different note patterns are not considered similar, even if they have the same time signature. Articulation is part of the comparison.

---

### D-06: Display in Notes View — ABCjs Text Annotations

**Decision:** Render sticking as ABC text annotations above the staff (e.g., `^"R"`).

**Why:** Keeps sticking coupled to the notation, making it persistent across:
- Notes-only view (no editor)
- Exports (PDF, PNG, etc.)
- Shared grooves
- Future notation export formats

**How:** Use ABCjs built-in annotation support. Reserve a small lane above the staff when sticking exists.

**Handling collisions:** If sticking overlaps with tempo markings, move sticking slightly higher.

**Acceptance:** Sticking appears above staff in notes view when values exist. Empty values don't render. Sticking stays synchronized with notation when zooming, wrapping, or exporting.

---

### D-07: Data Model — Optional Sticking Array on Measure

**Decision:** Add to `Measure` interface:
```typescript
type StickingValue = "L" | "R" | "L/R" | null;

type Measure = {
  notes: NoteData;
  sticking?: StickingValue[];
};
```

**Why:** Optional field keeps backward compatibility. Existing grooves without sticking load normally. Array length matches subdivision count.

**Acceptance:** Sticking array length = subdivision count. Missing sticking data is treated as empty (all nulls). Existing grooves load correctly with or without sticking.

---

### D-08: Persistence — Save, Load, Share, Export

**Decision:** Sticking is:
- Saved with grooves in localStorage
- Loaded when opening saved grooves
- Included in URL-encoded shared grooves
- Rendered in all notation exports (PDF, PNG, SVG, MIDI file exports)

**Why:** Users expect their sticking patterns to persist across sessions and when sharing grooves.

**Acceptance:** Saved grooves reload with sticking intact. Shared grooves preserve sticking. Exports include sticking in notation views. Grooves without sticking load without errors.

---

### D-09: Measure Actions — Clear Resets Sticking

**Decision:**
- **Duplicate measure:** Sticking is copied along with notes
- **Delete measure:** Sticking data is deleted
- **Clear measure:** Both notes AND sticking are reset to empty

**Why:** Users expect clear measure to reset everything, including sticking. Duplicate should preserve the full pattern (notes + sticking). Delete should remove all data.

**Acceptance:** Clear measure clears both notes and sticking. Notes view no longer shows sticking for that measure.

---

### D-10: Apply to Similar Measures — Pattern Copy with Matching

**Decision:** When user clicks "Apply to Similar Measures":
1. Find all measures with the same note pattern (D-05 definition)
2. Copy current measure's sticking values to those measures
3. Do NOT modify the notes of target measures
4. If no similar measures found, show: "No similar measures found."

**Why:** Users can define sticking once and apply it to all measures with the same drum pattern, reducing repetition.

**Acceptance:** Similar measures receive identical sticking values. Notes are never modified. Clear message when no matches found.

---

### D-11: "Apply to Similar Measures" Placement — Measure Header

**Decision:** Show button/link in the measure header when sticking setup is active.

Placement: Near other measure-level actions (duplicate, delete, add).

Label: "Apply to Similar Measures"

**Why:** Clearly measure-scoped. Only appears when relevant (sticking mode on). Doesn't clutter the sticking row itself.

**Acceptance:** Button only visible when sticking setup is active. Only appears in measure header, not in sticking row.

---

### D-12: Backwards Compatibility — Empty Row When Mode Activated

**Decision:** When user clicks Sticking button:
- Sticking row appears with all cells empty (regardless of whether sticking data exists)
- If sticking values were previously set, they become visible in the row
- No sticking displays in notes view unless values exist

**Why:** Behavior is consistent and predictable. Clicking Sticking always opens the editor.

**Acceptance:** Existing grooves load without sticking shown. Sticking row appears empty until user sets values.

---

## Claude's Discretion

The following implementation details are left to the planner/executor:

- **Sticking button styling** — how the Sticking control is rendered in PlaybackControls
- **Animation/transitions** — smooth appearance/disappearance of the sticking row
- **Font sizing** — responsive sizing of sticking labels in editor and notes view
- **Accessibility labels** — exact ARIA label wording ("Beat 1 sticking: Right" format)
- **Keyboard focus management** — how focus moves between sticking cells
- **Undo/redo support** — whether sticking changes participate in the undo stack
- **Touch interaction** — how mobile users cycle through sticking values

</decisions>

<canonical_refs>

## Canonical References

**MANDATORY — downstream agents must read these before planning or implementing.**

### Core Specification

- `docs/groovy_sticking_requirements.md` — Complete requirements with all acceptance criteria, user stories, and edge cases

### Related Code References

- `src/types.ts` — Drum notation types (DrumVoice, Measure, GrooveData)
- `src/components/production/PlaybackControls.tsx` — Tempo, swing, volume controls (pattern for Sticking button)
- `src/core/GrooveStorage.ts` — Groove persistence pattern (save/load)
- `src/core/GrooveURLCodec.ts` — URL encoding pattern (for sticking in shares)
- `src/core/ABCTranscoder.ts` — Music notation rendering (where sticking annotations go)
- `src/components/production/DrumGrid.tsx` — Drum editor grid (where sticking row appears)

### Existing Patterns

- **Editor state management** — see ProductionPage.tsx for groove state and edit mode tracking
- **Keyboard shortcuts** — ESLint config + existing shortcuts in editor (ensure no conflicts)
- **Component accessibility** — Radix UI patterns used throughout for ARIA support

</canonical_refs>

<specifics>

## Specific Ideas from Requirements

1. **Cycle order is strict:** Empty → R → L → L/R → Empty (always this sequence)
2. **Sticking row alignment:** Must align exactly with beat counter columns and grid columns
3. **"Both hands" notation:** Use `L/R` (not "B" or "2H")
4. **Measure similarity:** Include articulation in comparison (open vs closed hi-hat are different)
5. **ABC rendering:** Use above-staff text annotations (not inline)
6. **Collision handling:** Sticking moves higher if tempo markings collide
7. **Responsive:** Sticking row works on all editor sizes (font size may reduce on small screens)
8. **No confirmation steps:** Click to change, keyboard shortcuts apply immediately

</specifics>

<deferred>

## Deferred Ideas

None — requirements fully capture Phase 1 scope.

Future consideration (Phase 2+):
- Sticking patterns (pre-defined patterns user can apply)
- Sticking playback (audio cue for left/right hand)
- Advanced notation (grace notes, rebounds, etc.)

</deferred>

---

**Phase:** v1.1.1  
**Context gathered:** 2026-05-22 from requirements document  
**Status:** Ready for research and planning
