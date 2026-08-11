import { test, expect } from '@playwright/test'

// Mobile experience tests — run under the mobile emulation projects:
//   npx playwright test tests/e2e/mobile-landing.spec.ts --project="Mobile Chrome"
//
// The native mobile app (HabitHeroesMobile) is a WebView shell around this
// exact web app, so these viewport tests verify what phone users see:
// the landing page must match the web theme and must navigate to the kid
// login and parent sign-in/sign-up screens.

test('mobile landing shows the same themed content as the web', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByTestId('kids-play-button')).toBeVisible()
  await expect(page.getByTestId('parents-manage-button')).toBeVisible()
  await expect(page.getByTestId('sign-up-button')).toBeVisible()
})

test('kids can reach the login screen from the mobile landing page', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('kids-play-button').click()

  await expect(page).toHaveURL(/\/kids-login/)
  // Family code, username and PIN fields are all usable on a phone screen
  await expect(page.locator('input[maxlength="8"]')).toBeVisible()
  await expect(page.locator('input[maxlength="4"]')).toBeVisible()
})

test('parents can reach the sign-in form from the mobile landing page', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('parents-manage-button').click()

  await expect(page).toHaveURL(/\/parent\/auth/)
  await page.getByRole('tab', { name: /sign in/i }).click()
  await expect(page.getByTestId('input-login-email')).toBeVisible()
  await expect(page.getByTestId('input-login-password')).toBeVisible()
  await expect(page.getByTestId('button-login')).toBeVisible()
})

test('parents can reach the sign-up form from the mobile landing page', async ({ page }) => {
  await page.goto('/')
  await page.getByTestId('sign-up-button').click()

  await expect(page).toHaveURL(/\/parent\/auth/)
  await page.getByRole('tab', { name: /sign up/i }).click()
  await expect(page.getByTestId('input-register-email')).toBeVisible()
  await expect(page.getByTestId('button-register')).toBeVisible()
})
