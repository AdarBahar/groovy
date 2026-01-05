# Deployment Instructions

## Upload to www.bahar.co.il/scribe2/

### Files to Upload

After running `npm run build:prod`, upload **ALL** contents from the `dist/` folder:

```
dist/
├── index.html              ← Upload to /scribe2/
├── assets/                 ← Upload entire folder to /scribe2/assets/
│   ├── index-[hash].js
│   ├── react-vendor-[hash].js
│   └── index-[hash].css
└── sounds/                 ← Upload entire folder to /scribe2/sounds/
    └── (28 MP3 files)
```

**ALSO upload:**
- `.htaccess` (from project root) → Upload to `/scribe2/.htaccess`

### Server Directory Structure

Your server should look like this:

```
/scribe2/
├── .htaccess              ← Apache configuration
├── index.html             ← Main HTML file
├── assets/                ← JavaScript and CSS
│   ├── index-[hash].js
│   ├── react-vendor-[hash].js
│   └── index-[hash].css
└── sounds/                ← Drum samples
    ├── Kick.mp3
    ├── Snare Normal.mp3
    ├── Hi Hat Normal.mp3
    └── ... (25 more files)
```

### Upload Methods

#### Option 1: FTP/SFTP (FileZilla, Cyberduck, etc.)
1. Connect to your server
2. Navigate to `/scribe2/` directory
3. Upload all files from `dist/` folder
4. Upload `.htaccess` file
5. Verify all files are uploaded

#### Option 2: SCP (Command Line)
```bash
# Upload dist contents
scp -r dist/* user@bahar.co.il:/path/to/www/scribe2/

# Upload .htaccess
scp .htaccess user@bahar.co.il:/path/to/www/scribe2/
```

#### Option 3: cPanel File Manager
1. Log in to cPanel
2. Open File Manager
3. Navigate to `/scribe2/` directory
4. Upload all files from `dist/` folder
5. Upload `.htaccess` file

### Verification

After uploading, visit:
- **Production UI**: https://www.bahar.co.il/scribe2/
- **POC Testing**: https://www.bahar.co.il/scribe2/poc

**Test checklist:**
- [ ] Page loads without errors
- [ ] Navigation works (switch between / and /poc)
- [ ] Drum sounds play
- [ ] Playback controls work
- [ ] No 404 errors in browser console
- [ ] All routes work (refresh on /poc should still work)

### Troubleshooting

**Problem**: Blank page or "Cannot GET /scribe2/poc"  
**Solution**: Ensure `.htaccess` is uploaded and Apache mod_rewrite is enabled

**Problem**: 404 errors for JS/CSS files  
**Solution**: Verify `assets/` folder is uploaded correctly

**Problem**: Sounds don't play  
**Solution**: Verify `sounds/` folder is uploaded with all 28 MP3 files

**Problem**: Page works on / but not on /poc  
**Solution**: Check `.htaccess` file is present and mod_rewrite is working

### File Permissions

Ensure correct permissions on server:
- Directories: `755` (rwxr-xr-x)
- Files: `644` (rw-r--r--)

```bash
# Set permissions (if using SSH)
chmod 755 /path/to/www/scribe2/
chmod 755 /path/to/www/scribe2/assets/
chmod 755 /path/to/www/scribe2/sounds/
chmod 644 /path/to/www/scribe2/*.html
chmod 644 /path/to/www/scribe2/.htaccess
chmod 644 /path/to/www/scribe2/assets/*
chmod 644 /path/to/www/scribe2/sounds/*
```

### Updating Deployment

When deploying updates:
1. Build new version: `npm run build:prod`
2. Upload new files (will overwrite old ones)
3. Browser cache will automatically use new files (content hashes change)
4. No need to clear server cache

### Rollback

If you need to rollback:
1. Keep a backup of previous `dist/` folder
2. Re-upload previous version
3. Or rebuild from previous git commit:
   ```bash
   git checkout <previous-commit>
   npm install
   npm run build:prod
   # Upload dist/
   ```

---

For more details, see `DEPLOYMENT.md` in the project root.

