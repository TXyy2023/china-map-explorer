import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
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
