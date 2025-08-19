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
    price: 4.99,
    interval: 'month',
    intervalCount: 1,
    currency: 'usd',
    features: [
      'Unlimited levels & daily streak challenges',
      'Exclusive avatars, costumes & badges',
      'Parent dashboard & progress insights',
      'Extra reward points & bonus mini-games'
    ]
  },
  {
    id: 'quarterly',
    name: 'Quarterly Plan',
    price: 12.99,
    interval: 'month',
    intervalCount: 3,
    currency: 'usd',
    popular: true,
    savings: '13% savings',
    features: [
      'Everything in Monthly Plan',
      'Bonus "Seasonal Avatar Pack" every quarter',
      'Early access to new mini-games',
      'Priority customer support'
    ]
  },
  {
    id: 'yearly',
    name: 'Yearly Plan',
    price: 39.99,
    interval: 'year',
    intervalCount: 1,
    currency: 'usd',
    savings: '33% savings',
    badge: 'Best Value',
    features: [
      'All premium features included',
      'Exclusive "Hero of the Year" badge + certificate',
      'Special annual reward: custom avatar item',
      'Yearly subscribers exclusive content',
      'Priority support & early beta access'
    ]
  },
  {
    id: 'family',
    name: 'Family Pack',
    price: 59.99,
    interval: 'year',
    intervalCount: 1,
    currency: 'usd',
    badge: 'Up to 3 Kids',
    features: [
      'All yearly plan features',
      'Support for up to 3 children',
      'Family progress dashboard',
      'Shared family rewards & challenges',
      'Multi-child avatar sharing'
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