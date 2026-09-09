import assert from 'node:assert/strict';
import test from 'node:test';
import { directProvider, DIRECT_PROVIDER_SLUGS, generateWithDirectProvider, validateDirectCredential } from '../server/providers/direct-providers.js';
import { generateCompatible, validateCompatibleCredential } from '../server/providers/openai-compatible.js';

const expected = {
  openai: 'https://api.openai.com/v1', xai: 'https://api.x.ai/v1', deepseek: 'https://api.deepseek.com',
  groq: 'https://api.groq.com/openai/v1', mistral: 'https://api.mistral.ai/v1',
};
function response(status, body = {}) { return { ok: status >= 200 && status < 300, status, headers: new Headers(), text: async () => typeof body === 'string' ? body : JSON.stringify(body) }; }

for (const slug of DIRECT_PROVIDER_SLUGS) {
  test(`${slug}: missing credential fails before network access`, async () => {
    let called = false;
    await assert.rejects(() => validateDirectCredential(slug, '', async () => { called = true; }), { code: 'credential_missing' });
    assert.equal(called, false);
  });
  test(`${slug}: fixed URL, bearer and models validation`, async () => {
    let seen;
    await validateDirectCredential(slug, 'fictional-key', async (url, options) => { seen = { url, options }; return response(200, { data: [] }); });
    assert.equal(seen.url, `${expected[slug]}/models`);
    assert.equal(seen.options.headers.Authorization, 'Bearer fictional-key');
    assert.equal(seen.options.redirect, 'error');
  });
  test(`${slug}: normalized generation and safe usage`, async () => {
    let seen;
    const result = await generateWithDirectProvider(slug, { apiKey: 'fictional', model: 'catalog-model', instruction: 'compile' }, async (url, options) => {
      seen = { url, options }; return response(200, { choices: [{ message: { content: 'safe result' } }], usage: { total_tokens: 7 } });
    });
    assert.equal(seen.url, `${expected[slug]}/chat/completions`);
    assert.deepEqual(JSON.parse(seen.options.body), { model: 'catalog-model', messages: [{ role: 'user', content: 'compile' }], max_tokens: 4096 });
    assert.deepEqual(result, { content: 'safe result', usage: { promptTokens: undefined, completionTokens: undefined, totalTokens: 7 } });
    assert.doesNotMatch(JSON.stringify(result), /fictional/);
  });
  for (const [status, code] of [[401, 'credential_invalid'], [403, 'credential_invalid'], [402, 'provider_insufficient_credits'], [429, 'provider_rate_limited'], [500, 'provider_unavailable']]) {
    test(`${slug}: HTTP ${status} becomes ${code}`, async () => {
      await assert.rejects(() => validateDirectCredential(slug, 'fictional', async () => response(status)), { code });
    });
  }
  test(`${slug}: network and malformed upstream are operational errors`, async () => {
    await assert.rejects(() => validateDirectCredential(slug, 'fictional', async () => { throw new TypeError('network detail'); }), { code: 'provider_network_error' });
    await assert.rejects(() => validateDirectCredential(slug, 'fictional', async () => response(200, 'broken')), { code: 'provider_invalid_response' });
    await assert.rejects(() => generateWithDirectProvider(slug, { apiKey: 'x', model: 'm', instruction: 'i' }, async () => response(200, {})), { code: 'provider_invalid_response' });
  });
  test(`${slug}: invalid model fails before network access`, async () => {
    let called = false;
    await assert.rejects(() => generateWithDirectProvider(slug, { apiKey: 'fictional', model: '', instruction: 'i' }, async () => { called = true; }), { code: 'provider_model_unavailable' });
    assert.equal(called, false);
  });
}

test('shared transport enforces timeout through AbortController', async () => {
  const config = { baseUrl: 'https://fixed.invalid', modelsPath: '/models', chatPath: '/chat/completions', timeoutMs: 5 };
  await assert.rejects(() => validateCompatibleCredential(config, 'fictional', (_url, options) => new Promise((_resolve, reject) => {
    options.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
  })), { code: 'provider_timeout' });
});

test('registry maps only Groq public selection to the catalog credential slug', () => {
  assert.equal(directProvider('groq').credentialSlug, 'groqcloud');
  assert.equal(directProvider('groqcloud').slug, 'groq');
  assert.equal(directProvider('openrouter'), null);
  assert.equal(directProvider('gemini'), null);
});
