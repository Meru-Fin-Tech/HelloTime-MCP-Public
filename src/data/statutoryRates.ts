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
 * Labour Welfare Fund (LWF) entries were added separately (May 2026) covering
 * 11 states. A subset — Maharashtra, Karnataka, Telangana, West Bengal,
 * Haryana — is `verification: 'verified'` based on multi-source corroboration
 * including state board or amendment-act citations. The rest are
 * `'public-source-unreviewed'` pending a direct gazette check (see the LWF
 * block comment for details).
 *
 * AU and US blocks are sourced from public government pages but have NOT
 * been through the same internal review pass as the IN block — they ship
 * with `verification: 'public-source-unreviewed'`. The audit field is
 * surfaced through the tool response so an AI agent (or its operator) knows
 * which rates are HelloTime-vouched vs. public-source verbatim.
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
  | 'state-payroll-tax'
  | 'labour-welfare-fund';

export type RateType = 'percentage' | 'flat-monthly' | 'flat-period' | 'slab';

/**
 * Period the `flatAmount` applies to, for `rateType === 'flat-period'`.
 * Use when a flat contribution is per-pay-cycle but the cycle isn't monthly
 * (e.g. Indian Labour Welfare Fund — half-yearly in MH/WB/GJ/Delhi,
 * yearly in KA/TN/TS/AP, monthly in PB/HR/Kerala-shops).
 */
export type RatePeriod = 'monthly' | 'half-yearly' | 'yearly';

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
  /** Flat amount per period in the country's currency. Set for rateType=flat-monthly or flat-period. */
  flatAmount?: number;
  /** Cadence the `flatAmount` applies to. Required for rateType=flat-period. */
  period?: RatePeriod;
  /**
   * Calendar months (1=Jan … 12=Dec) when the contribution is deducted /
   * remitted. For half-yearly LWF this is typically [6, 12]; for yearly LWF
   * usually [12]; monthly schemes may leave this undefined. Optional even for
   * flat-period entries when the state notification doesn't fix a month.
   */
  deductionMonths?: number[];
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
// India — Labour Welfare Fund (LWF) by state.
//
// LWF is a state-level statutory welfare cess: a small fixed per-employee
// deduction matched (or more-than-matched) by the employer, remitted to the
// state Labour Welfare Board. Unlike PF/ESI, amounts are flat (not
// wage-percentage) and the cadence varies: monthly in PB/HR/Kerala-shops,
// half-yearly in MH/GJ/WB/Delhi/Kerala-factories, yearly (December close) in
// KA/TN/TS/AP.
//
// LWF rates change every few years via state notifications. Entries below were
// compiled in May 2026 from a mix of state Labour Welfare Board portals and
// well-known secondary aggregators (Simpliance, ClearTax, FactoHR, Akrivia,
// PRS India, TaxGuru). Entries where multiple sources — including at least one
// official board reference or amendment-act citation — corroborate the current
// rate are marked `verification: 'verified'`; everything else is
// `'public-source-unreviewed'` pending a direct gazette check.
//
// Each state contributes two entries (employee + employer), mirroring the
// PF/ESI split. Kerala has two regimes (factories vs shops/commercial) and
// gets four entries.
// ---------------------------------------------------------------------------

const IN_LWF_BASE = {
  country: 'IN' as const,
  scheme: 'LWF',
  category: 'labour-welfare-fund' as const,
  rateType: 'flat-period' as const,
  appliedTo: 'Per-employee statutory welfare-fund deduction (not wage-linked unless noted)',
  authority: 'State Labour Welfare Board',
  currency: 'INR',
};

const IN_LWF_VERIFIED = {
  verification: 'verified' as const,
  lastReviewed: '2026-05-14',
};

const IN_LWF_UNREVIEWED = {
  verification: 'public-source-unreviewed' as const,
  lastReviewed: '2026-05-14',
};

const IN_LWF: StatutoryRate[] = [
  // -- Maharashtra (half-yearly: June + December close) ---------------------
  {
    ...IN_LWF_BASE,
    id: 'in-lwf-maharashtra-employee',
    label: 'Labour Welfare Fund — Maharashtra (employee)',
    party: 'employee',
    state: 'Maharashtra',
    flatAmount: 25,
    period: 'half-yearly',
    deductionMonths: [6, 12],
    source: 'Maharashtra Labour Welfare Fund Act, 1953 (as amended by Mah. Act 2024); https://prsindia.org/bills/states/he-maharashtra-labour-welfare-fund-amendment-bill-2024',
    effectiveFrom: '2024-03-18',
    ...IN_LWF_VERIFIED,
    notes: [
      'Up from ₹12 per half-year per the 2019 amendment; doubled-and-some to ₹25 via the 2024 Amendment Act.',
      'Periods close 30-Jun and 31-Dec; remittance due by 15-Jul and 15-Jan respectively.',
      'Applies to establishments employing 5 or more workers.',
    ],
  },
  {
    ...IN_LWF_BASE,
    id: 'in-lwf-maharashtra-employer',
    label: 'Labour Welfare Fund — Maharashtra (employer)',
    party: 'employer',
    state: 'Maharashtra',
    flatAmount: 75,
    period: 'half-yearly',
    deductionMonths: [6, 12],
    source: 'Maharashtra Labour Welfare Fund Act, 1953 (as amended by Mah. Act 2024); https://prsindia.org/bills/states/he-maharashtra-labour-welfare-fund-amendment-bill-2024',
    effectiveFrom: '2024-03-18',
    ...IN_LWF_VERIFIED,
    notes: [
      'Employer share = 3× employee share (₹75 per half-year against employee ₹25).',
      'Periods close 30-Jun and 31-Dec; remittance due by 15-Jul and 15-Jan respectively.',
    ],
  },

  // -- Karnataka (annual: December close) -----------------------------------
  {
    ...IN_LWF_BASE,
    id: 'in-lwf-karnataka-employee',
    label: 'Labour Welfare Fund — Karnataka (employee)',
    party: 'employee',
    state: 'Karnataka',
    flatAmount: 50,
    period: 'yearly',
    deductionMonths: [12],
    source: 'Karnataka Labour Welfare Fund Act, 1965 (as amended 2024); https://klwbapps.karnataka.gov.in/',
    effectiveFrom: '2025-01-10',
    ...IN_LWF_VERIFIED,
    notes: [
      'Up from ₹20 per the 2024 Amendment Act effective 10-Jan-2025.',
      'Annual contribution period closes 31-Dec; remittance due by 15-Jan of the following year.',
      'Applies to establishments employing 10 or more workers (Karnataka threshold).',
    ],
  },
  {
    ...IN_LWF_BASE,
    id: 'in-lwf-karnataka-employer',
    label: 'Labour Welfare Fund — Karnataka (employer)',
    party: 'employer',
    state: 'Karnataka',
    flatAmount: 100,
    period: 'yearly',
    deductionMonths: [12],
    source: 'Karnataka Labour Welfare Fund Act, 1965 (as amended 2024); https://klwbapps.karnataka.gov.in/',
    effectiveFrom: '2025-01-10',
    ...IN_LWF_VERIFIED,
    notes: [
      'Up from ₹40 per the 2024 Amendment Act. State government adds an additional ₹50 per worker.',
    ],
  },

  // -- Tamil Nadu (annual: December close — NOT half-yearly) ----------------
  {
    ...IN_LWF_BASE,
    id: 'in-lwf-tamil-nadu-employee',
    label: 'Labour Welfare Fund — Tamil Nadu (employee)',
    party: 'employee',
    state: 'Tamil Nadu',
    flatAmount: 20,
    period: 'yearly',
    deductionMonths: [12],
    source: 'Tamil Nadu Labour Welfare Fund Act, 1972 (2022 revision); https://www.lwb.tn.gov.in/',
    effectiveFrom: '2022-01-01',
    ...IN_LWF_UNREVIEWED,
    notes: [
      'Up from ₹10 per the 2022 revision.',
      'Contribution period closes 31-Dec; remittance due by 31-Jan of the following year.',
      'Despite the common "half-yearly" framing in payroll guides, the TN Act prescribes a single annual contribution (no June cycle).',
    ],
  },
  {
    ...IN_LWF_BASE,
    id: 'in-lwf-tamil-nadu-employer',
    label: 'Labour Welfare Fund — Tamil Nadu (employer)',
    party: 'employer',
    state: 'Tamil Nadu',
    flatAmount: 40,
    period: 'yearly',
    deductionMonths: [12],
    source: 'Tamil Nadu Labour Welfare Fund Act, 1972 (2022 revision); https://www.lwb.tn.gov.in/',
    effectiveFrom: '2022-01-01',
    ...IN_LWF_UNREVIEWED,
    notes: [
      'Up from ₹20 per the 2022 revision. State government adds an additional ₹20 per worker.',
    ],
  },

  // -- Telangana (annual: December close) -----------------------------------
  {
    ...IN_LWF_BASE,
    id: 'in-lwf-telangana-employee',
    label: 'Labour Welfare Fund — Telangana (employee)',
    party: 'employee',
    state: 'Telangana',
    flatAmount: 2,
    period: 'yearly',
    deductionMonths: [12],
    source: 'Telangana Labour Welfare Fund Act, 1987; https://labour.telangana.gov.in/content/ActsRules/TELANGANA%20LABOUR%20WELFARE%20FUND%20ACT,%201987.htm',
    effectiveFrom: '1987-01-01',
    ...IN_LWF_VERIFIED,
    notes: [
      'Rate unrevised since the 1987 Act — the ₹2 employee / ₹5 employer figures still apply.',
      'Applies to establishments employing 20 or more workers.',
      'Excludes employees in managerial/supervisory roles drawing wages above ₹1,600/month.',
    ],
  },
  {
    ...IN_LWF_BASE,
    id: 'in-lwf-telangana-employer',
    label: 'Labour Welfare Fund — Telangana (employer)',
    party: 'employer',
    state: 'Telangana',
    flatAmount: 5,
    period: 'yearly',
    deductionMonths: [12],
    source: 'Telangana Labour Welfare Fund Act, 1987; https://labour.telangana.gov.in/content/ActsRules/TELANGANA%20LABOUR%20WELFARE%20FUND%20ACT,%201987.htm',
    effectiveFrom: '1987-01-01',
    ...IN_LWF_VERIFIED,
    notes: ['Annual remittance due by 31-Jan of the following year.'],
  },

  // -- Andhra Pradesh (annual: December close) ------------------------------
  {
    ...IN_LWF_BASE,
    id: 'in-lwf-andhra-pradesh-employee',
    label: 'Labour Welfare Fund — Andhra Pradesh (employee)',
    party: 'employee',
    state: 'Andhra Pradesh',
    flatAmount: 30,
    period: 'yearly',
    deductionMonths: [12],
    source: 'Andhra Pradesh Labour Welfare Fund Act, 1987',
    effectiveFrom: '2016-01-01',
    ...IN_LWF_UNREVIEWED,
    notes: [
      'Most-recent revision believed to be 2016 (₹30 employee / ₹70 employer).',
      'Applies to establishments employing 20 or more workers; excludes managerial roles drawing wages above ₹1,600/month.',
      'No notification URL captured — flagged unreviewed pending a direct gazette check.',
    ],
  },
  {
    ...IN_LWF_BASE,
    id: 'in-lwf-andhra-pradesh-employer',
    label: 'Labour Welfare Fund — Andhra Pradesh (employer)',
    party: 'employer',
    state: 'Andhra Pradesh',
    flatAmount: 70,
    period: 'yearly',
    deductionMonths: [12],
    source: 'Andhra Pradesh Labour Welfare Fund Act, 1987',
    effectiveFrom: '2016-01-01',
    ...IN_LWF_UNREVIEWED,
    notes: ['Annual remittance due by 31-Jan of the following year.'],
  },

  // -- Gujarat (half-yearly: June + December close — NOT monthly) -----------
  {
    ...IN_LWF_BASE,
    id: 'in-lwf-gujarat-employee',
    label: 'Labour Welfare Fund — Gujarat (employee)',
    party: 'employee',
    state: 'Gujarat',
    flatAmount: 6,
    period: 'half-yearly',
    deductionMonths: [6, 12],
    source: 'Gujarat Labour Welfare Fund Act, 1953; https://glwb.gujarat.gov.in/',
    effectiveFrom: '2016-12-01',
    ...IN_LWF_UNREVIEWED,
    notes: [
      'Periods close 30-Jun and 31-Dec; remittance due by 15-Jul and 15-Jan respectively.',
      'Common payroll-guide framing of Gujarat LWF as "monthly" is incorrect — the Act prescribes half-yearly contributions.',
      'Applies to establishments employing 10 or more workers; excludes managerial roles drawing wages above ₹3,500/month.',
    ],
  },
  {
    ...IN_LWF_BASE,
    id: 'in-lwf-gujarat-employer',
    label: 'Labour Welfare Fund — Gujarat (employer)',
    party: 'employer',
    state: 'Gujarat',
    flatAmount: 12,
    period: 'half-yearly',
    deductionMonths: [6, 12],
    source: 'Gujarat Labour Welfare Fund Act, 1953; https://glwb.gujarat.gov.in/',
    effectiveFrom: '2016-12-01',
    ...IN_LWF_UNREVIEWED,
    notes: ['Employer share = 2× employee share (₹12 per half-year against employee ₹6).'],
  },

  // -- West Bengal (half-yearly: June + December close) ---------------------
  {
    ...IN_LWF_BASE,
    id: 'in-lwf-west-bengal-employee',
    label: 'Labour Welfare Fund — West Bengal (employee)',
    party: 'employee',
    state: 'West Bengal',
    flatAmount: 3,
    period: 'half-yearly',
    deductionMonths: [6, 12],
    source: 'West Bengal Labour Welfare Fund Act, 1974 (2024 revision); https://lwf.wblabour.gov.in/wblabour/',
    effectiveFrom: '2024-01-01',
    ...IN_LWF_VERIFIED,
    notes: [
      'Employee share unchanged at ₹3 per half-year, but employer share jumped from ₹15 to ₹30 effective 01-Jan-2024.',
      'Periods close 30-Jun and 31-Dec; remittance due by 15-Jul and 15-Jan respectively.',
      'Applies to establishments employing 10 or more workers; excludes managerial roles drawing wages above ₹1,600/month.',
    ],
  },
  {
    ...IN_LWF_BASE,
    id: 'in-lwf-west-bengal-employer',
    label: 'Labour Welfare Fund — West Bengal (employer)',
    party: 'employer',
    state: 'West Bengal',
    flatAmount: 30,
    period: 'half-yearly',
    deductionMonths: [6, 12],
    source: 'West Bengal Labour Welfare Fund Act, 1974 (2024 revision); https://lwf.wblabour.gov.in/wblabour/',
    effectiveFrom: '2024-01-01',
    ...IN_LWF_VERIFIED,
    notes: ['Up from ₹15 per half-year effective 01-Jan-2024.'],
  },

  // -- Kerala (factories regime — half-yearly) ------------------------------
  {
    ...IN_LWF_BASE,
    id: 'in-lwf-kerala-factories-employee',
    label: 'Labour Welfare Fund — Kerala (factories/plantations, employee)',
    party: 'employee',
    state: 'Kerala',
    flatAmount: 4,
    period: 'half-yearly',
    deductionMonths: [6, 12],
    source: 'Kerala Labour Welfare Fund Act, 1975 (as amended 2021)',
    effectiveFrom: '2022-01-01',
    ...IN_LWF_UNREVIEWED,
    notes: [
      'Factories-and-plantations regime. Periods close 30-Jun and 31-Dec; remittance due by 15-Jul and 15-Jan.',
      'A separate regime under the Kerala Shops & Commercial Establishments Workers Welfare Fund Act, 2006 applies to shops/commercial estabs at monthly ₹50/₹50 — see the in-lwf-kerala-shops-* entries.',
    ],
  },
  {
    ...IN_LWF_BASE,
    id: 'in-lwf-kerala-factories-employer',
    label: 'Labour Welfare Fund — Kerala (factories/plantations, employer)',
    party: 'employer',
    state: 'Kerala',
    flatAmount: 8,
    period: 'half-yearly',
    deductionMonths: [6, 12],
    source: 'Kerala Labour Welfare Fund Act, 1975 (as amended 2021)',
    effectiveFrom: '2022-01-01',
    ...IN_LWF_UNREVIEWED,
    notes: ['Employer share = 2× employee share for the factories regime.'],
  },

  // -- Kerala (shops & commercial establishments regime — monthly) ----------
  {
    ...IN_LWF_BASE,
    id: 'in-lwf-kerala-shops-employee',
    label: 'Labour Welfare Fund — Kerala (shops & commercial estabs, employee)',
    party: 'employee',
    state: 'Kerala',
    flatAmount: 50,
    period: 'monthly',
    source: 'Kerala Shops & Commercial Establishments Workers Welfare Fund Act, 2006',
    effectiveFrom: '2022-01-01',
    ...IN_LWF_UNREVIEWED,
    notes: [
      'Shops-and-commercial-establishments regime — applies to non-factory employers covered by the 2006 Act.',
      'Deducted monthly (last day of the calendar month); employer files by the 5th of the following month.',
    ],
  },
  {
    ...IN_LWF_BASE,
    id: 'in-lwf-kerala-shops-employer',
    label: 'Labour Welfare Fund — Kerala (shops & commercial estabs, employer)',
    party: 'employer',
    state: 'Kerala',
    flatAmount: 50,
    period: 'monthly',
    source: 'Kerala Shops & Commercial Establishments Workers Welfare Fund Act, 2006',
    effectiveFrom: '2022-01-01',
    ...IN_LWF_UNREVIEWED,
    notes: ['Employer share equals employee share (₹50 each per month) under the shops regime.'],
  },

  // -- Punjab (monthly) -----------------------------------------------------
  {
    ...IN_LWF_BASE,
    id: 'in-lwf-punjab-employee',
    label: 'Labour Welfare Fund — Punjab (employee)',
    party: 'employee',
    state: 'Punjab',
    flatAmount: 5,
    period: 'monthly',
    source: 'Punjab Labour Welfare Fund Act, 1965; https://hrylabour.gov.in/staticdocs/labourActpdfdocs/Punjab_Labour_Welfar_Fund_Act.pdf',
    effectiveFrom: '2018-01-01',
    ...IN_LWF_UNREVIEWED,
    notes: [
      'Monthly deduction; employer remits half-yearly by 15-Apr (Oct–Mar) and 15-Oct (Apr–Sep).',
      'Flat amount — not a wage-percentage despite some payroll-guide renderings that show "5%" / "20%" (those are stripped-rupee-sign artifacts).',
    ],
  },
  {
    ...IN_LWF_BASE,
    id: 'in-lwf-punjab-employer',
    label: 'Labour Welfare Fund — Punjab (employer)',
    party: 'employer',
    state: 'Punjab',
    flatAmount: 20,
    period: 'monthly',
    source: 'Punjab Labour Welfare Fund Act, 1965; https://hrylabour.gov.in/staticdocs/labourActpdfdocs/Punjab_Labour_Welfar_Fund_Act.pdf',
    effectiveFrom: '2018-01-01',
    ...IN_LWF_UNREVIEWED,
    notes: ['Employer share = 4× employee share (₹20 against employee ₹5).'],
  },

  // -- Haryana (monthly, wage-linked cap) -----------------------------------
  {
    ...IN_LWF_BASE,
    id: 'in-lwf-haryana-employee',
    label: 'Labour Welfare Fund — Haryana (employee)',
    party: 'employee',
    state: 'Haryana',
    flatAmount: 34,
    period: 'monthly',
    appliedTo: '0.2% of wages, capped at ₹34/month per employee',
    source: 'Punjab Labour Welfare Fund Act, 1965 (as extended to Haryana); https://hrylabour.gov.in/content/cms/MTU',
    effectiveFrom: '2025-01-01',
    ...IN_LWF_VERIFIED,
    notes: [
      'Employee contribution is technically 0.2% of wages but capped at ₹34/month; the cap is hit at monthly wages ≥ ₹17,000.',
      'Up from ₹31 (effective 01-Jan-2023) to ₹34 effective 01-Jan-2025.',
    ],
  },
  {
    ...IN_LWF_BASE,
    id: 'in-lwf-haryana-employer',
    label: 'Labour Welfare Fund — Haryana (employer)',
    party: 'employer',
    state: 'Haryana',
    flatAmount: 68,
    period: 'monthly',
    appliedTo: '0.4% of wages, capped at ₹68/month per employee (2× employee share)',
    source: 'Punjab Labour Welfare Fund Act, 1965 (as extended to Haryana); https://hrylabour.gov.in/content/cms/MTU',
    effectiveFrom: '2025-01-01',
    ...IN_LWF_VERIFIED,
    notes: [
      'Employer share = 2× employee share, capped at ₹68/month.',
      'Up from ₹62 (effective 01-Jan-2023) to ₹68 effective 01-Jan-2025.',
    ],
  },

  // -- Delhi (half-yearly: June + December close) ---------------------------
  {
    ...IN_LWF_BASE,
    id: 'in-lwf-delhi-employee',
    label: 'Labour Welfare Fund — Delhi (employee)',
    party: 'employee',
    state: 'Delhi',
    flatAmount: 0.75,
    period: 'half-yearly',
    deductionMonths: [6, 12],
    source: 'Bombay Labour Welfare Fund Act, 1953 (as extended to Delhi) + Delhi Labour Welfare Fund Rules, 1997; https://dlwb.delhi.gov.in/',
    effectiveFrom: '1997-01-01',
    ...IN_LWF_UNREVIEWED,
    notes: [
      'Delhi LWF amounts have not been revised in decades — the ₹0.75 / ₹2.25 figures are nominal paise-era values that are still in force per the 1997 Rules.',
      'Government of Delhi contributes 2× the employee share in addition.',
      'Applies to establishments employing 5 or more workers; excludes managerial/supervisory roles drawing wages above ₹2,500/month.',
    ],
  },
  {
    ...IN_LWF_BASE,
    id: 'in-lwf-delhi-employer',
    label: 'Labour Welfare Fund — Delhi (employer)',
    party: 'employer',
    state: 'Delhi',
    flatAmount: 2.25,
    period: 'half-yearly',
    deductionMonths: [6, 12],
    source: 'Bombay Labour Welfare Fund Act, 1953 (as extended to Delhi) + Delhi Labour Welfare Fund Rules, 1997; https://dlwb.delhi.gov.in/',
    effectiveFrom: '1997-01-01',
    ...IN_LWF_UNREVIEWED,
    notes: [
      'Employer share = 3× employee share per the Delhi Rules.',
      'Periods close 30-Jun and 31-Dec; remittance due by 15-Jul and 15-Jan respectively.',
    ],
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
// Final catalog
// ---------------------------------------------------------------------------

export const STATUTORY_RATES: StatutoryRate[] = [
  ...IN_PF_ESI,
  ...IN_PT,
  ...IN_LWF,
  ...IN_INCOME_TAX,
  ...AU_RATES,
  ...US_RATES,
];
