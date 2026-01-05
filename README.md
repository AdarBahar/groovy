# Groovy 🥁

Modern drum notation editor and player with clean separation of core logic and UI.

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
npm run build
```

### Type Check

```bash
npm run type-check
```

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
- [ ] React adapter hook
- [ ] Basic UI components

### Phase 2: Essential Features
- [ ] Interactive drum grid
- [ ] Tempo and swing controls
- [ ] Preset patterns
- [ ] Visual playback indicator
- [ ] Sound preview

### Phase 3: Advanced Features
- [ ] More drum voices (toms, cymbals, percussion)
- [ ] Multi-measure support
- [ ] Velocity control
- [ ] Articulations (accents, ghost notes, flams)
- [ ] Undo/redo

### Phase 4: Notation & Export
- [ ] ABC notation rendering
- [ ] Sheet music display
- [ ] MIDI export
- [ ] MIDI import
- [ ] Audio export

### Phase 5: Collaboration & Storage
- [ ] Save/load grooves
- [ ] Cloud storage
- [ ] User accounts
- [ ] Groove library
- [ ] Sharing

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

- **poc-project** - Original proof-of-concept that validated the architecture
- **GrooveScribe** - Original implementation (legacy codebase)


