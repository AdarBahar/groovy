# Deployment

Build, deploy, and run instructions for Groovy.

---

## Local Development

### Prerequisites
- Node.js 18+ (recommended: 20+)
- npm 9+ (comes with Node.js)

### Installation
```bash
cd /Users/adar.bahar/Code/groovy
npm install
```

### Development Server
```bash
npm run dev
```
- **URL**: http://localhost:5174
- **POC Testing**: http://localhost:5174/poc
- **Production UI**: http://localhost:5174/
- **Hot Module Replacement (HMR)**: Enabled

### Type Checking
```bash
npm run type-check
```
Runs TypeScript compiler in check mode (no output files).

### Linting
```bash
npm run lint
```
Runs ESLint on all source files.

### Build for Production
```bash
# Development build (base path: '/')
npm run build

# Production build (base path: '/groovy/')
npm run build:prod
```
- Runs TypeScript compiler (`tsc -b`)
- Builds optimized production bundle with Vite
- Output: `dist/` directory
- Production build uses `/groovy/` base path (configurable via `VITE_BASE_PATH` env var)

### Preview Production Build
```bash
# Preview development build
npm run preview

# Preview production build (with /groovy/ base path)
npm run preview:prod
```
Serves the production build locally for testing at http://localhost:4173/groovy/

---

## Environment Variables

### Current (None)
No environment variables required for local development.

### Future Considerations
- `VITE_API_URL` - Backend API URL (if/when backend is added)
- `VITE_FIREBASE_CONFIG` - Firebase config (if cloud storage is added)
- `VITE_SENTRY_DSN` - Error tracking (if Sentry is added)

**Note**: Vite requires `VITE_` prefix for env vars to be exposed to client code.

---

## Production Deployment

### Current Deployment: www.bahar.co.il/groovy/

**Method**: Manual upload to Apache server
**Base Path**: `/groovy/`
**Documentation**: See `DEPLOYMENT.md` in project root

#### Quick Deploy
```bash
# 1. Build for production
npm run build:prod

# 2. Test locally
npm run preview:prod
# Visit http://localhost:4173/groovy/

# 3. Upload dist/ contents to server
# Upload all files from dist/ to /groovy/ directory
# Include .htaccess file for Apache configuration
```

**Build Output**:
- Total size: ~480KB code + 272KB sounds = ~752KB total
- Sounds: 28 MP3 files (272KB)
- Assets: Minified JS and CSS with content hashes
- Manual chunks: React vendor code separated for better caching (~178KB)
- Main app code: ~16KB
- CSS: ~10KB

**Configuration**:
- Base path configured in `vite.config.ts` via `VITE_BASE_PATH` env var
- Current default: `/groovy/`
- To change: Set `VITE_BASE_PATH` env var or edit default in `vite.config.ts`
- See `CHANGE_BASE_PATH.md` for detailed instructions

**Server Requirements**:
- Apache with `mod_rewrite` enabled
- Upload `.htaccess` to `/groovy/` directory for React Router support
- Add exclusion to root `.htaccess`: `RewriteCond %{REQUEST_URI} !^/groovy/`
- See `ROOT_HTACCESS_CHANGES.md` for root .htaccess modifications

**Legacy Redirects**:
- `/Scribe/` → `/groovy/` (original GrooveScribe)
- `/scribe2/` → `/groovy/` (staging environment)

**Deployment Documentation** (in project root):
- `DEPLOYMENT.md` - Comprehensive deployment guide
- `CHANGE_BASE_PATH.md` - How to change deployment subdirectory

---

### Option 1: Static Hosting (Alternative)

**Platforms**: Vercel, Netlify, GitHub Pages, Cloudflare Pages

#### Vercel (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

**Configuration** (`vercel.json`):
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

#### Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod
```

**Configuration** (`netlify.toml`):
```toml
[build]
  command = "npm run build"
  publish = "dist"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

#### GitHub Pages
```bash
# Build
npm run build

# Deploy (manual)
# 1. Push dist/ to gh-pages branch
# 2. Enable GitHub Pages in repo settings
```

**Note**: May need to set `base` in `vite.config.ts` if deploying to subdirectory:
```typescript
export default defineConfig({
  base: '/groovy/', // For https://username.github.io/groovy/
  // ...
});
```

---

## Build Output

### Production Build Structure
```
dist/
├── index.html
├── assets/
│   ├── index-[hash].js
│   ├── index-[hash].css
│   └── ...
└── sounds/
    ├── Kick.mp3
    ├── Snare Normal.mp3
    ├── Hi Hat Normal.mp3
    └── ... (30 files)
```

### Build Optimizations
- **Code Splitting**: Automatic via Vite
- **Minification**: JavaScript and CSS minified
- **Tree Shaking**: Unused code removed
- **Asset Hashing**: Cache busting with content hashes

---

## Rollback Procedure

### If Production Build Fails
1. Check build logs for errors
2. Run `npm run type-check` locally
3. Run `npm run lint` locally
4. Fix errors and rebuild
5. Test with `npm run preview` before deploying

### If Deployed Build Has Issues
1. Revert to previous commit: `git revert HEAD`
2. Rebuild: `npm run build`
3. Redeploy

### If Core Logic Breaks
1. Test on POC page (`/poc`) to isolate issue
2. Check browser console for errors
3. Verify drum samples are loading (check Network tab)
4. Check Web Audio API compatibility

---

## Performance Monitoring

### Metrics to Track (Future)
- **Load Time**: Time to interactive
- **Audio Latency**: Time from click to sound
- **Bundle Size**: Keep under 500KB (currently ~200KB)
- **Sample Load Time**: All 30 samples should load in <2s

### Tools
- **Lighthouse**: Built into Chrome DevTools
- **Web Vitals**: Core Web Vitals monitoring
- **Sentry**: Error tracking (if added)

---

## Troubleshooting

### Dev Server Won't Start
- Check if port 5174 is in use: `lsof -i :5174`
- Kill process: `kill -9 <PID>`
- Or use different port: `npm run dev -- --port 3000`

### Type Errors
- Run `npm run type-check` to see all errors
- Check `tsconfig.json` for strict settings
- Ensure all dependencies have type definitions

### Build Fails
- Clear node_modules: `rm -rf node_modules package-lock.json && npm install`
- Clear Vite cache: `rm -rf node_modules/.vite`
- Check Node.js version: `node -v` (should be 18+)

### Sounds Not Loading
- Check `/public/sounds/` directory exists
- Verify sample files are present (30 files)
- Check browser console for 404 errors
- Ensure Web Audio API is supported (all modern browsers)

### React Router 404s in Production
- Ensure server redirects all routes to `index.html`
- Check `netlify.toml` or `vercel.json` configuration
- For GitHub Pages, may need to use HashRouter instead of BrowserRouter

---

## CI/CD (Future)

### GitHub Actions Workflow (Suggested)
```yaml
name: Build and Deploy

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm ci
      - run: npm run type-check
      - run: npm run lint
      - run: npm run build
      - run: npm run preview & sleep 5 && curl http://localhost:4173
```

---

## Security Notes

### Current
- No authentication/authorization (static site)
- No backend API
- No user data storage
- No sensitive environment variables

### Future Considerations
- If adding user accounts: Use Firebase Auth or Auth0
- If adding backend: Implement CORS, rate limiting, input validation
- If storing patterns: Encrypt sensitive data, use HTTPS only
- See `.codeagent/current/security.md` for detailed security notes

---

## Dependencies

### Production Dependencies
- `react@^18.3.1` - UI framework
- `react-dom@^18.3.1` - React DOM renderer
- `react-router-dom@^7.11.0` - Client-side routing

### Dev Dependencies
- `@vitejs/plugin-react@^4.3.4` - Vite React plugin
- `typescript@~5.6.2` - TypeScript compiler
- `vite@^6.0.5` - Build tool
- `eslint@^9.17.0` - Linter
- `typescript-eslint@^8.18.2` - TypeScript ESLint plugin

### Updating Dependencies
```bash
# Check for updates
npm outdated

# Update all (careful!)
npm update

# Update specific package
npm install react@latest
```

---

## Monitoring & Logs

### Browser Console
- Check for errors: `console.error`
- Check for warnings: `console.warn`
- DrumSynth logs: "✅ Drum samples loaded successfully" or "❌ Failed to load drum samples"

### Network Tab
- Verify all 30 drum samples load (200 status)
- Check bundle size (should be <500KB total)

---

## Backup & Recovery

### Git Repository
- **Remote**: https://github.com/AdarBahar/groovy
- **Local**: `/Users/adar.bahar/Code/groovy`

### Backup Strategy
- All code is in Git (no local-only changes)
- Push to GitHub regularly
- Tag releases: `git tag v0.1.0 && git push --tags`

### Recovery
```bash
# Clone fresh copy
git clone https://github.com/AdarBahar/groovy.git
cd groovy
npm install
npm run dev
```

---

## Related Documentation

- **README.md** - Project overview
- **GETTING_STARTED.md** - Quick start guide
- **DUAL_PAGE_SETUP.md** - Dual-page architecture
- **.codeagent/current/project_context.md** - Current system state
- **.codeagent/current/project_history.md** - Change history
