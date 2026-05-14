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
 * The IN income-tax sub-block (Section 192 TDS slabs + old-regime deduction
 * caps) was added in a separate CA-review pass on 2026-05-14, reconciled
 * against the Income-Tax Department portal and the Income-Tax Act, 1961 as
 * amended by Finance Act 2025. See the comment block above
 * `IN_INCOME_TAX` for the verification sources.
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
// India — TDS on salary (Section 192) slabs and old-regime deduction caps.
//
// The new regime is the default from FY 2023-24 onwards (Finance Act 2023).
// Finance Act 2025 substantially restructured the new-regime slabs and the
// §87A rebate for FY 2025-26 (AY 2026-27): bands re-grid from 3-7-10-12-15+L
// to 4-8-12-16-20-24+L, a 25% bracket inserts between 20% and 30%, and the
// §87A rebate ceiling lifts from ₹7L to ₹12L (max rebate ₹60,000). The old
// regime slabs are unchanged since FY 2017-18.
//
// Verified 2026-05-14 against:
//   - incometax.gov.in /iec/foportal/help/individual/return-applicable-1
//     (Income-Tax Department salaried-individuals AY 2026-27 page)
//   - Income-Tax Act, 1961 §115BAC as amended by Finance Act 2025
//   - cleartax.in/s/marginal-relief-surcharge (surcharge brackets reconciled)
//   - cleartax.in/s/80c-80-deductions, /s/section-80ccd, /s/section-80d,
//     /s/section-80ttb (old-regime deduction caps reconciled against current
//     Income-Tax Act sections)
//
// Both FY 2024-25 and FY 2025-26 entries are retained because employers still
// reconcile previous-year TDS and AS-26 statements during the assessment
// year that follows. AY 2026-27 (= FY 2025-26 income) is the current
// withholding year as of this review pass.
// ---------------------------------------------------------------------------

const IN_TAX_VERIFIED = {
  verification: 'verified' as const,
  lastReviewed: '2026-05-14',
  currency: 'INR' as const,
};

const IN_INCOME_TAX: StatutoryRate[] = [
  // -- TDS on salary -------------------------------------------------------
  {
    id: 'in-tds-new-regime-fy2526',
    country: 'IN',
    scheme: 'TDS',
    label: 'TDS on salary — new regime (Section 115BAC) FY 2025-26',
    category: 'income-tax',
    party: 'employee',
    rateType: 'slab',
    slabs: [
      { upTo: 400000, rate: 0 },
      { upTo: 800000, rate: 0.05 },
      { upTo: 1200000, rate: 0.10 },
      { upTo: 1600000, rate: 0.15 },
      { upTo: 2000000, rate: 0.20 },
      { upTo: 2400000, rate: 0.25 },
      { upTo: null, rate: 0.30 },
    ],
    appliedTo: 'Annual taxable salary income, default regime (AY 2026-27)',
    authority: 'CBDT',
    source: 'Income-Tax Act, 1961 §115BAC as amended by Finance Act 2025',
    effectiveFrom: '2025-04-01',
    ...IN_TAX_VERIFIED,
    notes: [
      'Default regime — employee must explicitly opt out (Form 10-IEA) to use the old regime.',
      'Standard deduction ₹75,000 available against salary income.',
      'Section 87A rebate of up to ₹60,000 makes net tax zero on taxable income up to ₹12,00,000 (effective ₹12,75,000 with standard deduction).',
      'Marginal relief applies just above ₹12,00,000 so that the tax payable does not exceed the income in excess of ₹12,00,000.',
      'Add Health & Education Cess @ 4% on (tax + surcharge).',
      'Surcharge: nil up to ₹50L; 10% (₹50L–1Cr); 15% (₹1Cr–2Cr); 25% (₹2Cr–5Cr); 25% above ₹5Cr — new regime caps at 25% (vs 37% in old regime).',
      'Most chapter VI-A deductions (80C, 80D, 80TTA, HRA, LTA, etc.) are NOT available under the new regime.',
    ],
  },
  {
    id: 'in-tds-new-regime-fy2425',
    country: 'IN',
    scheme: 'TDS',
    label: 'TDS on salary — new regime (Section 115BAC) FY 2024-25 (historical)',
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
    appliedTo: 'Annual taxable salary income, default regime (AY 2025-26)',
    authority: 'CBDT',
    source: 'Income-Tax Act, 1961 §115BAC as amended by Finance (No.2) Act 2024',
    effectiveFrom: '2024-04-01',
    ...IN_TAX_VERIFIED,
    notes: [
      'Historical FY 2024-25 slabs — retained for AY 2025-26 reconciliation and Form 24Q Q4 / Form 16 issuance.',
      'Standard deduction ₹75,000 (raised from ₹50,000 by Finance (No.2) Act 2024).',
      'Section 87A rebate ceiling was ₹7,00,000 (effective ₹7,75,000 with standard deduction); max rebate ₹25,000.',
      'Add Health & Education Cess @ 4% on (tax + surcharge). Surcharge brackets same as FY 2025-26 with new-regime cap at 25%.',
    ],
  },
  {
    id: 'in-tds-old-regime-fy2526',
    country: 'IN',
    scheme: 'TDS',
    label: 'TDS on salary — old regime FY 2025-26 (individuals < 60)',
    category: 'income-tax',
    party: 'employee',
    rateType: 'slab',
    slabs: [
      { upTo: 250000, rate: 0 },
      { upTo: 500000, rate: 0.05 },
      { upTo: 1000000, rate: 0.20 },
      { upTo: null, rate: 0.30 },
    ],
    appliedTo: 'Annual taxable salary income, opt-in old regime (AY 2026-27)',
    authority: 'CBDT',
    source: 'Income-Tax Act, 1961 (slabs unchanged since FY 2017-18)',
    effectiveFrom: '2017-04-01',
    ...IN_TAX_VERIFIED,
    notes: [
      'Employee must opt in to the old regime via Form 10-IEA each year (employees who already had business income on file may have a one-time opt-out).',
      'Senior citizens (60–80) basic-exemption raised to ₹3,00,000; super-senior (80+) to ₹5,00,000.',
      'Standard deduction ₹50,000 plus eligible chapter VI-A deductions (80C ₹1.5L, 80CCD(1B) ₹50k, 80D, 80TTA, HRA, home-loan interest, etc.) — see id values starting with "in-deduction-".',
      'Section 87A rebate of ₹12,500 on net tax for taxable income up to ₹5,00,000.',
      'Add Health & Education Cess @ 4% on (tax + surcharge).',
      'Surcharge: nil up to ₹50L; 10% (₹50L–1Cr); 15% (₹1Cr–2Cr); 25% (₹2Cr–5Cr); 37% above ₹5Cr.',
    ],
  },
  {
    id: 'in-tds-old-regime-fy2425',
    country: 'IN',
    scheme: 'TDS',
    label: 'TDS on salary — old regime FY 2024-25 (individuals < 60, historical)',
    category: 'income-tax',
    party: 'employee',
    rateType: 'slab',
    slabs: [
      { upTo: 250000, rate: 0 },
      { upTo: 500000, rate: 0.05 },
      { upTo: 1000000, rate: 0.20 },
      { upTo: null, rate: 0.30 },
    ],
    appliedTo: 'Annual taxable salary income, opt-in old regime (AY 2025-26)',
    authority: 'CBDT',
    source: 'Income-Tax Act, 1961 (slabs unchanged since FY 2017-18)',
    effectiveFrom: '2017-04-01',
    ...IN_TAX_VERIFIED,
    notes: [
      'Historical FY 2024-25 entry — slab values are identical to FY 2025-26 because the old regime has not been re-rated since FY 2017-18. Retained for AY 2025-26 Form 24Q Q4 / Form 16 reconciliation.',
      'Section 87A rebate ₹12,500 for taxable income up to ₹5,00,000.',
      'Standard deduction ₹50,000 plus eligible chapter VI-A deductions.',
    ],
  },

  // -- Old-regime deduction caps (Chapter VI-A + standard deduction) -------
  //
  // Modelled as 'flat-monthly' entries because that's the existing
  // schema-supported way to expose an annual currency cap (same pattern
  // used by the US 401(k) elective-deferral entry). The `appliedTo` field
  // documents that the figure is an ANNUAL cap, not a per-period amount.
  //
  // All limits are old-regime unless noted; the new regime denies almost
  // every chapter VI-A deduction.
  {
    id: 'in-std-deduction-new-regime',
    country: 'IN',
    scheme: 'StandardDeduction',
    label: 'Standard deduction from salary — new regime',
    category: 'income-tax',
    party: 'employee',
    rateType: 'flat-monthly',
    flatAmount: 75000,
    appliedTo: 'Annual cap on standard deduction from salary income (not per period)',
    authority: 'CBDT',
    source: 'Income-Tax Act, 1961 §16(ia) as amended by Finance (No.2) Act 2024',
    effectiveFrom: '2024-04-01',
    ...IN_TAX_VERIFIED,
    notes: [
      'Raised from ₹50,000 to ₹75,000 by Finance (No.2) Act 2024 for new-regime taxpayers; the same Act left old-regime standard deduction at ₹50,000.',
      'Family pension recipients get a separate standard deduction (₹25,000 under new regime, ₹15,000 under old) — not modelled here.',
    ],
  },
  {
    id: 'in-std-deduction-old-regime',
    country: 'IN',
    scheme: 'StandardDeduction',
    label: 'Standard deduction from salary — old regime',
    category: 'income-tax',
    party: 'employee',
    rateType: 'flat-monthly',
    flatAmount: 50000,
    appliedTo: 'Annual cap on standard deduction from salary income (not per period)',
    authority: 'CBDT',
    source: 'Income-Tax Act, 1961 §16(ia)',
    effectiveFrom: '2019-04-01',
    ...IN_TAX_VERIFIED,
    notes: [
      'Reinstated and set at ₹40,000 by Finance Act 2018, raised to ₹50,000 by Finance Act 2019. Old-regime figure not revised since FY 2019-20.',
    ],
  },
  {
    id: 'in-deduction-80c',
    country: 'IN',
    scheme: '80C',
    label: 'Section 80C — combined deduction cap (PF, PPF, ELSS, LIC, principal etc.)',
    category: 'income-tax',
    party: 'employee',
    rateType: 'flat-monthly',
    flatAmount: 150000,
    appliedTo: 'Annual combined cap across 80C/80CCC/80CCD(1) instruments (not per period)',
    authority: 'CBDT',
    source: 'Income-Tax Act, 1961 §80C, §80CCE (overall ceiling)',
    effectiveFrom: '2014-04-01',
    ...IN_TAX_VERIFIED,
    notes: [
      'Old regime only — disallowed under new regime (§115BAC).',
      '§80CCE caps the AGGREGATE of 80C + 80CCC + 80CCD(1) at ₹1,50,000; 80CCD(1B) sits OUTSIDE this cap and adds ₹50,000.',
      'Eligible instruments include EPF/VPF, PPF, ELSS, life-insurance premia, ULIPs, NSC, tax-saver FD (5-yr), Sukanya Samriddhi, home-loan principal repayment, tuition fees for up to 2 children, etc.',
      '₹1,50,000 cap unchanged since Finance (No.2) Act 2014.',
    ],
  },
  {
    id: 'in-deduction-80ccd-1b',
    country: 'IN',
    scheme: '80CCD(1B)',
    label: 'Section 80CCD(1B) — additional NPS deduction',
    category: 'income-tax',
    party: 'employee',
    rateType: 'flat-monthly',
    flatAmount: 50000,
    appliedTo: 'Annual additional cap for NPS Tier-I contributions, over and above §80CCE (not per period)',
    authority: 'CBDT',
    source: 'Income-Tax Act, 1961 §80CCD(1B)',
    effectiveFrom: '2015-04-01',
    ...IN_TAX_VERIFIED,
    notes: [
      'Old regime only — not available under new regime.',
      'Stacks on top of the ₹1,50,000 §80CCE ceiling, so an NPS-maximising taxpayer can claim ₹2,00,000 in aggregate (₹1.5L under 80C/CCD(1) + ₹50k under 80CCD(1B)).',
      'Employer NPS contribution under §80CCD(2) is a SEPARATE deduction (capped at 14% of salary for govt employees and new-regime opt-ins from FY 2024-25; 10% otherwise) — not modelled here.',
    ],
  },
  {
    id: 'in-deduction-80d-self-family',
    country: 'IN',
    scheme: '80D',
    label: 'Section 80D — health insurance, self + family',
    category: 'income-tax',
    party: 'employee',
    rateType: 'flat-monthly',
    flatAmount: 25000,
    appliedTo: 'Annual cap on premia for self + spouse + dependent children (not per period)',
    authority: 'CBDT',
    source: 'Income-Tax Act, 1961 §80D',
    effectiveFrom: '2018-04-01',
    ...IN_TAX_VERIFIED,
    notes: [
      'Old regime only.',
      'Cap rises to ₹50,000 if any of self/spouse is a senior citizen (60+).',
      'Preventive health check-up sub-limit ₹5,000 sits WITHIN this cap (not on top).',
      'Combined with parents-bucket (id="in-deduction-80d-parents"), the maximum aggregate 80D deduction is ₹50k + ₹50k = ₹1,00,000 when both buckets are senior-citizen; the common "self <60 + parents 60+" case gives ₹25k + ₹50k = ₹75,000.',
    ],
  },
  {
    id: 'in-deduction-80d-parents',
    country: 'IN',
    scheme: '80D',
    label: 'Section 80D — health insurance, parents bucket',
    category: 'income-tax',
    party: 'employee',
    rateType: 'flat-monthly',
    flatAmount: 25000,
    appliedTo: 'Annual cap on premia paid for parents (not per period)',
    authority: 'CBDT',
    source: 'Income-Tax Act, 1961 §80D',
    effectiveFrom: '2018-04-01',
    ...IN_TAX_VERIFIED,
    notes: [
      'Old regime only. Separate bucket from self+family.',
      'Cap rises to ₹50,000 if either parent is a senior citizen (60+).',
      'For uninsured senior-citizen parents, actual medical expenditure is deductible up to ₹50,000 in lieu of premia.',
    ],
  },
  {
    id: 'in-deduction-80tta',
    country: 'IN',
    scheme: '80TTA',
    label: 'Section 80TTA — savings-account interest',
    category: 'income-tax',
    party: 'employee',
    rateType: 'flat-monthly',
    flatAmount: 10000,
    appliedTo: 'Annual cap on interest from savings accounts (not per period)',
    authority: 'CBDT',
    source: 'Income-Tax Act, 1961 §80TTA',
    effectiveFrom: '2013-04-01',
    ...IN_TAX_VERIFIED,
    notes: [
      'Old regime only. Individuals below 60; HUFs eligible.',
      'Applies to interest from savings accounts with banks, co-op banks and post offices. FD/RD interest is NOT covered here.',
      'Senior citizens (60+) use §80TTB instead, which is a higher ₹50,000 cap covering both savings and FD/RD interest — see id="in-deduction-80ttb".',
      'Budget 2025 raised the §194A TDS-on-interest threshold but did NOT change the §80TTA cap.',
    ],
  },
  {
    id: 'in-deduction-80ttb',
    country: 'IN',
    scheme: '80TTB',
    label: 'Section 80TTB — senior-citizen interest income',
    category: 'income-tax',
    party: 'employee',
    rateType: 'flat-monthly',
    flatAmount: 50000,
    appliedTo: 'Annual cap on bank/post-office interest for resident senior citizens (not per period)',
    authority: 'CBDT',
    source: 'Income-Tax Act, 1961 §80TTB',
    effectiveFrom: '2018-04-01',
    ...IN_TAX_VERIFIED,
    notes: [
      'Old regime only. Resident individuals aged 60+; not available to HUFs.',
      'Covers interest on savings AND fixed/recurring deposits with banks, co-op banks and post offices — broader than §80TTA.',
      'A senior citizen claiming §80TTB cannot also claim §80TTA on the same income.',
    ],
  },
  {
    id: 'in-deduction-hra',
    country: 'IN',
    scheme: 'HRA',
    label: 'House Rent Allowance exemption — §10(13A) formula',
    category: 'income-tax',
    party: 'employee',
    rateType: 'percentage',
    rate: 0.50,
    appliedTo: 'Minimum of three values; see notes for the formula',
    authority: 'CBDT',
    source: 'Income-Tax Act, 1961 §10(13A) read with Rule 2A',
    effectiveFrom: '1962-04-01',
    ...IN_TAX_VERIFIED,
    notes: [
      'Old regime only — HRA exemption is denied under §115BAC.',
      'Exempt portion of HRA = MIN of: (a) actual HRA received; (b) 50% of (Basic + DA) if employee lives in a metro city — Delhi / Mumbai / Kolkata / Chennai; OR 40% of (Basic + DA) for non-metro; (c) Rent paid MINUS 10% of (Basic + DA).',
      'The 50% metro / 40% non-metro multipliers are the two structured rate values — see id="in-deduction-hra-metro-pct" and id="in-deduction-hra-non-metro-pct" for queries that need just the percentage.',
      'No HRA exemption if no rent is actually paid, even if HRA is part of the CTC.',
      'Rent paid > ₹1,00,000/year requires the landlord PAN in the employer declaration (CBDT circular 8/2013).',
    ],
  },
  {
    id: 'in-deduction-hra-metro-pct',
    country: 'IN',
    scheme: 'HRA',
    label: 'HRA exemption — metro multiplier (Delhi / Mumbai / Kolkata / Chennai)',
    category: 'income-tax',
    party: 'employee',
    rateType: 'percentage',
    rate: 0.50,
    appliedTo: 'Basic + Dearness Allowance — used in HRA exemption formula limb (b)',
    authority: 'CBDT',
    source: 'Income-Tax Rules, 1962 Rule 2A',
    effectiveFrom: '1962-04-01',
    ...IN_TAX_VERIFIED,
    notes: [
      'For HRA exemption limb (b) when the employee resides in Delhi, Mumbai, Kolkata or Chennai.',
      'Bengaluru, Hyderabad, Pune, Ahmedabad etc. are NOT metros for §10(13A) (despite being so for many other purposes) — those use the 40% non-metro multiplier.',
    ],
  },
  {
    id: 'in-deduction-hra-non-metro-pct',
    country: 'IN',
    scheme: 'HRA',
    label: 'HRA exemption — non-metro multiplier',
    category: 'income-tax',
    party: 'employee',
    rateType: 'percentage',
    rate: 0.40,
    appliedTo: 'Basic + Dearness Allowance — used in HRA exemption formula limb (b)',
    authority: 'CBDT',
    source: 'Income-Tax Rules, 1962 Rule 2A',
    effectiveFrom: '1962-04-01',
    ...IN_TAX_VERIFIED,
    notes: [
      'Default for every city other than the four §10(13A) metros (Delhi / Mumbai / Kolkata / Chennai).',
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
  ...IN_INCOME_TAX,
  ...AU_RATES,
  ...US_RATES,
];
