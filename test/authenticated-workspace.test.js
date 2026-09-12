import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { renderAccountState } from '../src/auth/ui.js';
import { generationModelsForProvider, generationUiState } from '../src/generation/provider-options.js';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
function field() { return { hidden: false, textContent: '' }; }
function elements() { return { sessionLoading: field(), accountPanel: field(), appContent: field(), accountNavigation: field(), signedOut: field(), signedIn: field(), recoveryPanel: field(), providersLocked: field(), providersPlaceholder: field(), accountStatus: field(), userEmail: field(), feedback: field() }; }

test('initial session loading prevents private-content flash', () => {
  const e = elements(); renderAccountState(e, { initialized: false, configured: true, user: null, recoverySession: false });
  assert.equal(e.sessionLoading.hidden, false); assert.equal(e.accountPanel.hidden, true); assert.equal(e.appContent.hidden, true); assert.equal(e.accountNavigation.hidden, true);
  assert.match(html, /id="app-content" hidden/); assert.match(html, /id="session-loading"/);
});

test('public core remains available while authenticated state unlocks personal features', () => {
  const e = elements(); renderAccountState(e, { initialized: true, configured: true, user: null, recoverySession: false });
  assert.equal(e.accountPanel.hidden, false); assert.equal(e.appContent.hidden, false);
  renderAccountState(e, { initialized: true, configured: true, user: { email: 'user@example.test' }, recoverySession: false });
  assert.equal(e.accountPanel.hidden, true); assert.equal(e.appContent.hidden, false); assert.equal(e.accountNavigation.hidden, false); assert.equal(e.accountStatus.textContent, 'user@example.test');
});

test('logout keeps public core available while recovery remains prioritized', () => {
  const e = elements(); renderAccountState(e, { initialized: true, configured: true, user: { email: 'u@test' }, recoverySession: true });
  assert.equal(e.appContent.hidden, true); assert.equal(e.recoveryPanel.hidden, false); assert.equal(e.accountNavigation.hidden, true);
  renderAccountState(e, { initialized: true, configured: true, user: null, recoverySession: false });
  assert.equal(e.appContent.hidden, false); assert.equal(e.signedOut.hidden, false);
});

test('logout preserves the public local draft and in-flight generation locks controls', () => {
  assert.doesNotMatch(main, /localGeneration\.checked = false/);
  assert.match(main, /generationBusy \|\| models\.length === 0 \|\| !state\.executable/);
  assert.match(main, /for \(const control of \[brief, generationModel, targetModel, taskType, localGeneration\]\) control\.disabled = busy/);
});

test('hash navigation is session-derived and has account, app, providers and recovery states', () => {
  assert.match(main, /\['#app', '#providers', '#account', '#account-recovery'\]/);
  assert.match(main, /if \(recovery\) route = '#account-recovery'/);
  assert.doesNotMatch(main, /else if \(!authenticated\) route = '#login'/);
});

test('each provider receives only its own catalog models', () => {
  const providers = ['openrouter','openai','xai','deepseek','groqcloud','mistral'].map((slug) => ({ slug, models: [{ model_id: `${slug}-model` }] }));
  for (const provider of providers.map(({ slug }) => slug)) {
    assert.deepEqual(generationModelsForProvider(providers, provider).map((item) => item.modelId), [`${provider}-model`]);
  }
  assert.deepEqual(generationModelsForProvider(providers, 'unknown'), []);
});

test('provider changes replace stale generation models while targets remain independent', () => {
  const providers = [{ slug: 'openai', models: [{ model_id: 'openai-only' }] }, { slug: 'deepseek', models: [{ model_id: 'deepseek-only' }] }, { slug: 'mistral', models: [{ model_id: 'mistral-only' }] }];
  assert.deepEqual(generationModelsForProvider(providers, 'openai').map(x=>x.modelId), ['openai-only']);
  assert.deepEqual(generationModelsForProvider(providers, 'deepseek').map(x=>x.modelId), ['deepseek-only']);
  assert.deepEqual(generationModelsForProvider(providers, 'mistral').map(x=>x.modelId), ['mistral-only']);
});

test('missing BYOK credential has a providers CTA and no fallback', () => {
  const provider = { generation: { generationSupported: true, credentialSources: ['byok'] } };
  assert.equal(generationUiState({ provider }).credentialStatus, 'Configure sua chave');
  assert.match(html, /APIs e provedores/);
  assert.doesNotMatch(main, /response\.status === 404|compilePrompt/);
});

test('logged-out BYOK is blocked without hiding or redirecting the public generator', () => {
  const provider = { generation: { generationSupported: true, credentialSources: ['byok'] } };
  const state = generationUiState({ provider, authenticated: false });
  assert.equal(state.executable, false);
  assert.equal(state.credentialStatus, 'Entrar para configurar sua chave');
  assert.match(main, /Você pode voltar à geração local sem recarregar a página/);
  assert.match(main, /credentialCta\.href = needsAuthentication \? '#account' : '#providers'/);
});
