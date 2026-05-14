import { z } from 'zod';
import { STATUTORY_RATES } from '../data/statutoryRates.js';
import type {
  StatutoryRate,
  StatutoryCountry,
  StatutoryCategory,
} from '../data/statutoryRates.js';

const CATEGORIES: StatutoryCategory[] = [
  'social-security',
  'health-insurance',
  'income-tax',
  'professional-tax',
  'pension',
  'unemployment',
  'state-payroll-tax',
  'labour-welfare-fund',
];

export const statutoryRatesSchema = {
  country: z.enum(['IN', 'AU', 'US']).optional()
    .describe('Filter to one country. IN is the comprehensively-verified block; AU and US are public-source-unreviewed.'),
  scheme: z.string().optional()
    .describe('Match a scheme key like "PF", "ESI", "PT", "LWF", "TDS", "SuperGuarantee", "FICA-SS", "FICA-Medicare", "FUTA", "401k", "MedicareLevy". Case-insensitive substring match.'),
  category: z.enum(CATEGORIES as [StatutoryCategory, ...StatutoryCategory[]])
    .optional()
    .describe('Filter by statutory category (social-security, health-insurance, income-tax, professional-tax, labour-welfare-fund, pension, unemployment, state-payroll-tax).'),
  state: z.string().optional()
    .describe('For India state-scoped schemes (professional tax, labour welfare fund), the state name (e.g. "Maharashtra", "Karnataka", "Tamil Nadu", "Gujarat", "Haryana"). Case-insensitive substring match.'),
  party: z.enum(['employee', 'employer', 'both']).optional()
    .describe('Filter by who pays the contribution.'),
  verification: z.enum(['verified', 'public-source-unreviewed']).optional()
    .describe('Filter by verification status. Use "verified" to restrict to internally-reviewed rates (IN PF/ESI/PT).'),
  id: z.string().optional()
    .describe('Return a single rate by id (e.g. "in-pf-employee", "au-super-guarantee-fy2526").'),
};

export interface StatutoryRatesArgs {
  country?: StatutoryCountry;
  scheme?: string;
  category?: StatutoryCategory;
  state?: string;
  party?: 'employee' | 'employer' | 'both';
  verification?: 'verified' | 'public-source-unreviewed';
  id?: string;
}

export function statutoryRates(args: StatutoryRatesArgs) {
  let results: StatutoryRate[] = STATUTORY_RATES;
  if (args.id) {
    const idLc = args.id.toLowerCase();
    results = results.filter((r) => r.id === idLc);
  }
  if (args.country) results = results.filter((r) => r.country === args.country);
  if (args.category) results = results.filter((r) => r.category === args.category);
  if (args.verification) results = results.filter((r) => r.verification === args.verification);
  if (args.party) {
    if (args.party === 'both') {
      results = results.filter((r) => r.party === 'both');
    } else {
      const p = args.party;
      results = results.filter((r) => r.party === p || r.party === 'both');
    }
  }
  if (args.scheme) {
    const s = args.scheme.toLowerCase();
    results = results.filter((r) => r.scheme.toLowerCase().includes(s));
  }
  if (args.state) {
    const st = args.state.toLowerCase();
    results = results.filter((r) => r.state?.toLowerCase().includes(st) ?? false);
  }

  const verifiedCount = results.filter((r) => r.verification === 'verified').length;
  const unreviewedCount = results.length - verifiedCount;

  return {
    rates: results,
    count: results.length,
    verifiedCount,
    unreviewedCount,
    disclaimer:
      'Statutory rates change with annual Finance Acts, EPFO / ESIC / state ' +
      'notifications, and equivalent updates abroad. Always reconcile against ' +
      'the issuing authority\'s latest notification before using these numbers ' +
      'for an actual filing. Entries marked verification="public-source-unreviewed" ' +
      'reflect public-domain sources that have not yet been through HelloTime\'s ' +
      'internal review pass.',
    source: 'https://hellotime.ai/free-tools/pf-esi-calculator',
  };
}
