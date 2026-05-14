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
 * The AU block was reviewed 2026-05-14 against:
 *   - ATO key superannuation rates and thresholds (Super Guarantee + MSCB)
 *   - ATO Medicare Levy page (2% rate since 01-07-2014, low-income thresholds)
 *
 * The US block was reviewed 2026-05-14 against:
 *   - SSA Contribution and Benefit Base table (ssa.gov/oact/cola/cbb.html) —
 *     2025 = $176,100, 2026 = $184,500 per SSA COLA announcement
 *   - IRS Topic 751 (FICA Social Security / Medicare rates)
 *   - IRS Topic 560 + Form 8959 instructions (Additional Medicare Tax 0.9%
 *     employer withholding threshold $200,000, employee filing-status
 *     thresholds vary)
 *   - DOL Schedule A (Form 940) for tax-year 2025 — credit-reduction states
 *     are California (0.6% addl, total 1.2%) and US Virgin Islands (4.5% addl)
 *   - IRS Notice 2025-67 (2026 401(k) elective deferral cap $24,500 +
 *     SECURE 2.0 age-60-63 catch-up $11,250 unchanged from 2025)
 *
 * Public-only data: no customer references, no internal hostnames, no auth.
 */

export type StatutoryCountry = 'IN' | 'AU' | 'US';

export type StatutoryCategory =
  | 'social-security'
  | 'health-insurance'
  | 'income-tax'
  | 'professional-tax'
  | 'pension'
  | 'unemployment'
  | 'state-payroll-tax';

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
// Australia — verified 2026-05-14 against the ATO key superannuation and
// Medicare Levy pages.
// ---------------------------------------------------------------------------

const AU_VERIFIED = {
  verification: 'verified' as const,
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
    ...AU_VERIFIED,
    notes: [
      'Final scheduled increase from 11.5% in FY 2024-25 per the legislated schedule (Super Guarantee (Administration) Act 1992 amendments).',
      'Maximum Super Contribution Base FY 2025-26 is $62,500 per quarter (down from $65,070 in FY 2024-25 — the cap is indexed to AWOTE but was reset alongside the rate step-up to 12%). Max employer SG = $7,500/quarter per employee.',
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
    ...AU_VERIFIED,
    notes: ['Maximum Super Contribution Base FY 2024-25 is $65,070 per quarter; max employer SG = $7,483.05/quarter per employee.'],
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
    ...AU_VERIFIED,
    notes: [
      'FY 2025-26 low-income thresholds: $28,011 singles, $47,238 families, $44,268 single seniors/pensioners. In the shade-in range, levy is 10% of income above the lower threshold rather than the full 2%.',
      'Medicare Levy Surcharge (1–1.5%) applies separately for higher-income earners without private hospital cover.',
    ],
  },
];

// ---------------------------------------------------------------------------
// United States — verified 2026-05-14 against IRS / SSA / DOL.
// ---------------------------------------------------------------------------

const US_VERIFIED = {
  verification: 'verified' as const,
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
    ...US_VERIFIED,
    notes: ['Social Security wage base is adjusted annually for inflation by SSA. 2026 base = $184,500 (see us-fica-social-security-employee-2026).'],
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
    ...US_VERIFIED,
  },
  {
    id: 'us-fica-social-security-employee-2026',
    country: 'US',
    scheme: 'FICA-SS',
    label: 'FICA Social Security — employee (2026)',
    category: 'social-security',
    party: 'employee',
    rateType: 'percentage',
    rate: 0.062,
    appliedTo: 'Wages up to the Social Security wage base',
    wageCeiling: 184500,
    authority: 'SSA / IRS',
    source: 'https://www.ssa.gov/oact/cola/cbb.html',
    effectiveFrom: '2026-01-01',
    ...US_VERIFIED,
    notes: ['Wage base $184,500 announced in the SSA 2026 COLA fact sheet — up 4.77% from $176,100 in 2025. Max employee contribution = $11,439.00.'],
  },
  {
    id: 'us-fica-social-security-employer-2026',
    country: 'US',
    scheme: 'FICA-SS',
    label: 'FICA Social Security — employer (2026)',
    category: 'social-security',
    party: 'employer',
    rateType: 'percentage',
    rate: 0.062,
    appliedTo: 'Wages up to the Social Security wage base',
    wageCeiling: 184500,
    authority: 'SSA / IRS',
    source: 'https://www.ssa.gov/oact/cola/cbb.html',
    effectiveFrom: '2026-01-01',
    ...US_VERIFIED,
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
    ...US_VERIFIED,
    notes: [
      'Additional Medicare Tax of 0.9% applies on wages above thresholds set by IRC §3101(b)(2). Employers must withhold once an employee\'s wages exceed $200,000 in a calendar year, regardless of the employee\'s filing status.',
      'Employee tax-due thresholds vary by filing status: $200,000 single / head of household / qualifying widow(er); $250,000 married filing jointly; $125,000 married filing separately. Reconciled on Form 8959.',
    ],
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
    ...US_VERIFIED,
    notes: ['No employer match for the 0.9% Additional Medicare Tax — employee-only.'],
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
    effectiveFrom: '2011-07-01',
    ...US_VERIFIED,
    notes: [
      'Most employers get a 5.4% state-unemployment-credit, reducing the effective FUTA rate to 0.6% on the first $7,000 per employee per year.',
      'Tax-year 2025 credit-reduction jurisdictions (per DOL / IRS Schedule A, Form 940 for 2025): California (0.6% additional → effective 1.2%) and US Virgin Islands (4.5% additional → effective 5.1%). Connecticut and New York repaid before the 10-Nov-2025 cutoff and avoided reduction. The list is republished each January for the prior tax year — reconcile against the current Schedule A before filing.',
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
    ...US_VERIFIED,
    notes: [
      'flatAmount is the ANNUAL cap, not a per-pay-period deduction.',
      'Standard catch-up +$7,500 for age 50+; SECURE 2.0 super catch-up +$11,250 for ages 60–63 (greater of $10,000 indexed or 150% of the 2024 regular catch-up = $11,250).',
    ],
  },
  {
    id: 'us-401k-elective-deferral-2026',
    country: 'US',
    scheme: '401k',
    label: '401(k) elective deferral limit (2026)',
    category: 'pension',
    party: 'employee',
    rateType: 'flat-monthly',
    flatAmount: 24500,
    appliedTo: 'Annual employee elective deferral cap (not per period)',
    authority: 'IRS',
    source: 'https://www.irs.gov/newsroom/401k-limit-increases-to-24500-for-2026-ira-limit-increases-to-7500',
    effectiveFrom: '2026-01-01',
    ...US_VERIFIED,
    notes: [
      '2026 limits per IRS Notice 2025-67: elective deferral $24,500; standard age-50+ catch-up $8,000; SECURE 2.0 age-60-63 super catch-up $11,250 (unchanged from 2025 — the formula is greater of $10,000 indexed or 150% of the 2024 catch-up, neither pushed above $11,250 for 2026).',
      'SECURE 2.0 Roth-mandate for high earners begins 2026: catch-up contributions by employees with >$150,000 of FICA wages from the sponsoring employer in the prior year must be made on a Roth basis. If the plan does not offer Roth, the affected employees cannot make catch-up contributions.',
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
];
