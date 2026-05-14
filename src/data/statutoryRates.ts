/**
 * Statutory payroll-rate catalog.
 *
 * The IN block is the source-of-truth, mirrored line-for-line from the
 * Hellotime-website PF/ESI calculator (PR #37, "fix(pf-esi-calc): verify
 * statutory rates against EPFO/ESIC/state PT sources"). Verified
 * 2026-05-13 against:
 *   - EPFO ContributionRate.pdf (PF / EPS / EDLI / PF admin since 01-06-2018)
 *   - esic.gov.in/contribution-rates (ESI w.e.f. 01-07-2019)
 *   - State PT notifications (Maharashtra, Karnataka, West Bengal, Tamil
 *     Nadu / GCC, Gujarat, Telangana, Andhra Pradesh)
 *
 * AU, US, GB, CA, SG, NZ and AE blocks are sourced from public government
 * pages but have NOT been through the same internal review pass as the IN
 * block — they ship with `verification: 'public-source-unreviewed'`. The
 * audit field is surfaced through the tool response so an AI agent (or its
 * operator) knows which rates are HelloTime-vouched vs. public-source
 * verbatim.
 *
 * Public-only data: no customer references, no internal hostnames, no auth.
 */

export type StatutoryCountry = 'IN' | 'AU' | 'US' | 'GB' | 'CA' | 'SG' | 'NZ' | 'AE';

export type StatutoryCategory =
  | 'social-security'
  | 'health-insurance'
  | 'income-tax'
  | 'professional-tax'
  | 'pension'
  | 'unemployment'
  | 'state-payroll-tax'
  | 'end-of-service';

export type RateType = 'percentage' | 'flat-monthly' | 'slab';

export interface RateSlab {
  /** Upper bound of this slab in the currency. `null` = no upper bound (highest slab). */
  upTo: number | null;
  /** Marginal rate for percentage-slabs (TDS, US federal income tax) — fraction (0.05 = 5%). */
  rate?: number;
  /** Flat per-period amount for flat-slabs (Indian PT). */
  amount?: number;
  /** State / authority quirk note (e.g. "Maharashtra Feb ₹300", "PwD ₹25,000 ceiling"). */
  note?: string;
}

export interface StatutoryRate {
  id: string;
  country: StatutoryCountry;
  /** Short scheme key (e.g. "EPF", "ESI", "PT", "TDS", "SuperGuarantee", "FICA-SS"). */
  scheme: string;
  /** Human-readable label suitable for a bot answer. */
  label: string;
  category: StatutoryCategory;
  /** Who pays — used by the bot to disambiguate "employee PF" vs "employer PF". */
  party: 'employee' | 'employer' | 'both' | 'n/a';
  rateType: RateType;
  /** Percentage rate as fraction (0.12 = 12%). Set for rateType=percentage. */
  rate?: number;
  /** Flat amount per period in the country's currency. Set for rateType=flat-monthly. */
  flatAmount?: number;
  /** Slab table. Set for rateType=slab. */
  slabs?: RateSlab[];
  /** What the rate applies to (e.g. "PF wages (Basic + DA)", "Gross monthly wages"). */
  appliedTo: string;
  /** Wage ceiling for contribution computation (PF: ₹15,000; FICA-SS: $176,100 in 2025). */
  wageCeiling?: number;
  /** Scheme only applies if gross wage ≤ this amount (ESI: ₹21,000). */
  applicableIfGrossLte?: number;
  /** Indian state, for state-scoped schemes (PT). */
  state?: string;
  /** ISO 4217 currency for any monetary amounts in this entry. */
  currency: string;
  /** Effective-from in YYYY-MM-DD or fiscal-year shorthand. */
  effectiveFrom: string;
  /** Issuing authority (EPFO, ESIC, CBDT, ATO, IRS, state govt, etc.). */
  authority: string;
  /** Authority's public reference URL or document name. */
  source: string;
  /** verified = reviewed against authoritative source per the verification block in this file's header. public-source-unreviewed = pulled from public-domain source but not yet internally reviewed. */
  verification: 'verified' | 'public-source-unreviewed';
  /** YYYY-MM-DD when the rate was last reviewed. */
  lastReviewed: string;
  notes?: string[];
}

// ---------------------------------------------------------------------------
// India — verified 2026-05-13 against the PF/ESI calculator data (PR #37).
// ---------------------------------------------------------------------------

const IN_VERIFIED = {
  verification: 'verified' as const,
  lastReviewed: '2026-05-13',
  currency: 'INR',
};

const IN_PF_ESI: StatutoryRate[] = [
  {
    id: 'in-pf-employee',
    country: 'IN',
    scheme: 'EPF',
    label: 'Provident Fund — employee share (A/c 1)',
    category: 'social-security',
    party: 'employee',
    rateType: 'percentage',
    rate: 0.12,
    appliedTo: 'PF wages (Basic + Dearness Allowance)',
    wageCeiling: 15000,
    authority: 'EPFO',
    source: 'EPFO ContributionRate.pdf',
    effectiveFrom: '2014-09-01',
    ...IN_VERIFIED,
    notes: [
      'Employer may voluntarily contribute on actual wages above the ₹15,000 ceiling.',
      'For establishments with <20 employees and women employees in their first 3 years, the employee rate may be 10% under specific notifications — confirm against EPFO eligibility.',
    ],
  },
  {
    id: 'in-pf-employer-total',
    country: 'IN',
    scheme: 'EPF',
    label: 'Provident Fund — employer total contribution',
    category: 'social-security',
    party: 'employer',
    rateType: 'percentage',
    rate: 0.12,
    appliedTo: 'PF wages (Basic + Dearness Allowance)',
    wageCeiling: 15000,
    authority: 'EPFO',
    source: 'EPFO ContributionRate.pdf',
    effectiveFrom: '2014-09-01',
    ...IN_VERIFIED,
    notes: [
      'Splits into 8.33% EPS (A/c 10, ceiling-capped) and the residual to EPF (A/c 1, employer share).',
      'ECR practice rounds EPS to whole rupees and derives EPF as (total employer PF − rounded EPS) so monthly figures reconcile.',
    ],
  },
  {
    id: 'in-eps',
    country: 'IN',
    scheme: 'EPS',
    label: 'Employees Pension Scheme (A/c 10)',
    category: 'pension',
    party: 'employer',
    rateType: 'percentage',
    rate: 0.0833,
    appliedTo: 'PF wages, capped at ₹15,000',
    wageCeiling: 15000,
    authority: 'EPFO',
    source: 'EPFO ContributionRate.pdf',
    effectiveFrom: '2014-09-01',
    ...IN_VERIFIED,
    notes: ['Carved out of the 12% employer PF share; always ceiling-capped.'],
  },
  {
    id: 'in-edli',
    country: 'IN',
    scheme: 'EDLI',
    label: 'Employees Deposit Linked Insurance (A/c 21)',
    category: 'social-security',
    party: 'employer',
    rateType: 'percentage',
    rate: 0.005,
    appliedTo: 'PF wages, capped at ₹15,000',
    wageCeiling: 15000,
    authority: 'EPFO',
    source: 'EPFO ContributionRate.pdf',
    effectiveFrom: '2018-04-15',
    ...IN_VERIFIED,
    notes: ['EDLI admin (A/c 22) is 0% since 01-04-2017.'],
  },
  {
    id: 'in-pf-admin',
    country: 'IN',
    scheme: 'PFAdmin',
    label: 'PF administrative charges (A/c 2)',
    category: 'social-security',
    party: 'employer',
    rateType: 'percentage',
    rate: 0.005,
    appliedTo: 'PF wages',
    authority: 'EPFO',
    source: 'EPFO ContributionRate.pdf',
    effectiveFrom: '2018-06-01',
    ...IN_VERIFIED,
    notes: [
      'Establishment-level minimum ₹500/month (₹75/month if no contributory member in that month).',
      'These minimums apply at the establishment level, not per employee.',
    ],
  },
  {
    id: 'in-esi-employee',
    country: 'IN',
    scheme: 'ESI',
    label: 'Employees State Insurance — employee share',
    category: 'health-insurance',
    party: 'employee',
    rateType: 'percentage',
    rate: 0.0075,
    appliedTo: 'Gross monthly wages',
    applicableIfGrossLte: 21000,
    authority: 'ESIC',
    source: 'https://www.esic.gov.in/contribution-rates',
    effectiveFrom: '2019-07-01',
    ...IN_VERIFIED,
    notes: ['Wage ceiling is ₹25,000/month for persons with disability.'],
  },
  {
    id: 'in-esi-employer',
    country: 'IN',
    scheme: 'ESI',
    label: 'Employees State Insurance — employer share',
    category: 'health-insurance',
    party: 'employer',
    rateType: 'percentage',
    rate: 0.0325,
    appliedTo: 'Gross monthly wages',
    applicableIfGrossLte: 21000,
    authority: 'ESIC',
    source: 'https://www.esic.gov.in/contribution-rates',
    effectiveFrom: '2019-07-01',
    ...IN_VERIFIED,
    notes: ['Wage ceiling is ₹25,000/month for persons with disability.'],
  },
];

// ---------------------------------------------------------------------------
// India — Professional Tax by state, verified 2026-05-13 against current
// state Finance Acts and notifications.
// ---------------------------------------------------------------------------

const IN_PT_BASE = {
  country: 'IN' as const,
  scheme: 'PT',
  category: 'professional-tax' as const,
  party: 'employee' as const,
  rateType: 'slab' as const,
  appliedTo: 'Gross monthly wages',
  authority: 'State government',
  ...IN_VERIFIED,
};

const IN_PT: StatutoryRate[] = [
  {
    ...IN_PT_BASE,
    id: 'in-pt-maharashtra',
    label: 'Professional Tax — Maharashtra',
    state: 'Maharashtra',
    slabs: [
      { upTo: 7500, amount: 0 },
      { upTo: 10000, amount: 175 },
      { upTo: null, amount: 200, note: 'In February the deduction is ₹300 instead of ₹200 (annual cap ₹2,500).' },
    ],
    source: 'Maharashtra State Tax on Professions, Trades, Callings and Employments Act',
    effectiveFrom: '2023-04-01',
    notes: ['Per the 01-04-2023 amendment, women earning up to ₹25,000/month are fully exempt — slabs shown reflect the men\'s rate.'],
  },
  {
    ...IN_PT_BASE,
    id: 'in-pt-karnataka',
    label: 'Professional Tax — Karnataka',
    state: 'Karnataka',
    slabs: [
      { upTo: 25000, amount: 0, note: '₹25,000 exemption threshold w.e.f. 01-04-2025.' },
      { upTo: null, amount: 200, note: 'In February the deduction is ₹300 instead of ₹200 (annual cap ₹2,500).' },
    ],
    source: 'Karnataka Tax on Professions, Trades, Callings and Employments Act',
    effectiveFrom: '2025-04-01',
  },
  {
    ...IN_PT_BASE,
    id: 'in-pt-west-bengal',
    label: 'Professional Tax — West Bengal',
    state: 'West Bengal',
    slabs: [
      { upTo: 10000, amount: 0 },
      { upTo: 15000, amount: 110 },
      { upTo: 25000, amount: 130 },
      { upTo: 40000, amount: 150 },
      { upTo: null, amount: 200 },
    ],
    source: 'West Bengal State Tax on Professions, Trades, Callings and Employments Act',
    effectiveFrom: '2014-04-01',
  },
  {
    ...IN_PT_BASE,
    id: 'in-pt-tamil-nadu',
    label: 'Professional Tax — Tamil Nadu (Greater Chennai Corporation)',
    state: 'Tamil Nadu',
    slabs: [
      { upTo: 3500, amount: 0, note: 'HY ≤ ₹21,000' },
      { upTo: 5000, amount: 30, note: 'HY ₹21,001–30,000 → ₹180 HY' },
      { upTo: 7500, amount: 71, note: 'HY ₹30,001–45,000 → ₹425 HY' },
      { upTo: 10000, amount: 155, note: 'HY ₹45,001–60,000 → ₹930 HY' },
      { upTo: 12500, amount: 171, note: 'HY ₹60,001–75,000 → ₹1,025 HY' },
      { upTo: null, amount: 208, note: 'HY > ₹75,000 → ₹1,250 HY' },
    ],
    source: 'Greater Chennai Corporation council resolution dated 30-Dec-2024',
    effectiveFrom: '2024-10-01',
    notes: [
      'GCC half-yearly slabs (effective H2 FY 2024-25). Figures shown are monthly equivalents; actual collection is twice a year.',
      'Other TN municipalities and corporations may notify different slabs.',
    ],
  },
  {
    ...IN_PT_BASE,
    id: 'in-pt-gujarat',
    label: 'Professional Tax — Gujarat',
    state: 'Gujarat',
    slabs: [
      { upTo: 12000, amount: 0 },
      { upTo: null, amount: 200 },
    ],
    source: 'Gujarat State Tax on Professions, Trades, Callings and Employments Act',
    effectiveFrom: '2022-04-01',
  },
  {
    ...IN_PT_BASE,
    id: 'in-pt-telangana',
    label: 'Professional Tax — Telangana',
    state: 'Telangana',
    slabs: [
      { upTo: 15000, amount: 0 },
      { upTo: 20000, amount: 150 },
      { upTo: null, amount: 200 },
    ],
    source: 'Telangana Tax on Professions, Trades, Callings and Employments Act',
    effectiveFrom: '2013-06-01',
  },
  {
    ...IN_PT_BASE,
    id: 'in-pt-andhra-pradesh',
    label: 'Professional Tax — Andhra Pradesh',
    state: 'Andhra Pradesh',
    slabs: [
      { upTo: 15000, amount: 0 },
      { upTo: 20000, amount: 150 },
      { upTo: null, amount: 200, note: 'In March the deduction is ₹300 instead of ₹200 (annual cap ₹2,500).' },
    ],
    source: 'Andhra Pradesh Tax on Professions, Trades, Callings and Employments Act',
    effectiveFrom: '2013-06-01',
  },
];

// ---------------------------------------------------------------------------
// India — TDS on salary (Section 192) slabs. The new regime is the default
// from FY 2023-24 onwards (Finance Act 2023). FY 2024-25 slabs apply for
// salary credited 01-Apr-2024 onwards. Health & Education Cess 4% on tax,
// surcharge applies above ₹50 lakh.
//
// Marked public-source-unreviewed because TDS slabs rotate annually with
// the Finance Act and have not been through the internal review pass that
// produced the PF/ESI calculator.
// ---------------------------------------------------------------------------

const IN_INCOME_TAX: StatutoryRate[] = [
  {
    id: 'in-tds-new-regime-fy2425',
    country: 'IN',
    scheme: 'TDS',
    label: 'TDS on salary — new regime (Section 115BAC) FY 2024-25',
    category: 'income-tax',
    party: 'employee',
    rateType: 'slab',
    slabs: [
      { upTo: 300000, rate: 0 },
      { upTo: 700000, rate: 0.05 },
      { upTo: 1000000, rate: 0.10 },
      { upTo: 1200000, rate: 0.15 },
      { upTo: 1500000, rate: 0.20 },
      { upTo: null, rate: 0.30 },
    ],
    appliedTo: 'Annual taxable salary income, default regime',
    currency: 'INR',
    authority: 'CBDT',
    source: 'Finance Act 2024 (Section 115BAC of Income-Tax Act, 1961)',
    effectiveFrom: '2024-04-01',
    verification: 'public-source-unreviewed',
    lastReviewed: '2026-05-14',
    notes: [
      'Standard deduction ₹75,000 available under new regime (FY 2024-25 onwards).',
      'Section 87A rebate makes net tax zero on income up to ₹7,00,000 (effective ₹7,75,000 with standard deduction).',
      'Add Health & Education Cess @ 4% on tax. Surcharge applies above ₹50 lakh.',
    ],
  },
  {
    id: 'in-tds-old-regime-fy2425',
    country: 'IN',
    scheme: 'TDS',
    label: 'TDS on salary — old regime FY 2024-25 (individuals < 60)',
    category: 'income-tax',
    party: 'employee',
    rateType: 'slab',
    slabs: [
      { upTo: 250000, rate: 0 },
      { upTo: 500000, rate: 0.05 },
      { upTo: 1000000, rate: 0.20 },
      { upTo: null, rate: 0.30 },
    ],
    appliedTo: 'Annual taxable salary income, opt-in old regime',
    currency: 'INR',
    authority: 'CBDT',
    source: 'Income-Tax Act, 1961',
    effectiveFrom: '2017-04-01',
    verification: 'public-source-unreviewed',
    lastReviewed: '2026-05-14',
    notes: [
      'Employee must opt in to the old regime via Form 10-IEA each year.',
      'Separate slabs apply for senior citizens (60–80) and super-senior citizens (80+).',
      'Standard deduction ₹50,000 plus eligible 80C/80D/HRA deductions.',
      'Add Health & Education Cess @ 4% on tax. Surcharge applies above ₹50 lakh.',
    ],
  },
];

// ---------------------------------------------------------------------------
// Australia — public-source-unreviewed. Headline rates from ATO; the surface
// here is intentionally minimal until an internal review pass.
// ---------------------------------------------------------------------------

const AU_UNREVIEWED = {
  verification: 'public-source-unreviewed' as const,
  lastReviewed: '2026-05-14',
  currency: 'AUD',
};

const AU_RATES: StatutoryRate[] = [
  {
    id: 'au-super-guarantee-fy2526',
    country: 'AU',
    scheme: 'SuperGuarantee',
    label: 'Superannuation Guarantee — FY 2025-26',
    category: 'pension',
    party: 'employer',
    rateType: 'percentage',
    rate: 0.12,
    appliedTo: 'Ordinary time earnings (OTE)',
    authority: 'ATO',
    source: 'https://www.ato.gov.au/rates/key-superannuation-rates-and-thresholds/',
    effectiveFrom: '2025-07-01',
    ...AU_UNREVIEWED,
    notes: [
      'Stepped up from 11.5% in FY 2024-25 per the legislated schedule (Super Guarantee (Administration) Act 1992 amendments).',
      'Maximum Super Contribution Base is set quarterly — confirm against the ATO key rates page.',
    ],
  },
  {
    id: 'au-super-guarantee-fy2425',
    country: 'AU',
    scheme: 'SuperGuarantee',
    label: 'Superannuation Guarantee — FY 2024-25',
    category: 'pension',
    party: 'employer',
    rateType: 'percentage',
    rate: 0.115,
    appliedTo: 'Ordinary time earnings (OTE)',
    authority: 'ATO',
    source: 'https://www.ato.gov.au/rates/key-superannuation-rates-and-thresholds/',
    effectiveFrom: '2024-07-01',
    ...AU_UNREVIEWED,
    notes: ['Maximum Super Contribution Base FY 2024-25 is $65,070 per quarter.'],
  },
  {
    id: 'au-medicare-levy',
    country: 'AU',
    scheme: 'MedicareLevy',
    label: 'Medicare Levy',
    category: 'health-insurance',
    party: 'employee',
    rateType: 'percentage',
    rate: 0.02,
    appliedTo: 'Taxable income above the low-income threshold',
    authority: 'ATO',
    source: 'https://www.ato.gov.au/individuals-and-families/medicare-and-private-health-insurance/medicare-levy',
    effectiveFrom: '2014-07-01',
    ...AU_UNREVIEWED,
    notes: [
      'Low-income reduction thresholds change each Federal Budget — confirm against the ATO page for the relevant year.',
      'Medicare Levy Surcharge (1–1.5%) applies separately for higher-income earners without private hospital cover.',
    ],
  },
];

// ---------------------------------------------------------------------------
// United States — public-source-unreviewed. Headline federal rates for 2025
// from IRS / SSA / DOL.
// ---------------------------------------------------------------------------

const US_UNREVIEWED = {
  verification: 'public-source-unreviewed' as const,
  lastReviewed: '2026-05-14',
  currency: 'USD',
};

const US_RATES: StatutoryRate[] = [
  {
    id: 'us-fica-social-security-employee-2025',
    country: 'US',
    scheme: 'FICA-SS',
    label: 'FICA Social Security — employee (2025)',
    category: 'social-security',
    party: 'employee',
    rateType: 'percentage',
    rate: 0.062,
    appliedTo: 'Wages up to the Social Security wage base',
    wageCeiling: 176100,
    authority: 'SSA / IRS',
    source: 'https://www.ssa.gov/oact/cola/cbb.html',
    effectiveFrom: '2025-01-01',
    ...US_UNREVIEWED,
    notes: ['Social Security wage base is adjusted annually for inflation by SSA.'],
  },
  {
    id: 'us-fica-social-security-employer-2025',
    country: 'US',
    scheme: 'FICA-SS',
    label: 'FICA Social Security — employer (2025)',
    category: 'social-security',
    party: 'employer',
    rateType: 'percentage',
    rate: 0.062,
    appliedTo: 'Wages up to the Social Security wage base',
    wageCeiling: 176100,
    authority: 'SSA / IRS',
    source: 'https://www.ssa.gov/oact/cola/cbb.html',
    effectiveFrom: '2025-01-01',
    ...US_UNREVIEWED,
  },
  {
    id: 'us-fica-medicare-employee',
    country: 'US',
    scheme: 'FICA-Medicare',
    label: 'FICA Medicare — employee',
    category: 'health-insurance',
    party: 'employee',
    rateType: 'percentage',
    rate: 0.0145,
    appliedTo: 'All wages (no wage base cap)',
    authority: 'IRS',
    source: 'https://www.irs.gov/taxtopics/tc751',
    effectiveFrom: '1986-01-01',
    ...US_UNREVIEWED,
    notes: ['Additional Medicare tax of 0.9% applies on employee wages over $200,000 in a calendar year (single filer threshold).'],
  },
  {
    id: 'us-fica-medicare-employer',
    country: 'US',
    scheme: 'FICA-Medicare',
    label: 'FICA Medicare — employer',
    category: 'health-insurance',
    party: 'employer',
    rateType: 'percentage',
    rate: 0.0145,
    appliedTo: 'All wages (no wage base cap)',
    authority: 'IRS',
    source: 'https://www.irs.gov/taxtopics/tc751',
    effectiveFrom: '1986-01-01',
    ...US_UNREVIEWED,
  },
  {
    id: 'us-futa-2025',
    country: 'US',
    scheme: 'FUTA',
    label: 'FUTA — federal unemployment tax (2025)',
    category: 'unemployment',
    party: 'employer',
    rateType: 'percentage',
    rate: 0.06,
    appliedTo: 'First $7,000 of each employee\'s annual wages',
    wageCeiling: 7000,
    authority: 'IRS',
    source: 'https://www.irs.gov/businesses/small-businesses-self-employed/federal-unemployment-tax',
    effectiveFrom: '2011-01-01',
    ...US_UNREVIEWED,
    notes: [
      'Most employers get a 5.4% state-unemployment-credit, reducing the effective FUTA rate to 0.6% on the first $7,000.',
      'Credit reduction states (where the state borrowed from the federal trust) face a higher effective rate — confirm the current credit-reduction list each January.',
    ],
  },
  {
    id: 'us-401k-elective-deferral-2025',
    country: 'US',
    scheme: '401k',
    label: '401(k) elective deferral limit (2025)',
    category: 'pension',
    party: 'employee',
    rateType: 'flat-monthly',
    flatAmount: 23500,
    appliedTo: 'Annual employee elective deferral cap (not per period)',
    authority: 'IRS',
    source: 'https://www.irs.gov/retirement-plans/plan-participant-employee/retirement-topics-401k-and-profit-sharing-plan-contribution-limits',
    effectiveFrom: '2025-01-01',
    ...US_UNREVIEWED,
    notes: [
      'Note: flatAmount is the ANNUAL cap, not a per-pay-period deduction.',
      'Catch-up contribution +$7,500 for age 50+; SECURE 2.0 special catch-up +$11,250 for ages 60–63 in 2025.',
    ],
  },
];

// ---------------------------------------------------------------------------
// United Kingdom — public-source-unreviewed. Tax year 2025-26 (06-Apr-2025 to
// 05-Apr-2026). Headline rates from HMRC; thresholds frozen at FY 2024-25
// levels per the Autumn Statement 2022 freeze, extended through 2027-28.
// England, Wales and Northern Ireland income-tax bands; Scotland operates a
// separate 6-band Scottish income tax via SRIT.
// ---------------------------------------------------------------------------

const GB_UNREVIEWED = {
  verification: 'public-source-unreviewed' as const,
  lastReviewed: '2026-05-14',
  currency: 'GBP',
};

const GB_RATES: StatutoryRate[] = [
  {
    id: 'gb-ni-class1-employee-2025',
    country: 'GB',
    scheme: 'NI-Class1',
    label: 'National Insurance — Class 1 primary (employee) 2025-26',
    category: 'social-security',
    party: 'employee',
    rateType: 'slab',
    slabs: [
      { upTo: 12570, rate: 0, note: 'Below Primary Threshold (£12,570/yr — £242/wk) — no NI.' },
      { upTo: 50270, rate: 0.08, note: 'Main rate band — Primary Threshold to Upper Earnings Limit.' },
      { upTo: null, rate: 0.02, note: 'Additional rate band — above Upper Earnings Limit (£50,270/yr).' },
    ],
    appliedTo: 'Annual earnings — Primary Threshold £12,570 and Upper Earnings Limit £50,270',
    authority: 'HMRC',
    source: 'https://www.gov.uk/national-insurance-rates-letters',
    effectiveFrom: '2025-04-06',
    ...GB_UNREVIEWED,
    notes: [
      'Main rate stepped down from 10% to 8% on 06-Apr-2024 (Spring Budget 2024); held at 8% for 2025-26.',
      'Weekly thresholds: Primary Threshold £242/wk, Upper Earnings Limit £967/wk.',
      'Letters C, S, X and W give reduced or zero rates — confirm employee NI category against HMRC NI tables.',
    ],
  },
  {
    id: 'gb-ni-class1-employer-2025',
    country: 'GB',
    scheme: 'NI-Class1',
    label: 'National Insurance — Class 1 secondary (employer) 2025-26',
    category: 'social-security',
    party: 'employer',
    rateType: 'percentage',
    rate: 0.15,
    appliedTo: 'Earnings above the Secondary Threshold (£5,000/yr from 06-Apr-2025)',
    authority: 'HMRC',
    source: 'https://www.gov.uk/national-insurance-rates-letters',
    effectiveFrom: '2025-04-06',
    ...GB_UNREVIEWED,
    notes: [
      'Autumn Budget 2024: employer NI rose from 13.8% to 15% w.e.f. 06-Apr-2025.',
      'Secondary Threshold cut from £9,100/yr (2024-25) to £5,000/yr (2025-26) — same Autumn Budget 2024 change.',
      'Employment Allowance increased to £10,500/yr for eligible employers and £100k cap removed (2025-26).',
      'Reduced 0% / Veterans / Freeport / Investment Zone employer rates apply up to specific upper bands — confirm against HMRC.',
    ],
  },
  {
    id: 'gb-paye-income-tax-2025',
    country: 'GB',
    scheme: 'PAYE',
    label: 'PAYE income tax bands — England/Wales/NI 2025-26',
    category: 'income-tax',
    party: 'employee',
    rateType: 'slab',
    slabs: [
      { upTo: 12570, rate: 0, note: 'Personal allowance — £12,570 (frozen through 2027-28).' },
      { upTo: 50270, rate: 0.20, note: 'Basic rate — taxable income £0 to £37,700 above personal allowance.' },
      { upTo: 125140, rate: 0.40, note: 'Higher rate — up to £125,140; personal allowance tapers £1 per £2 of income above £100,000.' },
      { upTo: null, rate: 0.45, note: 'Additional rate — above £125,140.' },
    ],
    appliedTo: 'Annual taxable income (England, Wales and Northern Ireland)',
    authority: 'HMRC',
    source: 'https://www.gov.uk/income-tax-rates',
    effectiveFrom: '2025-04-06',
    ...GB_UNREVIEWED,
    notes: [
      'Scotland has separate Scottish Income Tax rates (6 bands) operated via SRIT — not modelled here.',
      'Personal allowance £12,570 frozen at this level through tax year 2027-28 per the Autumn Statement 2022.',
      'Personal allowance reduces by £1 for every £2 earned above £100,000; fully withdrawn at £125,140.',
    ],
  },
  {
    id: 'gb-pension-auto-enrol-total',
    country: 'GB',
    scheme: 'AutoEnrol',
    label: 'Workplace pension auto-enrolment — total minimum contribution',
    category: 'pension',
    party: 'both',
    rateType: 'percentage',
    rate: 0.08,
    appliedTo: 'Qualifying earnings band (£6,240–£50,270/yr for 2025-26)',
    authority: 'The Pensions Regulator (TPR)',
    source: 'https://www.thepensionsregulator.gov.uk/en/employers/managing-a-scheme/contributions-and-funding',
    effectiveFrom: '2019-04-06',
    ...GB_UNREVIEWED,
    notes: [
      'Minimum split: employer 3% + employee 5% = 8% total on qualifying earnings.',
      'Qualifying earnings band for 2025-26: lower limit £6,240/yr, upper limit £50,270/yr.',
      'Auto-enrolment trigger earnings £10,000/yr — workers below this can opt in.',
      'Many employers contribute more than the 3% minimum; salary-sacrifice arrangements common.',
    ],
  },
  {
    id: 'gb-pension-auto-enrol-employer',
    country: 'GB',
    scheme: 'AutoEnrol',
    label: 'Workplace pension auto-enrolment — employer minimum',
    category: 'pension',
    party: 'employer',
    rateType: 'percentage',
    rate: 0.03,
    appliedTo: 'Qualifying earnings band (£6,240–£50,270/yr for 2025-26)',
    authority: 'The Pensions Regulator (TPR)',
    source: 'https://www.thepensionsregulator.gov.uk/en/employers/managing-a-scheme/contributions-and-funding',
    effectiveFrom: '2019-04-06',
    ...GB_UNREVIEWED,
  },
  {
    id: 'gb-pension-auto-enrol-employee',
    country: 'GB',
    scheme: 'AutoEnrol',
    label: 'Workplace pension auto-enrolment — employee minimum',
    category: 'pension',
    party: 'employee',
    rateType: 'percentage',
    rate: 0.05,
    appliedTo: 'Qualifying earnings band (£6,240–£50,270/yr for 2025-26)',
    authority: 'The Pensions Regulator (TPR)',
    source: 'https://www.thepensionsregulator.gov.uk/en/employers/managing-a-scheme/contributions-and-funding',
    effectiveFrom: '2019-04-06',
    ...GB_UNREVIEWED,
    notes: ['Includes basic-rate tax relief if scheme operates relief-at-source (net-pay schemes deduct gross).'],
  },
  {
    id: 'gb-apprenticeship-levy',
    country: 'GB',
    scheme: 'ApprenticeshipLevy',
    label: 'Apprenticeship Levy',
    category: 'state-payroll-tax',
    party: 'employer',
    rateType: 'percentage',
    rate: 0.005,
    appliedTo: 'Annual paybill above £3,000,000 (after £15,000 annual allowance)',
    authority: 'HMRC',
    source: 'https://www.gov.uk/guidance/pay-apprenticeship-levy',
    effectiveFrom: '2017-04-06',
    ...GB_UNREVIEWED,
    notes: [
      'Each employer gets a £15,000 annual allowance — effectively levy only bites once annual paybill exceeds £3,000,000.',
      'Connected employers (group / franchise) must share the single £15,000 allowance.',
      'Paid via PAYE alongside Class 1 NI; ring-fenced to fund apprenticeship training.',
    ],
  },
];

// ---------------------------------------------------------------------------
// Canada — public-source-unreviewed. 2025 federal figures from CRA and
// Employment and Social Development Canada. Provincial/territorial income tax
// and provincial workplace insurance (WSIB, WCB, CNESST) vary by province
// and are NOT modelled here — this block is the federal stub.
// ---------------------------------------------------------------------------

const CA_UNREVIEWED = {
  verification: 'public-source-unreviewed' as const,
  lastReviewed: '2026-05-14',
  currency: 'CAD',
};

const CA_RATES: StatutoryRate[] = [
  {
    id: 'ca-cpp-employee-2025',
    country: 'CA',
    scheme: 'CPP',
    label: 'Canada Pension Plan — employee (2025)',
    category: 'pension',
    party: 'employee',
    rateType: 'percentage',
    rate: 0.0595,
    appliedTo: 'Pensionable earnings above $3,500 basic exemption, up to YMPE $71,300',
    wageCeiling: 71300,
    authority: 'Canada Revenue Agency (CRA)',
    source: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/payroll-deductions-contributions/canada-pension-plan-cpp/cpp-contribution-rates-maximums-exemptions.html',
    effectiveFrom: '2025-01-01',
    ...CA_UNREVIEWED,
    notes: [
      'Year\'s Maximum Pensionable Earnings (YMPE) for 2025 = $71,300; Year\'s Basic Exemption (YBE) = $3,500.',
      'Quebec residents instead contribute to QPP at 6.40% (employee) — different scheme not modelled here.',
      'Maximum employee CPP1 contribution 2025 ≈ $4,034.10.',
    ],
  },
  {
    id: 'ca-cpp-employer-2025',
    country: 'CA',
    scheme: 'CPP',
    label: 'Canada Pension Plan — employer (2025)',
    category: 'pension',
    party: 'employer',
    rateType: 'percentage',
    rate: 0.0595,
    appliedTo: 'Pensionable earnings above $3,500 basic exemption, up to YMPE $71,300',
    wageCeiling: 71300,
    authority: 'Canada Revenue Agency (CRA)',
    source: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/payroll-deductions-contributions/canada-pension-plan-cpp/cpp-contribution-rates-maximums-exemptions.html',
    effectiveFrom: '2025-01-01',
    ...CA_UNREVIEWED,
    notes: ['Employer matches employee CPP1 contribution dollar-for-dollar.'],
  },
  {
    id: 'ca-cpp2-employee-2025',
    country: 'CA',
    scheme: 'CPP2',
    label: 'Canada Pension Plan — CPP2 enhanced employee (2025)',
    category: 'pension',
    party: 'employee',
    rateType: 'percentage',
    rate: 0.04,
    appliedTo: 'Pensionable earnings between YMPE $71,300 and YAMPE $81,200',
    wageCeiling: 81200,
    authority: 'Canada Revenue Agency (CRA)',
    source: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/payroll-deductions-contributions/canada-pension-plan-cpp/cpp-contribution-rates-maximums-exemptions.html',
    effectiveFrom: '2024-01-01',
    ...CA_UNREVIEWED,
    notes: [
      'CPP2 introduced 01-Jan-2024 as the second earnings ceiling under CPP enhancement.',
      'Year\'s Additional Maximum Pensionable Earnings (YAMPE) for 2025 = $81,200.',
      'Maximum employee CPP2 contribution 2025 ≈ $396.00.',
    ],
  },
  {
    id: 'ca-cpp2-employer-2025',
    country: 'CA',
    scheme: 'CPP2',
    label: 'Canada Pension Plan — CPP2 enhanced employer (2025)',
    category: 'pension',
    party: 'employer',
    rateType: 'percentage',
    rate: 0.04,
    appliedTo: 'Pensionable earnings between YMPE $71,300 and YAMPE $81,200',
    wageCeiling: 81200,
    authority: 'Canada Revenue Agency (CRA)',
    source: 'https://www.canada.ca/en/revenue-agency/services/tax/businesses/topics/payroll/payroll-deductions-contributions/canada-pension-plan-cpp/cpp-contribution-rates-maximums-exemptions.html',
    effectiveFrom: '2024-01-01',
    ...CA_UNREVIEWED,
  },
  {
    id: 'ca-ei-employee-2025',
    country: 'CA',
    scheme: 'EI',
    label: 'Employment Insurance — employee (2025)',
    category: 'unemployment',
    party: 'employee',
    rateType: 'percentage',
    rate: 0.0164,
    appliedTo: 'Insurable earnings up to Maximum Insurable Earnings (MIE) $65,700',
    wageCeiling: 65700,
    authority: 'Employment and Social Development Canada (ESDC) / CRA',
    source: 'https://www.canada.ca/en/employment-social-development/programs/ei/ei-list/reports/premium/rates2025.html',
    effectiveFrom: '2025-01-01',
    ...CA_UNREVIEWED,
    notes: [
      'Quebec residents pay reduced EI premium 1.31% (Quebec runs its own QPIP for parental benefits).',
      'Maximum employee EI premium 2025 (non-QC) ≈ $1,077.48; Quebec ≈ $860.67.',
    ],
  },
  {
    id: 'ca-ei-employer-2025',
    country: 'CA',
    scheme: 'EI',
    label: 'Employment Insurance — employer (2025)',
    category: 'unemployment',
    party: 'employer',
    rateType: 'percentage',
    rate: 0.02296,
    appliedTo: 'Insurable earnings up to MIE $65,700; rate = 1.4× employee premium',
    wageCeiling: 65700,
    authority: 'Employment and Social Development Canada (ESDC) / CRA',
    source: 'https://www.canada.ca/en/employment-social-development/programs/ei/ei-list/reports/premium/rates2025.html',
    effectiveFrom: '2025-01-01',
    ...CA_UNREVIEWED,
    notes: [
      'Statutory multiplier: employer EI premium = 1.4 × employee rate (1.64% × 1.4 = 2.296%).',
      'Reduced multiplier available under approved short-term-disability EI Premium Reduction Program.',
    ],
  },
  {
    id: 'ca-federal-income-tax-2025',
    country: 'CA',
    scheme: 'FederalIncomeTax',
    label: 'Federal income tax brackets — 2025',
    category: 'income-tax',
    party: 'employee',
    rateType: 'slab',
    slabs: [
      { upTo: 57375, rate: 0.15, note: 'First $57,375 of taxable income.' },
      { upTo: 114750, rate: 0.205, note: '$57,375.01 to $114,750.' },
      { upTo: 177882, rate: 0.26, note: '$114,750.01 to $177,882.' },
      { upTo: 253414, rate: 0.29, note: '$177,882.01 to $253,414.' },
      { upTo: null, rate: 0.33, note: 'Above $253,414.' },
    ],
    appliedTo: 'Annual federal taxable income',
    authority: 'Canada Revenue Agency (CRA)',
    source: 'https://www.canada.ca/en/revenue-agency/services/tax/individuals/frequently-asked-questions-individuals/canadian-income-tax-rates-individuals-current-previous-years.html',
    effectiveFrom: '2025-01-01',
    ...CA_UNREVIEWED,
    notes: [
      'Basic Personal Amount (BPA) for 2025 = $16,129 maximum; tapers above net income $177,882 to $14,538 floor for highest earners.',
      'STUB: Provincial / territorial income tax stacks on top of federal — varies by province (ranges roughly 4–25.75% across brackets). Full provincial coverage is out of scope for this initial block.',
      'Quebec administers its own provincial income tax directly (not via CRA) — separate filing path.',
    ],
  },
];

// ---------------------------------------------------------------------------
// Singapore — public-source-unreviewed. CPF Board age-graded contribution
// rates effective 01-Jan-2025; SDL is collected by CPF Board on behalf of
// SSG; IRAS handles annual IR8A but does NOT run monthly PAYE withholding,
// so no income-tax-at-source entry.
// ---------------------------------------------------------------------------

const SG_UNREVIEWED = {
  verification: 'public-source-unreviewed' as const,
  lastReviewed: '2026-05-14',
  currency: 'SGD',
};

const SG_RATES: StatutoryRate[] = [
  {
    id: 'sg-cpf-employer-under-55-2025',
    country: 'SG',
    scheme: 'CPF',
    label: 'CPF — employer share, age ≤ 55 (2025)',
    category: 'social-security',
    party: 'employer',
    rateType: 'percentage',
    rate: 0.17,
    appliedTo: 'Ordinary Wages up to OW ceiling SGD 7,400/month (2025)',
    wageCeiling: 7400,
    authority: 'CPF Board',
    source: 'https://www.cpf.gov.sg/employer/employer-obligations/how-much-cpf-contributions-to-pay',
    effectiveFrom: '2025-01-01',
    ...SG_UNREVIEWED,
    notes: [
      'Ordinary Wage ceiling stepping up: SGD 6,800 (2024) → 7,400 (2025) → 8,000 (2026) per Budget 2023.',
      'Annual Additional Wage (AW) ceiling = SGD 102,000 − total OW subject to CPF.',
      'Applies to Singapore Citizens and Singapore PRs (3rd-year onwards); SPR 1st/2nd year graduated rates apply.',
    ],
  },
  {
    id: 'sg-cpf-employee-under-55-2025',
    country: 'SG',
    scheme: 'CPF',
    label: 'CPF — employee share, age ≤ 55 (2025)',
    category: 'social-security',
    party: 'employee',
    rateType: 'percentage',
    rate: 0.20,
    appliedTo: 'Ordinary Wages up to OW ceiling SGD 7,400/month (2025)',
    wageCeiling: 7400,
    authority: 'CPF Board',
    source: 'https://www.cpf.gov.sg/employer/employer-obligations/how-much-cpf-contributions-to-pay',
    effectiveFrom: '2025-01-01',
    ...SG_UNREVIEWED,
    notes: ['Combined under-55 total contribution = 37% (17% employer + 20% employee).'],
  },
  {
    id: 'sg-cpf-employer-55-60-2025',
    country: 'SG',
    scheme: 'CPF',
    label: 'CPF — employer share, age 55–60 (2025)',
    category: 'social-security',
    party: 'employer',
    rateType: 'percentage',
    rate: 0.155,
    appliedTo: 'Ordinary Wages up to OW ceiling SGD 7,400/month (2025)',
    wageCeiling: 7400,
    authority: 'CPF Board',
    source: 'https://www.cpf.gov.sg/employer/employer-obligations/how-much-cpf-contributions-to-pay',
    effectiveFrom: '2025-01-01',
    ...SG_UNREVIEWED,
    notes: ['Senior-worker CPF rates rose 01-Jan-2025 per Budget 2023 phased schedule (next step 2026).'],
  },
  {
    id: 'sg-cpf-employee-55-60-2025',
    country: 'SG',
    scheme: 'CPF',
    label: 'CPF — employee share, age 55–60 (2025)',
    category: 'social-security',
    party: 'employee',
    rateType: 'percentage',
    rate: 0.17,
    appliedTo: 'Ordinary Wages up to OW ceiling SGD 7,400/month (2025)',
    wageCeiling: 7400,
    authority: 'CPF Board',
    source: 'https://www.cpf.gov.sg/employer/employer-obligations/how-much-cpf-contributions-to-pay',
    effectiveFrom: '2025-01-01',
    ...SG_UNREVIEWED,
    notes: ['Combined 55–60 total contribution = 32.5%; next phased step in 2026 brings 55–60 closer to under-55 rate.'],
  },
  {
    id: 'sg-cpf-employer-60-65-2025',
    country: 'SG',
    scheme: 'CPF',
    label: 'CPF — employer share, age 60–65 (2025)',
    category: 'social-security',
    party: 'employer',
    rateType: 'percentage',
    rate: 0.12,
    appliedTo: 'Ordinary Wages up to OW ceiling SGD 7,400/month (2025)',
    wageCeiling: 7400,
    authority: 'CPF Board',
    source: 'https://www.cpf.gov.sg/employer/employer-obligations/how-much-cpf-contributions-to-pay',
    effectiveFrom: '2025-01-01',
    ...SG_UNREVIEWED,
  },
  {
    id: 'sg-cpf-employee-60-65-2025',
    country: 'SG',
    scheme: 'CPF',
    label: 'CPF — employee share, age 60–65 (2025)',
    category: 'social-security',
    party: 'employee',
    rateType: 'percentage',
    rate: 0.115,
    appliedTo: 'Ordinary Wages up to OW ceiling SGD 7,400/month (2025)',
    wageCeiling: 7400,
    authority: 'CPF Board',
    source: 'https://www.cpf.gov.sg/employer/employer-obligations/how-much-cpf-contributions-to-pay',
    effectiveFrom: '2025-01-01',
    ...SG_UNREVIEWED,
    notes: ['Combined 60–65 total contribution = 23.5%.'],
  },
  {
    id: 'sg-cpf-employer-65-70-2025',
    country: 'SG',
    scheme: 'CPF',
    label: 'CPF — employer share, age 65–70 (2025)',
    category: 'social-security',
    party: 'employer',
    rateType: 'percentage',
    rate: 0.09,
    appliedTo: 'Ordinary Wages up to OW ceiling SGD 7,400/month (2025)',
    wageCeiling: 7400,
    authority: 'CPF Board',
    source: 'https://www.cpf.gov.sg/employer/employer-obligations/how-much-cpf-contributions-to-pay',
    effectiveFrom: '2025-01-01',
    ...SG_UNREVIEWED,
  },
  {
    id: 'sg-cpf-employee-65-70-2025',
    country: 'SG',
    scheme: 'CPF',
    label: 'CPF — employee share, age 65–70 (2025)',
    category: 'social-security',
    party: 'employee',
    rateType: 'percentage',
    rate: 0.075,
    appliedTo: 'Ordinary Wages up to OW ceiling SGD 7,400/month (2025)',
    wageCeiling: 7400,
    authority: 'CPF Board',
    source: 'https://www.cpf.gov.sg/employer/employer-obligations/how-much-cpf-contributions-to-pay',
    effectiveFrom: '2025-01-01',
    ...SG_UNREVIEWED,
    notes: ['Combined 65–70 total contribution = 16.5%.'],
  },
  {
    id: 'sg-cpf-employer-above-70',
    country: 'SG',
    scheme: 'CPF',
    label: 'CPF — employer share, age > 70',
    category: 'social-security',
    party: 'employer',
    rateType: 'percentage',
    rate: 0.075,
    appliedTo: 'Ordinary Wages up to OW ceiling SGD 7,400/month (2025)',
    wageCeiling: 7400,
    authority: 'CPF Board',
    source: 'https://www.cpf.gov.sg/employer/employer-obligations/how-much-cpf-contributions-to-pay',
    effectiveFrom: '2016-01-01',
    ...SG_UNREVIEWED,
  },
  {
    id: 'sg-cpf-employee-above-70',
    country: 'SG',
    scheme: 'CPF',
    label: 'CPF — employee share, age > 70',
    category: 'social-security',
    party: 'employee',
    rateType: 'percentage',
    rate: 0.05,
    appliedTo: 'Ordinary Wages up to OW ceiling SGD 7,400/month (2025)',
    wageCeiling: 7400,
    authority: 'CPF Board',
    source: 'https://www.cpf.gov.sg/employer/employer-obligations/how-much-cpf-contributions-to-pay',
    effectiveFrom: '2016-01-01',
    ...SG_UNREVIEWED,
    notes: ['Combined above-70 total contribution = 12.5%.'],
  },
  {
    id: 'sg-sdl',
    country: 'SG',
    scheme: 'SDL',
    label: 'Skills Development Levy',
    category: 'state-payroll-tax',
    party: 'employer',
    rateType: 'percentage',
    rate: 0.0025,
    appliedTo: 'First SGD 4,500 of each employee\'s monthly gross wages; min SGD 2, max SGD 11.25 per employee',
    wageCeiling: 4500,
    authority: 'SkillsFuture Singapore (SSG) — collected via CPF Board',
    source: 'https://www.ssg-wsg.gov.sg/programmes-and-initiatives/funding/skills-development-levy.html',
    effectiveFrom: '2008-10-01',
    ...SG_UNREVIEWED,
    notes: [
      '0.25% on first SGD 4,500/month, with minimum SGD 2/employee and maximum SGD 11.25/employee — quirky two-sided cap.',
      'Payable on ALL employees (local, foreign, full-time, part-time, contract, casual) — broader base than CPF which is citizens/PRs only.',
      'Funds the Skills Development Fund used for SkillsFuture training subsidies.',
    ],
  },
  {
    id: 'sg-income-tax-note',
    country: 'SG',
    scheme: 'IR8A',
    label: 'Singapore income tax — no monthly withholding',
    category: 'income-tax',
    party: 'n/a',
    rateType: 'percentage',
    rate: 0,
    appliedTo: 'Annual taxable income — IRAS bills employee directly after IR8A annual reporting',
    authority: 'Inland Revenue Authority of Singapore (IRAS)',
    source: 'https://www.iras.gov.sg/taxes/individual-income-tax',
    effectiveFrom: '1965-08-09',
    ...SG_UNREVIEWED,
    notes: [
      'Singapore does NOT operate monthly PAYE withholding for resident employees. Employers report annual income via IR8A by 01-Mar each year; IRAS issues the Notice of Assessment directly to the employee.',
      'Non-resident employees and clearance cases (departure / NPL) require IR21 tax clearance — employer withholds final salary until IRAS clears.',
      'Resident progressive rates 2024-onwards run 0% (first $20k) up to 24% (above $1M). Confirm against IRAS for the relevant Year of Assessment.',
    ],
  },
];

// ---------------------------------------------------------------------------
// New Zealand — public-source-unreviewed. Inland Revenue (IR) PAYE bands per
// the Income Tax (Personal Tax Cuts) Amendment Act 2024 (full-year rates from
// 01-Apr-2025); KiwiSaver and ACC earner's levy per IR / ACC schedules.
// ---------------------------------------------------------------------------

const NZ_UNREVIEWED = {
  verification: 'public-source-unreviewed' as const,
  lastReviewed: '2026-05-14',
  currency: 'NZD',
};

const NZ_RATES: StatutoryRate[] = [
  {
    id: 'nz-paye-income-tax-2025',
    country: 'NZ',
    scheme: 'PAYE',
    label: 'PAYE income tax bands — full-year from 01-Apr-2025',
    category: 'income-tax',
    party: 'employee',
    rateType: 'slab',
    slabs: [
      { upTo: 15600, rate: 0.105, note: '$0 to $15,600.' },
      { upTo: 53500, rate: 0.175, note: '$15,601 to $53,500.' },
      { upTo: 78100, rate: 0.30, note: '$53,501 to $78,100.' },
      { upTo: 180000, rate: 0.33, note: '$78,101 to $180,000.' },
      { upTo: null, rate: 0.39, note: 'Above $180,000.' },
    ],
    appliedTo: 'Annual taxable income (resident)',
    authority: 'Inland Revenue (IR)',
    source: 'https://www.ird.govt.nz/income-tax/income-tax-for-individuals/tax-codes-and-tax-rates-for-individuals/tax-rates-for-individuals',
    effectiveFrom: '2025-04-01',
    ...NZ_UNREVIEWED,
    notes: [
      'Thresholds rose 31-Jul-2024 per the 2024 personal-tax-cuts package. Full-year bands shown apply from 01-Apr-2025; FY 2024-25 used composite rates due to mid-year change.',
      'The 39% top rate (above $180,000) was added 01-Apr-2021 and is unchanged.',
      'Independent Earner Tax Credit (IETC) phaseout starts at $66,000 (up from $48,000) under the 2024 changes.',
    ],
  },
  {
    id: 'nz-kiwisaver-employee',
    country: 'NZ',
    scheme: 'KiwiSaver',
    label: 'KiwiSaver — employee minimum contribution',
    category: 'pension',
    party: 'employee',
    rateType: 'percentage',
    rate: 0.03,
    appliedTo: 'Gross earnings before tax',
    authority: 'Inland Revenue (IR)',
    source: 'https://www.ird.govt.nz/kiwisaver',
    effectiveFrom: '2013-04-01',
    ...NZ_UNREVIEWED,
    notes: [
      'Employee may elect 3%, 4%, 6%, 8% or 10% — 3% is the statutory minimum.',
      'Savings suspension available after 12 months of membership; new members can also opt out within 8 weeks of auto-enrol.',
    ],
  },
  {
    id: 'nz-kiwisaver-employer',
    country: 'NZ',
    scheme: 'KiwiSaver',
    label: 'KiwiSaver — employer minimum contribution',
    category: 'pension',
    party: 'employer',
    rateType: 'percentage',
    rate: 0.03,
    appliedTo: 'Gross earnings before tax',
    authority: 'Inland Revenue (IR)',
    source: 'https://www.ird.govt.nz/kiwisaver',
    effectiveFrom: '2013-04-01',
    ...NZ_UNREVIEWED,
    notes: [
      'Compulsory employer contribution (CEC) is 3% minimum on gross earnings of KiwiSaver members.',
      'Subject to Employer Superannuation Contribution Tax (ESCT) — see esct entry — paid in addition unless using salary-sacrifice.',
    ],
  },
  {
    id: 'nz-acc-earners-levy-2025',
    country: 'NZ',
    scheme: 'ACC',
    label: 'ACC earner\'s levy — 2025-26',
    category: 'social-security',
    party: 'employee',
    rateType: 'percentage',
    rate: 0.0167,
    appliedTo: 'Liable earnings up to the maximum income threshold',
    authority: 'Accident Compensation Corporation (ACC)',
    source: 'https://www.acc.co.nz/for-business/levies/levies-payable-for-employers-and-self-employed-people/',
    effectiveFrom: '2025-04-01',
    ...NZ_UNREVIEWED,
    notes: [
      'Includes 0.07% GST. Earner\'s levy is collected by IR via PAYE alongside income tax.',
      'Liable earnings cap for 2025-26 is published annually by ACC — confirm current figure against the ACC levy page.',
      'Employer pays a SEPARATE Work levy based on industry classification (CU) — not modelled here as it is industry-specific.',
    ],
  },
  {
    id: 'nz-esct-2025',
    country: 'NZ',
    scheme: 'ESCT',
    label: 'Employer Superannuation Contribution Tax — graduated by salary',
    category: 'pension',
    party: 'employer',
    rateType: 'slab',
    slabs: [
      { upTo: 16800, rate: 0.105, note: 'Up to $16,800 ESCT-rate threshold income.' },
      { upTo: 57600, rate: 0.175, note: '$16,801 to $57,600.' },
      { upTo: 84000, rate: 0.30, note: '$57,601 to $84,000.' },
      { upTo: 216000, rate: 0.33, note: '$84,001 to $216,000.' },
      { upTo: null, rate: 0.39, note: 'Above $216,000 ESCT-rate threshold income.' },
    ],
    appliedTo: 'Employer cash contributions to KiwiSaver / complying super, banded by employee\'s prior-year gross salary + employer super contributions',
    authority: 'Inland Revenue (IR)',
    source: 'https://www.ird.govt.nz/employing-staff/payday-filing/non-standard-filing-of-employment-information/escapeing-superannuation-contribution-tax-esct',
    effectiveFrom: '2024-04-01',
    ...NZ_UNREVIEWED,
    notes: [
      'ESCT is deducted FROM the employer contribution (not added on top). Employee may elect to have employer contributions taxed via PAYE instead (RSCT election).',
      'New employees in their first year use estimated annualised remuneration; subsequent years use last-tax-year actuals.',
    ],
  },
];

// ---------------------------------------------------------------------------
// United Arab Emirates — public-source-unreviewed. No personal income tax;
// End-of-Service Gratuity per Federal Decree-Law 33 of 2021; DEWS is a DIFC-
// specific defined-contribution scheme that REPLACES gratuity for in-scope
// DIFC employers. WPS (Wage Protection System) is a payout process — see the
// existing `ae-wps` payroll engine in countries.ts rather than duplicating
// here.
// ---------------------------------------------------------------------------

const AE_UNREVIEWED = {
  verification: 'public-source-unreviewed' as const,
  lastReviewed: '2026-05-14',
  currency: 'AED',
};

const AE_RATES: StatutoryRate[] = [
  {
    id: 'ae-personal-income-tax',
    country: 'AE',
    scheme: 'PersonalIncomeTax',
    label: 'Personal income tax — UAE (0%)',
    category: 'income-tax',
    party: 'employee',
    rateType: 'percentage',
    rate: 0,
    appliedTo: 'All personal income — UAE has no federal personal income tax',
    authority: 'UAE Federal Tax Authority (FTA)',
    source: 'https://tax.gov.ae/en/taxes/individual.tax.aspx',
    effectiveFrom: '1971-12-02',
    ...AE_UNREVIEWED,
    notes: [
      'The UAE imposes NO personal income tax on salaries or wages — flat 0%.',
      'A 9% Corporate Tax applies to business income above AED 375,000 (effective 01-Jun-2023, Federal Decree-Law 47 of 2022) — that is a business tax, not a payroll tax.',
      'VAT of 5% applies at point of sale on most goods/services (Federal Decree-Law 8 of 2017).',
    ],
  },
  {
    id: 'ae-eosg-first-5-years',
    country: 'AE',
    scheme: 'EOSG',
    label: 'End-of-Service Gratuity — first 5 years',
    category: 'end-of-service',
    party: 'employer',
    rateType: 'percentage',
    rate: 0.0575,
    appliedTo: 'Basic salary per completed year of service (21 days / 365 ≈ 5.75% of annual basic)',
    authority: 'Ministry of Human Resources and Emiratisation (MOHRE)',
    source: 'https://u.ae/en/information-and-services/jobs/end-of-service-benefits',
    effectiveFrom: '2022-02-02',
    ...AE_UNREVIEWED,
    notes: [
      'Federal Decree-Law 33 of 2021 (in force 02-Feb-2022): 21 days basic salary for each of the first 5 years.',
      'Computed on LAST drawn basic salary; allowances (housing, transport, etc.) are excluded.',
      'See `ae-eosg-years-above-5` for accrual on service beyond 5 years; total gratuity is capped at 2 years\' basic salary regardless of service length.',
      'Rate is expressed as fraction of ANNUAL basic salary accrued per year of service (21/365). For a daily-rate view: gratuity per year = (basic_monthly × 12 / 365) × 21.',
      'DIFC employers (Dubai International Financial Centre) replaced gratuity with DEWS from 01-Feb-2020 — see `ae-dews-*` entries.',
    ],
  },
  {
    id: 'ae-eosg-years-above-5',
    country: 'AE',
    scheme: 'EOSG',
    label: 'End-of-Service Gratuity — year 6 onwards',
    category: 'end-of-service',
    party: 'employer',
    rateType: 'percentage',
    rate: 0.0822,
    appliedTo: 'Basic salary per completed year of service beyond 5 (30 days / 365 ≈ 8.22% of annual basic)',
    authority: 'Ministry of Human Resources and Emiratisation (MOHRE)',
    source: 'https://u.ae/en/information-and-services/jobs/end-of-service-benefits',
    effectiveFrom: '2022-02-02',
    ...AE_UNREVIEWED,
    notes: [
      '30 days basic salary for each year of service after the 5th year.',
      'Total gratuity (years 1-5 + 6 onwards) is CAPPED at 2 years\' basic salary regardless of tenure.',
      'Resignation under unlimited-contract pre-2022 had different graduated payout rules — those legacy contracts were migrated in 2023.',
    ],
  },
  {
    id: 'ae-dews-under-5-years',
    country: 'AE',
    scheme: 'DEWS',
    label: 'DIFC Employee Workplace Savings — first 5 years',
    category: 'pension',
    party: 'employer',
    rateType: 'percentage',
    rate: 0.0583,
    appliedTo: 'Monthly basic salary (DIFC employers only; replaces gratuity for in-scope employees)',
    authority: 'Dubai International Financial Centre Authority (DIFCA)',
    source: 'https://www.difc.ae/business/operating/employment/dews/',
    effectiveFrom: '2020-02-01',
    ...AE_UNREVIEWED,
    notes: [
      '5.83% per month of basic salary for employees with less than 5 years of qualifying DIFC service.',
      'Applies only to DIFC employers — replaces the Federal Decree-Law 33 of 2021 EOSG for in-scope staff.',
      'Employees may make voluntary additional contributions; employer contributions vest immediately.',
    ],
  },
  {
    id: 'ae-dews-above-5-years',
    country: 'AE',
    scheme: 'DEWS',
    label: 'DIFC Employee Workplace Savings — year 6 onwards',
    category: 'pension',
    party: 'employer',
    rateType: 'percentage',
    rate: 0.0833,
    appliedTo: 'Monthly basic salary (DIFC employers only)',
    authority: 'Dubai International Financial Centre Authority (DIFCA)',
    source: 'https://www.difc.ae/business/operating/employment/dews/',
    effectiveFrom: '2020-02-01',
    ...AE_UNREVIEWED,
    notes: [
      '8.33% per month of basic salary for employees with 5 or more years of qualifying DIFC service.',
      'Equivalent to one month\'s basic salary per year of service.',
    ],
  },
  {
    id: 'ae-wps-process-note',
    country: 'AE',
    scheme: 'WPS',
    label: 'UAE Wage Protection System — process, not a rate',
    category: 'state-payroll-tax',
    party: 'n/a',
    rateType: 'percentage',
    rate: 0,
    appliedTo: 'Process: all private-sector salaries must be disbursed via MOHRE-approved WPS agents (banks, exchange houses)',
    authority: 'Ministry of Human Resources and Emiratisation (MOHRE) + Central Bank of the UAE',
    source: 'https://www.mohre.gov.ae/en/services/wps.aspx',
    effectiveFrom: '2009-09-01',
    ...AE_UNREVIEWED,
    notes: [
      'WPS is a payout process, not a percentage rate. There is no statutory deduction or contribution rate attached.',
      'See the `ae-wps` payroll engine entry in `countries.ts` for HelloTime\'s SIF (Salary Information File) generation support.',
      'Non-compliance can trigger fines per company per affected employee, work-permit blocks, and labour-card suspension.',
      'DIFC and ADGM employers operate WPS variants run by their respective free-zone authorities.',
    ],
  },
];

// ---------------------------------------------------------------------------
// Final catalog
// ---------------------------------------------------------------------------

export const STATUTORY_RATES: StatutoryRate[] = [
  ...IN_PF_ESI,
  ...IN_PT,
  ...IN_INCOME_TAX,
  ...AU_RATES,
  ...US_RATES,
  ...GB_RATES,
  ...CA_RATES,
  ...SG_RATES,
  ...NZ_RATES,
  ...AE_RATES,
];
