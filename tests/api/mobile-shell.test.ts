// @vitest-environment node
//
// Contract tests for the native mobile app (HabitHeroesMobile), which is
// a WebView shell around the web app. These verify the shell's wiring:
// the configured server URL serves the real SPA, so the phone shows the
// exact same theme and screens as the website.
import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import path from "path";

const BASE = process.env.E2E_BASE_URL || "http://localhost:5000";
const mobileDir = path.resolve(__dirname, "../../HabitHeroesMobile");

async function serverUp(): Promise<boolean> {
  try {
    // Keep this short: it runs at module load, and a slow probe can trip
    // vitest's worker module-fetch timeout and fail the whole file
    const res = await fetch(BASE + "/api/health", { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

describe("mobile shell configuration", () => {
  // Strip a UTF-8 BOM if a Windows tool re-wrote the file with one
  const appJson = JSON.parse(
    readFileSync(path.join(mobileDir, "app.json"), "utf-8").replace(/^﻿/, ""),
  );
  const appTsx = readFileSync(path.join(mobileDir, "App.tsx"), "utf-8");
  const pkg = JSON.parse(readFileSync(path.join(mobileDir, "package.json"), "utf-8"));

  it("has a server URL configured for the WebView", () => {
    expect(typeof appJson.expo.extra.serverUrl).toBe("string");
    expect(appJson.expo.extra.serverUrl).toMatch(/^https?:\/\//);
  });

  it("renders the web app in a WebView instead of a separate mobile theme", () => {
    expect(pkg.dependencies["react-native-webview"]).toBeTruthy();
    expect(appTsx).toContain("<WebView");
    expect(appTsx).toContain("getServerUrl");
    // No hard-coded duplicate landing content is allowed to drift from the web
    expect(appTsx).not.toContain("Coming Soon");
  });

  it("keeps the shell chrome on the web hero theme (coral)", () => {
    expect(appTsx).toContain("#FF6B6B");
  });
});

const up = await serverUp();

describe.skipIf(!up)("mobile shell target server", () => {
  it("serves the SPA at the URL the WebView loads", async () => {
    const res = await fetch(BASE + "/");
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('<div id="root">');
  });

  it("serves the kid login and parent auth routes for in-app navigation", async () => {
    for (const route of ["/kids-login", "/parent/auth"]) {
      const res = await fetch(BASE + route);
      expect(res.status, route).toBe(200);
    }
  });
});
