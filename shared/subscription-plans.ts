export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year' | 'quarter';
  intervalCount: number;
  currency: 'usd';
  features: string[];
  popular?: boolean;
  savings?: string;
  badge?: string;
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'monthly',
    name: 'Monthly Plan',
    price: 0.99,
    interval: 'month',
    intervalCount: 1,
    currency: 'usd',
    features: [
      'Recurring reward creation',
      'Weekend challenge rewards',
      'Mini games (coming soon)',
      'Priority support'
    ]
  },
  {
    id: 'quarterly',
    name: 'Quarterly Plan',
    price: 2.49,
    interval: 'month',
    intervalCount: 3,
    currency: 'usd',
    popular: true,
    savings: 'Save $0.48',
    features: [
      'Everything in Monthly Plan',
      'Recurring reward creation',
      'Weekend challenge rewards',
      'Priority customer support'
    ]
  },
  {
    id: 'yearly',
    name: 'Yearly Plan',
    price: 7.99,
    interval: 'year',
    intervalCount: 1,
    currency: 'usd',
    savings: 'Save $4',
    badge: 'Best Value',
    features: [
      'All premium features included',
      'Recurring reward creation',
      'Weekend challenge rewards',
      'Mini games (coming soon)',
      'Priority support & early beta access'
    ]
  }
];

export const TRIAL_FEATURES = [
  'Access to Avatar Builder',
  'Balloon Pop mini-game',
  'Basic habit tracking (up to 3 habits)',
  'Limited reward points',
  '7-day free trial period'
];

export const PREMIUM_FEATURES = [
  'Unlimited habits & levels',
  'All mini-games unlocked',
  'Exclusive avatars & costumes',
  'Advanced parent dashboard',
  'Progress insights & analytics',
  'Custom rewards & challenges',
  'Voice reminders',
  'Streak bonuses & achievements'
];