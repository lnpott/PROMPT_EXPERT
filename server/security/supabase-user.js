const DEFAULT_SUPABASE_URL = 'https://pqprtkdvzyhqlidlcpxg.supabase.co';
const DEFAULT_SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_Q6fk9upY99j9Lsak222YPA_Cz-VGaZI';

export class UserApiError extends Error {
  constructor(code, status) {
    super('Credential request failed.');
    this.name = 'UserApiError';
    this.code = code;
    this.status = status;
  }
}

function configuration(environment = process.env) {
  const url = environment.SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const publishableKey = environment.SUPABASE_PUBLISHABLE_KEY || DEFAULT_SUPABASE_PUBLISHABLE_KEY;
  return { url: url.replace(/\/$/, ''), publishableKey };
}

function bearerToken(request) {
  const authorization = request.headers?.authorization || request.headers?.Authorization;
  const match = typeof authorization === 'string' && authorization.match(/^Bearer ([A-Za-z0-9._~-]+)$/);
  if (!match) throw new UserApiError('UNAUTHENTICATED', 401);
  return match[1];
}

export async function authenticateUser(request, environment = process.env) {
  const token = bearerToken(request);
  const { url, publishableKey } = configuration(environment);
  const response = await fetch(`${url}/auth/v1/user`, {
    headers: { apikey: publishableKey, Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new UserApiError('UNAUTHENTICATED', 401);
  const user = await response.json();
  if (typeof user?.id !== 'string') throw new UserApiError('UNAUTHENTICATED', 401);
  return { userId: user.id, token };
}

export async function userDatabaseRequest(path, { token, method = 'GET', body, prefer }, environment = process.env) {
  const { url, publishableKey } = configuration(environment);
  const headers = {
    apikey: publishableKey,
    Authorization: `Bearer ${token}`,
    ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
    ...(prefer ? { Prefer: prefer } : {}),
  };
  return fetch(`${url}/rest/v1/${path}`, {
    method,
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
