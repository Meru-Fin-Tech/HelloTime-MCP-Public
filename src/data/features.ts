/**
 * Feature catalog — public marketing-derived list of HelloTime product
 * capabilities. Sourced from Hellotime-website/app/features/page.tsx and
 * components/PricingTable.tsx.
 *
 * No customer data, no per-account toggles — this is the public matrix of
 * "what HelloTime ships". Used by `list_features` and `feature_search` tools.
 */

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
  availableInPlans: ('pro' | 'business' | 'enterprise')[];
}

export const FEATURES: Feature[] = [
  // Time tracking
  { id: 'one-click-timer', category: 'time-tracking',
    label: 'One-click timer (desktop, web, mobile)',
    description: 'Native apps on Windows, Mac, web, iOS, Android with one-click start/stop.',
    availableInPlans: ['pro', 'business', 'enterprise'] },
  { id: 'offline-tracking', category: 'time-tracking',
    label: 'Offline tracking with auto-sync',
    description: 'Track time without connectivity; auto-syncs when the device reconnects.',
    availableInPlans: ['pro', 'business', 'enterprise'] },
  { id: 'idle-detection', category: 'time-tracking',
    label: 'Idle detection',
    description: 'Prompts to discard or keep idle time when keyboard/mouse activity stops.',
    availableInPlans: ['pro', 'business', 'enterprise'] },
  { id: 'manual-entry', category: 'time-tracking',
    label: 'Manual time entry',
    description: 'Back-date or forward-fill hours when life happens off-timer.',
    availableInPlans: ['pro', 'business', 'enterprise'] },

  // Timesheets
  { id: 'auto-timesheets', category: 'timesheets',
    label: 'Auto-generated timesheets',
    description: 'Daily, weekly and monthly views auto-built from tracked time.',
    availableInPlans: ['pro', 'business', 'enterprise'] },
  { id: 'timesheet-approval', category: 'timesheets',
    label: 'Timesheet approval workflow',
    description: 'One-click manager approval with audit trail.',
    availableInPlans: ['pro', 'business', 'enterprise'] },
  { id: 'timesheet-export', category: 'timesheets',
    label: 'Bulk CSV / PDF export',
    description: 'Export timesheets for clients, accountants or audits.',
    availableInPlans: ['pro', 'business', 'enterprise'] },

  // Shifts and rosters
  { id: 'shift-scheduling', category: 'shifts',
    label: 'Shift scheduling',
    description: '2-shift / 3-shift policy presets with grace, late-mark and half-day rules.',
    availableInPlans: ['business', 'enterprise'] },
  { id: 'shift-swap', category: 'shifts',
    label: 'Shift swap requests',
    description: 'Workers can request swaps; managers approve from the roster view.',
    availableInPlans: ['business', 'enterprise'] },
  { id: 'overtime-rules', category: 'shifts',
    label: 'Overtime rules',
    description: 'Per-role or per-shift OT calculation, exported to payroll.',
    availableInPlans: ['business', 'enterprise'] },
  { id: 'roster-multi-site', category: 'rosters',
    label: 'Multi-site roster',
    description: 'Drag-drop weekly roster across multiple stores or sites.',
    availableInPlans: ['business', 'enterprise'] },
  { id: 'roster-publish', category: 'rosters',
    label: 'Publish roster to staff',
    description: 'Staff receive published rosters via app, WhatsApp and SMS.',
    availableInPlans: ['business', 'enterprise'] },

  // Leave types
  { id: 'leave-types', category: 'leave',
    label: 'Configurable leave types',
    description: 'Annual, sick, casual, comp-off, maternity, paternity, unpaid — all configurable.',
    availableInPlans: ['business', 'enterprise'] },
  { id: 'leave-accrual', category: 'leave',
    label: 'Leave accrual policies',
    description: 'Pro-rata accrual, carry-forward limits and encashment rules.',
    availableInPlans: ['business', 'enterprise'] },
  { id: 'holiday-calendar', category: 'leave',
    label: 'Public holiday calendars',
    description: 'Country and state-specific public holiday calendars.',
    availableInPlans: ['business', 'enterprise'] },
  { id: 'leave-balance', category: 'leave',
    label: 'Live leave balances',
    description: 'Workers see leave balances and apply from the mobile app.',
    availableInPlans: ['business', 'enterprise'] },

  // GPS / geofencing
  { id: 'gps-clock-in', category: 'gps-geofence',
    label: 'GPS clock-in',
    description: 'Capture location coordinates at clock-in / clock-out.',
    availableInPlans: ['business', 'enterprise'] },
  { id: 'geofence', category: 'gps-geofence',
    label: 'Geofenced sites',
    description: 'Auto clock-in / clock-out when workers enter or leave a job site.',
    availableInPlans: ['business', 'enterprise'] },
  { id: 'mileage', category: 'gps-geofence',
    label: 'Mileage tracking',
    description: 'Auto-track distance for field workers via the mobile app.',
    availableInPlans: ['business', 'enterprise'] },
  { id: 'mock-location-detection', category: 'gps-geofence',
    label: 'Mock-location detection',
    description: 'Detect spoofed GPS readings on Android devices.',
    availableInPlans: ['business', 'enterprise'] },

  // Biometric kiosk
  { id: 'kiosk-mode', category: 'biometric-kiosk',
    label: 'Tablet kiosk mode',
    description: 'Run a single tablet at the gate as a shared clock-in station.',
    availableInPlans: ['business', 'enterprise'] },
  { id: 'face-recognition', category: 'biometric-kiosk',
    label: 'Anti-spoof face recognition',
    description: 'On-device sub-second face match against enrolled site workers.',
    availableInPlans: ['business', 'enterprise'] },
  { id: 'document-expiry', category: 'biometric-kiosk',
    label: 'Document expiry alerts',
    description: 'Track police verification, contract end, training certificate expiry.',
    availableInPlans: ['business', 'enterprise'] },
  { id: 'whatsapp-onboarding', category: 'biometric-kiosk',
    label: 'WhatsApp / SMS worker onboarding',
    description: 'Onboard contract workers via a WhatsApp or SMS link without a payroll seat.',
    availableInPlans: ['business', 'enterprise'] },

  // Productivity
  { id: 'activity-levels', category: 'productivity',
    label: 'Activity levels',
    description: 'Keyboard / mouse activity sampling while the timer runs.',
    availableInPlans: ['business', 'enterprise'] },
  { id: 'app-url-tracking', category: 'productivity',
    label: 'App and URL tracking',
    description: 'Categorize app and browser usage during tracked time.',
    availableInPlans: ['business', 'enterprise'] },
  { id: 'screenshots', category: 'productivity',
    label: 'Optional screenshots',
    description: 'Configurable screenshot frequency; opt-in and visible to the worker.',
    availableInPlans: ['business', 'enterprise'] },

  // Payroll
  { id: 'multi-rate-pay', category: 'payroll',
    label: 'Hourly, salaried and contract pay',
    description: 'Multi-rate billable vs cost rate per role, project or member.',
    availableInPlans: ['business', 'enterprise'] },
  { id: 'india-statutory', category: 'payroll',
    label: 'India statutory deductions',
    description: 'Auto-compute TDS, PF, ESI, PT, LWF and IT slabs.',
    availableInPlans: ['business', 'enterprise'] },
  { id: 'form-24q-fvu', category: 'payroll',
    label: 'Form 24Q + FVU export',
    description: 'Quarterly TDS return preparation with FVU file generation.',
    availableInPlans: ['business', 'enterprise'] },
  { id: 'payslips', category: 'payroll',
    label: 'Downloadable payslips',
    description: 'Per-employee per-cycle PDF payslips.',
    availableInPlans: ['business', 'enterprise'] },
  { id: 'payouts', category: 'payroll',
    label: 'Multi-rail payouts',
    description: 'UPI, Razorpay, bank transfer, PayPal, Wise or Payoneer payouts.',
    availableInPlans: ['business', 'enterprise'] },

  // Invoicing
  { id: 'invoice-from-hours', category: 'invoicing',
    label: 'Invoice from billable hours',
    description: 'Convert tracked hours into a line-item invoice in two clicks.',
    availableInPlans: ['pro', 'business', 'enterprise'] },
  { id: 'gst-einvoice', category: 'invoicing',
    label: 'GST e-invoice (India)',
    description: 'Native GST e-invoice and e-way bill generation via HelloBooks + Fynamics GSP.',
    availableInPlans: ['pro', 'business', 'enterprise'] },
  { id: 'invoice-payments', category: 'invoicing',
    label: 'Online invoice payments',
    description: 'Accept card, ACH and UPI on invoices via Stripe and Razorpay.',
    availableInPlans: ['pro', 'business', 'enterprise'] },

  // Analytics
  { id: 'project-profitability', category: 'analytics',
    label: 'Project profitability',
    description: 'Billable revenue minus cost-rate × hours, per project.',
    availableInPlans: ['pro', 'business', 'enterprise'] },
  { id: 'utilization', category: 'analytics',
    label: 'Utilization dashboard',
    description: 'Billable hours as a share of capacity, by member or team.',
    availableInPlans: ['pro', 'business', 'enterprise'] },
  { id: 'client-profitability', category: 'analytics',
    label: 'Client profitability',
    description: 'Margin across all engagements per client.',
    availableInPlans: ['pro', 'business', 'enterprise'] },

  // Projects
  { id: 'project-budgets', category: 'projects',
    label: 'Hourly or fixed-fee budgets',
    description: 'Per-project budgets with overrun alerts at 75/90/100%.',
    availableInPlans: ['pro', 'business', 'enterprise'] },
  { id: 'task-allocation', category: 'projects',
    label: 'Per-task allocation',
    description: 'Allocate budget hours per task inside a project.',
    availableInPlans: ['pro', 'business', 'enterprise'] },

  // Reports
  { id: 'pre-built-reports', category: 'reports',
    label: 'Pre-built reports',
    description: 'Hours, top clients, utilization, overruns — ready to run.',
    availableInPlans: ['pro', 'business', 'enterprise'] },
  { id: 'scheduled-reports', category: 'reports',
    label: 'Scheduled email reports',
    description: 'Recurring email delivery of any report.',
    availableInPlans: ['enterprise'] },

  // Integrations
  { id: 'hellobooks-sync', category: 'integrations',
    label: 'HelloBooks two-way sync',
    description: 'Native client/project/employee/billable-hour sync with HelloBooks.',
    availableInPlans: ['pro', 'business', 'enterprise'] },
  { id: 'public-api', category: 'integrations',
    label: 'Public REST API',
    description: 'Custom workflows and dashboards via HTTPS.',
    availableInPlans: ['business', 'enterprise'] },
  { id: 'mcp-server', category: 'integrations',
    label: 'MCP server for AI agents',
    description: 'Model Context Protocol server for AI-agent timesheet access.',
    availableInPlans: ['business', 'enterprise'] },
];
