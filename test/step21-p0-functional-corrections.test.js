import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import generate, { createGenerateHandler } from '../api/generate.js';
import { fimAvailableForTarget, methodologyTaskType, resolveMethodologyPackage, taskTypes } from '../api/model-profiles.js';
import { generationModelSelection, generationModelsForProvider, generationUiState, LOCAL_GENERATION_OPTION } from '../src/generation/provider-options.js';
import { renderAccountState } from '../src/auth/ui.js';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');

function element() { return { hidden: false, textContent: '' }; }
function authElements() {
  return Object.fromEntries(['sessionLoading', 'topbar', 'accountPanel', 'appContent', 'accountNavigation', 'signedOut', 'signedIn', 'recoveryPanel', 'providersLocked', 'providersPlaceholder', 'accountStatus', 'userEmail', 'feedback'].map((key) => [key, element()]));
}
function response() { return { statusCode: 0, body: null, setHeader() {}, status(value) { this.statusCode = value; return this; }, json(value) { this.body = value; return this; } }; }

test('auth gate covers loading, visitor, restored session, recovery and logout', () => {
  const ui = authElements();
  assert.match(html, /id="topbar" hidden/);
  assert.match(html, /id="app-content" hidden/);
  renderAccountState(ui, { initialized: false, user: null, recoverySession: false, configured: true });
  assert.equal(ui.sessionLoading.hidden, false);
  assert.equal(ui.topbar.hidden, true);
  assert.equal(ui.appContent.hidden, true);
  renderAccountState(ui, { initialized: true, user: null, recoverySession: false, configured: true });
  assert.equal(ui.accountPanel.hidden, false);
  assert.equal(ui.appContent.hidden, true);
  renderAccountState(ui, { initialized: true, user: { email: 'a@test.dev' }, recoverySession: false, configured: true });
  assert.equal(ui.appContent.hidden, false);
  renderAccountState(ui, { initialized: true, user: { email: 'a@test.dev' }, recoverySession: true, configured: true });
  assert.equal(ui.appContent.hidden, true);
  assert.equal(ui.recoveryPanel.hidden, false);
  renderAccountState(ui, { initialized: true, user: null, recoverySession: false, configured: true });
  assert.equal(ui.appContent.hidden, true);
  assert.match(main, /activeGeneration\?\.abort\(\)/);
  assert.match(main, /else if \(!authenticated\) route = '#account'/);
});

test('generation API rejects missing JWT before methodology or provider execution', async () => {
  const result = response();
  await generate({ method: 'POST', body: { brief: 'Crie um serviço.', generationProvider: 'local', generationModel: 'local-deterministic', credentialSource: 'local', targetModel: 'grok' } }, result);
  assert.equal(result.statusCode, 401);
  assert.equal(result.body.code, 'UNAUTHENTICATED');
});

test('generation API validates bearer identity before allowing the local compiler', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url) => {
    calls.push(String(url));
    if (String(url).endsWith('/auth/v1/user')) return { ok: true, json: async () => ({ id: 'test-user' }) };
    return { ok: false, status: 503, json: async () => ({}) };
  };
  try {
    const result = response();
    await generate({ method: 'POST', headers: { authorization: 'Bearer valid-test-token' }, body: { brief: 'Crie um serviço.', generationProvider: 'local', generationModel: 'local-deterministic', credentialSource: 'local', targetModel: 'grok', taskType: 'refactor_module' } }, result);
    assert.equal(result.statusCode, 200);
    assert.equal(result.body.source, 'local');
    assert.deepEqual(calls.filter((url) => url.endsWith('/auth/v1/user')).length, 1);
    assert.ok(calls.every((url) => !url.includes('generativelanguage.googleapis.com')));
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('unknown task is rejected explicitly after authentication', async () => {
  const result = response();
  await createGenerateHandler(async () => ({ userId: 'test-user' }))({ method: 'POST', body: { taskType: 'unknown' } }, result);
  assert.equal(result.statusCode, 400);
  assert.equal(result.body.code, 'task_type_invalid');
});

test('credential presence remains separate from four validation outcomes', () => {
  const provider = { generation: { generationSupported: true, credentialSources: ['byok'] } };
  assert.equal(generationUiState({ provider }).credentialStatus, 'Sem chave cadastrada');
  for (const [status, label] of [['untested', 'Ainda não testada'], ['valid', 'Validada no provedor'], ['invalid', 'Inválida'], ['error', 'Erro na última validação']]) {
    assert.equal(generationUiState({ provider, credential: { validationStatus: status } }).credentialStatus, `Chave cadastrada · ${label}`);
  }
  assert.doesNotMatch(main, /fetch\([^\n]*\/test/);
});

test('provider model IDs are catalog-bound and deterministic compiler stays separate', () => {
  const providers = [{ slug: 'deepseek', models: [{ model_id: 'deepseek-flash', display_name: 'DeepSeek Flash' }] }, { slug: 'openai', models: [{ model_id: 'gpt-5.6-sol', display_name: 'GPT 5.6 Sol' }, { model_id: 'other', display_name: 'Other' }] }];
  assert.deepEqual(generationModelsForProvider(providers, 'deepseek').map(({ modelId }) => modelId), ['deepseek-flash']);
  const models = generationModelsForProvider(providers, 'openai');
  assert.equal(generationModelSelection(models, 'other', false), 'other');
  assert.equal(generationModelSelection(models, 'deepseek-flash', true), 'gpt-5.6-sol');
  assert.equal(LOCAL_GENERATION_OPTION.model, 'local-deterministic');
  assert.equal(providers.flatMap(({ models }) => models).some(({ model_id }) => model_id === LOCAL_GENERATION_OPTION.model), false);
});

test('eight task choices map to proven 2.1 corpus categories without changing target', () => {
  assert.deepEqual(Object.keys(taskTypes), ['cited', 'application', 'refactor_full', 'refactor_module', 'bug_fix', 'agent', 'debug', 'fim']);
  assert.equal(methodologyTaskType('refactor'), 'refactor');
  assert.equal(methodologyTaskType('refactor_full'), 'refactor');
  assert.equal(methodologyTaskType('refactor_module'), 'refactor');
  assert.equal(methodologyTaskType('bug_fix'), 'debug');
  for (const taskType of Object.keys(taskTypes)) {
    assert.match(html, new RegExp(`value="${taskType}"`));
    const result = resolveMethodologyPackage('claude', taskType);
    assert.equal(result.trace.taskType, taskType);
    assert.equal(result.trace.target, 'claude');
  }
  const full = resolveMethodologyPackage('claude', 'refactor_full');
  const module = resolveMethodologyPackage('claude', 'refactor_module');
  assert.deepEqual(full.rules.map(({ id }) => id), module.rules.map(({ id }) => id));
  assert.equal(full.trace.methodologyTaskType, 'refactor');
  assert.equal(resolveMethodologyPackage('claude', 'unknown'), null);
});

test('FIM is exposed only when the target has the existing verified Codestral rule', () => {
  assert.equal(fimAvailableForTarget('codestral'), true);
  assert.equal(fimAvailableForTarget('grok'), false);
  assert.match(main, /fimAvailableForTarget\(targetModel\.value\)/);
  assert.match(main, /if \(!available && taskType\.value === 'fim'\) taskType\.value = 'cited'/);
});
