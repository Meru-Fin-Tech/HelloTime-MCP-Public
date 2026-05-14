import { test } from 'node:test';
import assert from 'node:assert/strict';

import { listPlans } from '../src/tools/listPlans.js';
import { listFeatures } from '../src/tools/listFeatures.js';
import { countrySupport } from '../src/tools/countrySupport.js';
import { payrollCapabilities } from '../src/tools/payrollCapabilities.js';
import { featureSearch } from '../src/tools/featureSearch.js';
import { statutoryRates } from '../src/tools/statutoryRates.js';

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
  const hits = r.results.filter((h) => h.source === 'statutory-rate' && h.scheme !== undefined ? true : (h.id?.startsWith('au-super') ?? false));
  // At least one AU super hit
  const auSuper = r.results.find((h) => h.source === 'statutory-rate' && h.id.startsWith('au-super'));
  assert.ok(auSuper, 'expected AU Super Guarantee hit');
});

// ---------------------------------------------------------------------------
// UK (HMRC) — public-source-unreviewed headline rates
// ---------------------------------------------------------------------------

test('statutory_rates GB NI Class 1 employee — 8% main / 2% additional band (2025-26)', () => {
  const ni = statutoryRates({ id: 'gb-ni-class1-employee-2025' }).rates[0]!;
  assert.equal(ni.country, 'GB');
  assert.equal(ni.rateType, 'slab');
  assert.equal(ni.slabs?.length, 3);
  // Primary threshold = £12,570; UEL = £50,270
  const ptBand = ni.slabs!.find((s) => s.upTo === 12570)!;
  assert.equal(ptBand.rate, 0);
  const mainBand = ni.slabs!.find((s) => s.upTo === 50270)!;
  assert.equal(mainBand.rate, 0.08);
  const top = ni.slabs!.find((s) => s.upTo === null)!;
  assert.equal(top.rate, 0.02);
  assert.equal(ni.currency, 'GBP');
  assert.equal(ni.verification, 'public-source-unreviewed');
});

test('statutory_rates GB NI Class 1 employer is 15% post Autumn Budget 2024', () => {
  const ni = statutoryRates({ id: 'gb-ni-class1-employer-2025' }).rates[0]!;
  assert.equal(ni.rate, 0.15);
  assert.equal(ni.party, 'employer');
  assert.equal(ni.effectiveFrom, '2025-04-06');
});

test('statutory_rates GB PAYE bands — 0/20/40/45 with £12,570 personal allowance', () => {
  const paye = statutoryRates({ id: 'gb-paye-income-tax-2025' }).rates[0]!;
  assert.equal(paye.rateType, 'slab');
  const slabs = paye.slabs!;
  assert.equal(slabs.find((s) => s.upTo === 12570)!.rate, 0);
  assert.equal(slabs.find((s) => s.upTo === 50270)!.rate, 0.20);
  assert.equal(slabs.find((s) => s.upTo === 125140)!.rate, 0.40);
  assert.equal(slabs.find((s) => s.upTo === null)!.rate, 0.45);
});

test('statutory_rates GB auto-enrolment splits 3% employer + 5% employee = 8% total', () => {
  const total = statutoryRates({ id: 'gb-pension-auto-enrol-total' }).rates[0]!;
  const employer = statutoryRates({ id: 'gb-pension-auto-enrol-employer' }).rates[0]!;
  const employee = statutoryRates({ id: 'gb-pension-auto-enrol-employee' }).rates[0]!;
  assert.equal(total.rate, 0.08);
  assert.equal(employer.rate, 0.03);
  assert.equal(employee.rate, 0.05);
  // Sanity: employer + employee == total
  assert.equal(
    Math.round((employer.rate! + employee.rate!) * 1000) / 1000,
    total.rate,
  );
});

test('statutory_rates GB Apprenticeship Levy is 0.5% above £3M paybill', () => {
  const al = statutoryRates({ id: 'gb-apprenticeship-levy' }).rates[0]!;
  assert.equal(al.rate, 0.005);
  assert.equal(al.party, 'employer');
  assert.match(al.appliedTo, /3,000,000/);
});

// ---------------------------------------------------------------------------
// Canada (CRA) — public-source-unreviewed headline rates
// ---------------------------------------------------------------------------

test('statutory_rates CA CPP — 5.95% each side, YMPE $71,300 for 2025', () => {
  const ee = statutoryRates({ id: 'ca-cpp-employee-2025' }).rates[0]!;
  const er = statutoryRates({ id: 'ca-cpp-employer-2025' }).rates[0]!;
  assert.equal(ee.rate, 0.0595);
  assert.equal(er.rate, 0.0595);
  assert.equal(ee.wageCeiling, 71300);
  assert.equal(er.wageCeiling, 71300);
  assert.equal(ee.currency, 'CAD');
});

test('statutory_rates CA CPP2 — 4% each side, YAMPE $81,200 for 2025', () => {
  const ee = statutoryRates({ id: 'ca-cpp2-employee-2025' }).rates[0]!;
  const er = statutoryRates({ id: 'ca-cpp2-employer-2025' }).rates[0]!;
  assert.equal(ee.rate, 0.04);
  assert.equal(er.rate, 0.04);
  assert.equal(ee.wageCeiling, 81200);
  assert.equal(er.wageCeiling, 81200);
});

test('statutory_rates CA EI — employee 1.64%, employer 1.4× (≈2.296%) on MIE $65,700', () => {
  const ee = statutoryRates({ id: 'ca-ei-employee-2025' }).rates[0]!;
  const er = statutoryRates({ id: 'ca-ei-employer-2025' }).rates[0]!;
  assert.equal(ee.rate, 0.0164);
  assert.equal(er.rate, 0.02296);
  // Sanity: employer is 1.4× employee within float tolerance
  assert.ok(Math.abs(er.rate! - ee.rate! * 1.4) < 1e-6);
  assert.equal(ee.wageCeiling, 65700);
});

test('statutory_rates CA federal income tax has 5 brackets 15/20.5/26/29/33', () => {
  const it = statutoryRates({ id: 'ca-federal-income-tax-2025' }).rates[0]!;
  assert.equal(it.rateType, 'slab');
  assert.equal(it.slabs?.length, 5);
  const rates = it.slabs!.map((s) => s.rate);
  assert.deepEqual(rates, [0.15, 0.205, 0.26, 0.29, 0.33]);
  // Note flags provincial stub
  assert.ok(it.notes?.some((n) => /STUB|provincial/i.test(n)));
});

// ---------------------------------------------------------------------------
// Singapore (CPF + IRAS) — public-source-unreviewed headline rates
// ---------------------------------------------------------------------------

test('statutory_rates SG CPF under-55 = 17% employer + 20% employee on OW ceiling $7,400', () => {
  const er = statutoryRates({ id: 'sg-cpf-employer-under-55-2025' }).rates[0]!;
  const ee = statutoryRates({ id: 'sg-cpf-employee-under-55-2025' }).rates[0]!;
  assert.equal(er.rate, 0.17);
  assert.equal(ee.rate, 0.20);
  assert.equal(er.wageCeiling, 7400);
  assert.equal(ee.wageCeiling, 7400);
  assert.equal(er.currency, 'SGD');
});

test('statutory_rates SG CPF age tiers step DOWN as age rises', () => {
  // Combined rates: <55: 37%, 55-60: 32.5%, 60-65: 23.5%, 65-70: 16.5%, >70: 12.5%
  const tiers = [
    ['sg-cpf-employer-under-55-2025', 'sg-cpf-employee-under-55-2025', 0.37],
    ['sg-cpf-employer-55-60-2025',    'sg-cpf-employee-55-60-2025',    0.325],
    ['sg-cpf-employer-60-65-2025',    'sg-cpf-employee-60-65-2025',    0.235],
    ['sg-cpf-employer-65-70-2025',    'sg-cpf-employee-65-70-2025',    0.165],
    ['sg-cpf-employer-above-70',      'sg-cpf-employee-above-70',      0.125],
  ] as const;
  let lastCombined = Number.POSITIVE_INFINITY;
  for (const [erId, eeId, expected] of tiers) {
    const er = statutoryRates({ id: erId }).rates[0]!;
    const ee = statutoryRates({ id: eeId }).rates[0]!;
    const combined = Math.round((er.rate! + ee.rate!) * 1000) / 1000;
    assert.equal(combined, expected, `${erId}+${eeId} combined`);
    assert.ok(combined <= lastCombined, `CPF combined rate should not rise with age (${erId})`);
    lastCombined = combined;
  }
});

test('statutory_rates SG SDL is 0.25% on first $4,500, capped $11.25/employee', () => {
  const sdl = statutoryRates({ id: 'sg-sdl' }).rates[0]!;
  assert.equal(sdl.rate, 0.0025);
  assert.equal(sdl.wageCeiling, 4500);
  assert.equal(sdl.party, 'employer');
  assert.match(sdl.appliedTo, /11\.25/);
});

test('statutory_rates SG income tax entry documents annual IR8A (no PAYE withholding)', () => {
  const it = statutoryRates({ id: 'sg-income-tax-note' }).rates[0]!;
  assert.equal(it.rate, 0);
  assert.equal(it.party, 'n/a');
  assert.match(it.notes?.join(' ') ?? '', /IR8A|annual|withholding/i);
});

// ---------------------------------------------------------------------------
// New Zealand (Inland Revenue) — public-source-unreviewed headline rates
// ---------------------------------------------------------------------------

test('statutory_rates NZ PAYE has 5 bands 10.5/17.5/30/33/39 from 01-Apr-2025', () => {
  const paye = statutoryRates({ id: 'nz-paye-income-tax-2025' }).rates[0]!;
  assert.equal(paye.rateType, 'slab');
  assert.equal(paye.slabs?.length, 5);
  const rates = paye.slabs!.map((s) => s.rate);
  assert.deepEqual(rates, [0.105, 0.175, 0.30, 0.33, 0.39]);
  assert.equal(paye.slabs!.find((s) => s.upTo === 15600)!.rate, 0.105);
  assert.equal(paye.effectiveFrom, '2025-04-01');
});

test('statutory_rates NZ KiwiSaver minimum = 3% employee + 3% employer', () => {
  const ee = statutoryRates({ id: 'nz-kiwisaver-employee' }).rates[0]!;
  const er = statutoryRates({ id: 'nz-kiwisaver-employer' }).rates[0]!;
  assert.equal(ee.rate, 0.03);
  assert.equal(er.rate, 0.03);
  assert.equal(ee.currency, 'NZD');
});

test('statutory_rates NZ ACC earner levy is on employee + 5-band ESCT exists', () => {
  const acc = statutoryRates({ id: 'nz-acc-earners-levy-2025' }).rates[0]!;
  assert.equal(acc.party, 'employee');
  assert.ok(acc.rate! > 0 && acc.rate! < 0.05, 'ACC earner levy should be a small percentage');
  const esct = statutoryRates({ id: 'nz-esct-2025' }).rates[0]!;
  assert.equal(esct.rateType, 'slab');
  assert.equal(esct.slabs?.length, 5);
  // Top ESCT band hits 39% to align with top PAYE band
  assert.equal(esct.slabs!.find((s) => s.upTo === null)!.rate, 0.39);
});

// ---------------------------------------------------------------------------
// United Arab Emirates (MOHRE) — public-source-unreviewed
// ---------------------------------------------------------------------------

test('statutory_rates AE personal income tax is 0% with explanatory notes', () => {
  const it = statutoryRates({ id: 'ae-personal-income-tax' }).rates[0]!;
  assert.equal(it.rate, 0);
  assert.equal(it.category, 'income-tax');
  assert.equal(it.currency, 'AED');
  // Notes mention 9% Corporate Tax and 5% VAT explicitly as separate things
  const notes = it.notes?.join(' ') ?? '';
  assert.match(notes, /Corporate Tax|9%/);
  assert.match(notes, /VAT|5%/);
});

test('statutory_rates AE EOSG — 21 days first 5 yrs, 30 days year 6+, capped 2 yrs', () => {
  const first5 = statutoryRates({ id: 'ae-eosg-first-5-years' }).rates[0]!;
  const above5 = statutoryRates({ id: 'ae-eosg-years-above-5' }).rates[0]!;
  // 21/365 ≈ 0.0575; 30/365 ≈ 0.0822
  assert.equal(first5.rate, 0.0575);
  assert.equal(above5.rate, 0.0822);
  assert.equal(first5.category, 'end-of-service');
  assert.equal(above5.category, 'end-of-service');
  // Cap-of-2-years note must be present on one of the entries
  const allNotes = [first5.notes ?? [], above5.notes ?? []].flat().join(' ');
  assert.match(allNotes, /2 years|cap/i);
});

test('statutory_rates AE DEWS — 5.83% under 5 yrs / 8.33% above; DIFC-only marker', () => {
  const under = statutoryRates({ id: 'ae-dews-under-5-years' }).rates[0]!;
  const above = statutoryRates({ id: 'ae-dews-above-5-years' }).rates[0]!;
  assert.equal(under.rate, 0.0583);
  assert.equal(above.rate, 0.0833);
  assert.match(under.appliedTo, /DIFC/);
  assert.match(under.notes?.join(' ') ?? '', /DIFC/);
});

test('statutory_rates AE WPS is documented as a process, not a rate (0% + n/a)', () => {
  const wps = statutoryRates({ id: 'ae-wps-process-note' }).rates[0]!;
  assert.equal(wps.rate, 0);
  assert.equal(wps.party, 'n/a');
  assert.match(wps.notes?.join(' ') ?? '', /process|not a (percentage )?rate/i);
});

// ---------------------------------------------------------------------------
// Catalog-level invariants for the expanded footprint
// ---------------------------------------------------------------------------

test('statutory_rates new countries all ship verification=public-source-unreviewed', () => {
  for (const country of ['GB', 'CA', 'SG', 'NZ', 'AE'] as const) {
    const r = statutoryRates({ country });
    assert.ok(r.rates.length > 0, `expected rates for ${country}`);
    for (const x of r.rates) {
      assert.equal(x.verification, 'public-source-unreviewed', `${x.id} verification`);
    }
  }
});

test('statutory_rates covers all 8 marketed countries from countries.ts', () => {
  const r = statutoryRates({});
  const countries = new Set(r.rates.map((x) => x.country));
  for (const c of ['IN', 'AU', 'US', 'GB', 'CA', 'SG', 'NZ', 'AE']) {
    assert.ok(countries.has(c as never), `expected ${c} in catalog`);
  }
});

test('feature_search "CPP" routes to a CA pension statutory rate', () => {
  const r = featureSearch({ query: 'CPP' });
  const hit = r.results.find((h) => h.source === 'statutory-rate' && h.id.startsWith('ca-cpp'));
  assert.ok(hit, 'expected at least one CA CPP statutory-rate hit');
});

test('feature_search "KiwiSaver" routes to NZ KiwiSaver statutory rate', () => {
  const r = featureSearch({ query: 'KiwiSaver' });
  const hit = r.results.find((h) => h.source === 'statutory-rate' && h.id.startsWith('nz-kiwisaver'));
  assert.ok(hit, 'expected KiwiSaver statutory hit');
});

test('feature_search "Apprenticeship Levy" routes to GB apprenticeship-levy rate', () => {
  const r = featureSearch({ query: 'Apprenticeship Levy' });
  const hit = r.results.find((h) => h.source === 'statutory-rate' && h.id === 'gb-apprenticeship-levy');
  assert.ok(hit, 'expected GB Apprenticeship Levy hit');
});

test('feature_search "End of Service Gratuity" routes to AE EOSG entries', () => {
  const r = featureSearch({ query: 'End of Service Gratuity' });
  const hit = r.results.find((h) => h.source === 'statutory-rate' && h.id.startsWith('ae-eosg'));
  assert.ok(hit, 'expected AE EOSG hit');
});
