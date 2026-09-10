import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const generation = readFileSync(new URL('../api/generate.js', import.meta.url), 'utf8');
const registry = readFileSync(new URL('../server/providers/direct-providers.js', import.meta.url), 'utf8');
const generationRegistry = readFileSync(new URL('../server/providers/generation-registry.js', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');

test('direct providers are explicit and provider/model are bound by provider id', () => {
  for (const slug of ['openai', 'xai', 'deepseek', 'groq', 'mistral']) assert.match(registry, new RegExp(slug));
  assert.match(generationRegistry, /groqcloud/);
  assert.match(generation, /provider_id=eq\.\$\{encodeURIComponent\(owned\.provider\.id\)\}/);
  assert.match(generation, /is_active=eq\.true&is_public=eq\.true&is_deprecated=eq\.false/);
});

test('client-controlled transport fields are never consumed', () => {
  for (const field of ['baseUrl', 'endpoint', 'authorization', 'apiKey', 'fetchOptions', 'rawBody', 'providerConfig']) assert.doesNotMatch(generation, new RegExp(`request\\.body\\?\\.${field}`));
  assert.match(registry, /https:\/\/api\.openai\.com\/v1/);
  assert.doesNotMatch(ui, /baseUrl|apiKey/i);
});

test('direct-provider errors return before the platform Gemini path', () => {
  const direct = generation.slice(generation.indexOf("if (route.adapter === 'openai-compatible')"), generation.indexOf('const apiKey = compilerApiKey'));
  assert.match(direct, /return sendJson\(response, status/);
  assert.doesNotMatch(direct, /requestGemini|local-fallback|OpenRouter/);
});

test('frontend never converts a BYOK error into a local result', () => {
  assert.doesNotMatch(ui, /response\.status === 404|compilePrompt/);
});

test('native Anthropic stays out of the OpenAI-compatible registry', () => {
  assert.doesNotMatch(registry, /anthropic|claude/i);
});
