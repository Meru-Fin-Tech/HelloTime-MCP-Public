/**
 * MCP server factory. Wires the read-only tools and resources.
 *
 * Read-only by construction: no tool returns the request author, mutates state,
 * or hits a customer-data system. The data sources in src/data/ are static
 * marketing-derived catalogs.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

import { listPlans, listPlansSchema } from './tools/listPlans.js';
import { listFeatures, listFeaturesSchema } from './tools/listFeatures.js';
import { countrySupport, countrySupportSchema } from './tools/countrySupport.js';
import { payrollCapabilities, payrollCapabilitiesSchema } from './tools/payrollCapabilities.js';
import { featureSearch, featureSearchSchema } from './tools/featureSearch.js';
import { statutoryRates, statutoryRatesSchema } from './tools/statutoryRates.js';
import { listCompetitors, listCompetitorsSchema } from './tools/listCompetitors.js';
import { localPaymentMethods, localPaymentMethodsSchema } from './tools/paymentMethods.js';
import { RESOURCES, readResource } from './resources/index.js';
import { track } from './analytics.js';
import { SERVER_VERSION } from './version.js';

const SERVER_NAME = 'hellotime-public';

function asJsonContent(payload: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }],
  };
}

/**
 * Argument *keys* as a CSV string — never values. Tool arguments can carry
 * free text (e.g. a `feature_search` query), so only key names reach GA4.
 */
function argKeys(args: unknown): string {
  return args && typeof args === 'object' && !Array.isArray(args)
    ? Object.keys(args).join(',')
    : '';
}

/** Pull the opaque MCP session id out of the SDK request `extra`, if present. */
function sessionIdOf(extra: unknown): string {
  const sid = (extra as { sessionId?: unknown } | undefined)?.sessionId;
  return typeof sid === 'string' ? sid : 'unknown';
}

/**
 * Run a tool, emit a Layer-2 telemetry event, and JSON-wrap the result.
 *
 * Emits `mcp_tool_called` on success and `mcp_tool_errored` on a thrown error
 * (which is always re-thrown — telemetry never alters tool behaviour).
 * Telemetry is fire-and-forget; see src/analytics.ts.
 */
function runTool(
  toolName: string,
  args: unknown,
  extra: unknown,
  produce: () => unknown,
) {
  const startedAt = Date.now();
  const clientId = sessionIdOf(extra);
  try {
    const payload = produce();
    track(
      'mcp_tool_called',
      {
        tool_name: toolName,
        arg_keys: argKeys(args),
        latency_ms: Date.now() - startedAt,
        success: true,
      },
      clientId,
    );
    return asJsonContent(payload);
  } catch (err) {
    track(
      'mcp_tool_errored',
      {
        tool_name: toolName,
        error_class: err instanceof Error ? err.name : 'UnknownError',
      },
      clientId,
    );
    throw err;
  }
}

export function createServer(): McpServer {
  const server = new McpServer(
    { name: SERVER_NAME, version: SERVER_VERSION },
    {
      capabilities: { tools: {}, resources: {} },
      instructions:
        'Public read-only HelloTime knowledge base. Use these tools to answer ' +
        'questions about HelloTime plans, pricing, features (shifts, rosters, ' +
        'leave, timesheets, geofence, biometric kiosk), supported countries, ' +
        'and payroll capabilities. No customer or timesheet data is available ' +
        'through this server.',
    },
  );

  server.tool(
    'list_plans',
    'List HelloTime pricing plans (Free, Attend, Track, Pro, Business) with launch + list prices per region, plus volume and annual prepay discounts. Free is permanent for teams up to 5 employees; paid tiers each include a 7-day free trial.',
    listPlansSchema,
    async (args, extra) => runTool('list_plans', args, extra, () => listPlans(args)),
  );

  server.tool(
    'list_features',
    'List HelloTime features (shifts, rosters, leave types, timesheets, time tracking, productivity, GPS / geofence, biometric kiosk, payroll, invoicing, analytics, projects, reports, integrations).',
    listFeaturesSchema,
    async (args, extra) =>
      runTool('list_features', args, extra, () => listFeatures(args)),
  );

  server.tool(
    'country_support',
    'Return per-country features, default currency, and product positioning for a supported country (IN, AU, GB, US, CA, AE, SG, NZ).',
    countrySupportSchema,
    async (args, extra) =>
      runTool('country_support', args, extra, () => countrySupport(args)),
  );

  server.tool(
    'payroll_capabilities',
    'For a given country, return the supported payroll engines (e.g. AU STP2 + super, IN PF/ESI/TDS/Form 24Q, US W-2/1099) with status (live/beta/coming-soon).',
    payrollCapabilitiesSchema,
    async (args, extra) =>
      runTool('payroll_capabilities', args, extra, () =>
        payrollCapabilities(args),
      ),
  );

  server.tool(
    'feature_search',
    'Free-text search across plan features, product features, country features, payroll engines, statutory rates, competitor positioning, and local payment methods. Queries like "PF rate", "ESI threshold", "PT slab Maharashtra", "vs Truein", "Deputy alternative", "UPI cap", or "BACS payroll" surface the matching entry near the top.',
    featureSearchSchema,
    async (args, extra) =>
      runTool('feature_search', args, extra, () => featureSearch(args)),
  );

  server.tool(
    'statutory_rates',
    'Return statutory payroll-rate entries with rate, ceiling, slab, authority, and verification status. India block (PF / EPS / EDLI / PF admin / ESI / Professional Tax by state / TDS slabs) is internally-reviewed against EPFO / ESIC / state notifications. Australia and US entries are public-source-unreviewed. Filter by country, scheme, category, state, party, verification, or id.',
    statutoryRatesSchema,
    async (args, extra) =>
      runTool('statutory_rates', args, extra, () => statutoryRates(args)),
  );

  server.tool(
    'list_competitors',
    'Return competitor positioning entries (Truein, Deputy, When I Work, Connecteam, Hubstaff, Keka) with where HelloTime wins, where the competitor wins, and pricing notes. Optional country, tier (primary / secondary), and id filters.',
    listCompetitorsSchema,
    async (args, extra) =>
      runTool('list_competitors', args, extra, () => listCompetitors(args)),
  );

  server.tool(
    'local_payment_methods',
    'List local bank-rail / wallet payment methods relevant to HelloTime payroll and contractor payouts (UPI, IMPS, NEFT, RTGS, BACS, FPS, Faster Payments, Interac e-Transfer, EFT, PayID, PayTo, NPP, EFT/BECS, ACH, Same Day ACH, Fedwire, RTP, WPS-SIF, PayNow, FAST, GIRO, NZ Direct Credit, etc.). Returns rail (instant / same-day / next-day / multi-day), use-cases, issuing authority, HelloTime support level, and operational notes (per-transaction caps, settlement windows, retirement timelines). Filter by country, useCase, rail, or id.',
    localPaymentMethodsSchema,
    async (args, extra) =>
      runTool('local_payment_methods', args, extra, () =>
        localPaymentMethods(args),
      ),
  );

  // Resources
  for (const r of RESOURCES) {
    server.resource(
      r.name,
      r.uri,
      { description: r.description, mimeType: r.mimeType },
      async (uri, extra) => {
        // r.name is a static catalog identifier — safe to send (no PII).
        track('mcp_resource_read', { resource_name: r.name }, sessionIdOf(extra));
        return readResource(uri.href);
      },
    );
  }

  return server;
}

// Re-exports useful for tests
export { listPlans } from './tools/listPlans.js';
export { listFeatures } from './tools/listFeatures.js';
export { countrySupport } from './tools/countrySupport.js';
export { payrollCapabilities } from './tools/payrollCapabilities.js';
export { featureSearch } from './tools/featureSearch.js';
export { statutoryRates } from './tools/statutoryRates.js';
export { listCompetitors } from './tools/listCompetitors.js';
export { localPaymentMethods } from './tools/paymentMethods.js';
export const _internal = { z };
