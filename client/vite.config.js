import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development the client calls /api and Vite proxies to the Express server,
// so there is no CORS in the loop and no hard-coded localhost in the source.
// In production VITE_API_URL points at the deployed API.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { '/api': { target: 'http://localhost:4000', changeOrigin: true } },
  },
  build: { target: 'es2022' },
});
