import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // Base path for deployment to www.bahar.co.il/scribe2/
  // Use '/' for root deployment, '/scribe2/' for subdirectory
  base: process.env.NODE_ENV === 'production' ? '/scribe2/' : '/',

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

