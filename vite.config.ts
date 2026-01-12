import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// ============================================================================
// DEPLOYMENT CONFIGURATION
// ============================================================================
// Base path is configured via VITE_BASE_PATH environment variable.
// This allows CI/CD to set the deployment path without code changes.
//
// Examples:
//   - Root deployment: VITE_BASE_PATH=/
//   - Subdirectory:    VITE_BASE_PATH=/scribe2/
//   - Custom path:     VITE_BASE_PATH=/my-app/
//
// Note: Must start and end with '/'
// Default: '/scribe2/' (for backward compatibility)
const PRODUCTION_BASE_PATH = process.env.VITE_BASE_PATH || '/scribe2/';

// ============================================================================
// VITE CONFIGURATION
// ============================================================================
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  // Set base path for production deployment
  // Development always uses '/' (root) for simplicity
  // Production uses VITE_BASE_PATH env var (or default '/scribe2/')
  base: process.env.NODE_ENV === 'production' ? PRODUCTION_BASE_PATH : '/',

  server: {
    port: 5175,
  },

  build: {
    // Output directory
    outDir: 'dist',

    // Generate sourcemaps for debugging (optional, remove for smaller bundle)
    sourcemap: false,

    // Minify for production
    minify: 'esbuild',

    // Chunk size warnings
    chunkSizeWarningLimit: 1000,

    // Rollup options
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
})

