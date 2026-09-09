import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');

test('UI offers all three generation origins without accepting a base URL', () => {
  assert.match(html, /value="platform">Plataforma/);
  assert.match(html, /value="local">Somente local/);
  assert.match(html, /value="openrouter">OpenRouter BYOK/);
  assert.doesNotMatch(html, /base.?url/i);
  assert.match(main, /openRouterModel: providerModel\.value/);
});
