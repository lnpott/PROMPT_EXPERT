import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const ui = readFileSync(new URL('../src/byok/credentials.js', import.meta.url), 'utf8');
const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

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

test('credential UI differentiates local integrity from provider validation', () => {
  assert.match(ui, /Testando integridade/);
  assert.match(ui, /Integridade verificada localmente/);
  assert.doesNotMatch(ui, /API válida/);
  assert.match(html, /nunca voltam para esta tela/);
});
