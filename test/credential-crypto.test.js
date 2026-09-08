import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';
import { test } from 'node:test';

import {
  CredentialCryptoError,
  buildCredentialAad,
  credentialCryptoProtocol,
  decryptCredential,
  encryptCredential,
  getSecretLast4,
  loadCredentialCryptoConfig,
  validatePersistedCredentialMaterial,
} from '../server/security/credential-crypto.js';

const ids = {
  userId: '11111111-1111-4111-8111-111111111111',
  providerId: '22222222-2222-4222-8222-222222222222',
  credentialId: '33333333-3333-4333-8333-333333333333',
};
const environment = () => ({
  USER_CREDENTIALS_MASTER_KEY: randomBytes(32).toString('base64'),
  USER_CREDENTIALS_KEY_VERSION: '1',
});
const fictionalSecret = 'fictional-credential-value-WXYZ';

function encryptedFixture(env = environment()) {
  const encrypted = encryptCredential({ plaintext: fictionalSecret, ...ids }, env);
  return { encrypted, env };
}

function expectCryptoFailure(action, code) {
  assert.throws(action, (error) => {
    assert.ok(error instanceof CredentialCryptoError);
    assert.equal(error.code, code);
    assert.equal(error.message, 'Credential cryptographic operation failed.');
    assert.doesNotMatch(error.message, /fictional|WXYZ|master|ciphertext/i);
    return true;
  });
}

function tamperBase64(value) {
  const bytes = Buffer.from(value, 'base64');
  bytes[0] ^= 1;
  return bytes.toString('base64');
}

test('AES-256-GCM round-trip returns the original plaintext only from decrypt', () => {
  const { encrypted, env } = encryptedFixture();
  assert.equal(decryptCredential({ ...encrypted, ...ids }, env), fictionalSecret);
  assert.deepEqual(Object.keys(encrypted).sort(), ['authTag', 'ciphertext', 'iv', 'keyVersion', 'secretLast4']);
  assert.ok(!JSON.stringify(encrypted).includes(fictionalSecret));
});

test('a fresh 96-bit IV makes repeated encryption different', () => {
  const env = environment();
  const first = encryptCredential({ plaintext: fictionalSecret, ...ids }, env);
  const second = encryptCredential({ plaintext: fictionalSecret, ...ids }, env);
  assert.notEqual(first.iv, second.iv);
  assert.notEqual(first.ciphertext, second.ciphertext);
  assert.equal(Buffer.from(first.iv, 'base64').length, 12);
  assert.equal(Buffer.from(first.authTag, 'base64').length, 16);
});

test('user, provider and credential identifiers are authenticated', () => {
  const { encrypted, env } = encryptedFixture();
  for (const changed of [
    { userId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' },
    { providerId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' },
    { credentialId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' },
  ]) {
    expectCryptoFailure(() => decryptCredential({ ...encrypted, ...ids, ...changed }, env), 'DECRYPTION_FAILED');
  }
});

test('tampered ciphertext, IV and authentication tag fail closed', () => {
  const { encrypted, env } = encryptedFixture();
  for (const field of ['ciphertext', 'iv', 'authTag']) {
    expectCryptoFailure(
      () => decryptCredential({ ...encrypted, ...ids, [field]: tamperBase64(encrypted[field]) }, env),
      'DECRYPTION_FAILED',
    );
  }
});

test('canonical AAD is deterministic and every relevant component changes it', () => {
  const base = buildCredentialAad(ids, 1);
  assert.deepEqual(base, buildCredentialAad({ ...ids }, 1));
  const variants = [
    [{ ...ids, userId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' }, 1],
    [{ ...ids, providerId: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb' }, 1],
    [{ ...ids, credentialId: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc' }, 1],
    [ids, 2],
  ];
  for (const [context, version] of variants) assert.notDeepEqual(base, buildCredentialAad(context, version));
});

test('an unknown key version is rejected before decryption', () => {
  const { encrypted, env } = encryptedFixture();
  expectCryptoFailure(() => decryptCredential({ ...encrypted, ...ids, keyVersion: 2 }, env), 'UNKNOWN_KEY_VERSION');
});

test('master key and version configuration are strictly validated', () => {
  for (const badEnvironment of [
    { USER_CREDENTIALS_KEY_VERSION: '1' },
    { USER_CREDENTIALS_MASTER_KEY: 'not base64', USER_CREDENTIALS_KEY_VERSION: '1' },
    { USER_CREDENTIALS_MASTER_KEY: randomBytes(31).toString('base64'), USER_CREDENTIALS_KEY_VERSION: '1' },
    { USER_CREDENTIALS_MASTER_KEY: randomBytes(32).toString('base64'), USER_CREDENTIALS_KEY_VERSION: '0' },
  ]) expectCryptoFailure(() => loadCredentialCryptoConfig(badEnvironment), 'INVALID_CONFIGURATION');
});

test('persisted material validation enforces canonical base64 and exact sizes', () => {
  const { encrypted } = encryptedFixture();
  assert.doesNotThrow(() => validatePersistedCredentialMaterial(encrypted));
  for (const bad of [
    { ...encrypted, iv: randomBytes(11).toString('base64') },
    { ...encrypted, authTag: randomBytes(15).toString('base64') },
    { ...encrypted, ciphertext: 'not base64' },
  ]) expectCryptoFailure(() => validatePersistedCredentialMaterial(bad), 'INVALID_MATERIAL');
});

test('secret_last4 reveals only four characters and reveals nothing for short secrets', () => {
  assert.equal(getSecretLast4(fictionalSecret), 'WXYZ');
  assert.equal(getSecretLast4('abc'), null);
  assert.equal(encryptCredential({ plaintext: 'abc', ...ids }, environment()).secretLast4, null);
});

test('plaintext is bounded to the persisted ciphertext contract', () => {
  expectCryptoFailure(() => encryptCredential({ plaintext: '', ...ids }, environment()), 'INVALID_PLAINTEXT');
  expectCryptoFailure(() => encryptCredential({ plaintext: 'x'.repeat(16_385), ...ids }, environment()), 'INVALID_PLAINTEXT');
});

test('per-user HKDF contexts produce distinct authenticated output without exposing derived keys', () => {
  const env = environment();
  const first = encryptCredential({ plaintext: fictionalSecret, ...ids }, env);
  const second = encryptCredential({
    plaintext: fictionalSecret,
    ...ids,
    userId: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  }, env);
  assert.notEqual(first.ciphertext, second.ciphertext);
  assert.ok(!Object.keys(first).some((key) => /master|derived|subkey|userkey/i.test(key)));
  assert.equal(credentialCryptoProtocol.hkdf, 'HKDF-SHA-256');
});
