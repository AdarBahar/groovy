# Deployment Guide

## Production Deployment to www.bahar.co.il/groovy/

Production runs on the InMotion cPanel host. The folder on the server is `/home/baharc5/public_html/groovy/`.

Deploy with the `inmotion-deploy` tool. The tool is in the repo `AdarBahar/inmotion-deploy`. Its clone is on the Mac at `~/Code/deployment/inmotion`. The service name is `groovy`.

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
- Set base path to `/groovy/`
- Output to `dist/` directory
- Copy `public/.htaccess` into `dist/`

### 2. Verify Build Locally
```bash
npm run preview:prod
```

Open http://localhost:4173/groovy/ to test the production build locally.

### 3. Deploy to Server

Read the section [Deploy with inmotion-deploy](#deploy-with-inmotion-deploy) and follow its steps.

---

## Deploy with inmotion-deploy

The tool copies the content of `dist/` to the server folder. Run each step in order.

1. Build the site: `npm run build:prod` (in `~/Code/groovy`).
2. Change to the tool folder: `cd ~/Code/deployment/inmotion`.
3. Show the changes. Change nothing: `python3 inmotionDeploy.py groovy --dry-run`.
4. Deploy: `python3 inmotionDeploy.py groovy`. Answer `y` when the tool asks.
5. Test the page: https://www.bahar.co.il/groovy/ and the playback controls.

What the tool does:
- It backs up the whole server folder to the Mac before it changes a file.
- It copies `dist/` to the server. It does not copy `stats.html` or `*.zip` files.
- It deletes the server files that are not in `dist/` (`delete_extra` is `true`). Read the dry-run list before you answer `y`.
- It tests https://www.bahar.co.il/groovy/. The answer must be `200`.

If the dry-run lists more than 100 changes, the tool stops. Add `--allow-large` only after you read the list.

---

## Build Output

After running `npm run build:prod`, the `dist/` folder will contain:

```
dist/
├── index.html              # Main HTML file
├── .htaccess               # Apache rules (copied from public/.htaccess)
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

The build also writes `dist/stats.html`. The bundle analyzer creates it. The deploy tool does not copy it.

---

## Server Configuration

### Apache (.htaccess)

The Apache rules live in `public/.htaccess`. Vite copies the file to `dist/`, and the deploy tool sends it to the server. Change the rules in the repo, not on the server.

The file sets:
- The SPA rewrite to `index.html` (for React Router).
- The Content-Security-Policy for the `/groovy/` path. It allows the Vite bundle, the analytics script, Amplitude, Google Fonts, cdnjs, and the URL shortener.
- Compression and cache headers for the static files.

Do not edit the server copy by hand. The next deploy replaces it. The tool makes a backup first.

### Nginx

Not used on InMotion. If you host the app on Nginx, add to your server block:

```nginx
location /groovy/ {
    alias /path/to/www/groovy/;
    try_files $uri $uri/ /groovy/index.html;

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
- [ ] Run `npm run preview:prod` (test locally at http://localhost:4173/groovy/)
- [ ] Test all routes: `/groovy/` and `/groovy/poc`
- [ ] Test playback functionality
- [ ] Verify drum samples load correctly
- [ ] Check browser console for errors
- [ ] Run `python3 inmotionDeploy.py groovy --dry-run` and read the list of changes

After deploying:
- [ ] Visit https://www.bahar.co.il/groovy/
- [ ] Test production UI page
- [ ] Visit https://www.bahar.co.il/groovy/poc
- [ ] Test POC page functionality
- [ ] Test playback and all controls
- [ ] Check browser console for errors
- [ ] Test on mobile devices

---

## Troubleshooting

### Issue: Blank page or 404 errors
**Solution**: Ensure `.htaccess` redirects all routes to `index.html`. Check that `public/.htaccess` is in `dist/`.

### Issue: Assets not loading (404 on JS/CSS files)
**Solution**: Verify `base: '/groovy/'` is set in `vite.config.ts` and rebuild

### Issue: Sounds not playing
**Solution**: 
- Check that `sounds/` folder is on the server (run the deploy again)
- Verify MIME types are correct (`.mp3` should be `audio/mpeg`)
- Check browser console for 404 errors

### Issue: React Router routes don't work
**Solution**: Server must redirect all routes to `index.html` (see server config above)

### Issue: The tool stops with "copy failed (exit 255)"
**Solution**: The host closes a fast second ssh connection. The tool retries after 60 s. Wait for the retry. If all tries fail, read `logs/deploy.log` in the tool folder.

---

## Rollback

Restore the last backup with the tool:

```bash
cd ~/Code/deployment/inmotion
python3 inmotionDeploy.py groovy --rollback --dry-run   # show the changes
python3 inmotionDeploy.py groovy --rollback             # restore the latest backup
```

The rollback first saves the current server state as a new backup. To restore an older backup, run `python3 inmotionDeploy.py groovy --list` and give the time stamp.

To roll back the code instead, check out the previous commit, run `npm run build:prod`, and deploy again.

---

## Future: Automated Deployment

Automated deployment is not set up. The tool runs by hand from the Mac.
