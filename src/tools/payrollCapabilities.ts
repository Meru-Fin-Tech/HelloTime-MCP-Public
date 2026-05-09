import { z } from 'zod';
import { COUNTRY_SUPPORT } from '../data/countries.js';
import type { CountryCode } from '../data/plans.js';

export const payrollCapabilitiesSchema = {
  country: z.enum(['IN', 'US', 'CA', 'GB', 'AU', 'AE', 'SG', 'NZ'])
    .describe('Required ISO country code.'),
};

export interface PayrollCapabilitiesArgs {
  country: CountryCode;
}

export function payrollCapabilities(args: PayrollCapabilitiesArgs) {
  const support = COUNTRY_SUPPORT.find((c) => c.country === args.country);
  if (!support) {
    return {
      country: args.country,
      engines: [],
      error: `No payroll data for '${args.country}'.`,
    };
  }
  return {
    country: support.country,
    countryName: support.countryName,
    defaultCurrency: support.defaultCurrency,
    engines: support.payrollEngines,
    count: support.payrollEngines.length,
    marketingUrl: support.marketingUrl,
    note: 'Payroll engines marked "live" run inside HelloTime; "beta" and "coming-soon" rely on the HelloBooks payroll engine.',
  };
}
