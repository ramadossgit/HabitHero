/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    css: true,
    // UI renders can be slow when files run in parallel on a loaded machine
    testTimeout: 20000,
    // tests/mobile is an Appium/WebdriverIO suite (wdio.conf.js) and
    // tests/e2e is a Playwright suite (playwright.config.ts) — neither can
    // run under vitest.
    exclude: ['**/node_modules/**', '**/dist/**', 'tests/mobile/**', 'tests/e2e/**', 'Mini_game/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
      '@shared': path.resolve(__dirname, './shared'),
      '@assets': path.resolve(__dirname, './attached_assets'),
    },
  },
})