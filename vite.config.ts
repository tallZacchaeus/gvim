import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * `npm run dev` serves only the React app — the API lives in Vercel Functions and
 * has no local equivalent. Proxying /api to the deployed site lets the UI render
 * real content while working on design.
 *
 * NOTE: this points at PRODUCTION. Reads are harmless, but an admin write performed
 * against the dev server will hit the live database. Set VITE_API_PROXY to a preview
 * deployment when working on anything that writes.
 */
const API_TARGET = process.env.VITE_API_PROXY || 'https://www.godsvesselinternationalministry.org';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true, secure: true }
    }
  },
  build: { outDir: 'dist', sourcemap: false }
});
