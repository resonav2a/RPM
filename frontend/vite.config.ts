import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Listen on all available network interfaces
    port: 3000,
  },
  build: {
    // Generate sourcemaps for easier debugging
    sourcemap: true,
    // Increase the warning limit to avoid flooding the console
    chunkSizeWarningLimit: 1000,
    // Configure rollup options
    rollupOptions: {
      output: {
        // Ensure large chunks are split appropriately
        manualChunks: {
          react: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js']
        }
      }
    }
  },
  // Add basic CSP headers
  preview: {
    headers: {
      'Content-Security-Policy': `
        default-src 'self';
        connect-src 'self' https://*.supabase.co;
        img-src 'self' data: https:;
        style-src 'self' 'unsafe-inline';
        script-src 'self' 'unsafe-inline' 'unsafe-eval';
        font-src 'self' data:;
      `.replace(/\s+/g, ' ').trim(),
    }
  }
})
