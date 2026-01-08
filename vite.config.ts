import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// ============================================================================
// DEPLOYMENT CONFIGURATION
// ============================================================================
// Change this to deploy to a different subdirectory
// Examples:
//   - Root deployment: '/'
//   - Subdirectory: '/scribe2/'
//   - Different subdirectory: '/my-app/'
// Note: Must start and end with '/'
const PRODUCTION_BASE_PATH = '/scribe2/';

// ============================================================================
// VITE CONFIGURATION
// ============================================================================
// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],

  // Set base path for production deployment
  // Development always uses '/' (root) for simplicity
  // Production uses PRODUCTION_BASE_PATH defined above
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

