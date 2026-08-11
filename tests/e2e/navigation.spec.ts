import { test, expect, type APIRequestContext, type Page } from '@playwright/test'

// Navigation round-trips on the iPhone profile: a user must be able to
// enter EVERY module and come back out — no dead ends, ever.
//   npx playwright test tests/e2e/navigation.spec.ts --project="Mobile Safari"

const uniq = Date.now()
const parentEmail = `pw-nav${uniq}@e2e.local`
const password = 'Playwright1!'
const kidUsername = `pwnav${uniq}`
const kidPin = '3434'

let familyCode = ''
let childId = ''

test.beforeAll(async ({ playwright, baseURL }) => {
  const api: APIRequestContext = await playwright.request.newContext({ baseURL: baseURL! })
  await api.post('/api/auth/register', {
    data: { email: parentEmail, password, firstName: 'Nav', lastName: 'Tester' },
  })
  await api.post('/api/auth/login', { data: { email: parentEmail, password } })
  familyCode = (await (await api.get('/api/auth/user')).json()).familyCode
  const child = await (
    await api.post('/api/children', {
      data: {
        name: 'Navvy', avatarType: 'ninja', age: 8, level: 1, xp: 0, totalXp: 0,
        rewardPoints: 200, unlockedAvatars: [], unlockedGear: [],
      },
    })
  ).json()
  childId = child.id
  await api.patch(`/api/children/${childId}`, { data: { username: kidUsername, pin: kidPin } })
  // several habits so the Habits section is long enough to force scrolling
  for (let i = 1; i <= 6; i++) {
    await api.post('/api/habits/master', {
      data: { name: `Habit ${i}`, icon: '🎯', xpReward: 50, color: 'turquoise', frequency: 'daily' },
    })
  }
  // one owned game so the kid Game Zone has a playable entry
  const kidApi = await playwright.request.newContext({ baseURL: baseURL! })
  await kidApi.post('/api/auth/child-login', { data: { familyCode, username: kidUsername, pin: kidPin } })
  const p = await (await kidApi.post(`/api/children/${childId}/game-purchases`, { data: { gameId: 'memory-flip' } })).json()
  await api.post(`/api/game-purchases/${p.id}/review`, { data: { approve: true } })
  await api.dispose()
  await kidApi.dispose()
})

async function parentLogin(page: Page) {
  await page.goto('/parent/auth')
  await page.getByRole('tab', { name: /sign in/i }).click()
  await page.getByTestId('input-login-email').fill(parentEmail)
  await page.getByTestId('input-login-password').fill(password)
  await page.getByTestId('button-login').click()
  await expect(page.getByTestId('sidebar-parent-dashboard')).toBeVisible({ timeout: 30000 })
}

/** The nav bar must be ON SCREEN (not just in the DOM) right now. */
async function navBarOnScreen(page: Page) {
  const box = await page.getByTestId('sidebar-parent-dashboard').boundingBox()
  const viewport = page.viewportSize()!
  expect(box, 'nav bar must have a box').toBeTruthy()
  // Fixed bottom nav: must sit within the viewport, in the thumb zone
  expect(box!.y, 'nav bar must be inside the viewport').toBeGreaterThan(viewport.height / 2)
  expect(box!.y + box!.height, 'nav bar must not hang off-screen').toBeLessThanOrEqual(viewport.height + 2)
}

test('parent can enter every module and return to Overview — even after scrolling deep', async ({ page }) => {
  test.setTimeout(300_000)
  await parentLogin(page)

  const sections: Array<{ id: string; marker: RegExp }> = [
    { id: 'children', marker: /no login/i },
    { id: 'habits', marker: /master habits/i },
    { id: 'rewards', marker: /reward/i },
    { id: 'progress', marker: /progress/i },
    { id: 'settings', marker: /settings|controls/i },
  ]

  for (const section of sections) {
    // Every section sits directly on the bottom nav — no "More" sheet
    await page.getByTestId(`sidebar-item-${section.id}`).click()
    await expect(page.getByText(section.marker).first()).toBeVisible({ timeout: 20000 })

    // Scroll to the very bottom of the module — the escape route must
    // still be on screen (sticky nav)
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await page.waitForTimeout(400)
    await navBarOnScreen(page)

    // ...and actually usable: go home
    await page.getByTestId('sidebar-item-overview').click()
    await expect(page.getByTestId('overview-add-child')).toBeVisible({ timeout: 20000 })
    await page.evaluate(() => window.scrollTo(0, 0))
  }
})

test('parent can open and escape the Assign Habit screen', async ({ page }) => {
  test.setTimeout(240_000)
  await parentLogin(page)
  await page.getByTestId('sidebar-item-habits').click()
  await expect(page.getByText(/master habits/i).first()).toBeVisible({ timeout: 20000 })

  // Drill in: first habit → detail → Assign
  await page.locator('[data-testid^="habit-row-"]').first().locator('button').first().click()
  await expect(page.getByTestId('habit-detail')).toBeVisible({ timeout: 20000 })
  await page.getByTestId('detail-action-assign').click()
  await expect(page.getByTestId('habit-assign-screen')).toBeVisible({ timeout: 20000 })

  // The escape route (Done) is always on screen in the thumb zone
  await expect(page.getByTestId('assign-done')).toBeInViewport()
  await page.getByTestId('assign-done').click()
  await expect(page.getByTestId('habit-assign-screen')).not.toBeVisible()

  // Back out of the detail, then the bottom nav still takes us home
  await page.getByTestId('habit-back').click()
  await page.getByTestId('sidebar-item-overview').click()
  await expect(page.getByTestId('overview-add-child')).toBeVisible({ timeout: 20000 })
})

test('parent can leave Alert Settings via BOTH the back arrow and the X', async ({ page }) => {
  test.setTimeout(240_000)

  // Exit via the back arrow
  await parentLogin(page)
  await page.getByTestId('button-global-alert-settings').click()
  await expect(page).toHaveURL(/\/alert-settings/, { timeout: 20000 })
  await expect(page.getByTestId('button-back')).toBeVisible()
  await page.getByTestId('button-back').click()
  await expect(page.getByTestId('sidebar-parent-dashboard')).toBeVisible({ timeout: 30000 })

  // ...and via the X
  await page.getByTestId('button-global-alert-settings').click()
  await expect(page).toHaveURL(/\/alert-settings/, { timeout: 20000 })
  await page.getByTestId('button-close').click()
  await expect(page.getByTestId('sidebar-parent-dashboard')).toBeVisible({ timeout: 30000 })
})

test('parent can leave Progress Reports back to the dashboard', async ({ page }) => {
  test.setTimeout(240_000)
  await parentLogin(page)
  await page.goto('/progress-reports')
  await expect(page.getByText(/progress reports/i).first()).toBeVisible({ timeout: 30000 })
  // The back arrow links to /parent
  await page.locator('a[href="/parent"]').first().click()
  await expect(page.getByTestId('sidebar-parent-dashboard')).toBeVisible({ timeout: 30000 })
})

test('kid can move between every tab and exit a game back to the Game Zone', async ({ page }) => {
  test.setTimeout(300_000)
  await page.goto('/kids-login')
  await page.locator('input[maxlength="8"]').fill(familyCode)
  await page.locator('form input[type="text"]:not([maxlength="8"])').first().fill(kidUsername)
  await page.locator('input[maxlength="4"]').fill(kidPin)
  await page.getByRole('button', { name: /start.*adventure|login|let's go/i }).first().click()
  // Kid navigation is now a bottom nav bar (buttons with aria-selected)
  await expect(page.getByTestId('kid-tab-games')).toBeVisible({ timeout: 30000 })

  // Round-trip through every kid tab
  for (const tab of ['customize', 'rewards', 'games', 'progress', 'missions']) {
    await page.getByTestId(`kid-tab-${tab}`).click()
    await page.waitForTimeout(600)
    await expect(page.getByTestId(`kid-tab-${tab}`)).toHaveAttribute('aria-selected', 'true')
  }

  // Enter a game and come back out
  await page.getByTestId('kid-tab-games').click()
  await page.getByTestId('game-play-memory-flip').click()
  await expect(page.getByText('Memory Flip Quest').first()).toBeVisible({ timeout: 30000 })
  await page.getByTestId('game-exit').click()
  await expect(page.getByText('Game Zone')).toBeVisible({ timeout: 20000 })
})
