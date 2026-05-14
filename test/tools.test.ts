import { test } from 'node:test';
import assert from 'node:assert/strict';

import { listPlans } from '../src/tools/listPlans.js';
import { listFeatures } from '../src/tools/listFeatures.js';
import { countrySupport } from '../src/tools/countrySupport.js';
import { payrollCapabilities } from '../src/tools/payrollCapabilities.js';
import { featureSearch } from '../src/tools/featureSearch.js';
import { listArticles } from '../src/tools/listArticles.js';
import { ARTICLES } from '../src/data/articles.js';

test('list_plans returns all 5 tiers when unfiltered', () => {
  const r = listPlans({});
  const names = r.plans.map((p) => p.plan).sort();
  assert.deepEqual(names, ['attend', 'business', 'free', 'pro', 'track']);
  // Each plan has prices for 8 countries
  for (const p of r.plans) {
    assert.equal(p.prices.length, 8);
  }
  assert.equal(r.freeTrialDays, 7);
  assert.equal(r.annualPrepayDiscountPercent, 20);
  assert.ok(r.volumeDiscounts.length >= 6);
});

test('list_plans Free plan is zero across every currency', () => {
  const r = listPlans({ plan: 'free' });
  assert.equal(r.plans.length, 1);
  const free = r.plans[0]!;
  assert.equal(free.plan, 'free');
  for (const p of free.prices) {
    assert.equal(p.monthlyPromo, 0);
    assert.equal(p.monthlyList, 0);
    assert.equal(p.annualPromo, 0);
    assert.equal(p.annualList, 0);
  }
});

test('list_plans IN promo prices match canonical 5-tier ladder', () => {
  // Mirror lib/pricing.ts on Hellotime-website main.
  const expected: Record<string, { promo: number; list: number }> = {
    free:     { promo: 0,   list: 0   },
    attend:   { promo: 49,  list: 99  },
    track:    { promo: 99,  list: 199 },
    pro:      { promo: 199, list: 399 },
    business: { promo: 399, list: 799 },
  };
  const r = listPlans({ country: 'IN' });
  for (const p of r.plans) {
    const want = expected[p.plan]!;
    assert.equal(p.prices[0]!.monthlyPromo, want.promo, `${p.plan} promo`);
    assert.equal(p.prices[0]!.monthlyList, want.list, `${p.plan} list`);
  }
});

test('list_plans country filter narrows to that country only', () => {
  const r = listPlans({ country: 'IN' });
  for (const p of r.plans) {
    assert.equal(p.prices.length, 1);
    assert.equal(p.prices[0]!.country, 'IN');
    assert.equal(p.prices[0]!.currency, 'INR');
  }
});

test('list_plans plan filter restricts to single tier', () => {
  const r = listPlans({ plan: 'business' });
  assert.equal(r.plans.length, 1);
  assert.equal(r.plans[0]!.plan, 'business');
});

test('list_features returns all categories when unfiltered', () => {
  const r = listFeatures({});
  assert.ok(r.count > 0);
  // At least one feature in each of these categories
  const cats = new Set(r.features.map((f) => f.category));
  for (const c of ['shifts', 'rosters', 'leave', 'timesheets', 'gps-geofence', 'biometric-kiosk', 'payroll']) {
    assert.ok(cats.has(c as never), `expected category ${c} present`);
  }
});

test('list_features category filter works', () => {
  const r = listFeatures({ category: 'biometric-kiosk' });
  assert.ok(r.count > 0);
  for (const f of r.features) assert.equal(f.category, 'biometric-kiosk');
});

test('list_features plan filter excludes higher-tier features for pro', () => {
  const r = listFeatures({ plan: 'pro' });
  for (const f of r.features) assert.ok(f.availableInPlans.includes('pro'));
});

test('country_support returns full matrix when unfiltered', () => {
  const r = countrySupport({});
  assert.equal(r.count, 8);
});

test('country_support single country returns only that one', () => {
  const r = countrySupport({ country: 'IN' });
  assert.equal(r.count, 1);
  assert.equal(r.countries[0]!.country, 'IN');
  // GST invoicing must be a feature
  const keys = r.countries[0]!.features.map((f) => f.key);
  assert.ok(keys.includes('gst-invoicing'));
});

test('payroll_capabilities returns engines for India', () => {
  const r = payrollCapabilities({ country: 'IN' });
  const labels = r.engines.map((e) => e.label);
  assert.ok(labels.some((l) => l.includes('Provident Fund')));
  assert.ok(labels.some((l) => l.includes('Employees State Insurance')));
  assert.ok(labels.some((l) => l.includes('TDS')));
  assert.ok(labels.some((l) => l.includes('Form 24Q')));
});

test('payroll_capabilities returns AU STP2 + super', () => {
  const r = payrollCapabilities({ country: 'AU' });
  const labels = r.engines.map((e) => e.label);
  assert.ok(labels.some((l) => l.includes('Single Touch Payroll')));
  assert.ok(labels.some((l) => l.includes('SuperStream')));
});

test('payroll_capabilities returns US W-2 + 1099', () => {
  const r = payrollCapabilities({ country: 'US' });
  const labels = r.engines.map((e) => e.label);
  assert.ok(labels.some((l) => l.includes('W-2')));
  assert.ok(labels.some((l) => l.includes('1099')));
});

test('feature_search ranks geofence results highly', () => {
  const r = featureSearch({ query: 'geofence clock-in' });
  assert.ok(r.totalMatches > 0);
  const top = r.results[0]!;
  assert.match(`${top.label} ${top.description}`, /geofence|GPS|clock/i);
});

test('feature_search finds biometric kiosk', () => {
  const r = featureSearch({ query: 'face recognition kiosk' });
  assert.ok(r.totalMatches > 0);
  const sources = new Set(r.results.map((h) => h.source));
  assert.ok(sources.has('feature') || sources.has('country-feature'));
});

test('feature_search finds India statutory engines (PF / ESI)', () => {
  const r = featureSearch({ query: 'PF ESI provident fund' });
  assert.ok(r.totalMatches > 0);
  const sources = new Set(r.results.map((h) => h.source));
  assert.ok(sources.has('payroll-engine') || sources.has('feature'));
});

test('feature_search respects limit', () => {
  const r = featureSearch({ query: 'tracking', limit: 3 });
  assert.ok(r.results.length <= 3);
});

// ---------------------------------------------------------------------------
// list_articles
// ---------------------------------------------------------------------------

test('list_articles catalog is non-trivial and well-formed', () => {
  assert.ok(ARTICLES.length >= 30, 'expected at least 30 articles in catalog');
  for (const a of ARTICLES) {
    assert.ok(a.id.length > 0, `${a.title}: id must be non-empty`);
    assert.ok(a.title.length > 0, `${a.id}: title must be non-empty`);
    assert.ok(a.excerpt.length > 30, `${a.id}: excerpt must be at least 30 chars`);
    assert.ok(a.excerpt.length <= 320, `${a.id}: excerpt should stay under 320 chars`);
    assert.ok(a.url.startsWith('https://hellotime.ai/'), `${a.id}: url must be hellotime.ai`);
    assert.match(a.publishedAt, /^\d{4}-\d{2}-\d{2}$/, `${a.id}: publishedAt must be YYYY-MM-DD`);
    assert.ok(['blog', 'guide', 'case-study'].includes(a.kind), `${a.id}: kind invalid`);
    assert.ok(Array.isArray(a.tags) && a.tags.length > 0, `${a.id}: must have at least one tag`);
  }
});

test('list_articles ids are unique', () => {
  const ids = ARTICLES.map((a) => a.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate ids in catalog');
});

test('list_articles unfiltered returns the full catalog (subject to default limit)', () => {
  const r = listArticles({ limit: 100 });
  assert.equal(r.totalMatches, ARTICLES.length);
  assert.equal(r.catalogSize, ARTICLES.length);
});

test('list_articles country=IN returns India-relevant + global articles', () => {
  const r = listArticles({ country: 'IN', limit: 100 });
  assert.ok(r.totalMatches > 0);
  for (const a of r.articles) {
    const c = a.countryRelevance ?? 'global';
    assert.ok(c === 'IN' || c === 'global', `${a.id}: country ${c} should not match IN filter`);
  }
  // Sanity — we expect at least one India-specific article in the catalog.
  assert.ok(
    r.articles.some((a) => a.countryRelevance === 'IN'),
    'expected at least one IN article in IN filter results',
  );
});

test('list_articles country=US returns only US + global', () => {
  const r = listArticles({ country: 'US', limit: 100 });
  for (const a of r.articles) {
    const c = a.countryRelevance ?? 'global';
    assert.ok(c === 'US' || c === 'global');
  }
});

test('list_articles country=global returns only global articles', () => {
  const r = listArticles({ country: 'global', limit: 100 });
  for (const a of r.articles) {
    assert.equal(a.countryRelevance ?? 'global', 'global');
  }
});

test('list_articles tag filter matches case-insensitively', () => {
  const r = listArticles({ tag: 'Payroll', limit: 100 });
  assert.ok(r.totalMatches > 0);
  for (const a of r.articles) {
    assert.ok(
      a.tags.some((t) => t.toLowerCase().includes('payroll')),
      `${a.id}: should have a payroll tag`,
    );
  }
});

test('list_articles query matches across title, excerpt, and tags', () => {
  // "geofence" is in a case-study description and may appear as a tag.
  const r = listArticles({ query: 'geofence', limit: 10 });
  assert.ok(r.totalMatches > 0);
});

test('list_articles query is multi-term AND', () => {
  // Both terms must appear; "payroll india" should pick India payroll posts only.
  const r = listArticles({ query: 'payroll india', limit: 100 });
  assert.ok(r.totalMatches > 0);
  for (const a of r.articles) {
    const blob = `${a.title} ${a.excerpt} ${a.tags.join(' ')}`.toLowerCase();
    assert.ok(blob.includes('payroll'), `${a.id}: missing "payroll"`);
    assert.ok(blob.includes('india'), `${a.id}: missing "india"`);
  }
});

test('list_articles respects limit', () => {
  const r = listArticles({ limit: 3 });
  assert.equal(r.articles.length, 3);
  assert.equal(r.count, 3);
});

test('list_articles sorts newest first', () => {
  const r = listArticles({ limit: 100 });
  for (let i = 1; i < r.articles.length; i++) {
    assert.ok(
      r.articles[i - 1]!.publishedAt >= r.articles[i]!.publishedAt,
      'articles should be sorted newest-first',
    );
  }
});

test('feature_search surfaces articles in results', () => {
  // A query that should not hit plans/features/payroll but DOES match a blog.
  const r = featureSearch({ query: 'erc retention credit' });
  assert.ok(r.totalMatches > 0, 'expected article hits for ERC query');
  assert.ok(r.results.some((h) => h.source === 'article'));
});
