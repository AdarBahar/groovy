# How to Change the Deployment Base Path

## Overview
The app is currently configured to deploy to `/scribe2/` subdirectory. This guide shows how to change it to a different path.

---

## Quick Change

### Edit `vite.config.ts`

**Find this line (around line 13):**
```typescript
const PRODUCTION_BASE_PATH = '/scribe2/';
```

**Change it to your desired path:**

### Examples:

#### Deploy to Root (/)
```typescript
const PRODUCTION_BASE_PATH = '/';
```

#### Deploy to Different Subdirectory
```typescript
const PRODUCTION_BASE_PATH = '/my-app/';
```

```typescript
const PRODUCTION_BASE_PATH = '/groovy/';
```

```typescript
const PRODUCTION_BASE_PATH = '/drum-editor/';
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
Add exclusion for your new path (same as we did for `/scribe2/`):

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
```typescript
const PRODUCTION_BASE_PATH = '/groovy-staging/';
```

**Production:**
```typescript
const PRODUCTION_BASE_PATH = '/scribe2/';
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

**Current Base Path:** `/scribe2/`  
**Server Location:** `www.bahar.co.il/scribe2/`  
**Access URLs:**
- https://www.bahar.co.il/scribe2/
- https://www.bahar.co.il/scribe2/poc

To change, edit `PRODUCTION_BASE_PATH` in `vite.config.ts` and rebuild.

---

## Summary

**To change deployment path:**

1. Edit `vite.config.ts` → Change `PRODUCTION_BASE_PATH`
2. Run `npm run build:prod`
3. Update root `.htaccess` (add exclusion if needed)
4. Upload `dist/` to new location
5. Copy `.htaccess` to new location
6. Test at new URL

**That's it!** The app will automatically use the new base path for all assets, routing, and sound loading.

