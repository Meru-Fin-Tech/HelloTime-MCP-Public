import { z } from 'zod';
import { PLANS, VOLUME_TIERS, ANNUAL_PREPAY_DISCOUNT_PERCENT, FREE_TRIAL_DAYS } from '../data/plans.js';
import type { CountryCode, PlanType } from '../data/plans.js';

export const listPlansSchema = {
  country: z.enum(['IN', 'US', 'CA', 'GB', 'AU', 'AE', 'SG', 'NZ']).optional()
    .describe('ISO country code. Filters prices to one country. Omit to return all 8 markets.'),
  plan: z.enum(['free', 'attend', 'track', 'pro', 'business']).optional()
    .describe('Restrict the response to a single plan tier.'),
};

export interface ListPlansArgs {
  country?: CountryCode;
  plan?: PlanType;
}

export function listPlans(args: ListPlansArgs) {
  let results = PLANS;
  if (args.plan) results = results.filter((p) => p.plan === args.plan);

  if (args.country) {
    const c = args.country;
    results = results.map((p) => ({
      ...p,
      prices: p.prices.filter((pr) => pr.country === c),
    }));
  }

  return {
    plans: results,
    volumeDiscounts: VOLUME_TIERS,
    annualPrepayDiscountPercent: ANNUAL_PREPAY_DISCOUNT_PERCENT,
    freeTrialDays: FREE_TRIAL_DAYS,
    source: 'https://hellotime.ai/pricing',
    note: 'Prices are launch-offer (promo) and list (sticker). Volume and annual discounts stack. Currencies in local denomination.',
  };
}
