/**
 * Plan catalog — mirrored from the marketing-site source-of-truth at
 *   Hellotime-website/lib/pricing.ts,
 *   Hellotime-website/components/PricingTable.tsx,
 *   Hellotime-website/components/PricingMatrix.tsx
 *
 * Public-only data: tier names, prices, currencies, feature bullets shown on
 * the public /pricing page. Never includes customer usage, billing, account ID.
 *
 * The 4-tier ladder is Free / Attend / Track / Business. "Pro" was retired on
 * 2026-08-13 when Business became the all-in SKU at the $19.99 / INR 399
 * ceiling, absorbing Pro's combined Attend+Track capability set on top of
 * payroll, compliance and AI. The earlier "Enterprise" tier was retired before
 * that, its premium controls (SSO/SCIM, custom data residency, 99.9% SLA,
 * dedicated success manager) folded into Business; Enterprise-shaped deals are
 * sold as "Business + add-ons quoted" via /contact.
 *
 * Prices are the CHARGED price (`monthlyPromo`) with a standing value anchor
 * (`monthlyList`). The anchor has no expiry date: the 2026-08-13 rung-shift
 * already consumed the promo->list step, so promoting promo to list again
 * would double the charged price a second time.
 *
 * Future (federation): once the marketing site exposes /api/public/pricing,
 * this module can fetch + cache from that endpoint and drop the static copy.
 */

export type CountryCode = 'IN' | 'US' | 'CA' | 'GB' | 'AU' | 'AE' | 'SG' | 'NZ';
export type CurrencyCode = 'INR' | 'USD' | 'CAD' | 'GBP' | 'AUD' | 'AED' | 'SGD' | 'NZD' | 'EUR';
export type PlanType = 'free' | 'attend' | 'track' | 'business';

export interface PlanPrice {
  country: CountryCode;
  currency: CurrencyCode;
  symbol: string;
  monthlyPromo: number;
  monthlyList: number;
  annualPromo: number;
  annualList: number;
}

export interface Plan {
  plan: PlanType;
  name: string;
  tagline: string;
  freeTrialDays: number;
  features: string[];
  prices: PlanPrice[];
  publicSignupUrl: string;
}

// Cut 5 -> 1 on 2026-08-13: Free is a single-user plan.
export const FREE_SEAT_CAP = 1;
export const FREE_TRIAL_DAYS = 7;
export const ANNUAL_PREPAY_DISCOUNT_PERCENT = 20;

const FREE_FEATURES = [
  '1 user',
  'Leave & shift basics',
  'Mobile + web apps',
  'Manual attendance entry',
  'Community support',
];

const ATTEND_FEATURES = [
  'Everything in Free',
  'Face-recognition clock-in (anti-spoof)',
  'GPS geofence + multi-site',
  'Tablet kiosk mode',
  'Leave & shift management',
  'Holiday calendars + overtime rules',
  'WhatsApp / SMS clock-in',
  'Email support',
];

const TRACK_FEATURES = [
  'Everything in Free',
  'Desktop productivity tracker',
  'Activity, app & URL summaries',
  'Optional screenshots (privacy-first)',
  'Projects, tasks & budgets',
  'Client billing rates',
  'Email support',
];

const BUSINESS_FEATURES = [
  'Everything in Attend',
  'Everything in Track',
  'Unified timesheets',
  'Multi-branch + departments',
  'Custom reports',
  'Auto-payroll (TDS, PF, ESI, PT, LWF)',
  'Form 24Q + FVU export',
  'Compliance calendar',
  'AI manager assist',
  'SSO (SAML / OIDC) + SCIM',
  'Custom data residency (Azure regions)',
  '99.9% uptime SLA + dedicated success manager',
  'Priority support',
];

interface RegionConfig {
  country: CountryCode;
  currency: CurrencyCode;
  symbol: string;
  free:     { promo: number; list: number };
  attend:   { promo: number; list: number };
  track:    { promo: number; list: number };
  business: { promo: number; list: number };
}

const ANNUAL_PREPAY_DISCOUNT = ANNUAL_PREPAY_DISCOUNT_PERCENT / 100;

const REGIONS: RegionConfig[] = [
  { country: 'IN', currency: 'INR', symbol: '₹',
    free:     { promo: 0,   list: 0   },
    attend:   { promo: 99,  list: 199 },
    track:    { promo: 199, list: 399 },
    business: { promo: 399, list: 799 } },
  { country: 'US', currency: 'USD', symbol: '$',
    free:     { promo: 0,     list: 0     },
    attend:   { promo: 3.99,  list: 7.99  },
    track:    { promo: 9.99,  list: 19.99 },
    business: { promo: 19.99, list: 39.99 } },
  { country: 'GB', currency: 'GBP', symbol: '£',
    free:     { promo: 0,     list: 0     },
    attend:   { promo: 2.99,  list: 5.99  },
    track:    { promo: 7.99,  list: 15.99 },
    business: { promo: 15.99, list: 31.99 } },
  { country: 'AU', currency: 'AUD', symbol: 'A$',
    free:     { promo: 0,     list: 0     },
    attend:   { promo: 5.99,  list: 11.99 },
    track:    { promo: 14.99, list: 29.99 },
    business: { promo: 29.99, list: 59.99 } },
  { country: 'CA', currency: 'CAD', symbol: 'C$',
    free:     { promo: 0,     list: 0     },
    attend:   { promo: 4.99,  list: 9.99  },
    track:    { promo: 13.99, list: 27.99 },
    business: { promo: 27.99, list: 55.99 } },
  { country: 'AE', currency: 'AED', symbol: 'AED ',
    free:     { promo: 0,  list: 0   },
    attend:   { promo: 18, list: 36  },
    track:    { promo: 36, list: 72  },
    business: { promo: 72, list: 144 } },
  { country: 'SG', currency: 'SGD', symbol: 'S$',
    free:     { promo: 0,     list: 0     },
    attend:   { promo: 4.99,  list: 9.99  },
    track:    { promo: 13.99, list: 27.99 },
    business: { promo: 27.99, list: 55.99 } },
  { country: 'NZ', currency: 'NZD', symbol: 'NZ$',
    free:     { promo: 0,     list: 0     },
    attend:   { promo: 5.99,  list: 11.99 },
    track:    { promo: 15.99, list: 31.99 },
    business: { promo: 31.99, list: 63.99 } },
];

function annual(monthly: number, currency: CurrencyCode): number {
  const discounted = monthly * 12 * (1 - ANNUAL_PREPAY_DISCOUNT);
  if (currency === 'INR' || currency === 'AED') return Math.round(discounted);
  return Math.round(discounted * 100) / 100;
}

function pricesFor(plan: PlanType): PlanPrice[] {
  return REGIONS.map((r) => {
    const tier = r[plan];
    return {
      country: r.country,
      currency: r.currency,
      symbol: r.symbol,
      monthlyPromo: tier.promo,
      monthlyList: tier.list,
      annualPromo: annual(tier.promo, r.currency),
      annualList: annual(tier.list, r.currency),
    };
  });
}

export const PLANS: Plan[] = [
  {
    plan: 'free',
    name: 'Free',
    tagline: 'Permanent free plan for a single user.',
    freeTrialDays: 0,
    features: FREE_FEATURES,
    prices: pricesFor('free'),
    publicSignupUrl: 'https://hellotime.ai/signup',
  },
  {
    plan: 'attend',
    name: 'Attend',
    tagline: 'Face-rec attendance, GPS, kiosk and leave for deskless teams.',
    freeTrialDays: FREE_TRIAL_DAYS,
    features: ATTEND_FEATURES,
    prices: pricesFor('attend'),
    publicSignupUrl: 'https://hellotime.ai/signup',
  },
  {
    plan: 'track',
    name: 'Track',
    tagline: 'Desktop productivity, projects and reports for desk teams.',
    freeTrialDays: FREE_TRIAL_DAYS,
    features: TRACK_FEATURES,
    prices: pricesFor('track'),
    publicSignupUrl: 'https://hellotime.ai/signup',
  },
  {
    plan: 'business',
    name: 'Business',
    tagline: 'Attend + Track combined, plus payroll, compliance calendar, AI manager assist and SSO/SCIM.',
    freeTrialDays: FREE_TRIAL_DAYS,
    features: BUSINESS_FEATURES,
    prices: pricesFor('business'),
    publicSignupUrl: 'https://hellotime.ai/signup',
  },
];

// Volume discount ladder — published transparently on /pricing.
// Applies to paid tiers only; Free is excluded.
export interface VolumeTier {
  minSeats: number;
  maxSeats: number | null;
  discountPercent: number;
  label: string;
}

export const VOLUME_TIERS: VolumeTier[] = [
  { minSeats: 1,   maxSeats: 10,   discountPercent: 0,  label: '1–10 seats' },
  { minSeats: 11,  maxSeats: 25,   discountPercent: 10, label: '11–25 seats' },
  { minSeats: 26,  maxSeats: 50,   discountPercent: 15, label: '26–50 seats' },
  { minSeats: 51,  maxSeats: 100,  discountPercent: 20, label: '51–100 seats' },
  { minSeats: 101, maxSeats: 250,  discountPercent: 25, label: '101–250 seats' },
  { minSeats: 251, maxSeats: 500,  discountPercent: 30, label: '251–500 seats' },
  { minSeats: 501, maxSeats: null, discountPercent: 35, label: '501+ seats' },
];
