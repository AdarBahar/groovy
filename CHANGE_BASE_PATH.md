# How to Change the Deployment Base Path

## Overview
The app is currently configured to deploy to `/groovy/` subdirectory. This guide shows how to change it to a different path.

---

## Quick Change

### Option 1: Use Environment Variable (Recommended)

Set the `VITE_BASE_PATH` environment variable when building:

```bash
# Deploy to root
VITE_BASE_PATH=/ npm run build:prod

# Deploy to custom subdirectory
VITE_BASE_PATH=/my-app/ npm run build:prod
```

### Option 2: Edit `vite.config.ts`

**Find this line (around line 18):**
```typescript
const PRODUCTION_BASE_PATH = process.env.VITE_BASE_PATH || '/groovy/';
```

**Change the default to your desired path:**

### Examples:

#### Deploy to Root (/)
```typescript
const PRODUCTION_BASE_PATH = process.env.VITE_BASE_PATH || '/';
```

#### Deploy to Different Subdirectory
```typescript
const PRODUCTION_BASE_PATH = process.env.VITE_BASE_PATH || '/my-app/';
```

```typescript
const PRODUCTION_BASE_PATH = process.env.VITE_BASE_PATH || '/drum-editor/';
```

**Important:** The path must:
- Start with `/`
- End with `/`
- Use lowercase (recommended)
- Match your server directory structure

---

## After Changing the Path

### 1. Rebuild the App
```bash
npm run build:prod
```

### 2. Update .htaccess (if needed)

If you changed to a different subdirectory, you may need to update:

#### Root .htaccess
Add exclusion for your new path (same as we did for `/groovy/`):

**In `public_html/.htaccess`, add:**
```apache
RewriteCond %{REQUEST_URI} !^/your-new-path/
```

#### Subdirectory .htaccess
Copy `.htaccess` to your new subdirectory:
```bash
cp .htaccess /path/to/www/your-new-path/.htaccess
```

### 3. Upload Files
Upload the `dist/` folder contents to your new path:
```
dist/ → /your-new-path/
```

---

## Examples

### Example 1: Deploy to Root

**Change:**
```typescript
const PRODUCTION_BASE_PATH = '/';
```

**Build:**
```bash
npm run build:prod
```

**Upload:**
```
dist/ → /public_html/
```

**Access:**
```
https://www.bahar.co.il/
```

**No .htaccess changes needed** (already at root)

---

### Example 2: Deploy to /groovy/

**Change:**
```typescript
const PRODUCTION_BASE_PATH = '/groovy/';
```

**Build:**
```bash
npm run build:prod
```

**Update root .htaccess:**
```apache
# Add this line after line 67 in public_html/.htaccess
RewriteCond %{REQUEST_URI} !^/groovy/
```

**Upload:**
```
dist/ → /public_html/groovy/
.htaccess → /public_html/groovy/.htaccess
```

**Access:**
```
https://www.bahar.co.il/groovy/
https://www.bahar.co.il/groovy/poc
```

---

### Example 3: Deploy to Multiple Environments

You can maintain different configs for different environments:

**Development:**
```typescript
// Always uses '/' automatically
```

**Staging:**
```bash
VITE_BASE_PATH=/groovy-staging/ npm run build:prod
```

**Production:**
```bash
npm run build:prod  # Uses default /groovy/
```

---

## How It Works

The `PRODUCTION_BASE_PATH` constant is used by:

1. **Vite** - Sets the base path for all assets (JS, CSS, images)
2. **React Router** - Sets the `basename` for routing
3. **DrumSynth** - Loads sounds from correct path

All three automatically use `import.meta.env.BASE_URL`, which Vite sets based on the config.

### In Development:
```typescript
import.meta.env.BASE_URL === '/'
```

### In Production:
```typescript
import.meta.env.BASE_URL === PRODUCTION_BASE_PATH
// e.g., '/scribe2/'
```

---

## Verification

After changing and rebuilding, verify:

### 1. Check dist/index.html
```html
<!-- Should reference correct base path -->
<script src="/your-path/assets/index-[hash].js"></script>
```

### 2. Check Browser Console
```
Loading sound: /your-path/sounds/Kick.mp3
✅ Drum samples loaded successfully
```

### 3. Check URLs
```
https://www.bahar.co.il/your-path/
https://www.bahar.co.il/your-path/poc
```

URLs should stay in your subdirectory, not change to root.

---

## Troubleshooting

### Assets not loading (404)
- Verify `PRODUCTION_BASE_PATH` matches your server directory
- Rebuild: `npm run build:prod`
- Check `dist/index.html` has correct paths

### URLs changing to root
- Verify you rebuilt after changing the config
- Check browser cache (hard refresh: Ctrl+Shift+R)

### Sounds not loading
- Verify `sounds/` folder is in correct location
- Check browser console for actual path being requested

---

## Current Configuration

**Current Base Path:** `/groovy/`
**Server Location:** `www.bahar.co.il/groovy/`
**Access URLs:**
- https://www.bahar.co.il/groovy/
- https://www.bahar.co.il/groovy/poc

To change, use `VITE_BASE_PATH` env var or edit `vite.config.ts` and rebuild.

---

## Legacy Redirects

Old URLs are automatically redirected to the new location:
- `www.bahar.co.il/Scribe/` → `www.bahar.co.il/groovy/` (original GrooveScribe)
- `www.bahar.co.il/scribe2/` → `www.bahar.co.il/groovy/` (staging environment)

---

## Summary

**To change deployment path:**

1. Set `VITE_BASE_PATH` env var (or edit `vite.config.ts`)
2. Run `npm run build:prod`
3. Update root `.htaccess` (add exclusion if needed)
4. Upload `dist/` to new location
5. Copy `.htaccess` to new location
6. Test at new URL

**That's it!** The app will automatically use the new base path for all assets, routing, and sound loading.

