import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  preview: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    strictPort: true,
    proxy: {
      '/api/mcp': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
      '/api/assets': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
});
