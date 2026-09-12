import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import generate from './helpers/authenticated-generate.js';
import { generationCapability, resolveGenerationRoute } from '../server/providers/generation-registry.js';
import { generationModelsForProvider, generationUiState } from '../src/generation/provider-options.js';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const catalogMigration = readFileSync(new URL('../supabase/migrations/20260908230000_enrich_provider_model_catalog.sql', import.meta.url), 'utf8');
const vaultMigration = readFileSync(new URL('../supabase/migrations/20260907195224_create_byok_vault_schema.sql', import.meta.url), 'utf8');

function response() {
  return { headers: {}, statusCode: 0, body: null, setHeader(k,v){this.headers[k]=v;}, status(code){this.statusCode=code;return this;}, json(body){this.body=body;return this;} };
}

const provider = (slug, supported, sources, models = []) => ({
  slug, display_name: slug, models,
  generation: { generationSupported: supported, adapterStatus: supported ? 'available' : 'planned', credentialSources: sources },
});

test('registry separates catalog presence, adapter support and credential source', () => {
  assert.deepEqual(generationCapability('google-gemini').credentialSources, ['platform', 'byok']);
  for (const slug of ['openrouter', 'openai', 'xai', 'deepseek', 'groqcloud', 'mistral', 'kimi', 'alibaba-model-studio', 'anthropic']) {
    assert.equal(generationCapability(slug).generationSupported, true);
    assert.deepEqual(generationCapability(slug).credentialSources, ['byok']);
  }
});

test('all ten versioned providers and twelve curated model IDs remain represented', () => {
  for (const slug of ['openrouter','google-gemini','xai','openai','anthropic','deepseek','mistral','groqcloud','alibaba-model-studio','kimi']) {
    assert.match(vaultMigration, new RegExp(`'${slug}'`));
  }
  for (const modelId of ['openrouter/free','gemini-3.8-flash','grok-4.6','grok-code-fast-1','gpt-5.6-sol','claude-sonnet-5','deepseek-v4-flash','mistral-small-latest','openai/gpt-oss-120b','qwen3.7-plus','kimi-k3','kimi-k2.7-code-highspeed']) {
    assert.match(catalogMigration, new RegExp(modelId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  }
  assert.match(vaultMigration, /'alibaba-model-studio'[\s\S]*?false,[\s\S]*?90/);
});

test('Google Gemini is the real provider and platform is only its credential source', () => {
  assert.equal(resolveGenerationRoute('google-gemini', 'platform').adapter, 'gemini');
  assert.equal(resolveGenerationRoute('google-gemini', 'byok').adapter, 'gemini');
  assert.equal(resolveGenerationRoute('openai', 'platform'), null);
  assert.match(html, /Provedor de geração/);
  assert.doesNotMatch(html, /value="platform"/);
});

test('legacy platform mode normalizes explicitly to Google Gemini', () => {
  const route = resolveGenerationRoute('platform', 'platform');
  assert.equal(route.providerSlug, 'google-gemini');
  assert.equal(route.legacyAlias, true);
});

test('provider without adapter remains visible with models but cannot execute', () => {
  const anthropic = provider('unsupported', false, [], [{ model_id: 'catalog-only', display_name: 'Catalog only' }]);
  assert.equal(generationModelsForProvider([anthropic], 'unsupported').length, 1);
  assert.deepEqual(generationUiState({ provider: anthropic, credential: { validationStatus: 'valid' } }), {
    executable: false,
    availability: 'Execução ainda não disponível',
    credentialSource: 'Nenhuma origem de credencial executável',
    credentialStatus: 'Chave cadastrada; execução indisponível',
  });
});

test('adapter availability and credential presence remain independent', () => {
  const openai = provider('openai', true, ['byok']);
  assert.equal(generationUiState({ provider: openai }).executable, false);
  assert.equal(generationUiState({ provider: openai }).credentialStatus, 'Sem chave cadastrada');
  const configured = generationUiState({ provider: openai, credential: { validationStatus: 'untested' } });
  assert.equal(configured.executable, true);
  assert.equal(configured.credentialStatus, 'Chave cadastrada · Ainda não testada');
  assert.doesNotMatch(configured.credentialStatus, /untested|validada/i);
  assert.equal(
    generationUiState({ provider: openai, credential: { validationStatus: 'valid' } }).credentialStatus,
    'Chave cadastrada · Validada no provedor',
  );
  assert.equal(
    generationUiState({ provider: openai, credential: { validationStatus: 'invalid' } }).credentialStatus,
    'Chave cadastrada · Inválida',
  );
  assert.equal(
    generationUiState({ provider: openai, credential: { validationStatus: 'error' } }).credentialStatus,
    'Chave cadastrada · Erro na última validação',
  );
});

test('platform Gemini executes without BYOK and returns canonical provider semantics', async () => {
  const previous = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  const result = response();
  try {
    await generate({ method: 'POST', headers: { 'x-forwarded-for': 'gemini-platform-source' }, body: {
      brief: 'Crie uma página acessível.', generationProvider: 'google-gemini', generationModel: 'gemini-3.5-flash-lite',
      credentialSource: 'platform', taskType: 'cited', targetModel: 'claude',
    } }, result);
  } finally {
    if (previous === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previous;
  }
  assert.equal(result.statusCode, 200);
  assert.equal(result.body.generationProvider, 'google-gemini');
  assert.equal(result.body.credentialSource, 'platform');
  assert.equal(result.body.targetModel, 'claude');
});

test('backend rejects provider without adapter and invalid credential sources', async () => {
  for (const body of [
    { generationProvider: 'unsupported', generationModel: 'catalog-only', credentialSource: 'byok' },
    { generationProvider: 'openai', generationModel: 'gpt-5.6-sol', credentialSource: 'platform' },
    { generationProvider: 'google-gemini', generationModel: 'gemini-3.8-flash', credentialSource: 'invalid' },
  ]) {
    const result = response();
    await generate({ method: 'POST', body: { brief: 'Crie uma página.', targetModel: 'grok', taskType: 'cited', ...body } }, result);
    assert.equal(result.statusCode, 400);
    assert.equal(result.body.code, 'generation_route_unsupported');
  }
});

test('catalog loads without external validation calls and local is a separate strategy', () => {
  assert.match(main, /fetch\('\/api\/providers'\)/);
  assert.doesNotMatch(main, /fetch\([^\n]*\/test/);
  assert.match(html, /id="local-generation"/);
  assert.doesNotMatch(html, /<option value="local"/);
});
