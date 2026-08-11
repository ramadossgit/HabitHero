// @vitest-environment node
//
// Regression: /api/pending-habits/all once returned EVERY family's pending
// habit completions (child names included) to any logged-in parent. It must
// only ever return the requesting parent's own children.
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

describe.skipIf(!up)("pending habits are scoped to the requesting parent", () => {
  const familyA = client();
  const familyB = client();
  const kidA = client();
  const uniq = Date.now();
  let childAName = "";

  beforeAll(async () => {
    // Family A: a child with a pending habit completion
    const emailA = `scopeA${uniq}@e2e.local`;
    await familyA("POST", "/api/auth/register", { email: emailA, password: "Scope123!", firstName: "A", lastName: "Fam" });
    await familyA("POST", "/api/auth/login", { email: emailA, password: "Scope123!" });
    const famCode = (await familyA("GET", "/api/auth/user")).body.familyCode;
    childAName = `SecretKid${uniq}`;
    const childA = await familyA("POST", "/api/children", {
      name: childAName, avatarType: "robot", age: 8, level: 1, xp: 0, totalXp: 0,
      rewardPoints: 0, unlockedAvatars: [], unlockedGear: [],
    });
    const username = `scopekid${uniq}`;
    await familyA("PATCH", `/api/children/${childA.body.id}`, { username, pin: "5566" });
    const habit = await familyA("POST", `/api/children/${childA.body.id}/habits`, {
      name: "Private Habit", icon: "🔒", xpReward: 20, color: "mint", frequency: "daily",
    });
    await kidA("POST", "/api/auth/child-login", { familyCode: famCode, username, pin: "5566" });
    await kidA("POST", `/api/habits/${habit.body.id}/complete`, {});

    // Family B: unrelated parent
    const emailB = `scopeB${uniq}@e2e.local`;
    await familyB("POST", "/api/auth/register", { email: emailB, password: "Scope123!", firstName: "B", lastName: "Fam" });
    await familyB("POST", "/api/auth/login", { email: emailB, password: "Scope123!" });
  });

  it("shows family A their own pending habit", async () => {
    const res = await familyA("GET", "/api/pending-habits/all");
    expect(res.status).toBe(200);
    const names = (res.body as any[]).map((r) => r.child?.name);
    expect(names).toContain(childAName);
  });

  it("does NOT leak family A's children to family B", async () => {
    const res = await familyB("GET", "/api/pending-habits/all");
    expect(res.status).toBe(200);
    const serialized = JSON.stringify(res.body);
    expect(serialized, "family B must not see family A's child").not.toContain(childAName);
    expect(serialized, "family B must not see family A's habit").not.toContain("Private Habit");
    // Family B has no children at all, so the list must be empty
    expect(res.body).toEqual([]);
  });
});
