// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy /preview to the WebContainer dev server
    proxy: {
      '/preview': {
        target: 'http://localhost:5173',
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});