import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { afterEach, beforeEach, test } from 'node:test';

import { deleteCredential, listCredentials, putCredential, testCredential } from '../api/credential-service.js';

const originalFetch = globalThis.fetch;
const users = {
  'token-a': '11111111-1111-4111-8111-111111111111',
  'token-b': '22222222-2222-4222-8222-222222222222',
};
const providers = [
  { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', slug: 'openrouter', display_name: 'OpenRouter', is_active: true },
  { id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', slug: 'inactive-provider', display_name: 'Inactive', is_active: false },
];
const environment = {
  SUPABASE_URL: 'https://project.example.test',
  SUPABASE_PUBLISHABLE_KEY: 'public-test-value',
  USER_CREDENTIALS_MASTER_KEY: randomBytes(32).toString('base64'),
  USER_CREDENTIALS_KEY_VERSION: '1',
};
let rows;
let calls;

function response(body, { status = 200 } = {}) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function tokenFrom(options = {}) {
  return options.headers?.Authorization?.replace('Bearer ', '');
}

function databaseMock(url, options = {}) {
  const parsed = new URL(url);
  const token = tokenFrom(options);
  const userId = users[token];
  calls.push({ url, options });
  if (parsed.pathname === '/auth/v1/user') return response(userId ? { id: userId } : {}, { status: userId ? 200 : 401 });
  if (!userId) return response({}, { status: 401 });

  if (parsed.pathname.endsWith('/api_providers')) {
    const slug = parsed.searchParams.get('slug')?.replace('eq.', '');
    const activeOnly = parsed.searchParams.get('is_active') === 'eq.true';
    const ownedProviderIds = new Set(rows.filter((row) => row.user_id === userId).map((row) => row.provider_id));
    const found = providers.filter((provider) => provider.slug === slug && (provider.is_active || (!activeOnly && ownedProviderIds.has(provider.id))));
    return response(found.map(({ id, slug: providerSlug, display_name }) => ({ id, slug: providerSlug, display_name })));
  }
  if (!parsed.pathname.endsWith('/user_api_credentials')) return response({}, { status: 404 });

  const visible = rows.filter((row) => row.user_id === userId);
  const providerFilter = parsed.searchParams.get('provider_id')?.replace('eq.', '');
  const idFilter = parsed.searchParams.get('id')?.replace('eq.', '');
  const selected = visible.filter((row) => (!providerFilter || row.provider_id === providerFilter) && (!idFilter || row.id === idFilter));
  if (!options.method || options.method === 'GET') {
    const embedded = parsed.searchParams.get('select')?.includes('api_providers');
    return response(selected.map((row) => embedded
      ? { ...row, api_providers: providers.find((provider) => provider.id === row.provider_id) }
      : { ...row }));
  }
  if (options.method === 'POST') {
    const row = { ...JSON.parse(options.body), created_at: '2026-09-08T00:00:00Z' };
    rows.push(row);
    return response([row], { status: 201 });
  }
  if (options.method === 'PATCH') {
    const changes = JSON.parse(options.body);
    Object.assign(selected[0], changes);
    return response([{ ...selected[0] }]);
  }
  if (options.method === 'DELETE') {
    rows = rows.filter((row) => !selected.includes(row));
    return response(null, { status: 204 });
  }
  return response({}, { status: 405 });
}

function request(method, { token = 'token-a', provider, body, headers = {} } = {}) {
  return {
    method,
    query: provider === undefined ? {} : { provider },
    body,
    headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...headers },
  };
}

function apiResponse() {
  return {
    statusCode: 0,
    body: undefined,
    headers: {},
    setHeader(name, value) { this.headers[name] = value; },
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; },
    end() { return this; },
  };
}

beforeEach(() => {
  rows = [];
  calls = [];
  globalThis.fetch = databaseMock;
});
afterEach(() => { globalThis.fetch = originalFetch; });

test('credential endpoints require a validated bearer session', async () => {
  for (const [handler, candidate] of [
    [listCredentials, request('GET', { token: null })],
    [putCredential, request('PUT', { token: null, provider: 'openrouter', body: { secret: 'fictional-value' }, headers: { 'content-type': 'application/json' } })],
    [deleteCredential, request('DELETE', { token: null, provider: 'openrouter' })],
    [testCredential, request('POST', { token: null, provider: 'openrouter' })],
  ]) {
    const result = apiResponse();
    await handler(candidate, result, environment);
    assert.equal(result.statusCode, 401);
    assert.deepEqual(result.body, { error: 'Autenticação necessária.' });
  }
});

test('authenticated listing returns only allowlisted metadata', async () => {
  rows.push({
    id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', user_id: users['token-a'], provider_id: providers[0].id,
    label: 'Principal', secret_last4: 'WXYZ', validation_status: 'untested', last_validated_at: null,
    created_at: '2026-09-08T00:00:00Z', updated_at: '2026-09-08T00:00:00Z',
    ciphertext: 'hidden', iv: 'hidden', auth_tag: 'hidden', key_version: 1, plaintext: 'hidden',
  });
  const result = apiResponse();
  await listCredentials(request('GET'), result, environment);
  assert.equal(result.statusCode, 200);
  assert.deepEqual(Object.keys(result.body.credentials[0]).sort(), [
    'createdAt', 'label', 'lastValidatedAt', 'providerDisplayName', 'providerSlug',
    'secretLast4', 'updatedAt', 'validationStatus',
  ]);
  assert.doesNotMatch(JSON.stringify(result.body), /ciphertext|auth_tag|key_version|plaintext|hidden/);
});

test('creation encrypts before persistence, ignores client authority and returns safe metadata', async () => {
  const fictional = 'fictional-credential-WXYZ';
  const result = apiResponse();
  await putCredential(request('PUT', {
    provider: 'openrouter',
    body: { secret: fictional, label: 'Principal' },
    headers: { 'content-type': 'application/json' },
  }), result, environment);
  assert.equal(result.statusCode, 201);
  assert.equal(rows[0].user_id, users['token-a']);
  assert.equal(rows[0].secret_last4, 'WXYZ');
  assert.ok(rows[0].ciphertext && rows[0].iv && rows[0].auth_tag);
  assert.equal(JSON.stringify(rows[0]).includes(fictional), false);
  assert.equal(JSON.stringify(result.body).includes(fictional), false);
  assert.doesNotMatch(JSON.stringify(result.body), /ciphertext|authTag|keyVersion/);
});

test('replacement keeps credential identity and atomically replaces encrypted fields', async () => {
  const first = apiResponse();
  await putCredential(request('PUT', { provider: 'openrouter', body: { secret: 'fictional-first-AAAA', label: 'Keep me' }, headers: { 'content-type': 'application/json' } }), first, environment);
  const id = rows[0].id;
  const ciphertext = rows[0].ciphertext;
  const second = apiResponse();
  await putCredential(request('PUT', { provider: 'openrouter', body: { secret: 'fictional-second-BBBB' }, headers: { 'content-type': 'application/json' } }), second, environment);
  assert.equal(second.statusCode, 200);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].id, id);
  assert.notEqual(rows[0].ciphertext, ciphertext);
  assert.equal(rows[0].secret_last4, 'BBBB');
  assert.equal(rows[0].label, 'Keep me');
});

test('an owner can delete a credential after its provider becomes inactive', async () => {
  rows.push({ id: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', user_id: users['token-a'], provider_id: providers[1].id });
  const result = apiResponse();
  await deleteCredential(request('DELETE', { provider: 'inactive-provider' }), result, environment);
  assert.equal(result.statusCode, 204);
  assert.equal(rows.length, 0);
});

test('delete is owner-scoped and idempotent', async () => {
  rows.push({ id: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', user_id: users['token-b'], provider_id: providers[0].id });
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const result = apiResponse();
    await deleteCredential(request('DELETE', { provider: 'openrouter' }), result, environment);
    assert.equal(result.statusCode, 204);
  }
  assert.equal(rows.length, 1);
  assert.equal(rows[0].user_id, users['token-b']);
});

test('credential test verifies local integrity without claiming provider validation', async () => {
  const save = apiResponse();
  await putCredential(request('PUT', { provider: 'openrouter', body: { secret: 'fictional-integrity-CCCC' }, headers: { 'content-type': 'application/json' } }), save, environment);
  const result = apiResponse();
  await testCredential(request('POST', { provider: 'openrouter' }), result, environment);
  assert.equal(result.statusCode, 200);
  assert.equal(result.body.integrityVerified, true);
  assert.equal(result.body.providerValidated, false);
  assert.equal(result.body.validationStatus, 'untested');
  assert.doesNotMatch(JSON.stringify(result.body), /fictional|ciphertext|authTag|Authorization/);
});

test('invalid/inactive providers, invalid payloads, large bodies and wrong methods are rejected', async () => {
  const cases = [
    [putCredential, request('PUT', { provider: 'missing', body: { secret: 'fictional-value' }, headers: { 'content-type': 'application/json' } }), 404],
    [putCredential, request('PUT', { provider: 'inactive-provider', body: { secret: 'fictional-value' }, headers: { 'content-type': 'application/json' } }), 404],
    [putCredential, request('PUT', { provider: 'openrouter', body: { secret: '' }, headers: { 'content-type': 'application/json' } }), 400],
    [putCredential, request('PUT', { provider: 'openrouter', body: { secret: 'fictional', user_id: users['token-b'] }, headers: { 'content-type': 'application/json' } }), 400],
    [putCredential, request('PUT', { provider: 'openrouter', body: { secret: 'fictional' }, headers: { 'content-type': 'text/plain' } }), 415],
    [putCredential, request('PUT', { provider: 'openrouter', body: { secret: 'fictional' }, headers: { 'content-type': 'application/json', 'content-length': '20000' } }), 413],
    [listCredentials, request('POST'), 405],
    [testCredential, request('GET', { provider: 'openrouter' }), 405],
  ];
  for (const [handler, candidate, status] of cases) {
    const result = apiResponse();
    await handler(candidate, result, environment);
    assert.equal(result.statusCode, status);
  }
});

test('missing master key and crypto failures are closed and never echo the submitted secret', async () => {
  const secret = 'fictional-never-echo-DDDD';
  const result = apiResponse();
  await putCredential(request('PUT', { provider: 'openrouter', body: { secret }, headers: { 'content-type': 'application/json' } }), result, {
    ...environment,
    USER_CREDENTIALS_MASTER_KEY: undefined,
  });
  assert.equal(result.statusCode, 503);
  assert.equal(JSON.stringify(rows).includes(secret), false);
  assert.equal(JSON.stringify(result.body).includes(secret), false);
  assert.deepEqual(result.body, { error: 'O cofre não está disponível neste ambiente.' });
});
