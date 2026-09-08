import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { purgeRecoveryCredentials } from '../api/account/recovery/purge-credentials.js';
import { createAuthController } from '../src/auth/session.js';
import { initializeAuthUI, renderAccountState } from '../src/auth/ui.js';

const users = { 'token-a': 'user-a', 'token-b': 'user-b' };

function apiResponse() {
  return { statusCode: 0, body: null, headers: {}, setHeader(k,v){this.headers[k]=v;}, status(code){this.statusCode=code;return this;}, json(body){this.body=body;return this;} };
}

function request(token, body) {
  return { method: 'POST', headers: token ? { authorization: `Bearer ${token}` } : {}, body };
}

test('purge authenticates, derives ownership from JWT/RLS and remains idempotent without a master key', async () => {
  let rows = [
    { user_id: 'user-a', ciphertext: 'fixture-a-1' },
    { user_id: 'user-a', ciphertext: 'fixture-a-2' },
    { user_id: 'user-b', ciphertext: 'fixture-b' },
  ];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options = {}) => {
    if (url.endsWith('/auth/v1/user')) {
      const token = options.headers.Authorization.replace('Bearer ', '');
      return { ok: Boolean(users[token]), json: async () => ({ id: users[token] }) };
    }
    const userId = users[options.headers.Authorization.replace('Bearer ', '')];
    assert.match(url, new RegExp(`user_id=eq\\.${userId}`));
    rows = rows.filter((row) => row.user_id !== userId);
    return { ok: true, status: 204 };
  };
  try {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      const result = apiResponse();
      await purgeRecoveryCredentials(request('token-a', { user_id: 'user-b' }), result, {
        SUPABASE_URL: 'https://project.example.test', SUPABASE_PUBLISHABLE_KEY: 'public-test',
      });
      assert.equal(result.statusCode, 200);
      assert.deepEqual(result.body, { purged: true });
      assert.doesNotMatch(JSON.stringify(result.body), /credential|ciphertext|iv|auth_tag|fixture/);
    }
    assert.deepEqual(rows, [{ user_id: 'user-b', ciphertext: 'fixture-b' }]);
  } finally { globalThis.fetch = originalFetch; }
});

test('purge rejects missing authentication and unsupported methods', async () => {
  const unauthenticated = apiResponse();
  await purgeRecoveryCredentials(request(null), unauthenticated, {});
  assert.equal(unauthenticated.statusCode, 401);
  const wrongMethod = apiResponse();
  await purgeRecoveryCredentials({ method: 'DELETE', headers: {} }, wrongMethod, {});
  assert.equal(wrongMethod.statusCode, 405);
  assert.equal(wrongMethod.headers.Allow, 'POST');
});

function field(value = '') {
  return { value, textContent: '', hidden: false, disabled: false, attributes: {}, setAttribute(k,v){this.attributes[k]=v;}, getAttribute(k){return this.attributes[k];} };
}
function form() {
  const value = field();
  value.listeners = {};
  value.addEventListener = (name, listener) => { value.listeners[name] = listener; };
  return value;
}
function recoveryElements() {
  return {
    signedOut: field(), signedIn: field(), recoveryPanel: field(), providersLocked: field(), providersPlaceholder: field(), accountStatus: field(), userEmail: field(), feedback: field(),
    authForm: form(), email: field(), password: field(), signUp: form(), signOut: form(), recovery: form(), actionButtons: [],
    recoveryForm: form(), newPassword: field('safe-new-password'), confirmPassword: field('safe-new-password'), completeRecovery: form(), recoveryFeedback: field(),
  };
}

function recoveryController(events) {
  const state = { user: { id: 'user-a', email: 'person@example.test' }, recoverySession: true, configured: true };
  return {
    subscribe(listener){ listener(state); return () => {}; }, initialize: async()=>{}, destroy(){}, getSnapshot:()=>state, getAccessToken:()=> 'token-a',
    updatePassword: async()=>{ events.push('password'); return { error: '' }; },
    finishRecovery: async()=>{ events.push('signout'); },
    signIn:async()=>({}), signUp:async()=>({}), signOut:async()=>({}), requestPasswordRecovery:async()=>({}),
  };
}

test('recovery UI hides vault metadata and performs purge before password update and sign-out', async () => {
  const elements = recoveryElements();
  const events = [];
  const controller = recoveryController(events);
  initializeAuthUI(controller, elements, async () => {
    events.push('purge');
    return { ok: true, json: async () => ({ purged: true }) };
  });
  assert.equal(elements.signedIn.hidden, true);
  assert.equal(elements.providersPlaceholder.hidden, true);
  assert.equal(elements.recoveryPanel.hidden, false);
  await elements.completeRecovery.listeners.click();
  assert.deepEqual(events, ['purge', 'password', 'signout']);
  assert.match(elements.recoveryFeedback.textContent, /cadastre suas chaves/i);
  assert.equal(elements.newPassword.value, '');
  assert.equal(elements.confirmPassword.value, '');
});

test('purge failure blocks password update and duplicate submit while busy', async () => {
  const elements = recoveryElements();
  const events = [];
  let release;
  const pending = new Promise((resolve) => { release = resolve; });
  initializeAuthUI(recoveryController(events), elements, async () => { events.push('purge'); await pending; return { ok: false, json: async()=>({}) }; });
  const first = elements.completeRecovery.listeners.click();
  await elements.completeRecovery.listeners.click();
  release();
  await first;
  assert.deepEqual(events, ['purge']);
  assert.match(elements.recoveryFeedback.textContent, /antes de redefinir/i);
});

test('ordinary password update does not invoke destructive recovery', async () => {
  const calls = [];
  let authListener;
  const client = { auth: {
    onAuthStateChange(listener) { authListener = listener; return { data: { subscription: { unsubscribe() {} } } }; },
    async getSession() { return { data: { session: { user: { id: 'user-a' }, access_token: 'normal-token' } }, error: null }; },
    async updateUser() { calls.push('updateUser'); return { error: null }; },
  } };
  const controller = createAuthController(client);
  await controller.initialize();
  authListener('SIGNED_IN', { user: { id: 'user-a' }, access_token: 'normal-token' });
  assert.deepEqual(await controller.updatePassword('safe-change-password'), { error: '' });
  assert.deepEqual(calls, ['updateUser']);
});

test('recovery implementation preserves guest mode and generation/catalog scope', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const ui = readFileSync(new URL('../src/auth/ui.js', import.meta.url), 'utf8');
  const generate = readFileSync(new URL('../api/generate.js', import.meta.url), 'utf8');
  assert.match(html, /remove as chaves de API salvas/i);
  assert.doesNotMatch(ui, /secret_last4|ciphertext|auth_tag|service_role/);
  assert.doesNotMatch(generate, /purge-credentials|user_api_credentials|BYOK/i);
});
