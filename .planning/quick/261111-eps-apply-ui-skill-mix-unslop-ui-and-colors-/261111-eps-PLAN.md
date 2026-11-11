---
quick_id: 261111-eps
description: Apply UI skill mix - unslop UI and colors, UI/UX Pro Max fonts, Vercel accessibility fixes
date: 2026-11-11
---

# Quick task 261111-eps: apply the UI skill mix

The user compared six UI skills on scratchpad copies of the app and chose a mix.

## Tasks

1. Apply the unslop version of `src/` (graphite ramp, brass accent, one transport row, no nested frames).
2. Merge the Vercel web-design-guidelines fixes into it (three-way merge, base = the original `src/`).
3. Replace the fonts with the UI/UX Pro Max pair: Poppins (interface) and Righteous (brand name, groove title, timer).
4. Put the charset, viewport, title and font tags in `index.html`. Remove `src/head.tsx`, because nothing renders it.
5. Update `docs/UI-RULES.md` to agree with the code.

## Verify

- `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` pass.
- Dark, light and 390 px screenshots of the main screen show no overlap and all controls.
