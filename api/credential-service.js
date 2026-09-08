import { randomUUID } from 'node:crypto';

import { decryptCredential, encryptCredential } from './security/credential-crypto.js';
import { authenticateUser, UserApiError, userDatabaseRequest } from './security/supabase-user.js';

const MAX_BODY_BYTES = 18_000;
const MAX_SECRET_BYTES = 16_384;
const MAX_LABEL_LENGTH = 100;
const PROVIDER_PATTERN = /^[a-z0-9-]{1,80}$/;

export function safeCredential(row) {
  return {
    providerSlug: row.api_providers?.slug,
    providerDisplayName: row.api_providers?.display_name,
    label: row.label,
    secretLast4: row.secret_last4,
    validationStatus: row.validation_status,
    lastValidatedAt: row.last_validated_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function json(response, status, body) {
  return response.status(status).json(body);
}

function publicError(error) {
  if (error instanceof UserApiError) return { status: error.status, message: 'Autenticação necessária.' };
  if (error?.code === 'INVALID_CONFIGURATION') {
    return { status: 503, message: 'O cofre não está disponível neste ambiente.' };
  }
  return { status: 503, message: 'Não foi possível concluir a operação com a credencial.' };
}

function bodySize(request) {
  const contentLength = Number(request.headers?.['content-length']);
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) return contentLength;
  try {
    return Buffer.byteLength(JSON.stringify(request.body ?? {}));
  } catch {
    return Number.POSITIVE_INFINITY;
  }
}

function validatePutRequest(request) {
  const contentType = request.headers?.['content-type'] || '';
  if (!/^application\/json(?:;|$)/i.test(contentType)) return { status: 415, message: 'Use Content-Type application/json.' };
  if (bodySize(request) > MAX_BODY_BYTES) return { status: 413, message: 'Payload muito grande.' };
  if (!request.body || typeof request.body !== 'object' || Array.isArray(request.body)) return { status: 400, message: 'Payload inválido.' };
  const allowed = new Set(['secret', 'label']);
  if (Object.keys(request.body).some((key) => !allowed.has(key))) return { status: 400, message: 'Payload inválido.' };
  const secret = request.body.secret;
  const secretBytes = typeof secret === 'string' ? Buffer.byteLength(secret, 'utf8') : 0;
  if (secretBytes < 4 || secretBytes > MAX_SECRET_BYTES) return { status: 400, message: 'Informe uma credencial válida.' };
  const label = request.body.label;
  if (label !== undefined && (typeof label !== 'string' || !label.trim() || label.trim().length > MAX_LABEL_LENGTH)) {
    return { status: 400, message: 'Rótulo inválido.' };
  }
  return { secret, label: label?.trim() || null };
}

function providerSlug(request) {
  const value = request.query?.provider;
  if (typeof value !== 'string' || !PROVIDER_PATTERN.test(value)) return null;
  return value;
}

async function activeProvider(slug, auth, environment) {
  const response = await userDatabaseRequest(
    `api_providers?slug=eq.${encodeURIComponent(slug)}&is_active=eq.true&select=id,slug,display_name`,
    auth,
    environment,
  );
  if (!response.ok) throw new Error('provider lookup failed');
  const [provider] = await response.json();
  return provider || null;
}

async function credentialRecord(providerId, auth, environment, includeCrypto = false) {
  const columns = includeCrypto
    ? 'id,user_id,provider_id,ciphertext,iv,auth_tag,key_version,label,secret_last4,validation_status,last_validated_at,created_at,updated_at'
    : 'id,label,secret_last4,validation_status,last_validated_at,created_at,updated_at';
  const response = await userDatabaseRequest(
    `user_api_credentials?provider_id=eq.${encodeURIComponent(providerId)}&select=${columns}`,
    auth,
    environment,
  );
  if (!response.ok) throw new Error('credential lookup failed');
  const [credential] = await response.json();
  return credential || null;
}

function withProvider(row, provider) {
  return safeCredential({ ...row, api_providers: provider });
}

export async function listCredentials(request, response, environment = process.env) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return json(response, 405, { error: 'Método não permitido.' });
  }
  try {
    const auth = await authenticateUser(request, environment);
    const databaseResponse = await userDatabaseRequest(
      'user_api_credentials?select=label,secret_last4,validation_status,last_validated_at,created_at,updated_at,api_providers!inner(slug,display_name)&order=created_at.asc',
      auth,
      environment,
    );
    if (!databaseResponse.ok) throw new Error('credential list failed');
    return json(response, 200, { credentials: (await databaseResponse.json()).map(safeCredential) });
  } catch (error) {
    const { status, message } = publicError(error);
    return json(response, status, { error: message });
  }
}

export async function putCredential(request, response, environment = process.env) {
  if (request.method !== 'PUT') {
    response.setHeader('Allow', 'PUT, DELETE');
    return json(response, 405, { error: 'Método não permitido.' });
  }
  const input = validatePutRequest(request);
  if (input.status) return json(response, input.status, { error: input.message });
  const slug = providerSlug(request);
  if (!slug) return json(response, 404, { error: 'Provedor não encontrado.' });

  try {
    const auth = await authenticateUser(request, environment);
    const provider = await activeProvider(slug, auth, environment);
    if (!provider) return json(response, 404, { error: 'Provedor não encontrado.' });
    const existing = await credentialRecord(provider.id, auth, environment);
    const credentialId = existing?.id || randomUUID();
    let encrypted;
    try {
      encrypted = encryptCredential({
        plaintext: input.secret,
        userId: auth.userId,
        providerId: provider.id,
        credentialId,
      }, environment);
    } finally {
      input.secret = null;
      if (request.body) request.body.secret = '';
    }
    const persisted = {
      ...(existing ? {} : { id: credentialId, user_id: auth.userId, provider_id: provider.id }),
      label: input.label,
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv,
      auth_tag: encrypted.authTag,
      key_version: encrypted.keyVersion,
      secret_last4: encrypted.secretLast4,
      validation_status: 'untested',
      last_validated_at: null,
      ...(existing ? { updated_at: new Date().toISOString() } : {}),
    };
    const path = existing
      ? `user_api_credentials?id=eq.${encodeURIComponent(credentialId)}&select=id,label,secret_last4,validation_status,last_validated_at,created_at,updated_at`
      : 'user_api_credentials?select=id,label,secret_last4,validation_status,last_validated_at,created_at,updated_at';
    const saved = await userDatabaseRequest(path, {
      ...auth,
      method: existing ? 'PATCH' : 'POST',
      body: persisted,
      prefer: 'return=representation',
    }, environment);
    if (!saved.ok) throw new Error('credential persistence failed');
    const [row] = await saved.json();
    return json(response, existing ? 200 : 201, { credential: withProvider(row, provider) });
  } catch (error) {
    const { status, message } = publicError(error);
    return json(response, status, { error: message });
  }
}

export async function deleteCredential(request, response, environment = process.env) {
  if (request.method !== 'DELETE') {
    response.setHeader('Allow', 'PUT, DELETE');
    return json(response, 405, { error: 'Método não permitido.' });
  }
  const slug = providerSlug(request);
  if (!slug) return json(response, 404, { error: 'Provedor não encontrado.' });
  try {
    const auth = await authenticateUser(request, environment);
    const provider = await activeProvider(slug, auth, environment);
    if (!provider) return json(response, 404, { error: 'Provedor não encontrado.' });
    const deleted = await userDatabaseRequest(
      `user_api_credentials?provider_id=eq.${encodeURIComponent(provider.id)}`,
      { ...auth, method: 'DELETE', prefer: 'return=minimal' },
      environment,
    );
    if (!deleted.ok) throw new Error('credential deletion failed');
    return response.status(204).end();
  } catch (error) {
    const { status, message } = publicError(error);
    return json(response, status, { error: message });
  }
}

export async function testCredential(request, response, environment = process.env) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return json(response, 405, { error: 'Método não permitido.' });
  }
  const slug = providerSlug(request);
  if (!slug) return json(response, 404, { error: 'Provedor não encontrado.' });
  let plaintext = null;
  try {
    const auth = await authenticateUser(request, environment);
    const provider = await activeProvider(slug, auth, environment);
    if (!provider) return json(response, 404, { error: 'Provedor não encontrado.' });
    const credential = await credentialRecord(provider.id, auth, environment, true);
    if (!credential) return json(response, 404, { error: 'Credencial não configurada.' });
    plaintext = decryptCredential({
      ciphertext: credential.ciphertext,
      iv: credential.iv,
      authTag: credential.auth_tag,
      keyVersion: credential.key_version,
      userId: auth.userId,
      providerId: provider.id,
      credentialId: credential.id,
    }, environment);
    if (!plaintext) throw new Error('empty decrypted credential');
    return json(response, 200, {
      check: 'local_integrity',
      integrityVerified: true,
      providerValidated: false,
      validationStatus: credential.validation_status,
      message: 'Integridade verificada localmente; o provedor ainda não foi consultado.',
      credential: withProvider(credential, provider),
    });
  } catch (error) {
    const { status, message } = publicError(error);
    return json(response, status, { error: message });
  } finally {
    plaintext = null;
  }
}
