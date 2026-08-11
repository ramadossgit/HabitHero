import { expect, afterEach, vi, beforeAll, afterAll } from 'vitest'

// Browser-style mocks only apply to jsdom tests (components). Node tests
// (unit + live API E2E) must keep the real fetch and no MSW interception.
const isJsdom = typeof window !== 'undefined'

if (isJsdom) {
  const { cleanup } = await import('@testing-library/react')
  await import('@testing-library/jest-dom')
  const { server } = await import('./mocks/server.js')

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

  // Mock environment variables for component testing
  Object.assign(process.env, {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgresql://localhost:5432/habitheroes_test',
    STRIPE_SECRET_KEY: 'sk_test_mock',
    VITE_STRIPE_PUBLIC_KEY: 'pk_test_mock',
  })

  // NOTE: fetch is intentionally NOT stubbed here — MSW (started above)
  // intercepts real fetch calls; replacing fetch with vi.fn() would make
  // every component query silently return undefined.
  //
  // Node's fetch cannot parse the relative URLs the app uses
  // (fetch('/api/...')), so resolve them against the jsdom origin before
  // they reach MSW.
  const realFetch = global.fetch.bind(globalThis)
  global.fetch = ((input: any, init?: any) => {
    if (typeof input === 'string' && input.startsWith('/')) {
      input = 'http://localhost:3000' + input
    } else if (input instanceof URL === false && input?.url?.startsWith?.('/')) {
      input = new Request('http://localhost:3000' + input.url, input)
    }
    return realFetch(input, init)
  }) as typeof fetch
}
