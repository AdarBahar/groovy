# Deployment Guide

## Production Deployment to www.bahar.co.il/scribe2/

This guide covers deploying Groovy to a subdirectory on your web server.

**Note:** To deploy to a different subdirectory, see `CHANGE_BASE_PATH.md`

---

## Quick Start

### 1. Build for Production
```bash
npm run build:prod
```

This will:
- Run TypeScript type checking
- Build optimized production bundle
- Set base path to `/scribe2/`
- Output to `dist/` directory

### 2. Verify Build Locally
```bash
npm run preview:prod
```

Open http://localhost:4173/scribe2/ to test the production build locally.

### 3. Deploy to Server

**Manual Deployment:**
```bash
# Upload the entire dist/ folder contents to:
# www.bahar.co.il/scribe2/

# Using SCP (example):
scp -r dist/* user@bahar.co.il:/path/to/www/scribe2/

# Using FTP/SFTP:
# Upload all files from dist/ to /scribe2/ directory on server
```

---

## Build Output

After running `npm run build:prod`, the `dist/` folder will contain:

```
dist/
├── index.html              # Main HTML file
├── assets/
│   ├── index-[hash].js    # Main JavaScript bundle
│   ├── react-vendor-[hash].js  # React libraries (cached separately)
│   ├── index-[hash].css   # Styles
│   └── ...
└── sounds/                 # Drum samples (30 files)
    ├── Kick.mp3
    ├── Snare Normal.mp3
    ├── Hi Hat Normal.mp3
    └── ...
```

**Total size**: ~2-3 MB (mostly drum samples)

---

## Server Configuration

### Apache (.htaccess)

Create or update `.htaccess` in the `/scribe2/` directory:

```apache
# Enable rewrite engine
RewriteEngine On

# Redirect all requests to index.html (for React Router)
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^ index.html [L]

# Enable gzip compression
<IfModule mod_deflate.c>
  AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

# Cache static assets
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType image/jpg "access plus 1 year"
  ExpiresByType image/jpeg "access plus 1 year"
  ExpiresByType image/gif "access plus 1 year"
  ExpiresByType image/png "access plus 1 year"
  ExpiresByType audio/mpeg "access plus 1 year"
  ExpiresByType text/css "access plus 1 month"
  ExpiresByType application/javascript "access plus 1 month"
  ExpiresByType text/html "access plus 0 seconds"
</IfModule>
```

### Nginx

If using Nginx, add to your server block:

```nginx
location /scribe2/ {
    alias /path/to/www/scribe2/;
    try_files $uri $uri/ /scribe2/index.html;
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|mp3)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## Deployment Checklist

Before deploying:
- [ ] Run `npm run type-check` (no errors)
- [ ] Run `npm run lint` (no errors)
- [ ] Run `npm run build:prod` (successful build)
- [ ] Run `npm run preview:prod` (test locally at http://localhost:4173/scribe2/)
- [ ] Test all routes: `/scribe2/` and `/scribe2/poc`
- [ ] Test playback functionality
- [ ] Verify drum samples load correctly
- [ ] Check browser console for errors

After deploying:
- [ ] Visit https://www.bahar.co.il/scribe2/
- [ ] Test production UI page
- [ ] Visit https://www.bahar.co.il/scribe2/poc
- [ ] Test POC page functionality
- [ ] Test playback and all controls
- [ ] Check browser console for errors
- [ ] Test on mobile devices

---

## Troubleshooting

### Issue: Blank page or 404 errors
**Solution**: Ensure `.htaccess` or Nginx config redirects all routes to `index.html`

### Issue: Assets not loading (404 on JS/CSS files)
**Solution**: Verify `base: '/scribe2/'` is set in `vite.config.ts` and rebuild

### Issue: Sounds not playing
**Solution**: 
- Check that `sounds/` folder is uploaded
- Verify MIME types are correct (`.mp3` should be `audio/mpeg`)
- Check browser console for 404 errors

### Issue: React Router routes don't work
**Solution**: Server must redirect all routes to `index.html` (see server config above)

---

## Rollback

If deployment has issues:
1. Keep a backup of previous `dist/` folder
2. Re-upload previous version
3. Or revert git commit and rebuild:
   ```bash
   git revert HEAD
   npm run build:prod
   # Re-upload dist/
   ```

---

## Future: Automated Deployment

Consider setting up automated deployment with:
- **GitHub Actions** - Auto-deploy on push to main
- **Rsync** - Sync only changed files
- **CI/CD Pipeline** - Build, test, and deploy automatically

Example GitHub Actions workflow (future):
```yaml
name: Deploy to Production
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm run type-check
      - run: npm run build:prod
      - name: Deploy to server
        run: |
          scp -r dist/* ${{ secrets.SERVER_USER }}@bahar.co.il:/path/to/www/scribe2/
```

