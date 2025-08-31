import { setupServer } from 'msw/node'
import { handlers } from './handlers.js'

// Setup MSW server for API mocking
export const server = setupServer(...handlers)