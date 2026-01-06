# Project Context

**Project**: Groovy 🥁
**Repository**: https://github.com/AdarBahar/groovy
**Local Path**: `/Users/adar.bahar/Code/groovy`
**Status**: Active Development (v0.1.0)

---

## What is Groovy?

Groovy is a **modern drum notation editor and player** built with strict separation between core logic and UI. It allows users to create, edit, and play drum patterns with an interactive grid interface.

### Core Architecture Principles

1. **Framework-Agnostic Core** (`src/core/`)
   - Zero dependencies on React or any UI framework
   - Event-based communication (observer pattern)
   - Can be used with React, Vue, Svelte, or vanilla JS

2. **React UI Layer** (`src/components/`, `src/pages/`)
   - Consumes core engine through adapter hooks
   - Completely replaceable without touching core logic

3. **Adapter Layer** (`src/hooks/`)
   - Bridges core logic and React
   - `useGrooveEngine` hook is the ONLY React-specific integration point

---

## Recent Changes (2026-01-05)

### Note Creation Feature Enhancements
- ✅ **Fixed missing samples**: All drum sample mappings corrected, no console errors
- ✅ **Comprehensive documentation**: User guide, quick reference, demo resources
- ✅ **Unit tests**: All 15 bulk patterns tested with Vitest
- ✅ **Touch support**: Full mobile support with drag-to-paint and long-press
- ✅ **Undo/Redo**: 50-action history with keyboard shortcuts and UI controls
- ✅ **Custom patterns**: Save/load custom patterns with localStorage persistence

**New Features**:
- **Advanced Edit Mode**: Toggle with 'E' key - left-click opens articulation menu
- **Drag-to-Paint**: Ctrl+drag to paint, Alt+drag to erase
- **Bulk Operations**: Click voice labels for 15 built-in patterns
- **Touch Gestures**: Tap to toggle, drag to paint, long-press for menu
- **Undo/Redo**: Ctrl+Z to undo, Ctrl+Shift+Z or Ctrl+Y to redo
- **Custom Patterns**: Save button in bulk dialog, patterns persist across reloads

**Files Created**: 19 total (4 core, 1 hook, 8 components, 5 docs, 1 config)
**Files Modified**: 10 total

**Documentation**:
- `docs/USER_GUIDE.md` - Comprehensive user guide
- `docs/QUICK_REFERENCE.md` - Quick reference card
- `docs/DEMO_VIDEO_SCRIPT.md` - Full video script
- `docs/DEMO_TALKING_POINTS.md` - Live demo guide
- `docs/DEMO_STORYBOARD.md` - Visual storyboard
- `docs/DEMO_CHEAT_SHEET.md` - Quick demo reference

### Playback Restart on Division Change & Default Sync Mode
- ✅ **Fixed critical bug**: Division/time signature changes during playback now restart from position 0
- ✅ **Prevents audio/visual desync**: Visual progress always matches audio position
- ✅ **Changed default sync mode**: Now "start" instead of "middle" (more intuitive)
- ✅ **Verified Issue #1 complete**: All time signature and division logic working correctly

**Behavior Changes**:
- Changing division during playback: Stops → Updates → Restarts from beginning
- Default sync mode on page load: "Start" (playhead at beginning of note)

**Files Changed**:
- `src/poc/PocApp.tsx` - Added playback restart logic, changed default sync mode
- `src/hooks/useGrooveEngine.ts` - Exposed `play` and `stop` methods

### Production Deployment Configuration
- ✅ Configured for deployment to www.bahar.co.il/scribe2/
- ✅ Configurable base path via `PRODUCTION_BASE_PATH` constant in `vite.config.ts`
- ✅ React Router basename automatically uses base path
- ✅ Sound loading uses dynamic paths based on base path
- ✅ Build optimizations: manual chunk splitting, minification, content hashing
- ✅ Comprehensive deployment documentation (7 guides created)
- ✅ Apache .htaccess configuration for subdirectory deployment
- ✅ Build size: ~480KB code + 272KB sounds = ~752KB total

**Deployment Commands**:
- `npm run build:prod` - Build for production with `/scribe2/` base path
- `npm run preview:prod` - Preview production build locally

**Documentation**:
- `DEPLOYMENT.md` - Full deployment guide
- `CHANGE_BASE_PATH.md` - How to change deployment subdirectory
- See project root for 7 deployment guides

---

## Current System State (2026-01-05)

### ✅ What's Working

**Core Engine** (Framework-agnostic)
- `GrooveEngine` - Playback engine with precise timing and scheduling
- `DrumSynth` - Web Audio API integration with sample loading
- Event-based API: `playbackStateChange`, `positionChange`, `grooveChange`
- Swing calculation and sync modes (start/middle/end)
- Loop management with pending groove updates

**POC Testing Interface** (`/poc`)
- Full drum grid (hihat, snare, kick) with articulation support
- Playback controls (play/stop with visual feedback)
- Tempo control (40-240 BPM)
- Swing control (0-100%)
- Pattern presets (Basic Rock, Disco, Funk, Reggae, Bossa Nova, Samba, Shuffle, Waltz)
- Sync mode selection (default: "start")
- Real-time position indicator
- Sound preview on voice labels
- 30 drum samples loaded from `/public/sounds/`
- **Advanced edit mode** - Toggle with 'E' key
- **Drag-to-paint** - Ctrl+drag to paint, Alt+drag to erase
- **Bulk operations** - 15 built-in patterns (hi-hat, snare, kick)
- **Articulation selection** - Right-click or advanced mode for 50+ articulations
- **Touch support** - Tap, drag, long-press for mobile
- **Undo/Redo** - Ctrl+Z/Ctrl+Y with 50-action history
- **Custom patterns** - Save/load custom patterns with localStorage

**Production UI** (`/`)
- Placeholder page with navigation
- Ready for development

**Infrastructure**
- React Router for dual-page setup
- TypeScript with strict type checking
- Vite for fast development and builds
- ESLint for code quality

### 🚧 In Progress

- Production UI design and implementation
- Additional drum voices (toms, cymbals, percussion)
- Advanced features (velocity, articulations, multi-measure)

### 📋 Planned

- Notation rendering (ABC notation, sheet music)
- MIDI import/export
- Audio export
- Save/load patterns
- Cloud storage and user accounts

---

## Recent Changes (Newest First)

### 2026-01-05: Note Creation Feature Enhancements
- Fixed missing drum sample mappings (no more console errors)
- Created comprehensive documentation (user guide, demo resources)
- Added unit tests with Vitest (all 15 bulk patterns tested)
- Implemented touch support for mobile (drag-to-paint, long-press)
- Added undo/redo functionality (50-action history)
- Implemented custom pattern saving (localStorage persistence)
- See `.codeagent/current/project_history.md` for detailed history

### 2026-01-05: Playback Restart on Division Change & Default Sync Mode
- Fixed audio/visual desync when changing division during playback
- Changed default sync mode from "middle" to "start"
- Closed Issue #1 (Time Signature & Division Logic verified complete)
- See `.codeagent/current/project_history.md` for detailed history

### 2026-01-05: CodeAgent Kit Integration
- Embedded codeagent-kit v1.2.0 at `.codeagent/`
- Added project documentation structure
- See `.codeagent/current/project_history.md` for detailed history

### 2025-12-XX: Dual-Page Setup
- Split into POC testing page (`/poc`) and production UI (`/`)
- Added React Router for navigation
- Moved POC components to `src/poc/` directory
- Created placeholder production page

### 2025-12-XX: Initial Implementation
- Core engine architecture (GrooveEngine, DrumSynth)
- React adapter hook (useGrooveEngine)
- POC interface with full functionality
- 30 drum samples loaded

---

## Tech Stack

- **React 18** - UI framework
- **TypeScript 5.6** - Type safety
- **Vite 6** - Build tool and dev server
- **Web Audio API** - Audio synthesis and playback
- **React Router 7** - Client-side routing
- **ESLint** - Code linting

---

## Key Files

### Core Logic (Framework-Agnostic)
- `src/core/GrooveEngine.ts` - Main playback engine
- `src/core/DrumSynth.ts` - Audio synthesis
- `src/core/index.ts` - Public API exports

### React Integration
- `src/hooks/useGrooveEngine.ts` - React adapter hook
- `src/App.tsx` - Router setup
- `src/main.tsx` - React entry point

### POC Testing
- `src/poc/PocApp.tsx` - POC application
- `src/poc/components/` - POC UI components
- `src/pages/PocPage.tsx` - POC route wrapper

### Production UI
- `src/pages/ProductionPage.tsx` - Production route (placeholder)
- `src/components/` - Shared/production components

### Types & Config
- `src/types.ts` - Shared TypeScript types
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `vite.config.ts` - Vite configuration

---

## Development Workflow

1. **Start dev server**: `npm run dev`
2. **Test on POC**: http://localhost:5174/poc
3. **Build production**: http://localhost:5174/
4. **Type check**: `npm run type-check`
5. **Lint**: `npm run lint`

---

## Links

- **GitHub**: https://github.com/AdarBahar/groovy
- **POC Reference**: `~/Code/GrooveScribe-1/groove-poc/`
- **Documentation**: See `README.md`, `GETTING_STARTED.md`, `DUAL_PAGE_SETUP.md`
