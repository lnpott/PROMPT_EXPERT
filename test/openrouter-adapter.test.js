import assert from 'node:assert/strict';
import test from 'node:test';
import { generateWithOpenRouter, OpenRouterError, OPENROUTER_TIMEOUT_MS, validateOpenRouterKey } from '../server/providers/openrouter.js';

function response(status, body = {}, headers = new Headers()) {
  return { ok: status >= 200 && status < 300, status, headers, text: async () => typeof body === 'string' ? body : JSON.stringify(body) };
}

test('OpenRouter validation uses the fixed key endpoint and server authorization', async () => {
  let call;
  await validateOpenRouterKey('fictional-secret', async (url, options) => { call = { url, options }; return response(200, { data: { label: 'key' } }); });
  assert.equal(call.url, 'https://openrouter.ai/api/v1/key');
  assert.equal(call.options.method, 'GET');
  assert.equal(call.options.headers.Authorization, 'Bearer fictional-secret');
  assert.equal(OPENROUTER_TIMEOUT_MS, 12_000);
});

test('OpenRouter generation builds a constrained server-side chat payload', async () => {
  let call;
  const prompt = await generateWithOpenRouter({ apiKey: 'fictional', model: 'openrouter/free', instruction: 'Compile isto' }, async (url, options) => {
    call = { url, options }; return response(200, { choices: [{ message: { content: 'Resultado seguro' } }] });
  });
  assert.equal(prompt, 'Resultado seguro');
  assert.equal(call.url, 'https://openrouter.ai/api/v1/chat/completions');
  assert.deepEqual(JSON.parse(call.options.body), { model: 'openrouter/free', messages: [{ role: 'user', content: 'Compile isto' }], max_tokens: 4096 });
});

for (const [status, code] of [[401, 'invalid'], [403, 'invalid'], [402, 'insufficient_credits'], [404, 'model_unavailable'], [429, 'rate_limit'], [500, 'temporary_provider_error']]) {
  test(`OpenRouter classifies HTTP ${status} as ${code}`, async () => {
    await assert.rejects(() => validateOpenRouterKey('fictional', async () => response(status)), (error) => error instanceof OpenRouterError && error.code === code);
  });
}

test('OpenRouter rejects malformed and oversized responses defensively', async () => {
  await assert.rejects(() => validateOpenRouterKey('fictional', async () => response(200, 'not-json')), { code: 'malformed_response' });
  await assert.rejects(() => generateWithOpenRouter({ apiKey: 'x', model: 'openrouter/free', instruction: 'x' }, async () => response(200, {})), { code: 'malformed_response' });
  await assert.rejects(() => validateOpenRouterKey('fictional', async () => response(200, '{}', new Headers({ 'content-length': '1000001' }))), { code: 'malformed_response' });
});

test('OpenRouter converts network failures into operational errors', async () => {
  await assert.rejects(() => validateOpenRouterKey('fictional', async () => { throw new TypeError('socket detail'); }), { code: 'network_error' });
});
