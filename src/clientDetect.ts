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
