# Technology Stack

**Analysis Date:** 2026-05-14

## Languages

**Primary:**
- TypeScript ~5.6.2 - Full application codebase, strict mode enabled
- JSX (React) - UI components and pages

**Secondary:**
- JavaScript (ES2020) - Build configuration and utilities

## Runtime

**Environment:**
- Node.js - Build and development (no .nvmrc specified, uses system Node)
- Browser runtime - Web Audio API, Web MIDI API, localStorage

**Package Manager:**
- npm - Lockfile present (`package-lock.json`)

## Frameworks

**Core:**
- React 18.3.1 - UI framework and component library
- React Router DOM 7.12.0 - Client-side routing
- React DOM 18.3.1 - React rendering engine

**UI Component System:**
- Radix UI (multiple components) - Unstyled, accessible primitives
  - @radix-ui/react-dialog 1.1.15 - Modal dialogs
  - @radix-ui/react-slider 1.3.6 - Slider inputs
  - @radix-ui/react-tooltip 1.2.8 - Tooltips
  - @radix-ui/react-collapsible 1.1.12 - Collapsible sections
  - @radix-ui/react-slot 1.2.4 - Slot composition

**Styling:**
- Tailwind CSS 4.1.18 - Utility-first CSS framework
- @tailwindcss/vite 4.1.18 - Vite plugin for Tailwind
- class-variance-authority 0.7.1 - Component variant management
- tailwind-merge 3.4.0 - Merge Tailwind classes with conflicts
- tw-animate-css 1.4.0 - Animation utilities
- clsx 2.1.1 - Conditional className joining

**Testing:**
- Vitest 4.0.16 - Unit test framework (React, Node environment)
- Configuration: `vitest.config.ts`

**Build/Dev:**
- Vite 6.0.5 - Build tool and dev server
  - Config: `vite.config.ts`
  - Port: 5175 (dev)
  - Output: `dist/` directory
- @vitejs/plugin-react 4.3.4 - JSX support for Vite
- TypeScript 5.6.2 - Compilation via `tsc -b`
- rollup-plugin-visualizer 6.0.5 - Bundle analysis (stats.html)

**Code Quality:**
- ESLint 9.17.0 - Linting
  - Config: `eslint.config.js`
  - Plugins:
    - typescript-eslint 8.18.2 - TypeScript linting rules
    - eslint-plugin-react-hooks 5.0.0 - React hooks rules
    - eslint-plugin-react-refresh 0.4.16 - Fast refresh rules
  - Globals: 15.14.0

**Export/Generation (Lazy-Loaded):**
- jspdf 4.0.0 - PDF generation (dynamically imported)
- midi-writer-js 3.1.1 - MIDI file export (dynamically imported)
- qrcode 1.5.4 - QR code generation (dynamically imported)
- qrcode.react 4.2.0 - React QR code component
- @breezystack/lamejs 1.2.7 - MP3 encoding (dynamically imported)
- abcjs 6.6.0 - ABC notation rendering

**Data/Encoding:**
- zod 4.3.5 - Schema validation and parsing
- lz-string 1.5.0 - LZ compression for URL encoding
- dompurify 3.3.1 - HTML sanitization

**Icons & UI:**
- lucide-react 0.562.0 - Icon library

## Key Dependencies

**Critical:**
- React ecosystem - Core UI framework
- Vite - Fast dev server and production builds
- Tailwind CSS - Styling and responsive design
- TypeScript - Type safety across codebase

**Infrastructure:**
- Radix UI - Accessible component primitives
- zod - Type-safe validation for data structures
- dompurify - HTML sanitization for ShareModal and display
- lz-string - URL compression for groove data encoding

**Audio:**
- Web Audio API (built-in) - Audio playback and synthesis
- Web MIDI API (built-in) - MIDI device input

## Configuration

**Environment:**
- Environment variables via Vite: `import.meta.env.VITE_*`
- Loaded from `.env.local` (not committed)
- See `.env.example` for all available variables

**Build:**
- TypeScript config: `tsconfig.json`
  - Target: ES2020
  - Module: ESNext
  - Strict mode enabled
  - JSX: react-jsx
- Vite config: `vite.config.ts`
  - Minify: esbuild
  - Sourcemaps: disabled (production)
  - Chunk size warning: 810 KB
  - Manual chunk splitting for vendor libraries
- ESLint config: `eslint.config.js`
  - Rules: strict, no unused variables, no fallthrough switches

## Platform Requirements

**Development:**
- Node.js (recent version, LTS recommended)
- npm 6+ (or compatible package manager)
- Modern browser with Web Audio API and Web MIDI API support (or localhost with fake MIDI)

**Production:**
- Static file hosting (Nginx, Apache, S3, etc.)
- Base path configurable via `VITE_BASE_PATH` env variable
- Default base path: `/groovy/`
- Requires HTML5 history fallback (redirect all routes to index.html)

**Browser Support:**
- ES2020 features required
- Web Audio API for playback
- Web MIDI API for device input (optional, with keyboard fallback on localhost)
- localStorage for groove storage

---

*Stack analysis: 2026-05-14*
