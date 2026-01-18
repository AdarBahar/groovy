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

## Recent Changes

### 2026-01-17: Security Fixes (Issues #60, #61)
- ✅ **SVG Sanitization (Issue #60)**: DOMPurify sanitizes all SVG export output
  - Added `sanitizeSVG()` function using DOMPurify with SVG profile
  - Enhanced `escapeXml()` to remove control characters and null bytes
  - All user content properly escaped before embedding in SVG
- ✅ **URL Parameter Validation (Issue #61)**: Zod schema validation for all URL params
  - Tempo, swing, measures, division all have range validation
  - Text fields (title, author, comments) have length limits
  - Voice patterns validated with character whitelist regex
  - Invalid values silently fall back to safe defaults
- ✅ **New Dependencies**: `dompurify`, `zod` (security libraries)
- ✅ **Bundle Optimization**: New `validation` chunk (77 kB) for zod/dompurify
  - Main bundle reduced from 882 kB to 804 kB (~9% reduction)

### 2026-01-17: Mobile & Adaptive View (Issue #57)
- ✅ **Responsive Components**: All modals, dialogs, and UI elements mobile-optimized
- ✅ **Touch Targets**: 44px minimum touch targets for accessibility
- ✅ **useResponsive Hook**: Fixed React hooks order violation causing crash
- ✅ **GPU Acceleration**: CSS classes for smooth animations on mobile

### 2026-01-14: Security Hardening & Code Quality Improvements
- ✅ **React Router CVEs Fixed**: Updated to 7.12.0, resolved 3 vulnerabilities (XSS, CSRF)
- ✅ **XSS Prevention**: Eliminated all innerHTML usage with safe DOM methods
- ✅ **CSP Headers**: Added Content-Security-Policy, Referrer-Policy, Permissions-Policy
- ✅ **localStorage Safety**: Quota handling with auto-cleanup at 5MB limit
- ✅ **Audio Rate Limiting**: 10ms minimum interval prevents spam/DoS
- ✅ **Debug Mode**: Toggle in About modal, logger replaces console.log
- ✅ **Error Boundary**: React error boundary with fallback UI
- ✅ **Type Safety**: Removed @ts-ignore, proper type assertions
- ✅ **Bundle Analyzer**: rollup-plugin-visualizer, `npm run build:analyze`
- ✅ **Environment Variables**: VITE_ANALYTICS_DOMAIN configurable

### 2026-01-13: Bundle Size Optimization
- ✅ **Manual chunk splitting**: Heavy libraries split into separate chunks
- ✅ **Main bundle**: Reduced from 1,407 kB to 787 kB (44% smaller)
- ✅ **Lazy loading**: jspdf, lamejs, midi-writer-js, qrcode loaded on demand
- ✅ **vite.config.ts**: Added manualChunks configuration

### 2026-01-12: Export Functionality (Issue #31 - Complete)
- ✅ **Download Modal**: Full-featured export modal with format selection
- ✅ **Export Formats**: JSON, MIDI, PDF, PNG, SVG, MP3 (WAV pending)
- ✅ **ExportUtils.ts**: Comprehensive export utility library (783 lines)
- ✅ **Sheet Music Export**: SVG/PNG/PDF with header, metadata, QR code, URL
- ✅ **MIDI Export**: Standard MIDI file with correct drum mapping (GM standard)
- ✅ **MP3 Export**: Audio rendering using @breezystack/lamejs encoder
- ✅ **Loop Support**: MIDI/MP3 exports support configurable loop count (1-16)
- ✅ **Dependencies**: jsPDF, qrcode, midi-writer-js, @breezystack/lamejs

### 2026-01-12: Share Modal (Issue #31 - Partial)
- ✅ **Share Modal**: 5 tabs for sharing grooves (Link, Social, Embed, QR, Email)
- ✅ **Social Sharing**: X/Twitter, Facebook, Reddit via popup windows
- ✅ **Embed Code**: iframe embed for websites/blogs
- ✅ **QR Code**: Scannable QR for mobile access

### 2026-01-12: Metronome Feature (Issue #4)
- ✅ **Metronome**: Full metronome with frequency, solo, count-in, volume, offset click
- ✅ **MetronomeOptionsMenu**: Dropdown component for metronome settings
- ✅ **localStorage persistence**: Settings saved and restored

### 2026-01-12: Amplitude Analytics Integration (Issue #51)
- ✅ **Analytics wrapper**: `src/utils/analytics.ts` with type-safe tracking methods
- ✅ **Conditional loading**: Script only loads on production domain (bahar.co.il)
- ✅ **Zero overhead for OSS**: Generic deployments have no analytics script/tracking
- ✅ **25+ events tracked**: Playback, editing, My Groovies, Library, export/share, UI interactions
- Commits `c6dd181`, `49e91f8` on main

### 2026-01-12: Built-in Groove Library (Issue #15)
- ✅ **Groove Library**: 25 preset patterns in 6 style categories (Rock, Funk, Jazz, Latin, World, Practice)
- ✅ **Library Data**: `src/data/libraryGrooves.json` - URL-encoded grooves bundled with app
- ✅ **Library Hook**: `useGrooveLibrary` - loads, parses, and provides access to library
- ✅ **Library Modal**: Category tabs, groove cards, click to load, "Save Copy" button
- ✅ **My Groovies**: Full save/load/delete functionality with localStorage persistence
- Commit `7227b60` on main

### 2026-01-10: Audio Scheduling Tuning + Note Stacking Bug Fix
- ✅ **Audio scheduling tuning**: Increased scheduleAheadTime to 150ms, interval to 50ms for better timing stability
- ✅ **Note stacking bug fix**: Fixed articulation selection stacking notes instead of replacing
- ✅ **Batch note updates**: Added `onSetNotes` callback for atomic multi-note changes
- PR #30 merged to main (commit `2f9b286`)

### 2026-01-07: Auto Speed Up & A/V Sync Features
- ✅ **Auto Speed Up**: Automatic tempo increase during practice (configurable start/target BPM, increment, loops between)
- ✅ **A/V Sync Offset**: Slider to adjust visual cursor timing (-200ms to +200ms) for latency compensation
- ✅ **Loop Count Indicator**: Shows current loop number during playback
- ✅ **Sheet Music Cursor Fixes**: Cursor now travels full measure using barlines for bounds
- ✅ **NoteIcon Improvements**: Normal notes show filled circle

### 2026-01-06: URL Encoding & Metadata Sharing (Issue #13)
- ✅ **URL sharing**: Groove state encoded in URL params for sharing/bookmarking
- ✅ **Share button**: Copy shareable URL to clipboard with visual feedback
- ✅ **Metadata fields**: Title, Author, Comments added to GrooveData
- ✅ **Metadata editor**: Input fields for groove metadata in UI
- ✅ **Auto URL sync**: URL updates automatically as user edits (debounced)
- ✅ **URL loading**: Opening shared URL restores exact groove state

### 2026-01-06: Sheet Music Enhancements
- ✅ **Multi-line sheet music**: Breaks to new line after 3 measures
- ✅ **Per-line cursor**: Cursor appears only on currently playing line
- ✅ **Hidden empty beats**: Changed visible rests (`z`) to invisible rests (`x`)
- ✅ **Default 1/8 notes**: Changed default division from 16 to 8
- ✅ **Measure numbers**: Added `%%barnumbers 1` directive for measure counting

### 2026-01-06: Issue #3 Complete
- ✅ **Issue #3 closed**: Note Creation and Drum Part Mapping - all requirements met
- ✅ **Keyboard shortcuts footer**: Persistent footer showing all shortcuts (Space, E, ⌘+drag, ⇧+drag, ⌘Z, ⌘⇧Z)
- ✅ **Mac compatibility**: Shift+drag now works for erasing (more reliable than Option+drag)
- Commit: `29f3c28`

### 2026-01-05: Note Creation Feature Enhancements
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

## Current System State (2026-01-12)

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
- Full drum grid with playback controls
- Sheet music display with playback cursor
- **Groove Library** - 25 built-in presets in 6 styles
- **My Groovies** - Save/load/delete user patterns
- Time signature and division controls
- Tempo and swing controls
- Undo/Redo functionality

**Infrastructure**
- React Router for dual-page setup
- TypeScript with strict type checking
- Vite for fast development and builds
- ESLint for code quality
- localStorage for user pattern persistence

### 🚧 In Progress

- Additional drum voices (toms, cymbals, percussion)
- Advanced features (velocity, articulations, multi-measure)
- WAV audio export (MP3 is done)

### 📋 Planned

- MIDI import (export is done)
- Cloud storage and user accounts
- Short links for sharing (Issue #16)

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
