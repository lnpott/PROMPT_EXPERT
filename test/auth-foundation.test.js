import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { createAuthController, validateCredentials } from '../src/auth/session.js';
import { renderAccountState } from '../src/auth/ui.js';
import { createSupabaseBrowserClient } from '../src/lib/supabase.js';

function createAuthMock(initialUser = null) {
  let callback;
  const calls = [];
  const client = {
    auth: {
      async getSession() {
        calls.push('getSession');
        return { data: { session: initialUser ? { user: initialUser } : null }, error: null };
      },
      onAuthStateChange(listener) {
        callback = listener;
        return { data: { subscription: { unsubscribe() { calls.push('unsubscribe'); } } } };
      },
      async signInWithPassword(credentials) {
        calls.push({ action: 'signIn', credentials });
        callback('SIGNED_IN', { user: { email: credentials.email } });
        return { data: {}, error: null };
      },
      async signUp(credentials) {
        calls.push({ action: 'signUp', credentials });
        return { data: { session: null }, error: null };
      },
      async signOut() {
        calls.push('signOut');
        callback('SIGNED_OUT', null);
        return { error: null };
      },
      async resetPasswordForEmail(email, options) {
        calls.push({ action: 'recovery', email, options });
        return { error: null };
      },
    },
  };
  return { client, calls };
}

function element() {
  return { hidden: false, textContent: '' };
}

function uiElements() {
  return {
    signedOut: element(),
    signedIn: element(),
    providersLocked: element(),
    providersPlaceholder: element(),
    accountStatus: element(),
    userEmail: element(),
    feedback: element(),
  };
}

test('anonymous state is restored without blocking the application', async () => {
  const { client, calls } = createAuthMock();
  const controller = createAuthController(client);
  const states = [];
  controller.subscribe((state) => states.push(state));

  await controller.initialize();

  assert.equal(controller.getSnapshot().user, null);
  assert.equal(controller.getSnapshot().configured, true);
  assert.equal(calls[0], 'getSession');
  assert.equal(states.at(-1).user, null);
});

test('authenticated session is restored and exposes only the user identity', async () => {
  const { client } = createAuthMock({ id: 'user-a', email: 'person@example.test' });
  const controller = createAuthController(client);

  await controller.initialize();

  assert.deepEqual(controller.getSnapshot().user, { id: 'user-a', email: 'person@example.test' });
});

test('login and logout events update subscribed session state', async () => {
  const { client } = createAuthMock();
  const controller = createAuthController(client);
  const identities = [];
  controller.subscribe(({ user }) => identities.push(user?.email || null));
  await controller.initialize();

  assert.deepEqual(await controller.signIn('person@example.test', 'safe-password'), { error: '' });
  assert.equal(identities.at(-1), 'person@example.test');

  assert.deepEqual(await controller.signOut(), { error: '' });
  assert.equal(identities.at(-1), null);
});

test('account UI protects providers visually and uses textContent for email', () => {
  const elements = uiElements();
  renderAccountState(elements, { configured: true, recoverySession: false, user: null });
  assert.equal(elements.signedOut.hidden, false);
  assert.equal(elements.providersLocked.hidden, false);
  assert.equal(elements.providersPlaceholder.hidden, true);

  const email = '<img src=x onerror=alert(1)>@example.test';
  renderAccountState(elements, { configured: true, recoverySession: false, user: { email } });
  assert.equal(elements.signedIn.hidden, false);
  assert.equal(elements.providersLocked.hidden, true);
  assert.equal(elements.providersPlaceholder.hidden, false);
  assert.equal(elements.userEmail.textContent, email);
  assert.equal('innerHTML' in elements.userEmail, false);
});

test('missing public configuration keeps anonymous state available', async () => {
  assert.equal(createSupabaseBrowserClient({}), null);
  const controller = createAuthController(null);
  await controller.initialize();
  assert.deepEqual(controller.getSnapshot(), { user: null, recoverySession: false, configured: false });
});

test('credentials are validated without persisting or logging passwords', () => {
  assert.deepEqual(validateCredentials('invalid', 'short'), { error: 'Informe um email válido.' });
  assert.deepEqual(validateCredentials('person@example.test', 'short'), { error: 'A senha deve ter pelo menos 8 caracteres.' });
  assert.deepEqual(validateCredentials(' person@example.test ', 'safe-password'), {
    email: 'person@example.test',
    password: 'safe-password',
  });
});

test('guest compiler remains present and BYOK storage is absent', () => {
  const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const trackedSource = [main, html].join('\n');

  assert.match(main, /compilePrompt/);
  assert.match(main, /response\.status === 404/);
  assert.match(html, /compilador local continua disponível sem conta/i);
  assert.match(html, /Nenhuma chave de API pode ser cadastrada nesta versão/);
  assert.doesNotMatch(trackedSource, /user_api_credentials|USER_CREDENTIALS_MASTER_KEY|AES-256-GCM|\/api\/credentials/);
});
