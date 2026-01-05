# Router Fix - URL Basename Update

## Issue Fixed ✅
URLs were changing from `/scribe2/` to `/` when navigating:
- ❌ `https://www.bahar.co.il/scribe2/` → `https://www.bahar.co.il/`
- ❌ `https://www.bahar.co.il/scribe2/poc` → `https://www.bahar.co.il/poc`

## Root Cause
React Router's `BrowserRouter` didn't know it was running in a subdirectory.

## Solution
Added `basename` prop to `BrowserRouter` using Vite's `BASE_URL`:

```typescript
const basename = import.meta.env.BASE_URL;
// Development: '/'
// Production: '/scribe2/'

<BrowserRouter basename={basename}>
  {/* routes */}
</BrowserRouter>
```

---

## Files to Upload

### Upload Only 2 Files:

1. **dist/index.html** → `/scribe2/index.html`
   - References new JS file: `index-BSfzOq82.js`

2. **dist/assets/index-BSfzOq82.js** → `/scribe2/assets/index-BSfzOq82.js`
   - Contains router basename fix

### DO NOT re-upload:
- ❌ `sounds/` (unchanged)
- ❌ `react-vendor-DUzXPTov.js` (unchanged)
- ❌ `index-BkhCV9qV.css` (unchanged)
- ❌ `.htaccess` (unchanged)

---

## Upload Commands

### Using SCP:
```bash
# Upload index.html
scp dist/index.html user@bahar.co.il:/path/to/www/scribe2/

# Upload new JavaScript
scp dist/assets/index-BSfzOq82.js user@bahar.co.il:/path/to/www/scribe2/assets/
```

### Using FTP/SFTP:
1. Connect to server
2. Navigate to `/scribe2/`
3. Upload `index.html`
4. Navigate to `/scribe2/assets/`
5. Upload `index-BSfzOq82.js`

---

## Verification

### Test URLs Stay Correct:

1. **Visit:** `https://www.bahar.co.il/scribe2/`
   - ✅ URL should stay: `https://www.bahar.co.il/scribe2/`
   - ❌ Should NOT change to: `https://www.bahar.co.il/`

2. **Visit:** `https://www.bahar.co.il/scribe2/poc`
   - ✅ URL should stay: `https://www.bahar.co.il/scribe2/poc`
   - ❌ Should NOT change to: `https://www.bahar.co.il/poc`

3. **Navigate between pages:**
   - Click links/buttons to navigate
   - URL should always keep `/scribe2/` prefix

### Test Functionality:
- ✅ Page loads correctly
- ✅ Navigation works
- ✅ Sounds play (from previous fix)
- ✅ No console errors
- ✅ Browser back/forward buttons work

---

## Clean Up (Optional)

After verifying the fix works, delete old JavaScript files:
```
/scribe2/assets/index-CTiJC_a9.js (oldest)
/scribe2/assets/index-DX42WnJc.js (previous)
```

Keep only:
```
/scribe2/assets/index-BSfzOq82.js (current)
```

---

## What Changed

### Before:
```typescript
<BrowserRouter>
  {/* Router thinks it's at root (/) */}
</BrowserRouter>
```

**Result:**
- Router navigates to `/` and `/poc` (root paths)
- Browser shows `https://www.bahar.co.il/` instead of `/scribe2/`

### After:
```typescript
<BrowserRouter basename="/scribe2/">
  {/* Router knows it's in /scribe2/ subdirectory */}
</BrowserRouter>
```

**Result:**
- Router navigates to `/scribe2/` and `/scribe2/poc` (correct paths)
- Browser shows `https://www.bahar.co.il/scribe2/` ✅

---

## Complete Fix Summary

This is the **3rd and final fix** for the `/scribe2/` deployment:

1. ✅ **Sound loading** - Fixed paths to use `/scribe2/sounds/`
2. ✅ **vite.svg 404** - Removed hardcoded favicon
3. ✅ **Router basename** - URLs now stay in `/scribe2/` subdirectory

All issues are now resolved! 🎉

---

**Build Date**: 2026-01-05  
**Commit**: 5a03d29  
**New JS File**: index-BSfzOq82.js  
**Files to Upload**: 2 (index.html + index-BSfzOq82.js)

