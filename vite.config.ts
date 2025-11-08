// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      // Bypass CORS for WebContainer script
      '/webcontainer.js': {
        target: 'https://webcontainers.io',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/webcontainer.js/, '/webcontainer.js')
      }
    }
  }
});