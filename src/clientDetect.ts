/**
 * User-Agent classification — privacy-safe.
 *
 * Turns a raw User-Agent string into two coarse, allow-listed labels:
 *   - `client`: which AI client / tool / browser the request looks like.
 *   - `bot`:    which known crawler it is (empty when not a crawler).
 *
 * The raw UA NEVER leaves this module. Only the derived labels are returned,
 * which is what reaches GA4. Matching is substring-based against a fixed
 * allow-list so analytics cardinality stays bounded and attacker-controlled UA
 * text can never be echoed verbatim into the analytics sink.
 */

/** Coarse client buckets. `unknown` is the catch-all. */
export type ClientLabel =
  | 'chatgpt'
  | 'openai'
  | 'claude'
  | 'cursor'
  | 'perplexity'
  | 'gemini'
  | 'copilot'
  | 'postman'
  | 'browser'
  | 'unknown';

export interface ClientDetection {
  /** AI client / tool / browser bucket. */
  client: ClientLabel;
  /** Known crawler name, or '' when the UA is not a recognised bot. */
  bot: string;
  /** True iff `bot` is non-empty. */
  is_bot: boolean;
}

/**
 * Coarse, single-axis "type" of the caller, derived from `client` + `is_bot`.
 * A bounded enum (never attacker-controlled text) suitable for grouping
 * traffic into AI agents vs crawlers vs human browsers vs tooling.
 */
export type ClientType = 'ai_client' | 'bot' | 'browser' | 'tool' | 'unknown';

/** Client labels we count as first-party AI agents (not crawlers). */
const AI_CLIENT_LABELS: ReadonlySet<ClientLabel> = new Set<ClientLabel>([
  'chatgpt',
  'openai',
  'claude',
  'cursor',
  'perplexity',
  'gemini',
  'copilot',
]);

/**
 * Collapse a {@link ClientDetection} into one {@link ClientType} bucket.
 *
 * A recognised crawler always wins (`bot`), so an AI crawler such as `GPTBot`
 * is typed as `bot` even though its UA also engine-matches `browser`. Otherwise
 * the AI-client allow-list maps to `ai_client`, `postman` to `tool`, the
 * browser fallback to `browser`, and everything else to `unknown`.
 */
export function clientType(detection: ClientDetection): ClientType {
  if (detection.is_bot) return 'bot';
  if (AI_CLIENT_LABELS.has(detection.client)) return 'ai_client';
  if (detection.client === 'postman') return 'tool';
  if (detection.client === 'browser') return 'browser';
  return 'unknown';
}

/**
 * Known crawlers, matched first (most specific). Each tuple is
 * `[lowercase-substring, canonical-label]`. Order matters only where one token
 * is a substring of another — here they are all distinct.
 */
const BOT_SIGNATURES: ReadonlyArray<readonly [string, string]> = [
  ['gptbot', 'GPTBot'],
  ['oai-searchbot', 'OAI-SearchBot'],
  ['claudebot', 'ClaudeBot'],
  ['perplexitybot', 'PerplexityBot'],
  ['google-extended', 'Google-Extended'],
  ['googlebot', 'Googlebot'],
  ['ccbot', 'CCBot'],
  ['bytespider', 'Bytespider'],
  ['bingbot', 'Bingbot'],
  ['applebot', 'Applebot'],
  ['amazonbot', 'Amazonbot'],
  ['ahrefsbot', 'AhrefsBot'],
  ['semrushbot', 'SemrushBot'],
];

/**
 * AI clients / tools. Checked in order — `anthropic` before `claude` is
 * harmless (both map to `claude`); `chatgpt` before `openai` keeps the more
 * specific label when both appear.
 */
const CLIENT_SIGNATURES: ReadonlyArray<readonly [string, ClientLabel]> = [
  ['chatgpt', 'chatgpt'],
  ['openai', 'openai'],
  ['anthropic', 'claude'],
  ['claude', 'claude'],
  ['cursor', 'cursor'],
  ['perplexity', 'perplexity'],
  ['gemini', 'gemini'],
  ['copilot', 'copilot'],
  ['github', 'copilot'],
  ['postman', 'postman'],
];

/** Generic browser engine tokens — only consulted after the AI-client list. */
const BROWSER_SIGNATURES: readonly string[] = [
  'mozilla',
  'chrome',
  'safari',
  'firefox',
  'edg',
  'webkit',
  'gecko',
  'opera',
];

/**
 * Classify a User-Agent into `{ client, bot, is_bot }`.
 *
 * Never throws. An absent or empty UA yields `unknown` / not-a-bot. Bot and
 * client detection are independent: a recognised crawler (e.g. `GPTBot`) sets
 * `bot` *and* may resolve a `client` (here, `openai`/`browser`) from the same
 * string — callers use whichever they need.
 */
export function detectClient(userAgent: string | undefined): ClientDetection {
  const ua = (userAgent ?? '').toLowerCase();
  if (!ua) return { client: 'unknown', bot: '', is_bot: false };

  let bot = '';
  for (const [sig, label] of BOT_SIGNATURES) {
    if (ua.includes(sig)) {
      bot = label;
      break;
    }
  }

  let client: ClientLabel = 'unknown';
  for (const [sig, label] of CLIENT_SIGNATURES) {
    if (ua.includes(sig)) {
      client = label;
      break;
    }
  }
  if (client === 'unknown' && BROWSER_SIGNATURES.some((s) => ua.includes(s))) {
    client = 'browser';
  }

  return { client, bot, is_bot: bot !== '' };
}
