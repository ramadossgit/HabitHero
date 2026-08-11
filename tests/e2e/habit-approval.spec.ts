import { test, expect, type APIRequestContext } from '@playwright/test'

// Habit approval E2E against the real app + database (no mocked routes):
// a child completes a habit, the parent reviews it in the dashboard, and
// XP/points are only granted after approval — the core loop of the app.

const uniq = Date.now()
const parentEmail = `pw-approval${uniq}@e2e.local`
const parentPassword = 'Playwright1!'

let childId = ''

async function seed(api: APIRequestContext) {
  await api.post('/api/auth/register', {
    data: { email: parentEmail, password: parentPassword, firstName: 'Approve', lastName: 'Family' },
  })
  await api.post('/api/auth/login', { data: { email: parentEmail, password: parentPassword } })

  const child = await (
    await api.post('/api/children', {
      data: {
        name: 'Nova', avatarType: 'ninja', age: 9, level: 1, xp: 0, totalXp: 0,
        rewardPoints: 0, unlockedAvatars: [], unlockedGear: [],
      },
    })
  ).json()
  childId = child.id

  const habit = await (
    await api.post(`/api/children/${childId}/habits`, {
      data: { name: 'Make the Bed', icon: '🛏️', xpReward: 40, color: 'mint', frequency: 'daily' },
    })
  ).json()

  // Child completes the habit (goes to pending — no reward yet)
  await api.post(`/api/habits/${habit.id}/complete`, { data: {} })
}

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ playwright, baseURL }) => {
  const api = await playwright.request.newContext({ baseURL: baseURL! })
  await seed(api)
  await api.dispose()
})

test('parent reviews and approves a pending habit; rewards only flow after approval', async ({ page, playwright, baseURL }) => {
  // Sanity: completion is pending, nothing awarded yet
  const api = await playwright.request.newContext({ baseURL: baseURL! })
  await api.post('/api/auth/login', { data: { email: parentEmail, password: parentPassword } })
  let child = await (await api.get(`/api/children/${childId}`)).json()
  expect(child.totalXp).toBe(0)
  expect(child.rewardPoints).toBe(0)

  // Parent logs in through the UI
  await page.goto('/parent/auth')
  await page.getByRole('tab', { name: /sign in/i }).click()
  await page.getByTestId('input-login-email').fill(parentEmail)
  await page.getByTestId('input-login-password').fill(parentPassword)
  await page.getByTestId('button-login').click()
  await expect(page.getByTestId('sidebar-parent-dashboard')).toBeVisible()

  // Habits section → open the Approvals screen
  await page.getByTestId('sidebar-item-habits').click()
  await page.getByTestId('habits-approvals-banner').click()
  await expect(page.getByTestId('select-child-' + childId)).toBeVisible()
  await page.getByTestId('select-child-' + childId).click()
  await expect(page.getByText('Make the Bed')).toBeVisible()

  // Approve it
  await page.locator('[data-testid^="approve-habit-"]').first().click()
  await expect(page.getByText(/no pending habits for this child/i)).toBeVisible()

  // XP and points are granted only now
  await expect(async () => {
    child = await (await api.get(`/api/children/${childId}`)).json()
    expect(child.totalXp).toBe(40)
    expect(child.rewardPoints).toBeGreaterThan(0)
  }).toPass({ timeout: 15000 })

  await api.dispose()
})

test('premium auto-approval settings are reachable from the dashboard', async ({ page }) => {
  await page.goto('/parent/auth')
  await page.getByRole('tab', { name: /sign in/i }).click()
  await page.getByTestId('input-login-email').fill(parentEmail)
  await page.getByTestId('input-login-password').fill(parentPassword)
  await page.getByTestId('button-login').click()
  await expect(page.getByTestId('sidebar-parent-dashboard')).toBeVisible()

  await page.getByTestId('sidebar-item-habits').click()
  await page.getByTestId('habits-approvals-banner').click()
  // Trial accounts have premium access during the trial window.
  // Scope to the Habit Approvals card — the sidebar also has a "Settings" item.
  const approvalCard = page.locator('div.fun-card', { hasText: 'Approvals' })
  await expect(approvalCard).toBeVisible()
  await approvalCard.getByRole('button', { name: /settings/i }).click()
  await expect(page.getByText(/premium auto-approval settings/i)).toBeVisible()
  await expect(page.getByText(/enable auto-approval/i)).toBeVisible()
})
