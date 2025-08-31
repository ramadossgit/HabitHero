import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import HabitApproval from '../../client/src/components/parent/habit-approval'
import * as useAuthModule from '../../client/src/hooks/useAuth'

// Mock the useAuth hook
vi.mock('../../client/src/hooks/useAuth')

const mockUseAuth = vi.mocked(useAuthModule.useAuth)

describe('HabitApproval Component', () => {
  let queryClient: QueryClient
  let user: ReturnType<typeof userEvent.setup>

  const mockChildren = [
    { id: 'child-1', name: 'Test Child 1', pendingCount: 2 },
    { id: 'child-2', name: 'Test Child 2', pendingCount: 0 },
  ]

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    })
    user = userEvent.setup()

    // Mock authenticated premium user
    mockUseAuth.mockReturnValue({
      user: {
        id: 'test-user-id',
        subscriptionStatus: 'active',
        email: 'test@example.com',
      },
      isAuthenticated: true,
      isLoading: false,
    })
  })

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        {component}
      </QueryClientProvider>
    )
  }

  describe('Premium Auto-Approval Features', () => {
    it('should display auto-approval settings for premium users', async () => {
      renderWithProviders(<HabitApproval children={mockChildren} />)

      await waitFor(() => {
        expect(screen.getByText(/auto-approval settings/i)).toBeInTheDocument()
      })

      expect(screen.getByRole('button', { name: /configure auto-approval/i })).toBeInTheDocument()
    })

    it('should show upgrade prompt for free users', async () => {
      mockUseAuth.mockReturnValue({
        user: {
          id: 'free-user-id',
          subscriptionStatus: 'free',
          email: 'free@example.com',
        },
        isAuthenticated: true,
        isLoading: false,
      })

      renderWithProviders(<HabitApproval children={mockChildren} />)

      await waitFor(() => {
        expect(screen.getByText(/premium feature/i)).toBeInTheDocument()
      })

      expect(screen.getByText(/upgrade to premium/i)).toBeInTheDocument()
    })

    it('should open auto-approval settings modal when configure button is clicked', async () => {
      renderWithProviders(<HabitApproval children={mockChildren} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /configure auto-approval/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /configure auto-approval/i }))

      expect(screen.getByText(/auto-approve after/i)).toBeInTheDocument()
      expect(screen.getByText(/time unit/i)).toBeInTheDocument()
    })
  })

  describe('Auto-Approval Settings Form', () => {
    beforeEach(async () => {
      renderWithProviders(<HabitApproval children={mockChildren} />)
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /configure auto-approval/i })).toBeInTheDocument()
      })

      await user.click(screen.getByRole('button', { name: /configure auto-approval/i }))
    })

    it('should display all time value options', async () => {
      const timeValueDropdown = screen.getByRole('button', { name: /select time value/i })
      await user.click(timeValueDropdown)

      // Check for predefined time values
      const expectedValues = ['1', '2', '3', '4', '5', '6', '8', '12', '24', '48', '72']
      for (const value of expectedValues) {
        expect(screen.getByRole('option', { name: value })).toBeInTheDocument()
      }
    })

    it('should display all time unit options', async () => {
      const timeUnitDropdown = screen.getByRole('button', { name: /select time unit/i })
      await user.click(timeUnitDropdown)

      expect(screen.getByRole('option', { name: 'hours' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'days' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'weeks' })).toBeInTheDocument()
    })

    it('should update time value when selected', async () => {
      const timeValueDropdown = screen.getByRole('button', { name: /select time value/i })
      await user.click(timeValueDropdown)

      await user.click(screen.getByRole('option', { name: '12' }))

      // Verify the dropdown shows the selected value
      expect(screen.getByDisplayValue('12')).toBeInTheDocument()
    })

    it('should update time unit when selected', async () => {
      const timeUnitDropdown = screen.getByRole('button', { name: /select time unit/i })
      await user.click(timeUnitDropdown)

      await user.click(screen.getByRole('option', { name: 'days' }))

      // Verify the dropdown shows the selected value
      expect(screen.getByDisplayValue('days')).toBeInTheDocument()
    })

    it('should enable/disable auto-approval with toggle switch', async () => {
      const enableToggle = screen.getByRole('switch', { name: /enable auto-approval/i })
      
      // Initially should be enabled (based on mock data)
      expect(enableToggle).toBeChecked()

      await user.click(enableToggle)
      expect(enableToggle).not.toBeChecked()

      await user.click(enableToggle)
      expect(enableToggle).toBeChecked()
    })

    it('should display time preview when settings are changed', async () => {
      const timeValueDropdown = screen.getByRole('button', { name: /select time value/i })
      await user.click(timeValueDropdown)
      await user.click(screen.getByRole('option', { name: '6' }))

      const timeUnitDropdown = screen.getByRole('button', { name: /select time unit/i })
      await user.click(timeUnitDropdown)
      await user.click(screen.getByRole('option', { name: 'hours' }))

      expect(screen.getByText(/6 hours/i)).toBeInTheDocument()
    })

    it('should save settings and close modal on successful save', async () => {
      const saveButton = screen.getByRole('button', { name: /save settings/i })
      
      await user.click(saveButton)

      // Modal should close after successful save
      await waitFor(() => {
        expect(screen.queryByText(/auto-approve after/i)).not.toBeInTheDocument()
      })
    })

    it('should display loading state while saving', async () => {
      const saveButton = screen.getByRole('button', { name: /save settings/i })
      
      await user.click(saveButton)

      expect(screen.getByText(/saving.../i)).toBeInTheDocument()
    })
  })

  describe('Child Selection and Habit Management', () => {
    it('should display all children with pending counts', async () => {
      renderWithProviders(<HabitApproval children={mockChildren} />)

      await waitFor(() => {
        expect(screen.getByText('Test Child 1')).toBeInTheDocument()
        expect(screen.getByText('Test Child 2')).toBeInTheDocument()
      })

      expect(screen.getByText('2 pending')).toBeInTheDocument()
    })

    it('should select child when clicked', async () => {
      renderWithProviders(<HabitApproval children={mockChildren} />)

      await waitFor(() => {
        expect(screen.getByText('Test Child 1')).toBeInTheDocument()
      })

      const childButton = screen.getByTestId('select-child-child-1')
      await user.click(childButton)

      expect(childButton).toHaveClass('border-blue-500')
    })

    it('should display auto-approval badge for premium users with enabled settings', async () => {
      renderWithProviders(<HabitApproval children={mockChildren} />)

      await waitFor(() => {
        expect(screen.getByText(/auto-approval enabled/i)).toBeInTheDocument()
      })
    })
  })

  describe('Habit Approval Actions', () => {
    beforeEach(async () => {
      renderWithProviders(<HabitApproval children={mockChildren} />)
      
      await waitFor(() => {
        expect(screen.getByText('Test Child 1')).toBeInTheDocument()
      })

      // Select child to show pending habits
      await user.click(screen.getByTestId('select-child-child-1'))
    })

    it('should show pending habits for selected child', async () => {
      await waitFor(() => {
        expect(screen.getByText(/pending habits/i)).toBeInTheDocument()
      })
    })

    it('should approve habit when approve button is clicked', async () => {
      await waitFor(() => {
        const approveButton = screen.getByRole('button', { name: /approve/i })
        expect(approveButton).toBeInTheDocument()
      })

      const approveButton = screen.getByRole('button', { name: /approve/i })
      await user.click(approveButton)

      // Should show success message
      await waitFor(() => {
        expect(screen.getByText(/habit approved/i)).toBeInTheDocument()
      })
    })

    it('should require feedback message when rejecting habit', async () => {
      await waitFor(() => {
        const rejectButton = screen.getByRole('button', { name: /reject/i })
        expect(rejectButton).toBeInTheDocument()
      })

      const rejectButton = screen.getByRole('button', { name: /reject/i })
      await user.click(rejectButton)

      // Try to submit without message
      const submitRejectButton = screen.getByRole('button', { name: /send feedback/i })
      await user.click(submitRejectButton)

      expect(screen.getByText(/message required/i)).toBeInTheDocument()
    })

    it('should reject habit with feedback message', async () => {
      await waitFor(() => {
        const rejectButton = screen.getByRole('button', { name: /reject/i })
        expect(rejectButton).toBeInTheDocument()
      })

      const rejectButton = screen.getByRole('button', { name: /reject/i })
      await user.click(rejectButton)

      const feedbackTextarea = screen.getByPlaceholderText(/provide feedback/i)
      await user.type(feedbackTextarea, 'Please try again with more effort')

      const submitRejectButton = screen.getByRole('button', { name: /send feedback/i })
      await user.click(submitRejectButton)

      await waitFor(() => {
        expect(screen.getByText(/feedback sent/i)).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should display error message when API calls fail', async () => {
      // Mock API failure
      vi.mocked(fetch).mockRejectedValueOnce(new Error('API Error'))

      renderWithProviders(<HabitApproval children={mockChildren} />)

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument()
      })
    })

    it('should handle network errors gracefully', async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error('Network Error'))

      renderWithProviders(<HabitApproval children={mockChildren} />)

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels for all interactive elements', async () => {
      renderWithProviders(<HabitApproval children={mockChildren} />)

      await waitFor(() => {
        const configureButton = screen.getByRole('button', { name: /configure auto-approval/i })
        expect(configureButton).toHaveAttribute('aria-label')
      })
    })

    it('should support keyboard navigation', async () => {
      renderWithProviders(<HabitApproval children={mockChildren} />)

      await waitFor(() => {
        const configureButton = screen.getByRole('button', { name: /configure auto-approval/i })
        expect(configureButton).toBeInTheDocument()
      })

      const configureButton = screen.getByRole('button', { name: /configure auto-approval/i })
      
      // Test keyboard activation
      configureButton.focus()
      fireEvent.keyDown(configureButton, { key: 'Enter', code: 'Enter' })

      expect(screen.getByText(/auto-approve after/i)).toBeInTheDocument()
    })
  })
})