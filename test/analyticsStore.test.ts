/**
 * Tests for src/analyticsStore.ts — the in-memory ring buffer + aggregates.
 *
 * Covers id/createdAt stamping, ring-buffer eviction (bounded memory),
 * cumulative aggregates surviving eviction, recent() ordering, and reset().
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { AnalyticsStore, type AnalyticsRecord } from '../src/analyticsStore.js';

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

test('record stamps a monotonic id and an ISO createdAt', () => {
  const store = new AnalyticsStore(10);
  const a = store.record(row());
  const b = store.record(row());
  assert.equal(a.id, 1);
  assert.equal(b.id, 2);
  assert.match(a.createdAt, /^\d{4}-\d{2}-\d{2}T.*Z$/);
});

test('ring buffer evicts oldest rows past capacity but ids keep climbing', () => {
  const store = new AnalyticsStore(3);
  for (let i = 0; i < 5; i++) store.record(row({ toolName: `t${i}` }));
  const recent = store.recent(10);
  assert.equal(recent.length, 3, 'only capacity rows retained');
  // Newest first: t4, t3, t2 — t0/t1 evicted.
  assert.deepEqual(
    recent.map((r) => r.toolName),
    ['t4', 't3', 't2'],
  );
  assert.equal(recent[0].id, 5);
});

test('summary aggregates are cumulative and survive eviction', () => {
  const store = new AnalyticsStore(2);
  store.record(row({ statusCode: 200, success: true }));
  store.record(row({ statusCode: 500, success: false, toolName: 'feature_search' }));
  store.record(row({ statusCode: 200, success: true, isBot: true, botName: 'GPTBot' }));

  const s = store.summary();
  assert.equal(s.totalRequests, 3, 'total counts evicted rows too');
  assert.equal(s.retained, 2);
  assert.equal(s.successCount, 2);
  assert.equal(s.errorCount, 1);
  assert.equal(s.botRequests, 1);
  assert.equal(s.byStatus['200'], 2);
  assert.equal(s.byStatus['500'], 1);
  assert.equal(s.byTool['feature_search'], 1);
  assert.equal(s.byBot['GPTBot'], 1);
  assert.equal(s.byClientType['ai_client'], 3);
});

test('avgResponseTimeMs averages retained rows and is 0 when empty', () => {
  const store = new AnalyticsStore(10);
  assert.equal(store.summary().avgResponseTimeMs, 0);
  store.record(row({ responseTimeMs: 10 }));
  store.record(row({ responseTimeMs: 30 }));
  assert.equal(store.summary().avgResponseTimeMs, 20);
});

test('recent respects the limit and reset clears everything', () => {
  const store = new AnalyticsStore(10);
  for (let i = 0; i < 5; i++) store.record(row());
  assert.equal(store.recent(2).length, 2);

  store.reset();
  assert.equal(store.recent(10).length, 0);
  const s = store.summary();
  assert.equal(s.totalRequests, 0);
  assert.deepEqual(s.byTool, {});
  // ids restart after reset.
  assert.equal(store.record(row()).id, 1);
});
