# MCP Analytics — Implementation Plan

**Repo:** `HelloTime-MCP-Public`
**Status:** Plan only — no code changed.
**Date:** 2026-06-06
**Public endpoint:** `https://mcp.hellotime.ai/mcp` (per `src/http.ts` `/info`). The
`PASTE_HELLO_TIME_MCP_ENDPOINT_HERE` placeholder in the brief was not needed — the
inspection was done against the local source tree.

---

## TL;DR

The repo **already has a working analytics sink**: GA4 Measurement Protocol v2, gated
on two env vars, fire-and-forget, privacy-conscious (`src/analytics.ts`). It already
tracks sessions, tool calls, tool errors, resource reads, rate-limits, and a
5-minute concurrency snapshot.

The 9 requested metrics are **partly covered**. The single missing piece is an
**HTTP request-level event** that captures *every* request to `/mcp` with its JSON-RPC
method, response status, duration, success flag, and a **privacy-safe classification of
the User-Agent** (AI client vs. bot vs. other). No database, no new env var, and no new
dependency are required.

---

## Part 1 — Repo inspection (answers to the 10 questions)

### 1. Where the MCP route is mounted
[`src/http.ts`](../src/http.ts). Routes are mounted on the path `/mcp`:
- `app.post('/mcp', ...)` — Streamable HTTP (line ~230)
- `app.get('/mcp', ...)` — SSE stream (line ~231)
- `app.delete('/mcp', ...)` — session teardown (line ~232)
- Rate limiters chained ahead of them: `app.use('/mcp', ipLimiter, sessionLimiter)` (line ~221)
- Also: `GET /health` and `GET /info` (non-MCP).

### 2. Which file handles MCP requests
- [`src/http.ts`](../src/http.ts) — transport/HTTP layer. `handleMcpRequest()` owns
  session lookup, session creation on `initialize`, and delegates to the SDK transport.
- [`src/server.ts`](../src/server.ts) — the `McpServer` factory. `runTool()` here wraps
  every tool and already emits per-tool telemetry.
- [`src/stdio.ts`](../src/stdio.ts) — alternative STDIO entry point (local installs). It
  shares `createServer()`, so tool-level analytics work there too, but the HTTP request
  metrics in this plan are HTTP-only by nature.

### 3. Server style
**Express** (v4) — `import express from 'express'` in `src/http.ts`. Uses
`express-rate-limit`, `express.json({ limit: '256kb' })`, `trust proxy = 1`. Not
Fastify, not Next.js, not Cloudflare Workers (though it reads Cloudflare's
`cf-ipcountry` edge header and is meant to sit behind a TLS LB).

### 4. Existing analytics/telemetry helper
**Yes.** [`src/analytics.ts`](../src/analytics.ts) exports:
- `track(eventName, params, clientId)` — fire-and-forget GA4 MP POST, `void fetch(...).catch(noop)`.
- `analyticsEnabled()` — true only when both GA4 vars are set.

Events already emitted:

| Event | Where | Params |
|---|---|---|
| `mcp_session_started` | http.ts | `session_id`, `country`, `transport` |
| `mcp_session_ended` | http.ts | `session_id`, `duration_sec` |
| `mcp_sessions_snapshot` | http.ts (every 5 min) | `active_sessions` |
| `mcp_rate_limited` | http.ts | `limiter`, `country` |
| `mcp_tool_called` | server.ts | `tool_name`, `arg_keys`, `latency_ms`, `success` |
| `mcp_tool_errored` | server.ts | `tool_name`, `error_class` |
| `mcp_resource_read` | server.ts | `resource_name` |

**This is the sink to reuse.** Do not introduce a second one.

### 5. Database
**No database — intentionally.** `.env.example` and `README.md` both state "NO database,
NO customer data." All catalogs are static modules in `src/data/`. Analytics is sent
straight to GA4; nothing is persisted server-side. **We will not add one.**

### 6. GA4 Measurement Protocol already configured
**Yes.** `src/analytics.ts` posts to `https://www.google-analytics.com/mp/collect` using
`GA4_MEASUREMENT_ID` + `GA4_API_SECRET`. Both must be set or the whole layer no-ops.
Documented in `.env.example` (lines 21–40) and `README.md` (Deployment). Injected at
deploy time; never committed.

### 7. Where middleware / request tracking should be added
In [`src/http.ts`](../src/http.ts), as a **single Express middleware scoped to `/mcp`**,
placed **after** `express.json()` (so `req.body.method` is parsed) and **after** the CORS
short-circuit, but it should record on response completion via `res.on('finish')` so it
captures the final status code and total duration. Mount it alongside / just before the
existing `app.use('/mcp', ipLimiter, sessionLimiter)` chain so rate-limited (429)
responses are also counted.

### 8. Files to create or modify
**Create**
- `src/clientDetect.ts` — pure User-Agent classifier. Input: raw UA string. Output: a
  small enum/struct (`client_class`, `client_name`) — **never** the raw UA.
- `test/clientDetect.test.ts` — unit tests for the classifier.

**Modify**
- `src/http.ts` — add the `/mcp` request-tracking middleware + JSON-RPC method extraction.
- `test/http.test.ts` — assert the middleware fires and that no raw UA / IP is forwarded.
- `README.md` — extend the telemetry note with the new `mcp_request` event.
- `.env.example` — only a one-line comment update (no new variable).

**No change needed**
- `src/analytics.ts` — `track()` is already generic; the new event uses it as-is.
- `src/server.ts`, `src/stdio.ts`, `Dockerfile`, `package.json`.

### 9. Privacy risks
The repo's existing bar is strict; the new code must hold it:
- **Raw User-Agent** — do NOT send it. UA strings can be fingerprinting / semi-PII.
  Send only the derived `client_class` (`ai_client` | `bot` | `browser` | `other`) and a
  coarse `client_name` (e.g. `claude`, `chatgpt`, `cursor`, `gptbot`) from an allow-list.
  Anything unmatched → `other` / empty name.
- **Raw IP** — never sent today; the middleware must not start. Keep using
  `cf-ipcountry` for geography only.
- **Auth tokens / cookies** — there is no auth, but the middleware must not read or
  forward `Authorization`/`Cookie` headers.
- **Request body / tool-arg values** — only the JSON-RPC `method` name (and, for
  `tools/call`, the tool name which is already non-PII) may be read. Never `params`
  values. Handle batch arrays by labelling `batch` rather than enumerating.
- **Cardinality** — keep `client_name` on a fixed allow-list so GA4 dimensions don't
  explode and so we never echo arbitrary attacker-controlled UA text into analytics.

### 10. Deployment / env changes required
**None mandatory.** The feature rides on the existing `GA4_MEASUREMENT_ID` /
`GA4_API_SECRET`. With them unset (local/dev/test) the new event no-ops exactly like the
rest. No new container env, no port change, no new dependency. Only a docs/comment touch.

---

## Part 2 — Coverage map (the 9 goals → events)

| # | Goal | Status today | After this plan |
|---|---|---|---|
| 1 | Total MCP requests | ✗ none | `mcp_request` fired once per `/mcp` request |
| 2 | MCP method usage | ✗ none | `rpc_method` param (`initialize`, `tools/list`, `tools/call`, `resources/read`, `ping`, `batch`, …) |
| 3 | MCP tool usage | ✓ `mcp_tool_called` | unchanged |
| 4 | AI client visits | ~ partial (session only) | `client_class=ai_client` + `client_name` |
| 5 | Bot/crawler visits | ✗ none | `client_class=bot` + `client_name` |
| 6 | Success/error count | ~ tool-level only | `success` boolean on every request (status < 400) |
| 7 | Response status code | ✗ none | `status` param (200/400/404/429/500) |
| 8 | Response time | ~ tool-level only | `duration_ms` param (full HTTP request) |
| 9 | UA-based client detection | ✗ none | `src/clientDetect.ts` → `client_class`/`client_name` |

---

## Part 3 — Step-by-step implementation

### Step 1 — `src/clientDetect.ts` (new)
A pure, dependency-free function. Shape:

```ts
export type ClientClass = 'ai_client' | 'bot' | 'browser' | 'other';
export interface ClientInfo { client_class: ClientClass; client_name: string; }

// Allow-listed, lowercase substring → (class, name). Order: AI clients, then bots.
export function classifyUserAgent(ua: string | undefined): ClientInfo;
```

Rules:
- `undefined`/empty → `{ client_class: 'other', client_name: '' }`.
- Match against a small **allow-list** of substrings (case-insensitive), e.g.
  AI clients: `claude`, `anthropic`, `chatgpt`, `openai`, `cursor`, `cline`,
  `continue`, `librechat`, `mcp`; bots/crawlers: `gptbot`, `claudebot`,
  `perplexity`, `bingbot`, `googlebot`, `bot`, `crawler`, `spider`, `slurp`;
  browsers: `mozilla`/`chrome`/`safari` → `browser`.
- First match wins; otherwise `other`. **Return only the bucket — never the raw UA.**

### Step 2 — `src/http.ts` request-tracking middleware
- Import `track` (already imported) and `classifyUserAgent`.
- Add a helper to pull the JSON-RPC method safely:

```ts
function rpcMethodOf(body: unknown, httpMethod: string): string {
  if (Array.isArray(body)) return 'batch';
  if (body && typeof body === 'object' && typeof (body as any).method === 'string') {
    return (body as any).method;
  }
  return httpMethod === 'GET' ? 'sse_stream'
       : httpMethod === 'DELETE' ? 'session_delete'
       : 'unknown';
}
```

- Register the middleware on `/mcp` **before** the limiter chain so 429s are counted,
  and record on `finish`:

```ts
app.use('/mcp', (req, res, next) => {
  const startedAt = Date.now();
  res.on('finish', () => {
    const { client_class, client_name } = classifyUserAgent(req.header('user-agent'));
    track(
      'mcp_request',
      {
        rpc_method: rpcMethodOf(req.body, req.method),
        http_method: req.method,
        status: res.statusCode,
        success: res.statusCode < 400,
        duration_ms: Date.now() - startedAt,
        client_class,
        client_name,           // '' when unmatched
        transport: req.method === 'GET' ? 'sse' : 'streamable-http',
        country: req.header('cf-ipcountry') ?? 'unknown',
      },
      req.header('mcp-session-id') ?? 'server',
    );
  });
  next();
});
```

Notes:
- `res.on('finish')` runs after the response is fully sent — non-blocking, and `track()`
  itself is already fire-and-forget, so analytics failure can never break the response.
- For long-lived SSE (`GET /mcp`), `finish` fires when the stream closes; `duration_ms`
  then reflects connection lifetime. Acceptable; document it.
- Keep this middleware's body tiny and wrap nothing in `await`.

### Step 3 — Tests
- `test/clientDetect.test.ts` — table-driven: Claude UA → `ai_client/claude`, GPTBot →
  `bot/gptbot`, plain Chrome → `browser`, empty → `other/''`, **and a case asserting the
  raw UA never appears in the output object**.
- `test/http.test.ts` — extend the existing booted-server test to send a request with a
  `user-agent` header and assert a normal 200/400 path still works (the event is
  fire-and-forget so just assert no regression; optionally stub GA4 by leaving env unset
  so `track` no-ops, matching current test style).

### Step 4 — Docs
- `README.md` Deployment section: add `mcp_request` to the event list and reiterate "no
  raw User-Agent, no IP — only a classified client bucket."
- `.env.example`: one comment line noting request-level metrics are covered by the same
  GA4 vars (no new variable).

### Step 5 — Verify
```bash
npm run lint   # tsc --noEmit
npm test       # node --test (analytics no-ops with GA4 vars unset)
```
Optionally smoke-test locally with GA4 vars set and confirm `mcp_request` events land in
GA4 Realtime → DebugView.

---

## Design rules carried over from `src/analytics.ts` (do not relax)
1. **Fire-and-forget** — never delay/block/fail a request. `res.on('finish')` + `void fetch().catch(noop)`.
2. **No-op when GA4 vars unset** — no new required config.
3. **Scalar params only** — GA4 stores no nested objects/arrays; batch → `'batch'` string.
4. **No PII** — no raw UA, no raw IP, no headers beyond `cf-ipcountry`, no body values.

## Out of scope
- No database / persistence.
- No new runtime dependency (no `ua-parser-js` — the allow-list classifier is enough and
  keeps cardinality and the dependency surface controlled).
- No changes to tool-level events (already adequate for goal #3).
