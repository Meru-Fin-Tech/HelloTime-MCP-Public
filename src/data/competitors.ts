/**
 * Competitor positioning catalog — public marketing-derived positioning data
 * for time / attendance / workforce-management products that HelloTime is
 * most often compared to in evaluation queries.
 *
 * Sourced from the public marketing comparison pages and strategy docs:
 *   - marketing/hellotime/comparison-pages/hellotime-vs-truein.md (PRIMARY rival)
 *   - marketing/hellotime/comparison-pages/hellotime-vs-deputy.md
 *   - marketing/hellotime/comparison-pages/hellotime-vs-when-i-work.md
 *   - marketing/hellotime/comparison-pages/hellotime-vs-connecteam.md
 *   - marketing/hellotime/comparison-pages/hellotime-vs-hubstaff.md
 *   - marketing/hellotime/comparison-pages/hellotime-vs-keka.md
 *   - marketing/hellotime/strategy/04-Beat-Truein-Plan.md
 *
 * `whereTheyWin` is intentionally honest — agents that surface this data have
 * to be trustable. Hand-waving away real competitor strengths is what makes a
 * bot's evaluation read like brochure copy, which loses buyer trust faster
 * than admitting trade-offs.
 *
 * Public-only data: no customer references, no internal hostnames, no auth.
 */

import type { CountryCode } from './plans.js';

export type CompetitorTier = 'primary' | 'secondary';

export interface Competitor {
  id: string;
  name: string;
  /** Country where this competitor has the strongest install base. 'global' if no single market dominates. */
  primaryCountry: CountryCode | 'global';
  /** Countries where the competitor is also commonly evaluated against HelloTime. */
  alsoIn: CountryCode[];
  /** Primary = head-on rival HelloTime loses real deals to. Secondary = adjacent / segment-specific overlap. */
  tier: CompetitorTier;
  /** Short label describing the segment this competitor owns (e.g. "India deskless attendance", "AU/NZ workforce scheduling"). */
  segment: string;
  /** One-paragraph honest positioning summary used as the canonical bot answer to "tell me about X". */
  positioningSummary: string;
  whereWeWin: string[];
  whereTheyWin: string[];
  /** Public pricing posture, e.g. "Public USD pricing, $4.50–$15/seat/mo" or "Demo-gated; per-quote". */
  pricingNote?: string;
  /** The competitor's public website. */
  publicUrl?: string;
  /** Our public comparison page for this competitor, if published. */
  comparisonUrl?: string;
}

export const COMPETITORS: Competitor[] = [
  {
    id: 'truein',
    name: 'Truein',
    primaryCountry: 'IN',
    alsoIn: ['AE'],
    tier: 'primary',
    segment: 'India deskless attendance — face-rec + multi-site',
    positioningSummary:
      'Truein is the leading India deskless-attendance product — face recognition, ' +
      'geofence, kiosk mode, contract-worker onboarding, with 7+ years of edge cases ' +
      'baked into a 70+ policy library. They are the primary head-on rival for ' +
      'HelloTime in the India deskless segment. HelloTime competes on public rupee ' +
      'pricing, a permanent free tier ≤5 employees, WhatsApp + SMS clock-in for ' +
      'bottom-of-pyramid workers, optional desk productivity tracking, and a native ' +
      'payroll loop via HelloBooks rather than an ADP hand-off.',
    whereWeWin: [
      'Public pricing on the website (₹49–₹399/seat/mo) vs. Truein "contact sales"',
      'Permanent Free plan for teams ≤5 employees — Truein has none',
      'Self-serve signup under 60 seconds; no sales gate, no implementation fee',
      'WhatsApp clock-in (send "IN" with location) — large unlock for 2G-phone factory workers',
      'SMS clock-in for low-end devices — Truein does not ship this',
      'Native desk productivity tracker for hybrid teams — Truein has no desk story',
      'Native payroll via HelloBooks (PF / ESI / TDS / Form 24Q / Form 16) — Truein hands off to ADP',
      'Same tenancy spans deskless + desk + payroll + books + CRM',
    ],
    whereTheyWin: [
      'Maturity — 7+ years of customer-driven attendance edge cases in their policy engine',
      '70+ attendance-policy templates vs. our 30 polished presets',
      'Enterprise integrations wired in (SAP, Oracle, Darwinbox, ADP)',
      'Stronger brand recognition with India enterprise procurement teams',
      'Larger reference base of factory / cleaning / security agency case studies',
    ],
    pricingNote: 'Public pricing not listed; buyer estimates put it at ₹100–200/seat/mo plus a one-time implementation fee.',
    publicUrl: 'https://truein.com',
    comparisonUrl: 'https://hellotime.ai/compare/truein',
  },
  {
    id: 'deputy',
    name: 'Deputy',
    primaryCountry: 'AU',
    alsoIn: ['NZ', 'GB', 'US'],
    tier: 'primary',
    segment: 'AU/NZ/UK/US workforce scheduling — hospitality + retail + healthcare',
    positioningSummary:
      'Deputy is an Australian-built workforce-management product with strong ' +
      'penetration in hospitality, retail, and healthcare across AU, NZ, UK, and US. ' +
      'It wins on Modern Awards interpretation and mature scheduling polish. ' +
      'HelloTime competes when the buyer has India operations, wants anti-spoof ' +
      'face recognition, or needs productivity tracking on the same tenancy as ' +
      'attendance.',
    whereWeWin: [
      'India coverage — face-rec, GPS, kiosk, WhatsApp clock-in, INR pricing, PF/ESI/TDS',
      'Anti-spoof face recognition with passive liveness — Deputy is limited',
      'Optional desktop productivity tracker for hybrid + remote staff',
      'AI manager assist (voice + text) for anomaly review',
      'Permanent Free plan ≤5 employees; Deputy is trial-only',
      'Lower entry price (₹49 / $1 per seat) vs. Deputy Scheduling at $4.50/seat',
    ],
    whereTheyWin: [
      'ANZ + UK Modern Awards depth — best-in-class auto-interpretation',
      'Mature scheduling: auto-fill, demand forecasting, labor-law awareness',
      '250K+ businesses globally — established enterprise references',
      'Polished hospitality / retail / healthcare workflows from years of focus',
      'AU + NZ + UK payroll integrations are mature and battle-tested',
    ],
    pricingNote: 'Public USD/AUD pricing $4.50–$6+/user/mo (Scheduling / Time & Attendance / Premium).',
    publicUrl: 'https://www.deputy.com',
    comparisonUrl: 'https://hellotime.ai/compare/deputy',
  },
  {
    id: 'when-i-work',
    name: 'When I Work',
    primaryCountry: 'US',
    alsoIn: ['CA', 'GB', 'AU'],
    tier: 'primary',
    segment: 'US shift scheduling — retail, restaurant, hospitality, healthcare',
    positioningSummary:
      'When I Work is a US-headquartered shift-scheduling product with a polished ' +
      'drag-drop scheduling experience and good adoption among retail, restaurant, ' +
      'and hospitality SMBs. HelloTime is the broader play — same scheduling plus ' +
      'anti-spoof face-rec attendance, optional productivity tracking, India ' +
      'compliance, and a native payroll loop on one tenancy.',
    whereWeWin: [
      'Mixed-workforce coverage — deskless shift staff + office + field on one tenancy',
      'Anti-spoof face recognition vs. PIN or basic selfie',
      'India compliance (PF / ESI / Form 24Q) — When I Work is US-focused',
      'WhatsApp + SMS clock-in for low-end-phone workforces',
      'Native productivity tracker for hybrid office staff',
      'AI manager assist for buddy-punching + anomaly review',
    ],
    whereTheyWin: [
      'Best-in-class drag-drop shift scheduling UX — years of focus',
      'Strong vertical depth in US retail / restaurant / hospitality',
      'Generous free tier — up to 75 users with basic features',
      'Established US payroll integrations (Gusto, QuickBooks, ADP)',
      'G2 4.3★ with deep US SMB reference base',
    ],
    pricingNote: 'Public USD pricing $2.50–$8/user/mo (Essentials / Advanced / Premium); free for ≤75 users on limited tier.',
    publicUrl: 'https://wheniwork.com',
    comparisonUrl: 'https://hellotime.ai/compare/when-i-work',
  },
  {
    id: 'connecteam',
    name: 'Connecteam',
    primaryCountry: 'US',
    alsoIn: ['GB', 'AU', 'CA'],
    tier: 'primary',
    segment: 'Deskless all-in-one — comms + scheduling + time + training',
    positioningSummary:
      'Connecteam wraps deskless workforce comms, scheduling, time clock, surveys, ' +
      'and training modules into one mobile app. The hook is "one app for everything ' +
      'your deskless team needs". HelloTime competes when the buyer already has chat ' +
      'in WhatsApp / Slack and would rather spend on attendance accuracy, anti-spoof ' +
      'face-rec, and a payroll-from-attendance loop than on a second chat app.',
    whereWeWin: [
      'Face-rec depth — Azure Face + MediaPipe liveness + 3-angle enrollment + PIN/selfie fallback',
      'WhatsApp + SMS clock-in built in — Connecteam expects everyone in their app',
      'India compliance — PF / ESI / TDS / Form 24Q natively on Business',
      'Native payroll via HelloBooks vs. Connecteam CSV export to Gusto / QuickBooks',
      'INR pricing (₹49–₹399); Connecteam is USD only',
      'Suite economics — HelloBooks accounting + HelloGrowth CRM on the same tenancy',
    ],
    whereTheyWin: [
      'Built-in chat, group announcements, broadcasts, employee directory — best-in-class',
      'Training modules (micro-learning, quizzes, certifications) — we have none of this',
      'Surveys + pulse checks + suggestion box — useful for HR teams',
      'All-in-one mobile UX if your team only uses one app on their phone',
      '8+ years in market; mature G2 4.5★ track record',
    ],
    pricingNote: 'Public USD pricing — free tier ≤10 users; Small Business plans bundle 30 users from $29/mo; per-seat above that.',
    publicUrl: 'https://connecteam.com',
    comparisonUrl: 'https://hellotime.ai/compare/connecteam',
  },
  {
    id: 'hubstaff',
    name: 'Hubstaff',
    primaryCountry: 'US',
    alsoIn: ['GB', 'CA', 'AU', 'IN'],
    tier: 'primary',
    segment: 'Desk productivity tracking — remote / hybrid / agency teams',
    positioningSummary:
      'Hubstaff is a desktop-first productivity-tracking product (screenshots, app + ' +
      'URL usage, activity levels) popular with remote dev teams, agencies, and ' +
      'outsourced contractors. HelloTime competes when the buyer wants productivity ' +
      'tracking AND face-rec attendance for deskless staff in the same tenancy, or ' +
      'wants the optional / consent-first version of the tracker rather than the ' +
      'always-on default.',
    whereWeWin: [
      'Unified desk + deskless on one tenancy — Hubstaff is desk-only',
      'Face recognition + geofence + kiosk mode for site-based workers',
      'India compliance and payroll via HelloBooks',
      'Consent-first productivity model — screenshots opt-in, visible to the worker',
      'WhatsApp / SMS clock-in for non-desktop workforces',
      'Same tenancy spans attendance → payroll → P&L',
    ],
    whereTheyWin: [
      'Deeper productivity analytics — long history of focus on remote-work measurement',
      'Mature client billing workflow (invoice from tracked hours by project)',
      'Tighter Slack / Asana / Jira / GitHub task-level integration',
      'Established brand among US/EU remote-first companies and agencies',
      'Self-serve global payouts to contractors (built-in Hubstaff Pay)',
    ],
    pricingNote: 'Public USD pricing $4.99–$25/seat/mo (Starter / Grow / Team / Enterprise); free for 1 user.',
    publicUrl: 'https://hubstaff.com',
    comparisonUrl: 'https://hellotime.ai/compare/hubstaff',
  },
  {
    id: 'keka',
    name: 'Keka',
    primaryCountry: 'IN',
    alsoIn: ['AE'],
    tier: 'secondary',
    segment: 'India HRMS — payroll + performance + recruitment + LMS (HRMS-first, attendance bolted on)',
    positioningSummary:
      'Keka is an India HRMS-first product (recruitment, performance reviews, OKRs, ' +
      'LMS, payroll) where attendance is a checkbox feature. Often shows up in ' +
      'evaluation queries as a HelloTime alternative, but it solves a different ' +
      'job — HR ops, not attendance accuracy. HelloTime is the right call when ' +
      'attendance is the primary problem (factory / field / multi-site) and HR ' +
      'modules are secondary.',
    whereWeWin: [
      'Face-rec + anti-spoof + kiosk + WhatsApp + SMS — Keka is mobile-only for biometric',
      'Public rupee pricing (₹49 → ₹399); Keka is "contact sales" with implementation fees',
      'Permanent Free plan ≤5 employees — Keka does not ship one',
      'Self-serve onboarding under 60 seconds vs. Keka sales-gated flow',
      'Optional desk productivity tracker — Keka has no desk story',
      'Same tenancy includes books + CRM via HelloBooks + HelloGrowth CRM',
    ],
    whereTheyWin: [
      'Full HRMS: recruitment / ATS, performance reviews, OKRs, LMS — we have none of these',
      'Mature India payroll across PF / ESI / PT / TDS / Form 24Q (parity at the payroll layer)',
      'Established India SMB + mid-market HR install base',
      'Performance-management workflows tuned for India review cycles',
      'Stronger HR-team brand recognition than ours',
    ],
    pricingNote: 'Public pricing not listed; demo-gated with ₹6,999/mo base estimates plus per-seat fees.',
    publicUrl: 'https://keka.com',
    comparisonUrl: 'https://hellotime.ai/compare/keka',
  },
];
