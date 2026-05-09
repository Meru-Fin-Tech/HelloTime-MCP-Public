import { z } from 'zod';
import { FEATURES } from '../data/features.js';
import type { Feature, FeatureCategory } from '../data/features.js';
import type { PlanType } from '../data/plans.js';

const CATEGORIES: FeatureCategory[] = [
  'shifts', 'rosters', 'leave', 'timesheets', 'time-tracking', 'productivity',
  'gps-geofence', 'biometric-kiosk', 'payroll', 'invoicing', 'analytics',
  'projects', 'reports', 'integrations',
];

export const listFeaturesSchema = {
  category: z.enum(CATEGORIES as [FeatureCategory, ...FeatureCategory[]])
    .optional()
    .describe('Filter to one feature category (shifts, rosters, leave, timesheets, gps-geofence, biometric-kiosk, etc.).'),
  plan: z.enum(['pro', 'business', 'enterprise']).optional()
    .describe('Only return features available in this plan tier.'),
};

export interface ListFeaturesArgs {
  category?: FeatureCategory;
  plan?: PlanType;
}

export function listFeatures(args: ListFeaturesArgs) {
  let results: Feature[] = FEATURES;
  if (args.category) results = results.filter((f) => f.category === args.category);
  if (args.plan) {
    const p = args.plan;
    results = results.filter((f) => f.availableInPlans.includes(p));
  }
  return {
    features: results,
    count: results.length,
    categories: CATEGORIES,
    source: 'https://hellotime.app/features',
  };
}
