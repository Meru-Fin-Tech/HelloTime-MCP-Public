/**
 * Feature catalog — public marketing-derived list of HelloTime product
 * capabilities. Sourced from Hellotime-website/app/features/page.tsx,
 * components/PricingTable.tsx and components/PricingMatrix.tsx.
 *
 * No customer data, no per-account toggles — this is the public matrix of
 * "what HelloTime ships". Used by `list_features` and `feature_search` tools.
 *
 * Tier model mirrors the canonical 5-tier ladder (Free / Attend / Track /
 * Pro / Business). Where the matrix marks "soon" for a tier, the feature is
 * NOT yet included in availableInPlans for that tier.
 */

import type { PlanType } from './plans.js';

export type FeatureCategory =
  | 'shifts'
  | 'rosters'
  | 'leave'
  | 'timesheets'
  | 'time-tracking'
  | 'productivity'
  | 'gps-geofence'
  | 'biometric-kiosk'
  | 'payroll'
  | 'invoicing'
  | 'analytics'
  | 'projects'
  | 'reports'
  | 'integrations';

export interface Feature {
  id: string;
  category: FeatureCategory;
  label: string;
  description: string;
  availableInPlans: PlanType[];
}

export const FEATURES: Feature[] = [
  // Time tracking — Matrix "Time tracking" section: track/pro/business
  { id: 'one-click-timer', category: 'time-tracking',
    label: 'One-click timer (desktop, web, mobile)',
    description: 'Native apps on Windows, Mac, web, iOS, Android with one-click start/stop.',
    availableInPlans: ['track', 'pro', 'business'] },
  { id: 'offline-tracking', category: 'time-tracking',
    label: 'Offline tracking with auto-sync',
    description: 'Track time without connectivity; auto-syncs when the device reconnects.',
    availableInPlans: ['track', 'pro', 'business'] },
  { id: 'idle-detection', category: 'time-tracking',
    label: 'Idle detection',
    description: 'Prompts to discard or keep idle time when keyboard/mouse activity stops.',
    availableInPlans: ['track', 'pro', 'business'] },
  { id: 'manual-entry', category: 'time-tracking',
    label: 'Manual time entry',
    description: 'Back-date or forward-fill hours when life happens off-timer.',
    availableInPlans: ['track', 'pro', 'business'] },

  // Timesheets — Matrix: auto-timesheets track+, approval attend+, export attend+,
  // multi-level approval + period locking pro+
  { id: 'auto-timesheets', category: 'timesheets',
    label: 'Auto-generated timesheets',
    description: 'Daily, weekly and monthly views auto-built from tracked time.',
    availableInPlans: ['track', 'pro', 'business'] },
  { id: 'timesheet-approval', category: 'timesheets',
    label: 'Timesheet approval workflow',
    description: 'Single-level manager approval with audit trail; multi-level approval chain on Pro+.',
    availableInPlans: ['attend', 'track', 'pro', 'business'] },
  { id: 'timesheet-export', category: 'timesheets',
    label: 'Bulk CSV / PDF export',
    description: 'Export timesheets for clients, accountants or audits.',
    availableInPlans: ['attend', 'track', 'pro', 'business'] },

  // Shifts and rosters — Matrix "Schedules / shifts" attend+pro+business
  { id: 'shift-scheduling', category: 'shifts',
    label: 'Shift scheduling',
    description: '2-shift / 3-shift policy presets with grace, late-mark and half-day rules.',
    availableInPlans: ['attend', 'pro', 'business'] },
  { id: 'shift-swap', category: 'shifts',
    label: 'Shift swap requests',
    description: 'Workers can request swaps; managers approve from the roster view.',
    availableInPlans: ['attend', 'pro', 'business'] },
  { id: 'overtime-rules', category: 'shifts',
    label: 'Overtime rules',
    description: 'Per-role or per-shift OT calculation, exported to payroll.',
    availableInPlans: ['business'] },
  { id: 'roster-multi-site', category: 'rosters',
    label: 'Multi-site roster',
    description: 'Drag-drop weekly roster across multiple stores or sites.',
    availableInPlans: ['attend', 'pro', 'business'] },
  { id: 'roster-publish', category: 'rosters',
    label: 'Publish roster to staff',
    description: 'Staff receive published rosters via app, WhatsApp and SMS.',
    availableInPlans: ['attend', 'pro', 'business'] },

  // Leave — Matrix "Leave & shift management" universal; accrual and holiday
  // calendar more advanced. Free includes leave basics only.
  { id: 'leave-types', category: 'leave',
    label: 'Configurable leave types',
    description: 'Annual, sick, casual, comp-off, maternity, paternity, unpaid — all configurable.',
    availableInPlans: ['free', 'attend', 'track', 'pro', 'business'] },
  { id: 'leave-accrual', category: 'leave',
    label: 'Leave accrual policies',
    description: 'Pro-rata accrual, carry-forward limits and encashment rules.',
    availableInPlans: ['attend', 'pro', 'business'] },
  { id: 'holiday-calendar', category: 'leave',
    label: 'Public holiday calendars',
    description: 'Country and state-specific public holiday calendars (Pro+; coming soon for Attend / Track).',
    availableInPlans: ['pro', 'business'] },
  { id: 'leave-balance', category: 'leave',
    label: 'Live leave balances',
    description: 'Workers see leave balances and apply from the mobile app.',
    availableInPlans: ['free', 'attend', 'track', 'pro', 'business'] },

  // GPS / geofencing — Matrix "GPS geofence + multi-site" attend+pro+business
  { id: 'gps-clock-in', category: 'gps-geofence',
    label: 'GPS clock-in',
    description: 'Capture location coordinates at clock-in / clock-out.',
    availableInPlans: ['attend', 'pro', 'business'] },
  { id: 'geofence', category: 'gps-geofence',
    label: 'Geofenced sites',
    description: 'Auto clock-in / clock-out when workers enter or leave a job site.',
    availableInPlans: ['attend', 'pro', 'business'] },
  { id: 'mileage', category: 'gps-geofence',
    label: 'Mileage tracking',
    description: 'Auto-track distance for field workers via the mobile app.',
    availableInPlans: ['attend', 'pro', 'business'] },
  { id: 'mock-location-detection', category: 'gps-geofence',
    label: 'Mock-location detection',
    description: 'Detect spoofed GPS readings on Android devices.',
    availableInPlans: ['attend', 'pro', 'business'] },

  // Biometric kiosk — Matrix face-rec / kiosk / WhatsApp attend+pro+business
  { id: 'kiosk-mode', category: 'biometric-kiosk',
    label: 'Tablet kiosk mode',
    description: 'Run a single tablet at the gate as a shared clock-in station.',
    availableInPlans: ['attend', 'pro', 'business'] },
  { id: 'face-recognition', category: 'biometric-kiosk',
    label: 'Anti-spoof face recognition',
    description: 'On-device sub-second face match against enrolled site workers.',
    availableInPlans: ['attend', 'pro', 'business'] },
  { id: 'document-expiry', category: 'biometric-kiosk',
    label: 'Document expiry alerts',
    description: 'Track police verification, contract end, training certificate expiry.',
    availableInPlans: ['attend', 'pro', 'business'] },
  { id: 'whatsapp-onboarding', category: 'biometric-kiosk',
    label: 'WhatsApp / SMS worker onboarding',
    description: 'Onboard contract workers via a WhatsApp or SMS link without a payroll seat.',
    availableInPlans: ['attend', 'pro', 'business'] },

  // Productivity — Matrix activity / app+url / screenshots track+pro+business
  { id: 'activity-levels', category: 'productivity',
    label: 'Activity levels',
    description: 'Keyboard / mouse activity sampling while the timer runs.',
    availableInPlans: ['track', 'pro', 'business'] },
  { id: 'app-url-tracking', category: 'productivity',
    label: 'App and URL tracking',
    description: 'Categorize app and browser usage during tracked time.',
    availableInPlans: ['track', 'pro', 'business'] },
  { id: 'screenshots', category: 'productivity',
    label: 'Optional screenshots',
    description: 'Configurable screenshot frequency; opt-in and visible to the worker.',
    availableInPlans: ['track', 'pro', 'business'] },

  // Payroll — Matrix: all payroll rows business-only
  { id: 'multi-rate-pay', category: 'payroll',
    label: 'Hourly, salaried and contract pay',
    description: 'Multi-rate billable vs cost rate per role, project or member.',
    availableInPlans: ['business'] },
  { id: 'india-statutory', category: 'payroll',
    label: 'India statutory deductions',
    description: 'Auto-compute TDS, PF, ESI, PT, LWF and IT slabs.',
    availableInPlans: ['business'] },
  { id: 'form-24q-fvu', category: 'payroll',
    label: 'Form 24Q + FVU export',
    description: 'Quarterly TDS return preparation with FVU file generation.',
    availableInPlans: ['business'] },
  { id: 'payslips', category: 'payroll',
    label: 'Downloadable payslips',
    description: 'Per-employee per-cycle PDF payslips.',
    availableInPlans: ['business'] },
  { id: 'payouts', category: 'payroll',
    label: 'Multi-rail payouts',
    description: 'UPI, Razorpay, bank transfer, PayPal, Wise or Payoneer payouts.',
    availableInPlans: ['business'] },
  { id: 'compliance-calendar', category: 'payroll',
    label: 'Compliance calendar (PF / ESI / PT deadlines)',
    description: 'India statutory due-date reminders with filing checklists.',
    availableInPlans: ['business'] },

  // Invoicing — Matrix invoice-from-hours / Stripe / GST / budgets track+pro+business
  { id: 'invoice-from-hours', category: 'invoicing',
    label: 'Invoice from billable hours',
    description: 'Convert tracked hours into a line-item invoice in two clicks.',
    availableInPlans: ['track', 'pro', 'business'] },
  { id: 'gst-einvoice', category: 'invoicing',
    label: 'GST e-invoice (India)',
    description: 'Native GST e-invoice and e-way bill generation via HelloBooks + Fynamics GSP.',
    availableInPlans: ['track', 'pro', 'business'] },
  { id: 'invoice-payments', category: 'invoicing',
    label: 'Online invoice payments',
    description: 'Accept card, ACH and UPI on invoices via Stripe and Razorpay.',
    availableInPlans: ['track', 'pro', 'business'] },

  // Analytics — Matrix: reports/dashboards attend+; project profitability track+; custom reports pro+
  { id: 'project-profitability', category: 'analytics',
    label: 'Project profitability',
    description: 'Billable revenue minus cost-rate × hours, per project.',
    availableInPlans: ['track', 'pro', 'business'] },
  { id: 'utilization', category: 'analytics',
    label: 'Utilization dashboard',
    description: 'Billable hours as a share of capacity, by member or team.',
    availableInPlans: ['attend', 'track', 'pro', 'business'] },
  { id: 'client-profitability', category: 'analytics',
    label: 'Client profitability',
    description: 'Margin across all engagements per client.',
    availableInPlans: ['track', 'pro', 'business'] },

  // Projects — Matrix "Project + task selection" track+; "Project budgets + alerts" track+
  { id: 'project-budgets', category: 'projects',
    label: 'Hourly or fixed-fee budgets',
    description: 'Per-project budgets with overrun alerts at 75/90/100%.',
    availableInPlans: ['track', 'pro', 'business'] },
  { id: 'task-allocation', category: 'projects',
    label: 'Per-task allocation',
    description: 'Allocate budget hours per task inside a project.',
    availableInPlans: ['track', 'pro', 'business'] },

  // Reports — Matrix: pre-built attend+; custom pro+; scheduled = highest premium → business
  { id: 'pre-built-reports', category: 'reports',
    label: 'Pre-built reports',
    description: 'Hours, top clients, utilization, overruns — ready to run.',
    availableInPlans: ['attend', 'track', 'pro', 'business'] },
  { id: 'custom-reports', category: 'reports',
    label: 'Custom reports',
    description: 'Build, save and share custom report views.',
    availableInPlans: ['pro', 'business'] },
  { id: 'scheduled-reports', category: 'reports',
    label: 'Scheduled email reports',
    description: 'Recurring email delivery of any report.',
    availableInPlans: ['business'] },

  // Integrations — Matrix: HelloBooks attend+; QB/Xero/Jira/Slack/Zapier track+; REST API pro+
  { id: 'hellobooks-sync', category: 'integrations',
    label: 'HelloBooks two-way sync',
    description: 'Native client/project/employee/billable-hour sync with HelloBooks.',
    availableInPlans: ['attend', 'track', 'pro', 'business'] },
  { id: 'quickbooks-xero', category: 'integrations',
    label: 'QuickBooks Online + Xero',
    description: 'Two-way sync of clients, invoices and time-by-project.',
    availableInPlans: ['track', 'pro', 'business'] },
  { id: 'jira-slack-asana', category: 'integrations',
    label: 'Jira, Slack, Asana, ClickUp',
    description: 'One-click timer on every issue / task / card; daily DM digests.',
    availableInPlans: ['track', 'pro', 'business'] },
  { id: 'zapier-make', category: 'integrations',
    label: 'Zapier and Make',
    description: '5,000+ apps via no-code workflows.',
    availableInPlans: ['track', 'pro', 'business'] },
  { id: 'public-api', category: 'integrations',
    label: 'Public REST API + webhooks',
    description: 'Custom workflows and dashboards via HTTPS.',
    availableInPlans: ['pro', 'business'] },
  { id: 'mcp-server', category: 'integrations',
    label: 'MCP server for AI agents',
    description: 'Model Context Protocol server for AI-agent timesheet access.',
    availableInPlans: ['pro', 'business'] },

  // AI & automation — Matrix: AI manager assist + AI receipt OCR business-only
  { id: 'ai-manager-assist', category: 'reports',
    label: 'AI manager assist (voice + text)',
    description: 'Natural-language Q&A over team hours, attendance, payroll readiness.',
    availableInPlans: ['business'] },
  { id: 'ai-receipt-ocr', category: 'invoicing',
    label: 'AI receipt OCR',
    description: 'Extract expense line items from receipt photos for petty cash flow.',
    availableInPlans: ['business'] },
];
