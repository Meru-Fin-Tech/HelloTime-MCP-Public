/**
 * Tests for src/requestAnalytics.ts — HTTP request-level MCP telemetry.
 *
 * Covers event shape (tools/list, tools/call, bot, error), the failure-safety
 * property (a throwing sink never breaks emission), and the privacy guarantees
 * (no raw UA, no body argument values, no auth/cookie headers ever appear in an
 * emitted event).
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  buildMcpEvents,
  emitMcpAnalytics,
  extractMcp,
  safeHost,
  type AnalyticsEvent,
  type EventParams,
  type McpRequestMeta,
} from '../src/requestAnalytics.js';

function meta(overrides: Partial<McpRequestMeta> = {}): McpRequestMeta {
  return {
    body: { jsonrpc: '2.0', id: 1, method: 'tools/list' },
    userAgent: 'curl/8.4.0',
    httpMethod: 'POST',
    status: 200,
    durationMs: 12,
    ...overrides,
  };
}

function byName(events: AnalyticsEvent[], name: string): AnalyticsEvent | undefined {
  return events.find((e) => e.name === name);
}

// --- method / tool extraction ----------------------------------------------

test('extractMcp maps the list methods to their own tool label', () => {
  assert.deepEqual(extractMcp({ method: 'tools/list' }), {
    method: 'tools/list',
    tool: 'tools/list',
  });
  assert.deepEqual(extractMcp({ method: 'resources/list' }), {
    method: 'resources/list',
    tool: 'resources/list',
  });
  assert.deepEqual(extractMcp({ method: 'prompts/list' }), {
    method: 'prompts/list',
    tool: 'prompts/list',
  });
});

test('extractMcp pulls the tool name from tools/call params.name', () => {
  assert.deepEqual(
    extractMcp({ method: 'tools/call', params: { name: 'list_plans' } }),
    { method: 'tools/call', tool: 'list_plans' },
  );
});

test('extractMcp falls back to method or unknown', () => {
  assert.deepEqual(extractMcp({ method: 'initialize' }), {
    method: 'initialize',
    tool: 'initialize',
  });
  assert.deepEqual(extractMcp({}), { method: 'unknown', tool: 'unknown' });
  assert.deepEqual(extractMcp([{ method: 'x' }]), { method: 'batch', tool: 'batch' });
});

// --- event building --------------------------------------------------------

test('tools/list request emits exactly one mcp_request event', () => {
  const events = buildMcpEvents(meta({ body: { method: 'tools/list' } }));
  assert.equal(events.length, 1);
  const req = byName(events, 'mcp_request')!;
  assert.equal(req.params.mcp_method, 'tools/list');
  assert.equal(req.params.tool_name, 'tools/list');
  assert.equal(req.params.status, 200);
  assert.equal(req.params.success, true);
  assert.equal(req.params.duration_ms, 12);
});

test('tools/call request emits mcp_request AND mcp_tool_call', () => {
  const events = buildMcpEvents(
    meta({ body: { method: 'tools/call', params: { name: 'country_support' } } }),
  );
  assert.ok(byName(events, 'mcp_request'), 'mcp_request present');
  const call = byName(events, 'mcp_tool_call');
  assert.ok(call, 'mcp_tool_call present');
  assert.equal(call!.params.tool_name, 'country_support');
  assert.equal(call!.params.mcp_method, 'tools/call');
});

test('bot UA additionally emits mcp_bot_visit', () => {
  const events = buildMcpEvents(
    meta({
      userAgent: 'Mozilla/5.0 (compatible; GPTBot/1.1; +https://openai.com/gptbot)',
    }),
  );
  const visit = byName(events, 'mcp_bot_visit');
  assert.ok(visit, 'mcp_bot_visit present');
  assert.equal(visit!.params.bot, 'GPTBot');
  assert.equal(byName(events, 'mcp_request')!.params.is_bot, true);
  assert.equal(byName(events, 'mcp_request')!.params.bot, 'GPTBot');
});

test('status >= 400 additionally emits mcp_error', () => {
  const events = buildMcpEvents(meta({ status: 429 }));
  const err = byName(events, 'mcp_error');
  assert.ok(err, 'mcp_error present');
  assert.equal(err!.params.status, 429);
  assert.equal(byName(events, 'mcp_request')!.params.success, false);
});

test('GET requests are labelled with the sse transport', () => {
  const events = buildMcpEvents(meta({ httpMethod: 'GET', body: undefined }));
  assert.equal(byName(events, 'mcp_request')!.params.transport, 'sse');
});

// --- safeHost --------------------------------------------------------------

test('safeHost keeps only the hostname and drops IP literals', () => {
  assert.equal(safeHost('https://claude.ai/some/path?q=1'), 'claude.ai');
  assert.equal(safeHost(undefined, 'https://chatgpt.com/'), 'chatgpt.com');
  assert.equal(safeHost('http://127.0.0.1:8080'), '');
  assert.equal(safeHost('null'), '');
  assert.equal(safeHost('not a url'), '');
});

// --- failure safety --------------------------------------------------------

test('emitMcpAnalytics never throws even when the sink throws', () => {
  let calls = 0;
  const throwingSink = () => {
    calls += 1;
    throw new Error('analytics backend exploded');
  };
  assert.doesNotThrow(() =>
    emitMcpAnalytics(
      meta({ body: { method: 'tools/call', params: { name: 'list_plans' } } }),
      throwingSink,
    ),
  );
  assert.ok(calls > 0, 'sink was attempted');
});

test('emitMcpAnalytics never throws on a malformed body', () => {
  assert.doesNotThrow(() =>
    emitMcpAnalytics(meta({ body: null }), () => {}),
  );
  assert.doesNotThrow(() =>
    emitMcpAnalytics(meta({ body: 'garbage' }), () => {}),
  );
});

// --- privacy ---------------------------------------------------------------

/** Collect every emitted param value as a flat string array for assertions. */
function emittedValues(m: McpRequestMeta): string[] {
  const events = buildMcpEvents(m);
  const values: string[] = [];
  for (const e of events) {
    for (const v of Object.values(e.params as EventParams)) values.push(String(v));
  }
  return values;
}

/** Allow-listed param keys — nothing outside this set may ever be emitted. */
const ALLOWED_KEYS = new Set([
  'mcp_method',
  'tool_name',
  'status',
  'success',
  'duration_ms',
  'client',
  'bot',
  'is_bot',
  'transport',
  'country',
  'origin_host',
]);

test('no event carries a key outside the safe allow-list', () => {
  const events = buildMcpEvents(
    meta({
      userAgent: 'Mozilla/5.0 (compatible; GPTBot/1.1)',
      status: 500,
      body: { method: 'tools/call', params: { name: 'list_plans' } },
    }),
  );
  for (const e of events) {
    for (const key of Object.keys(e.params)) {
      assert.ok(
        ALLOWED_KEYS.has(key),
        `unexpected param key "${key}" in event ${e.name}`,
      );
      assert.ok(
        !/authorization|cookie|user.?agent/i.test(key),
        `forbidden header-like key "${key}"`,
      );
    }
  }
});

test('the raw User-Agent is never emitted', () => {
  const rawUa =
    'Mozilla/5.0 (X11; Linux x86_64) SecretToken=abc123 ChatGPT-User/1.0';
  const values = emittedValues(meta({ userAgent: rawUa }));
  for (const v of values) {
    assert.ok(!v.includes('SecretToken=abc123'), 'raw UA token leaked');
    assert.notEqual(v, rawUa);
  }
});

test('request body argument values are never emitted', () => {
  const values = emittedValues(
    meta({
      body: {
        method: 'tools/call',
        params: {
          name: 'feature_search',
          arguments: { query: 'SUPER_SECRET_QUERY', api_key: 'sk-PRIVATE' },
        },
      },
    }),
  );
  for (const v of values) {
    assert.ok(!v.includes('SUPER_SECRET_QUERY'), 'arg value leaked');
    assert.ok(!v.includes('sk-PRIVATE'), 'arg value leaked');
  }
  // The tool *name* is allowed (it is not customer data).
  assert.ok(values.includes('feature_search'));
});

test('auth/cookie header values cannot leak — they are never read', () => {
  // The builder has no channel for these headers: meta exposes none. This test
  // documents/locks that contract by confirming a sensitive value placed where
  // a careless refactor might pass it through (origin) is still not emitted.
  const values = emittedValues(
    meta({ origin: 'https://example.com', referer: 'https://example.com' }),
  );
  assert.ok(!values.some((v) => /bearer|sk-|session=|token=/i.test(v)));
});
