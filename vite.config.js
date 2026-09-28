import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base './' keeps every asset path relative, so the built app works from the
// domain root or from any sub-folder (e.g. public_html/system) on Hostinger.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { outDir: 'dist', sourcemap: false, chunkSizeWarningLimit: 900 }
});
