import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import generate from '../api/generate.js';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const corpus = readFileSync(new URL('../docs/methodology-corpus-v1.json', import.meta.url));

function responseHarness() {
  return { statusCode: 200, body: null, headers: {}, setHeader(name, value) { this.headers[name] = value; }, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
}

async function localGeneration(targetModel = 'claude') {
  const req = { method: 'POST', body: { brief: 'Corrija uma condição de corrida e adicione teste.', generationProvider: 'local', generationModel: 'local-deterministic', credentialSource: 'local', taskType: 'debug', targetModel } };
  const res = responseHarness();
  await generate(req, res);
  return res;
}

test('anonymous product shell defaults to local and identifies the optimized prompt result', () => {
  assert.match(html, /id="app-content" hidden/);
  assert.match(html, /id="local-generation" type="checkbox" checked/);
  assert.match(html, /Prompt otimizado/);
  assert.match(html, /Copiar prompt/);
  assert.match(html, /Otimizado para/);
  assert.match(main, /currentRoute[\s\S]*: '#app'/);
});

test('catalog selection is not hardcoded to Gemini and local is opt-in after authentication', () => {
  assert.doesNotMatch(main, /generationProvider\.value = 'google-gemini'/);
  assert.match(main, /localGenerationTouched/);
  assert.match(main, /preferLocal = !authenticated/);
  assert.match(main, /applyLocalGenerationPreference\(authenticated\)/);
});

test('local target generation needs neither account nor target credential', async () => {
  const claude = await localGeneration('claude');
  const openai = await localGeneration('openai');
  assert.equal(claude.statusCode, 200);
  assert.equal(claude.body.source, 'local');
  assert.equal(claude.body.targetModel, 'claude');
  assert.match(claude.body.prompt, /XML/i);
  assert.notEqual(claude.body.prompt, openai.body.prompt);
});

test('step 20 corpus is unchanged and operational catalog gates remain intact', () => {
  assert.equal(createHash('sha256').update(corpus).digest('hex'), '184e3de0c14167aa716bef129e0d35624e361a6e79f25ce42148a8f1375dcb4c');
  const migrations = readFileSync(new URL('../supabase/migrations/20260912010000_replace_deepseek_legacy_model.sql', import.meta.url), 'utf8');
  const alibaba = readFileSync(new URL('../supabase/rollout/activate_alibaba_us_generation.sql', import.meta.url), 'utf8');
  assert.match(migrations, /deepseek-flash/);
  assert.match(alibaba, /is_active = true/);
  assert.doesNotMatch(main, /deepseek-v4-flash/);
});
