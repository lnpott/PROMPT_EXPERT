import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import generate from '../api/generate.js';
import { publicCompilerModels } from '../api/compiler-models.js';
import { publicProfiles } from '../api/model-profiles.js';
import { generationModelsForProvider } from '../src/generation/provider-options.js';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const generation = readFileSync(new URL('../api/generate.js', import.meta.url), 'utf8');

function response() {
  return {
    headers: {}, statusCode: null, body: null,
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
  };
}

test('generation catalog is provider-bound and uses stable model IDs rather than labels', () => {
  const providers = [
    { slug: 'deepseek', models: [{ model_id: 'deepseek-api-id', display_name: 'Visual label' }] },
    { slug: 'openai', models: [{ model_id: 'openai-api-id', display_name: 'Visual label' }] },
  ];
  assert.deepEqual(generationModelsForProvider({ providers, compilers: [] }, 'deepseek'), [
    { modelId: 'deepseek-api-id', displayName: 'Visual label', isDefault: false },
  ]);
  assert.deepEqual(generationModelsForProvider({ providers, compilers: [] }, 'openai').map(({ modelId }) => modelId), ['openai-api-id']);
  assert.deepEqual(generationModelsForProvider({ providers, compilers: [] }, 'xai'), []);
});

test('changing provider rebuilds generation choices and cannot preserve a stale model', () => {
  const providers = [
    { slug: 'deepseek', models: [{ model_id: 'deepseek-only', display_name: 'DeepSeek' }] },
    { slug: 'mistral', models: [{ model_id: 'mistral-only', display_name: 'Mistral' }] },
  ];
  const first = generationModelsForProvider({ providers, compilers: [] }, 'deepseek');
  const second = generationModelsForProvider({ providers, compilers: [] }, 'mistral');
  assert.equal(first.some(({ modelId }) => modelId === second[0].modelId), false);
  assert.match(main, /generationModel\.replaceChildren/);
});

test('optimization targets are methodological profiles independent from executors', () => {
  const targetIds = publicProfiles().map(({ slug }) => slug);
  assert.ok(targetIds.includes('claude'));
  assert.ok(targetIds.includes('deepseek'));
  assert.ok(generationModelsForProvider({ providers: [], compilers: publicCompilerModels() }, 'platform').length > 0);
  assert.match(main, /option\.value = profile\.slug/);
  assert.match(html, /Otimização para modelo/);
});

test('a local executor can generate for a cross-family Claude target without credentials', async () => {
  const result = response();
  await generate({
    method: 'POST',
    headers: { 'x-forwarded-for': 'target-separation-local' },
    body: {
      brief: 'Crie um formulário acessível.',
      generationProvider: 'local',
      generationModel: 'local-deterministic',
      taskType: 'cited',
      targetModel: 'claude',
    },
  }, result);
  assert.equal(result.statusCode, 200);
  assert.equal(result.body.generationProvider, 'local');
  assert.equal(result.body.generationModel, 'local-deterministic');
  assert.equal(result.body.targetModel, 'claude');
  assert.match(result.body.prompt, /Prompt para Claude/);
});

test('invalid or methodology-free targets fail closed without executor fallback', async () => {
  const result = response();
  await generate({
    method: 'POST',
    body: {
      brief: 'Crie uma página.',
      generationProvider: 'local',
      generationModel: 'local-deterministic',
      targetModel: 'unreviewed-target',
    },
  }, result);
  assert.equal(result.statusCode, 400);
  assert.equal(result.body.code, 'target_model_invalid');
});

test('ambiguous legacy fields are not accepted as the new generation contract', async () => {
  const result = response();
  await generate({ method: 'POST', body: { brief: 'Crie uma página.', provider: 'local', model: 'claude' } }, result);
  assert.equal(result.statusCode, 400);
  assert.equal(result.body.code, 'target_model_invalid');
});

test('BYOK presence is not presented as validation and no key test runs on page load', () => {
  assert.match(main, /Use your own key\. Status:/);
  assert.match(main, /Configure your key first/);
  assert.doesNotMatch(main, /fetch\([^\n]*\/test/);
  assert.match(main, /generationProvider: generationProvider\.value/);
  assert.match(main, /generationModel: generationModel\.value/);
  assert.match(main, /targetModel: targetModel\.value/);
});

test('backend selects methodology from target and adapters from generation provider', () => {
  assert.match(generation, /findProfile\(targetModel\)/);
  assert.match(generation, /compilePrompt\(\{ brief, profile, taskType \}\)/);
  assert.match(generation, /generateWithDirectProvider\(generationProvider/);
  assert.match(generation, /model: allowedModel\.model_id/);
  assert.doesNotMatch(generation, /request\.body\?\.(?:baseUrl|endpoint|apiKey|headers)/);
});
