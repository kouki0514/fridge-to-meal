import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Automatically update the service worker without prompting the user.
      registerType: 'autoUpdate',

      // Include static assets so they are precached.
      includeAssets: [
        'favicon.ico',
        'pwa-icon.svg',
        'apple-touch-icon-180x180.png',
      ],

      // Web app manifest — controls how the app appears on iOS/Android home screens.
      manifest: {
        name: '冷蔵庫献立アシスタント',
        short_name: '献立AI',
        description: '冷蔵庫の食材を入力して、Claude AI に今日の献立を提案してもらおう',
        lang: 'ja',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        theme_color: '#f97316',
        background_color: '#fffbf5',
        icons: [
          {
            src: 'pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png',
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            // maskable: safe-zone padding for Android adaptive icons
            purpose: 'maskable',
          },
        ],
      },

      // Workbox options — controls precaching and runtime caching strategy.
      workbox: {
        // Precache all JS/CSS/HTML/images produced by Vite
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],

        runtimeCaching: [
          {
            // API calls must always go to the network — never serve from cache.
            urlPattern: /^\/api\//,
            handler: 'NetworkOnly',
          },
          {
            // Google Fonts (if ever added) — stale-while-revalidate
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\//,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],

  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
