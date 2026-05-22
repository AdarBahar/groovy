# Groovy Requirements: Sticking Support in Editor and Notes

## 1. Overview

Add sticking support to Groovy so users can define which hand should play each beat or subdivision in a measure.

Sticking values should be editable from the measure editor and displayed in both:

1. The editor grid
2. The rendered notes view

The feature should help users practice grooves with clear hand assignment guidance.

---

## 2. Goals

### Primary goals

- Allow users to set sticking per beat subdivision.
- Support four sticking states:
  - `L`
  - `R`
  - `L/R`
  - Empty
- Show sticking above the counter row in the editor.
- Show sticking above the relevant notes in the notes view.
- Preserve sticking display when switching from editor plus notes view to notes-only view.
- Include sticking in saved grooves, sharing, and exports.
- Allow users to apply a sticking pattern to similar measures.

### Non-goals

- No automatic sticking generation.
- No auto-fill patterns such as `R L R L`.
- No validation that sticking matches a specific drum voice.
- No per-note or per-instrument sticking in V1.
- No advanced sticking values beyond `L`, `R`, `L/R`, and empty.

---

## 3. User Story

As a drummer using Groovy, I want to assign sticking to each beat or subdivision so that I can see which hand to use while editing and practicing a groove.

---

## 4. Entry Point

### Current behavior

At the bottom of the editor, there is a **Sticking** control.

### Required behavior

When the user clicks **Sticking**, the editor enters sticking setup mode.

---

## 5. Sticking Setup Mode

When the user clicks **Sticking**:

- The measure editor displays an additional row above the beat counter row.
- The row aligns with the existing beat and subdivision columns.
- Each cell in the row represents the sticking value for that subdivision.
- Existing grooves without sticking show the sticking row with all cells empty.
- The row is controlled by UI mode, not by whether sticking data already exists.

Example layout:

| Sticking row | R | L | L/R | Empty | R | L | Empty | L |
|---|---|---|---|---|---|---|---|---|
| Counter row | 1 | & | 2 | & | 3 | & | 4 | & |
| Grid rows | Cymbals | Hi-Hat | Snare | etc. | | | | |

---

## 6. Sticking Values

Each sticking cell has one of four states:

| Value | Meaning |
|---|---|
| `L` | Left hand |
| `R` | Right hand |
| `L/R` | Both left and right |
| Empty | No sticking set |

The default value is empty.

---

## 7. Interaction Requirements

### 7.1 Setting sticking

When the sticking row is visible:

- Clicking a sticking cell cycles through the supported values.
- The cycle order is:

```text
Empty → R → L → L/R → Empty
```

- The selected value updates immediately in:
  - The editor sticking row
  - The notes preview
  - The groove state

### 7.2 Empty value

- Empty cells show no text.
- Empty values should not render in the notes view.

---

## 8. Editor Display Requirements

When sticking is set:

- The value appears in the sticking row above the matching subdivision.
- Empty values display no text.
- The sticking row remains visually distinct from instrument rows.
- The row does not affect current note grid behavior or note placement.
- Sticking values align exactly with the beat and subdivision columns.
- The long value `L/R` must fit inside the column without breaking layout.

---

## 9. Sticking Scope

Sticking applies **globally per subdivision**.

This means sticking is attached to the beat or subdivision position, not to a specific instrument or individual note.

Example:

| Count | 1 | & | 2 | & |
|---|---|---|---|---|
| Sticking | R | L | R | L |
| Hi-Hat | x | x | x | x |
| Snare |  |  | x |  |

In this model, beat `2` has `R` regardless of whether the sound at that position is hi-hat, snare, kick, or multiple instruments at the same time.

### Explicit V1 decision

- Use global per-subdivision sticking.
- Do not support per-instrument sticking.
- Do not support separate sticking values for multiple notes at the same subdivision.

---

## 10. Notes View Rendering

When sticking is set:

- The sticking value should be rendered above the corresponding note or beat position in the notes view.
- Values should appear above the staff, similar to standard sticking notation.
- Empty sticking values should not render anything.
- If the user closes the editor and switches to notes-only view, sticking should remain visible in the notes view if sticking values are set.

### 10.1 ABC notation rendering approach

Use **ABCjs text annotations above the staff** where possible.

Recommended approach:

- Render sticking as ABC notation annotations tied to the relevant note, rest, or rhythmic position.
- Use above-staff annotations, for example `^"R"`, or the equivalent supported ABCjs annotation syntax.
- Keep sticking coupled to the notation so it works consistently for:
  - Notes-only view
  - Export
  - Sharing
  - Future PDF or image export

Avoid using a separate UI overlay unless ABCjs cannot support the required positioning. A separate overlay is more fragile because it must stay synchronized with notation layout, zoom, wrapping, and exports.

### 10.2 Positioning and spacing strategy

- Place sticking labels above the staff.
- Align each sticking label with its subdivision position.
- Use the smallest readable font size that fits the notation style.
- Reserve a small annotation lane above the staff when at least one sticking value exists in the measure.
- Avoid overlaps with tempo markings, measure labels, chord symbols, or other annotations.
- If sticking collides with other annotations, move sticking slightly higher rather than placing it inline with the notes.

V1 rule:

> If sticking exists in a measure, reserve an annotation lane above the staff for sticking labels.

---

## 11. Data Model Requirements

Each measure should store sticking data per subdivision.

Example TypeScript model:

```ts
type StickingValue = "L" | "R" | "L/R" | null;

type Measure = {
  notes: NoteData;
  sticking?: StickingValue[];
};
```

For a 4/4 measure with eighth-note subdivision:

```ts
sticking: ["R", "L", "L/R", null, "R", "L", null, "L"]
```

### Requirements

- Sticking is stored at the measure level.
- Sticking array length matches the number of editable subdivisions in the measure.
- Existing grooves without sticking continue to load correctly.
- Missing sticking data is treated as empty.
- Sticking is not part of note data and should not affect playback unless explicitly added later.

---

## 12. Save, Load, Share, and Export Requirements

### 12.1 Save and load

When a user saves a groove:

- Sticking values should be saved with the groove.
- Loading a saved groove should restore sticking values.
- Existing saved grooves without sticking should load correctly.
- Missing sticking data should be interpreted as all empty values.

### 12.2 Share

When a user shares a groove:

- Sticking values should be included in the shared groove payload or link state.
- Opening a shared groove should restore sticking in both the editor and notes view.

### 12.3 Export

When a user exports a groove and sticking values exist:

- Sticking should be included in supported visual exports, including notation image or PDF exports if available.
- Sticking should be included in any notation-oriented export format where sticking is relevant.
- MIDI-related exports should include sticking only if the format supports relevant metadata. Otherwise, sticking may be omitted from MIDI but must remain in the Groovy groove data.

Acceptance criterion:

```gherkin
Given a groove has sticking values
When the user saves, shares, or exports the groove
Then the sticking values are preserved where the format supports them
And when the groove is opened again
Then the sticking appears in both the editor and notes view
```

---

## 13. Measure Editing Behavior

### 13.1 Duplicate measure

When duplicating a measure:

- Sticking values are copied with the measure.

### 13.2 Delete measure

When deleting a measure:

- Sticking data for that measure is deleted with the measure.

### 13.3 Clear measure

When clearing a measure:

- All notes in the measure are cleared.
- All sticking values in the measure are cleared.
- The measure returns to its default empty state.

Acceptance criterion:

```gherkin
Given a measure has notes and sticking values
When the user clears the measure
Then the notes are removed
And the sticking values are reset to empty
And the notes view no longer shows sticking for that measure
```

---

## 14. Apply to Similar Measures

Add an option to apply the current measure's sticking pattern to similar measures.

### 14.1 Placement

The **Apply to Similar Measures** option should appear in the measure header when sticking mode is active.

Recommended behavior:

- Show the option only after the user opens **Sticking** mode.
- Place it near measure-level actions, such as duplicate, delete, or add.
- Do not place it inside the sticking row.
- Do not hide it in a context menu for V1.

Rationale:

- The action is measure-scoped.
- The sticking row should remain focused on per-subdivision editing.
- The option is visible only when relevant.

### 14.2 Similarity definition

Similar measures are measures with the same time structure and the same playable note pattern.

A measure is considered similar when all of the following match:

1. Same time signature
2. Same subdivision count
3. Same instrument rows or drum voices available
4. Same note existence by instrument and subdivision position
5. Same playback-relevant articulation or voice differences

Sticking values must be ignored during similarity comparison.

### 14.3 Articulation and voice comparison

For V1:

- Include articulation or voice differences if they affect playback or notation.
- Example: open hi-hat and closed hi-hat should not be considered the same.
- Ignore purely visual or UI-only metadata.

Ignore fields such as:

- Selection state
- UI-only flags
- Measure label
- Editor focus state
- Existing sticking values

Recommended definition:

> Similar measures are measures with the same time signature, same subdivision structure, and the same playable notes at the same instrument positions, including playback-relevant articulations.

### 14.4 Apply behavior

When the user selects **Apply to Similar Measures**:

- The system finds all other measures that match the current measure's note pattern.
- The system copies only the current measure's sticking values to those measures.
- The system does not modify notes.
- The system does not modify measures with different note patterns.
- If no similar measures are found, show: **No similar measures found.**

### 14.5 Acceptance criteria

```gherkin
Given Measure 1 and Measure 3 have the same note pattern
And Measure 1 has sticking values
When the user selects Apply to Similar Measures from Measure 1
Then Measure 3 receives the same sticking values
And Measure 3 notes remain unchanged
```

```gherkin
Given Measure 1 and Measure 2 have different note patterns
When the user selects Apply to Similar Measures from Measure 1
Then Measure 2 sticking is not changed
```

```gherkin
Given no other measures match the current measure
When the user selects Apply to Similar Measures
Then the user sees "No similar measures found."
```

---

## 15. Backwards Compatibility

Existing grooves without sticking should behave as follows:

- They load normally.
- No sticking is shown in notes view unless values exist.
- When the user clicks **Sticking**, the sticking row appears with all cells empty.
- Saving the groove should persist sticking if values are set.
- Storing an empty sticking array is acceptable if consistent with the data model, but the app should also support the absence of the sticking field.

Rule:

> The sticking row is controlled by sticking setup mode, not by whether sticking data already exists.

---

## 16. Keyboard Accessibility and Shortcuts

### 16.1 Keyboard focus

Keyboard shortcuts should work only when a sticking cell has keyboard focus.

This avoids conflicts with existing editor shortcuts such as playback, editing, deleting, or note entry.

### 16.2 Shortcut behavior

When a sticking cell is focused:

| Key | Action |
|---|---|
| `R` | Set sticking to `R` |
| `L` | Set sticking to `L` |
| `/` | Set sticking to `L/R` |
| `B` | Set sticking to `L/R` |
| `Backspace` | Clear sticking |
| `Delete` | Clear sticking |
| `Space` | Cycle value |
| `Enter` | Cycle value |

### 16.3 Confirmation

- No confirmation step is required.
- Keyboard actions apply immediately.
- Updates should be reflected immediately in the editor and notes preview.

### 16.4 Accessibility labels

Sticking cells should have accessible labels, for example:

- `Beat 1 sticking: Right`
- `Beat 2 and sticking: Left`
- `Beat 3 sticking: both hands`
- `Beat 4 and sticking: empty`

---

## 17. Responsive and Layout Requirements

- The sticking row should work at all supported editor sizes.
- `L/R` must fit inside the column without breaking layout.
- On smaller screens, font size may be reduced.
- The notes view should avoid overlapping sticking text with tempo markings, note stems, or other annotations.
- Sticking setup should not reduce the usability of the main note grid.

---

## 18. Acceptance Criteria Summary

### Editor

- Clicking **Sticking** shows the sticking row above the beat counter.
- Each subdivision has one sticking cell.
- Each sticking cell defaults to empty.
- Clicking a sticking cell cycles through `Empty → R → L → L/R → Empty`.
- Sticking values align with the correct beat and subdivision.
- Sticking setup does not interfere with adding or removing drum notes.

### Notes view

- Sticking values appear above the matching beat or subdivision in the notes view.
- Empty values do not appear.
- Switching to notes-only view preserves visible sticking.
- Sticking is rendered through ABCjs annotations where possible.

### Data and compatibility

- Existing grooves without sticking still load correctly.
- Missing sticking data is treated as empty.
- Saved grooves reload with sticking values.
- Shared grooves preserve sticking values.
- Supported exports include sticking values.

### Measure operations

- Duplicating a measure copies sticking.
- Deleting a measure deletes sticking.
- Clearing a measure clears both notes and sticking.
- Applying to similar measures copies only sticking and does not alter notes.

---

## 19. Implementation Notes

### Recommended data handling

- Normalize missing sticking arrays at render time rather than requiring migration of all old grooves.
- Validate sticking array length against subdivision count.
- If subdivision count changes, reset or remap sticking according to existing measure transformation behavior.

### Recommended comparison helper

Create a helper for measure similarity that returns a normalized playable-note signature.

Example conceptual structure:

```ts
type MeasurePatternSignature = {
  timeSignature: string;
  subdivisionCount: number;
  notesByInstrumentAndPosition: Array<{
    instrumentId: string;
    position: number;
    articulation?: string;
    voice?: string;
  }>;
};
```

The helper should exclude sticking and UI-only fields.

---

## 20. Final Product Decisions

| Topic | Decision |
|---|---|
| Sticking scope | Global per subdivision |
| Default value | Empty |
| Editing interaction | Click-to-cycle |
| Cycle order | `Empty → R → L/R → Empty` is not correct. Use `Empty → R → L → L/R → Empty`. |
| Clear measure behavior | Clear notes and sticking |
| Similar measure behavior | Match playable note pattern, time signature, and subdivision count |
| Similarity comparison | Include playback-relevant articulations and voices |
| Notes rendering | Use ABCjs above-staff annotations where possible |
| Keyboard shortcuts | Active only when a sticking cell has focus |
| Apply to similar measures placement | Measure header when sticking mode is active |
| Backwards compatibility | Empty row appears when sticking mode is opened |
| Auto-fill patterns | Not included in V1 |
| Share and export | Include sticking where the target format supports it |
