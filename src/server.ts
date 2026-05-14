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

const SERVER_NAME = 'hellotime-public';
const SERVER_VERSION = '0.3.0';

function asJsonContent(payload: unknown) {
  return {
    content: [{ type: 'text' as const, text: JSON.stringify(payload, null, 2) }],
  };
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
    async (args) => asJsonContent(listPlans(args)),
  );

  server.tool(
    'list_features',
    'List HelloTime features (shifts, rosters, leave types, timesheets, time tracking, productivity, GPS / geofence, biometric kiosk, payroll, invoicing, analytics, projects, reports, integrations).',
    listFeaturesSchema,
    async (args) => asJsonContent(listFeatures(args)),
  );

  server.tool(
    'country_support',
    'Return per-country features, default currency, and product positioning for a supported country (IN, AU, GB, US, CA, AE, SG, NZ).',
    countrySupportSchema,
    async (args) => asJsonContent(countrySupport(args)),
  );

  server.tool(
    'payroll_capabilities',
    'For a given country, return the supported payroll engines (e.g. AU STP2 + super, IN PF/ESI/TDS/Form 24Q, US W-2/1099) with status (live/beta/coming-soon).',
    payrollCapabilitiesSchema,
    async (args) => asJsonContent(payrollCapabilities(args)),
  );

  server.tool(
    'feature_search',
    'Free-text search across plan features, product features, country features, payroll engines, statutory rates, competitor positioning, and local payment methods. Queries like "PF rate", "ESI threshold", "PT slab Maharashtra", "vs Truein", "Deputy alternative", "UPI cap", or "BACS payroll" surface the matching entry near the top.',
    featureSearchSchema,
    async (args) => asJsonContent(featureSearch(args)),
  );

  server.tool(
    'statutory_rates',
    'Return statutory payroll-rate entries with rate, ceiling, slab, authority, and verification status. India block (PF / EPS / EDLI / PF admin / ESI / Professional Tax by state / TDS slabs) is internally-reviewed against EPFO / ESIC / state notifications. Australia and US entries are public-source-unreviewed. Filter by country, scheme, category, state, party, verification, or id.',
    statutoryRatesSchema,
    async (args) => asJsonContent(statutoryRates(args)),
  );

  server.tool(
    'list_competitors',
    'Return competitor positioning entries (Truein, Deputy, When I Work, Connecteam, Hubstaff, Keka) with where HelloTime wins, where the competitor wins, and pricing notes. Optional country, tier (primary / secondary), and id filters.',
    listCompetitorsSchema,
    async (args) => asJsonContent(listCompetitors(args)),
  );

  server.tool(
    'local_payment_methods',
    'List local bank-rail / wallet payment methods relevant to HelloTime payroll and contractor payouts (UPI, IMPS, NEFT, RTGS, BACS, FPS, Faster Payments, Interac e-Transfer, EFT, PayID, PayTo, NPP, EFT/BECS, ACH, Same Day ACH, Fedwire, RTP, WPS-SIF, PayNow, FAST, GIRO, NZ Direct Credit, etc.). Returns rail (instant / same-day / next-day / multi-day), use-cases, issuing authority, HelloTime support level, and operational notes (per-transaction caps, settlement windows, retirement timelines). Filter by country, useCase, rail, or id.',
    localPaymentMethodsSchema,
    async (args) => asJsonContent(localPaymentMethods(args)),
  );

  // Resources
  for (const r of RESOURCES) {
    server.resource(
      r.name,
      r.uri,
      { description: r.description, mimeType: r.mimeType },
      async (uri) => readResource(uri.href),
    );
  }

  return server;
}

// Re-exports useful for tests
export { listPlans, listFeatures, countrySupport, payrollCapabilities, featureSearch, statutoryRates, listCompetitors, localPaymentMethods };
export const _internal = { z };
