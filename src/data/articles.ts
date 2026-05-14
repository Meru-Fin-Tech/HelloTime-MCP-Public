/**
 * Article catalog — published long-form content on hellotime.ai.
 *
 * Sources (verified live as of 2026-05-14):
 *   - /blog/<slug> — blog feed (RSS at https://hellotime.ai/rss.xml)
 *   - /guides/<slug> — evergreen long-form guides
 *   - /customers/<slug> — customer case studies
 *
 * Public-only: each entry is a slug + the same title/excerpt the marketing site
 * shows publicly. No customer-data refs, no per-account fields, no env-driven
 * config. Drafts in marketing/hellotime/blog-posts/ are explicitly excluded
 * until they land on the live site.
 *
 * publishedAt is the date the post was first published on hellotime.ai. For
 * guides and case studies where a single first-published date isn't surfaced,
 * we use the earliest date we have on file. The MCP catalog does not need to
 * tick on every backdate revision — the date is here for sorting + recency
 * filters, not legal provenance.
 */

export type CountryRelevance = 'IN' | 'AU' | 'US' | 'CA' | 'GB' | 'AE' | 'SG' | 'NZ' | 'global';

export interface Article {
  id: string;            // slug — stable, used as primary key
  title: string;
  excerpt: string;       // ~200 chars
  tags: string[];        // lowercase, hyphen-free where possible
  countryRelevance?: CountryRelevance;
  url: string;
  publishedAt: string;   // YYYY-MM-DD
  kind: 'blog' | 'guide' | 'case-study';
}

export const ARTICLES: Article[] = [
  // ---------------------------------------------------------------------------
  // Guides — evergreen long-form, /guides/<slug>
  // ---------------------------------------------------------------------------
  {
    id: 'time-tracking-software',
    title: 'Time tracking software: a buyer guide for 2026',
    excerpt:
      'Compares the main time-tracking categories — timer apps, kiosk-based attendance, GPS field tracking, productivity suites — and how to pick the right one for your team size and workflow.',
    tags: ['time tracking', 'buyer guide', 'comparison'],
    countryRelevance: 'global',
    url: 'https://hellotime.ai/guides/time-tracking-software',
    publishedAt: '2026-02-10',
    kind: 'guide',
  },
  {
    id: 'online-timesheets',
    title: 'Online timesheets: a practical guide for managers',
    excerpt:
      'How to set up online timesheets, choose between weekly and biweekly periods, run approval workflows, and export hours to payroll without manual rekeying.',
    tags: ['timesheets', 'managers', 'approvals'],
    countryRelevance: 'global',
    url: 'https://hellotime.ai/guides/online-timesheets',
    publishedAt: '2026-02-10',
    kind: 'guide',
  },
  {
    id: 'agency-utilization',
    title: 'Agency utilization: tracking billable hours and capacity',
    excerpt:
      'A playbook for agencies on measuring utilization, defending billable rates, and using utilization dashboards to spot overrun and bench-time risks before they hit margin.',
    tags: ['agency', 'utilization', 'billable hours', 'profitability'],
    countryRelevance: 'global',
    url: 'https://hellotime.ai/guides/agency-utilization',
    publishedAt: '2026-02-10',
    kind: 'guide',
  },
  {
    id: 'field-workforce',
    title: 'Field workforce: time and attendance for distributed teams',
    excerpt:
      'GPS clock-in, geofenced sites, mileage tracking, and biometric kiosks for businesses with workers across multiple sites or on the road.',
    tags: ['field workforce', 'gps', 'geofence', 'kiosk', 'attendance'],
    countryRelevance: 'global',
    url: 'https://hellotime.ai/guides/field-workforce',
    publishedAt: '2026-02-10',
    kind: 'guide',
  },
  {
    id: 'remote-productivity',
    title: 'Remote productivity: tracking work without micromanaging',
    excerpt:
      'How activity levels, optional screenshots and app/URL categorization can give managers visibility without becoming surveillance. Includes when NOT to turn these features on.',
    tags: ['remote work', 'productivity', 'screenshots', 'activity levels'],
    countryRelevance: 'global',
    url: 'https://hellotime.ai/guides/remote-productivity',
    publishedAt: '2026-02-10',
    kind: 'guide',
  },
  {
    id: 'hubstaff-alternatives',
    title: 'Hubstaff alternatives: feature + price comparison',
    excerpt:
      'A category map of Hubstaff alternatives — what each tool ships, where it fits, and how HelloTime compares on price, payroll, and field-workforce features.',
    tags: ['hubstaff', 'alternatives', 'comparison', 'pricing'],
    countryRelevance: 'global',
    url: 'https://hellotime.ai/guides/hubstaff-alternatives',
    publishedAt: '2026-02-10',
    kind: 'guide',
  },

  // ---------------------------------------------------------------------------
  // Case studies — /customers/<slug>
  // ---------------------------------------------------------------------------
  {
    id: 'garment-factory-pune',
    title: 'Garment factory in Pune cuts payroll cycle from 6 days to 4 hours',
    excerpt:
      'A Pune-based garment manufacturer with 280 workers across two shifts moved from paper muster to HelloTime kiosk + payroll, and shipped Form 24Q out of the same system.',
    tags: ['manufacturing', 'kiosk', 'payroll', 'form 24q', 'india'],
    countryRelevance: 'IN',
    url: 'https://hellotime.ai/customers/garment-factory-pune',
    publishedAt: '2026-03-15',
    kind: 'case-study',
  },
  {
    id: 'retail-chain-bengaluru',
    title: 'Retail chain in Bengaluru: 14 stores, one roster',
    excerpt:
      'A 14-store retail chain rolled out HelloTime rosters + WhatsApp shift publishing across all locations. Manager hours spent on schedules dropped from 12/week to 2.',
    tags: ['retail', 'rosters', 'multi-site', 'whatsapp', 'india'],
    countryRelevance: 'IN',
    url: 'https://hellotime.ai/customers/retail-chain-bengaluru',
    publishedAt: '2026-03-15',
    kind: 'case-study',
  },
  {
    id: 'security-agency-chennai',
    title: 'Security agency in Chennai: geofenced clock-in across 40 sites',
    excerpt:
      'A Chennai security agency uses geofenced clock-in + mock-location detection to verify guard attendance across 40 client sites, with PF/ESI auto-computed monthly.',
    tags: ['security', 'geofence', 'pf esi', 'attendance', 'india'],
    countryRelevance: 'IN',
    url: 'https://hellotime.ai/customers/security-agency-chennai',
    publishedAt: '2026-03-15',
    kind: 'case-study',
  },

  // ---------------------------------------------------------------------------
  // Blog — /blog/<slug> (RSS-verified, 50 most-recent items)
  // ---------------------------------------------------------------------------
  {
    id: 'accounting-software-alternatives-for-accounting-firms',
    title: 'Accounting software alternatives for accounting firms',
    excerpt:
      'How accounting firms managing dozens of clients can move off legacy desktop accounting and onto cloud platforms that bundle payroll, time-tracking and document workflows.',
    tags: ['accounting firms', 'cloud accounting', 'comparison'],
    countryRelevance: 'global',
    url: 'https://hellotime.ai/blog/accounting-software-alternatives-for-accounting-firms',
    publishedAt: '2026-05-14',
    kind: 'blog',
  },
  {
    id: 'real-time-financial-reporting-in-accounting-systems',
    title: 'Real-time financial reporting in accounting systems',
    excerpt:
      'Why real-time financial reports beat month-end PDFs for cash-flow decisions, and what to look for in an accounting system that promises live dashboards.',
    tags: ['financial reporting', 'real-time', 'dashboards'],
    countryRelevance: 'global',
    url: 'https://hellotime.ai/blog/real-time-financial-reporting-in-accounting-systems',
    publishedAt: '2026-05-13',
    kind: 'blog',
  },
  {
    id: 'recording-bank-deposits-from-undeposited-funds-in-an-online-accounting-system',
    title: 'Recording bank deposits from undeposited funds in an online accounting system',
    excerpt:
      'Step-by-step on how to clear undeposited funds, batch deposit slips, and reconcile against the bank feed without leaving stuck balances.',
    tags: ['bank deposits', 'undeposited funds', 'reconciliation'],
    countryRelevance: 'global',
    url: 'https://hellotime.ai/blog/recording-bank-deposits-from-undeposited-funds-in-an-online-accounting-system',
    publishedAt: '2026-05-12',
    kind: 'blog',
  },
  {
    id: 'how-ai-is-transforming-accounts-receivable-and-payable-for-accounting-firms',
    title: 'How AI is transforming accounts receivable and payable for accounting firms',
    excerpt:
      'AR and AP automation patterns that accounting firms are deploying — invoice OCR, payment matching, dunning sequences and exception queues.',
    tags: ['ai', 'accounts receivable', 'accounts payable', 'accounting firms'],
    countryRelevance: 'global',
    url: 'https://hellotime.ai/blog/how-ai-is-transforming-accounts-receivable-and-payable-for-accounting-firms',
    publishedAt: '2026-05-11',
    kind: 'blog',
  },
  {
    id: 'payroll-tool-rebranded-as-workforce-platform',
    title: 'Payroll tool rebranded as workforce platform',
    excerpt:
      'Why the payroll category is consolidating with time-tracking, attendance and HRMS into a single "workforce platform" — and what that means for buyers.',
    tags: ['payroll', 'workforce', 'category', 'positioning'],
    countryRelevance: 'global',
    url: 'https://hellotime.ai/blog/payroll-tool-rebranded-as-workforce-platform',
    publishedAt: '2026-05-10',
    kind: 'blog',
  },
  {
    id: 'automated-accounting-schedules-and-reconciliation',
    title: 'Automated accounting schedules and reconciliation',
    excerpt:
      'How scheduled bank-feed sync, auto-categorization and reconciliation rules can cut the month-end close from 5 days to one.',
    tags: ['automation', 'reconciliation', 'month-end close'],
    countryRelevance: 'global',
    url: 'https://hellotime.ai/blog/automated-accounting-schedules-and-reconciliation',
    publishedAt: '2026-05-09',
    kind: 'blog',
  },
  {
    id: 'customizing-sales-forms-in-an-online-accounting-system',
    title: 'Customizing sales forms in an online accounting system',
    excerpt:
      'How to customise invoices, quotes and sales receipts — logos, payment terms, GST notes — without hiring a developer.',
    tags: ['sales forms', 'invoicing', 'templates'],
    countryRelevance: 'global',
    url: 'https://hellotime.ai/blog/customizing-sales-forms-in-an-online-accounting-system',
    publishedAt: '2026-05-08',
    kind: 'blog',
  },
  {
    id: 'payroll-solutions-for-event-management-companies-in-india',
    title: 'Payroll solutions for event management companies in India',
    excerpt:
      'Event companies juggling contract crews, daily wages and short-term gigs need payroll that flexes. How to set up PF / ESI / TDS for project-based teams.',
    tags: ['payroll', 'event management', 'india', 'pf esi'],
    countryRelevance: 'IN',
    url: 'https://hellotime.ai/blog/payroll-solutions-for-event-management-companies-in-india',
    publishedAt: '2026-05-07',
    kind: 'blog',
  },
  {
    id: 'ai-driven-workflow-optimization-for-accounting-firms',
    title: 'AI-driven workflow optimization for accounting firms',
    excerpt:
      'Concrete AI workflows accounting firms can pilot today: bank-feed categorization, document extraction, anomaly detection on the GL.',
    tags: ['ai', 'workflow', 'accounting firms', 'automation'],
    countryRelevance: 'global',
    url: 'https://hellotime.ai/blog/ai-driven-workflow-optimization-for-accounting-firms',
    publishedAt: '2026-05-06',
    kind: 'blog',
  },
  {
    id: 'adding-buy-now-pay-later-as-a-payment-option-in-an-accounting-system',
    title: 'Adding buy now, pay later as a payment option in an accounting system',
    excerpt:
      'Why offering BNPL on invoices can lift conversion 18-30%, and how to wire it into a cloud accounting system without breaking reconciliation.',
    tags: ['bnpl', 'invoicing', 'payments'],
    countryRelevance: 'global',
    url: 'https://hellotime.ai/blog/adding-buy-now-pay-later-as-a-payment-option-in-an-accounting-system',
    publishedAt: '2026-05-05',
    kind: 'blog',
  },
  {
    id: 'tax-authority-relief-for-employee-retention-credit-claimants',
    title: 'Tax authority relief for employee retention credit claimants',
    excerpt:
      'A summary of IRS guidance for businesses that filed Employee Retention Credit claims under the now-paused program, and how to respond to follow-up notices.',
    tags: ['erc', 'irs', 'us payroll', 'tax credits'],
    countryRelevance: 'US',
    url: 'https://hellotime.ai/blog/tax-authority-relief-for-employee-retention-credit-claimants',
    publishedAt: '2026-05-04',
    kind: 'blog',
  },
  {
    id: 'payroll-system-red-flags-for-small-businesses',
    title: 'Payroll system red flags for small businesses',
    excerpt:
      'Six concrete signals your payroll system is about to fail an audit, miss a statutory deadline, or quietly underpay a worker — and what to swap in.',
    tags: ['payroll', 'red flags', 'small business', 'compliance'],
    countryRelevance: 'global',
    url: 'https://hellotime.ai/blog/payroll-system-red-flags-for-small-businesses',
    publishedAt: '2026-05-03',
    kind: 'blog',
  },
  {
    id: 'adding-vendors-to-an-online-accounting-system',
    title: 'Adding vendors to an online accounting system',
    excerpt:
      'How to onboard vendors at scale — bank details, PAN, GSTIN, TDS rates — without the data-entry tax that comes with each new bill.',
    tags: ['vendors', 'onboarding', 'accounts payable'],
    countryRelevance: 'global',
    url: 'https://hellotime.ai/blog/adding-vendors-to-an-online-accounting-system',
    publishedAt: '2026-05-02',
    kind: 'blog',
  },
  {
    id: 'automating-manual-accounting-tasks-with-ai',
    title: 'Automating manual accounting tasks with AI',
    excerpt:
      'The repetitive accounting tasks that AI does well today (categorization, reconciliation, document extraction) — and the ones it still gets wrong.',
    tags: ['ai', 'automation', 'accounting'],
    countryRelevance: 'global',
    url: 'https://hellotime.ai/blog/automating-manual-accounting-tasks-with-ai',
    publishedAt: '2026-05-01',
    kind: 'blog',
  },
  {
    id: 'introduction-to-ai-in-accounting-and-how-to-evaluate-solutions',
    title: 'Introduction to AI in accounting and how to evaluate solutions',
    excerpt:
      'A buyer-side framework for evaluating "AI accounting" pitches — what counts as real AI, what is rebadged automation, and what to ask vendors.',
    tags: ['ai', 'accounting', 'buyer guide', 'evaluation'],
    countryRelevance: 'global',
    url: 'https://hellotime.ai/blog/introduction-to-ai-in-accounting-and-how-to-evaluate-solutions',
    publishedAt: '2026-04-30',
    kind: 'blog',
  },
  {
    id: 'payroll-solutions-for-electronics-and-mobile-retail-stores',
    title: 'Payroll solutions for electronics and mobile retail stores',
    excerpt:
      'Multi-store electronics retailers have variable shift patterns, commission structures, and high turnover. Payroll patterns that handle all three.',
    tags: ['payroll', 'retail', 'electronics', 'commissions', 'india'],
    countryRelevance: 'IN',
    url: 'https://hellotime.ai/blog/payroll-solutions-for-electronics-and-mobile-retail-stores',
    publishedAt: '2026-04-29',
    kind: 'blog',
  },
  {
    id: 'payroll-solutions-for-dental-clinics-in-india',
    title: 'Payroll solutions for dental clinics in India',
    excerpt:
      'Dental clinics with mixed-role teams (dentists, hygienists, front-desk, assistants) need flexible pay grades. A payroll setup that fits.',
    tags: ['payroll', 'dental', 'healthcare', 'india'],
    countryRelevance: 'IN',
    url: 'https://hellotime.ai/blog/payroll-solutions-for-dental-clinics-in-india',
    publishedAt: '2026-04-28',
    kind: 'blog',
  },
  {
    id: 'batch-invoice-payments-with-integrated-payment-processing',
    title: 'Batch invoice payments with integrated payment processing',
    excerpt:
      'How batch-payment workflows let you collect from 50+ customers in a single sweep — Stripe, Razorpay, UPI mandate flows.',
    tags: ['payments', 'batch invoicing', 'stripe', 'razorpay'],
    countryRelevance: 'global',
    url: 'https://hellotime.ai/blog/batch-invoice-payments-with-integrated-payment-processing',
    publishedAt: '2026-04-27',
    kind: 'blog',
  },
  {
    id: 'setting-up-sales-settings-in-an-online-accounting-system',
    title: 'Setting up sales settings in an online accounting system',
    excerpt:
      'The sales-side settings that matter most: default payment terms, late-fee policy, GST place-of-supply defaults, and invoice numbering.',
    tags: ['sales', 'settings', 'invoicing', 'configuration'],
    countryRelevance: 'global',
    url: 'https://hellotime.ai/blog/setting-up-sales-settings-in-an-online-accounting-system',
    publishedAt: '2026-04-26',
    kind: 'blog',
  },
  {
    id: 'payroll-solutions-for-manufacturing-and-factory-operations',
    title: 'Payroll solutions for manufacturing and factory operations',
    excerpt:
      'Factory payroll has to handle shift premiums, overtime, contract workers and statutory deductions in one cycle. Operating patterns that scale.',
    tags: ['payroll', 'manufacturing', 'shift premium', 'overtime'],
    countryRelevance: 'IN',
    url: 'https://hellotime.ai/blog/payroll-solutions-for-manufacturing-and-factory-operations',
    publishedAt: '2026-04-25',
    kind: 'blog',
  },
  {
    id: 'payroll-solutions-for-logistics-and-delivery-businesses-in-india',
    title: 'Payroll solutions for logistics and delivery businesses in India',
    excerpt:
      'Driver attendance, mileage-based incentive pay, contract vs employee classification — a payroll pattern for logistics SMEs.',
    tags: ['payroll', 'logistics', 'delivery', 'mileage', 'india'],
    countryRelevance: 'IN',
    url: 'https://hellotime.ai/blog/payroll-solutions-for-logistics-and-delivery-businesses-in-india',
    publishedAt: '2026-04-24',
    kind: 'blog',
  },
  {
    id: 'payroll-solutions-for-pharmacies-and-medical-stores',
    title: 'Payroll solutions for pharmacies and medical stores',
    excerpt:
      'Multi-shift pharmacies with pharmacist-on-duty requirements need attendance + payroll that proves coverage at audit time.',
    tags: ['payroll', 'pharmacy', 'retail healthcare', 'india'],
    countryRelevance: 'IN',
    url: 'https://hellotime.ai/blog/payroll-solutions-for-pharmacies-and-medical-stores',
    publishedAt: '2026-04-23',
    kind: 'blog',
  },
  {
    id: 'payroll-solutions-for-diagnostic-laboratories',
    title: 'Payroll solutions for diagnostic laboratories',
    excerpt:
      'Lab payroll cycles map onto sample throughput and shift coverage. How to wire attendance into payroll for clinical diagnostics teams.',
    tags: ['payroll', 'diagnostics', 'healthcare', 'india'],
    countryRelevance: 'IN',
    url: 'https://hellotime.ai/blog/payroll-solutions-for-diagnostic-laboratories',
    publishedAt: '2026-04-22',
    kind: 'blog',
  },
  {
    id: 'payroll-solutions-for-supermarkets-in-india',
    title: 'Payroll solutions for supermarkets in India',
    excerpt:
      'Supermarkets carrying 60-200 staff per store across cash, floor and back-office roles. A payroll pattern that respects ESIC thresholds.',
    tags: ['payroll', 'supermarket', 'retail', 'esi', 'india'],
    countryRelevance: 'IN',
    url: 'https://hellotime.ai/blog/payroll-solutions-for-supermarkets-in-india',
    publishedAt: '2026-04-21',
    kind: 'blog',
  },
  {
    id: 'payroll-as-a-workforce-management-platform',
    title: 'Payroll as a workforce management platform',
    excerpt:
      'The case for treating payroll not as a back-office function but as the spine of an integrated workforce platform — attendance, leave, payroll, compliance.',
    tags: ['payroll', 'workforce management', 'platform'],
    countryRelevance: 'global',
    url: 'https://hellotime.ai/blog/payroll-as-a-workforce-management-platform',
    publishedAt: '2026-04-20',
    kind: 'blog',
  },
  {
    id: 'adding-and-managing-users-in-an-online-accounting-system',
    title: 'Adding and managing users in an online accounting system',
    excerpt:
      'Role-based access control patterns for accounting systems — owner, accountant, auditor, sales — and how to revoke access without breaking history.',
    tags: ['user management', 'rbac', 'permissions'],
    countryRelevance: 'global',
    url: 'https://hellotime.ai/blog/adding-and-managing-users-in-an-online-accounting-system',
    publishedAt: '2026-04-19',
    kind: 'blog',
  },
  {
    id: 'customer-deposit-handling-in-accounting-software',
    title: 'Customer deposit handling in accounting software',
    excerpt:
      'How to record advance receipts and customer deposits cleanly — under both India GST advance-receipt rules and US deferred-revenue accounting.',
    tags: ['customer deposits', 'advance receipts', 'deferred revenue'],
    countryRelevance: 'global',
    url: 'https://hellotime.ai/blog/customer-deposit-handling-in-accounting-software',
    publishedAt: '2026-04-18',
    kind: 'blog',
  },
  {
    id: 'lease-accounting-software-for-asc-842-and-ifrs-16-compliance',
    title: 'Lease accounting software for ASC 842 and IFRS 16 compliance',
    excerpt:
      'What ASC 842 and IFRS 16 require for lease accounting, and how to pick software that handles right-of-use assets and lease liabilities at audit grade.',
    tags: ['asc 842', 'ifrs 16', 'lease accounting', 'compliance'],
    countryRelevance: 'global',
    url: 'https://hellotime.ai/blog/lease-accounting-software-for-asc-842-and-ifrs-16-compliance',
    publishedAt: '2026-04-17',
    kind: 'blog',
  },
  {
    id: 'how-to-receive-payments-using-an-accounting-system-s-payment-feature',
    title: "How to receive payments using an accounting system's payment feature",
    excerpt:
      'A walk-through of payment-link, bank-transfer and recurring-mandate flows inside cloud accounting — and the reconciliation footprint each leaves.',
    tags: ['payments', 'reconciliation', 'invoicing'],
    countryRelevance: 'global',
    url: 'https://hellotime.ai/blog/how-to-receive-payments-using-an-accounting-system-s-payment-feature',
    publishedAt: '2026-04-16',
    kind: 'blog',
  },
  {
    id: 'payroll-software-selection-for-hospitals-in-india',
    title: 'Payroll software selection for hospitals in India',
    excerpt:
      'Hospital payroll spans nursing rosters, on-call doctors, contract paramedics and FT admin staff. A buyer framework for 50-500 bed facilities.',
    tags: ['payroll', 'hospitals', 'healthcare', 'india'],
    countryRelevance: 'IN',
    url: 'https://hellotime.ai/blog/payroll-software-selection-for-hospitals-in-india',
    publishedAt: '2026-04-15',
    kind: 'blog',
  },
  {
    id: 'financial-close-management-tools-for-internal-finance-teams',
    title: 'Financial close management tools for internal finance teams',
    excerpt:
      'A walkthrough of close-management features — task lists, sign-offs, reconciliation queues — and how they cut a 7-day close to 3.',
    tags: ['financial close', 'finance teams', 'month-end'],
    countryRelevance: 'global',
    url: 'https://hellotime.ai/blog/financial-close-management-tools-for-internal-finance-teams',
    publishedAt: '2026-04-14',
    kind: 'blog',
  },
  {
    id: 'payroll-solutions-for-construction-firms-in-india',
    title: 'Payroll solutions for construction firms in India',
    excerpt:
      'Construction payroll: BOCW cess, contract labour, site-wise muster, daily-wage workers, and project-cost allocation in a single cycle.',
    tags: ['payroll', 'construction', 'bocw', 'india'],
    countryRelevance: 'IN',
    url: 'https://hellotime.ai/blog/payroll-solutions-for-construction-firms-in-india',
    publishedAt: '2026-04-13',
    kind: 'blog',
  },
  {
    id: 'ai-powered-firm-management-features-for-accounting-practices',
    title: 'AI-powered firm management features for accounting practices',
    excerpt:
      'Practice-management AI: client onboarding, task triage, deadline anticipation, anomaly detection on the client portfolio.',
    tags: ['ai', 'firm management', 'accounting practices'],
    countryRelevance: 'global',
    url: 'https://hellotime.ai/blog/ai-powered-firm-management-features-for-accounting-practices',
    publishedAt: '2026-04-12',
    kind: 'blog',
  },
  {
    id: 'sox-compliance-in-accounting-and-finance',
    title: 'SOX compliance in accounting and finance',
    excerpt:
      'What SOX really requires from finance teams in 2026 — internal controls, segregation of duties, audit trail — and the software footprint to back it up.',
    tags: ['sox', 'compliance', 'internal controls', 'audit'],
    countryRelevance: 'US',
    url: 'https://hellotime.ai/blog/sox-compliance-in-accounting-and-finance',
    publishedAt: '2026-04-11',
    kind: 'blog',
  },
  {
    id: 'the-smarter-way-to-plan-your-teams-time-why-hellotime-changes-everything',
    title: "The smarter way to plan your team's time: why HelloTime changes everything",
    excerpt:
      'Why we built HelloTime as an integrated time + attendance + payroll + mileage platform instead of yet another standalone timer app.',
    tags: ['hellotime', 'positioning', 'product'],
    countryRelevance: 'global',
    url: 'https://hellotime.ai/blog/the-smarter-way-to-plan-your-teams-time-why-hellotime-changes-everything',
    publishedAt: '2026-04-10',
    kind: 'blog',
  },
  {
    id: 'payroll-solutions-for-gyms-and-fitness-centres-in-india',
    title: 'Payroll solutions for gyms and fitness centres in India',
    excerpt:
      'Fitness centres with shift-based trainers and commission-on-sales front-desk staff. A payroll pattern for India gyms 5-200 staff.',
    tags: ['payroll', 'fitness', 'gym', 'commissions', 'india'],
    countryRelevance: 'IN',
    url: 'https://hellotime.ai/blog/payroll-solutions-for-gyms-and-fitness-centres-in-india',
    publishedAt: '2026-04-09',
    kind: 'blog',
  },
  {
    id: 'payroll-solutions-for-textile-and-garment-shops-in-india',
    title: 'Payroll solutions for textile and garment shops in India',
    excerpt:
      'Piece-rate vs salaried payroll for textile and garment SMEs, with worked examples for piece-rate compute and statutory deduction handling.',
    tags: ['payroll', 'textile', 'garment', 'piece rate', 'india'],
    countryRelevance: 'IN',
    url: 'https://hellotime.ai/blog/payroll-solutions-for-textile-and-garment-shops-in-india',
    publishedAt: '2026-04-08',
    kind: 'blog',
  },
  {
    id: 'payroll-solutions-for-salons-and-spas',
    title: 'Payroll solutions for salons and spas',
    excerpt:
      'Tip handling, commission on service, product-sale incentives — payroll structures for salons and spas that keep stylists in tier compliance.',
    tags: ['payroll', 'salon', 'spa', 'tips', 'commissions'],
    countryRelevance: 'global',
    url: 'https://hellotime.ai/blog/payroll-solutions-for-salons-and-spas',
    publishedAt: '2026-04-07',
    kind: 'blog',
  },
  {
    id: 'payroll-management-solutions-for-indian-smes',
    title: 'Payroll management solutions for Indian SMEs',
    excerpt:
      'A category map of payroll software for Indian SMEs 5-500 employees, and the statutory triggers (PF, ESI, PT, LWF, TDS) that change the tool you need.',
    tags: ['payroll', 'sme', 'india', 'compliance', 'buyer guide'],
    countryRelevance: 'IN',
    url: 'https://hellotime.ai/blog/payroll-management-solutions-for-indian-smes',
    publishedAt: '2026-04-06',
    kind: 'blog',
  },
];
