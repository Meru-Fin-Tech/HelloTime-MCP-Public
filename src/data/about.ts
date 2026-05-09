/**
 * Static about + changelog content for the public MCP resources.
 * No customer data — purely marketing copy and release notes.
 */

export const ABOUT_MARKDOWN = `# HelloTime

HelloTime is a time-tracking, timesheet and workforce-management product built by Meru Fintech — the team behind HelloBooks. It is priced for Indian teams (₹99/user/month launch offer), wired natively into the HelloBooks accounting ecosystem, and ships across India and 7 other markets (US, UK, AU, CA, AE, SG, NZ).

## What it does

- **Time tracking** — One-click timer on Windows, Mac, web, iOS and Android, with offline tracking and auto-sync.
- **Timesheets** — Auto-generated daily/weekly/monthly views with one-click manager approval.
- **Shifts and rosters** — 2-shift / 3-shift presets, multi-site drag-drop rosters, swap requests.
- **Leave** — Configurable leave types, accrual policies, country / state public-holiday calendars.
- **GPS and geofencing** — Auto clock-in / clock-out at job sites, mileage tracking, mock-location detection.
- **Biometric kiosk** — Anti-spoof face recognition on a single Android tablet at each gate.
- **Productivity** — Activity levels, app and URL tracking, optional opt-in screenshots.
- **Payroll** — India statutory built in (TDS, PF, ESI, PT, LWF, IT) with Form 24Q and FVU export. AU STP2 + super, UK RTI, US W-2 in beta or planned via the HelloBooks payroll engine.
- **Invoicing** — Billable hours convert to GST e-invoices via HelloBooks + Fynamics GSP.
- **Integrations** — Native HelloBooks two-way sync, Slack, Microsoft Teams, GitHub, Asana, Trello, ClickUp, Jira, plus a public REST API and an MCP server for AI agents.

## Plans

Pro, Business, and Enterprise — all start with a 7-day free trial (no credit card). Volume discounts published transparently from 11 seats onward; annual prepay is 20% off on top. See \`list_plans\` tool.

## Where this MCP fits

This server exposes **public, read-only** product information so AI agents can answer questions about HelloTime accurately rather than relying on stale web snippets. It does not access customer timesheets — that is a separate, authenticated MCP product surface.

## Links

- Website: https://hellotime.app
- Pricing: https://hellotime.app/pricing
- Features: https://hellotime.app/features
- Integrations: https://hellotime.app/integrations
- Changelog: https://hellotime.app/changelog
- HelloBooks integration: https://hellotime.app/integrations/hellobooks
`;

export interface ChangelogEntry {
  date: string; // YYYY-MM-DD
  title: string;
  category: 'feature' | 'fix' | 'improvement' | 'compliance';
  description: string;
}

/**
 * Last 50 changelog entries — kept in sync with /changelog on the marketing site.
 *
 * TODO(federation): replace with a fetch from
 *   https://hellotime.app/api/public/changelog?limit=50
 * once the marketing backend ships that endpoint.
 */
export const CHANGELOG: ChangelogEntry[] = [
  { date: '2026-04-20', title: 'HelloBooks ecosystem launch', category: 'feature',
    description: 'Native two-way sync of clients, projects, employees and billable hours between HelloTime and HelloBooks; GST-ready invoices in one click.' },
  { date: '2026-04-15', title: 'India / Global pricing — ₹99 and $4.99', category: 'feature',
    description: 'Geo-aware pricing: Pro at ₹99/user/month for India, $4.99 globally. Every paid plan starts with a 7-day free trial.' },
  { date: '2026-04-10', title: '22 competitor comparison pages', category: 'feature',
    description: 'Honest side-by-side pages for Hubstaff, Toggl, Clockify, Teramind, Time Doctor, DeskTime, ActivTrak, Harvest, RescueTime, Monitask and 12 more.' },
  { date: '2026-04-02', title: 'Tablet kiosk mode for factories', category: 'feature',
    description: 'Anti-spoof face recognition on a single Android tablet per gate, with WhatsApp / SMS contract-worker onboarding.' },
  { date: '2026-03-28', title: 'Form 24Q + FVU export', category: 'compliance',
    description: 'Quarterly e-TDS return preparation with FVU file generation for India payroll.' },
  { date: '2026-03-20', title: 'Geofence auto clock-in/out', category: 'feature',
    description: 'Drift-tolerant 50m geofence radius for retail and field-service teams.' },
  { date: '2026-03-12', title: 'Mileage tracking (Wave 3.1)', category: 'feature',
    description: 'Built-in mileage on the mobile app with companion Hello Mileage shared login.' },
  { date: '2026-03-05', title: 'Privacy-first screenshots', category: 'improvement',
    description: 'Workers see their own captures before managers; opt-in by default.' },
  { date: '2026-02-22', title: 'Slack integration', category: 'feature',
    description: '/hellotime slash command, daily 6pm digests and channel-pinned timers.' },
  { date: '2026-02-15', title: 'Microsoft Teams app on AppSource', category: 'feature',
    description: 'Sidebar app with timer controls, daily digest cards and SSO via Entra ID.' },
  { date: '2026-02-08', title: 'GitHub PR-level timers', category: 'feature',
    description: 'Start a timer directly from any pull request; sprint velocity now tracks actual hours.' },
  { date: '2026-01-30', title: 'AU STP Phase 2 (beta)', category: 'compliance',
    description: 'Beta rollout of Single Touch Payroll Phase 2 reporting via the HelloBooks AU engine.' },
];
