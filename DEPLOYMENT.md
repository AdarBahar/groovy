# Deployment Guide

This guide explains how to build Groovy for production and how to host the built files. The steps apply to any static web host.

## Base path

The app runs under the `/groovy/` path by default. Vite reads the base path from `vite.config.ts`. You can change it with the `VITE_BASE_PATH` variable. Use the same path on your host.

## 1. Build

```bash
npm run build:prod
```

This command:
- Runs the TypeScript type check
- Builds the production bundle with the base path `/groovy/`
- Writes the output to `dist/`
- Copies `public/.htaccess` into `dist/`

## 2. Test the build locally

```bash
npm run preview:prod
```

Open [http://localhost:4173/groovy/](http://localhost:4173/groovy/) in your browser.

## 3. Host the files

Copy the contents of `dist/` to the folder that serves the base path. For example, if the site runs at `https://example.com/groovy/`, copy the files to the `groovy` folder in the web root.

Deploy files from a clean build. Do not edit the files on the host by hand.

## Server rules

The app uses client-side routing. The server must return `index.html` for each path under `/groovy/`.

### Apache

`public/.htaccess` contains the Apache rules. It sets:
- The rewrite to `index.html` for React Router
- The Content-Security-Policy header for the app
- Compression and cache headers for static files

Change these rules in the repository. Do not change the server copy by hand.

### Nginx

Add this block to the server configuration:

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

## Checklist

Before you deploy:

- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
- [ ] `npm test` passes
- [ ] `npm run build:prod` succeeds
- [ ] `npm run preview:prod` loads the app at http://localhost:4173/groovy/
- [ ] Playback works and the drum samples load
- [ ] The browser console shows no errors

After you deploy:

- [ ] The production URL loads
- [ ] Playback works
- [ ] The browser console shows no errors
- [ ] The page works on a phone

## Troubleshooting

**Blank page or 404 errors for scripts and styles.** Check that `base` is `/groovy/` in `vite.config.ts`, then rebuild.

**A route returns 404.** The server rewrite is missing. Check that `.htaccess` is in the host folder, or add the Nginx rule above.

**Sounds do not play.** Check that the `sounds/` folder is on the host. Check that `.mp3` files are served as `audio/mpeg`. Check the browser console for 404 errors.

## Automated deployment

The repository has a GitHub Pages workflow in `.github/workflows/deploy.yml`. It runs only when you start it by hand from the Actions tab. A push does not start it.
