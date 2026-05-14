# HelloTime Public MCP Server

A public, read-only [Model Context Protocol](https://modelcontextprotocol.io) server
that lets AI agents answer questions about HelloTime accurately — pricing, features
(shifts, rosters, leave, timesheets, GPS, biometric kiosk), country support, and
payroll capabilities — instead of relying on stale web snippets.

> This is the **public** server. It exposes only marketing-derived, public-domain data.
> The authenticated MCP server that reads a customer's timesheets, rosters and payroll
> lives in a separate, private repo.

## Install

### Claude Code / Claude Desktop / Cursor

```bash
claude mcp add --transport http hellotime https://mcp.hellotime.ai/mcp
```

Or, for local development:

```bash
claude mcp add hellotime-local node /path/to/HelloTime-MCP-Public/dist/stdio.js
```

## Tools

| Tool | Description |
| --- | --- |
| `list_plans` | All HelloTime plans (Free, Attend, Track, Pro, Business) with launch + list prices in 8 currencies, plus volume and annual prepay discount tables. Free is permanent for teams up to 5 employees; paid tiers each include a 7-day free trial. Optional `country` and `plan` filters. |
| `list_features` | HelloTime features across 14 categories: shifts, rosters, leave, timesheets, time tracking, productivity, GPS / geofence, biometric kiosk, payroll, invoicing, analytics, projects, reports, integrations. Optional `category` and `plan` filters. |
| `country_support` | Per-country feature availability and product positioning across IN, AU, GB, US, CA, AE, SG, NZ. |
| `payroll_capabilities` | For a given country, the supported payroll engines with status. AU STP2 + super, IN PF/ESI/TDS/Form 24Q, US W-2/1099, UK RTI, etc. |
| `statutory_rates` | Statutory payroll-rate entries with rate, ceiling, slab, authority and verification status. IN block (PF / EPS / EDLI / PF admin / ESI / Professional Tax across 7 states / TDS slabs) is internally-reviewed against EPFO / ESIC / state notifications. AU and US entries are public-source-unreviewed. Optional `country`, `scheme`, `category`, `state`, `party`, `verification`, and `id` filters. |
| `feature_search` | Free-text search across plan features, product features, country features, payroll engines, and statutory rates. Queries like `PF rate` or `PT slab Maharashtra` surface the matching statutory rate entry near the top. |

## Resources

| URI | Description |
| --- | --- |
| `hellotime://about` | Markdown product summary. |
| `hellotime://changelog` | Last 50 release notes as JSON. |

## Security posture

- **Read-only by construction.** No tool mutates state. No tool reaches a customer system.
- **Public data only.** All catalog content is sourced from the public marketing site.
- **No authentication.** Intentional — this is a knowledge endpoint.
- **Rate-limited.** 120 req/min per IP, 60 req/min per session.
- **Audit gate.** `npm run audit:public-data` blocks deploys if any PII / auth token strings appear in `src/data/`.

## Development

```bash
npm install
npm run dev         # HTTP server on :8080 with watch mode
npm run dev:stdio   # stdio transport for local MCP client testing
npm test            # node:test runner
npm run build
npm run audit:public-data
```

### Project layout

```
src/
  data/             # Static catalogs — plans, features, countries, about
  tools/            # One file per MCP tool
  resources/        # MCP resource registry
  server.ts         # MCP server factory (wires tools + resources)
  http.ts           # Streamable HTTP transport with rate limiting
  stdio.ts          # stdio transport entry point
test/
  tools.test.ts
  resources.test.ts
  public-data.test.ts  # Audit gate
scripts/
  audit-public-data.ts  # CI-callable audit
```

## Deployment

Containerised — see `Dockerfile`. Designed to run behind a TLS-terminating load balancer.
Set `PORT` and `HOST` via environment.

```bash
docker build -t hellotime-mcp-public .
docker run -p 8080:8080 hellotime-mcp-public
```

## Discoverability

- Listed in the [MCP registry](https://github.com/modelcontextprotocol/registry).
- Linked from the marketing site footer and `/mcp` page.
- Referenced in `https://hellotime.ai/llms.txt`.

## License

MIT — see `LICENSE`.
