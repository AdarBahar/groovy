# Final Deployment Steps - Complete Fix

## Issues Fixed ✅

1. ✅ **Sound loading 404 errors** - Fixed paths to use `/scribe2/sounds/`
2. ✅ **vite.svg 404 error** - Removed hardcoded favicon reference
3. ✅ **Root .htaccess interference** - Added exclusion guide

---

## Step 1: Update Root .htaccess (REQUIRED)

### Edit `public_html/.htaccess`

**Find line 67:**
```apache
RewriteCond %{REQUEST_URI} !^/MyTrips/
```

**Add this line immediately after it:**
```apache
RewriteCond %{REQUEST_URI} !^/scribe2/
```

**Result (lines 67-68):**
```apache
RewriteCond %{REQUEST_URI} !^/MyTrips/
RewriteCond %{REQUEST_URI} !^/scribe2/
```

### Why This Is Needed
- Prevents root `.htaccess` from interfering with Groovy app
- Gives `/scribe2/.htaccess` full control over routing
- Follows same pattern as `/MyTrips/` exclusion

### How to Do It
See detailed instructions in `ROOT_HTACCESS_CHANGES.md`

---

## Step 2: Upload Updated Files to /scribe2/

### Files to Upload (from `dist/` folder):

1. ✅ **index.html** (no more vite.svg reference)
2. ✅ **assets/index-DX42WnJc.js** (fixed sound paths)

### Upload Locations:
```
dist/index.html → /scribe2/index.html
dist/assets/index-DX42WnJc.js → /scribe2/assets/index-DX42WnJc.js
```

### DO NOT re-upload (unchanged):
- ❌ `sounds/` folder
- ❌ `react-vendor-DUzXPTov.js`
- ❌ `index-BkhCV9qV.css`
- ❌ `.htaccess` (already uploaded)

---

## Step 3: Verify Deployment

### Visit: https://www.bahar.co.il/scribe2/poc

### Browser Console Should Show:
```
Loading sound: /scribe2/sounds/Kick.mp3
Loading sound: /scribe2/sounds/Snare Normal.mp3
Loading sound: /scribe2/sounds/Hi Hat Normal.mp3
✅ Drum samples loaded successfully
```

### Should NOT See:
- ❌ `GET https://www.bahar.co.il/vite.svg 404`
- ❌ `Failed to load resource: the server responded with a status of 404`
- ❌ `❌ Failed to load drum samples: EncodingError`
- ❌ `sounds/Snare%20Normal.mp3 404`
- ❌ `sounds/Hi%20Hat%20Normal.mp3 404`

### Test Functionality:
1. Click play button
2. Drums should play correctly 🥁
3. No console errors

---

## Complete Deployment Checklist

### Root .htaccess Changes:
- [ ] Backup `public_html/.htaccess`
- [ ] Add `RewriteCond %{REQUEST_URI} !^/scribe2/` after line 67
- [ ] Save file
- [ ] Test root site still works (https://www.bahar.co.il/)

### Upload Files:
- [ ] Upload `dist/index.html` to `/scribe2/index.html`
- [ ] Upload `dist/assets/index-DX42WnJc.js` to `/scribe2/assets/index-DX42WnJc.js`

### Verification:
- [ ] Visit https://www.bahar.co.il/scribe2/
- [ ] Visit https://www.bahar.co.il/scribe2/poc
- [ ] Check browser console (no errors)
- [ ] Test playback (sounds play)
- [ ] Test navigation (routes work)

### Clean Up (Optional):
- [ ] Delete old JS file: `/scribe2/assets/index-CTiJC_a9.js`

---

## Quick Upload Commands

### Using SCP:
```bash
# Upload index.html
scp dist/index.html user@bahar.co.il:/path/to/www/scribe2/

# Upload new JavaScript
scp dist/assets/index-DX42WnJc.js user@bahar.co.il:/path/to/www/scribe2/assets/
```

### Using FTP/SFTP:
1. Connect to server
2. Navigate to `/scribe2/`
3. Upload `index.html`
4. Navigate to `/scribe2/assets/`
5. Upload `index-DX42WnJc.js`

---

## What Each Fix Does

### Fix 1: Sound Paths
**Before:**
```javascript
const response = await fetch(`/sounds/${fileName}`);
// ❌ Tried: /sounds/Kick.mp3 (404)
```

**After:**
```javascript
const basePath = import.meta.env.BASE_URL || '/';
const soundPath = `${basePath}sounds/${fileName}`;
const response = await fetch(soundPath);
// ✅ Loads: /scribe2/sounds/Kick.mp3 (works!)
```

### Fix 2: vite.svg
**Before:**
```html
<link rel="icon" type="image/svg+xml" href="/vite.svg" />
<!-- ❌ Tried: /vite.svg (404) -->
```

**After:**
```html
<!-- ✅ No favicon link (no 404 error) -->
```

### Fix 3: Root .htaccess
**Before:**
```apache
# Root .htaccess might interfere with /scribe2/ routing
```

**After:**
```apache
RewriteCond %{REQUEST_URI} !^/scribe2/
# ✅ Root .htaccess ignores /scribe2/
```

---

## Troubleshooting

### Still getting vite.svg 404?
- Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
- Verify `index.html` was uploaded

### Still getting sound 404s?
- Verify `sounds/` folder exists at `/scribe2/sounds/`
- Check file names are exact (case-sensitive)
- Verify `.htaccess` is in `/scribe2/` directory

### Root site broken after .htaccess change?
- Restore backup: `cp public_html/.htaccess.backup public_html/.htaccess`
- Double-check you added the line in the correct location

### Routes not working (404 on /poc)?
- Verify `/scribe2/.htaccess` is uploaded
- Check Apache `mod_rewrite` is enabled
- Verify root `.htaccess` has the `/scribe2/` exclusion

---

## Summary

**3 Changes Required:**

1. **Root .htaccess**: Add 1 line to exclude `/scribe2/`
2. **Upload index.html**: Fixes vite.svg 404
3. **Upload index-DX42WnJc.js**: Fixes sound loading

**Expected Result:**
- ✅ No console errors
- ✅ Sounds load and play correctly
- ✅ All routes work
- ✅ Production-ready deployment

---

**Build Date**: 2026-01-05  
**Commit**: c8d8a80  
**Files**: index.html + index-DX42WnJc.js

