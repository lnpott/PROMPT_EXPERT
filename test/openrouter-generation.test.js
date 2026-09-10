import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const generation = readFileSync(new URL('../api/generate.js', import.meta.url), 'utf8');

test('generation resolves local, legacy platform and OpenRouter through the registry', () => {
  assert.match(generation, /resolveGenerationRoute/);
  assert.match(generation, /route\.adapter === 'local'/);
  assert.match(generation, /route\.adapter === 'openrouter'/);
});

test('OpenRouter failure returns directly and cannot enter platform fallback', () => {
  const openRouterBlock = generation.slice(generation.indexOf("if (route.adapter === 'openrouter')"), generation.indexOf('const apiKey = compilerApiKey'));
  assert.match(openRouterBlock, /return sendJson\(response, status/);
  assert.doesNotMatch(openRouterBlock, /requestGemini|local-fallback|compilerApiKey/);
});
