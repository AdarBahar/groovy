# Groovy 🥁

Modern drum notation editor and player with clean separation of core logic and UI.

## Features

- **Interactive Drum Grid** - Click to add/remove notes with drag-to-paint support
- **Sheet Music Display** - Real-time ABC notation rendering with playback cursor
- **Mobile Support** - Fully responsive design with touch-friendly controls
- **Export Options** - PDF, PNG, SVG, MIDI, MP3, and JSON formats
- **Sharing** - URL-based sharing, social media, QR codes, and embed codes
- **Groove Library** - 25+ preset patterns across Rock, Funk, Jazz, Latin, World, and Practice styles
- **My Grooves** - Save and manage your custom patterns locally
- **Metronome** - Built-in metronome with count-in and frequency options
- **Auto Speed-Up** - Practice mode with automatic tempo increases
- **Undo/Redo** - Full history with keyboard shortcuts (Ctrl+Z, Ctrl+Shift+Z)
- **Bulk Operations** - Apply patterns to voice rows with one click

## Architecture Principles

This project is built with **strict separation of concerns**:

- **Core Logic** (`src/core/`) - Framework-agnostic engine for drum playback, timing, and audio
- **UI Layer** (`src/components/`, `src/App.tsx`) - React-based user interface
- **Adapter Layer** (`src/hooks/`) - Bridges core logic and React

The core engine has **ZERO dependencies** on React or any UI framework, making it:
- ✅ Easy to test without UI
- ✅ Reusable with any framework (React, Vue, Svelte, vanilla JS)
- ✅ Future-proof (UI can be completely replaced)

## Project Structure

```
groovy/
├── src/
│   ├── core/                   # ✅ CORE LOGIC (Framework-agnostic)
│   │   ├── GrooveEngine.ts    # Main playback engine
│   │   ├── DrumSynth.ts       # Audio synthesis
│   │   └── index.ts           # Public API
│   │
│   ├── hooks/                  # ⚛️ REACT ADAPTERS (to be added)
│   │   └── useGrooveEngine.ts # React hook wrapper
│   │
│   ├── components/             # ⚛️ UI COMPONENTS (to be added)
│   │   └── ...                # React components
│   │
│   ├── types.ts               # Shared TypeScript types
│   ├── App.tsx                # Main React app
│   └── main.tsx               # React entry point
│
└── public/
    └── sounds/                # Drum samples (to be added)
```

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
# Development build
npm run build

# Production build (for deployment)
npm run build:prod
```

### Preview Production Build

```bash
npm run preview:prod
```

Open [http://localhost:4173/groovy/](http://localhost:4173/groovy/) in your browser.

### Type Check

```bash
npm run type-check
```

## Deployment

The app is configured to deploy to `/groovy/` subdirectory by default.

**Production URL**: https://www.bahar.co.il/groovy/

### Quick Deploy

```bash
# 1. Build for production
npm run build:prod

# 2. Upload dist/ contents to server
# See DEPLOYMENT.md for detailed instructions
```

### Change Deployment Path

To deploy to a different subdirectory or root:

1. Edit `vite.config.ts`
2. Change `PRODUCTION_BASE_PATH` constant
3. Rebuild with `npm run build:prod`

See `CHANGE_BASE_PATH.md` for detailed instructions.

**Documentation:**
- `DEPLOYMENT.md` - Full deployment guide
- `CHANGE_BASE_PATH.md` - How to change deployment path
- `ROUTER_FIX_UPDATE.md` - Latest deployment update

## Core Engine API

The core engine is completely independent of React:

```typescript
import { GrooveEngine } from './core';

// Create engine
const engine = new GrooveEngine();

// Subscribe to events
engine.on('positionChange', (position) => {
  console.log('Current position:', position);
});

engine.on('playbackStateChange', (isPlaying) => {
  console.log('Playing:', isPlaying);
});

// Start playback
await engine.play(groove, true);

// Stop playback
engine.stop();

// Update groove during playback (applies on next loop)
engine.updateGroove(newGroove);

// Preview a drum sound
await engine.playPreview('kick');

// Clean up
engine.dispose();
```

## Development Roadmap

### Phase 1: Core Features ✅
- [x] Core engine architecture
- [x] Audio synthesis
- [x] Playback timing
- [x] Swing calculation
- [x] React adapter hook
- [x] Basic UI components

### Phase 2: Essential Features ✅
- [x] Interactive drum grid
- [x] Tempo and swing controls
- [x] Preset patterns
- [x] Visual playback indicator
- [x] Sound preview

### Phase 3: Advanced Features ✅
- [x] More drum voices (toms, cymbals, percussion)
- [x] Multi-measure support
- [x] Velocity control (ghost notes, accents)
- [x] Articulations (accents, ghost notes, flams, drags, buzz)
- [x] Undo/redo

### Phase 4: Notation & Export ✅
- [x] ABC notation rendering
- [x] Sheet music display
- [x] MIDI export
- [ ] MIDI import
- [x] Audio export (MP3)

### Phase 5: Collaboration & Storage ✅
- [x] Save/load grooves (localStorage)
- [ ] Cloud storage
- [ ] User accounts
- [x] Groove library (25+ presets)
- [x] Sharing (URL, social, embed, QR)

### Phase 6: Mobile & Polish ✅
- [x] Responsive mobile design
- [x] Touch-friendly controls (44px targets)
- [x] Security hardening (CSP, SVG sanitization, input validation)

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Web Audio API** - Audio synthesis and playback

## Design Philosophy

1. **Separation of Concerns** - Core logic is completely independent of UI
2. **Event-Based Communication** - Core emits events, UI listens
3. **Framework Agnostic** - Core can work with any framework
4. **Test-Driven** - Core logic can be tested without UI
5. **Future-Proof** - UI can be replaced without touching core

## License

MIT

## Related Projects

- **groove-poc** - Original proof-of-concept that validated the architecture
- **GrooveScribe** - Original implementation (legacy codebase)


