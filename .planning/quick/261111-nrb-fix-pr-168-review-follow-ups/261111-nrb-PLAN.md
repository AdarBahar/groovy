---
phase: quick-261111-nrb
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/styles/tailwind.css
  - src/components/ErrorBoundary.tsx
  - src/components/NoteIcon.css
  - src/components/SheetMusicDisplay.css
  - src/pages/ProductionPage.css
  - src/components/MIDITimingIndicator.tsx
  - src/components/production/MetronomeOptionsMenu.tsx
  - src/components/production/MetronomeOptionsMenu.test.tsx
  - src/components/production/Header.tsx
  - src/components/production/DrumGridDark.tsx
  - src/components/production/ClearButton.tsx
  - src/hooks/useHistory.test.ts
autonomous: true
requirements: [PR168-REVIEW-FOLLOWUPS]

must_haves:
  truths:
    - "On the embed page in dark mode, the tempo and swing slider fill is dark on the white surface (contrast 4.5:1 or more)"
    - "The changed header, measure, and Clear confirmation controls are 40px tall or more on desktop"
    - "The metronome frequency buttons have aria-pressed, and only the selected button has aria-pressed=true"
    - "The error-screen title uses the interface font (Poppins), not Righteous"
    - "A Vitest test proves that Undo after replace() does not go back to the state before replace()"
    - "CSS comments in NoteIcon.css and SheetMusicDisplay.css do not say red where the code uses white or brass"
    - "Form fields in ProductionPage.css show a focus ring in var(--ring)"
    - "The 'MIDI Tracking disabled' label uses the text-ink-3 token"
    - "Escape closes the metronome menu and puts focus on the Metronome Options button"
    - "Escape does not close the metronome menu when an open dialog exists or when the event has defaultPrevented"
    - "MetronomeOptionsMenu.tsx has no hard-coded hex colors"
  artifacts:
    - path: "src/hooks/useHistory.test.ts"
      provides: "Regression test for replace() and undo()"
      contains: "replace"
    - path: "src/components/production/MetronomeOptionsMenu.test.tsx"
      provides: "Tests for aria-pressed, Escape focus return, and Escape guards"
      contains: "Escape"
  key_links:
    - from: "src/components/production/Header.tsx"
      to: "src/components/production/MetronomeOptionsMenu.tsx"
      via: "returnFocusRef prop that points to the Metronome Options trigger button"
      pattern: "returnFocusRef"
    - from: "src/styles/tailwind.css .embed block"
      to: "src/components/ui/slider.tsx bg-primary / bg-muted"
      via: "--primary and --muted overrides inside .embed"
      pattern: "--primary"
---

<objective>
Fix the ten below-threshold findings from the PR #168 review on branch feat/ui-skill-mix.

Purpose: The PR must obey docs/UI-RULES.md for contrast, control size, focus, and toggle state. The Undo fix must have a regression test.
Output: CSS and component fixes, one new hook test file, and one new component test file.
</objective>

<execution_context>
@/Users/adar/Code/groovy/.claude/get-shit-done/workflows/execute-plan.md
@/Users/adar/Code/groovy/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@./CLAUDE.md
@docs/UI-RULES.md

<interfaces>
Facts from the codebase (HEAD 493af5d). Use them directly.

src/styles/tailwind.css:
- `:root` has light tokens. `.dark` has dark tokens: `--primary: #ededed`, `--muted: #232325`, `--ring: #e2a94f`.
- Light values: `--primary: #171717`, `--primary-foreground: #ffffff`, `--ring: #8a5700`, `--ui-surface-4: #e9e9eb`.
- There are two `.embed` blocks. The first (about line 78) comes before `.dark`. The second (about line 145) comes after `.dark`, so it wins. It sets only `--ui-ink-1/2/3`.
- The global `h1 { font-family: var(--font-display); ... }` rule is inside `@layer base` (about line 283). A utility class such as `font-sans` overrides it.

src/components/ui/slider.tsx: Track uses `bg-muted`. Range uses `bg-primary`. Thumb uses `border-primary bg-background ring-ring`.

src/hooks/useHistory.ts:
- `export function useHistory<T>(initialState: T, options: number | UseHistoryOptions<T> = 50): UseHistoryReturn<T>`
- Return: `{ state, setState, replace, undo, redo, canUndo, canRedo, clear }`
- `replace(newState)` sets `present` and keeps `past` and `future`. `setState` pushes the old present to `past`.
- Existing hook test style: `src/hooks/useAutoSpeedUp.test.ts` uses `renderHook, act` from `@testing-library/react`.

src/components/production/MetronomeOptionsMenu.tsx:
- Props: `isOpen, onClose, config, onFrequencyChange, onSoloChange, onCountInChange, onVolumeChange, onOffsetClickChange`.
- Lines 29-37: a window `keydown` listener calls `onClose()` on Escape.
- Lines 49-50: `trackColor = isDark ? "#2c2c2f" : "#e6e6e8"` and `thumbBorderColor = isDark ? "#19191b" : "#ffffff"`. They are used in the volume input inline `background` gradient (line 96) and in the `<style>` block thumb `border` (lines 155, 164).
- Lines 61-75: the frequency buttons in `role="group" aria-labelledby="metronome-frequency-label"` show the selected option by color only.

src/components/production/Header.tsx:
- Line 135 renders `<MetronomeOptionsMenu>`. Line 123 is the trigger `<button>` with `aria-label="Metronome Options"` and class `size-9`.
- Header tests mock `useTheme` with `vi.mock('../../contexts/ThemeContext', () => ({ useTheme: () => ({ isDark: true, toggleTheme: vi.fn() }) }))`.
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix the embed slider tokens, the error title font, CSS comments, the focus ring, and the indicator label</name>
  <files>src/styles/tailwind.css, src/components/ErrorBoundary.tsx, src/components/NoteIcon.css, src/components/SheetMusicDisplay.css, src/pages/ProductionPage.css, src/components/MIDITimingIndicator.tsx</files>
  <action>
Review item 1 (embed slider). In the second `.embed` block of src/styles/tailwind.css (after `.dark`), add the light values for the tokens that the slider uses: `--primary: #171717`, `--primary-foreground: #ffffff`, `--muted: #e9e9eb`, `--background: #ffffff`, and `--ring: #8a5700`. Extend the existing comment to say that these tokens keep the slider fill, the track, and the focus ring readable on the white surface. Do not change the first `.embed` block. Run `grep -rn "Slider\|type=\"range\"" src/pages/EmbedPage.tsx src/components/production/PlaybackControls.tsx src/components/TempoControl.tsx` to confirm which slider the embed page uses. If the embed slider uses other tokens (for example `--ui-brass` or a `--ui-surface-*` token for the track), also set the light value of those tokens in the same block.

Review item 4 (error title font). Add the `font-sans` class to the `<h1>` in src/components/ErrorBoundary.tsx (about line 91). Do not change the global `h1` rule, because other titles use the display font on purpose.

Review item 6 (comments). In src/components/NoteIcon.css, read lines 65-115 and update the comments at about lines 69, 83, and 110 so that they name the color that the code uses (white or brass), not red. In src/components/SheetMusicDisplay.css line 51, change "in red" to the color that the rule below the comment sets. Change comments only.

Review item 7 (focus ring). In src/pages/ProductionPage.css (about lines 38-47), in the `:focus-visible` rule for the form fields, set `border-color: var(--ring)` and `box-shadow: 0 0 0 2px var(--ring)`. Keep `outline: none`, because the box-shadow ring replaces the outline (docs/UI-RULES.md, Focus).

Review item 8 (label contrast). In src/components/MIDITimingIndicator.tsx (about line 116), replace `text-slate-400 dark:text-slate-500` on the "MIDI Tracking disabled" span with `text-ink-3`. The token has a light and a dark value, so do not add a `dark:` variant.
  </action>
  <verify>
    <automated>cd /Users/adar/Code/groovy && awk '/^\.embed \{/{n++} n==2' src/styles/tailwind.css | grep -q -- "--primary: #171717" && grep -q "font-sans" src/components/ErrorBoundary.tsx && ! grep -iwq "red" src/components/SheetMusicDisplay.css && ! grep -iwq "red" src/components/NoteIcon.css && grep -q "var(--ring)" src/pages/ProductionPage.css && ! grep -q "text-slate-400 dark:text-slate-500" src/components/MIDITimingIndicator.tsx && npx tsc -b</automated>
  </verify>
  <done>The second `.embed` block sets --primary, --primary-foreground, --muted, --background, and --ring to light values. The ErrorBoundary h1 has font-sans. NoteIcon.css and SheetMusicDisplay.css have no comment that says red for a white or brass color. The form-field focus rule uses var(--ring). The indicator label uses text-ink-3. `npx tsc -b` passes.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Fix the metronome menu (aria-pressed, Escape, tokens) and the header control heights</name>
  <files>src/components/production/MetronomeOptionsMenu.tsx, src/components/production/MetronomeOptionsMenu.test.tsx, src/components/production/Header.tsx</files>
  <behavior>
    - Test 1: With config.frequency = 8, the four frequency buttons in the "Metronome" group all have aria-pressed, and only "8th" has aria-pressed="true".
    - Test 2: Escape on window calls onClose once and moves focus to the element in returnFocusRef.
    - Test 3: Escape does not call onClose when the document has an element with role="dialog" and data-state="open".
    - Test 4: Escape does not call onClose when the event has defaultPrevented = true (dispatch a cancelable KeyboardEvent and call preventDefault() before the window listener sees it, for example from a capture listener on window that you add in the test).
    - Test 5: The rendered menu HTML has no "#2c2c2f", "#e6e6e8", or "#19191b" text.
  </behavior>
  <action>
Write src/components/production/MetronomeOptionsMenu.test.tsx first. Use the `vi.mock` of `../../contexts/ThemeContext` from Header.test.tsx. Render `MetronomeOptionsMenu` with `isOpen`, `vi.fn()` callbacks, and a config that matches `MetronomeConfig` in src/types.ts. Run the tests and confirm that they fail. Then make the changes below.

Review item 3 (per docs/UI-RULES.md, toggle buttons). Add `aria-pressed={config.frequency === option.value}` to each frequency button. Also show the state with more than color: add `font-semibold underline underline-offset-4` to the selected button classes, as the Header metronome buttons do.

Review item 9 (Escape). Add an optional prop `returnFocusRef?: React.RefObject<HTMLElement | null>`. In the keydown handler, do these steps in order: return if `e.key !== 'Escape'`; return if `e.defaultPrevented`; return if `document.querySelector('[role="dialog"][data-state="open"]')` is not null; call `e.preventDefault()`; call `onClose()`; call `returnFocusRef?.current?.focus()`. Add `returnFocusRef` to the effect dependency array. In src/components/production/Header.tsx, create `const metronomeOptionsButtonRef = useRef<HTMLButtonElement>(null)`, attach it to the Metronome Options trigger button, and pass it as `returnFocusRef`. Also add `aria-expanded={showMetronomeOptions}` to the trigger button.

Review item 10 (hex colors). Replace `trackColor` with `'var(--ui-surface-4)'` and `thumbBorderColor` with `'var(--ui-surface-2)'`. These tokens have the same light and dark values as the old hex colors (dark #2c2c2f and #19191b, light #e9e9eb and #ffffff). Use single quotes. Remove the `isDark` branches for these two constants. Keep `isDark` only if other code in the file still uses it.

Review item 2, Header part (docs/UI-RULES.md, Layout: 40px or more on desktop). In src/components/production/Header.tsx, change `h-9` to `h-10` and `size-9` to `size-10` on the interactive controls at about lines 114, 125, 158, 176, 191, 210, 241, and 258. At about line 281, change `size-9 max-md:size-10` to `size-10`. Before the change, confirm that no parent of these controls has a fixed height less than 40px. If one does, increase that height by the same 4px.
  </action>
  <verify>
    <automated>cd /Users/adar/Code/groovy && npx vitest run src/components/production/MetronomeOptionsMenu.test.tsx src/components/production/Header.test.tsx && ! grep -n "#[0-9a-fA-F]\{6\}" src/components/production/MetronomeOptionsMenu.tsx && ! grep -nE "\b(h-9|size-9)\b" src/components/production/Header.tsx</automated>
  </verify>
  <done>The new test file has 5 passing tests. Header.test.tsx still passes. MetronomeOptionsMenu.tsx has no 6-digit hex color. Header.tsx has no h-9 or size-9 class. The trigger button has a ref and aria-expanded.</done>
</task>

<task type="auto" tdd="true">
  <name>Task 3: Raise the measure and Clear control heights, add the useHistory replace() test, and run the full checks</name>
  <files>src/components/production/DrumGridDark.tsx, src/components/production/ClearButton.tsx, src/hooks/useHistory.test.ts</files>
  <behavior>
    - Test 1: setState(B) after initial A, then replace(C), then undo() gives state A. canUndo is false after the undo.
    - Test 2: replace(C) on a fresh hook gives state C and canUndo false. undo() keeps state C.
    - Test 3: setState(B), undo(), then replace(C) keeps canRedo true (replace does not clear the future stack).
  </behavior>
  <action>
Review item 5. Create src/hooks/useHistory.test.ts. Start the file with `/** Tests for useHistory replace() (Undo keeps a groove loaded from a link) */`. Use `renderHook` and `act` from `@testing-library/react`, as src/hooks/useAutoSpeedUp.test.ts does. Use simple objects such as `{ id: 'A' }` as the state. Write the three tests in the behavior block. They test existing code, so they must pass at once. If a test fails, report the failure as a bug in `replace()`. Do not change the test to make it pass.

Review item 2, grid and Clear part (docs/UI-RULES.md, Layout). In src/components/production/DrumGridDark.tsx, remove `md:w-8 md:h-8` from the five measure action buttons (about lines 244, 253, 262, 271, and 280). The buttons then stay `w-10 h-10` at all widths. In src/components/production/ClearButton.tsx, change `h-9` to `h-10` at about line 86, and change `h-8` to `h-10` on the Yes and Cancel buttons at about lines 109 and 117. Do not change other classes.

Then run the full checks: `npx tsc -b`, `npx vitest run`, `npm run lint`, and `npm run build`. If a check fails because of a change in this plan, fix it. If an existing test asserts the old `h-8`, `h-9`, or `md:h-8` class, update that assertion to the new class.
  </action>
  <verify>
    <automated>cd /Users/adar/Code/groovy && ! grep -n "md:h-8" src/components/production/DrumGridDark.tsx && ! grep -nE "\b(h-8|h-9)\b" src/components/production/ClearButton.tsx && npx tsc -b && npx vitest run && npm run lint && npm run build</automated>
  </verify>
  <done>useHistory.test.ts has 3 passing tests. DrumGridDark.tsx has no md:w-8 or md:h-8 class. ClearButton.tsx has no h-8 or h-9 class. tsc, vitest, lint, and build all pass.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| None new | The changes are CSS, class names, ARIA attributes, a keyboard handler, and tests. No new input crosses a trust boundary. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-nrb-01 | D | MetronomeOptionsMenu Escape handler | mitigate | Check `defaultPrevented` and an open dialog before close, so the menu does not take Escape from a dialog. |
| T-nrb-02 | T | .embed token overrides | accept | The tokens are static CSS values. They affect only the embed surface. |
</threat_model>

<verification>
- `npx tsc -b` passes.
- `npx vitest run` passes, with the new MetronomeOptionsMenu and useHistory tests.
- `npm run lint` passes.
- `npm run build` passes.
</verification>

<success_criteria>
- All ten review items (1-10) have a change in the code.
- The vague item about font weight, brass on links, slate-* classes, and arbitrary values is not in scope. docs/UI-RULES.md has no rule that one small change fixes.
- No new hard-coded hex colors and no new slate-* classes in the changed lines.
</success_criteria>

<output>
After completion, create `.planning/quick/261111-nrb-fix-pr-168-review-follow-ups/261111-nrb-SUMMARY.md`
</output>
