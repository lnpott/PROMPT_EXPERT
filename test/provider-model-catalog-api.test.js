import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import providersHandler, { allowlistedModel, allowlistedProvider } from '../api/providers.js';
import providerHandler from '../api/providers/[slug].js';
import modelsHandler from '../api/providers/[slug]/models.js';
import modelHandler from '../api/providers/[slug]/models/[model].js';

const originalFetch = globalThis.fetch;

function jsonResponse(body, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function response() {
  return { statusCode: 0, body: null, headers: {}, setHeader(k,v){this.headers[k]=v;}, status(code){this.statusCode=code;return this;}, json(body){this.body=body;return this;} };
}

const provider = {
  slug: 'openrouter', display_name: 'OpenRouter', category: 'gateway', short_description: 'Gateway oficial.',
  long_description: 'Descrição expandida.', website_url: 'https://openrouter.ai/', docs_url: 'https://openrouter.ai/docs',
  free_tier_status: 'gateway_free', last_verified_at: '2026-09-08', base_url: 'hidden', auth_scheme: 'hidden',
};
const model = {
  model_id: 'openrouter/free', display_name: 'Free Models Router', family: 'Router', description: null,
  input_price: null, output_price: null, pricing_notes: 'Seleção dinâmica.', free_tier_status: 'gateway_free',
  is_deprecated: false, api_providers: { slug: 'openrouter' }, internal: 'hidden',
};

function catalogFetch(url) {
  if (url.includes('ai_models')) return jsonResponse([model]);
  if (url.includes('api_providers')) return jsonResponse([provider]);
  return jsonResponse({}, 404);
}

afterEach(() => { globalThis.fetch = originalFetch; });

test('rich provider endpoint exposes explicit presentation/model allowlists only', async () => {
  globalThis.fetch = catalogFetch;
  const result = response();
  await providersHandler({ method: 'GET' }, result);
  assert.equal(result.statusCode, 200);
  assert.equal(result.body.providers[0].models[0].model_id, 'openrouter/free');
  const serialized = JSON.stringify(result.body);
  assert.doesNotMatch(serialized, /base_url|auth_scheme|internal|user_api_credentials|ciphertext|auth_tag/);
  assert.equal(result.body.providers[0].media_url, null);
  assert.equal(result.body.providers[0].models[0].context_window_tokens, null);
});

test('allowlist helpers safely represent unknown provider and pricing fields as null', () => {
  assert.equal(allowlistedProvider({ slug: 'minimal' }).short_description, null);
  assert.equal(allowlistedProvider({ slug: 'minimal' }).models.length, 0);
  assert.equal(allowlistedModel({ model_id: 'minimal' }).input_price, null);
  assert.equal(allowlistedModel({ model_id: 'minimal' }).official_url, null);
});

test('detail endpoints return provider, models and individual model without internal IDs', async () => {
  globalThis.fetch = catalogFetch;
  const providerResult = response();
  await providerHandler({ method: 'GET', query: { slug: 'openrouter' } }, providerResult);
  assert.equal(providerResult.body.provider.slug, 'openrouter');
  const modelsResult = response();
  await modelsHandler({ method: 'GET', query: { slug: 'openrouter' } }, modelsResult);
  assert.equal(modelsResult.body.models.length, 1);
  const modelResult = response();
  await modelHandler({ method: 'GET', query: { slug: 'openrouter', model: 'openrouter/free' } }, modelResult);
  assert.equal(modelResult.body.model.model_id, 'openrouter/free');
  assert.doesNotMatch(JSON.stringify([providerResult.body, modelsResult.body, modelResult.body]), /"id"|provider_id/);
});

test('provider/model endpoints return 404 for nonexistent or unpublished records', async () => {
  globalThis.fetch = async (url) => jsonResponse(url.includes('api_providers') ? [] : []);
  for (const [handler, query] of [
    [providerHandler, { slug: 'inactive-provider' }],
    [modelsHandler, { slug: 'missing-provider' }],
    [modelHandler, { slug: 'openrouter', model: 'inactive-or-deprecated-model' }],
  ]) {
    const result = response();
    await handler({ method: 'GET', query }, result);
    assert.equal(result.statusCode, 404);
  }
});

test('all catalog mutation methods are blocked before database access', async () => {
  globalThis.fetch = () => assert.fail('mutating methods must not query the catalog');
  for (const handler of [providersHandler, providerHandler, modelsHandler, modelHandler]) {
    const result = response();
    await handler({ method: 'POST', query: {} }, result);
    assert.equal(result.statusCode, 405);
    assert.equal(result.headers.Allow, 'GET');
  }
});
