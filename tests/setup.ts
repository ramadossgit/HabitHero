import '@testing-library/jest-dom'
import { expect, afterEach, vi, beforeAll, afterAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import { server } from './mocks/server.js'

// Runs a cleanup after each test case
afterEach(() => {
  cleanup()
})

// Establish API mocking before all tests
beforeAll(() => server.listen())

// Reset any request handlers after each test
afterEach(() => server.resetHandlers())

// Clean up after the tests are finished
afterAll(() => server.close())

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // Deprecated
    removeListener: vi.fn(), // Deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  disconnect: vi.fn(),
  unobserve: vi.fn(),
}))

// Mock environment variables for testing
Object.assign(process.env, {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://localhost:5432/habitheroes_test',
  STRIPE_SECRET_KEY: 'sk_test_mock',
  VITE_STRIPE_PUBLIC_KEY: 'pk_test_mock',
})

// Mock fetch for global use
global.fetch = vi.fn()