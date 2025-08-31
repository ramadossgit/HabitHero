import { test, expect } from '@playwright/test'

test.describe('Habit Approval E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.route('**/api/auth/user', async route => {
      await route.fulfill({
        json: {
          id: 'test-user-id',
          email: 'test@example.com',
          firstName: 'Test',
          lastName: 'User',
          subscriptionStatus: 'active',
        }
      })
    })

    // Mock children data
    await page.route('**/api/children', async route => {
      await route.fulfill({
        json: [
          { id: 'child-1', name: 'Test Child 1', pendingCount: 2 },
          { id: 'child-2', name: 'Test Child 2', pendingCount: 0 },
        ]
      })
    })

    // Mock auto-approval settings
    await page.route('**/api/auto-approval-settings', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          json: {
            enabled: true,
            timeValue: 24,
            timeUnit: 'hours',
            applyToAllChildren: true,
            childSpecificSettings: {},
          }
        })
      } else {
        await route.fulfill({ json: { success: true } })
      }
    })

    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('should display auto-approval settings for premium users', async ({ page }) => {
    // Navigate to habit approval section
    await page.click('text=Habit Management')
    await page.waitForSelector('[data-testid="habit-approval-section"]')

    // Check for auto-approval settings
    await expect(page.locator('text=Auto-Approval Settings')).toBeVisible()
    await expect(page.locator('button:has-text("Configure Auto-Approval")')).toBeVisible()
  })

  test('should open and configure auto-approval settings', async ({ page }) => {
    await page.click('text=Habit Management')
    await page.waitForSelector('[data-testid="habit-approval-section"]')

    // Open auto-approval settings
    await page.click('button:has-text("Configure Auto-Approval")')
    
    // Wait for settings modal to open
    await expect(page.locator('text=Auto-approve after')).toBeVisible()
    await expect(page.locator('text=Time unit')).toBeVisible()

    // Test time value selection
    await page.click('[data-testid="select-time-value"]')
    await page.click('text=12')

    // Test time unit selection
    await page.click('[data-testid="select-time-unit"]')
    await page.click('text=days')

    // Verify preview text updates
    await expect(page.locator('text=12 days')).toBeVisible()

    // Save settings
    await page.click('button:has-text("Save Settings")')

    // Verify modal closes
    await expect(page.locator('text=Auto-approve after')).not.toBeVisible()

    // Verify success message
    await expect(page.locator('text=Settings Updated')).toBeVisible()
  })

  test('should select child and manage pending habits', async ({ page }) => {
    await page.click('text=Habit Management')
    await page.waitForSelector('[data-testid="habit-approval-section"]')

    // Select child with pending habits
    await page.click('[data-testid="select-child-child-1"]')

    // Verify child is selected
    await expect(page.locator('[data-testid="select-child-child-1"]')).toHaveClass(/border-blue-500/)

    // Check for pending habits section
    await expect(page.locator('text=Pending Habits')).toBeVisible()
  })

  test('should approve and reject habits', async ({ page }) => {
    // Mock pending habits
    await page.route('**/api/pending-habits/all', async route => {
      await route.fulfill({
        json: [
          {
            completion: { id: 'completion-1', habitId: 'habit-1' },
            child: { id: 'child-1', name: 'Test Child 1' },
            habit: { id: 'habit-1', title: 'Brush Teeth' }
          }
        ]
      })
    })

    // Mock approval endpoint
    await page.route('**/api/habit-completions/*/approve', async route => {
      await route.fulfill({ json: { success: true } })
    })

    await page.click('text=Habit Management')
    await page.click('[data-testid="select-child-child-1"]')

    // Approve habit
    await page.click('button:has-text("Approve")')
    await expect(page.locator('text=Habit Approved')).toBeVisible()
  })

  test('should handle mobile responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 812 })
    
    await page.click('text=Habit Management')
    
    // Verify mobile-friendly layout
    await expect(page.locator('[data-testid="habit-approval-section"]')).toBeVisible()
    
    // Check that settings button is accessible on mobile
    await page.click('button:has-text("Configure Auto-Approval")')
    await expect(page.locator('text=Auto-approve after')).toBeVisible()
  })

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate network error
    await page.route('**/api/auto-approval-settings', route => route.abort())
    
    await page.click('text=Habit Management')
    
    // Should show error state
    await expect(page.locator('text=Error loading settings')).toBeVisible()
  })

  test('should validate accessibility requirements', async ({ page }) => {
    await page.click('text=Habit Management')
    
    // Check ARIA labels
    const configureButton = page.locator('button:has-text("Configure Auto-Approval")')
    await expect(configureButton).toHaveAttribute('aria-label')
    
    // Test keyboard navigation
    await page.keyboard.press('Tab')
    await page.keyboard.press('Enter')
    
    // Should open settings modal
    await expect(page.locator('text=Auto-approve after')).toBeVisible()
  })

  test('should handle premium vs free user restrictions', async ({ page }) => {
    // Mock free user
    await page.route('**/api/auth/user', async route => {
      await route.fulfill({
        json: {
          id: 'free-user-id',
          subscriptionStatus: 'free',
        }
      })
    })

    await page.reload()
    await page.click('text=Habit Management')

    // Should show premium upgrade prompt
    await expect(page.locator('text=Premium Feature')).toBeVisible()
    await expect(page.locator('text=Upgrade to Premium')).toBeVisible()

    // Auto-approval settings should not be available
    await expect(page.locator('button:has-text("Configure Auto-Approval")')).not.toBeVisible()
  })
})