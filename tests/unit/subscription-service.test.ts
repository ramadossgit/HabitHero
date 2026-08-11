// @vitest-environment node
import { describe, it, expect } from "vitest";
import { SubscriptionService } from "../../server/subscription-service";

const day = 24 * 60 * 60 * 1000;

describe("SubscriptionService.hasFeatureAccess", () => {
  it("denies access when user is missing", () => {
    expect(SubscriptionService.hasFeatureAccess(null, "basic_habits")).toBe(false);
  });

  it("grants trial users only trial features while the trial is active", () => {
    const user = { subscriptionStatus: "trial", trialEndsAt: new Date(Date.now() + 3 * day) };
    expect(SubscriptionService.hasFeatureAccess(user, "basic_habits")).toBe(true);
    expect(SubscriptionService.hasFeatureAccess(user, "mini_games")).toBe(false);
  });

  it("denies trial features after the trial expired (uses trialEndsAt)", () => {
    const user = { subscriptionStatus: "trial", trialEndsAt: new Date(Date.now() - day) };
    expect(SubscriptionService.hasFeatureAccess(user, "basic_habits")).toBe(false);
  });

  it("denies trial users with no trial end date instead of crashing", () => {
    const user = { subscriptionStatus: "trial" };
    expect(SubscriptionService.hasFeatureAccess(user, "basic_habits")).toBe(false);
  });

  it("grants active subscribers everything", () => {
    const user = { subscriptionStatus: "active" };
    expect(SubscriptionService.hasFeatureAccess(user, "mini_games")).toBe(true);
  });
});

describe("SubscriptionService.getSubscriptionInfo", () => {
  it("reports active trial with days left", () => {
    const info = SubscriptionService.getSubscriptionInfo({
      subscriptionStatus: "trial",
      subscriptionPlan: "trial",
      trialEndsAt: new Date(Date.now() + 5 * day),
    });
    expect(info.status).toBe("trial");
    expect(info.isTrialActive).toBe(true);
    expect(info.trialDaysLeft).toBeGreaterThanOrEqual(4);
  });

  it("reports active subscription within period", () => {
    const info = SubscriptionService.getSubscriptionInfo({
      subscriptionStatus: "active",
      subscriptionPlan: "monthly",
      subscriptionEndDate: new Date(Date.now() + 20 * day),
    });
    expect(info.isSubscriptionActive).toBe(true);
    expect(info.plan).toBe("monthly");
  });

  it("defaults to trial when fields are missing", () => {
    const info = SubscriptionService.getSubscriptionInfo({});
    expect(info.status).toBe("trial");
    expect(info.trialDaysLeft).toBe(0);
  });
});
