# Implementation Plan: Issue #10 – ABC Notation Transcoding & Rendering

## Decisions (Resolved 2026-01-06)
- ✅ **abcjs bundle size** (~300KB) – Acceptable
- ✅ **Multi-voice rendering** – Kick stems DOWN (separate voice for hands/feet)
- ✅ **Real-time updates** – Editor changes reflect immediately on sheet music
- ✅ **Legacy URL format** – Match GrooveScribe exactly for import compatibility

---

## 1. Scope

### In Scope
- **Core ABC transcoding** – Convert `GrooveData` to valid ABC notation string
- **ABC rendering to SVG** – Display sheet music notation in the UI
- **Multi-voice notation** – Hands (stems up) + Feet (stems down)
- **URL encoding** – Compact drum-tab format for sharing (GrooveScribe-compatible)
- **Bi-directional support** – Parse URL/ABC back to `GrooveData`
- **Real-time sync** – Editor changes → immediate sheet music update

### Out of Scope
- MIDI export (future issue)
- Audio export (future issue)
- Printing/PDF generation (can be added later)
- Click-to-edit on notation (editor grid is the editing interface)

---

## 2. Design

### 2.1 Architecture (Separation of Concerns)

```
┌─────────────────────────────────────────────────────────────────┐
│                         CORE LAYER                              │
│                    (src/core/, no React)                        │
├─────────────────────────────────────────────────────────────────┤
│  ABCConstants.ts           │  GrooveURLCodec.ts                 │
│  • DrumVoice → ABC maps    │  • GrooveData → URL params         │
│  • Symbol definitions      │  • URL params → GrooveData         │
│  • Voice map boilerplate   │  • GrooveScribe-compatible         │
├─────────────────────────────────────────────────────────────────┤
│  ABCTranscoder.ts          │  ABCRenderer.ts                    │
│  • GrooveData → ABC string │  • ABC string → SVG (via abcjs)    │
│  • Multi-voice support     │  • Error handling                  │
│  • Triplet handling        │  • Render options                  │
└─────────────────────────────────────────────────────────────────┘
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        REACT LAYER                               │
│                     (src/poc/components/)                        │
├─────────────────────────────────────────────────────────────────┤
│  SheetMusicDisplay.tsx     │  (integrated into PocApp.tsx)      │
│  • Displays SVG notation   │  • Updates on groove change        │
│  • Toggleable visibility   │  • No debounce needed (fast)       │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Multi-Voice Rendering (Kick Stems Down)

Based on GrooveScribe's ABC implementation, we use **two voices on the same staff**:

```abc
%%staves (Hands Feet)
K:C clef=perc
V:Hands stem=up
%%voicemap drum
^g^g [c^g]^g ^g^g [c^g]^g |
V:Feet stem=down
%%voicemap drum
F2 F2 F2 F2 |
```

**Rendering result:**
- Hi-hat + Snare = stems UP (Hands voice)
- Kick + Hi-hat foot = stems DOWN (Feet voice)

### 2.3 ABC Symbol Mapping

Based on GrooveScribe's `groove_utils.js` constants:

| Drum Voice | URL Tab | ABC Symbol | Notes |
|------------|---------|------------|-------|
| hihat-closed | `x` | `^g` | Uses `%%map` for X notehead |
| hihat-open | `o` | `!open!^g` | Open hi-hat decoration |
| hihat-accent | `X` | `!accent!^g` | Accent above note |
| hihat-foot | `+` | `^d,` | In Feet voice, stems down |
| snare-normal | `o` | `c` | Standard snare |
| snare-accent | `O` | `!accent!c` | Accent decoration |
| snare-ghost | `g` | `!(.!!).!c` | Parentheses via `%%deco` |
| snare-cross-stick | `x` | `^c` | X notehead |
| snare-flam | `f` | `{/c}c` | Grace note (acciaccatura) |
| kick | `o` | `F` | In Feet voice, stems down |
| crash | `C` | `^A'` | X notehead, high position |
| ride | `r` | `^f` | X notehead |
| tom-rack | `t` | `d` or `e` | Depends on tom number |
| tom-floor | `T` | `G` or `a,` | Lower staff position |

### 2.4 Required ABC Boilerplate

```abc
%%beginsvg
<defs>
<use id="VoidWithX" xlink:href="#acc2"/>
</defs>
%%endsvg
%%map drum ^g heads=VoidWithX print=g   % Hi-Hat
%%map drum ^A' heads=VoidWithX print=A'  % Crash
%%map drum ^f heads=VoidWithX print=f   % Ride
%%map drum ^c heads=VoidWithX print=c   % Cross Stick
%%map drum ^d, heads=VoidWithX print=d,  % Foot Splash
%%deco (. 0 a 5 1 1 "@-8,-3("
%%deco ). 0 a 5 1 1 "@4,-3)"
%%flatbeams 1
%%ornament up
```

---

## 3. Task Breakdown

### Phase 1: Core ABC Transcoding
- **Task 1.1**: `ABCConstants.ts` – DrumVoice → ABC/URL mappings + boilerplate
- **Task 1.2**: `ABCTranscoder.ts` – `grooveToABC()` with multi-voice support
- **Task 1.3**: Triplet division support (12, 24, 48)
- **Task 1.4**: `ABCTranscoder.test.ts` – Unit tests

### Phase 2: ABC Rendering
- **Task 2.1**: Install `abcjs` dependency (`npm install abcjs`)
- **Task 2.2**: `ABCRenderer.ts` – Wrapper for abcjs with error handling
- **Task 2.3**: `ABCRenderer.test.ts` – Tests

### Phase 3: React UI (Real-time sync)
- **Task 3.1**: `SheetMusicDisplay.tsx` component
- **Task 3.2**: Integrate into `PocApp.tsx` with immediate updates on groove change

### Phase 4: URL Encoding (GrooveScribe-compatible)
- **Task 4.1**: `GrooveURLCodec.ts` – Encode/decode matching legacy format

---

## 4. Rollout Plan
- No breaking changes to existing GrooveData or UI
- Sheet music display is additive (new panel below grid)
- Toggle visibility with button in controls

---

## 5. Testing Plan
- Unit tests for ABCTranscoder (all voices, time sigs, divisions, triplets)
- Unit tests for ABCRenderer (valid/invalid ABC)
- Unit tests for GrooveURLCodec (roundtrip encode/decode)
- Integration: Full pipeline GrooveData → ABC → SVG
- Manual: Editor changes reflect immediately in sheet music

---

## 6. Dependencies
| Package | Version | Purpose |
|---------|---------|---------|
| `abcjs` | `^6.x` | ABC to SVG rendering |

---

## 7. Estimated Effort
| Phase | Estimate |
|-------|----------|
| Core transcoding + multi-voice | 3-4 hours |
| abcjs integration | 1-2 hours |
| React UI + real-time sync | 1-2 hours |
| URL codec (GrooveScribe-compatible) | 2 hours |
| **Total** | **7-10 hours** |

---

## 8. Implementation Notes

### Multi-Voice ABC Generation

The transcoder must generate **two separate voices** on the same percussion staff:

```typescript
function grooveToABC(groove: GrooveData, options?: ABCOptions): string {
  // 1. Generate boilerplate header
  const header = generateABCHeader(groove, options);

  // 2. Generate Hands voice (hi-hat, snare, toms, cymbals) - stems UP
  const handsVoice = generateHandsVoice(groove);

  // 3. Generate Feet voice (kick, hi-hat foot) - stems DOWN
  const feetVoice = generateFeetVoice(groove);

  // 4. Combine with %%staves directive
  return `${header}
%%staves (Hands Feet)
K:C clef=perc
V:Hands stem=up
%%voicemap drum
${handsVoice}
V:Feet stem=down
%%voicemap drum
${feetVoice}`;
}
```

### Real-time Sync with Editor

In `PocApp.tsx`, the sheet music updates whenever `groove` state changes:

```tsx
// SheetMusicDisplay receives groove as prop
<SheetMusicDisplay groove={groove} visible={showNotation} />

// Inside SheetMusicDisplay:
useEffect(() => {
  const abc = ABCTranscoder.grooveToABC(groove);
  ABCRenderer.renderToSVG(abc, containerRef.current);
}, [groove]); // Re-render on any groove change
```

### GrooveScribe URL Format

Legacy format to match:
```
?TimeSig=4/4&Div=16&Tempo=120&Measures=1&H=|x-x-x-x-x-x-x-x-|&S=|----o-------o---|&K=|o-------o-------|
```

Codec must:
1. Parse `H`, `S`, `K`, `T1`-`T4` patterns
2. Handle `|` measure separators
3. Map tab characters to DrumVoice states

