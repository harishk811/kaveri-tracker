import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync, readFileSync } from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const resolve = (p: string) => path.resolve(__dirname, p)

const certFile = resolve('192.168.0.117.pem')
const keyFile = resolve('192.168.0.117-key.pem')
const hasLocalCert = existsSync(certFile) && existsSync(keyFile)

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Kaveri → 70.3 Goa Tracker',
        short_name: 'Kaveri Tracker',
        description: 'Two-step marathon & 70.3 training tracker — Kaveri Trail Marathon 22 Nov 2026 → Ironman 70.3 Goa 2027',
        theme_color: '#0f766e',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        lang: 'en',
        categories: ['fitness', 'health', 'sports'],
        // Home-screen shortcuts (Android): jump straight into the 9:1 alarm,
        // today's sessions or the insights. Hash URLs route inside the SPA.
        shortcuts: [
          {
            name: '9:1 run-walk alarm',
            short_name: '9:1 timer',
            description: 'Start the race-day run-walk alarm',
            url: '/#/insights',
            icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Today',
            short_name: 'Today',
            description: 'Today\'s sessions and recovery checks',
            url: '/#/',
            icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
          },
          {
            name: 'Insights',
            short_name: 'Stats',
            description: 'Volume, strain, body metrics and achievements',
            url: '/#/insights',
            icons: [{ src: '/icon-192.png', sizes: '192x192', type: 'image/png' }],
          },
        ],
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        // Precache the app shell + data so it works offline on Android
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        navigateFallback: '/index.html',
      },
      // Dev server must NOT register a service worker: it precaches nothing and
      // LAN origins (http://192.168.x.x) are not secure contexts anyway, so a
      // dev SW would only ever be half-broken. Offline works from production
      // builds over HTTPS (see INSTALL.md — Path A2/B).
      devOptions: {
        enabled: false,
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // Allow access from other devices on the same WiFi (e.g., your phone)
    host: true,
  },
  preview: {
    // Production preview over HTTPS for Path A2 (offline PWA install).
    // Used instead of `npx serve`: serve adds a Content-Disposition header
    // that some Android Chrome versions reject on service-worker scripts,
    // which silently kills the SW install (registered but never controlling).
    // HTTPS is only attached when the mkcert pem files exist locally — on
    // Netlify (no pem files) the build must still work, over its own TLS.
    host: true,
    https: hasLocalCert
      ? {
          cert: readFileSync(certFile),
          key: readFileSync(keyFile),
        }
      : undefined,
  },
})
