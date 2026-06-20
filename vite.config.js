import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The Sentry plugin is only active when an auth token is provided, so the
// default `npm run build` doesn't fail in dev or CI. Set SENTRY_AUTH_TOKEN
// (a Sentry "Internal Integration" token with project:releases scope) plus
// SENTRY_ORG and SENTRY_PROJECT in your CI/host env to enable source-map
// upload and release tagging.
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN
const sentryOrg = process.env.SENTRY_ORG
const sentryProject = process.env.SENTRY_PROJECT
const sentryEnabled = Boolean(sentryAuthToken && sentryOrg && sentryProject)

export default defineConfig({
  // `@/foo` resolves to `src/foo` — shadcn/ui's standard alias.
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Hidden source maps are emitted alongside the bundle so the Sentry CLI
    // can upload them, but the production HTML doesn't reference them — so
    // they never ship to end users.
    sourcemap: sentryEnabled ? 'hidden' : false,
  },
  plugins: [
    react(),
    ...(sentryEnabled
      ? [sentryVitePlugin({
          authToken: sentryAuthToken,
          org: sentryOrg,
          project: sentryProject,
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
