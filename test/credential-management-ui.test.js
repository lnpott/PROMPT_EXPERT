import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { priceSummary } from '../src/byok/credentials.js';

const ui = readFileSync(new URL('../src/byok/credentials.js', import.meta.url), 'utf8');
const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const generate = readFileSync(new URL('../api/generate.js', import.meta.url), 'utf8');

test('credential UI consumes the canonical provider and authenticated metadata endpoints', () => {
  assert.match(ui, /request\('\/api\/providers'\)/);
  assert.match(ui, /authorized\('\/api\/credentials'\)/);
  assert.match(ui, /\/api\/credentials\/\$\{encodeURIComponent\(slug\)\}/);
  assert.match(main, /initializeCredentialManager\(authController/);
});

test('credential UI uses password inputs and clears secrets before asynchronous persistence', () => {
  assert.match(ui, /secret\.type = 'password'/);
  assert.match(ui, /const submittedSecret = secret\.value;[\s\S]*secret\.value = '';[\s\S]*handlers\.save/);
  assert.doesNotMatch(ui, /localStorage|sessionStorage|document\.cookie/);
  assert.doesNotMatch(html, /USER_CREDENTIALS_MASTER_KEY|ciphertext|auth_tag|key_version/);
});

test('credential UI differentiates OpenRouter provider validation', () => {
  assert.match(ui, /Validando no OpenRouter/);
  assert.match(ui, /Validar no provedor/);
  assert.doesNotMatch(ui, /API válida/);
  assert.match(html, /nunca voltam para esta tela/);
});

test('rich catalog UI supports models, pricing, free tiers and optional media safely', () => {
  assert.match(ui, /provider\.short_description/);
  assert.match(ui, /provider\.models/);
  assert.match(ui, /model\.input_price/);
  assert.match(ui, /model\.pricing_notes \|\| null/);
  assert.match(ui, /FREE_TIER_LABELS/);
  assert.match(ui, /if \(provider\.logo_url\)/);
  assert.match(ui, /provider-logo-fallback/);
  assert.doesNotMatch(ui, /innerHTML/);
  assert.doesNotMatch(generate, /richProviders|user_api_credentials/);
});

test('model price summary distinguishes structured and unavailable pricing', () => {
  assert.equal(priceSummary({ input_price: '2', output_price: '6', currency: 'USD', pricing_unit: 'million_tokens' }), 'entrada USD 2.00 · saída USD 6.00 por 1M tokens');
  assert.equal(priceSummary({ input_price: null, output_price: null, pricing_notes: 'Preço variável por região.' }), 'Preço variável por região.');
  assert.equal(priceSummary({ input_price: null, output_price: null, pricing_notes: null }), null);
});
