/**
 * HTTP transport edge-case tests. Boots the real express app on a random port
 * and hits it with raw fetch — no MCP client SDK — so we can verify the wire
 * behavior matches the spec.
 */

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..');

let proc: ChildProcess;
let baseUrl: string;

before(async () => {
  const port = 18080 + Math.floor(Math.random() * 1000);
  baseUrl = `http://127.0.0.1:${port}`;
  proc = spawn(
    process.execPath,
    ['--import', 'tsx', path.join(PROJECT_ROOT, 'src/http.ts')],
    {
      env: { ...process.env, PORT: String(port), HOST: '127.0.0.1' },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  // Wait for the listen log line.
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('server boot timeout')), 10_000);
    proc.stdout!.on('data', (chunk: Buffer) => {
      if (chunk.toString().includes('listening on')) {
        clearTimeout(timer);
        resolve();
      }
    });
    proc.on('exit', (code) => reject(new Error(`server exited early: ${code}`)));
  });
});

after(async () => {
  proc.kill('SIGTERM');
  await sleep(50);
});

async function rpc(body: object, headers: Record<string, string> = {}): Promise<Response> {
  return fetch(`${baseUrl}/mcp`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'accept': 'application/json, text/event-stream',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

test('GET /health returns ok', async () => {
  const res = await fetch(`${baseUrl}/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, 'ok');
});

test('POST /mcp without session-id and non-initialize body returns 400', async () => {
  const res = await rpc({ jsonrpc: '2.0', id: 1, method: 'tools/list' });
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.error.code, -32000);
  assert.match(body.error.message, /initialize/);
});

test('POST /mcp with unknown session-id returns 404 so client can recover', async () => {
  const res = await rpc(
    { jsonrpc: '2.0', id: 1, method: 'tools/list' },
    { 'mcp-session-id': '00000000-0000-0000-0000-000000000000' },
  );
  assert.equal(res.status, 404);
  const body = await res.json();
  assert.equal(body.error.code, -32001);
  assert.match(body.error.message, /Reinitialize/);
});

test('OPTIONS /mcp preflight returns 204 and exposes mcp-session-id', async () => {
  const res = await fetch(`${baseUrl}/mcp`, {
    method: 'OPTIONS',
    headers: {
      origin: 'https://example.com',
      'access-control-request-method': 'POST',
      'access-control-request-headers': 'content-type, mcp-session-id',
    },
  });
  assert.equal(res.status, 204);
  assert.match(
    res.headers.get('access-control-expose-headers') ?? '',
    /mcp-session-id/i,
  );
  assert.match(
    res.headers.get('access-control-allow-methods') ?? '',
    /DELETE/,
  );
});

test('request with a bot User-Agent still gets a normal MCP response', async () => {
  // The request-analytics middleware runs on `finish`; a crawler UA must not
  // change the response. (GA4 vars are unset here, so `track` is a no-op.)
  const res = await rpc(
    { jsonrpc: '2.0', id: 1, method: 'tools/list' },
    {
      'user-agent': 'Mozilla/5.0 (compatible; GPTBot/1.1; +https://openai.com/gptbot)',
    },
  );
  // No session id + non-initialize → the usual 400, unaffected by analytics.
  assert.equal(res.status, 400);
  const body = await res.json();
  assert.equal(body.error.code, -32000);
});

test('initialize returns a session id usable for follow-ups', async () => {
  const init = await rpc({
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2025-06-18',
      capabilities: {},
      clientInfo: { name: 'http-test', version: '0.0.1' },
    },
  });
  assert.equal(init.status, 200);
  const sid = init.headers.get('mcp-session-id');
  assert.ok(sid, 'expected mcp-session-id header');

  // Drain the SSE body so the connection releases.
  await init.text();

  const tools = await rpc(
    { jsonrpc: '2.0', id: 2, method: 'tools/list' },
    { 'mcp-session-id': sid! },
  );
  assert.equal(tools.status, 200);
  const text = await tools.text();
  assert.match(text, /list_plans/);
  assert.match(text, /feature_search/);
});
