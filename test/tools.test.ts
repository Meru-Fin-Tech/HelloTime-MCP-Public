import { test } from 'node:test';
import assert from 'node:assert/strict';

import { listPlans } from '../src/tools/listPlans.js';
import { listFeatures } from '../src/tools/listFeatures.js';
import { countrySupport } from '../src/tools/countrySupport.js';
import { payrollCapabilities } from '../src/tools/payrollCapabilities.js';
import { featureSearch } from '../src/tools/featureSearch.js';
import { statutoryRates } from '../src/tools/statutoryRates.js';
import { listCompetitors } from '../src/tools/listCompetitors.js';

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

test('statutory_rates returns the IN PF/ESI/PT/TDS block when filtered country=IN', () => {
  const r = statutoryRates({ country: 'IN' });
  const schemes = new Set(r.rates.map((x) => x.scheme));
  for (const s of ['EPF', 'EPS', 'EDLI', 'PFAdmin', 'ESI', 'PT', 'TDS']) {
    assert.ok(schemes.has(s), `expected scheme ${s} present`);
  }
  // All IN entries from the calculator are verified (PF/ESI/PT). TDS may be unreviewed.
  const verifiedSchemes = r.rates.filter((x) => x.verification === 'verified').map((x) => x.scheme);
  for (const s of ['EPF', 'EPS', 'EDLI', 'ESI', 'PT']) {
    assert.ok(verifiedSchemes.includes(s), `expected ${s} to be internally verified`);
  }
});

test('statutory_rates PF employee/employer rates match the EPFO calculator', () => {
  const r = statutoryRates({ country: 'IN', scheme: 'EPF' });
  const employee = r.rates.find((x) => x.id === 'in-pf-employee');
  const employer = r.rates.find((x) => x.id === 'in-pf-employer-total');
  assert.ok(employee && employer);
  assert.equal(employee.rate, 0.12);
  assert.equal(employer.rate, 0.12);
  assert.equal(employee.wageCeiling, 15000);
});

test('statutory_rates EPS is 8.33% capped at PF ceiling', () => {
  const eps = statutoryRates({ id: 'in-eps' }).rates[0]!;
  assert.equal(eps.rate, 0.0833);
  assert.equal(eps.wageCeiling, 15000);
  assert.equal(eps.party, 'employer');
});

test('statutory_rates ESI is 0.75% employee + 3.25% employer, applies only if gross ≤ ₹21,000', () => {
  const employee = statutoryRates({ id: 'in-esi-employee' }).rates[0]!;
  const employer = statutoryRates({ id: 'in-esi-employer' }).rates[0]!;
  assert.equal(employee.rate, 0.0075);
  assert.equal(employer.rate, 0.0325);
  assert.equal(employee.applicableIfGrossLte, 21000);
  assert.equal(employer.applicableIfGrossLte, 21000);
});

test('statutory_rates Maharashtra PT has 3 slabs with Feb ₹300 quirk note', () => {
  const r = statutoryRates({ state: 'Maharashtra' });
  const mh = r.rates.find((x) => x.id === 'in-pt-maharashtra');
  assert.ok(mh);
  assert.equal(mh.rateType, 'slab');
  assert.equal(mh.slabs?.length, 3);
  // Highest slab (no upper bound) is ₹200/mo with Feb ₹300 quirk
  const top = mh.slabs!.find((s) => s.upTo === null)!;
  assert.equal(top.amount, 200);
  assert.match(top.note ?? '', /February|₹300/i);
});

test('statutory_rates Karnataka PT has ₹25k exemption note from 01-04-2025', () => {
  const ka = statutoryRates({ state: 'Karnataka' }).rates[0]!;
  assert.equal(ka.id, 'in-pt-karnataka');
  assert.equal(ka.effectiveFrom, '2025-04-01');
  const exempt = ka.slabs!.find((s) => s.amount === 0)!;
  assert.equal(exempt.upTo, 25000);
});

test('statutory_rates AU Super Guarantee shipping at 12% for FY 2025-26 (public-source-unreviewed)', () => {
  const sg = statutoryRates({ id: 'au-super-guarantee-fy2526' }).rates[0]!;
  assert.equal(sg.rate, 0.12);
  assert.equal(sg.party, 'employer');
  assert.equal(sg.verification, 'public-source-unreviewed');
  assert.equal(sg.currency, 'AUD');
});

test('statutory_rates US FICA SS at 6.2% + Medicare 1.45%, with 2025 SS wage base', () => {
  const ss = statutoryRates({ id: 'us-fica-social-security-employee-2025' }).rates[0]!;
  assert.equal(ss.rate, 0.062);
  assert.equal(ss.wageCeiling, 176100);
  const med = statutoryRates({ id: 'us-fica-medicare-employee' }).rates[0]!;
  assert.equal(med.rate, 0.0145);
  // Medicare has no wage base cap
  assert.equal(med.wageCeiling, undefined);
});

test('statutory_rates verification=verified excludes AU+US rates', () => {
  const r = statutoryRates({ verification: 'verified' });
  for (const x of r.rates) {
    assert.equal(x.verification, 'verified');
    assert.equal(x.country, 'IN'); // only IN PF/ESI/PT are verified
  }
});

test('statutory_rates count breakdown (verifiedCount + unreviewedCount = count)', () => {
  const r = statutoryRates({});
  assert.equal(r.verifiedCount + r.unreviewedCount, r.count);
  // Verified set should at least cover PF/EPS/EDLI/PFAdmin/ESI/×2 + 7 PT states = 12
  assert.ok(r.verifiedCount >= 12, `expected >=12 verified entries, got ${r.verifiedCount}`);
});

// ---------------------------------------------------------------------------
// Labour Welfare Fund (LWF) — covers the 11 states added in PR #11.
// ---------------------------------------------------------------------------

test('statutory_rates LWF returns 11 distinct states (Kerala counted once)', () => {
  const r = statutoryRates({ country: 'IN', scheme: 'LWF' });
  const states = new Set(r.rates.map((x) => x.state));
  // 11 states: MH, KA, TN, TS, AP, GJ, WB, KL, PB, HR, DL
  assert.equal(states.size, 11, `expected 11 LWF states, got ${[...states].join(', ')}`);
  for (const s of [
    'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Telangana', 'Andhra Pradesh',
    'Gujarat', 'West Bengal', 'Kerala', 'Punjab', 'Haryana', 'Delhi',
  ]) {
    assert.ok(states.has(s), `expected LWF entry for ${s}`);
  }
});

test('statutory_rates LWF every entry has both employee + employer parties and a period', () => {
  const r = statutoryRates({ country: 'IN', scheme: 'LWF' });
  // Group by state to confirm each has at least one employee + one employer.
  const byState: Record<string, Set<string>> = {};
  for (const x of r.rates) {
    assert.equal(x.scheme, 'LWF');
    assert.equal(x.category, 'labour-welfare-fund');
    assert.equal(x.rateType, 'flat-period');
    assert.ok(x.flatAmount !== undefined, `${x.id} missing flatAmount`);
    assert.ok(x.period, `${x.id} missing period`);
    assert.ok(['monthly', 'half-yearly', 'yearly'].includes(x.period!), `${x.id} period ${x.period} not in enum`);
    const st = x.state!;
    byState[st] = byState[st] ?? new Set();
    byState[st]!.add(x.party);
  }
  for (const [state, parties] of Object.entries(byState)) {
    assert.ok(parties.has('employee'), `${state} missing employee entry`);
    assert.ok(parties.has('employer'), `${state} missing employer entry`);
  }
});

test('statutory_rates LWF Maharashtra: ₹25 employee / ₹75 employer half-yearly (Jun + Dec)', () => {
  const emp = statutoryRates({ id: 'in-lwf-maharashtra-employee' }).rates[0]!;
  const er = statutoryRates({ id: 'in-lwf-maharashtra-employer' }).rates[0]!;
  assert.equal(emp.flatAmount, 25);
  assert.equal(er.flatAmount, 75);
  assert.equal(emp.period, 'half-yearly');
  assert.equal(er.period, 'half-yearly');
  assert.deepEqual(emp.deductionMonths, [6, 12]);
  assert.deepEqual(er.deductionMonths, [6, 12]);
  assert.equal(emp.verification, 'verified');
  assert.equal(emp.effectiveFrom, '2024-03-18');
});

test('statutory_rates LWF Karnataka: ₹50 / ₹100 yearly (Dec close), verified post-2024 amendment', () => {
  const emp = statutoryRates({ id: 'in-lwf-karnataka-employee' }).rates[0]!;
  const er = statutoryRates({ id: 'in-lwf-karnataka-employer' }).rates[0]!;
  assert.equal(emp.flatAmount, 50);
  assert.equal(er.flatAmount, 100);
  assert.equal(emp.period, 'yearly');
  assert.equal(er.period, 'yearly');
  assert.deepEqual(emp.deductionMonths, [12]);
  assert.equal(emp.verification, 'verified');
  assert.equal(emp.effectiveFrom, '2025-01-10');
});

test('statutory_rates LWF Tamil Nadu is annual (Dec close), NOT half-yearly', () => {
  const emp = statutoryRates({ id: 'in-lwf-tamil-nadu-employee' }).rates[0]!;
  assert.equal(emp.flatAmount, 20);
  assert.equal(emp.period, 'yearly');
  assert.deepEqual(emp.deductionMonths, [12]);
  // Cross-state framing varies — record an unreviewed status pending direct gazette check.
  assert.equal(emp.verification, 'public-source-unreviewed');
});

test('statutory_rates LWF Telangana: ₹2 / ₹5 yearly, unrevised since 1987 Act', () => {
  const emp = statutoryRates({ id: 'in-lwf-telangana-employee' }).rates[0]!;
  const er = statutoryRates({ id: 'in-lwf-telangana-employer' }).rates[0]!;
  assert.equal(emp.flatAmount, 2);
  assert.equal(er.flatAmount, 5);
  assert.equal(emp.period, 'yearly');
  assert.equal(emp.effectiveFrom, '1987-01-01');
  assert.equal(emp.verification, 'verified');
});

test('statutory_rates LWF Andhra Pradesh: ₹30 / ₹70 yearly (Dec close)', () => {
  const emp = statutoryRates({ id: 'in-lwf-andhra-pradesh-employee' }).rates[0]!;
  const er = statutoryRates({ id: 'in-lwf-andhra-pradesh-employer' }).rates[0]!;
  assert.equal(emp.flatAmount, 30);
  assert.equal(er.flatAmount, 70);
  assert.equal(emp.period, 'yearly');
});

test('statutory_rates LWF Gujarat is half-yearly (NOT monthly): ₹6 / ₹12', () => {
  const emp = statutoryRates({ id: 'in-lwf-gujarat-employee' }).rates[0]!;
  const er = statutoryRates({ id: 'in-lwf-gujarat-employer' }).rates[0]!;
  assert.equal(emp.flatAmount, 6);
  assert.equal(er.flatAmount, 12);
  assert.equal(emp.period, 'half-yearly');
  assert.deepEqual(emp.deductionMonths, [6, 12]);
  // Common payroll guides mislabel Gujarat as monthly — the Act prescribes half-yearly.
  assert.match(emp.notes?.join(' ') ?? '', /half-yearly/i);
});

test('statutory_rates LWF West Bengal: ₹3 / ₹30 half-yearly (employer share doubled in 2024)', () => {
  const emp = statutoryRates({ id: 'in-lwf-west-bengal-employee' }).rates[0]!;
  const er = statutoryRates({ id: 'in-lwf-west-bengal-employer' }).rates[0]!;
  assert.equal(emp.flatAmount, 3);
  assert.equal(er.flatAmount, 30);
  assert.equal(emp.period, 'half-yearly');
  assert.equal(emp.verification, 'verified');
  assert.equal(emp.effectiveFrom, '2024-01-01');
});

test('statutory_rates LWF Kerala has TWO regimes (factories half-yearly, shops monthly)', () => {
  const r = statutoryRates({ state: 'Kerala', scheme: 'LWF' });
  // Two regimes × (employee + employer) = 4 entries
  assert.equal(r.rates.length, 4);
  const factoriesEmp = r.rates.find((x) => x.id === 'in-lwf-kerala-factories-employee')!;
  const shopsEmp = r.rates.find((x) => x.id === 'in-lwf-kerala-shops-employee')!;
  assert.equal(factoriesEmp.flatAmount, 4);
  assert.equal(factoriesEmp.period, 'half-yearly');
  assert.equal(shopsEmp.flatAmount, 50);
  assert.equal(shopsEmp.period, 'monthly');
});

test('statutory_rates LWF Punjab: ₹5 / ₹20 monthly (flat, not wage-percentage)', () => {
  const emp = statutoryRates({ id: 'in-lwf-punjab-employee' }).rates[0]!;
  const er = statutoryRates({ id: 'in-lwf-punjab-employer' }).rates[0]!;
  assert.equal(emp.flatAmount, 5);
  assert.equal(er.flatAmount, 20);
  assert.equal(emp.period, 'monthly');
});

test('statutory_rates LWF Haryana: ₹34 / ₹68 monthly cap (Jan 2025 revision)', () => {
  const emp = statutoryRates({ id: 'in-lwf-haryana-employee' }).rates[0]!;
  const er = statutoryRates({ id: 'in-lwf-haryana-employer' }).rates[0]!;
  assert.equal(emp.flatAmount, 34);
  assert.equal(er.flatAmount, 68);
  assert.equal(emp.period, 'monthly');
  assert.equal(emp.verification, 'verified');
  assert.equal(emp.effectiveFrom, '2025-01-01');
  // appliedTo describes the wage-linked formula behind the cap.
  assert.match(emp.appliedTo, /0\.2%/);
});

test('statutory_rates LWF Delhi: ₹0.75 / ₹2.25 half-yearly (nominal 1997-era rates)', () => {
  const emp = statutoryRates({ id: 'in-lwf-delhi-employee' }).rates[0]!;
  const er = statutoryRates({ id: 'in-lwf-delhi-employer' }).rates[0]!;
  assert.equal(emp.flatAmount, 0.75);
  assert.equal(er.flatAmount, 2.25);
  assert.equal(emp.period, 'half-yearly');
});

test('statutory_rates category=labour-welfare-fund returns only LWF entries', () => {
  const r = statutoryRates({ category: 'labour-welfare-fund' });
  assert.ok(r.count >= 22, `expected at least 22 LWF entries (11 states × 2 + Kerala extra regime), got ${r.count}`);
  for (const x of r.rates) {
    assert.equal(x.scheme, 'LWF');
    assert.equal(x.category, 'labour-welfare-fund');
    assert.equal(x.country, 'IN');
  }
});

test('statutory_rates state=Maharashtra returns BOTH the PT and LWF entries', () => {
  const r = statutoryRates({ state: 'Maharashtra' });
  const schemes = new Set(r.rates.map((x) => x.scheme));
  assert.ok(schemes.has('PT'), 'expected Maharashtra PT entry');
  assert.ok(schemes.has('LWF'), 'expected Maharashtra LWF entries');
});

test('feature_search "LWF Maharashtra" surfaces the Maharashtra LWF entry', () => {
  const r = featureSearch({ query: 'LWF Maharashtra' });
  const hit = r.results.find((h) => h.source === 'statutory-rate' && h.id.startsWith('in-lwf-maharashtra'));
  assert.ok(hit, 'expected a Maharashtra LWF hit');
  // Description should embed the half-yearly amount.
  assert.match(hit.description, /INR (25|75)\/half-yearly/);
});

test('feature_search "labour welfare fund" routes to LWF entries (not PF/ESI)', () => {
  const r = featureSearch({ query: 'labour welfare fund' });
  const lwfHits = r.results.filter((h) => h.source === 'statutory-rate' && h.id.startsWith('in-lwf-'));
  assert.ok(lwfHits.length > 0, 'expected at least one LWF hit');
});

test('feature_search "PF rate" surfaces the EPF statutory rate entry', () => {
  const r = featureSearch({ query: 'PF rate' });
  const hit = r.results.find((h) => h.source === 'statutory-rate' && h.id === 'in-pf-employee');
  assert.ok(hit, 'expected an EPF rate hit');
  assert.match(hit.description, /12%/);
});

test('feature_search "PT slab Maharashtra" routes to Maharashtra PT entry', () => {
  const r = featureSearch({ query: 'PT slab Maharashtra' });
  const hit = r.results.find((h) => h.source === 'statutory-rate' && h.id === 'in-pt-maharashtra');
  assert.ok(hit, 'expected Maharashtra PT hit');
});

test('feature_search "Super Guarantee" routes to AU super entries', () => {
  const r = featureSearch({ query: 'Super Guarantee' });
  // At least one AU super hit
  const auSuper = r.results.find((h) => h.source === 'statutory-rate' && h.id.startsWith('au-super'));
  assert.ok(auSuper, 'expected AU Super Guarantee hit');
});

test('list_competitors returns the full catalog when unfiltered', () => {
  const r = listCompetitors({});
  assert.ok(r.count >= 6, 'expect at least the 6 catalog competitors');
  const ids = r.competitors.map((c) => c.id).sort();
  for (const expected of ['truein', 'deputy', 'when-i-work', 'connecteam', 'hubstaff', 'keka']) {
    assert.ok(ids.includes(expected), `missing competitor: ${expected}`);
  }
});

test('list_competitors every entry has honest both-sides positioning', () => {
  const r = listCompetitors({});
  for (const c of r.competitors) {
    assert.ok(c.whereWeWin.length >= 3, `${c.id} should ship >=3 whereWeWin bullets`);
    assert.ok(c.whereTheyWin.length >= 3, `${c.id} should ship >=3 whereTheyWin bullets — honesty is non-negotiable`);
    assert.ok(c.positioningSummary.length > 80, `${c.id} positioningSummary should be a real paragraph`);
    assert.ok(c.segment.length > 0);
  }
});

test('list_competitors Truein is the primary India rival (NOT Keka)', () => {
  // Guardrail against the well-known misattribution that Keka is the primary
  // India HelloTime rival. The primary India rival is Truein.
  const india = listCompetitors({ country: 'IN', tier: 'primary' });
  const ids = india.competitors.map((c) => c.id);
  assert.ok(ids.includes('truein'), 'Truein must be a primary India rival');
  assert.ok(!ids.includes('keka'), 'Keka must NOT be in the primary tier — it is HRMS-adjacent, classified secondary');
});

test('list_competitors tier=primary excludes secondary entries', () => {
  const r = listCompetitors({ tier: 'primary' });
  for (const c of r.competitors) assert.equal(c.tier, 'primary');
  const ids = r.competitors.map((c) => c.id);
  // Verified primary rivals
  assert.ok(ids.includes('truein'));
  assert.ok(ids.includes('deputy'));
  assert.ok(ids.includes('when-i-work'));
  assert.ok(ids.includes('connecteam'));
});

test('list_competitors id filter returns exactly one entry', () => {
  const r = listCompetitors({ id: 'truein' });
  assert.equal(r.count, 1);
  assert.equal(r.competitors[0]!.id, 'truein');
});

test('feature_search "vs Truein" ranks the Truein competitor entry at the top', () => {
  const r = featureSearch({ query: 'vs Truein' });
  assert.ok(r.totalMatches > 0);
  const top = r.results[0]!;
  assert.equal(top.source, 'competitor');
  assert.equal(top.id, 'truein');
});

test('feature_search "Deputy alternative" surfaces the competitor entry', () => {
  const r = featureSearch({ query: 'Deputy alternative' });
  const hit = r.results.find((h) => h.source === 'competitor' && h.id === 'deputy');
  assert.ok(hit, 'expected a competitor hit for Deputy');
});

test('feature_search "Connecteam comparison" finds the Connecteam competitor entry', () => {
  const r = featureSearch({ query: 'Connecteam comparison' });
  const hit = r.results.find((h) => h.source === 'competitor' && h.id === 'connecteam');
  assert.ok(hit, 'expected a competitor hit for Connecteam');
});
