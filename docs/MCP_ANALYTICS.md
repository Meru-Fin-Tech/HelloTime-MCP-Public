# MCP Traffic Analytics

This document describes the server-side analytics that the HelloTime public MCP
server emits for traffic on the `/mcp` endpoint. It complements the scoping
[implementation plan](./mcp-analytics-implementation-plan.md).

There are **two telemetry layers** (both sent to the GA4 sink) plus a **local
store** that backs a protected internal endpoint:

| Layer | Source | Granularity | Output |
|---|---|---|---|
| **L1 — transport** | [`src/requestAnalytics.ts`](../src/requestAnalytics.ts) via [`src/http.ts`](../src/http.ts) | one set per HTTP request to `/mcp` | GA4: `mcp_request`, `mcp_tool_call`, `mcp_bot_visit`, `mcp_error` |
| **L2 — tool** | [`src/server.ts`](../src/server.ts) | one per tool execution | GA4: `mcp_session_started/ended`, `mcp_tool_called`, `mcp_tool_errored`, `mcp_resource_read`, `mcp_rate_limited`, `mcp_sessions_snapshot` |
| **Store** | [`src/analyticsStore.ts`](../src/analyticsStore.ts) | one row per finished `/mcp` request | In-memory ring buffer → internal endpoint (§10) |

This page focuses on **Layer 1** (the request-traffic analytics) and the **store**.
Layer 2 already existed; see [`src/analytics.ts`](../src/analytics.ts).

> **No database.** The store is a bounded, process-local ring buffer — it adds
> no DB, ORM, migration, or persisted file, consistent with the repo's "NO
> database, NO customer data" design. It resets to empty on restart.

---

## 1. What is tracked

For **every** request that reaches `/mcp`, after the response has finished, the
server emits an `mcp_request` event and, conditionally, up to three more.

### `mcp_request` (always)
| Param | Type | Example | Meaning |
|---|---|---|---|
| `mcp_method` | string | `tools/call` | JSON-RPC method from the request body |
| `tool_name` | string | `list_plans` | Tool/operation (see [extraction](#mcp-method--tool-extraction)) |
| `status` | number | `200` | HTTP response status code |
| `success` | boolean | `true` | `status < 400` |
| `duration_ms` | number | `14` | Wall-clock request duration |
| `client` | string | `claude` | Derived client label (see [client detection](#5-how-ai-clients-are-detected)) |
| `client_type` | string | `ai_client` | `ai_client` / `bot` / `browser` / `tool` / `unknown` |
| `bot` | string | `none` | Derived crawler label, or `none` |
| `is_bot` | boolean | `false` | Whether a known crawler was detected |
| `transport` | string | `streamable-http` | `streamable-http` (POST/DELETE) or `sse` (GET) |
| `http_method` | string | `POST` | Raw HTTP verb (`GET` / `POST` / `DELETE`) |
| `country` | string | `IN` | From the `cf-ipcountry` edge header, or `unknown` |
| `origin_host` | string (optional) | `claude.ai` | Hostname of `Origin`, IP literals dropped |
| `referer_host` | string (optional) | `chatgpt.com` | Hostname of `Referer`, IP literals dropped |

### `mcp_tool_call` (when `mcp_method === "tools/call"`)
Same param shape as `mcp_request`, so tool invocations can be analysed on their
own. `tool_name` is the invoked tool (`params.name`).

### `mcp_bot_visit` (when a known crawler is detected)
`bot`, `client`, `mcp_method`, `status`, `country`.

### `mcp_error` (when `status >= 400`)
`mcp_method`, `tool_name`, `status`, `client`, `bot`, `country`.

### Metrics → events map
| Requested metric | Where it lives |
|---|---|
| 1. Total MCP requests | count of `mcp_request` |
| 2. MCP method usage | `mcp_request.mcp_method` |
| 3. MCP tool usage | `mcp_tool_call.tool_name` (+ L2 `mcp_tool_called`) |
| 4. AI client visits | `mcp_request.client` |
| 5. Bot/crawler visits | `mcp_bot_visit` / `mcp_request.is_bot` |
| 6. Success/error count | `mcp_request.success`, `mcp_error` |
| 7. Response status code | `mcp_request.status` |
| 8. Response time | `mcp_request.duration_ms` |
| 9. User-agent client detection | `mcp_request.client` / `bot` |

---

## 2. What is NOT tracked

Never read, never sent:

- ❌ Request body **argument values** (only the JSON-RPC method and the tool
  *name* are read).
- ❌ Customer data of any kind (the server has none — the catalog is static).
- ❌ `Authorization` or any auth header.
- ❌ Cookies.
- ❌ Raw client IP address.
- ❌ Raw `User-Agent` string (it is classified into a label, then discarded).
- ❌ Full `Origin`/`Referer` URLs (only the bare hostname, and IP-literal hosts
  are dropped).

The emitted param keys are restricted to a fixed allow-list
(`mcp_method, tool_name, status, success, duration_ms, client, client_type,
bot, is_bot, transport, http_method, country, origin_host, referer_host`) —
enforced by a test. The in-memory store row (§10) holds the same derived,
bounded fields and nothing else.

---

## 3. Which analytics sink is used

The existing **GA4 Measurement Protocol v2** helper, `track()` in
[`src/analytics.ts`](../src/analytics.ts). No new sink, no database, no Prisma,
no SQL were added — consistent with the repo's "NO database, NO customer data"
design.

- Activated only when **both** `GA4_MEASUREMENT_ID` and `GA4_API_SECRET` are
  set. Otherwise `track()` is a silent no-op (no outbound calls) — local dev,
  CI, and analytics-free deploys stay silent with no extra config.
- Every send is fire-and-forget: `void fetch(...).catch(noop)`.

---

## 4. Why privacy-sensitive values are excluded

This is an **anonymous usage** server with no authentication and no user
identity. Sending raw UA, IP, full URLs, or request arguments would:

- turn anonymous telemetry into **fingerprintable / PII-bearing** data;
- risk echoing **attacker-controlled** UA text into the analytics dimension
  space (cardinality blow-up, injection into reports);
- potentially capture **free-text tool arguments** (e.g. a `feature_search`
  query) that may contain whatever a user typed.

So only **derived, bounded, non-identifying** labels leave the process. The raw
UA is classified inside [`src/clientDetect.ts`](../src/clientDetect.ts) and the
string itself is dropped.

---

## 5. How AI clients are detected

Substring match (case-insensitive) of the `User-Agent` against a fixed
allow-list in [`src/clientDetect.ts`](../src/clientDetect.ts). First match wins;
no match → `unknown` (after a browser-engine fallback → `browser`).

| Label | Matches UA containing |
|---|---|
| `chatgpt` | `chatgpt` |
| `openai` | `openai` |
| `claude` | `anthropic`, `claude` |
| `cursor` | `cursor` |
| `perplexity` | `perplexity` |
| `gemini` | `gemini` |
| `copilot` | `copilot`, `github` |
| `postman` | `postman` |
| `browser` | `mozilla`/`chrome`/`safari`/`firefox`/`edg`/`webkit`/`gecko`/`opera` |
| `unknown` | anything else (incl. empty/absent UA) |

---

## 6. How bots are detected

Independently from client detection, against this crawler allow-list (any match
sets `is_bot=true` and emits `mcp_bot_visit`):

`GPTBot`, `OAI-SearchBot`, `ClaudeBot`, `PerplexityBot`, `Google-Extended`,
`Googlebot`, `CCBot`, `Bytespider`, `Bingbot`, `Applebot`, `Amazonbot`,
`AhrefsBot`, `SemrushBot`.

A request can be both a recognised client and a bot; the two labels are
reported independently.

### MCP method / tool extraction
- `mcpMethod` = request body `method`.
- `tools/call` → `toolName` = body `params.name`.
- `tools/list` → `toolName` = `tools/list`.
- `resources/list` → `toolName` = `resources/list`.
- `prompts/list` → `toolName` = `prompts/list`.
- otherwise → `toolName` = `method` (or `unknown`).
- batched array body → `batch`.

---

## 7. How to test locally

### Unit / integration tests
```bash
npm run lint    # tsc --noEmit
npm test        # node --test (GA4 vars unset → track() no-ops)
```
Relevant suites:
- [`test/clientDetect.test.ts`](../test/clientDetect.test.ts) — client + bot labels.
- [`test/requestAnalytics.test.ts`](../test/requestAnalytics.test.ts) — event shape, failure-safety, privacy.
- [`test/http.test.ts`](../test/http.test.ts) — bot UA does not break a real response.

### Manual curl tests
Start the server (no GA4 vars needed to exercise the request path — events
simply no-op; set them to see real events in DebugView, §8):

```bash
npm run dev    # tsx watch src/http.ts on :8080
```

`tools/list` as ChatGPT (→ `mcp_request`, client `chatgpt`):
```bash
curl -s http://127.0.0.1:8080/mcp \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  -H 'user-agent: ChatGPT-User/1.0 (+https://openai.com/bot)' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

Crawler visit (→ `mcp_request` + `mcp_bot_visit`, bot `GPTBot`):
```bash
curl -s http://127.0.0.1:8080/mcp \
  -H 'content-type: application/json' \
  -H 'user-agent: Mozilla/5.0 (compatible; GPTBot/1.1; +https://openai.com/gptbot)' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

Error path (no session id + non-initialize → 400, → `mcp_request` + `mcp_error`):
```bash
curl -s -o /dev/null -w '%{http_code}\n' http://127.0.0.1:8080/mcp \
  -H 'content-type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"list_plans"}}'
```

Full initialize → tools/call flow (→ `mcp_tool_call`, tool `list_plans`):
```bash
# 1) initialize, capture the mcp-session-id response header
SID=$(curl -si http://127.0.0.1:8080/mcp \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-06-18","capabilities":{},"clientInfo":{"name":"curl","version":"0"}}}' \
  | tr -d '\r' | awk -F': ' '/^mcp-session-id/{print $2}')

# 2) call a tool on that session
curl -s http://127.0.0.1:8080/mcp \
  -H 'content-type: application/json' \
  -H 'accept: application/json, text/event-stream' \
  -H "mcp-session-id: $SID" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"list_plans","arguments":{}}}'
```

> On Windows PowerShell use `Invoke-RestMethod`/`curl.exe` equivalents; the
> payloads are identical.

---

## 8. How to verify in GA4

1. Set both env vars (a Measurement ID `G-XXXX...` and a Measurement Protocol
   API secret from **GA4 Admin → Data Streams → Measurement Protocol API
   secrets**):
   ```bash
   export GA4_MEASUREMENT_ID=G-XXXXXXXXXX
   export GA4_API_SECRET=your-mp-secret
   npm run dev
   ```
2. Send a few of the curl requests above.
3. In GA4: **Admin → DebugView** (or **Reports → Realtime**). Events arrive
   within seconds, tagged with `product = hellotime`.
4. Confirm you see `mcp_request` (and `mcp_tool_call` / `mcp_bot_visit` /
   `mcp_error` as applicable) with the expected `mcp_method`, `tool_name`,
   `client`, `bot`, `status`, and `duration_ms` params.
5. (Optional) `debug_mode` is not required for DebugView via the Measurement
   Protocol, but you can validate payload structure against the
   [GA4 MP validation endpoint](https://developers.google.com/analytics/devguides/collection/protocol/ga4/validating-events).

If no events appear: check both env vars are set (a missing one disables
analytics entirely), and that outbound HTTPS to `google-analytics.com` is
allowed from the host.

---

## 9. Deployment checklist

- [ ] `GA4_MEASUREMENT_ID` and `GA4_API_SECRET` injected as env (never
      committed). Both required; either missing = analytics off.
- [ ] No new env var beyond those two; **no DB / Prisma / SQL** added.
- [ ] `npm run lint` and `npm test` green.
- [ ] Server sits behind the TLS load balancer with `cf-ipcountry` populated
      (otherwise `country` reports `unknown` — harmless).
- [ ] Outbound HTTPS to `www.google-analytics.com` permitted from the runtime.
- [ ] Smoke-test post-deploy: run a curl request and confirm an `mcp_request`
      in GA4 DebugView.
- [ ] Existing MCP behaviour unchanged (analytics is request-finish only and
      fully wrapped — a telemetry fault cannot affect responses).
- [ ] `ANALYTICS_ADMIN_TOKEN` set only if you want the internal endpoint (§10)
      enabled; otherwise leave blank (every route 404s).

---

## 10. In-memory store & protected internal endpoint

Alongside the GA4 events, each finished `/mcp` request is recorded as one
structured row in a process-local **ring buffer**
([`src/analyticsStore.ts`](../src/analyticsStore.ts)) — the repo's DB-free
"storage" layer. The buffer is bounded (default 1000 rows; oldest evicted),
holds **no** raw UA / IP / body / args / auth headers / cookies, and is **not
persisted** — a restart starts it empty.

### Record fields
`id`, `createdAt`, `endpoint`, `httpMethod`, `mcpMethod`, `toolName`,
`clientName`, `clientType`, `isBot`, `botName`, `originHost`, `refererHost`,
`country`, `statusCode`, `success`, `responseTimeMs`, `metadata`. `id` is a
per-process counter and `createdAt` is stamped on insert; both reset on restart.
`metadata` carries only derived scalars (e.g. `{ transport }`).

### Layering
The flow follows the repo's existing module idiom (no classes-per-layer dogma):

| Role | Module |
|---|---|
| Repository (storage) | [`src/analyticsStore.ts`](../src/analyticsStore.ts) — `AnalyticsStore`, singleton `analyticsStore` |
| Service (build row + events) | [`src/requestAnalytics.ts`](../src/requestAnalytics.ts) — `buildMcpRecord`, `emitMcpAnalytics` |
| Controller (HTTP) | [`src/internalAnalytics.ts`](../src/internalAnalytics.ts) — `createInternalAnalyticsRouter` |

The store sink is passed to `emitMcpAnalytics` from
[`src/http.ts`](../src/http.ts) as a third argument; it runs in its own
try/catch, independent of the GA4 path, so neither can break the response.

### Endpoint
Mounted at `/internal/analytics`, **outside** `/mcp`, and **off by default**:

- `ANALYTICS_ADMIN_TOKEN` unset → every route returns `404` (feature disabled).
- Set the token → authenticate with `Authorization: Bearer <token>`
  (constant-time compare; missing/invalid → `401`).

| Route | Returns |
|---|---|
| `GET /internal/analytics/summary` | Cumulative aggregates: totals, success/error/bot counts, avg response time, and counts by method / tool / client / clientType / bot / status. |
| `GET /internal/analytics/recent?limit=N` | The `N` most recent rows (newest first), `1 ≤ N ≤ 1000`, default 100. |

```bash
export ANALYTICS_ADMIN_TOKEN=$(openssl rand -hex 32)
npm run dev
# ... drive some /mcp traffic ...
curl -s http://127.0.0.1:8080/internal/analytics/summary \
  -H "authorization: Bearer $ANALYTICS_ADMIN_TOKEN"
curl -s "http://127.0.0.1:8080/internal/analytics/recent?limit=20" \
  -H "authorization: Bearer $ANALYTICS_ADMIN_TOKEN"
```

> Aggregate counters are cumulative (they survive ring-buffer eviction);
> `avgResponseTimeMs` is over the rows currently retained.
