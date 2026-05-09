import { test } from 'node:test';
import assert from 'node:assert/strict';

import { listPlans } from '../src/tools/listPlans.js';
import { listFeatures } from '../src/tools/listFeatures.js';
import { countrySupport } from '../src/tools/countrySupport.js';
import { payrollCapabilities } from '../src/tools/payrollCapabilities.js';
import { featureSearch } from '../src/tools/featureSearch.js';

test('list_plans returns all 3 tiers when unfiltered', () => {
  const r = listPlans({});
  const names = r.plans.map((p) => p.plan).sort();
  assert.deepEqual(names, ['business', 'enterprise', 'pro']);
  // Each plan has prices for 8 countries
  for (const p of r.plans) {
    assert.equal(p.prices.length, 8);
  }
  assert.equal(r.freeTrialDays, 7);
  assert.equal(r.annualPrepayDiscountPercent, 20);
  assert.ok(r.volumeDiscounts.length >= 6);
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
