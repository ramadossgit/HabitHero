import { test, expect, type APIRequestContext, type Page } from '@playwright/test'

// Phone-viewport journeys for the mobile/tablet pilot — run under the
// mobile emulation projects:
//   npx playwright test tests/e2e/mobile-journey.spec.ts --project="Mobile Chrome"
//
// Covers what families actually do on phones:
//   • kid: login → complete a mission → buy a game → play it
//   • parent: login → bottom nav → approve the habit → approve the game

const uniq = Date.now()
const parentEmail = `pw-mobile${uniq}@e2e.local`
const parentPassword = 'Playwright1!'
const kidUsername = `pwmob${uniq}`
const kidPin = '9876'

let familyCode = ''
let childId = ''
let habitId = ''

async function seedFamily(api: APIRequestContext) {
  const reg = await api.post('/api/auth/register', {
    data: { email: parentEmail, password: parentPassword, firstName: 'Mobile', lastName: 'Pilot' },
  })
  expect(reg.ok(), await reg.text()).toBeTruthy()

  await api.post('/api/auth/login', { data: { email: parentEmail, password: parentPassword } })
  familyCode = (await (await api.get('/api/auth/user')).json()).familyCode

  const child = await (
    await api.post('/api/children', {
      data: {
        name: 'Tappy', avatarType: 'robot', age: 7, level: 1, xp: 0, totalXp: 0,
        rewardPoints: 100, unlockedAvatars: [], unlockedGear: [],
      },
    })
  ).json()
  childId = child.id
  await api.patch(`/api/children/${childId}`, { data: { username: kidUsername, pin: kidPin } })

  const habit = await (
    await api.post(`/api/children/${childId}/habits`, {
      data: { name: 'Water the Plants', icon: '🪴', xpReward: 30, color: 'mint', frequency: 'daily' },
    })
  ).json()
  habitId = habit.id
}

async function kidLogin(page: Page) {
  await page.goto('/kids-login')
  await page.locator('input[maxlength="8"]').fill(familyCode)
  await page.locator('form input[type="text"]:not([maxlength="8"])').first().fill(kidUsername)
  await page.locator('input[maxlength="4"]').fill(kidPin)
  await page.getByRole('button', { name: /start.*adventure|login|let's go/i }).first().click()
  // Tabs are icon-only on phones; aria-labels make them addressable
  await expect(page.getByTestId('kid-tab-games')).toBeVisible({ timeout: 30000 })
}

async function parentLogin(page: Page) {
  await page.goto('/parent/auth')
  await page.getByRole('tab', { name: /sign in/i }).click()
  await page.getByTestId('input-login-email').fill(parentEmail)
  await page.getByTestId('input-login-password').fill(parentPassword)
  await page.getByTestId('button-login').click()
  // The pill navigation bar is always visible — every section is one tap away
  await expect(page.getByTestId('sidebar-parent-dashboard')).toBeVisible({ timeout: 30000 })
}

/** Tap a primary section in the bottom nav. */
async function parentNav(page: Page, sectionTestId: string) {
  await page.getByTestId(sectionTestId).click()
}

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ playwright, baseURL }) => {
  const api = await playwright.request.newContext({ baseURL: baseURL! })
  await seedFamily(api)
  await api.dispose()
})

test('kid on a phone: completes a mission and requests a game', async ({ page }) => {
  test.setTimeout(300_000)
  await kidLogin(page)

  // Missions tab: complete the seeded habit
  await page.getByTestId('kid-tab-missions').click()
  await page.getByTestId(`complete-habit-${habitId}`).click()
  await expect(page.getByText(/pending/i).first()).toBeVisible({ timeout: 20000 })

  // Game Zone: buy a game with points earned from habits
  await page.getByTestId('kid-tab-games').click()
  await expect(page.getByText('Game Zone')).toBeVisible({ timeout: 20000 })
  await page.getByTestId('game-buy-memory-flip').click()
  await expect(
    page.locator('[data-testid="game-card-memory-flip"]').getByText(/waiting for your parent/i),
  ).toBeVisible({ timeout: 20000 })
})

test('parent on a phone: approves the habit and the game via bottom nav', async ({ page }) => {
  test.setTimeout(300_000)
  await parentLogin(page)

  // Approve the habit completion — reached via the Approvals banner
  await parentNav(page, 'sidebar-item-habits')
  await page.getByTestId('habits-approvals-banner').click()
  await page.getByTestId(`select-child-${childId}`).click()
  await expect(page.getByText('Water the Plants')).toBeVisible({ timeout: 20000 })
  await page.locator('[data-testid^="approve-habit-"]').first().click()
  await expect(page.getByText(/no pending habits for this child/i)).toBeVisible({ timeout: 20000 })

  // Approve the game purchase — under the Rewards "Approvals" tab
  await parentNav(page, 'sidebar-item-rewards')
  await page.getByTestId('rewards-tab-approvals').click()
  await expect(page.getByText(/game purchase requests/i)).toBeVisible({ timeout: 20000 })
  await page.locator('[data-testid^="approve-game-purchase-"]').first().click()
  await expect(page.getByText(/no pending game requests/i)).toBeVisible({ timeout: 20000 })
})

test('kid on a phone: plays the approved game engine', async ({ page }) => {
  test.setTimeout(300_000)
  await kidLogin(page)

  await page.getByTestId('kid-tab-games').click()
  await page.getByTestId('game-play-memory-flip').click()

  // The React Native engine renders at phone size via react-native-web
  await expect(page.getByText('Memory Flip Quest').first()).toBeVisible({ timeout: 30000 })
  await page.getByTestId('game-exit').click()
  await expect(page.getByText('Game Zone')).toBeVisible({ timeout: 20000 })
})
