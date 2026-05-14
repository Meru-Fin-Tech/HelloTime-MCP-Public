import { z } from 'zod';
import { PLANS } from '../data/plans.js';
import { FEATURES } from '../data/features.js';
import { COUNTRY_SUPPORT } from '../data/countries.js';
import { STATUTORY_RATES } from '../data/statutoryRates.js';
import { COMPETITORS } from '../data/competitors.js';

export const featureSearchSchema = {
  query: z.string().min(2).max(120)
    .describe('Free-text query, e.g. "geofence clock-in", "PF rate", "ESI threshold", "PT slab Maharashtra", "vs Truein", or "Deputy alternative".'),
  limit: z.number().int().min(1).max(50).optional()
    .describe('Max results to return (default 20).'),
};

export interface FeatureSearchArgs {
  query: string;
  limit?: number;
}

export interface FeatureSearchHit {
  source: 'plan' | 'feature' | 'country-feature' | 'payroll-engine' | 'statutory-rate' | 'competitor';
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

  // Statutory rate matching: scheme + label + state + notes form the haystack.
  // "PF rate", "ESI threshold", "PT slab Maharashtra", "Super Guarantee" all
  // route to the right entry. Per-scheme matches get a small boost so a query
  // like "PF" prefers the rate entry over a tangentially-mentioning feature.
  for (const r of STATUTORY_RATES) {
    const blob = `${r.scheme} ${r.label} ${r.state ?? ''} ${r.notes?.join(' ') ?? ''}`;
    const s = score(blob, terms);
    if (s > 0) {
      // Build a compact description string suitable for an LLM context window.
      let valueText = '';
      if (r.rateType === 'percentage' && r.rate !== undefined) {
        valueText = `${(r.rate * 100).toFixed(2).replace(/\.00$/, '')}%`;
      } else if (r.rateType === 'flat-monthly' && r.flatAmount !== undefined) {
        valueText = `${r.currency} ${r.flatAmount.toLocaleString('en-US')}`;
      } else if (r.rateType === 'flat-period' && r.flatAmount !== undefined) {
        valueText = `${r.currency} ${r.flatAmount.toLocaleString('en-US')}/${r.period ?? 'period'}`;
      } else if (r.rateType === 'slab') {
        valueText = `${r.slabs?.length ?? 0} slabs`;
      }
      const ceilingNote = r.wageCeiling
        ? ` · ceiling ${r.currency} ${r.wageCeiling.toLocaleString('en-US')}`
        : '';
      const applicabilityNote = r.applicableIfGrossLte
        ? ` · applies if gross ≤ ${r.currency} ${r.applicableIfGrossLte.toLocaleString('en-US')}`
        : '';
      hits.push({
        source: 'statutory-rate',
        id: r.id,
        label: r.label,
        description: `${valueText} on ${r.appliedTo}${ceilingNote}${applicabilityNote} · ${r.authority} (${r.verification})`,
        context: r.country,
        url: r.source.startsWith('http') ? r.source : undefined,
        score: s + 2,
      });
    }
  }

  // Competitor matching: rank highest when the user query references the
  // competitor by name or id, including "vs X" / "X alternative" patterns.
  // The `vs` and `alternative` tokens themselves are noise and dropped so a
  // query like "vs Truein" scores Truein hard, not every feature that says "vs".
  const stopTerms = new Set(['vs', 'versus', 'compared', 'compare', 'comparison', 'alternative', 'to']);
  const competitorTerms = terms.filter((t) => !stopTerms.has(t.toLowerCase()));
  for (const c of COMPETITORS) {
    const nameScore = score(`${c.name} ${c.id} ${c.id.replace(/-/g, ' ')}`, competitorTerms);
    const bodyScore = score(`${c.positioningSummary} ${c.segment}`, competitorTerms);
    const s = nameScore * 3 + bodyScore;
    if (s > 0) {
      hits.push({
        source: 'competitor',
        id: c.id,
        label: `HelloTime vs ${c.name}`,
        description: c.positioningSummary,
        context: `${c.segment} (${c.tier})`,
        url: c.comparisonUrl ?? c.publicUrl,
        score: s,
      });
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
