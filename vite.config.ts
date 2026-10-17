import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    // Relative base ensures GitHub Pages deployment works under any repository subfolder
    base: process.env.BASE_URL || './',
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'github-pages-helper',
        closeBundle() {
          const outDirs = ['dist', 'docs'];
          for (const dirName of outDirs) {
            const outPath = path.resolve(import.meta.dirname || process.cwd(), dirName);
            const indexHtml = path.join(outPath, 'index.html');
            const notFoundHtml = path.join(outPath, '404.html');
            const noJekyll = path.join(outPath, '.nojekyll');
            if (fs.existsSync(indexHtml)) {
              try {
                fs.copyFileSync(indexHtml, notFoundHtml);
                fs.writeFileSync(noJekyll, '# Disable Jekyll for GitHub Pages\n');
              } catch (e) {
                console.warn('github-pages-helper notice:', e);
              }
            }
          }
        },
      },
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'script-defer',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon.svg'],
        manifest: {
          id: './',
          name: 'Zenith Budget Planner',
          short_name: 'ZenithBudget',
          description: 'Modern offline personal budget planner for iOS, iPad, and web.',
          theme_color: '#0f172a',
          background_color: '#090d16',
          display: 'standalone',
          orientation: 'portrait-primary',
          start_url: './',
          scope: './',
          icons: [
            {
              src: 'icon-192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'icon-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any',
            },
            {
              src: 'icon-maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          cleanupOutdatedCaches: true,
          navigateFallback: null,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || process.cwd(), '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
