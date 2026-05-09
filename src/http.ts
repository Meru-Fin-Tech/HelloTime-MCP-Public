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

const PORT = Number(process.env.PORT ?? 8080);
const HOST = process.env.HOST ?? '0.0.0.0';

// ---------------------------------------------------------------------------
// Rate limits
// ---------------------------------------------------------------------------

// Default keyGenerator in v7+ handles IPv4/IPv6 correctly.
const ipLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120, // 120 requests / minute / IP
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP. Limit: 120/min.' },
});

const sessionLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 60, // 60 requests / minute / session
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many requests on this session. Limit: 60/min.' },
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

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
    onsessioninitialized: (id) => {
      sessions.set(id, { transport, lastUsedAt: Date.now() });
    },
  });
  transport.onclose = () => {
    if (transport.sessionId) sessions.delete(transport.sessionId);
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
    version: '0.1.2',
    description:
      'Public read-only MCP server for HelloTime plans, features, country support, and payroll capabilities.',
    transport: { http: '/mcp', sse: '/mcp' },
    install: 'claude mcp add --transport http hellotime https://mcp.hellotime.ai/mcp',
    docs: 'https://hellotime.ai/mcp',
    repository: 'https://github.com/Meru-Fin-Tech/HelloTime-MCP-Public',
  });
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
