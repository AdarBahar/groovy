#!/bin/bash
set -e

echo "=== STAGING ALL CHANGES ==="
git add -A

echo ""
echo "=== COMMITTING CHANGES ==="
git commit -m "Fix TypeScript build errors and update documentation

- Remove unused DivisionType import from GrooveUtils.ts
- Remove unused noteValue parameter from getCountLabel()
- Remove unused VOICE_LABELS constant from DrumGrid.tsx
- Update project documentation with recent changes
- Document playback restart on division change pattern
- Document default sync mode change to 'start'
- Add memory log entries for new patterns and gotchas

This commit includes all changes from recent development:
- Playback restart on division/time signature change (fixes audio/visual desync)
- Default sync mode changed from 'middle' to 'start'
- Time signature selector (2-15 beats, 4/8/16 note values)
- Division selector (8, 16, 32, triplets) with compatibility enforcement
- Issue #1 (Time Signature & Division Logic) verified complete

Fixes production build (npm run build:prod now succeeds)
All TypeScript errors resolved"

echo ""
echo "=== PUSHING TO ORIGIN/MAIN ==="
git push origin main

echo ""
echo "=== VERIFICATION ==="
echo "Latest commit:"
git log --oneline -1
echo ""
echo "Status:"
git status

