/**
 * Plan catalog — mirrored from the marketing-site source-of-truth at
 *   Hellotime-website/lib/pricing.ts and components/PricingTable.tsx
 *
 * Public-only data: tier names, prices, currencies, feature bullets shown on
 * the public /pricing page. Never includes customer usage, billing, account ID.
 *
 * TODO(federation): once the marketing site exposes /api/public/pricing,
 * switch this module to fetch + cache from that endpoint and drop the static copy.
 */

export type CountryCode = 'IN' | 'US' | 'CA' | 'GB' | 'AU' | 'AE' | 'SG' | 'NZ';
export type CurrencyCode = 'INR' | 'USD' | 'CAD' | 'GBP' | 'AUD' | 'AED' | 'SGD' | 'NZD' | 'EUR';
export type PlanType = 'pro' | 'business' | 'enterprise';

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

const PRO_FEATURES = [
  'Unlimited time tracking',
  'Auto timesheets + manual entries',
  'Projects, tasks & budgets',
  'GST invoicing via HelloBooks',
  'UPI, Razorpay & PayPal payouts',
  'Desktop, web & mobile apps',
  'Email support',
];

const BUSINESS_FEATURES = [
  'Everything in Pro',
  'Activity & productivity tracking',
  'Optional screenshots (privacy-first)',
  'GPS & geofencing',
  'Mileage tracking',
  'Auto-payroll: TDS, PF, ESI, PT (India)',
  'Form 24Q + FVU export (India)',
  'Priority chat support',
];

const ENTERPRISE_FEATURES = [
  'Everything in Business',
  'SSO (SAML / OIDC)',
  'SCIM provisioning',
  'Custom data residency (Azure regions)',
  'Dedicated success manager',
  '99.9% uptime SLA',
  'Custom reports + scheduled email',
  'Priority phone + email support',
];

interface RegionConfig {
  country: CountryCode;
  currency: CurrencyCode;
  symbol: string;
  pro: { promo: number; list: number };
  business: { promo: number; list: number };
  enterprise: { promo: number; list: number };
}

const ANNUAL_PREPAY_DISCOUNT = 0.20;

const REGIONS: RegionConfig[] = [
  { country: 'IN', currency: 'INR', symbol: '₹',
    pro: { promo: 99, list: 199 },
    business: { promo: 199, list: 399 },
    enterprise: { promo: 399, list: 799 } },
  { country: 'US', currency: 'USD', symbol: '$',
    pro: { promo: 4.99, list: 9.99 },
    business: { promo: 9.99, list: 19.99 },
    enterprise: { promo: 19.99, list: 39.99 } },
  { country: 'GB', currency: 'GBP', symbol: '£',
    pro: { promo: 3.99, list: 7.99 },
    business: { promo: 7.99, list: 15.99 },
    enterprise: { promo: 15.99, list: 31.99 } },
  { country: 'AU', currency: 'AUD', symbol: 'A$',
    pro: { promo: 7.49, list: 14.99 },
    business: { promo: 14.99, list: 29.99 },
    enterprise: { promo: 29.99, list: 59.99 } },
  { country: 'CA', currency: 'CAD', symbol: 'C$',
    pro: { promo: 6.99, list: 13.99 },
    business: { promo: 13.99, list: 27.99 },
    enterprise: { promo: 27.99, list: 55.99 } },
  { country: 'AE', currency: 'AED', symbol: 'AED ',
    pro: { promo: 18, list: 36 },
    business: { promo: 36, list: 72 },
    enterprise: { promo: 72, list: 144 } },
  { country: 'SG', currency: 'SGD', symbol: 'S$',
    pro: { promo: 6.99, list: 13.99 },
    business: { promo: 13.99, list: 27.99 },
    enterprise: { promo: 27.99, list: 55.99 } },
  { country: 'NZ', currency: 'NZD', symbol: 'NZ$',
    pro: { promo: 7.99, list: 15.99 },
    business: { promo: 15.99, list: 31.99 },
    enterprise: { promo: 31.99, list: 63.99 } },
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
    plan: 'pro',
    name: 'Pro',
    tagline: 'Time tracking, timesheets and GST invoicing for small teams.',
    freeTrialDays: 7,
    features: PRO_FEATURES,
    prices: pricesFor('pro'),
    publicSignupUrl: 'https://hellotime.app/signup',
  },
  {
    plan: 'business',
    name: 'Business',
    tagline: 'Productivity monitoring, GPS, payroll automation.',
    freeTrialDays: 7,
    features: BUSINESS_FEATURES,
    prices: pricesFor('business'),
    publicSignupUrl: 'https://hellotime.app/signup',
  },
  {
    plan: 'enterprise',
    name: 'Enterprise',
    tagline: 'SSO, dedicated support and custom controls for large teams.',
    freeTrialDays: 7,
    features: ENTERPRISE_FEATURES,
    prices: pricesFor('enterprise'),
    publicSignupUrl: 'https://hellotime.app/contact',
  },
];

// Volume discount ladder — published transparently on /pricing.
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

export const ANNUAL_PREPAY_DISCOUNT_PERCENT = 20;
export const FREE_TRIAL_DAYS = 7;
