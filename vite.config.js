import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Ensures assets load relatively for both web server and Electron file://
  server: {
    port: 5173,
  },
});
