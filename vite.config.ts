import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { visualizer } from 'rollup-plugin-visualizer'

// ============================================================================
// DEPLOYMENT CONFIGURATION
// ============================================================================
// Base path is configured via VITE_BASE_PATH environment variable.
// This allows CI/CD to set the deployment path without code changes.
//
// Examples:
//   - Root deployment: VITE_BASE_PATH=/
//   - Subdirectory:    VITE_BASE_PATH=/groovy/
//   - Custom path:     VITE_BASE_PATH=/my-app/
//
// Note: Must start and end with '/'
// Default: '/groovy/' (production deployment)
const PRODUCTION_BASE_PATH = process.env.VITE_BASE_PATH || '/scribe/';

// ============================================================================
// VITE CONFIGURATION
// ============================================================================
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    // Bundle analyzer - generates stats.html after build
    visualizer({
      filename: 'dist/stats.html',
      open: false, // Don't auto-open browser
      gzipSize: true,
      brotliSize: true,
      template: 'treemap', // 'treemap', 'sunburst', 'network'
    }),
  ],

  // Set base path for production deployment
  // Development always uses '/' (root) for simplicity
  // Production uses VITE_BASE_PATH env var (or default '/scribe/')
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

    // Chunk size warnings (810 KB limit - main chunk is ~804 KB after optimization)
    chunkSizeWarningLimit: 810,

    // Rollup options
    rollupOptions: {
      output: {
        // Manual chunk splitting for better caching
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Heavy export libraries - loaded on demand
          'jspdf': ['jspdf'],
          'midi-writer': ['midi-writer-js'],
          'qrcode': ['qrcode'],
          'lamejs': ['@breezystack/lamejs'],
          // UI libraries
          'lucide': ['lucide-react'],
          // Security/validation libraries
          'validation': ['zod', 'dompurify'],
        },
      },
    },
  },
})

