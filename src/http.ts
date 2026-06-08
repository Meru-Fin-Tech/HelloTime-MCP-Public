/**
 * HTTP transport entry point.
 *
 * Exposes the MCP server over Streamable HTTP at POST /mcp and SSE GET /mcp,
 * with two layers of rate limiting:
 *   1. Per-IP global limiter (catches scrapers / runaway clients).
 *   2. Per-session limiter (caps single-session requests to a reasonable bound).
 *
 * Health-check at /health, transport-agnostic JSON probe at /info.
 *
 * No authentication — by design. The catalog is public-only data.
 */

import express, { type Request, type Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { randomUUID } from 'node:crypto';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { createServer } from './server.js';
import { track } from './analytics.js';
import { emitMcpAnalytics } from './requestAnalytics.js';
import { SERVER_VERSION, SERVER_DESCRIPTION } from './version.js';

const PORT = Number(process.env.PORT ?? 8080);
const HOST = process.env.HOST ?? '0.0.0.0';

// ---------------------------------------------------------------------------
// Rate limits
// ---------------------------------------------------------------------------

/**
 * Build a 429 handler that emits an `mcp_rate_limited` telemetry event before
 * sending the rejection response. Replaces the static `message` option;
 * express-rate-limit invokes this with extra args (next, options) we ignore.
 */
function rateLimitHandler(limiter: 'ip' | 'session') {
  return (req: Request, res: Response): void => {
    track(
      'mcp_rate_limited',
      { limiter, country: req.header('cf-ipcountry') ?? 'unknown' },
      req.header('mcp-session-id') ?? 'server',
    );
    res.status(429).json({ error: `Too many requests (${limiter} rate limit).` });
  };
}

// Default keyGenerator in v7+ handles IPv4/IPv6 correctly.
const ipLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120, // 120 requests / minute / IP
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: rateLimitHandler('ip'),
});

const sessionLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60, // 60 requests / minute / session
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: rateLimitHandler('session'),
  keyGenerator: (req) => {
    const sid = req.header('mcp-session-id');
    // When no session id yet, fall back to IP via the request socket; the IP
    // limiter above already covers the IPv6-correct keying.
    return sid ?? `nosession:${req.ip ?? 'unknown'}`;
  },
});

// ---------------------------------------------------------------------------
// Transport wiring
// ---------------------------------------------------------------------------

interface SessionEntry {
  transport: StreamableHTTPServerTransport;
  lastUsedAt: number;
  createdAt: number;
}
const sessions = new Map<string, SessionEntry>();

// Reap sessions that have been idle for >30 min so memory doesn't grow
// unbounded. We track lastUsedAt (refreshed on every request) rather than
// createdAt — otherwise a long-running interactive session would be reaped
// 30 min after init regardless of activity.
const SESSION_IDLE_TTL_MS = 30 * 60 * 1000;
setInterval(() => {
  const now = Date.now();
  for (const [id, entry] of sessions) {
    if (now - entry.lastUsedAt > SESSION_IDLE_TTL_MS) {
      entry.transport.close().catch(() => {});
      sessions.delete(id);
    }
  }
  // Turn the live /health gauge into a 5-minute-resolution concurrency time
  // series in GA4. Emitted even at 0 — distinguishes "idle" from "server down"
  // (no event at all). See strategy doc 73 §6e.
  track('mcp_sessions_snapshot', { active_sessions: sessions.size }, 'server');
}, 5 * 60 * 1000).unref();

function sendJsonRpcError(
  res: Response,
  status: number,
  code: number,
  message: string,
): void {
  res.status(status).json({
    jsonrpc: '2.0',
    error: { code, message },
    id: null,
  });
}

async function handleMcpRequest(req: Request, res: Response): Promise<void> {
  const sid = req.header('mcp-session-id');

  if (sid) {
    const entry = sessions.get(sid);
    if (!entry) {
      // Unknown / expired session id (e.g. after a process restart). Per MCP
      // Streamable HTTP, returning 404 tells SDK clients to reinitialize
      // instead of looping forever on "Server not initialized".
      sendJsonRpcError(res, 404, -32001, 'Session not found. Reinitialize with `initialize`.');
      return;
    }
    entry.lastUsedAt = Date.now();
    await entry.transport.handleRequest(req, res, req.body);
    return;
  }

  // No session id — only an `initialize` POST is allowed. Anything else would
  // create an orphan transport that immediately rejects with "not initialized".
  if (req.method !== 'POST' || !isInitializeRequest(req.body)) {
    sendJsonRpcError(
      res,
      400,
      -32000,
      'Bad Request: missing mcp-session-id and request is not `initialize`.',
    );
    return;
  }

  // Country from Cloudflare's edge header — no geo-IP library, no raw IP.
  const country = req.header('cf-ipcountry') ?? 'unknown';
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (id) => {
      const now = Date.now();
      sessions.set(id, { transport, lastUsedAt: now, createdAt: now });
      track(
        'mcp_session_started',
        { session_id: id, country, transport: 'streamable-http' },
        id,
      );
    },
  });
  transport.onclose = () => {
    const closedId = transport.sessionId;
    if (!closedId) return;
    const closing = sessions.get(closedId);
    sessions.delete(closedId);
    track(
      'mcp_session_ended',
      {
        session_id: closedId,
        duration_sec: closing
          ? Math.round((Date.now() - closing.createdAt) / 1000)
          : 0,
      },
      closedId,
    );
  };
  const server = createServer();
  await server.connect(transport);

  await transport.handleRequest(req, res, req.body);
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1); // accurate req.ip behind a load balancer
app.use(express.json({ limit: '256kb' })); // requests are tiny — cap aggressively

// Permissive CORS — the catalog is public, browser-based MCP clients should
// be able to connect, and they need `mcp-session-id` exposed to read the
// session identifier off the initialize response.
app.use('/mcp', (req, res, next) => {
  res.setHeader('access-control-allow-origin', req.header('origin') ?? '*');
  res.setHeader('access-control-allow-methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader(
    'access-control-allow-headers',
    'content-type, accept, mcp-session-id, mcp-protocol-version',
  );
  res.setHeader('access-control-expose-headers', 'mcp-session-id');
  res.setHeader('access-control-max-age', '86400');
  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return;
  }
  next();
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', sessions: sessions.size });
});

app.get('/info', (_req, res) => {
  res.json({
    name: 'hellotime-mcp-public',
    version: SERVER_VERSION,
    description: SERVER_DESCRIPTION,
    transport: { http: '/mcp', sse: '/mcp' },
    install: 'claude mcp add --transport http hellotime https://mcp.hellotime.ai/mcp',
    docs: 'https://hellotime.ai/mcp',
    repository: 'https://github.com/Meru-Fin-Tech/HelloTime-MCP-Public',
  });
});

// Layer-1 transport telemetry: one event set per finished /mcp request. Mounted
// BEFORE the limiters so rate-limited (429) responses are still counted.
//
// We record on BOTH `finish` (response fully flushed) and `close` (connection
// torn down). The SSE `GET /mcp` transport keeps a stream open and is commonly
// aborted by the client mid-stream — that fires `close` WITHOUT `finish`, so a
// finish-only hook would silently miss exactly the transport we label as `sse`.
// A once-guard makes the normal path (finish, then close) emit a single event.
// When the response was not fully sent we report status 499 (client-closed)
// rather than the misleading default 200. Emission runs after the response is
// off the request path so it never delays it, and is fully wrapped (see
// emitMcpAnalytics) so a telemetry fault can never break an MCP response. CORS
// preflights (OPTIONS) already short-circuited above and never reach here.
app.use('/mcp', (req, res, next) => {
  const startedAt = Date.now();
  let emitted = false;
  const record = () => {
    if (emitted) return;
    emitted = true;
    emitMcpAnalytics(
      {
        body: req.body,
        userAgent: req.header('user-agent'),
        origin: req.header('origin'),
        referer: req.header('referer'),
        country: req.header('cf-ipcountry'),
        sessionId: req.header('mcp-session-id'),
        httpMethod: req.method,
        status: res.writableFinished ? res.statusCode : 499,
        durationMs: Date.now() - startedAt,
      },
      track,
    );
  };
  res.on('finish', record);
  res.on('close', record);
  next();
});

app.use('/mcp', ipLimiter, sessionLimiter);
const mcpRoute = (label: string) => (req: Request, res: Response) => {
  handleMcpRequest(req, res).catch((err) => {
    if (!res.headersSent) {
      res.status(500).json({ error: 'mcp-handler-failure' });
    }
    process.stderr.write(`MCP ${label} error: ${err}\n`);
  });
};
app.post('/mcp', mcpRoute('POST'));
app.get('/mcp', mcpRoute('GET'));
app.delete('/mcp', mcpRoute('DELETE'));

app.listen(PORT, HOST, () => {
  process.stdout.write(`hellotime-mcp-public listening on http://${HOST}:${PORT}\n`);
});
