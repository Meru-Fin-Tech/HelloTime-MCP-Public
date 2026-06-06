/**
 * Tests for src/clientDetect.ts — privacy-safe User-Agent classification.
 *
 * Verifies AI-client buckets, the crawler allow-list, the unknown catch-all,
 * and the safety property that the function is total (never throws) and never
 * returns the raw UA.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { detectClient } from '../src/clientDetect.js';

// --- AI client detection ---------------------------------------------------

const CLIENT_CASES: ReadonlyArray<[string, string]> = [
  ['ChatGPT-User/1.0 (+https://openai.com/bot)', 'chatgpt'],
  ['Mozilla/5.0 OpenAI/1.0', 'openai'],
  ['Claude-User/1.0 (+https://anthropic.com)', 'claude'],
  ['anthropic-sdk-python/0.39.0', 'claude'],
  ['Cursor/0.42.3 (Macintosh)', 'cursor'],
  ['Perplexity/1.2', 'perplexity'],
  ['Gemini-Client/1.0', 'gemini'],
  ['GitHub-Copilot/1.0', 'copilot'],
  ['PostmanRuntime/7.36.0', 'postman'],
  ['Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36', 'browser'],
  ['curl/8.4.0', 'unknown'],
  ['', 'unknown'],
];

for (const [ua, expected] of CLIENT_CASES) {
  test(`client detection: ${expected} <- "${ua.slice(0, 32)}"`, () => {
    assert.equal(detectClient(ua).client, expected);
  });
}

// --- Bot / crawler detection -----------------------------------------------

const BOT_CASES: ReadonlyArray<[string, string]> = [
  ['Mozilla/5.0 (compatible; GPTBot/1.1; +https://openai.com/gptbot)', 'GPTBot'],
  ['Mozilla/5.0 (compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot)', 'OAI-SearchBot'],
  ['Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)', 'ClaudeBot'],
  ['Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/bot)', 'PerplexityBot'],
  ['Mozilla/5.0 (compatible; Google-Extended)', 'Google-Extended'],
  ['Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)', 'Googlebot'],
  ['CCBot/2.0 (https://commoncrawl.org/faq/)', 'CCBot'],
  ['Mozilla/5.0 (compatible; Bytespider; spider-feedback@bytedance.com)', 'Bytespider'],
  ['Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)', 'Bingbot'],
  ['Mozilla/5.0 (compatible; Applebot/0.1; +http://www.apple.com/go/applebot)', 'Applebot'],
  ['Mozilla/5.0 (compatible; Amazonbot/0.1; +https://developer.amazon.com/support/amazonbot)', 'Amazonbot'],
  ['Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)', 'AhrefsBot'],
  ['Mozilla/5.0 (compatible; SemrushBot/7~bl; +http://www.semrush.com/bot.html)', 'SemrushBot'],
];

for (const [ua, expected] of BOT_CASES) {
  test(`bot detection: ${expected}`, () => {
    const d = detectClient(ua);
    assert.equal(d.bot, expected);
    assert.equal(d.is_bot, true);
  });
}

test('non-bot UA is not flagged as a bot', () => {
  const d = detectClient('PostmanRuntime/7.36.0');
  assert.equal(d.bot, '');
  assert.equal(d.is_bot, false);
});

test('undefined UA is safe: unknown client, not a bot', () => {
  const d = detectClient(undefined);
  assert.deepEqual(d, { client: 'unknown', bot: '', is_bot: false });
});
