import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import generate from '../api/generate.js';
import health from '../api/health.js';
import profiles from '../api/profiles.js';
import { compilePrompt, findProfile, modelProfiles } from '../api/model-profiles.js';

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
  return { ok, status, headers: { get: () => null }, json: async () => body };
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

  await generate({ method: 'POST', body: { brief: '  ', model: 'grok' } }, response);

  assert.equal(response.statusCode, 400);
  assert.match(response.body.error, /6\.000 caracteres/);
});

test('POST /api/generate works locally without API keys', async () => {
  delete process.env.GEMINI_API_KEY;
  const response = createResponse();

  await generate({ method: 'POST', headers: { 'x-forwarded-for': 'local-mode' }, body: { brief: 'Crie uma página acessível', model: 'claude', taskType: 'application', complexity: 'high' } }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.source, 'local');
  assert.match(response.body.prompt, /Prompt para Claude/);
  assert.match(response.body.prompt, /Complexidade: alta/);
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

  await generate({ method: 'POST', headers: { 'x-forwarded-for': 'gemini-mode' }, body: { brief: 'Crie uma página acessível', model: 'grok' } }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.prompt, '# Prompt validado');
  assert.equal(response.body.source, 'gemini');
  assert.match(response.body.requestId, /^[a-f0-9-]+$/);
  assert.equal(calls.length, 3);
  assert.equal(calls[2].options.headers['x-goog-api-key'], 'test-only-key');
  assert.match(JSON.parse(calls[2].options.body).contents[0].parts[0].text, /Inclua critérios de aceite/);
});

test('POST /api/generate falls back locally when Gemini rejects the request', async () => {
  process.env.GEMINI_API_KEY = 'invalid-test-key';
  globalThis.fetch = async (url) => url.includes('model_profiles')
    ? jsonResponse([])
    : jsonResponse({ error: 'invalid key' }, { ok: false, status: 400 });
  const response = createResponse();

  await generate({ method: 'POST', headers: { 'x-forwarded-for': 'provider-rejection' }, body: { brief: 'Crie um formulário seguro.', model: 'gemini' } }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.source, 'local-fallback');
  assert.match(response.body.prompt, /Prompt para Gemini/);
  assert.equal(JSON.stringify(response.body).includes('invalid-test-key'), false);
});

test('POST /api/generate falls back locally on an empty Gemini response', async () => {
  process.env.GEMINI_API_KEY = 'test-only-key';
  globalThis.fetch = async (url) => url.includes('model_profiles')
    ? jsonResponse([])
    : jsonResponse({ candidates: [] });
  const response = createResponse();

  await generate({ method: 'POST', headers: { 'x-forwarded-for': 'empty-provider' }, body: { brief: 'Refatore o módulo.', model: 'openai', taskType: 'refactor' } }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.source, 'local-fallback');
  assert.match(response.body.prompt, /Refatoração de código existente/);
});

test('GET /api/health confirms access to the knowledge base', async () => {
  delete process.env.GEMINI_API_KEY;
  globalThis.fetch = async (url) => url.includes('model_profiles')
    ? jsonResponse([{ id: 7, display_name: 'Grok' }])
    : jsonResponse([]);
  const response = createResponse();

  await health({}, response);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, { status: 'ok', knowledgeBase: 'Grok', generator: 'local' });
});

test('GET /api/health confirms local fallback when the knowledge base is inaccessible', async () => {
  process.env.GEMINI_API_KEY = 'test-only-key';
  globalThis.fetch = async () => jsonResponse({}, { ok: false, status: 503 });
  const response = createResponse();

  await health({}, response);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body, { status: 'ok', knowledgeBase: 'local', generator: 'gemini' });
});

test('GET /api/profiles exposes nine safe public profiles', () => {
  const response = createResponse();
  profiles({ method: 'GET' }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.profiles.length, 9);
  assert.equal(response.body.profiles.some((profile) => 'rules' in profile), false);
});

test('local compiler adapts instructions to task and provider', () => {
  const prompt = compilePrompt({
    brief: 'Complete a função entre prefixo e sufixo.',
    profile: findProfile('codestral'),
    taskType: 'fim',
    complexity: 'low',
  });

  assert.match(prompt, /Prompt para Codestral/);
  assert.match(prompt, /Fill-in-the-Middle/);
  assert.match(prompt, /Complexidade: baixa/);
  assert.doesNotMatch(prompt, /pense passo a passo/i);
});

test('every supported profile compiles a complete prompt without API access', () => {
  for (const profile of modelProfiles) {
    const prompt = compilePrompt({ brief: 'Implemente uma API segura.', profile });
    assert.match(prompt, new RegExp(profile.displayName.replace('/', '\\/')));
    assert.match(prompt, /Critérios de aceite/i);
    assert.match(prompt, /segurança/i);
  }
});
