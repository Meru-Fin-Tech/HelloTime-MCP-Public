/**
 * Tests for src/internalAnalytics.ts — the protected internal endpoint.
 *
 * Boots a minimal express app over the router with a seeded store and verifies:
 *   - disabled (404) when ANALYTICS_ADMIN_TOKEN is unset,
 *   - 401 without / with a wrong bearer token,
 *   - 200 + correct payload with the right token,
 *   - /recent honours the limit.
 *
 * The token is toggled via process.env between requests (the router reads it at
 * call time), so a single booted server exercises every gate state.
 */

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';

import { AnalyticsStore, type AnalyticsRecord } from '../src/analyticsStore.js';
import { createInternalAnalyticsRouter } from '../src/internalAnalytics.js';

const TOKEN = 'test-admin-token-123';

function row(
  overrides: Partial<Omit<AnalyticsRecord, 'id' | 'createdAt'>> = {},
): Omit<AnalyticsRecord, 'id' | 'createdAt'> {
  return {
    endpoint: '/mcp',
    httpMethod: 'POST',
    mcpMethod: 'tools/call',
    toolName: 'list_plans',
    clientName: 'claude',
    clientType: 'ai_client',
    isBot: false,
    botName: '',
    originHost: 'claude.ai',
    refererHost: '',
    country: 'IN',
    statusCode: 200,
    success: true,
    responseTimeMs: 10,
    metadata: { transport: 'streamable-http' },
    ...overrides,
  };
}

let server: Server;
let baseUrl: string;
const store = new AnalyticsStore(100);

before(async () => {
  for (let i = 0; i < 5; i++) store.record(row({ toolName: `tool_${i}` }));

  const app = express();
  app.use('/internal/analytics', createInternalAnalyticsRouter(store));
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', resolve);
  });
  const { port } = server.address() as AddressInfo;
  baseUrl = `http://127.0.0.1:${port}`;
});

after(() => {
  delete process.env.ANALYTICS_ADMIN_TOKEN;
  server.close();
});

function get(path: string, token?: string): Promise<Response> {
  return fetch(`${baseUrl}${path}`, {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

test('returns 404 when ANALYTICS_ADMIN_TOKEN is unset (feature off)', async () => {
  delete process.env.ANALYTICS_ADMIN_TOKEN;
  const res = await get('/internal/analytics/summary', TOKEN);
  assert.equal(res.status, 404);
});

test('returns 401 when enabled but no/invalid token is presented', async () => {
  process.env.ANALYTICS_ADMIN_TOKEN = TOKEN;

  const noTok = await get('/internal/analytics/summary');
  assert.equal(noTok.status, 401);
  assert.match(noTok.headers.get('www-authenticate') ?? '', /Bearer/);

  const wrongTok = await get('/internal/analytics/summary', 'wrong');
  assert.equal(wrongTok.status, 401);
});

test('returns the summary with a valid token', async () => {
  process.env.ANALYTICS_ADMIN_TOKEN = TOKEN;
  const res = await get('/internal/analytics/summary', TOKEN);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.totalRequests, 5);
  assert.equal(body.successCount, 5);
  assert.equal(body.byClientType.ai_client, 5);
  assert.equal(body.byTool.tool_0, 1);
});

test('/recent returns newest-first rows and honours limit', async () => {
  process.env.ANALYTICS_ADMIN_TOKEN = TOKEN;
  const res = await get('/internal/analytics/recent?limit=2', TOKEN);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.records.length, 2);
  assert.equal(body.records[0].toolName, 'tool_4', 'newest first');
  // Privacy: rows carry only derived labels, never a raw UA field.
  assert.ok(!('userAgent' in body.records[0]));
});
