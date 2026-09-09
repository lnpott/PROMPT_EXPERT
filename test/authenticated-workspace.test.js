import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { renderAccountState } from '../src/auth/ui.js';
import { catalogSlugFor, controlsForProvider, modelsForProvider } from '../src/generation/provider-options.js';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
function field() { return { hidden: false, textContent: '' }; }
function elements() { return { sessionLoading: field(), accountPanel: field(), appContent: field(), accountNavigation: field(), signedOut: field(), signedIn: field(), recoveryPanel: field(), providersLocked: field(), providersPlaceholder: field(), accountStatus: field(), userEmail: field(), feedback: field() }; }

test('initial session loading prevents private-content flash', () => {
  const e = elements(); renderAccountState(e, { initialized: false, configured: true, user: null, recoverySession: false });
  assert.equal(e.sessionLoading.hidden, false); assert.equal(e.accountPanel.hidden, true); assert.equal(e.appContent.hidden, true); assert.equal(e.accountNavigation.hidden, true);
  assert.match(html, /id="app-content" hidden/); assert.match(html, /id="session-loading"/);
});

test('account is entry gate and authenticated state unlocks workspace navigation', () => {
  const e = elements(); renderAccountState(e, { initialized: true, configured: true, user: null, recoverySession: false });
  assert.equal(e.accountPanel.hidden, false); assert.equal(e.appContent.hidden, true);
  renderAccountState(e, { initialized: true, configured: true, user: { email: 'user@example.test' }, recoverySession: false });
  assert.equal(e.accountPanel.hidden, true); assert.equal(e.appContent.hidden, false); assert.equal(e.accountNavigation.hidden, false); assert.equal(e.accountStatus.textContent, 'user@example.test');
});

test('logout and recovery hide workspace; recovery remains prioritized', () => {
  const e = elements(); renderAccountState(e, { initialized: true, configured: true, user: { email: 'u@test' }, recoverySession: true });
  assert.equal(e.appContent.hidden, true); assert.equal(e.recoveryPanel.hidden, false); assert.equal(e.accountNavigation.hidden, true);
  renderAccountState(e, { initialized: true, configured: true, user: null, recoverySession: false });
  assert.equal(e.appContent.hidden, true); assert.equal(e.signedOut.hidden, false);
});

test('hash navigation is session-derived and has account, app, providers and recovery states', () => {
  assert.match(main, /\['#app', '#providers', '#account', '#account-recovery'\]/);
  assert.match(main, /if \(recovery\) route = '#account-recovery'/);
  assert.match(main, /else if \(!authenticated\) route = '#login'/);
});

test('each BYOK provider receives only its catalog models', () => {
  const providers = ['openrouter','openai','xai','deepseek','groqcloud','mistral'].map((slug) => ({ slug, models: [{ model_id: `${slug}-model` }] }));
  for (const provider of ['openrouter','openai','xai','deepseek','groq','mistral']) {
    const models = modelsForProvider(providers, provider);
    assert.deepEqual(models.map((item) => item.model_id), [`${catalogSlugFor(provider)}-model`]);
  }
  assert.deepEqual(modelsForProvider(providers, 'platform'), []);
});

test('provider changes replace stale models and platform owns Gemini selector exclusively', () => {
  const providers = [{ slug: 'openai', models: [{ model_id: 'openai-only' }] }, { slug: 'deepseek', models: [{ model_id: 'deepseek-only' }] }, { slug: 'mistral', models: [{ model_id: 'mistral-only' }] }];
  assert.deepEqual(modelsForProvider(providers, 'openai').map(x=>x.model_id), ['openai-only']);
  assert.deepEqual(modelsForProvider(providers, 'deepseek').map(x=>x.model_id), ['deepseek-only']);
  assert.deepEqual(modelsForProvider(providers, 'mistral').map(x=>x.model_id), ['mistral-only']);
  assert.deepEqual(controlsForProvider('platform'), { platformModel: true, providerModel: false });
  assert.deepEqual(controlsForProvider('deepseek'), { platformModel: false, providerModel: true });
});

test('missing BYOK credential has a providers CTA and no fallback', () => {
  assert.match(html, /Configurar em APIs e provedores/);
  assert.match(main, /Credencial BYOK não configurada/);
  assert.match(main, /response\.status === 404 && generationProvider\.value === 'platform'/);
});
