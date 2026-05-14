/**
 * Local payment-method catalog — public knowledge of the bank-rail / wallet
 * options HelloTime customers see in each market. Used to answer questions
 * like "how do I pay AU contractors faster than next-day BECS?" or "which IN
 * rails clear instantly for salary payouts?".
 *
 * For HelloTime, the `payment_methods` tool is filtered to the use-cases
 * relevant to a workforce-management product:
 *   - 'payroll'           — bulk salary disbursement to employees
 *   - 'contractor-payout' — paying independent contractors (1099-NEC,
 *                           IN consultants, AU ABNs, etc.)
 *
 * The catalog itself carries every use-case so the schema stays interchangeable
 * with the sister HelloBooks-MCP-Public catalog (the two MCP servers don't
 * share code today; we keep the shape identical to make a future shared
 * package painless).
 *
 * Public-only data: no customer references, no bank-detail strings, no auth.
 * `helloProductSupport` reflects HelloTime's own status — set to 'live' only
 * where the rail is end-to-end shipped, 'roadmap' for declared intent without
 * a ship date, 'partner-only' when the rail is reachable through a connected
 * processor (e.g. UPI via Razorpay) but not directly.
 */

import type { CountryCode } from './plans.js';

export type PaymentRail = 'instant' | 'same-day' | 'next-day' | 'multi-day';

export type PaymentUseCase =
  | 'payroll'
  | 'invoice-collection'
  | 'contractor-payout'
  | 'b2b-supplier'
  | 'p2p';

export type HelloProductSupport = 'live' | 'roadmap' | 'partner-only';

export interface PaymentMethod {
  id: string;
  country: CountryCode;
  /** Human-readable name (e.g. 'UPI', 'BACS Direct Credit', 'Interac e-Transfer'). */
  name: string;
  rail: PaymentRail;
  useCases: PaymentUseCase[];
  /** Issuing/operating authority (e.g. 'NPCI', 'Pay.UK', 'Interac Corp'). */
  authority: string;
  helloProductSupport?: HelloProductSupport;
  notes?: string[];
}

// ---------------------------------------------------------------------------
// India — NPCI / RBI rails. UPI is reachable from HelloTime today via the
// Razorpay payouts integration; direct PSP integration is on the roadmap.
// ---------------------------------------------------------------------------

const IN_METHODS: PaymentMethod[] = [
  {
    id: 'in-upi',
    country: 'IN',
    name: 'UPI',
    rail: 'instant',
    useCases: ['payroll', 'contractor-payout', 'invoice-collection', 'b2b-supplier', 'p2p'],
    authority: 'NPCI',
    helloProductSupport: 'partner-only',
    notes: [
      'Unified Payments Interface — 24x7 instant settlement via VPAs.',
      'Per-transaction limit ₹1,00,000 for most use-cases (₹2,00,000–5,00,000 for specific categories per NPCI circulars).',
      'For salary payouts above the per-txn cap, use IMPS or NEFT for the residual.',
    ],
  },
  {
    id: 'in-rupay',
    country: 'IN',
    name: 'RuPay',
    rail: 'instant',
    useCases: ['invoice-collection', 'p2p'],
    authority: 'NPCI',
    notes: [
      'Domestic card scheme; useful for invoice collection on HelloBooks. Not a payout rail.',
      'RuPay credit cards on UPI are accepted via VPA-linked flows (NPCI 2022 enablement).',
    ],
  },
  {
    id: 'in-razorpay',
    country: 'IN',
    name: 'Razorpay (gateway + payouts)',
    rail: 'instant',
    useCases: ['payroll', 'contractor-payout', 'invoice-collection', 'b2b-supplier'],
    authority: 'Razorpay (RBI-licensed PA / PSP)',
    helloProductSupport: 'live',
    notes: [
      'Aggregator: routes UPI / IMPS / NEFT / RTGS / cards depending on amount and beneficiary.',
      'RazorpayX payouts are the canonical contractor-payout integration on HelloTime today.',
    ],
  },
  {
    id: 'in-imps',
    country: 'IN',
    name: 'IMPS',
    rail: 'instant',
    useCases: ['payroll', 'contractor-payout', 'b2b-supplier', 'p2p'],
    authority: 'NPCI',
    helloProductSupport: 'partner-only',
    notes: [
      'Immediate Payment Service — 24x7 inter-bank instant transfer.',
      'Per-transaction limit ₹5,00,000 (NPCI Oct-2021 circular). Good fit for individual salary credits above the UPI cap.',
    ],
  },
  {
    id: 'in-neft',
    country: 'IN',
    name: 'NEFT',
    rail: 'same-day',
    useCases: ['payroll', 'contractor-payout', 'b2b-supplier'],
    authority: 'Reserve Bank of India',
    helloProductSupport: 'partner-only',
    notes: [
      'National Electronic Funds Transfer — settles in half-hourly batches, 24x7 (since Dec-2019).',
      'No per-transaction cap; commonly used for bulk salary disbursement files.',
    ],
  },
  {
    id: 'in-rtgs',
    country: 'IN',
    name: 'RTGS',
    rail: 'instant',
    useCases: ['b2b-supplier'],
    authority: 'Reserve Bank of India',
    notes: [
      'Real-Time Gross Settlement — minimum ₹2,00,000 per transaction; settles continuously, 24x7 (since Dec-2020).',
      'Use for high-value supplier or vendor payouts where same-second settlement matters.',
    ],
  },
];

// ---------------------------------------------------------------------------
// United Kingdom — Pay.UK / Bank of England rails.
// ---------------------------------------------------------------------------

const GB_METHODS: PaymentMethod[] = [
  {
    id: 'gb-bacs',
    country: 'GB',
    name: 'BACS Direct Credit',
    rail: 'multi-day',
    useCases: ['payroll', 'contractor-payout', 'b2b-supplier'],
    authority: 'Pay.UK',
    notes: [
      'Three-day payroll standard: file submitted Day 1, processed Day 2, credited Day 3.',
      'Cheapest UK rail for high-volume bulk salary runs; used by virtually all UK PAYE payroll bureaus.',
    ],
  },
  {
    id: 'gb-fps',
    country: 'GB',
    name: 'Faster Payments (FPS)',
    rail: 'instant',
    useCases: ['payroll', 'contractor-payout', 'invoice-collection', 'b2b-supplier', 'p2p'],
    authority: 'Pay.UK',
    notes: [
      'Near-instant 24x7 inter-bank transfer; per-transaction limit £1,000,000 (most banks impose lower internal limits).',
      'Use as an emergency fallback for missed or corrected payroll lines that cannot wait the BACS three-day cycle.',
    ],
  },
  {
    id: 'gb-chaps',
    country: 'GB',
    name: 'CHAPS',
    rail: 'same-day',
    useCases: ['b2b-supplier'],
    authority: 'Bank of England',
    notes: [
      'Same-day high-value sterling settlement; no upper limit. Bank fees apply per leg.',
      'Reserved for property completions, large supplier payments, or any leg where same-day finality matters.',
    ],
  },
  {
    id: 'gb-open-banking',
    country: 'GB',
    name: 'Open Banking AIS / PIS',
    rail: 'instant',
    useCases: ['invoice-collection', 'contractor-payout'],
    authority: 'Open Banking Ltd (FCA-supervised)',
    notes: [
      'Account Information Services + Payment Initiation Services under PSD2. PIS pushes money via Faster Payments under the hood.',
      'Lower acceptance cost than card rails; useful for invoice collection without paying card fees.',
    ],
  },
];

// ---------------------------------------------------------------------------
// Canada — Payments Canada / Interac.
// ---------------------------------------------------------------------------

const CA_METHODS: PaymentMethod[] = [
  {
    id: 'ca-interac-etransfer',
    country: 'CA',
    name: 'Interac e-Transfer',
    rail: 'instant',
    useCases: ['payroll', 'contractor-payout', 'invoice-collection', 'p2p'],
    authority: 'Interac Corp',
    notes: [
      'Canada-default A2A rail; sender uses email/SMS to push funds, recipient claims into linked bank.',
      'Common per-transaction cap CA$3,000–10,000 depending on bank; bulk payouts may need EFT instead.',
      'Interac e-Transfer for Business raises the cap and supports automated deposit for payroll workflows.',
    ],
  },
  {
    id: 'ca-eft',
    country: 'CA',
    name: 'EFT (Electronic Funds Transfer)',
    rail: 'multi-day',
    useCases: ['payroll', 'contractor-payout', 'b2b-supplier'],
    authority: 'Payments Canada',
    notes: [
      'Canadian payroll standard; 1–3 business day settlement via the Automated Clearing Settlement System (ACSS).',
      'Direct-deposit pre-authorisations covered by Payments Canada Rule H1.',
    ],
  },
  {
    id: 'ca-ach',
    country: 'CA',
    name: 'ACH (cross-border)',
    rail: 'multi-day',
    useCases: ['contractor-payout', 'b2b-supplier'],
    authority: 'Payments Canada / Nacha (cross-border)',
    notes: [
      'Cross-border ACH from US-domiciled processors that route into Canadian EFT. Distinct from US domestic ACH.',
      'Useful for paying CA contractors from a US-based payroll processor; FX applied per processor.',
    ],
  },
];

// ---------------------------------------------------------------------------
// Australia — AusPayNet / NPP Australia / BPAY Group.
// ---------------------------------------------------------------------------

const AU_METHODS: PaymentMethod[] = [
  {
    id: 'au-payid',
    country: 'AU',
    name: 'PayID',
    rail: 'instant',
    useCases: ['payroll', 'contractor-payout', 'invoice-collection', 'p2p'],
    authority: 'NPP Australia',
    notes: [
      'Identifier service on top of the New Payments Platform; route via mobile / ABN / email instead of BSB+account.',
      'Reduces incorrect-payment risk for ad-hoc contractor payouts.',
    ],
  },
  {
    id: 'au-payto',
    country: 'AU',
    name: 'PayTo',
    rail: 'instant',
    useCases: ['payroll', 'invoice-collection', 'b2b-supplier'],
    authority: 'NPP Australia',
    notes: [
      'Mandate-based real-time direct debit on NPP; replacement for legacy BECS direct debit.',
      'Useful for recurring SaaS billing and authorised payroll-deduction flows.',
    ],
  },
  {
    id: 'au-npp',
    country: 'AU',
    name: 'NPP (New Payments Platform)',
    rail: 'instant',
    useCases: ['payroll', 'contractor-payout', 'invoice-collection', 'b2b-supplier', 'p2p'],
    authority: 'NPP Australia',
    notes: [
      'The underlying real-time rail; PayID and PayTo are services riding on top.',
      'Industry roadmap: AusPayNet plans to retire BECS direct entry by 2030, with NPP as the successor.',
    ],
  },
  {
    id: 'au-bpay',
    country: 'AU',
    name: 'BPAY',
    rail: 'next-day',
    useCases: ['invoice-collection', 'b2b-supplier'],
    authority: 'BPAY Group Limited',
    notes: [
      'Bill-payment scheme using biller code + CRN. Customer-pull rather than business-push.',
      'Most useful for HelloBooks-style AR invoice collection; less relevant for HelloTime payroll.',
    ],
  },
  {
    id: 'au-eft-direct-entry',
    country: 'AU',
    name: 'EFT (Direct Entry / BECS)',
    rail: 'next-day',
    useCases: ['payroll', 'contractor-payout', 'b2b-supplier'],
    authority: 'AusPayNet',
    notes: [
      'Bulk Electronic Clearing System — overnight ABA-file processing; the historic AU payroll rail.',
      'Earmarked for retirement on the AusPayNet 2030 roadmap; greenfield integrations should target NPP/PayTo.',
    ],
  },
];

// ---------------------------------------------------------------------------
// United States — Nacha / Fed / TCH / EWS rails.
// ---------------------------------------------------------------------------

const US_METHODS: PaymentMethod[] = [
  {
    id: 'us-ach-ccd-ppd',
    country: 'US',
    name: 'ACH (CCD / PPD)',
    rail: 'multi-day',
    useCases: ['payroll', 'contractor-payout', 'b2b-supplier'],
    authority: 'Nacha',
    notes: [
      'Standard 1–2 business day batch rail. PPD = consumer (payroll Direct Deposit), CCD = corporate (B2B).',
      'CCD addenda carry remittance metadata for B2B supplier reconciliation.',
    ],
  },
  {
    id: 'us-same-day-ach',
    country: 'US',
    name: 'Same Day ACH',
    rail: 'same-day',
    useCases: ['payroll', 'contractor-payout', 'b2b-supplier'],
    authority: 'Nacha',
    notes: [
      'Three settlement windows per business day; per-transaction cap raised to $1,000,000 (2022).',
      'Use for off-cycle payroll corrections or contractor payouts that miss the standard ACH deadline.',
    ],
  },
  {
    id: 'us-fedwire',
    country: 'US',
    name: 'Wire (Fedwire)',
    rail: 'same-day',
    useCases: ['b2b-supplier', 'contractor-payout'],
    authority: 'Federal Reserve',
    notes: [
      'Real-time gross settlement on Federal Reserve operating hours (extended to 22h since Apr-2024).',
      'Fees per leg ($15–35 typical); reserved for high-value supplier payments.',
    ],
  },
  {
    id: 'us-zelle',
    country: 'US',
    name: 'Zelle',
    rail: 'instant',
    useCases: ['invoice-collection', 'p2p'],
    authority: 'Early Warning Services (EWS)',
    notes: [
      'Bank-network P2P; consumer-grade, low merchant-side acceptance for B2B AR.',
      'Per-bank send limits typically $500–5,000/day; not a payroll rail.',
    ],
  },
  {
    id: 'us-rtp',
    country: 'US',
    name: 'RTP (Real-Time Payments)',
    rail: 'instant',
    useCases: ['payroll', 'contractor-payout', 'invoice-collection', 'b2b-supplier'],
    authority: 'The Clearing House',
    notes: [
      '24x7 instant credit transfer; per-transaction cap $10,000,000 (Feb-2025).',
      'FedNow (Federal Reserve, launched Jul-2023) is the alternative instant rail; coverage overlaps but is not identical.',
    ],
  },
];

// ---------------------------------------------------------------------------
// United Arab Emirates — WPS for payroll only.
// ---------------------------------------------------------------------------

const AE_METHODS: PaymentMethod[] = [
  {
    id: 'ae-wps-sif',
    country: 'AE',
    name: 'WPS-SIF (Wage Protection System Salary Information File)',
    rail: 'multi-day',
    useCases: ['payroll'],
    authority: 'Central Bank of the UAE / MOHRE',
    helloProductSupport: 'roadmap',
    notes: [
      'Mandatory rail for paying onshore UAE employees. Employer submits a SIF to its agent bank, which credits employee accounts via UAEFTS.',
      'Non-compliance triggers MOHRE penalties and can suspend new work permits.',
      'Free-zone authorities (DIFC, ADGM) operate parallel WPS schemes with the same SIF format.',
    ],
  },
];

// ---------------------------------------------------------------------------
// Singapore — ABS / MAS rails.
// ---------------------------------------------------------------------------

const SG_METHODS: PaymentMethod[] = [
  {
    id: 'sg-paynow',
    country: 'SG',
    name: 'PayNow',
    rail: 'instant',
    useCases: ['payroll', 'contractor-payout', 'invoice-collection', 'p2p'],
    authority: 'Association of Banks in Singapore (ABS)',
    notes: [
      'Identifier service on top of FAST; route by NRIC, mobile or UEN.',
      'PayNow Corporate (UEN-routed) is the preferred rail for B2B and contractor payouts.',
    ],
  },
  {
    id: 'sg-fast',
    country: 'SG',
    name: 'FAST',
    rail: 'instant',
    useCases: ['payroll', 'contractor-payout', 'b2b-supplier', 'p2p'],
    authority: 'Association of Banks in Singapore (ABS)',
    notes: [
      'Fast And Secure Transfers — 24x7 inter-bank instant rail underlying PayNow.',
      'Per-transaction cap raised to S$200,000 (2021).',
    ],
  },
  {
    id: 'sg-giro',
    country: 'SG',
    name: 'GIRO',
    rail: 'multi-day',
    useCases: ['payroll', 'invoice-collection', 'b2b-supplier'],
    authority: 'Association of Banks in Singapore (ABS)',
    notes: [
      'Batch direct credit / direct debit (2–3 day settlement). Long-standing payroll standard before PayNow Corporate.',
    ],
  },
];

// ---------------------------------------------------------------------------
// New Zealand — Payments NZ rails. POLi (a legacy A2A wallet) wound down its
// services in September 2023; we keep the entry so an agent can warn callers.
// ---------------------------------------------------------------------------

const NZ_METHODS: PaymentMethod[] = [
  {
    id: 'nz-becs-direct-credit',
    country: 'NZ',
    name: 'Direct Credit (Bulk Electronic Clearing System)',
    rail: 'next-day',
    useCases: ['payroll', 'contractor-payout', 'b2b-supplier'],
    authority: 'Payments NZ',
    notes: [
      'NZ analog of the AU BECS scheme; bulk batched direct credit run by Payments NZ under the SBI rules.',
      'Same-day intra-bank, next-business-day inter-bank for files lodged before the cut-off.',
      'The standard rail for NZ payroll and contractor disbursement.',
    ],
  },
  {
    id: 'nz-poli',
    country: 'NZ',
    name: 'POLi',
    rail: 'instant',
    useCases: ['invoice-collection'],
    authority: 'POLi Payments (discontinued)',
    notes: [
      'Legacy account-to-account online payment service. POLi Payments wound down its service on 30 September 2023.',
      'Listed for completeness so an agent can flag the discontinuation rather than recommend it.',
    ],
  },
  {
    id: 'nz-account-to-account',
    country: 'NZ',
    name: 'Account-to-account (Open Banking)',
    rail: 'instant',
    useCases: ['invoice-collection', 'contractor-payout'],
    authority: 'Payments NZ API Centre',
    notes: [
      'Payment-initiation API standards published by the Payments NZ API Centre; partial bank coverage as of 2025.',
      'Expected to replace POLi-style A2A for invoice-collection use cases as bank coverage broadens.',
    ],
  },
];

// ---------------------------------------------------------------------------
// Final catalog
// ---------------------------------------------------------------------------

export const PAYMENT_METHODS: PaymentMethod[] = [
  ...IN_METHODS,
  ...GB_METHODS,
  ...CA_METHODS,
  ...AU_METHODS,
  ...US_METHODS,
  ...AE_METHODS,
  ...SG_METHODS,
  ...NZ_METHODS,
];

/**
 * Use-cases this MCP surfaces. HelloTime is workforce-management, so we
 * filter to payout flows (employee payroll + contractor disbursement) and
 * deliberately drop invoice-collection / B2B-supplier / P2P from the default
 * tool response. Callers can still match those entries via `feature_search`.
 */
export const HELLOTIME_USE_CASES: PaymentUseCase[] = ['payroll', 'contractor-payout'];
