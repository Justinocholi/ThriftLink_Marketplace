import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Sentry source-map upload requires three env vars at build time:
//   SENTRY_AUTH_TOKEN  — internal-integration token with project:releases scope
//   SENTRY_ORG         — Sentry org slug
//   SENTRY_PROJECT     — Sentry project slug
// When SENTRY_AUTH_TOKEN is unset the plugin is skipped entirely, so local /
// CI builds work without any Sentry config.
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN
const sentryOrg = process.env.SENTRY_ORG
const sentryProject = process.env.SENTRY_PROJECT
const sentryEnabled = Boolean(sentryAuthToken)

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    sourcemap: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'sentry': ['@sentry/react'],
          'posthog': ['posthog-js'],
          'icons': ['lucide-react'],
        },
      },
    },
  },
  plugins: [
    react(),
    ...(sentryEnabled
      ? [sentryVitePlugin({
          org: sentryOrg,
          project: sentryProject,
          authToken: sentryAuthToken,
          sourcemaps: { assets: './dist/**' },
        })]
      : []),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
