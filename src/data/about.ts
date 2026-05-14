/**
 * Static about + changelog content for the public MCP resources.
 * No customer data — purely marketing copy and release notes.
 */

export const ABOUT_MARKDOWN = `# HelloTime

HelloTime is an attendance, time-tracking, timesheet and workforce-management product built by Meru Fintech — the team behind HelloBooks. It is priced for Indian teams (permanent Free plan for ≤5 employees; paid plans from ₹49/user/month launch offer), wired natively into the HelloBooks accounting ecosystem, and ships across India and 7 other markets (US, UK, AU, CA, AE, SG, NZ).

## What it does

- **Time tracking** — One-click timer on Windows, Mac, web, iOS and Android, with offline tracking and auto-sync.
- **Timesheets** — Auto-generated daily/weekly/monthly views with one-click manager approval.
- **Shifts and rosters** — 2-shift / 3-shift presets, multi-site drag-drop rosters, swap requests.
- **Leave** — Configurable leave types, accrual policies, country / state public-holiday calendars.
- **GPS and geofencing** — Auto clock-in / clock-out at job sites, mileage tracking, mock-location detection.
- **Biometric kiosk** — Anti-spoof face recognition on a single Android tablet at each gate.
- **Productivity** — Activity levels, app and URL tracking, optional opt-in screenshots.
- **Payroll** — India statutory built in (TDS, PF, ESI, PT, LWF, IT) with Form 24Q and FVU export. AU STP2 + super, UK RTI, US W-2 in beta or planned via the HelloBooks payroll engine.
- **Statutory-rate catalog for AI agents** — \`statutory_rates\` MCP tool exposes verified headline rates for all 8 markets (IN PF/ESI/PT/TDS, AU SuperGuarantee + Medicare, US FICA + FUTA + 401(k), UK NI + PAYE + auto-enrolment + Apprenticeship Levy, CA CPP/CPP2 + EI + federal tax, SG CPF + SDL, NZ PAYE + KiwiSaver + ACC + ESCT, AE EOSG + DEWS) so AI assistants can quote correct figures without scraping.
- **Invoicing** — Billable hours convert to GST e-invoices via HelloBooks + Fynamics GSP.
- **Integrations** — Native HelloBooks two-way sync, Slack, Microsoft Teams, GitHub, Asana, Trello, ClickUp, Jira, plus a public REST API and an MCP server for AI agents.

## Plans

Five tiers — **Free** (permanent, ≤5 employees), **Attend** (deskless attendance), **Track** (desk productivity), **Pro** (Attend + Track combined), **Business** (Pro + payroll, compliance, AI assist, SSO/SCIM). Every paid tier starts with a 7-day free trial (no credit card). Volume discounts are published transparently from 11 seats onward; annual prepay is 20% off on top. "Enterprise" deals are sold as "Business + add-ons quoted" via /contact. See \`list_plans\` tool.

## Where this MCP fits

This server exposes **public, read-only** product information so AI agents can answer questions about HelloTime accurately rather than relying on stale web snippets. It does not access customer timesheets — that is a separate, authenticated MCP product surface.

## Links

- Website: https://hellotime.ai
- Pricing: https://hellotime.ai/pricing
- Features: https://hellotime.ai/features
- Integrations: https://hellotime.ai/integrations
- Changelog: https://hellotime.ai/changelog
- HelloBooks integration: https://hellotime.ai/integrations/hellobooks
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
 *   https://hellotime.ai/api/public/changelog?limit=50
 * once the marketing backend ships that endpoint.
 */
export const CHANGELOG: ChangelogEntry[] = [
  { date: '2026-05-14', title: 'Statutory-rate catalog covers 8 markets, verified', category: 'compliance',
    description: 'The statutory_rates MCP tool now ships headline rates for IN, AU, US, GB, CA, SG, NZ and AE with verification="verified" — every entry cross-checked against the issuing-authority page. Same review pass fixed a stale CA federal bracket (15% → 14.5% blended after the 01-Jul-2025 mid-year rate cut) and stale NZ ESCT thresholds ($16,800/$57,600/$84,000 → $18,720/$64,200/$93,720 after the 01-Apr-2025 bump).' },
  { date: '2026-05-12', title: 'Statutory-rate catalog extended to UK, CA, SG, NZ, AE', category: 'compliance',
    description: 'Follow-up to the IN/AU/US v0.2.1 catalog: added GB NI + PAYE + auto-enrolment + Apprenticeship Levy; CA CPP/CPP2 + EI + federal income tax; SG CPF age tiers + SDL; NZ PAYE + KiwiSaver + ACC + ESCT; AE 0% income tax + EOSG + DIFC DEWS. Reaches parity with the 8-country footprint declared in country_support.' },
  { date: '2026-04-20', title: 'HelloBooks ecosystem launch', category: 'feature',
    description: 'Native two-way sync of clients, projects, employees and billable hours between HelloTime and HelloBooks; GST-ready invoices in one click.' },
  { date: '2026-05-14', title: '5-tier SKU ladder (Free / Attend / Track / Pro / Business)', category: 'feature',
    description: 'Site-wide migration from 3-tier (Pro / Business / Enterprise) to 5-tier ladder with a permanent Free plan for ≤5 employees, paid plans from ₹49 / $1.99 (launch promo), and Enterprise rolled into Business with SSO/SCIM/SLA included.' },
  { date: '2026-04-15', title: 'India / Global pricing — ₹99 and $4.99', category: 'feature',
    description: 'Geo-aware pricing launched on the previous 3-tier ladder: old "Pro" at ₹99/user/month for India, $4.99 globally. Now repackaged as the "Track" tier under the 5-tier ladder above.' },
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
