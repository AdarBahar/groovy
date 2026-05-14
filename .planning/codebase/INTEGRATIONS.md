# External Integrations

**Analysis Date:** 2026-05-14

## APIs & External Services

**URL Shortener Service:**
- Service: Custom URL shortener API (go.bahar.co.il)
  - SDK/Client: Custom fetch-based HTTP client in `src/services/urlShortener.ts`
  - Purpose: Generate shareable short URLs for groove links
  - Auth: Bearer token + X-API-Key header
  - Config vars: `VITE_URL_SHORTENER_API`, `VITE_URL_SHORTENER_KEY`
  - Error handling: Custom `ShortenerError` class with typed error categories (unauthorized, rate_limited, network, unknown)
  - Endpoint: `POST /api/shorten` - accepts `{url: string}`, returns `{success: boolean, data?: {shortUrl, shortCode, originalUrl, createdAt, expiresAt?}}`

**Analytics Service:**
- Service: Bahar Analytics (custom domain-based tracking)
  - Endpoint: `https://www.bahar.co.il/assets/universal-analytics.js`
  - Purpose: Track user interactions, feature usage, MIDI events, exports
  - Integration: Dynamic script injection via `src/utils/analytics.ts`
  - Domain-gated: Only loads on `bahar.co.il` (configured via `VITE_ANALYTICS_DOMAIN`, `VITE_ANALYTICS_SCRIPT_URL`)
  - Events tracked: Playback, editing, library access, groove saving/loading, sharing, exports, MIDI device connection, timing accuracy
  - Global interface: `window.BaharAnalytics` (type-safe wrapper provided)

## Data Storage

**Primary Storage:**
- localStorage - Browser local storage only, no backend database
  - Groove library: `groovy-my-grooves` key - stores SavedGroove array with metadata and URL-encoded data
  - MIDI configuration: `groovy-midi-config` key - persistent MIDI settings and latency offsets
  - Latency calibration: `groovy_midi_latency_config` key - per-device latency compensation stored as Record<deviceId, config>
  - Theme preference: Managed by `src/contexts/ThemeContext.tsx`
  - Quota management: Safe storage wrapper in `src/utils/safeStorage.ts` with cleanup fallback

**File Storage:**
- Local filesystem only - No cloud storage integration
- Export destinations: Blob downloads to user's download folder

**Caching:**
- No external caching service
- In-memory caching of audio samples in `DrumSynth` class (AudioBuffer cache)

## Audio Hardware

**Web Audio API:**
- AudioContext for sample playback
- Audio samples loaded from public assets (MP3 format)
- Master gain node for volume control
- Sample source: `src/assets/samples/` directory
- Lazy loading of audio context (created on demand)

**MIDI Input:**
- Web MIDI API via `src/midi/MIDIAccess.ts`
- Supports hardware MIDI devices (drums, keyboards, controllers)
- Fallback: Keyboard input simulator on localhost (fake MIDI device for testing)
- Per-device configuration storage with latency compensation
- MIDI message filtering and validation in `src/midi/` modules:
  - Velocity thresholding (`VelocityFilter.ts`)
  - Double-trigger suppression (`DoubleTriggerFilter.ts`)
  - Latency compensation (`latencyStorage.ts`)

## Authentication & Identity

**Auth Provider:**
- None - Application is client-side only
- No user accounts or login system
- No persistent cloud identity

**Public Access:**
- All grooves shareable via URL-encoded state
- QR codes generated client-side
- Embed codes generated client-side

## Monitoring & Observability

**Error Tracking:**
- None - No external error tracking service
- Custom ErrorBoundary component in `src/components/ErrorBoundary.tsx`
- Errors logged to `window.BaharAnalytics?.trackError()` if analytics enabled
- Local logging utility: `src/utils/logger.ts`

**Logs:**
- Client-side console logging only
- Analytics events for user tracking (not error logs)
- No server-side log aggregation

## CI/CD & Deployment

**Hosting:**
- Static file hosting required (tested on Nginx, Apache)
- Deployment: Build with `npm run build:prod`, upload `dist/` contents to web server
- Base path: Configurable via `VITE_BASE_PATH` environment variable
- History fallback: Server must redirect all routes to index.html

**CI Pipeline:**
- GitHub Actions example in `DEPLOYMENT.md`
- Build: `tsc -b && vite build`
- No automated testing in pipeline (vitest configured but no CI runner)

**Build Artifacts:**
- Main bundle: ~804 KB (esbuild minified, no gzip)
- Code splitting: Vendor chunks separated (react, radix, validation, export libraries)
- Source maps: Disabled in production
- Bundle analysis: `npm run build:analyze` generates `dist/stats.html`

## Environment Configuration

**Required Environment Variables:**

| Variable | Purpose | Example |
|----------|---------|---------|
| `VITE_BASE_PATH` | Deployment base path | `/groovy/` or `/` |
| `VITE_URL_SHORTENER_API` | URL shortener API base URL | `https://go.bahar.co.il` |
| `VITE_URL_SHORTENER_KEY` | URL shortener API key | `sk_live_...` |
| `VITE_ANALYTICS_DOMAIN` | Domain for analytics activation | `bahar.co.il` |
| `VITE_ANALYTICS_SCRIPT_URL` | Analytics script URL | `https://www.bahar.co.il/assets/universal-analytics.js` |

**Optional/Development:**
- `NODE_ENV` - Set to `production` for build:prod script
- All other environment variables fall back to defaults if not set

**Secrets Location:**
- `.env.local` - Git-ignored file for local development (never committed)
- CI/CD secrets: Set as GitHub Actions secrets or environment variables in deployment platform
- No secrets should be hardcoded in source files

## Webhooks & Callbacks

**Incoming:**
- None - Application does not expose any webhook endpoints

**Outgoing:**
- None - Application does not make outgoing webhook calls
- URL shortener API is synchronous REST (not webhooks)

## Third-Party Integrations

**Sharing Platforms (Client-Side):**
- Twitter - Direct share links generated, opened in browser
- Facebook - Direct share links generated, opened in browser
- Reddit - Direct share links generated, opened in browser
- Email - mailto: links with pre-filled subject/body
- Embed codes - Self-hosted iframe embed snippets generated client-side

**Export Formats (All Client-Side):**
- PDF - Generated via jsPDF (dynamically imported)
- PNG/SVG - Rendered via canvas/SVG, no server involvement
- MIDI - Generated via midi-writer-js (dynamically imported)
- MP3 - Encoded via @breezystack/lamejs (dynamically imported)
- JSON - Direct object serialization
- QR codes - Generated via qrcode.js (dynamically imported)

---

*Integration audit: 2026-05-14*
