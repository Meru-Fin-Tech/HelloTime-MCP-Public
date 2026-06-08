/**
 * In-memory MCP analytics store — the DB-free "repository" layer.
 *
 * This repo is stateless by design (see README "Security posture" and
 * .env.example: "NO database, NO customer data"). So instead of a SQL table we
 * keep a bounded, process-local ring buffer of the most recent finished `/mcp`
 * requests, plus O(1) running aggregates. It is the queryable backing store for
 * the protected internal analytics endpoint (src/internalAnalytics.ts) and a
 * sibling of — not a replacement for — the GA4 event sink (src/analytics.ts).
 *
 * Properties:
 *   - Bounded memory: at most `capacity` rows are retained (default 1000); the
 *     oldest are evicted first. Aggregates are cumulative and never evicted.
 *   - No persistence: a process restart starts the buffer empty. This is
 *     deliberate — nothing here survives to disk, so no privacy-sensitive value
 *     is ever durably stored.
 *   - Privacy: every field is a derived, bounded label or a scalar. The same
 *     allow-list that governs the GA4 events governs what reaches a record (no
 *     raw UA, IP, body, args, auth headers, or cookies — see
 *     src/requestAnalytics.ts).
 */

import type { ClientLabel, ClientType } from './clientDetect.js';

/**
 * One finished `/mcp` request, reduced to safe, bounded fields. Mirrors the
 * field list agreed for analytics storage. `metadata` is a small bag of extra
 * derived scalars (never free text from the request).
 */
export interface AnalyticsRecord {
  /** Monotonic per-process row id (not persisted, resets on restart). */
  id: number;
  /** ISO-8601 timestamp the row was recorded. */
  createdAt: string;
  /** Always `/mcp` for now — recorded explicitly for future endpoints. */
  endpoint: string;
  /** HTTP verb: GET (SSE), POST (JSON-RPC), DELETE (teardown). */
  httpMethod: string;
  /** JSON-RPC method from the body (e.g. `tools/call`), or `unknown`. */
  mcpMethod: string;
  /** Invoked tool (tools/call) or the operation label. */
  toolName: string;
  /** Derived AI-client / browser label. */
  clientName: ClientLabel;
  /** Derived single-axis caller type. */
  clientType: ClientType;
  /** Whether a known crawler UA was detected. */
  isBot: boolean;
  /** Canonical crawler name, or '' when not a bot. */
  botName: string;
  /** Hostname of the `Origin` header (IP literals dropped), or ''. */
  originHost: string;
  /** Hostname of the `Referer` header (IP literals dropped), or ''. */
  refererHost: string;
  /** Two-letter country from the edge header, or `unknown`. */
  country: string;
  /** Final HTTP status code. */
  statusCode: number;
  /** `statusCode < 400`. */
  success: boolean;
  /** Wall-clock request duration in milliseconds. */
  responseTimeMs: number;
  /** Extra derived scalars (e.g. `{ transport }`). Never free text. */
  metadata: Record<string, string | number | boolean>;
}

/** Aggregated view over everything recorded since process start. */
export interface AnalyticsSummary {
  /** Cumulative request count (not capped by the ring buffer). */
  totalRequests: number;
  successCount: number;
  errorCount: number;
  botRequests: number;
  /** Mean response time over the *retained* rows, rounded to an integer ms. */
  avgResponseTimeMs: number;
  /** Counts keyed by `mcpMethod`. */
  byMcpMethod: Record<string, number>;
  /** Counts keyed by `toolName`. */
  byTool: Record<string, number>;
  /** Counts keyed by `clientName`. */
  byClient: Record<string, number>;
  /** Counts keyed by `clientType`. */
  byClientType: Record<string, number>;
  /** Counts keyed by `botName` (only non-empty bot names). */
  byBot: Record<string, number>;
  /** Counts keyed by `statusCode` (as a string key). */
  byStatus: Record<string, number>;
  /** Rows currently retained in the ring buffer. */
  retained: number;
  /** Ring-buffer capacity. */
  capacity: number;
}

function bump(map: Record<string, number>, key: string): void {
  map[key] = (map[key] ?? 0) + 1;
}

/**
 * A fixed-capacity ring buffer of {@link AnalyticsRecord}s with cumulative
 * aggregates. Construct your own for tests; the process shares one singleton
 * exported below.
 */
export class AnalyticsStore {
  private readonly buffer: AnalyticsRecord[] = [];
  private seq = 0;

  // Cumulative aggregates — counted on insert, never decremented on eviction,
  // so totals stay accurate even after rows roll out of the ring buffer.
  private totalRequests = 0;
  private successCount = 0;
  private errorCount = 0;
  private botRequests = 0;
  private readonly byMcpMethod: Record<string, number> = {};
  private readonly byTool: Record<string, number> = {};
  private readonly byClient: Record<string, number> = {};
  private readonly byClientType: Record<string, number> = {};
  private readonly byBot: Record<string, number> = {};
  private readonly byStatus: Record<string, number> = {};

  constructor(private readonly capacity = 1000) {}

  /**
   * Record one finished request. Caller supplies everything except `id` and
   * `createdAt`, which this method stamps. Never throws on well-formed input;
   * callers still wrap it (see emitMcpAnalytics) so a bug here can never break
   * an MCP response.
   */
  record(row: Omit<AnalyticsRecord, 'id' | 'createdAt'>): AnalyticsRecord {
    const full: AnalyticsRecord = {
      ...row,
      id: ++this.seq,
      createdAt: new Date().toISOString(),
    };

    this.buffer.push(full);
    if (this.buffer.length > this.capacity) this.buffer.shift();

    this.totalRequests += 1;
    if (full.success) this.successCount += 1;
    else this.errorCount += 1;
    if (full.isBot) this.botRequests += 1;
    bump(this.byMcpMethod, full.mcpMethod);
    bump(this.byTool, full.toolName);
    bump(this.byClient, full.clientName);
    bump(this.byClientType, full.clientType);
    if (full.botName) bump(this.byBot, full.botName);
    bump(this.byStatus, String(full.statusCode));

    return full;
  }

  /** Most recent rows, newest first, capped at `limit` (default 100). */
  recent(limit = 100): AnalyticsRecord[] {
    const n = Math.max(0, Math.min(limit, this.buffer.length));
    return this.buffer.slice(this.buffer.length - n).reverse();
  }

  /** Snapshot of the cumulative aggregates plus retained-row averages. */
  summary(): AnalyticsSummary {
    const retained = this.buffer.length;
    const avg =
      retained === 0
        ? 0
        : Math.round(
            this.buffer.reduce((s, r) => s + r.responseTimeMs, 0) / retained,
          );
    return {
      totalRequests: this.totalRequests,
      successCount: this.successCount,
      errorCount: this.errorCount,
      botRequests: this.botRequests,
      avgResponseTimeMs: avg,
      byMcpMethod: { ...this.byMcpMethod },
      byTool: { ...this.byTool },
      byClient: { ...this.byClient },
      byClientType: { ...this.byClientType },
      byBot: { ...this.byBot },
      byStatus: { ...this.byStatus },
      retained,
      capacity: this.capacity,
    };
  }

  /** Drop all rows and zero all aggregates. Used by tests. */
  reset(): void {
    this.buffer.length = 0;
    this.seq = 0;
    this.totalRequests = 0;
    this.successCount = 0;
    this.errorCount = 0;
    this.botRequests = 0;
    for (const m of [
      this.byMcpMethod,
      this.byTool,
      this.byClient,
      this.byClientType,
      this.byBot,
      this.byStatus,
    ]) {
      for (const k of Object.keys(m)) delete m[k];
    }
  }
}

/** Process-wide store shared by the HTTP layer and the internal endpoint. */
export const analyticsStore = new AnalyticsStore();
