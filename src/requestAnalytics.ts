/**
 * HTTP request-level MCP telemetry — builds GA4 events from one finished
 * `/mcp` request and hands them to the existing fire-and-forget sink.
 *
 * This is the Layer-1 (transport) counterpart to the Layer-2 tool telemetry in
 * server.ts. It runs from an Express `res.on('finish')` callback, so it sees
 * the final status code and total duration without delaying the response.
 *
 * Privacy contract (mirrors src/analytics.ts — do not relax):
 *   - The raw User-Agent is classified here and discarded; only the derived
 *     `client` / `bot` labels leave this module.
 *   - No request body argument *values*, no auth headers, no cookies, and no
 *     raw IP are ever read. Geography comes from the edge `cf-ipcountry`
 *     header; an optional `origin_host` is the hostname only (IP literals
 *     dropped).
 *   - Nothing here throws: `emitMcpAnalytics` is wrapped so a telemetry bug can
 *     never surface to — or break — an MCP response.
 */

import { detectClient } from './clientDetect.js';

/** Flat, GA4-safe params. No nested objects, no arrays. */
export type EventParams = Record<string, string | number | boolean>;

export interface AnalyticsEvent {
  name: string;
  params: EventParams;
  clientId: string;
}

/** Sink signature — matches `track` from src/analytics.ts. */
export type TrackFn = (name: string, params: EventParams, clientId: string) => void;

/**
 * Everything `buildMcpEvents` needs, all already safe to read. The raw UA is
 * passed only so it can be classified; it is never copied into an event.
 */
export interface McpRequestMeta {
  /** Parsed JSON-RPC body (express.json output). Read for `method`/tool only. */
  body: unknown;
  /** Raw User-Agent — classified then discarded. */
  userAgent?: string;
  /** `Origin` header, if any — reduced to a hostname. */
  origin?: string;
  /** `Referer` header, if any — fallback for `origin`. */
  referer?: string;
  /** Cloudflare edge country header. */
  country?: string;
  /** Opaque MCP session id (used as GA4 client_id). */
  sessionId?: string;
  /** HTTP verb (GET → SSE stream, POST → JSON-RPC, DELETE → teardown). */
  httpMethod: string;
  /** Final HTTP status code. */
  status: number;
  /** Wall-clock request duration in ms. */
  durationMs: number;
}

interface McpShape {
  method: string;
  tool: string;
}

/**
 * Derive the JSON-RPC method and a tool/operation name from the request body,
 * per the agreed mapping:
 *   - tools/call      → params.name (the invoked tool)
 *   - tools/list      → 'tools/list'
 *   - resources/list  → 'resources/list'
 *   - prompts/list    → 'prompts/list'
 *   - anything else   → the method name (or 'unknown')
 * Batched arrays are labelled `batch` rather than enumerated.
 */
export function extractMcp(body: unknown): McpShape {
  if (Array.isArray(body)) return { method: 'batch', tool: 'batch' };

  const b = body as
    | { method?: unknown; params?: { name?: unknown } }
    | undefined
    | null;
  const method = typeof b?.method === 'string' ? b.method : 'unknown';

  let tool: string;
  switch (method) {
    case 'tools/call':
      tool = typeof b?.params?.name === 'string' ? b.params.name : 'unknown';
      break;
    case 'tools/list':
    case 'resources/list':
    case 'prompts/list':
      tool = method;
      break;
    default:
      tool = method || 'unknown';
  }
  return { method, tool };
}

/** True for bare IPv4/IPv6 literals we should not forward as a "host". */
function isIpLiteral(host: string): boolean {
  return /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) || host.includes(':');
}

/**
 * Reduce an Origin/Referer to a bare hostname, or '' when unsafe/absent.
 * Only the host is kept — never the path or query — and IP literals are
 * dropped so this can never become a raw-IP leak.
 */
export function safeHost(origin?: string, referer?: string): string {
  const raw = (origin && origin !== 'null' ? origin : '') || referer || '';
  if (!raw) return '';
  try {
    const host = new URL(raw).hostname.toLowerCase();
    if (!host || isIpLiteral(host)) return '';
    return host;
  } catch {
    return '';
  }
}

/**
 * Build the GA4 events for one finished request. Pure and total: never throws,
 * never performs I/O. Always emits `mcp_request`; conditionally adds
 * `mcp_tool_call` (tools/call), `mcp_bot_visit` (recognised crawler), and
 * `mcp_error` (status >= 400).
 */
export function buildMcpEvents(meta: McpRequestMeta): AnalyticsEvent[] {
  const { method, tool } = extractMcp(meta.body);
  const { client, bot, is_bot } = detectClient(meta.userAgent);
  const country = meta.country ?? 'unknown';
  const host = safeHost(meta.origin, meta.referer);
  const clientId = meta.sessionId ?? 'server';
  const status = meta.status;
  const transport = meta.httpMethod === 'GET' ? 'sse' : 'streamable-http';

  const base: EventParams = {
    mcp_method: method,
    tool_name: tool,
    status,
    success: status < 400,
    duration_ms: meta.durationMs,
    client,
    bot: bot || 'none',
    is_bot,
    transport,
    country,
  };
  if (host) base.origin_host = host;

  const events: AnalyticsEvent[] = [
    { name: 'mcp_request', params: base, clientId },
  ];

  if (method === 'tools/call') {
    events.push({ name: 'mcp_tool_call', params: { ...base }, clientId });
  }
  if (is_bot) {
    events.push({
      name: 'mcp_bot_visit',
      params: {
        bot: bot || 'unknown',
        client,
        mcp_method: method,
        status,
        country,
      },
      clientId,
    });
  }
  if (status >= 400) {
    events.push({
      name: 'mcp_error',
      params: {
        mcp_method: method,
        tool_name: tool,
        status,
        client,
        bot: bot || 'none',
        country,
      },
      clientId,
    });
  }

  return events;
}

/**
 * Build and emit the events through `sink`, swallowing every error. This is the
 * single entry point the HTTP layer calls; it guarantees analytics can never
 * throw into the request lifecycle, satisfying "analytics failure must never
 * break an MCP response".
 */
export function emitMcpAnalytics(meta: McpRequestMeta, sink: TrackFn): void {
  try {
    for (const ev of buildMcpEvents(meta)) {
      try {
        sink(ev.name, ev.params, ev.clientId);
      } catch {
        /* one bad event must not stop the others */
      }
    }
  } catch {
    /* defence in depth — emitMcpAnalytics never throws */
  }
}
