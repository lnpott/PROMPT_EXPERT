import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import providersHandler, { allowlistedModel, allowlistedProvider } from '../api/providers.js';

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
  assert.equal(result.body.providers[0].generation.generationSupported, true);
  assert.deepEqual(result.body.providers[0].generation.credentialSources, ['byok']);
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

test('Google Gemini exposes only models returned by its catalog relationship', async () => {
  globalThis.fetch = (url) => url.includes('ai_models')
    ? jsonResponse([{ ...model, model_id: 'gemini-3.8-flash', api_providers: { slug: 'google-gemini' } }])
    : jsonResponse([{ ...provider, slug: 'google-gemini', display_name: 'Google Gemini' }]);
  const result = response();
  await providersHandler({ method: 'GET' }, result);
  assert.equal(result.body.providers[0].display_name, 'Google Gemini');
  assert.equal(result.body.providers[0].generation.generationSupported, true);
  assert.deepEqual(result.body.providers[0].generation.credentialSources, ['platform', 'byok']);
  assert.deepEqual(result.body.providers[0].models.map(({ model_id }) => model_id), ['gemini-3.8-flash']);
});

test('all catalog mutation methods are blocked before database access', async () => {
  globalThis.fetch = () => assert.fail('mutating methods must not query the catalog');
  const result = response();
  await providersHandler({ method: 'POST', query: {} }, result);
  assert.equal(result.statusCode, 405);
  assert.equal(result.headers.Allow, 'GET');
});
