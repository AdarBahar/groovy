# Groovy UI rules

These rules come from the UI audit of the main editor and from PR #165. Use them when you add or change a page, a component, or a style. The code is the reference. If this file and the code do not agree, tell the team and correct one of them.

## Colors

The app uses one graphite ramp and one brass accent. The tokens are in `src/styles/tailwind.css` (`--ui-*`). Each token has a light value and a dark value, so a token class does not need a `dark:` variant.

| Role | Class | Light | Dark |
|---|---|---|---|
| Rail, header, footer | `bg-surface-0` | `#f4f4f5` | `#0f0f10` |
| Page background | `bg-surface-1` | `#fafafa` | `#141415` |
| Card | `bg-surface-2` | `#ffffff` | `#19191b` |
| Raised (input, key, active row) | `bg-surface-3` | `#f4f4f5` | `#232325` |
| Hover on raised | `bg-surface-4` | `#e9e9eb` | `#2c2c2f` |
| Border | `border-line`, `border-line-strong` | ink at 10% and 20% | ink at 8% and 16% |
| Main text | `text-ink-1` | `#171717` | `#ededed` |
| Secondary text | `text-ink-2` | `#525252` | `#a1a1a6` |
| Muted text and icons | `text-ink-3` | `#6b6b6b` | `#8e8e94` |
| Accent fill (hits, active state) | `bg-brass` with `text-brass-ink` | `#dfa23f` | `#e2a94f` |
| Accent text | `text-brass-text` | `#8a5700` | `#e2a94f` |
| Danger | `red-500` / `red-600` | | `red-400` |

- Use the token classes for new code. The `slate-*` and `purple-*` classes still work, because they now give graphite and brass values. Do not add new ones.
- Use brass only for a hit, a selected state, or the focus ring. Do not use it for decoration.
- Do not use a gradient, a colored shadow, or a glow.
- `text-ink-3` is the lightest text color. All three ink colors are 4.5:1 or more on all surfaces.
- Do not use `opacity-*` on text to make it muted. Use the muted text color.
- Use 12px (`text-xs`) as the smallest text size. Do not use `text-[10px]`.
- Icons need a contrast of 3:1. Use `text-ink-3` or darker.

## Type

- The interface font is Poppins (`--font-sans`). The display font is Righteous (`--font-display`, class `font-display`).
- Use the display font only for the brand name, the groove title, and the timer. Do not use it for the time signature or for small numbers.
- The font links are in `index.html`. Add a new font there.
- Use weights 400 and 500. Use sentence case for labels. Do not use uppercase labels with wide tracking.
- Numbers use tabular figures (set on `body`).

## Focus

- The shared focus ring is `--ring`: brass `#8a5700` in light mode and `#e2a94f` in dark mode. It is 5:1 or more on all surfaces.
- Use `focus-visible:ring-ring` with no opacity. Do not use `ring-ring/50`.
- Do not remove the outline without a ring in its place.

## Names and semantics

- Each icon-only button has an `aria-label`. A `title` alone is not sufficient.
- Each slider, select, and text field has a name: a `<label htmlFor>` with an `id`, or an `aria-label`. For the shared `Slider`, use the `thumbAriaLabel` prop.
- A toggle button that shows a selected state has `aria-pressed`. Show the state with more than color (for example, bold and underline).
- Do not put a heading inside a `<button>`.

## Dialogs, menus, and drawers

- Use the shared Radix `Dialog` in `src/components/ui/dialog.tsx`. Do not make a custom modal.
- If a dialog has no `DialogTrigger`, give it a return-focus target and focus it in `onCloseAutoFocus`. See `AboutModal.tsx`.
- Each dialog, menu, and drawer closes on Escape.
- An off-screen drawer must not be in the Tab order. Make it `invisible` when it is closed.

## Layout

- Use the Tailwind spacing steps. Do not use arbitrary values such as `mt-[10px]`.
- Do not use a negative margin that puts one control on top of another.
- Test each change at 320px, 768px, 1024px, and 1280px wide. Nothing can clip, and the page must not scroll sideways.
- The header shows text labels from `xl` (1280px). Below `xl`, it shows icons with an `aria-label`.
- Interactive controls are 40px tall or more on desktop, and 44px on touch screens (`touch-target`).

## Copy

- An error message tells the user how to recover. For example: "Could not create the file. Try again, or choose a different format."
- Do not show a raw error message to the user. Send it to `logger.error()`.
- Show a visible error when a clipboard copy fails.

## Motion

- The global `prefers-reduced-motion` rule in `src/index.css` stops animations and transitions. Do not override it.
