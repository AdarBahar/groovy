# Groovy UI rules

These rules come from the UI audit of the main editor and from PR #165. Use them when you add or change a page, a component, or a style. The code is the reference. If this file and the code do not agree, tell the team and correct one of them.

## Colors

The app uses Tailwind slate and purple classes with `dark:` variants. The shadcn tokens in `src/styles/tailwind.css` are mostly not used, except `--ring`.

| Role | Light | Dark |
|---|---|---|
| Page background | `bg-slate-100` | `dark:bg-slate-900` |
| Surface (header, cards, sidebar) | `bg-white` or `bg-slate-50` | `dark:bg-slate-800` |
| Border | `border-slate-200` | `dark:border-slate-700` |
| Main text | `text-slate-900` | `dark:text-white` |
| Muted text and icons | `text-slate-600` | `dark:text-slate-400` |
| Accent (primary action, selected state) | `purple-600` | `purple-400` / `purple-500` |
| Danger | `red-500` / `red-600` | `red-400` |

- Do not use `text-slate-400` or `text-slate-500` for text on a light surface. The contrast is less than 4.5:1.
- Do not use `dark:text-slate-500` for text on slate-800 or slate-900. The contrast is less than 4.5:1.
- Do not use `opacity-*` on text to make it muted. Use the muted text color.
- Use 12px (`text-xs`) as the smallest text size. Do not use `text-[10px]`.
- Icons need a contrast of 3:1. On white, use `text-slate-500` or darker.

## Focus

- The shared focus ring is `--ring`: purple-600 in light mode and purple-400 in dark mode. It is 5:1 or more on all surfaces.
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
