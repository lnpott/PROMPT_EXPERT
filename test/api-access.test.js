import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import generate from '../api/generate.js';
import health from '../api/health.js';

const originalFetch = globalThis.fetch;
const originalApiKey = process.env.GEMINI_API_KEY;

function createResponse() {
  return {
    headers: {},
    statusCode: null,
    body: null,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function jsonResponse(body, { ok = true, status = 200 } = {}) {
  return { ok, status, json: async () => body };
}

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (originalApiKey === undefined) delete process.env.GEMINI_API_KEY;
  else process.env.GEMINI_API_KEY = originalApiKey;
});

test('GET /api/generate is denied and advertises the allowed method', async () => {
  const response = createResponse();

  await generate({ method: 'GET' }, response);

  assert.equal(response.statusCode, 405);
  assert.equal(response.headers.Allow, 'POST');
  assert.deepEqual(response.body, { error: 'Método não permitido.' });
});

test('POST /api/generate rejects invalid input before accessing services', async () => {
  process.env.GEMINI_API_KEY = 'test-only-key';
  globalThis.fetch = () => assert.fail('Invalid input must not access an external service');
  const response = createResponse();

  await generate({ method: 'POST', body: { brief: '  ', model: 'Grok' } }, response);

  assert.equal(response.statusCode, 400);
  assert.match(response.body.error, /6\.000 caracteres/);
});

test('POST /api/generate reports unavailable AI configuration without exposing secrets', async () => {
  delete process.env.GEMINI_API_KEY;
  const response = createResponse();

  await generate({ method: 'POST', body: { brief: 'Crie uma página acessível', model: 'Grok' } }, response);

  assert.equal(response.statusCode, 503);
  assert.equal(response.body.code, 'GEMINI_NOT_CONFIGURED');
  assert.equal(JSON.stringify(response.body).includes('API_KEY'), false);
});

test('POST /api/generate accesses the knowledge base and Gemini with a valid request', async () => {
  process.env.GEMINI_API_KEY = 'test-only-key';
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url, options });
    if (url.includes('model_profiles')) {
      return jsonResponse([{ id: 7, display_name: 'Grok', system_guidance: 'Seja objetivo.', output_contract: 'Use Markdown.' }]);
    }
    if (url.includes('prompt_rules')) return jsonResponse([{ rule_text: 'Inclua critérios de aceite.', priority: 1 }]);
    return jsonResponse({ candidates: [{ content: { parts: [{ text: '# Prompt validado' }] } }] });
  };
  const response = createResponse();

  await generate({ method: 'POST', body: { brief: 'Crie uma página acessível', model: 'Grok' } }, response);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, { prompt: '# Prompt validado', source: 'gemini' });
  assert.equal(calls.length, 3);
  assert.equal(calls[2].options.headers['x-goog-api-key'], 'test-only-key');
  assert.match(JSON.parse(calls[2].options.body).contents[0].parts[0].text, /Inclua critérios de aceite/);
});

test('GET /api/health confirms access to the knowledge base', async () => {
  delete process.env.GEMINI_API_KEY;
  globalThis.fetch = async (url) => url.includes('model_profiles')
    ? jsonResponse([{ id: 7, display_name: 'Grok' }])
    : jsonResponse([]);
  const response = createResponse();

  await health({}, response);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, { status: 'ok', knowledgeBase: 'Grok', geminiConfigured: false });
});

test('GET /api/health returns a degraded status when the knowledge base is inaccessible', async () => {
  process.env.GEMINI_API_KEY = 'test-only-key';
  globalThis.fetch = async () => jsonResponse({}, { ok: false, status: 503 });
  const response = createResponse();

  await health({}, response);

  assert.equal(response.statusCode, 503);
  assert.deepEqual(response.body, { status: 'degraded', knowledgeBase: 'unavailable', geminiConfigured: true });
});
