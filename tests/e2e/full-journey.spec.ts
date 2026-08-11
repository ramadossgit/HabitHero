import { test, expect, type APIRequestContext, type Page } from '@playwright/test'

// Full UI journey against the real app + database (no mocked routes):
//   parent signup → kid login → age-filtered Game Zone → buy a game →
//   parent approves → kid plays a real game engine → Stripe (dev mode).
//
// Requires the dev server (npm run dev) — playwright.config.ts starts it
// automatically when it isn't already running.

const uniq = Date.now()
const parentEmail = `pw-parent${uniq}@e2e.local`
const parentPassword = 'Playwright1!'
const kidUsername = `pwkid${uniq}`
const kidPin = '4321'

let familyCode = ''
let childId = ''

/** Seed a family through the API: parent, child (age 7), habit, points. */
async function seedFamily(api: APIRequestContext) {
  const reg = await api.post('/api/auth/register', {
    data: { email: parentEmail, password: parentPassword, firstName: 'Play', lastName: 'Wright' },
  })
  expect(reg.ok()).toBeTruthy()

  await api.post('/api/auth/login', { data: { email: parentEmail, password: parentPassword } })
  const me = await (await api.get('/api/auth/user')).json()
  familyCode = me.familyCode

  const child = await (
    await api.post('/api/children', {
      data: {
        name: 'Pixel', avatarType: 'robot', age: 7, level: 1, xp: 0, totalXp: 0,
        rewardPoints: 0, unlockedAvatars: [], unlockedGear: [],
      },
    })
  ).json()
  childId = child.id

  await api.patch(`/api/children/${childId}`, { data: { username: kidUsername, pin: kidPin } })
  await api.post(`/api/children/${childId}/habits`, {
    data: { name: 'Read a Book', icon: '📚', xpReward: 50, color: 'mint', frequency: 'daily' },
  })
  await api.patch(`/api/children/${childId}/reward-points`, { data: { pointsGained: 200 } })
}

async function kidLogin(page: Page) {
  await page.goto('/kids-login')
  await page.locator('input[maxlength="8"]').fill(familyCode)
  // The username field is the remaining plain text input
  await page.locator('form input[type="text"]:not([maxlength="8"])').first().fill(kidUsername)
  await page.locator('input[maxlength="4"]').fill(kidPin)
  await page.getByRole('button', { name: /start.*adventure|login|let's go/i }).first().click()
  await expect(page.getByRole('tab', { name: /games/i })).toBeVisible({ timeout: 20000 })
}

async function parentLogin(page: Page) {
  await page.goto('/parent/auth')
  // The auth page defaults to the Sign Up tab
  await page.getByRole('tab', { name: /sign in/i }).click()
  await page.getByTestId('input-login-email').fill(parentEmail)
  await page.getByTestId('input-login-password').fill(parentPassword)
  await page.getByTestId('button-login').click()
  await expect(page.getByTestId('sidebar-parent-dashboard')).toBeVisible({ timeout: 30000 })
}

test.describe.configure({ mode: 'serial' })

test.beforeAll(async ({ playwright, baseURL }) => {
  const api = await playwright.request.newContext({ baseURL: baseURL! })
  await seedFamily(api)
  await api.dispose()
})

test('parent can sign up through the UI', async ({ page }) => {
  await page.goto('/parent/auth')
  await page.getByRole('tab', { name: /sign up/i }).click()

  await page.getByTestId('input-register-firstname').fill('New')
  await page.getByTestId('input-register-lastname').fill('Parent')
  await page.getByTestId('input-register-email').fill(`pw-signup${Date.now()}@e2e.local`)
  await page.getByTestId('input-register-password').fill(parentPassword)
  await page.getByTestId('input-register-confirm-password').fill(parentPassword)

  const registerResponse = page.waitForResponse(
    (res) => res.url().includes('/api/auth/register'),
    { timeout: 30000 },
  )
  await page.getByTestId('button-register').click()
  const res = await registerResponse
  expect(res.status(), `register response: ${await res.text().catch(() => '?')}`).toBeLessThan(300)

  // Registration logs the parent in; new parents see the dashboard with
  // the family code banner and first-hero onboarding
  await expect(page.getByText(/family code/i).first()).toBeVisible({ timeout: 30000 })
  await expect(page.getByText(/first hero/i).first()).toBeVisible({ timeout: 20000 })
})

test('kid journey: login → age-filtered arcade → purchase → parent approval → play', async ({ browser }) => {
  test.setTimeout(600_000) // long multi-actor journey; dev-server transforms are slow on first load
  const kidContext = await browser.newContext()
  const parentContext = await browser.newContext()
  const kidPage = await kidContext.newPage()
  const parentPage = await parentContext.newPage()

  await test.step('kid logs in and opens the Game Zone', async () => {
    await kidLogin(kidPage)
    await kidPage.getByRole('tab', { name: /games/i }).click()
    await expect(kidPage.getByText('Game Zone')).toBeVisible({ timeout: 20000 })
  })

  await test.step('catalog is filtered to ages 3-8 (17 games, no 9-12 titles)', async () => {
    await expect(kidPage.locator('[data-testid^="game-card-"]')).toHaveCount(17, { timeout: 20000 })
    await expect(kidPage.locator('[data-testid="game-card-sudoku"]')).toHaveCount(0)
  })

  await test.step('kid buys a game and sees the waiting-for-parent state', async () => {
    await kidPage.getByTestId('game-buy-memory-flip').click()
    await expect(
      kidPage.locator('[data-testid="game-card-memory-flip"]').getByText(/waiting for your parent/i),
    ).toBeVisible({ timeout: 20000 })
  })

  await test.step('parent sees the request and approves it', async () => {
    await parentLogin(parentPage)
    await parentPage.getByTestId('sidebar-item-rewards').click()
    await expect(parentPage.getByText(/game purchase requests/i)).toBeVisible({ timeout: 20000 })
    await expect(parentPage.getByText(/wants to buy/i)).toBeVisible({ timeout: 20000 })

    await parentPage.locator('[data-testid^="approve-game-purchase-"]').first().click()
    await expect(parentPage.getByText(/no pending game requests/i)).toBeVisible({ timeout: 20000 })
  })

  await test.step('kid can now play level 1 of the real game engine', async () => {
    await kidPage.reload()
    await kidPage.getByRole('tab', { name: /games/i }).click()
    await kidPage.getByTestId('game-play-memory-flip').click()

    // The React Native engine renders in the browser via react-native-web
    await expect(kidPage.getByText('Memory Flip Quest').first()).toBeVisible({ timeout: 20000 })
    await expect(kidPage.getByText(/level 1/i).first()).toBeVisible()

    await kidPage.getByTestId('game-exit').click()
    await expect(kidPage.getByText('Game Zone')).toBeVisible({ timeout: 20000 })
  })

  await test.step('locked levels show their unlock cost', async () => {
    const level2Chip = kidPage.getByTestId('game-memory-flip-level-2')
    await expect(level2Chip).toBeVisible()
    await expect(level2Chip).toContainText('30') // 50% of the 60-point purchase
  })

  await kidContext.close()
  await parentContext.close()
})

test('subscription flow works end to end (dev mode without Stripe key)', async ({ page }) => {
  test.setTimeout(120_000)
  await parentLogin(page)
  await page.goto('/subscription')

  await page.getByRole('button', { name: /subscribe|upgrade now/i }).first().click()

  // Without STRIPE_SECRET_KEY the server simulates activation in dev mode;
  // with a key this becomes a redirect to the Stripe payment page instead.
  await expect(
    page.getByText(/premium activated \(dev mode\)|redirecting to payment/i).first(),
  ).toBeVisible({ timeout: 20000 })
})
