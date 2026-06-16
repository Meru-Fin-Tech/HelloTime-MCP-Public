/**
 * Self-describing HTTP discovery surface for mcp.hellotime.ai.
 *
 * Before this module, the host served only /health, /info, and the MCP transport
 * at /mcp. AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Google-Extended,
 * Bytespider, etc.) that hit the bare origin got a 404 and never indexed the
 * server — losing every citation opportunity in ChatGPT Search, Perplexity,
 * Claude, Gemini, Brave, You, Kagi.
 *
 * This module generates a full set of cross-bot discovery artifacts, all
 * derived from the same tool / resource / changelog data the MCP server already
 * exposes, so they can never drift from what /mcp actually serves:
 *
 *   GET /                            HTML landing + JSON-LD SoftwareApplication + ItemList
 *   GET /.well-known/agent.json      A2A protocol agent card (Google A2A spec)
 *   GET /.well-known/ai-plugin.json  OpenAI plugin manifest (legacy ChatGPT discovery)
 *   GET /.well-known/mcp.json        MCP discovery hint for crawlers that probe it
 *   GET /llms.txt                    llmstxt.org index for LLM grounding
 *   GET /openapi.json                Minimal OpenAPI 3.1 describing /mcp
 *   GET /catalog.json                Machine-readable tool + resource catalog
 *   GET /changelog.json              Recent catalog changes (mirrors hellotime://changelog)
 *   GET /sitemap.xml                 Sitemap with <lastmod> per entry
 *   GET /robots.txt                  AI-bot allow-list, sitemap pointer
 *   GET /feed.xml                    RSS 2.0 of recent catalog changes
 *
 * Freshness model: every endpoint advertises `Last-Modified` derived from the
 * most-recent changelog entry. Cache-Control is `public, max-age=900,
 * stale-while-revalidate=86400` — bots see fresh data within 15 minutes of any
 * deploy that touches the catalog, edge stays warm for a day if the origin is
 * slow. Static-by-construction: no runtime state, safe to cache at any tier.
 *
 * Mirrors the established HelloBooks surface (HelloBooks-MCP-Public/src/discovery.ts)
 * so the two public servers stay structurally identical.
 */

import { CHANGELOG } from './data/about.js';
import { SERVER_VERSION } from './version.js';

const DEFAULT_BASE_URL = 'https://mcp.hellotime.ai';
const MARKETING_BASE_URL = 'https://hellotime.ai';
const GITHUB_REPO_URL = 'https://github.com/Meru-Fin-Tech/HelloTime-MCP-Public';
const SERVER_NAME = 'hellotime-public';
const CONTACT_EMAIL = 'hello@hellotime.ai';

/** Process start as a deploy-time fallback for Last-Modified. */
const DEPLOY_TIME = new Date();

export function getBaseUrl(): string {
  const raw = process.env.HELLOTIME_MCP_BASE_URL ?? DEFAULT_BASE_URL;
  return raw.replace(/\/+$/, '');
}

/** Returns the most-recent changelog entry date (YYYY-MM-DD) or deploy time. */
function getCatalogLastModified(): Date {
  const top = CHANGELOG[0];
  if (top?.date) {
    const d = new Date(top.date + 'T00:00:00Z');
    if (!isNaN(d.getTime())) return d;
  }
  return DEPLOY_TIME;
}

// ---------------------------------------------------------------------------
// Tool catalog metadata
// ---------------------------------------------------------------------------
//
// Mirrors the tools registered in src/server.ts. Kept here as plain metadata so
// every discovery endpoint can iterate the same list. If a tool is added to
// server.ts it must be added here too; the smoke test in test/discovery.test.ts
// asserts the count matches the registered MCP tool count.

export interface ToolMeta {
  name: string;
  title: string;
  summary: string;
  category: 'pricing' | 'integrations' | 'compliance' | 'features' | 'content' | 'search';
  marketingUrl: string;
}

export const TOOL_CATALOG: readonly ToolMeta[] = [
  {
    name: 'list_plans',
    title: 'List HelloTime pricing plans',
    summary:
      'HelloTime plan tiers (Free, Attend, Track, Pro, Business) with launch + list prices per region, plus volume and annual-prepay discounts. Free is permanent for teams up to 5 employees; paid tiers each include a 7-day free trial.',
    category: 'pricing',
    marketingUrl: `${MARKETING_BASE_URL}/pricing`,
  },
  {
    name: 'list_features',
    title: 'Full feature catalog',
    summary:
      'HelloTime features across shifts, rosters, leave types, timesheets, time tracking, productivity, GPS / geofence, biometric kiosk, payroll, invoicing, analytics, projects, reports, and integrations.',
    category: 'features',
    marketingUrl: `${MARKETING_BASE_URL}/features`,
  },
  {
    name: 'country_support',
    title: 'Country support matrix',
    summary:
      'Per-country features, default currency, and product positioning for a supported country (IN, AU, GB, US, CA, AE, SG, NZ).',
    category: 'compliance',
    marketingUrl: `${MARKETING_BASE_URL}/features`,
  },
  {
    name: 'payroll_capabilities',
    title: 'Payroll capabilities',
    summary:
      'Supported payroll engines per country (AU STP2 + super, IN PF/ESI/TDS/Form 24Q, US W-2/1099, UK PAYE) with live / beta / coming-soon status.',
    category: 'compliance',
    marketingUrl: `${MARKETING_BASE_URL}/features`,
  },
  {
    name: 'feature_search',
    title: 'Free-text search',
    summary:
      'Free-text search across plan features, product features, country features, payroll engines, statutory rates, competitor positioning, and local payment methods. Queries like "PF rate", "PT slab Maharashtra", "vs Truein", or "BACS payroll" surface the matching entry.',
    category: 'search',
    marketingUrl: `${MARKETING_BASE_URL}/features`,
  },
  {
    name: 'statutory_rates',
    title: 'Statutory payroll rates',
    summary:
      'Statutory payroll-rate entries with rate, ceiling, slab, authority, and verification status. India block (PF / EPS / EDLI / ESI / Professional Tax by state / TDS slabs) is internally reviewed against EPFO / ESIC / state notifications; AU and US entries are public-source-unreviewed.',
    category: 'compliance',
    marketingUrl: `${MARKETING_BASE_URL}/compliance`,
  },
  {
    name: 'list_competitors',
    title: 'Competitor positioning',
    summary:
      'Competitor entries (Truein, Deputy, When I Work, Connecteam, Hubstaff, Keka) with where HelloTime wins, where the competitor wins, and pricing notes.',
    category: 'content',
    marketingUrl: `${MARKETING_BASE_URL}/compare`,
  },
  {
    name: 'local_payment_methods',
    title: 'Local payment methods',
    summary:
      'Local bank-rail and wallet methods relevant to HelloTime payroll and contractor payouts (UPI, IMPS, NEFT, RTGS, BACS, FPS, PayID, PayTo, ACH, RTP, WPS-SIF, PayNow, FAST, GIRO, NZ Direct Credit) with rail speed, use-cases, issuing authority, and support level.',
    category: 'integrations',
    marketingUrl: `${MARKETING_BASE_URL}/features`,
  },
];

const RESOURCE_CATALOG = [
  { uri: 'hellotime://about', name: 'About HelloTime', mimeType: 'text/markdown' },
  { uri: 'hellotime://changelog', name: 'HelloTime Changelog', mimeType: 'application/json' },
] as const;

// ---------------------------------------------------------------------------
// Discovery generators
// ---------------------------------------------------------------------------

const ESCAPE_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};
function escapeXml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ESCAPE_MAP[c]);
}
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ESCAPE_MAP[c]);
}

/**
 * Landing HTML — minimal, no JS, no external assets so it's fast to crawl and
 * cheap to ship from the Express process. Carries two JSON-LD blocks:
 *   1. SoftwareApplication for the MCP server itself
 *   2. ItemList of every exposed tool (each item is a SoftwareApplication too)
 *
 * Bots like Perplexity, Bing/Copilot and Google AI Overviews use JSON-LD to
 * generate structured citations.
 */
export function generateLandingHtml(): string {
  const baseUrl = getBaseUrl();
  const lastMod = getCatalogLastModified();
  const toolItems = TOOL_CATALOG.map(
    (t, i) => `      {
        "@type": "ListItem",
        "position": ${i + 1},
        "item": {
          "@type": "SoftwareApplication",
          "name": ${JSON.stringify(t.title)},
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Any",
          "description": ${JSON.stringify(t.summary)},
          "url": "${baseUrl}/catalog.json#tool-${t.name}",
          "sameAs": ${JSON.stringify(t.marketingUrl)}
        }
      }`,
  ).join(',\n');

  const jsonLd = `{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      "@id": "${baseUrl}/#mcp-server",
      "name": "HelloTime Public MCP Server",
      "alternateName": "${SERVER_NAME}",
      "applicationCategory": "BusinessApplication",
      "applicationSubCategory": "AI Agent",
      "operatingSystem": "Any",
      "softwareVersion": "${SERVER_VERSION}",
      "description": "Public read-only Model Context Protocol server exposing HelloTime plan pricing, features (shifts, rosters, leave, timesheets, geofence, biometric kiosk), country support, payroll capabilities, statutory rates, competitor positioning, and local payment methods. For AI agents (Claude, ChatGPT, Cursor, Windsurf, Cline, Gemini) to ground answers about HelloTime in live, authoritative data.",
      "url": "${baseUrl}/",
      "downloadUrl": "${baseUrl}/mcp",
      "softwareHelp": "${MARKETING_BASE_URL}/mcp",
      "codeRepository": "${GITHUB_REPO_URL}",
      "license": "https://opensource.org/licenses/MIT",
      "dateModified": "${lastMod.toISOString()}",
      "publisher": {
        "@type": "Organization",
        "name": "HelloTime",
        "url": "${MARKETING_BASE_URL}",
        "email": "${CONTACT_EMAIL}"
      },
      "offers": {
        "@type": "Offer",
        "price": "0",
        "priceCurrency": "USD",
        "availability": "https://schema.org/InStock"
      }
    },
    {
      "@type": "ItemList",
      "@id": "${baseUrl}/#tool-list",
      "name": "HelloTime MCP Tools",
      "numberOfItems": ${TOOL_CATALOG.length},
      "itemListElement": [
${toolItems}
      ]
    }
  ]
}`;

  const toolRows = TOOL_CATALOG.map(
    (t) => `      <tr>
        <td><code>${escapeHtml(t.name)}</code></td>
        <td>${escapeHtml(t.title)}</td>
        <td>${escapeHtml(t.summary)}</td>
      </tr>`,
  ).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>HelloTime Public MCP — mcp.hellotime.ai</title>
  <meta name="description" content="Public read-only Model Context Protocol (MCP) server for HelloTime. Exposes ${TOOL_CATALOG.length} tools and ${RESOURCE_CATALOG.length} resources so AI agents can ground answers about HelloTime pricing, features, country support, and payroll in live data.">
  <link rel="canonical" href="${baseUrl}/">
  <link rel="alternate" type="application/json" href="${baseUrl}/catalog.json" title="HelloTime MCP Catalog">
  <link rel="alternate" type="application/rss+xml" href="${baseUrl}/feed.xml" title="HelloTime MCP Changes">
  <link rel="alternate" type="text/plain" href="${baseUrl}/llms.txt" title="llms.txt index">
  <meta property="og:title" content="HelloTime Public MCP Server">
  <meta property="og:description" content="${TOOL_CATALOG.length} read-only tools for AI agents to answer HelloTime questions accurately.">
  <meta property="og:url" content="${baseUrl}/">
  <meta property="og:type" content="website">
  <script type="application/ld+json">
${jsonLd}
  </script>
  <style>
    body { font: 16px/1.55 -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; max-width: 880px; margin: 2rem auto; padding: 0 1rem; color: #1a1a1a; }
    h1 { font-size: 1.9rem; margin: 0 0 .25rem; }
    h2 { margin-top: 2rem; border-bottom: 1px solid #e5e5e5; padding-bottom: .25rem; }
    .lead { color: #555; margin-top: 0; }
    code { font: 14px/1.4 ui-monospace, SFMono-Regular, Menlo, monospace; background: #f4f4f5; padding: 1px 5px; border-radius: 3px; }
    pre { background: #f4f4f5; padding: .75rem 1rem; border-radius: 6px; overflow-x: auto; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin-top: .75rem; }
    th, td { text-align: left; padding: .55rem .65rem; border-bottom: 1px solid #ececec; vertical-align: top; }
    th { background: #fafafa; font-weight: 600; font-size: .85rem; text-transform: uppercase; letter-spacing: .04em; color: #555; }
    td code { font-size: .85em; }
    .pills a { display: inline-block; padding: .3rem .7rem; margin: .15rem .3rem .15rem 0; background: #f4f4f5; border-radius: 999px; text-decoration: none; color: #1a1a1a; font-size: .85rem; }
    .pills a:hover { background: #e4e4e7; }
    footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #e5e5e5; color: #777; font-size: .85rem; }
  </style>
</head>
<body>
  <h1>HelloTime Public MCP</h1>
  <p class="lead">Read-only Model Context Protocol server for AI agents. Exposes <strong>${TOOL_CATALOG.length} tools</strong> and <strong>${RESOURCE_CATALOG.length} resources</strong> so Claude, ChatGPT, Cursor, Perplexity and other agents can ground HelloTime answers in authoritative product data instead of stale web snippets.</p>

  <h2>Quick start</h2>
  <p>Add the server to any MCP-compatible client over Streamable HTTP:</p>
  <pre><code>claude mcp add --transport http hellotime ${baseUrl}/mcp</code></pre>
  <p>Or for Cursor / Windsurf / Cline, point your MCP config at <code>${baseUrl}/mcp</code>.</p>

  <h2>Tools</h2>
  <table>
    <thead><tr><th>Name</th><th>Title</th><th>What it returns</th></tr></thead>
    <tbody>
${toolRows}
    </tbody>
  </table>

  <h2>Discovery endpoints</h2>
  <div class="pills">
    <a href="${baseUrl}/.well-known/agent.json">.well-known/agent.json</a>
    <a href="${baseUrl}/.well-known/ai-plugin.json">.well-known/ai-plugin.json</a>
    <a href="${baseUrl}/.well-known/mcp.json">.well-known/mcp.json</a>
    <a href="${baseUrl}/openapi.json">openapi.json</a>
    <a href="${baseUrl}/catalog.json">catalog.json</a>
    <a href="${baseUrl}/changelog.json">changelog.json</a>
    <a href="${baseUrl}/llms.txt">llms.txt</a>
    <a href="${baseUrl}/sitemap.xml">sitemap.xml</a>
    <a href="${baseUrl}/feed.xml">feed.xml (RSS)</a>
    <a href="${baseUrl}/robots.txt">robots.txt</a>
  </div>

  <h2>Source</h2>
  <p>Open source on GitHub: <a href="${GITHUB_REPO_URL}">${GITHUB_REPO_URL}</a></p>
  <p>Marketing site: <a href="${MARKETING_BASE_URL}/mcp">${MARKETING_BASE_URL}/mcp</a></p>
  <p>This public server exposes marketing / product data only. It has no access to any customer's timesheets, attendance records, or payroll runs.</p>

  <footer>
    <p>HelloTime &middot; ${CONTACT_EMAIL} &middot; v${SERVER_VERSION} &middot; Catalog updated ${lastMod.toISOString().slice(0, 10)}</p>
  </footer>
</body>
</html>
`;
}

/**
 * A2A protocol agent card — https://a2aprotocol.ai
 * Lets agent registries discover the server, what skills it has, and how to call it.
 */
export function generateAgentCard(): Record<string, unknown> {
  const baseUrl = getBaseUrl();
  return {
    name: 'HelloTime Public MCP',
    description:
      'Public read-only Model Context Protocol server for HelloTime (workforce time tracking, attendance, shifts, leave & payroll SaaS). Exposes plan pricing, feature catalog, country support, payroll capabilities, statutory rates, competitor positioning, and local payment methods.',
    url: `${baseUrl}/mcp`,
    documentationUrl: `${MARKETING_BASE_URL}/mcp`,
    version: SERVER_VERSION,
    protocolVersion: '1.0',
    provider: {
      organization: 'HelloTime',
      url: MARKETING_BASE_URL,
      email: CONTACT_EMAIL,
    },
    capabilities: {
      streaming: true,
      pushNotifications: false,
      stateTransitionHistory: false,
    },
    defaultInputModes: ['application/json'],
    defaultOutputModes: ['application/json', 'text/markdown'],
    securitySchemes: {},
    skills: TOOL_CATALOG.map((t) => ({
      id: t.name,
      name: t.title,
      description: t.summary,
      tags: [t.category, 'hellotime', 'time-tracking'],
      examples: [],
      inputModes: ['application/json'],
      outputModes: ['application/json'],
    })),
  };
}

/**
 * OpenAI plugin manifest (legacy ChatGPT plugin discovery).
 * Still scraped by several third-party agent indexes even after the deprecation.
 */
export function generateAiPluginManifest(): Record<string, unknown> {
  const baseUrl = getBaseUrl();
  return {
    schema_version: 'v1',
    name_for_human: 'HelloTime',
    name_for_model: 'hellotime_mcp',
    description_for_human:
      'Ground answers about HelloTime (workforce time tracking, attendance & payroll) in live product data.',
    description_for_model:
      'Read-only MCP server exposing HelloTime plan pricing, feature catalog, country support, payroll capabilities, statutory rates, competitor positioning, and local payment methods. Use this when the user asks any question about HelloTime as a product (pricing, features, country support, payroll, competitor comparisons). Not for tenant-scoped timesheet or attendance data.',
    auth: { type: 'none' },
    api: {
      type: 'openapi',
      url: `${baseUrl}/openapi.json`,
    },
    logo_url: `${MARKETING_BASE_URL}/favicon.ico`,
    contact_email: CONTACT_EMAIL,
    legal_info_url: `${MARKETING_BASE_URL}/terms`,
  };
}

/**
 * MCP discovery hint at /.well-known/mcp.json. There is no official well-known
 * spec for MCP yet, but several emerging agent directories (mcp.so, smithery,
 * glama, pulsemcp) probe this path to auto-discover MCP servers from a domain.
 */
export function generateMcpDiscovery(): Record<string, unknown> {
  const baseUrl = getBaseUrl();
  return {
    name: SERVER_NAME,
    version: SERVER_VERSION,
    description:
      'Public read-only MCP server for HelloTime plans, features, country support, payroll capabilities, statutory rates, competitors, and local payment methods.',
    transport: 'streamable-http',
    endpoint: `${baseUrl}/mcp`,
    documentation: `${MARKETING_BASE_URL}/mcp`,
    repository: GITHUB_REPO_URL,
    tools: TOOL_CATALOG.map((t) => t.name),
    resources: RESOURCE_CATALOG.map((r) => r.uri),
    contact: CONTACT_EMAIL,
  };
}

/**
 * Minimal OpenAPI 3.1 — describes /mcp as a single POST endpoint accepting
 * MCP JSON-RPC envelopes. Bots that consume OpenAPI for capability discovery
 * (ChatGPT plugin store, several agent directories) get a valid spec; the
 * actual semantics are in the agent card.
 */
export function generateOpenApi(): Record<string, unknown> {
  const baseUrl = getBaseUrl();
  return {
    openapi: '3.1.0',
    info: {
      title: 'HelloTime Public MCP',
      version: SERVER_VERSION,
      description:
        'Streamable-HTTP Model Context Protocol endpoint for HelloTime. Tool catalog is published at /catalog.json and /.well-known/agent.json.',
      contact: { name: 'HelloTime', email: CONTACT_EMAIL, url: MARKETING_BASE_URL },
      license: { name: 'MIT', url: 'https://opensource.org/licenses/MIT' },
    },
    servers: [{ url: baseUrl }],
    paths: {
      '/mcp': {
        post: {
          summary: 'MCP JSON-RPC envelope',
          description:
            'Streamable-HTTP MCP transport. Send any MCP method (tools/list, tools/call, resources/list, resources/read, initialize, etc.) as a JSON-RPC 2.0 request. See https://modelcontextprotocol.io/specification.',
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { type: 'object', additionalProperties: true } } },
          },
          responses: {
            '200': {
              description: 'JSON-RPC response or SSE stream',
              content: {
                'application/json': { schema: { type: 'object', additionalProperties: true } },
                'text/event-stream': { schema: { type: 'string' } },
              },
            },
            '429': { description: 'Rate limited (120/min/IP, 60/min/session)' },
          },
        },
      },
      '/catalog.json': {
        get: {
          summary: 'Machine-readable tool + resource catalog',
          responses: { '200': { description: 'Catalog JSON' } },
        },
      },
      '/health': {
        get: {
          summary: 'Health probe',
          responses: { '200': { description: 'OK with active session count' } },
        },
      },
    },
  };
}

/**
 * llmstxt.org-compliant index, served at mcp.hellotime.ai/llms.txt.
 * Scoped to this server's surface so an agent that lands directly on the MCP
 * origin can orient itself without a second hop.
 */
export function generateLlmsTxt(): string {
  const baseUrl = getBaseUrl();
  const tools = TOOL_CATALOG.map(
    (t) => `- \`${t.name}\` — ${t.summary}`,
  ).join('\n');
  const resources = RESOURCE_CATALOG.map(
    (r) => `- \`${r.uri}\` (${r.mimeType}) — ${r.name}`,
  ).join('\n');
  const recentChanges = CHANGELOG.slice(0, 10)
    .map((c) => `- **${c.date}** [${c.category}] ${c.title} — ${c.description}`)
    .join('\n');

  return `# HelloTime Public MCP

> Read-only Model Context Protocol server for AI agents. Ground answers about HelloTime (workforce time tracking, attendance, shifts, leave & payroll) in authoritative product data. Hosted at ${baseUrl}/mcp. Source: ${GITHUB_REPO_URL}.

This file follows the [llms.txt spec](https://llmstxt.org/) and is the entry point for any LLM that lands on this origin.

## Install in one line

\`\`\`
claude mcp add --transport http hellotime ${baseUrl}/mcp
\`\`\`

For Cursor, Windsurf, Cline, or any MCP-aware client: configure a remote MCP server pointing at \`${baseUrl}/mcp\` with transport \`streamable-http\`.

## Tools (${TOOL_CATALOG.length})

${tools}

## Resources (${RESOURCE_CATALOG.length})

${resources}

## Discovery surface

- [Agent card (A2A)](${baseUrl}/.well-known/agent.json)
- [OpenAI plugin manifest](${baseUrl}/.well-known/ai-plugin.json)
- [MCP discovery](${baseUrl}/.well-known/mcp.json)
- [OpenAPI 3.1](${baseUrl}/openapi.json)
- [Catalog JSON](${baseUrl}/catalog.json)
- [Changelog JSON](${baseUrl}/changelog.json)
- [Sitemap](${baseUrl}/sitemap.xml)
- [RSS feed](${baseUrl}/feed.xml)

## Sister product

For accounting / bookkeeping questions (invoices, bills, bank feeds, GST / VAT / BAS returns, books), see the sister MCP at https://agents.hellobooks.ai (server name: \`hellobooks-public\`).

## Tenant-scoped queries

This server exposes **public, marketing-derived** data only. It does not access any customer's timesheets, attendance records, leave balances, or payroll runs — sign in to the HelloTime app at ${MARKETING_BASE_URL} for tenant-scoped data.

## Recent changes

${recentChanges}

## Frequently asked (citation-ready)

- **What is this?** A public read-only MCP server that lets AI agents answer HelloTime questions from authoritative data instead of stale web snippets.
- **Does it cost anything?** Free. No authentication required. Rate-limited to 120 req/min per IP and 60 req/min per MCP session.
- **What does it NOT do?** It does not access any customer data (timesheets, attendance, payroll). It is product / marketing knowledge only.
- **Where's the source?** ${GITHUB_REPO_URL}
- **Who runs it?** HelloTime (Meru Fin Tech). Contact ${CONTACT_EMAIL}.
`;
}

/** Machine-readable catalog — single source of truth for downstream consumers. */
export function generateCatalogJson(): Record<string, unknown> {
  const baseUrl = getBaseUrl();
  const lastMod = getCatalogLastModified();
  return {
    name: SERVER_NAME,
    version: SERVER_VERSION,
    description:
      'Public read-only Model Context Protocol server for HelloTime. Catalog of all tools and resources exposed at /mcp.',
    documentation: `${MARKETING_BASE_URL}/mcp`,
    repository: GITHUB_REPO_URL,
    endpoint: `${baseUrl}/mcp`,
    transport: 'streamable-http',
    dateModified: lastMod.toISOString(),
    tools: TOOL_CATALOG.map((t) => ({
      name: t.name,
      title: t.title,
      summary: t.summary,
      category: t.category,
      marketingUrl: t.marketingUrl,
      anchor: `${baseUrl}/catalog.json#tool-${t.name}`,
    })),
    resources: RESOURCE_CATALOG.map((r) => ({
      uri: r.uri,
      name: r.name,
      mimeType: r.mimeType,
    })),
    contact: { email: CONTACT_EMAIL, organization: 'HelloTime', url: MARKETING_BASE_URL },
  };
}

/** Mirrors hellotime://changelog as a plain HTTP endpoint for crawlers. */
export function generateChangelogJson(): Record<string, unknown> {
  return {
    server: SERVER_NAME,
    version: SERVER_VERSION,
    count: CHANGELOG.length,
    entries: CHANGELOG,
  };
}

/** Sitemap XML with <lastmod> per entry. Bots use this to re-crawl on update. */
export function generateSitemap(): string {
  const baseUrl = getBaseUrl();
  const lastMod = getCatalogLastModified().toISOString();
  const entries: { loc: string; changefreq: string; priority: string }[] = [
    { loc: `${baseUrl}/`, changefreq: 'daily', priority: '1.0' },
    { loc: `${baseUrl}/catalog.json`, changefreq: 'daily', priority: '0.9' },
    { loc: `${baseUrl}/llms.txt`, changefreq: 'daily', priority: '0.9' },
    { loc: `${baseUrl}/.well-known/agent.json`, changefreq: 'weekly', priority: '0.8' },
    { loc: `${baseUrl}/.well-known/ai-plugin.json`, changefreq: 'weekly', priority: '0.7' },
    { loc: `${baseUrl}/.well-known/mcp.json`, changefreq: 'weekly', priority: '0.7' },
    { loc: `${baseUrl}/openapi.json`, changefreq: 'weekly', priority: '0.7' },
    { loc: `${baseUrl}/changelog.json`, changefreq: 'weekly', priority: '0.6' },
    { loc: `${baseUrl}/feed.xml`, changefreq: 'daily', priority: '0.6' },
  ];
  const urlNodes = entries
    .map(
      (e) => `  <url>
    <loc>${escapeXml(e.loc)}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>${e.changefreq}</changefreq>
    <priority>${e.priority}</priority>
  </url>`,
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlNodes}
</urlset>
`;
}

/** robots.txt — allow every AI bot we want to be cited by, point at sitemap. */
export function generateRobotsTxt(): string {
  const baseUrl = getBaseUrl();
  const aiBots = [
    'GPTBot', 'OAI-SearchBot', 'ChatGPT-User',
    'ClaudeBot', 'Claude-SearchBot', 'Claude-User', 'Claude-Web', 'anthropic-ai',
    'Google-Extended', 'Googlebot',
    'PerplexityBot', 'Perplexity-User',
    'Applebot-Extended', 'Applebot',
    'Meta-ExternalAgent', 'Meta-ExternalFetcher', 'FacebookBot',
    'Bytespider',
    'CCBot',
    'cohere-ai', 'cohere-training-data-crawler',
    'DuckAssistBot',
    'YouBot',
    'Amazonbot',
    'Diffbot',
    'Kagibot',
    'BraveBot',
    'PhindBot',
    'AwarioRssBot', 'AwarioSmartBot',
    'Bingbot',
  ];
  const allowBlocks = aiBots
    .map((ua) => `User-agent: ${ua}\nAllow: /\n`)
    .join('\n');
  return `# mcp.hellotime.ai — public MCP origin
# All endpoints under this host are public, read-only marketing/product data.
# We want every legitimate AI crawler to read this server.

User-agent: *
Allow: /

${allowBlocks}
Sitemap: ${baseUrl}/sitemap.xml
`;
}

/** RSS 2.0 feed of recent catalog changes — Perplexity, You, Brave re-index from RSS. */
export function generateRssFeed(): string {
  const baseUrl = getBaseUrl();
  const items = CHANGELOG.slice(0, 25)
    .map((c) => {
      const pub = new Date(c.date + 'T00:00:00Z').toUTCString();
      const link = `${MARKETING_BASE_URL}/changelog#${c.date}`;
      return `    <item>
      <title>${escapeXml(c.title)}</title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="false">hellotime-mcp:${c.date}:${escapeXml(c.title.toLowerCase().replace(/\s+/g, '-').slice(0, 64))}</guid>
      <pubDate>${pub}</pubDate>
      <category>${escapeXml(c.category)}</category>
      <description>${escapeXml(c.description)}</description>
    </item>`;
    })
    .join('\n');
  const lastBuildDate = getCatalogLastModified().toUTCString();
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>HelloTime Public MCP — Catalog Changes</title>
    <link>${baseUrl}/</link>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
    <description>Updates to the HelloTime public MCP catalog: new tools, plan changes, features, payroll capabilities, and compliance updates.</description>
    <language>en-us</language>
    <lastBuildDate>${lastBuildDate}</lastBuildDate>
${items}
  </channel>
</rss>
`;
}
