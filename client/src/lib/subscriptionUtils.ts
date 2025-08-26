import type { User } from "@shared/schema";

export interface SubscriptionStatus {
  isTrialActive: boolean;
  isPremiumActive: boolean;
  isExpired: boolean;
  canAccessPremiumFeatures: boolean;
  daysLeft: number;
  status: 'trial' | 'active' | 'cancelled' | 'expired';
}

export function getSubscriptionStatus(user: User | null | undefined): SubscriptionStatus {
  if (!user) {
    return {
      isTrialActive: false,
      isPremiumActive: false,
      isExpired: true,
      canAccessPremiumFeatures: false,
      daysLeft: 0,
      status: 'expired'
    };
  }

  const now = new Date();
  const trialEndDate = user.trialEndsAt ? new Date(user.trialEndsAt) : null;
  const subscriptionEndDate = user.subscriptionEndDate ? new Date(user.subscriptionEndDate) : null;

  // Calculate days left for trial
  const daysLeft = trialEndDate 
    ? Math.max(0, Math.ceil((trialEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Check if trial is active
  const isTrialActive = user.subscriptionStatus === 'trial' && 
                       trialEndDate && 
                       now < trialEndDate;

  // Check if premium subscription is active
  const isPremiumActive = user.subscriptionStatus === 'active' &&
                          subscriptionEndDate &&
                          now < subscriptionEndDate;

  // Check if subscription is cancelled but still valid
  const isCancelledButValid = user.subscriptionStatus === 'cancelled' &&
                              subscriptionEndDate &&
                              now < subscriptionEndDate;

  // Determine if user can access premium features
  const canAccessPremiumFeatures = Boolean(isTrialActive || isPremiumActive || isCancelledButValid);

  // Determine overall status
  let status: 'trial' | 'active' | 'cancelled' | 'expired';
  if (isTrialActive) {
    status = 'trial';
  } else if (isPremiumActive) {
    status = 'active';
  } else if (isCancelledButValid) {
    status = 'cancelled';
  } else {
    status = 'expired';
  }

  return {
    isTrialActive,
    isPremiumActive: isPremiumActive || isCancelledButValid,
    isExpired: !canAccessPremiumFeatures,
    canAccessPremiumFeatures,
    daysLeft,
    status
  };
}

export function requiresSubscription(user: User | null | undefined): boolean {
  const status = getSubscriptionStatus(user);
  return !status.canAccessPremiumFeatures;
}