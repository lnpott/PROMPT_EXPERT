import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');

test('UI loads real providers from the catalog and separates local strategy', () => {
  assert.doesNotMatch(html, /value="platform">Plataforma/);
  assert.match(html, /id="local-generation"/);
  assert.match(main, /fetch\('\/api\/providers'\)/);
  assert.doesNotMatch(html, /base.?url/i);
  assert.match(main, /generationModel: generationModel\.value/);
  assert.match(main, /credentialSource: selectedCredentialSource/);
});
