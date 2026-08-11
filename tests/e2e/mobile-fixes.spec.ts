import { test, expect, type APIRequestContext, type Page } from '@playwright/test'

// Regression suite for the mobile pilot bug batch (2026-07-09):
//   • Create First Hero page collects the child's age
//   • Parent dashboard controls fit a phone screen (header/nav/banner wrap)
//   • "Children & PINs" is reachable from the left menu
//   • Habit health score counts a habit once even after a rejected redo
//   • Shape Match drags respond to touch (touch-action: none)
//   • Exiting a game mid-animation doesn't crash the app (RN `global` shim)
//
// Run at phone size:
//   npx playwright test tests/e2e/mobile-fixes.spec.ts --project="Mobile Chrome"

const uniq = Date.now()
const parentEmail = `pw-fixes${uniq}@e2e.local`
const freshEmail = `pw-fixes-fresh${uniq}@e2e.local`
const password = 'Playwright1!'
const kidUsername = `pwfix${uniq}`
const kidPin = '5151'

let familyCode = ''
let childId = ''

async function noHorizontalOverflow(page: Page) {
  const m = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth
    const inScrollableRow = (el: Element): boolean => {
      for (let p = el.parentElement; p; p = p.parentElement) {
        const ox = getComputedStyle(p).overflowX
        if ((ox === 'auto' || ox === 'scroll') && p.scrollWidth > p.clientWidth) return true
      }
      return false
    }
    let worst = 0
    for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect()
      // ignore off-canvas elements (left < 0) and rows that scroll on purpose
      if (r.width > 0 && r.left >= 0 && r.right > vw + 1 && !inScrollableRow(el)) {
        worst = Math.max(worst, r.right - vw)
      }
    }
    return { scrollW: document.documentElement.scrollWidth, vw, worst: Math.round(worst) }
  })
  expect(m.scrollW, 'page must not scroll horizontally').toBeLessThanOrEqual(m.vw + 1)
  expect(m.worst, 'no control may stick out past the viewport').toBeLessThanOrEqual(2)
}

test.beforeAll(async ({ playwright, baseURL }) => {
  const api: APIRequestContext = await playwright.request.newContext({ baseURL: baseURL! })
  await api.post('/api/auth/register', {
    data: { email: parentEmail, password, firstName: 'Fix', lastName: 'Family' },
  })
  await api.post('/api/auth/login', { data: { email: parentEmail, password } })
  familyCode = (await (await api.get('/api/auth/user')).json()).familyCode

  const child = await (
    await api.post('/api/children', {
      data: {
        name: 'Pixelina', avatarType: 'princess', age: 6, level: 1, xp: 0, totalXp: 0,
        rewardPoints: 500, unlockedAvatars: [], unlockedGear: [],
      },
    })
  ).json()
  childId = child.id
  await api.patch(`/api/children/${childId}`, { data: { username: kidUsername, pin: kidPin } })

  // habit with a rejected first attempt and a redo (the old 200% scenario)
  const habit = await (
    await api.post(`/api/children/${childId}/habits`, {
      data: { name: 'Tidy Up', icon: '🧹', xpReward: 20, color: 'mint', frequency: 'daily' },
    })
  ).json()
  const kidApi = await playwright.request.newContext({ baseURL: baseURL! })
  await kidApi.post('/api/auth/child-login', { data: { familyCode, username: kidUsername, pin: kidPin } })
  await kidApi.post(`/api/habits/${habit.id}/complete`, { data: {} })
  const comps = await (await api.get(`/api/children/${childId}/completions/today`)).json()
  await api.post(`/api/habit-completions/${comps[0].id}/reject`, { data: { message: 'redo' } })
  await kidApi.post(`/api/habits/${habit.id}/complete`, { data: {} })

  // own two games: one drag-based, one with continuous animation
  for (const gameId of ['shape-match', 'math-runner']) {
    const p = await (await kidApi.post(`/api/children/${childId}/game-purchases`, { data: { gameId } })).json()
    await api.post(`/api/game-purchases/${p.id}/review`, { data: { approve: true } })
  }
  await api.dispose()
  await kidApi.dispose()
})

async function kidLogin(page: Page) {
  await page.goto('/kids-login')
  await page.locator('input[maxlength="8"]').fill(familyCode)
  await page.locator('form input[type="text"]:not([maxlength="8"])').first().fill(kidUsername)
  await page.locator('input[maxlength="4"]').fill(kidPin)
  await page.getByRole('button', { name: /start.*adventure|login|let's go/i }).first().click()
  await expect(page.getByTestId('kid-tab-games')).toBeVisible({ timeout: 30000 })
}

test('Create First Hero collects age and fits the phone screen', async ({ playwright, baseURL, page }) => {
  const api = await playwright.request.newContext({ baseURL: baseURL! })
  await api.post('/api/auth/register', {
    data: { email: freshEmail, password, firstName: 'Fresh', lastName: 'Fix' },
  })
  await api.dispose()

  await page.goto('/parent/auth')
  await page.getByRole('tab', { name: /sign in/i }).click()
  await page.getByTestId('input-login-email').fill(freshEmail)
  await page.getByTestId('input-login-password').fill(password)
  await page.getByTestId('button-login').click()

  await expect(page.getByTestId('input-first-hero-age')).toBeVisible({ timeout: 30000 })
  await noHorizontalOverflow(page)
})

test('parent dashboard controls fit the phone screen; Children & PINs reachable from the bottom nav', async ({ page }) => {
  await page.goto('/parent/auth')
  await page.getByRole('tab', { name: /sign in/i }).click()
  await page.getByTestId('input-login-email').fill(parentEmail)
  await page.getByTestId('input-login-password').fill(password)
  await page.getByTestId('button-login').click()
  // Bottom navigation is always visible — no hamburger
  await expect(page.getByTestId('sidebar-parent-dashboard')).toBeVisible({ timeout: 30000 })
  await page.waitForTimeout(1500)

  await noHorizontalOverflow(page)

  // Children & PINs sits directly on the bottom nav
  const childrenItem = page.getByTestId('sidebar-item-children')
  await expect(childrenItem).toHaveAttribute('aria-label', 'Children & PINs')
  await childrenItem.click()
  await expect(page.getByTestId('kids-search')).toBeVisible({ timeout: 20000 })
  await noHorizontalOverflow(page)
})

test('health meter counts a redone habit once (no 200%)', async ({ page }) => {
  await kidLogin(page)
  await page.getByTestId('kid-tab-missions').click()

  await expect(page.getByTestId('health-meter-count')).toHaveText('1/1', { timeout: 20000 })
  await expect(page.getByTestId('health-meter-percent')).toHaveText('100%')
  await noHorizontalOverflow(page)
})

test('Shape Match responds to touch dragging', async ({ page }) => {
  await kidLogin(page)
  await page.getByTestId('kid-tab-games').click()
  await page.getByTestId('game-play-shape-match').click()
  await expect(page.getByText('Shape Match Adventure').first()).toBeVisible({ timeout: 30000 })
  await page.waitForTimeout(1000)

  const verdict = await page.evaluate(async () => {
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
    const cards = [...document.querySelectorAll('div')].filter((d) => {
      const s = getComputedStyle(d)
      return s.touchAction === 'none' && d.getBoundingClientRect().width > 40
    })
    if (!cards.length) return 'no-draggables'
    const el = cards[0]
    const r = el.getBoundingClientRect()
    const before = getComputedStyle(el).transform
    const fire = (type: string, x: number, y: number) => {
      const t = new Touch({ identifier: 1, target: el, clientX: x, clientY: y, pageX: x, pageY: y })
      el.dispatchEvent(
        new TouchEvent(type, {
          touches: type === 'touchend' ? [] : [t],
          changedTouches: [t],
          targetTouches: type === 'touchend' ? [] : [t],
          bubbles: true,
          cancelable: true,
        }),
      )
    }
    const cx = r.x + r.width / 2
    const cy = r.y + r.height / 2
    fire('touchstart', cx, cy)
    await sleep(80)
    for (let i = 1; i <= 6; i++) {
      fire('touchmove', cx + i * 12, cy + i * 8)
      await sleep(40)
    }
    const during = getComputedStyle(el).transform
    fire('touchend', cx + 72, cy + 48)
    return before !== during ? 'moves' : 'stuck'
  })
  expect(verdict).toBe('moves')
})

test('Shape Match registers a drag-to-target match (game is completable)', async ({ page }) => {
  await kidLogin(page)
  await page.getByTestId('kid-tab-games').click()
  await page.getByTestId('game-play-shape-match').click()
  await expect(page.getByText('Shape Match Adventure').first()).toBeVisible({ timeout: 30000 })
  await page.waitForTimeout(1200)

  const verdict = await page.evaluate(async () => {
    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
    const bodyText = () => document.body.innerText.replace(/\s+/g, ' ')
    const scoreOf = () => { const m = bodyText().match(/⭐\s*(\d+)/); return m ? +m[1] : -1 }

    const draggables = [...document.querySelectorAll('div')].filter((d) => {
      const s = getComputedStyle(d)
      return s.touchAction === 'none' && d.getBoundingClientRect().width > 40
    })
    for (const el of draggables) {
      const lines = el.innerText.trim().split('\n').map((x) => x.trim()).filter(Boolean)
      const label = lines[lines.length - 1] || ''
      // items pair with targets by LABEL text (the emojis differ by design)
      const target = [...document.querySelectorAll('div')].find((d) => {
        const s = getComputedStyle(d)
        return s.borderStyle.includes('dashed') && d.innerText.includes(label) && d !== el && !el.contains(d) && !d.contains(el)
      })
      if (!target) continue
      const t = target.getBoundingClientRect()
      const r = el.getBoundingClientRect()
      const from = { x: r.x + r.width / 2, y: r.y + r.height / 2 }
      const to = { x: t.x + t.width / 2, y: t.y + t.height / 2 }
      const before = scoreOf()
      const fire = (type: string, x: number, y: number) => {
        const touch = new Touch({ identifier: 7, target: el, clientX: x, clientY: y, pageX: x + window.scrollX, pageY: y + window.scrollY })
        el.dispatchEvent(new TouchEvent(type, { touches: type === 'touchend' ? [] : [touch], changedTouches: [touch], targetTouches: type === 'touchend' ? [] : [touch], bubbles: true, cancelable: true }))
      }
      fire('touchstart', from.x, from.y)
      await sleep(60)
      for (let i = 1; i <= 10; i++) {
        fire('touchmove', from.x + ((to.x - from.x) * i) / 10, from.y + ((to.y - from.y) * i) / 10)
        await sleep(35)
      }
      fire('touchend', to.x, to.y)
      await sleep(700)
      if (scoreOf() > before) return 'match'
    }
    return 'no-match'
  })
  expect(verdict).toBe('match')
})

test('parent auth form is reachable without scrolling on a phone', async ({ page }) => {
  await page.goto('/parent/auth')
  await expect(page.getByText('Parent Access')).toBeVisible({ timeout: 30000 })

  // The form card sits above the marketing content on phones
  const card = await page.getByText('Parent Access').boundingBox()
  const viewport = page.viewportSize()!
  expect(card!.y, 'auth form must be above the fold').toBeLessThan(viewport.height)

  // Long marketing sections are collapsed behind the toggle
  await expect(page.getByTestId('toggle-auth-info')).toBeVisible()
  await expect(page.getByText(/features your kids will love/i)).toBeHidden()
  await page.getByTestId('toggle-auth-info').click()
  await expect(page.getByText(/features your kids will love/i)).toBeVisible()
})

test('kids can ask a parent to create an account from the login page', async ({ page }) => {
  await page.goto('/kids-login')
  await page.getByTestId('button-no-account').click()

  await page.getByTestId('input-parent-email').fill('not-an-email')
  await page.getByTestId('button-send-parent-request').click()
  await expect(page.getByTestId('parent-request-sent')).not.toBeVisible()

  await page.getByTestId('input-parent-email').fill('mom@example.com')
  await page.getByTestId('button-send-parent-request').click()
  await expect(page.getByTestId('parent-request-sent')).toBeVisible()
  await expect(page.getByText(/opened your email app/i)).toBeVisible()
})

test('exiting a game mid-animation returns to the Game Zone without crashing', async ({ page }) => {
  const pageErrors: string[] = []
  page.on('pageerror', (e) => pageErrors.push(String(e)))

  await kidLogin(page)
  await page.getByTestId('kid-tab-games').click()
  await page.getByTestId('game-play-math-runner').click()
  await expect(page.getByText('Math Hero Dash').first()).toBeVisible({ timeout: 30000 })
  await page.waitForTimeout(1200) // let the runner animation start

  await page.getByTestId('game-exit').click()
  await expect(page.getByText('Game Zone')).toBeVisible({ timeout: 20000 })
  expect(pageErrors, 'exiting must not throw (RN global shim)').toEqual([])
})
