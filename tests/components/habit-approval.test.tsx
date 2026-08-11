import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server'
import HabitApproval from '../../client/src/components/parent/habit-approval'
import * as useAuthModule from '../../client/src/hooks/useAuth'

// Mock the useAuth hook (subscription status drives the premium gate)
vi.mock('../../client/src/hooks/useAuth')
const mockUseAuth = vi.mocked(useAuthModule.useAuth)

const mockChildren = [
  { id: 'child-1', name: 'Test Child 1' },
  { id: 'child-2', name: 'Test Child 2' },
] as any

function makeQueryClient() {
  // Mirror the app's default queryFn (queryKey segments joined into a URL)
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        queryFn: async ({ queryKey }) => {
          const res = await fetch(queryKey.join('/') as string, { credentials: 'include' })
          if (!res.ok) throw new Error(`${res.status}`)
          return res.json()
        },
      },
      mutations: { retry: false },
    },
  })
}

function renderComponent() {
  return render(
    <QueryClientProvider client={makeQueryClient()}>
      <HabitApproval children={mockChildren} />
    </QueryClientProvider>,
  )
}

function authAs(subscriptionStatus: string) {
  mockUseAuth.mockReturnValue({
    user: { id: 'test-user-id', email: 'test@example.com', subscriptionStatus },
    isAuthenticated: true,
    isLoading: false,
  } as any)
}

describe('HabitApproval Component', () => {
  beforeEach(() => {
    authAs('active')
  })

  describe('Premium auto-approval', () => {
    it('shows the Settings toggle for premium users, panel closed by default', async () => {
      renderComponent()

      expect(await screen.findByRole('button', { name: /settings/i })).toBeInTheDocument()
      expect(screen.queryByText(/premium auto-approval settings/i)).not.toBeInTheDocument()
    })

    it('opens the auto-approval settings panel from the Settings button', async () => {
      const user = userEvent.setup()
      renderComponent()

      await user.click(await screen.findByRole('button', { name: /settings/i }))

      expect(await screen.findByText(/premium auto-approval settings/i)).toBeInTheDocument()
      expect(screen.getByText(/enable auto-approval/i)).toBeInTheDocument()
    })

    it('shows time configuration and statistics when auto-approval is enabled', async () => {
      const user = userEvent.setup()
      renderComponent()

      await user.click(await screen.findByRole('button', { name: /settings/i }))

      // Settings fetched from MSW arrive with enabled=true
      expect(await screen.findByText(/auto-approve after/i)).toBeInTheDocument()
      expect(screen.getByText(/time unit/i)).toBeInTheDocument()
      // Stats from /api/auto-approval-stats
      expect(await screen.findByText(/auto-approved this week/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /save settings/i })).toBeInTheDocument()
    })

    it('saves settings and closes the panel', async () => {
      const user = userEvent.setup()
      let putBody: any = null
      server.use(
        http.put('/api/auto-approval-settings', async ({ request }) => {
          putBody = await request.json()
          return HttpResponse.json(putBody)
        }),
      )

      renderComponent()
      await user.click(await screen.findByRole('button', { name: /settings/i }))
      await user.click(await screen.findByRole('button', { name: /save settings/i }))

      await waitFor(() => {
        expect(putBody).not.toBeNull()
      })
      expect(putBody.enabled).toBe(true)
      await waitFor(() => {
        expect(screen.queryByText(/premium auto-approval settings/i)).not.toBeInTheDocument()
      })
    })

    it('shows an upgrade prompt instead of settings for free users', async () => {
      authAs('free')
      renderComponent()

      expect(await screen.findByText(/premium feature/i)).toBeInTheDocument()
      expect(screen.getByText(/upgrade to premium/i)).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /^settings$/i })).not.toBeInTheDocument()
    })

    it('grants trial users access to auto-approval settings', async () => {
      authAs('trial')
      const user = userEvent.setup()
      renderComponent()

      await user.click(await screen.findByRole('button', { name: /settings/i }))
      expect(await screen.findByText(/premium auto-approval settings/i)).toBeInTheDocument()
      expect(screen.getByText(/trial access/i)).toBeInTheDocument()
    })
  })

  describe('Child selection and habit review', () => {
    it('lists all children for selection', async () => {
      renderComponent()

      expect(await screen.findByTestId('select-child-child-1')).toBeInTheDocument()
      expect(screen.getByTestId('select-child-child-2')).toBeInTheDocument()
      expect(screen.getByText('Test Child 1')).toBeInTheDocument()
      expect(screen.getByText('Test Child 2')).toBeInTheDocument()
    })

    it('shows pending habits after selecting a child', async () => {
      const user = userEvent.setup()
      renderComponent()

      await user.click(await screen.findByTestId('select-child-child-1'))

      expect(await screen.findByText('Brush Teeth')).toBeInTheDocument()
      expect(screen.getByTestId('approve-habit-completion-1')).toBeInTheDocument()
      expect(screen.getByTestId('reject-habit-completion-1')).toBeInTheDocument()
    })

    it('shows an all-caught-up message for children without pending habits', async () => {
      const user = userEvent.setup()
      renderComponent()

      await user.click(await screen.findByTestId('select-child-child-2'))

      expect(await screen.findByText(/all caught up/i)).toBeInTheDocument()
    })

    it('approves a habit through the API', async () => {
      const user = userEvent.setup()
      let approvedId: string | null = null
      server.use(
        http.post('/api/habit-completions/:completionId/approve', ({ params }) => {
          approvedId = String(params.completionId)
          return HttpResponse.json({ id: params.completionId, status: 'approved' })
        }),
      )

      renderComponent()
      await user.click(await screen.findByTestId('select-child-child-1'))
      await user.click(await screen.findByTestId('approve-habit-completion-1'))

      await waitFor(() => {
        expect(approvedId).toBe('completion-1')
      })
    })

    it('asks for a feedback message when rejecting', { timeout: 20000 }, async () => {
      const user = userEvent.setup()
      let rejectBody: any = null
      server.use(
        http.post('/api/habit-completions/:completionId/reject', async ({ request, params }) => {
          rejectBody = { id: params.completionId, ...(await request.json() as object) }
          return HttpResponse.json({ id: params.completionId, status: 'rejected' })
        }),
      )

      renderComponent()
      await user.click(await screen.findByTestId('select-child-child-1'))
      await user.click(await screen.findByTestId('reject-habit-completion-1'))

      // Rejection form appears
      const messageBox = await screen.findByTestId('reject-message-completion-1')
      await user.type(messageBox, 'redo it properly')
      await user.click(screen.getByTestId('confirm-reject-completion-1'))

      await waitFor(() => {
        expect(rejectBody).not.toBeNull()
      })
      expect(rejectBody.id).toBe('completion-1')
      expect(rejectBody.message).toMatch(/redo it properly/)
    })
  })
})
