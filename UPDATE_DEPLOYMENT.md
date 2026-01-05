# Update Deployment - Sound Loading Fix

## Issue Fixed
The app was loading sounds from `/sounds/` instead of `/scribe2/sounds/`, causing 404 errors.

## What Changed
- Updated `src/core/DrumSynth.ts` to use `import.meta.env.BASE_URL`
- Sounds now load from correct path: `/scribe2/sounds/`
- Added better error logging

## Files to Re-Upload

You only need to upload the **updated JavaScript file**:

### From `dist/assets/` folder:
- ✅ `index-DX42WnJc.js` (NEW - replaces `index-CTiJC_a9.js`)

**Optional** (for completeness):
- `index.html` (updated to reference new JS file)

### DO NOT re-upload:
- ❌ `sounds/` folder (no changes)
- ❌ `react-vendor-DUzXPTov.js` (no changes)
- ❌ `index-BkhCV9qV.css` (no changes)
- ❌ `.htaccess` (no changes)

## Quick Update Steps

### Option 1: Upload Only Changed File (Fastest)
```bash
# Upload just the new JavaScript file
scp dist/assets/index-DX42WnJc.js user@bahar.co.il:/path/to/www/scribe2/assets/

# Upload updated index.html
scp dist/index.html user@bahar.co.il:/path/to/www/scribe2/
```

### Option 2: Upload All Assets (Safest)
```bash
# Upload entire assets folder
scp -r dist/assets/* user@bahar.co.il:/path/to/www/scribe2/assets/

# Upload updated index.html
scp dist/index.html user@bahar.co.il:/path/to/www/scribe2/
```

### Option 3: FTP/SFTP
1. Connect to server
2. Navigate to `/scribe2/assets/`
3. Upload `index-DX42WnJc.js`
4. Navigate to `/scribe2/`
5. Upload `index.html`

## Verification

After uploading, visit:
- https://www.bahar.co.il/scribe2/poc

**Check browser console:**
- ✅ Should see: "Loading sound: /scribe2/sounds/Kick.mp3"
- ✅ Should see: "Loading sound: /scribe2/sounds/Snare Normal.mp3"
- ✅ Should see: "Loading sound: /scribe2/sounds/Hi Hat Normal.mp3"
- ✅ Should see: "✅ Drum samples loaded successfully"
- ❌ Should NOT see: "❌ Failed to load drum samples"
- ❌ Should NOT see: 404 errors for sound files

**Test playback:**
- Click play button
- Sounds should play correctly

## What the Fix Does

**Before:**
```javascript
const response = await fetch(`/sounds/${fileName}`);
// Tried to load from: /sounds/Kick.mp3 (404 - wrong path)
```

**After:**
```javascript
const basePath = import.meta.env.BASE_URL || '/';
const soundPath = `${basePath}sounds/${fileName}`;
const response = await fetch(soundPath);
// Loads from: /scribe2/sounds/Kick.mp3 (correct path)
```

## Troubleshooting

### Still getting 404 errors?
1. Verify `sounds/` folder is uploaded to `/scribe2/sounds/`
2. Check file names match exactly (case-sensitive):
   - `Kick.mp3`
   - `Snare Normal.mp3`
   - `Hi Hat Normal.mp3`
3. Check browser console for exact path being requested

### Sounds still not playing?
1. Check browser console for errors
2. Verify HTTPS is being used (Web Audio API requires secure context)
3. Check MIME types: `.mp3` should be `audio/mpeg`
4. Try clicking play button (Web Audio requires user interaction)

### Old JavaScript file still loading?
1. Clear browser cache (Ctrl+Shift+R or Cmd+Shift+R)
2. Verify `index.html` was updated on server
3. Check that `index.html` references `index-DX42WnJc.js` (not `index-CTiJC_a9.js`)

## Clean Up (Optional)

After verifying the new version works, you can delete the old JavaScript file:
- Delete: `/scribe2/assets/index-CTiJC_a9.js` (old version)

This is optional - the old file won't be loaded anymore since `index.html` now references the new file.

---

**Build Date**: 2026-01-05  
**Commit**: a018dba  
**New JS File**: index-DX42WnJc.js

