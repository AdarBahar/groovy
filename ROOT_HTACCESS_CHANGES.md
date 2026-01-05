# Root .htaccess Changes for /scribe2/

## Problem
The root `public_html/.htaccess` file is interfering with the `/scribe2/` subdirectory, causing:
1. ✅ FIXED: `vite.svg` 404 error (removed from index.html)
2. Potential routing conflicts with root SPA rules

## Solution
Add `/scribe2/` exclusion to the root `.htaccess` file so it doesn't interfere with the Groovy app.

---

## Changes to Make in `public_html/.htaccess`

### Location: Line 68 (after line 67)

**Find this section** (around line 62-71):
```apache
# === SPA fallback for root React app (tightened) ===
# Serve index.html only for client-side routes (no extension), not for missing assets.
# Do not touch images/assets/api/MyTrips/fantasybroker-staging or the 404 page itself.
RewriteCond %{REQUEST_URI} !^/images/
RewriteCond %{REQUEST_URI} !^/assets/
RewriteCond %{REQUEST_URI} !^/api/
RewriteCond %{REQUEST_URI} !^/MyTrips/
RewriteCond %{REQUEST_URI} !^/fantasybroker-staging/
RewriteCond %{REQUEST_URI} !^/fantasybroker/
RewriteCond %{REQUEST_URI} !^/404\.html$
```

**Add this line after line 67** (after `!^/MyTrips/`):
```apache
RewriteCond %{REQUEST_URI} !^/scribe2/
```

### Complete Updated Section (lines 62-76):
```apache
# === SPA fallback for root React app (tightened) ===
# Serve index.html only for client-side routes (no extension), not for missing assets.
# Do not touch images/assets/api/MyTrips/fantasybroker-staging/scribe2 or the 404 page itself.
RewriteCond %{REQUEST_URI} !^/images/
RewriteCond %{REQUEST_URI} !^/assets/
RewriteCond %{REQUEST_URI} !^/api/
RewriteCond %{REQUEST_URI} !^/MyTrips/
RewriteCond %{REQUEST_URI} !^/scribe2/
RewriteCond %{REQUEST_URI} !^/fantasybroker-staging/
RewriteCond %{REQUEST_URI} !^/fantasybroker/
RewriteCond %{REQUEST_URI} !^/404\.html$
# If the URL contains a dot, treat it as an asset -> do NOT rewrite (allows proper 404)
RewriteCond %{REQUEST_URI} !\.[^/]+$
# Only rewrite when the client accepts HTML (avoid JSON/XHR/etc.)
RewriteCond %{HTTP_ACCEPT} "(^|,)\s*text/html\s*(;|,|$)" [NC]
# RewriteRule ^ /index.html [L]
```

---

## What This Does

**Before:**
- Root `.htaccess` might try to handle `/scribe2/` routes
- Could interfere with `/scribe2/.htaccess` rules
- Potential conflicts with React Router in Groovy app

**After:**
- Root `.htaccess` ignores anything under `/scribe2/`
- `/scribe2/.htaccess` has full control over Groovy app routing
- No conflicts between root SPA and Groovy SPA

---

## How to Apply

### Option 1: cPanel File Manager
1. Log in to cPanel
2. Open File Manager
3. Navigate to `public_html/`
4. Right-click `.htaccess` → Edit
5. Find line 67: `RewriteCond %{REQUEST_URI} !^/MyTrips/`
6. Add new line after it: `RewriteCond %{REQUEST_URI} !^/scribe2/`
7. Save file

### Option 2: FTP/SFTP
1. Download `public_html/.htaccess`
2. Edit locally
3. Add the line as shown above
4. Upload back to server

### Option 3: SSH
```bash
# Backup first
cp public_html/.htaccess public_html/.htaccess.backup

# Edit with nano or vi
nano public_html/.htaccess

# Add the line after line 67
# Save and exit
```

---

## Verification

After making the change:

1. **Test root site** - Make sure your main site still works
   - Visit https://www.bahar.co.il/
   - Test navigation
   - Check that nothing broke

2. **Test Groovy** - Verify /scribe2/ works correctly
   - Visit https://www.bahar.co.il/scribe2/
   - Visit https://www.bahar.co.il/scribe2/poc
   - Check browser console (should be no errors)
   - Test playback

3. **Test other apps** - Verify other subdirectories still work
   - /MyTrips/
   - /fantasybroker/
   - etc.

---

## Rollback

If something breaks, restore the backup:

```bash
# Restore from backup
cp public_html/.htaccess.backup public_html/.htaccess
```

Or simply remove the line you added:
```apache
# Remove this line if needed:
RewriteCond %{REQUEST_URI} !^/scribe2/
```

---

## Additional Notes

### Why This Is Needed
- Your root `.htaccess` has SPA fallback rules for the root React app
- These rules could interfere with `/scribe2/` routing
- By excluding `/scribe2/`, we ensure the subdirectory `.htaccess` has full control

### Safe to Add
- This change is safe and follows the same pattern as `/MyTrips/`
- It only tells the root `.htaccess` to ignore `/scribe2/`
- It doesn't affect any other functionality

### Alternative: RewriteOptions inherit
If you want `/scribe2/.htaccess` to inherit some rules from the parent, you can add this to the top of `/scribe2/.htaccess`:
```apache
# Inherit parent .htaccess rules (optional)
RewriteOptions inherit
```

However, for Groovy, we want full control, so we don't use this.

---

## Summary

**Change to make:**
- Add `RewriteCond %{REQUEST_URI} !^/scribe2/` after line 67 in `public_html/.htaccess`

**Why:**
- Prevents root `.htaccess` from interfering with Groovy app
- Gives `/scribe2/.htaccess` full control over routing

**Risk:**
- Very low - follows existing pattern for `/MyTrips/`
- Easy to rollback if needed

