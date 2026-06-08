/**
 * Protected internal analytics endpoint — the "controller" over the in-memory
 * store (src/analyticsStore.ts).
 *
 * This repo ships no dashboard, so the endpoint is OFF by default: with
 * `ANALYTICS_ADMIN_TOKEN` unset every route 404s, exactly as if it did not
 * exist (no new required config, no information disclosure). Set the env var to
 * enable it, then authenticate with `Authorization: Bearer <token>`.
 *
 * It exposes only already-derived, bounded aggregates and recent rows — the
 * same privacy-safe fields the store holds. No raw UA / IP / body / args /
 * auth headers / cookies exist anywhere in this path.
 */

import { Router, type Request, type Response } from 'express';
import { timingSafeEqual } from 'node:crypto';
import { AnalyticsStore } from './analyticsStore.js';

/** Read the admin token at call time so tests/runtime can toggle it. */
function adminToken(): string | null {
  const t = process.env.ANALYTICS_ADMIN_TOKEN?.trim();
  return t ? t : null;
}

/** Constant-time bearer-token check against `ANALYTICS_ADMIN_TOKEN`. */
function isAuthorized(req: Request, token: string): boolean {
  const header = req.header('authorization') ?? '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) return false;
  const presented = Buffer.from(match[1]);
  const expected = Buffer.from(token);
  // timingSafeEqual throws on length mismatch — guard first (length is not the
  // secret; it leaks nothing useful).
  if (presented.length !== expected.length) return false;
  return timingSafeEqual(presented, expected);
}

/**
 * Build the internal-analytics router over a store (defaults to the process
 * singleton). Mount it OUTSIDE `/mcp`, e.g. `app.use('/internal/analytics', …)`.
 *
 * Routes (all require the bearer token when enabled):
 *   GET /summary       → cumulative aggregates + retained-row averages
 *   GET /recent?limit= → most recent rows (newest first), limit 1–1000
 */
export function createInternalAnalyticsRouter(store: AnalyticsStore): Router {
  const router = Router();

  // Gate every route: disabled (404) when no token configured, else 401 unless
  // a valid bearer token is presented.
  router.use((req: Request, res: Response, next) => {
    const token = adminToken();
    if (!token) {
      res.status(404).json({ error: 'not found' });
      return;
    }
    if (!isAuthorized(req, token)) {
      res.setHeader('www-authenticate', 'Bearer');
      res.status(401).json({ error: 'unauthorized' });
      return;
    }
    next();
  });

  router.get('/summary', (_req: Request, res: Response) => {
    res.json(store.summary());
  });

  router.get('/recent', (req: Request, res: Response) => {
    const raw = Number.parseInt(String(req.query.limit ?? '100'), 10);
    const limit = Number.isFinite(raw) ? Math.min(Math.max(raw, 1), 1000) : 100;
    res.json({ records: store.recent(limit) });
  });

  return router;
}
