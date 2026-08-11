// @vitest-environment node
//
// Core product rule: the app ships NO content of its own. Parents design
// every habit and every reward for their own kids — Habit Heroes must never
// presume what motivates a particular child.
import { describe, it, expect, beforeAll } from "vitest";

const BASE = process.env.E2E_BASE_URL || "http://localhost:5000";

async function serverUp(): Promise<boolean> {
  try {
    const res = await fetch(BASE + "/api/health", { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

function client() {
  let cookie = "";
  return async function req(method: string, path: string, body?: unknown) {
    const res = await fetch(BASE + path, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const setCookie = res.headers.get("set-cookie");
    if (setCookie) cookie = setCookie.split(";")[0];
    let json: any = null;
    try { json = await res.json(); } catch { /* no body */ }
    return { status: res.status, body: json };
  };
}

const up = await serverUp();

describe.skipIf(!up)("a new child starts with a blank slate", () => {
  const req = client();
  let childId = "";

  beforeAll(async () => {
    const email = `nodefaults${Date.now()}@e2e.local`;
    await req("POST", "/api/auth/register", {
      email, password: "NoDef123!", firstName: "No", lastName: "Defaults",
    });
    await req("POST", "/api/auth/login", { email, password: "NoDef123!" });
    const child = await req("POST", "/api/children", {
      name: "Blank", avatarType: "robot", age: 8, level: 1, xp: 0, totalXp: 0,
      rewardPoints: 0, unlockedAvatars: [], unlockedGear: [],
    });
    childId = child.body.id;
  });

  it("has NO rewards until the parent creates them", async () => {
    const res = await req("GET", `/api/children/${childId}/rewards`);
    expect(res.status).toBe(200);
    expect(res.body, "a brand-new child must have zero rewards").toEqual([]);
  });

  it("has NO habits until the parent creates them", async () => {
    const res = await req("GET", `/api/children/${childId}/habits`);
    expect(res.status).toBe(200);
    expect(res.body, "a brand-new child must have zero habits").toEqual([]);
  });

  it("lets the parent design a reward entirely of their own", async () => {
    const created = await req("POST", `/api/children/${childId}/rewards`, {
      name: "Trip to the planetarium",
      description: "Our family's own idea — not a preset",
      type: "outing",
      value: "planetarium",
      cost: 12,
      costType: "habits",
      category: "monthly",
    });
    expect(created.status).toBe(200);
    expect(created.body.name).toBe("Trip to the planetarium");

    const list = await req("GET", `/api/children/${childId}/rewards`);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].name).toBe("Trip to the planetarium");
  });
});
