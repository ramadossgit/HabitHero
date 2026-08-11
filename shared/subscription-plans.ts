export interface SubscriptionPlan {
  id: string;
  name: string;
  /** Total amount charged for the whole billing period, in USD. */
  price: number;
  interval: 'month' | 'year' | 'quarter';
  intervalCount: number;
  currency: 'usd';
  /** How many months the price covers (used for savings math). */
  months: number;
  /** Auto-computed per-month equivalent, in USD. */
  pricePerMonth: number;
  features: string[];
  popular?: boolean;
  savings?: string;
  badge?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
//  ⚙️  EDIT PLANS HERE  — this is the single source of truth for pricing.
//
//  • `price`  = the total charged for the whole billing period (USD).
//  • `months` = how many months that price covers.
//
//  Change a price (or add/remove a plan) and everything downstream updates
//  automatically: the per-month price, the "Save $X" badge, the Stripe
//  billing interval, the API (/api/subscription/plans), and every screen
//  that renders plans. No other file needs to change.
// ─────────────────────────────────────────────────────────────────────────────
interface PlanDef {
  id: string;
  name: string;
  price: number;
  months: number;
  features: string[];
  popular?: boolean;
  badge?: string;
}

const PLAN_DEFS: PlanDef[] = [
  {
    id: 'monthly',
    name: 'Monthly Plan',
    price: 4.99,
    months: 1,
    features: [
      'Recurring reward creation',
      'Weekend challenge rewards',
      'Mini games (coming soon)',
      'Priority support',
    ],
  },
  {
    id: 'quarterly',
    name: 'Quarterly Plan',
    price: 12.99,
    months: 3,
    popular: true,
    features: [
      'Everything in Monthly Plan',
      'Recurring reward creation',
      'Weekend challenge rewards',
      'Priority customer support',
    ],
  },
  {
    id: 'yearly',
    name: 'Yearly Plan',
    price: 49.99,
    months: 12,
    badge: 'Best Value',
    features: [
      'All premium features included',
      'Recurring reward creation',
      'Weekend challenge rewards',
      'Mini games (coming soon)',
      'Priority support & early beta access',
    ],
  },
];

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Build the full plan list, computing per-month price, billing interval and
 *  savings relative to the shortest (per-month) plan. */
function buildPlans(defs: PlanDef[]): SubscriptionPlan[] {
  const monthly = defs.find((d) => d.months === 1);
  const baseMonthly = monthly ? monthly.price : defs[0].price / defs[0].months;

  return defs.map((d) => {
    const interval: SubscriptionPlan['interval'] = d.months >= 12 ? 'year' : 'month';
    const intervalCount = d.months >= 12 ? Math.round(d.months / 12) : d.months;
    const saved = round2(baseMonthly * d.months - d.price);

    return {
      id: d.id,
      name: d.name,
      price: d.price,
      interval,
      intervalCount,
      currency: 'usd',
      months: d.months,
      pricePerMonth: round2(d.price / d.months),
      features: [...d.features],
      ...(d.popular ? { popular: true } : {}),
      ...(d.badge ? { badge: d.badge } : {}),
      ...(saved > 0 ? { savings: `Save $${saved.toFixed(2)}` } : {}),
    };
  });
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = buildPlans(PLAN_DEFS);

export const TRIAL_FEATURES = [
  'Access to Avatar Builder',
  'Balloon Pop mini-game',
  'Basic habit tracking (up to 3 habits)',
  'Limited reward points',
  '7-day free trial period',
];

export const PREMIUM_FEATURES = [
  'Unlimited habits & levels',
  'All mini-games unlocked',
  'Exclusive avatars & costumes',
  'Advanced parent dashboard',
  'Progress insights & analytics',
  'Custom rewards & challenges',
  'Voice reminders',
  'Streak bonuses & achievements',
];
