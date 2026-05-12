import { z } from 'zod';
import { PLANS } from '../data/plans.js';
import { FEATURES } from '../data/features.js';
import { COUNTRY_SUPPORT } from '../data/countries.js';

export const featureSearchSchema = {
  query: z.string().min(2).max(120)
    .describe('Free-text query, e.g. "geofence clock-in" or "PF ESI" or "screenshots".'),
  limit: z.number().int().min(1).max(50).optional()
    .describe('Max results to return (default 20).'),
};

export interface FeatureSearchArgs {
  query: string;
  limit?: number;
}

export interface FeatureSearchHit {
  source: 'plan' | 'feature' | 'country-feature' | 'payroll-engine';
  id: string;
  label: string;
  description: string;
  context?: string;
  url?: string;
  score: number;
}

function score(haystack: string, terms: string[]): number {
  const h = haystack.toLowerCase();
  let s = 0;
  for (const t of terms) {
    if (!t) continue;
    const tl = t.toLowerCase();
    if (h === tl) s += 10;
    else if (h.startsWith(tl)) s += 5;
    else if (h.includes(tl)) s += 2;
  }
  return s;
}

export function featureSearch(args: FeatureSearchArgs) {
  const limit = args.limit ?? 20;
  const terms = args.query.trim().split(/\s+/).filter(Boolean);
  const hits: FeatureSearchHit[] = [];

  for (const plan of PLANS) {
    for (const f of plan.features) {
      const s = score(f, terms);
      if (s > 0) {
        hits.push({
          source: 'plan',
          id: `${plan.plan}:${f}`,
          label: f,
          description: `Feature of the ${plan.name} plan.`,
          context: plan.name,
          url: plan.publicSignupUrl,
          score: s,
        });
      }
    }
  }

  for (const f of FEATURES) {
    const blob = `${f.label} ${f.description} ${f.category}`;
    const s = score(blob, terms);
    if (s > 0) {
      hits.push({
        source: 'feature',
        id: f.id,
        label: f.label,
        description: f.description,
        context: f.category,
        url: 'https://hellotime.ai/features',
        score: s,
      });
    }
  }

  for (const c of COUNTRY_SUPPORT) {
    for (const f of c.features) {
      const s = score(`${f.label} ${f.description}`, terms);
      if (s > 0) {
        hits.push({
          source: 'country-feature',
          id: `${c.country}:${f.key}`,
          label: f.label,
          description: f.description,
          context: c.countryName,
          url: c.marketingUrl,
          score: s,
        });
      }
    }
    for (const e of c.payrollEngines) {
      const s = score(`${e.label} ${e.authority} ${e.description}`, terms);
      if (s > 0) {
        hits.push({
          source: 'payroll-engine',
          id: `${c.country}:${e.key}`,
          label: e.label,
          description: `${e.authority} · ${e.description} (${e.status})`,
          context: c.countryName,
          url: c.marketingUrl,
          score: s,
        });
      }
    }
  }

  hits.sort((a, b) => b.score - a.score);
  return {
    query: args.query,
    count: Math.min(hits.length, limit),
    totalMatches: hits.length,
    results: hits.slice(0, limit),
  };
}
