# Habit Heroes Mobile (iOS + Android)

This Expo app is a **native shell around the Habit Heroes web app**: it
renders the exact same landing page, login/signup, parent dashboard and
Game Zone inside a WebView, so the mobile theme and features always match
the website — by design, nothing is re-implemented or re-skinned here.

## Run it

1. Start the Habit Heroes server (from the repo root):

   ```bash
   npm run dev        # serves the app on port 5000
   ```

2. Point the shell at the server in [app.json](app.json):

   ```jsonc
   "extra": { "serverUrl": "http://localhost:5000" }
   ```

   - **Android emulator**: `localhost` is rewritten to `10.0.2.2`
     automatically.
   - **Real phone (Expo Go)**: use your computer's LAN IP, e.g.
     `http://192.168.1.20:5000` (phone and computer on the same Wi-Fi).

3. Start the app:

   ```bash
   npm install
   npx expo start
   ```

## Behavior

- Shows a coral-themed loading screen (matching the web hero theme) while
  the site loads, and a retry screen if the server is unreachable.
- The Android hardware back button navigates back inside the app.
- Cookies are shared, so parent and kid sessions work like the browser.

## Troubleshooting

**"Can't reach Habit Heroes … blocked by a content filter" (iPhone/iPad)**
iOS Screen Time blocks raw-IP `http://` addresses when web content is
restricted. On the phone: Settings → Screen Time → Content & Privacy
Restrictions → Content Restrictions → Web Content, then either:
- switch to **Unrestricted**, or
- keep "Limit Adult Websites" and add the server address (e.g.
  `http://192.168.86.28:5000`) under **Always Allow**.

Third-party filter/DNS apps (AdGuard, NextDNS, family-safety apps) can
cause the same error — whitelist the address there instead.

**"Can't reach Habit Heroes" (no content-filter mention)**
- Phone and computer must be on the same Wi-Fi.
- `extra.serverUrl` in app.json must be the computer's current LAN IP
  (`ipconfig` → IPv4 Address) with `http://`, and the server running
  (`npm run dev`).
- Windows Firewall must allow inbound TCP 5000 (run once as admin):
  `New-NetFirewallRule -DisplayName "Habit Heroes Dev Server (5000)" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 5000 -Profile Private`

## Tests

- `tests/api/mobile-shell.test.ts` (repo root, vitest) — shell wiring:
  server URL configured, WebView present, SPA served at the target URL.
- `tests/e2e/mobile-landing.spec.ts` (Playwright) — the mobile-viewport
  experience: landing renders the web theme and navigates to kid login
  and parent sign-in/sign-up:

  ```bash
  npx playwright test tests/e2e/mobile-landing.spec.ts --project="Mobile Chrome"
  ```
