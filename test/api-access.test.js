import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import generate from './helpers/authenticated-generate.js';
import compilers from '../api/compilers.js';
import health from '../api/health.js';
import profiles from '../api/profiles.js';
import providers from '../api/providers.js';
import provenance from '../api/provenance.js';
import { compilePrompt, findProfile, modelProfiles } from '../api/model-profiles.js';
import { DEFAULT_COMPILER_MODEL, findCompilerModel, publicCompilerModels } from '../api/compiler-models.js';

const originalFetch = globalThis.fetch;
const originalApiKey = process.env.GEMINI_API_KEY;
const originalGeminiModel = process.env.GEMINI_MODEL;

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
  if (originalGeminiModel === undefined) delete process.env.GEMINI_MODEL;
  else process.env.GEMINI_MODEL = originalGeminiModel;
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

  await generate({ method: 'POST', body: { generationProvider: 'platform', generationModel: 'gemini-3.5-flash-lite', brief: '  ', targetModel: 'grok' } }, response);

  assert.equal(response.statusCode, 400);
  assert.match(response.body.error, /6\.000 caracteres/);
});

test('POST /api/generate rejects task types outside the public contract', async () => {
  delete process.env.GEMINI_API_KEY;
  const response = createResponse();

  await generate({ method: 'POST', body: { generationProvider: 'platform', generationModel: 'gemini-3.5-flash-lite', brief: 'Crie uma página.', targetModel: 'grok', taskType: 'complex' } }, response);

  assert.equal(response.statusCode, 400);
});

test('POST /api/generate rejects compiler models outside the public allowlist', async () => {
  const response = createResponse();

  await generate({ method: 'POST', body: { generationProvider: 'platform', generationModel: 'arbitrary-model', brief: 'Crie uma página.', targetModel: 'grok' } }, response);

  assert.equal(response.statusCode, 400);
});

test('POST /api/generate works locally without API keys', async () => {
  delete process.env.GEMINI_API_KEY;
  const response = createResponse();

  await generate({ method: 'POST', headers: { 'x-forwarded-for': 'local-mode' }, body: { generationProvider: 'platform', generationModel: 'gemini-3.5-flash-lite', brief: 'Crie uma página acessível', targetModel: 'claude' } }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.source, 'local');
  assert.match(response.body.prompt, /Prompt para Claude/);
  assert.match(response.body.prompt, /Executar exatamente as tarefas citadas/);
  assert.equal(JSON.stringify(response.body).includes('API_KEY'), false);
});

test('POST /api/generate uses only the verified local methodology corpus before Gemini', async () => {
  process.env.GEMINI_API_KEY = 'test-only-key';
  const calls = [];
  globalThis.fetch = async (url, options = {}) => {
    calls.push({ url, options });
    return jsonResponse({ candidates: [{ content: { parts: [{ text: '# Prompt validado' }] } }] });
  };
  const response = createResponse();

  await generate({ method: 'POST', headers: { 'x-forwarded-for': 'gemini-mode' }, body: { generationProvider: 'platform', generationModel: 'gemini-3.5-flash-lite', brief: 'Crie uma página acessível', targetModel: 'grok' } }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.prompt, '# Prompt validado');
  assert.equal(response.body.source, 'gemini');
  assert.match(response.body.requestId, /^[a-f0-9-]+$/);
  const [geminiCall] = calls.filter(({ url }) => url.includes(':generateContent'));
  assert.ok(geminiCall);
  assert.equal(geminiCall.options.headers['x-goog-api-key'], 'test-only-key');
  assert.match(geminiCall.url, /models\/gemini-3\.5-flash-lite:generateContent$/);
  assert.match(JSON.parse(geminiCall.options.body).contents[0].parts[0].text, /critérios de aceite observáveis/);
  assert.ok(!calls.some(({ url }) => url.includes('model_profiles') || url.includes('prompt_rules')));
});

test('POST /api/generate uses the compiler model selected by the user', async () => {
  process.env.GEMINI_API_KEY = 'test-only-key';
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(url);
    if (url.includes('model_profiles') || url.includes('prompt_rules')) return jsonResponse([]);
    return jsonResponse({ candidates: [{ content: { parts: [{ text: '# Prompt por modelo selecionado' }] } }] });
  };
  const response = createResponse();

  await generate({ method: 'POST', headers: { 'x-forwarded-for': 'selected-compiler' }, body: { generationProvider: 'platform', generationModel: 'gemini-3.8-flash', brief: 'Crie uma página acessível', targetModel: 'grok' } }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.generationModel, 'gemini-3.8-flash');
  assert.match(calls.at(-1), /models\/gemini-3\.8-flash:generateContent$/);
});

test('POST /api/generate falls back locally when Gemini rejects the request', async () => {
  process.env.GEMINI_API_KEY = 'invalid-test-key';
  globalThis.fetch = async (url) => url.includes('model_profiles')
    ? jsonResponse([])
    : jsonResponse({ error: 'invalid key' }, { ok: false, status: 400 });
  const response = createResponse();

  await generate({ method: 'POST', headers: { 'x-forwarded-for': 'provider-rejection' }, body: { generationProvider: 'platform', generationModel: 'gemini-3.5-flash-lite', brief: 'Crie um formulário seguro.', targetModel: 'gemini' } }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.source, 'local-fallback');
  assert.match(response.body.prompt, /Prompt para Gemini/);
  assert.equal(JSON.stringify(response.body).includes('invalid-test-key'), false);
});

test('generation telemetry is sanitized and request identifiers match the response header', async () => {
  process.env.GEMINI_API_KEY = 'test-only-key';
  const privateBrief = 'brief-que-nao-pode-ir-aos-logs';
  globalThis.fetch = async (url) => url.includes('model_profiles')
    ? jsonResponse([])
    : jsonResponse({}, { ok: false, status: 400 });
  const entries = [];
  const originalInfo = console.info;
  console.info = (entry) => entries.push(entry);
  const response = createResponse();

  try {
    await generate({ method: 'POST', headers: { 'x-forwarded-for': 'telemetry-test' }, body: { generationProvider: 'platform', generationModel: 'gemini-3.5-flash-lite', brief: privateBrief, targetModel: 'grok' } }, response);
  } finally {
    console.info = originalInfo;
  }

  assert.equal(response.headers['X-Request-Id'], response.body.requestId);
  assert.equal(entries.length, 1);
  assert.doesNotMatch(entries[0], new RegExp(privateBrief));
  assert.doesNotMatch(entries[0], /test-only-key/);
  assert.match(entries[0], /"durationMs":\d+/);
  assert.match(entries[0], /"attempts":1/);
});

test('POST /api/generate rate limits a client and provides Retry-After', async () => {
  delete process.env.GEMINI_API_KEY;
  const originalInfo = console.info;
  console.info = () => {};
  let response;
  try {
    for (let requestNumber = 0; requestNumber < 21; requestNumber += 1) {
      response = createResponse();
      await generate({ method: 'POST', headers: { 'x-forwarded-for': 'rate-limit-test' }, body: { generationProvider: 'platform', generationModel: 'gemini-3.5-flash-lite', brief: 'Crie uma página.', targetModel: 'grok' } }, response);
    }
  } finally {
    console.info = originalInfo;
  }

  assert.equal(response.statusCode, 429);
  assert.equal(response.headers['Retry-After'], '60');
});

test('POST /api/generate falls back locally on an empty Gemini response', async () => {
  process.env.GEMINI_API_KEY = 'test-only-key';
  globalThis.fetch = async (url) => url.includes('model_profiles')
    ? jsonResponse([])
    : jsonResponse({ candidates: [] });
  const response = createResponse();

  await generate({ method: 'POST', headers: { 'x-forwarded-for': 'empty-provider' }, body: { generationProvider: 'platform', generationModel: 'gemini-3.5-flash-lite', brief: 'Refatore o módulo.', targetModel: 'openai', taskType: 'refactor' } }, response);

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

test('GET /api/profiles exposes family and specific safe public profiles', async () => {
  const response = createResponse();
  await profiles({ method: 'GET' }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.profiles.length, 23);
  assert.equal(response.body.profiles.some((profile) => 'rules' in profile), false);
});

test('GET /api/compilers exposes selectable models and their required key name', () => {
  const response = createResponse();
  compilers({ method: 'GET' }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.compilers.length, 5);
  assert.equal(response.body.compilers.filter((model) => model.isDefault).length, 1);
  assert.equal(response.body.compilers[0].slug, DEFAULT_COMPILER_MODEL);
  assert.equal(response.body.compilers.every((model) => model.apiKeyEnvironmentVariable === 'GEMINI_API_KEY'), true);
  assert.equal(findCompilerModel('gemini-3.8'), undefined);
  assert.equal(publicCompilerModels().some((model) => model.slug === 'gemini-3.1-flash'), false);
});

test('GET /api/provenance exposes reviewed sources and summary', async () => {
  globalThis.fetch = async () => jsonResponse([
    { slug: 'source-a', validation_status: 'confirmed' },
    { slug: 'source-b', validation_status: 'partial' },
    { slug: 'source-c', validation_status: 'confirmed' },
  ]);
  const response = createResponse();

  await provenance({ method: 'GET' }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.count, 3);
  assert.deepEqual(response.body.summary, { confirmed: 2, partial: 1 });
});

test('GET /api/provenance fails closed when the base is unavailable', async () => {
  globalThis.fetch = async () => jsonResponse({}, { ok: false, status: 503 });
  const response = createResponse();

  await provenance({ method: 'GET' }, response);

  assert.equal(response.statusCode, 503);
  assert.deepEqual(response.body, { status: 'unavailable', error: 'A proveniência não está disponível agora.' });
});

test('GET /api/providers exposes only active public provider fields', async () => {
  const requestUrls = [];
  globalThis.fetch = async (url) => {
    requestUrls.push(url);
    if (url.includes('ai_models')) return jsonResponse([]);
    return jsonResponse([{
      slug: 'openrouter',
      display_name: 'OpenRouter',
      category: 'gateway',
      signup_url: 'https://openrouter.ai/',
      api_key_url: 'https://openrouter.ai/settings/keys',
      docs_url: 'https://openrouter.ai/docs/quickstart',
      key_prefix_hint: 'sk-or-',
      supports_generation: true,
      supports_model_listing: true,
      is_active: true,
      sort_order: 10,
    }]);
  };
  const response = createResponse();

  await providers({ method: 'GET' }, response);

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.providers.length, 1);
  assert.match(requestUrls[0], /api_providers\?is_active=eq\.true/);
  assert.match(requestUrls[0], /select=slug,display_name,category/);
  assert.match(requestUrls[1], /ai_models\?is_active=eq\.true&is_public=eq\.true&is_deprecated=eq\.false/);
  assert.doesNotMatch(requestUrls.join('\n'), /user_api_credentials|ciphertext|auth_tag|user_id|base_url|auth_scheme/);
  assert.equal('id' in response.body.providers[0], false);
});

test('GET /api/providers denies mutation methods', async () => {
  globalThis.fetch = () => assert.fail('Denied methods must not access Supabase');
  const response = createResponse();

  await providers({ method: 'POST' }, response);

  assert.equal(response.statusCode, 405);
  assert.equal(response.headers.Allow, 'GET');
});

test('GET /api/providers fails closed when Supabase is unavailable', async () => {
  globalThis.fetch = async () => jsonResponse({}, { ok: false, status: 503 });
  const response = createResponse();

  await providers({ method: 'GET' }, response);

  assert.equal(response.statusCode, 503);
  assert.deepEqual(response.body, {
    status: 'unavailable',
    error: 'O catálogo de provedores não está disponível agora.',
  });
});

test('local compiler adapts instructions to task and provider', () => {
  const prompt = compilePrompt({
    brief: 'Complete a função entre prefixo e sufixo.',
    profile: findProfile('codestral'),
    taskType: 'fim',
  });

  assert.match(prompt, /Prompt para Codestral/);
  assert.match(prompt, /Fill-in-the-Middle/);
  assert.doesNotMatch(prompt, /Complexidade:/);
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

test('local compiler defaults to cited tasks and never adds complexity', () => {
  const prompt = compilePrompt({ brief: 'Implemente os itens descritos.', profile: findProfile('grok') });

  assert.match(prompt, /Executar exatamente as tarefas citadas no briefing/);
  assert.doesNotMatch(prompt, /complexidade/i);
});
