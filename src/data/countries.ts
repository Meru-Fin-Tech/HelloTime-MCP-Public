/**
 * Per-country payroll, statutory and product feature support matrix.
 *
 * Public-only — describes what HelloTime ships in each market. No customer
 * data, no per-account toggles. Sourced from Hellotime-website pricing and
 * features pages, plus the marketing-site India statutory copy.
 */

import type { CountryCode } from './plans.js';

export interface PayrollEngine {
  key: string;
  label: string;
  authority: string;
  description: string;
  status: 'live' | 'beta' | 'coming-soon';
}

export interface CountryFeature {
  key: string;
  label: string;
  description: string;
}

export interface CountrySupport {
  country: CountryCode;
  countryName: string;
  defaultCurrency: string;
  features: CountryFeature[];
  payrollEngines: PayrollEngine[];
  marketingUrl: string;
}

export const COUNTRY_SUPPORT: CountrySupport[] = [
  {
    country: 'IN',
    countryName: 'India',
    defaultCurrency: 'INR',
    marketingUrl: 'https://hellotime.app/best-time-tracking-software-india',
    features: [
      { key: 'gst-invoicing', label: 'GST invoicing via HelloBooks',
        description: 'Billable hours flow into HelloBooks for GST e-invoice and e-way bill generation.' },
      { key: 'upi-payouts', label: 'UPI and Razorpay payouts',
        description: 'Pay employees and contractors via UPI, Razorpay, IMPS or NEFT.' },
      { key: 'india-statutory', label: 'Indian statutory deductions',
        description: 'TDS, PF, ESI, PT, LWF and IT slab computation built in.' },
      { key: 'biometric-kiosk', label: 'Tablet kiosk for factory floors',
        description: 'Anti-spoof face recognition on Android tablets at factory and site gates.' },
      { key: 'whatsapp-onboarding', label: 'WhatsApp / SMS worker onboarding',
        description: 'Onboard contract workers via WhatsApp or SMS without a payroll seat cost.' },
      { key: 'dpdp-compliant', label: 'DPDP Act compliant',
        description: 'Data residency and consent flow aligned with India DPDP Act 2023.' },
    ],
    payrollEngines: [
      { key: 'in-tds', label: 'TDS (income-tax)', authority: 'CBDT',
        description: 'Section 192 monthly TDS on salary with slab and regime selection.',
        status: 'live' },
      { key: 'in-pf', label: 'Provident Fund (EPF)', authority: 'EPFO',
        description: 'Employee + employer PF contributions with ECR file generation.',
        status: 'live' },
      { key: 'in-esi', label: 'Employees State Insurance', authority: 'ESIC',
        description: 'ESI contributions for eligible wages, with ESI return prep.',
        status: 'live' },
      { key: 'in-pt', label: 'Professional Tax', authority: 'State governments',
        description: 'Per-state PT slab handling (MH, KA, TN, GJ, WB, etc.).',
        status: 'live' },
      { key: 'in-lwf', label: 'Labour Welfare Fund', authority: 'State LWF boards',
        description: 'Per-state half-yearly LWF deductions.',
        status: 'live' },
      { key: 'in-form-24q', label: 'Form 24Q quarterly TDS return', authority: 'CBDT',
        description: 'FVU file generation for quarterly e-TDS filing.',
        status: 'live' },
    ],
  },
  {
    country: 'AU',
    countryName: 'Australia',
    defaultCurrency: 'AUD',
    marketingUrl: 'https://hellotime.app/au',
    features: [
      { key: 'shift-presets', label: '2-shift / 3-shift presets',
        description: 'Pre-baked shift policies suited to Australian retail and hospitality.' },
      { key: 'awards-pay', label: 'Award-rate pay',
        description: 'Hourly pay rules with weekend, public-holiday and overtime loading.' },
      { key: 'gps-clock-in', label: 'GPS clock-in for field crews',
        description: 'Per-site geofence and GPS validation for construction and field service.' },
    ],
    payrollEngines: [
      { key: 'au-stp2', label: 'Single Touch Payroll Phase 2', authority: 'ATO',
        description: 'STP2 reporting via the HelloBooks AU payroll engine — disaggregated income types.',
        status: 'beta' },
      { key: 'au-super', label: 'SuperStream contributions', authority: 'ATO',
        description: 'Superannuation guarantee contributions to a clearing house.',
        status: 'beta' },
      { key: 'au-payg', label: 'PAYG withholding', authority: 'ATO',
        description: 'PAYG instalment computation on wages.',
        status: 'beta' },
    ],
  },
  {
    country: 'GB',
    countryName: 'United Kingdom',
    defaultCurrency: 'GBP',
    marketingUrl: 'https://hellotime.app/uk',
    features: [
      { key: 'gdpr-compliant', label: 'GDPR-compliant data handling',
        description: 'Data subject access requests and erasure flows aligned with UK GDPR.' },
      { key: 'pence-pricing', label: 'GBP pence-precise pricing',
        description: 'Time-rate billing in pence with HMRC-friendly rounding.' },
    ],
    payrollEngines: [
      { key: 'gb-rti', label: 'RTI PAYE', authority: 'HMRC',
        description: 'Real Time Information PAYE submissions via the HelloBooks UK engine.',
        status: 'coming-soon' },
      { key: 'gb-auto-enrol', label: 'Workplace pension auto-enrolment', authority: 'TPR',
        description: 'Auto-enrolment computation for workplace pensions.',
        status: 'coming-soon' },
    ],
  },
  {
    country: 'US',
    countryName: 'United States',
    defaultCurrency: 'USD',
    marketingUrl: 'https://hellotime.app/us',
    features: [
      { key: 'overtime-flsa', label: 'FLSA overtime',
        description: 'Federal overtime rules over 40 hours / week with state overrides.' },
      { key: 'multi-state-pay', label: 'Multi-state payroll',
        description: 'Per-state withholding for distributed teams.' },
    ],
    payrollEngines: [
      { key: 'us-w2', label: 'W-2 employee payroll', authority: 'IRS',
        description: 'Federal + state withholding; quarterly 941 and annual W-2 prep.',
        status: 'coming-soon' },
      { key: 'us-1099', label: '1099-NEC contractor payouts', authority: 'IRS',
        description: 'Contractor 1099-NEC generation via HelloBooks integration.',
        status: 'coming-soon' },
    ],
  },
  {
    country: 'CA',
    countryName: 'Canada',
    defaultCurrency: 'CAD',
    marketingUrl: 'https://hellotime.app/ca',
    features: [
      { key: 'province-rules', label: 'Province-specific labour rules',
        description: 'Daily and weekly OT thresholds vary by province; HelloTime bakes them in.' },
    ],
    payrollEngines: [
      { key: 'ca-cra', label: 'CRA payroll', authority: 'Canada Revenue Agency',
        description: 'Federal + provincial withholding via HelloBooks CA engine.',
        status: 'coming-soon' },
    ],
  },
  {
    country: 'AE',
    countryName: 'United Arab Emirates',
    defaultCurrency: 'AED',
    marketingUrl: 'https://hellotime.app/ae',
    features: [
      { key: 'wps-payouts', label: 'WPS-aligned payouts',
        description: 'Salary file generation aligned with UAE Wage Protection System.' },
      { key: 'arabic-payslips', label: 'Arabic payslip support',
        description: 'Bilingual English / Arabic payslip templates.' },
    ],
    payrollEngines: [
      { key: 'ae-wps', label: 'Wage Protection System', authority: 'MOHRE',
        description: 'WPS-aligned salary file (SIF) generation.',
        status: 'coming-soon' },
      { key: 'ae-gratuity', label: 'End-of-service gratuity', authority: 'MOHRE',
        description: 'Gratuity accrual under Federal Decree-Law 33 of 2021.',
        status: 'coming-soon' },
    ],
  },
  {
    country: 'SG',
    countryName: 'Singapore',
    defaultCurrency: 'SGD',
    marketingUrl: 'https://hellotime.app/sg',
    features: [
      { key: 'cpf-tracking', label: 'CPF contribution tracking',
        description: 'Track CPF contributions per employee for IRAS reporting.' },
    ],
    payrollEngines: [
      { key: 'sg-cpf', label: 'CPF contributions', authority: 'CPF Board',
        description: 'CPF computation and submission file prep.',
        status: 'coming-soon' },
      { key: 'sg-ir8a', label: 'IR8A annual return', authority: 'IRAS',
        description: 'IR8A and Appendix 8A annual reporting.',
        status: 'coming-soon' },
    ],
  },
  {
    country: 'NZ',
    countryName: 'New Zealand',
    defaultCurrency: 'NZD',
    marketingUrl: 'https://hellotime.app/nz',
    features: [
      { key: 'kiwisaver', label: 'KiwiSaver tracking',
        description: 'Track KiwiSaver employee and employer contributions.' },
    ],
    payrollEngines: [
      { key: 'nz-paye', label: 'PAYE', authority: 'Inland Revenue',
        description: 'PAYE withholding and EI returns.',
        status: 'coming-soon' },
      { key: 'nz-kiwisaver', label: 'KiwiSaver contributions', authority: 'Inland Revenue',
        description: 'Auto-deduction and employer contribution computation.',
        status: 'coming-soon' },
    ],
  },
];
