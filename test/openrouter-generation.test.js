import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const generation = readFileSync(new URL('../api/generate.js', import.meta.url), 'utf8');

test('generation continues to expose explicit local, platform and OpenRouter modes', () => {
  assert.match(generation, /'local', 'platform', 'openrouter'/);
  assert.match(generation, /provider === 'local'/);
  assert.match(generation, /provider === 'openrouter'/);
});

test('OpenRouter failure returns directly and cannot enter platform fallback', () => {
  const openRouterBlock = generation.slice(generation.indexOf("if (provider === 'openrouter')"), generation.indexOf('const apiKey = compilerApiKey'));
  assert.match(openRouterBlock, /return sendJson\(response, status/);
  assert.doesNotMatch(openRouterBlock, /requestGemini|local-fallback|compilerApiKey/);
});
