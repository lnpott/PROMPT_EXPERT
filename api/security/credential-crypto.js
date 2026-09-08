import {
  createCipheriv,
  createDecipheriv,
  hkdfSync,
  randomBytes,
} from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const MASTER_KEY_BYTES = 32;
const IV_BYTES = 12;
const AUTH_TAG_BYTES = 16;
const DERIVED_KEY_BYTES = 32;
const FORMAT_VERSION = 1;
const HKDF_SALT = Buffer.from('PROMPT_EXPERT/BYOK/HKDF-SHA-256/salt/v1', 'utf8');
const HKDF_INFO_PREFIX = 'PROMPT_EXPERT/BYOK/user-key/v1';
const AAD_DOMAIN = 'PROMPT_EXPERT/BYOK/credential';
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BASE64_PATTERN = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

export class CredentialCryptoError extends Error {
  constructor(code) {
    super('Credential cryptographic operation failed.');
    this.name = 'CredentialCryptoError';
    this.code = code;
  }
}

function fail(code) {
  throw new CredentialCryptoError(code);
}

function canonicalUuid(value) {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) fail('INVALID_CONTEXT');
  return value.toLowerCase();
}

function decodeCanonicalBase64(value, expectedBytes, code = 'INVALID_MATERIAL') {
  if (typeof value !== 'string' || !value || !BASE64_PATTERN.test(value)) fail(code);
  const decoded = Buffer.from(value, 'base64');
  if (decoded.toString('base64') !== value || (expectedBytes && decoded.length !== expectedBytes)) fail(code);
  return decoded;
}

export function loadCredentialCryptoConfig(environment = process.env) {
  const encodedMasterKey = environment.USER_CREDENTIALS_MASTER_KEY;
  const masterKey = decodeCanonicalBase64(encodedMasterKey, MASTER_KEY_BYTES, 'INVALID_CONFIGURATION');
  const rawVersion = environment.USER_CREDENTIALS_KEY_VERSION;
  if (typeof rawVersion !== 'string' || !/^[1-9][0-9]*$/.test(rawVersion)) fail('INVALID_CONFIGURATION');
  const keyVersion = Number(rawVersion);
  if (!Number.isSafeInteger(keyVersion) || keyVersion > 2_147_483_647) fail('INVALID_CONFIGURATION');
  return { masterKey, keyVersion };
}

function contextValues({ userId, providerId, credentialId }) {
  return {
    userId: canonicalUuid(userId),
    providerId: canonicalUuid(providerId),
    credentialId: canonicalUuid(credentialId),
  };
}

export function buildCredentialAad(context, keyVersion) {
  if (!Number.isInteger(keyVersion) || keyVersion < 1) fail('INVALID_CONTEXT');
  const { userId, providerId, credentialId } = contextValues(context);
  // A JSON array fixes field order and boundaries. UUIDs are lowercase and the
  // format/key versions are integers, so encryption and decryption produce the
  // same UTF-8 bytes without relying on object property ordering.
  return Buffer.from(JSON.stringify([
    AAD_DOMAIN,
    FORMAT_VERSION,
    keyVersion,
    userId,
    providerId,
    credentialId,
  ]), 'utf8');
}

function deriveUserKey(masterKey, userId, keyVersion) {
  const canonicalUserId = canonicalUuid(userId);
  const info = Buffer.from(`${HKDF_INFO_PREFIX}\u0000${keyVersion}\u0000${canonicalUserId}`, 'utf8');
  return Buffer.from(hkdfSync('sha256', masterKey, HKDF_SALT, info, DERIVED_KEY_BYTES));
}

export function getSecretLast4(secret) {
  if (typeof secret !== 'string') fail('INVALID_PLAINTEXT');
  return Array.from(secret).length >= 4 ? Array.from(secret).slice(-4).join('') : null;
}

export function validatePersistedCredentialMaterial({ ciphertext, iv, authTag, keyVersion }) {
  if (!Number.isInteger(keyVersion) || keyVersion < 1) fail('INVALID_MATERIAL');
  const ciphertextBytes = decodeCanonicalBase64(ciphertext);
  if (ciphertextBytes.length < 1 || ciphertextBytes.length > 16_384) fail('INVALID_MATERIAL');
  const ivBytes = decodeCanonicalBase64(iv, IV_BYTES);
  const authTagBytes = decodeCanonicalBase64(authTag, AUTH_TAG_BYTES);
  return { ciphertextBytes, ivBytes, authTagBytes };
}

export function encryptCredential({ plaintext, userId, providerId, credentialId }, environment = process.env) {
  const plaintextBytes = typeof plaintext === 'string' ? Buffer.byteLength(plaintext, 'utf8') : 0;
  if (plaintextBytes < 1 || plaintextBytes > 16_384) fail('INVALID_PLAINTEXT');
  const { masterKey, keyVersion } = loadCredentialCryptoConfig(environment);
  let userKey;

  try {
    const context = contextValues({ userId, providerId, credentialId });
    const ivBytes = randomBytes(IV_BYTES);
    userKey = deriveUserKey(masterKey, context.userId, keyVersion);
    const aad = buildCredentialAad(context, keyVersion);
    const cipher = createCipheriv(ALGORITHM, userKey, ivBytes, { authTagLength: AUTH_TAG_BYTES });
    cipher.setAAD(aad);
    const ciphertextBytes = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const authTagBytes = cipher.getAuthTag();
    return {
      ciphertext: ciphertextBytes.toString('base64'),
      iv: ivBytes.toString('base64'),
      authTag: authTagBytes.toString('base64'),
      keyVersion,
      secretLast4: getSecretLast4(plaintext),
    };
  } catch {
    fail('ENCRYPTION_FAILED');
  } finally {
    masterKey.fill(0);
    userKey?.fill(0);
  }
}

export function decryptCredential(material, environment = process.env) {
  const { masterKey, keyVersion: configuredVersion } = loadCredentialCryptoConfig(environment);
  let userKey;

  try {
    if (material?.keyVersion !== configuredVersion) fail('UNKNOWN_KEY_VERSION');
    const context = contextValues(material);
    const { ciphertextBytes, ivBytes, authTagBytes } = validatePersistedCredentialMaterial(material);
    userKey = deriveUserKey(masterKey, context.userId, configuredVersion);
    const aad = buildCredentialAad(context, configuredVersion);
    const decipher = createDecipheriv(ALGORITHM, userKey, ivBytes, { authTagLength: AUTH_TAG_BYTES });
    decipher.setAAD(aad);
    decipher.setAuthTag(authTagBytes);
    return Buffer.concat([decipher.update(ciphertextBytes), decipher.final()]).toString('utf8');
  } catch (error) {
    if (error instanceof CredentialCryptoError) throw error;
    fail('DECRYPTION_FAILED');
  } finally {
    masterKey.fill(0);
    userKey?.fill(0);
  }
}

export const credentialCryptoProtocol = Object.freeze({
  algorithm: ALGORITHM,
  formatVersion: FORMAT_VERSION,
  hkdf: 'HKDF-SHA-256',
  hkdfSalt: HKDF_SALT.toString('utf8'),
  hkdfInfoPrefix: HKDF_INFO_PREFIX,
  aadDomain: AAD_DOMAIN,
  encoding: 'base64',
  ivBytes: IV_BYTES,
  authTagBytes: AUTH_TAG_BYTES,
});
