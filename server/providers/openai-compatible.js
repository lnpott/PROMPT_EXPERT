export const DIRECT_PROVIDER_TIMEOUT_MS = 12_000;
const MAX_RESPONSE_BYTES = 1_000_000;
const MAX_CONTENT_LENGTH = 100_000;

export class DirectProviderError extends Error {
  constructor(code, status = 502) {
    super(code);
    this.name = 'DirectProviderError';
    this.code = code;
    this.status = status;
  }
}

function classify(status, operation) {
  if (status === 401 || status === 403) return ['credential_invalid', 401];
  if (status === 402) return ['provider_insufficient_credits', 402];
  if (status === 404) return [operation === 'generation' ? 'provider_model_unavailable' : 'provider_unavailable', 404];
  if (status === 429) return ['provider_rate_limited', 429];
  if (status >= 500) return ['provider_unavailable', 503];
  return ['provider_error', 502];
}

async function providerFetch(config, path, apiKey, options, operation, request = fetch) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs || DIRECT_PROVIDER_TIMEOUT_MS);
  try {
    const response = await request(`${config.baseUrl}${path}`, {
      ...options,
      redirect: 'error',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}`, ...config.headers },
      signal: controller.signal,
    });
    if (!response.ok) {
      const [code, status] = classify(response.status, operation);
      throw new DirectProviderError(code, status);
    }
    const declared = Number(response.headers?.get?.('content-length'));
    if (Number.isFinite(declared) && declared > MAX_RESPONSE_BYTES) throw new DirectProviderError('provider_invalid_response');
    const text = await response.text();
    if (Buffer.byteLength(text) > MAX_RESPONSE_BYTES) throw new DirectProviderError('provider_invalid_response');
    try { return JSON.parse(text); } catch { throw new DirectProviderError('provider_invalid_response'); }
  } catch (error) {
    if (error instanceof DirectProviderError) throw error;
    if (error?.name === 'AbortError' || error?.name === 'TimeoutError') throw new DirectProviderError('provider_timeout', 504);
    throw new DirectProviderError('provider_network_error');
  } finally {
    clearTimeout(timer);
  }
}

export async function validateCompatibleCredential(config, apiKey, request) {
  if (typeof apiKey !== 'string' || !apiKey) throw new DirectProviderError('credential_missing', 404);
  const payload = await providerFetch(config, config.modelsPath, apiKey, { method: 'GET' }, 'validation', request);
  if (!Array.isArray(payload?.data)) throw new DirectProviderError('provider_invalid_response');
  return { status: 'valid' };
}

export async function generateCompatible(config, { apiKey, model, instruction }, request) {
  if (typeof apiKey !== 'string' || !apiKey) throw new DirectProviderError('credential_missing', 404);
  if (typeof model !== 'string' || !model) throw new DirectProviderError('provider_model_unavailable', 404);
  if (typeof instruction !== 'string' || !instruction) throw new DirectProviderError('provider_invalid_request', 400);
  const payload = await providerFetch(config, config.chatPath, apiKey, {
    method: 'POST',
    body: JSON.stringify({ model, messages: [{ role: 'user', content: instruction }], max_tokens: 4096 }),
  }, 'generation', request);
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim() || content.length > MAX_CONTENT_LENGTH) throw new DirectProviderError('provider_invalid_response');
  const usage = payload.usage && typeof payload.usage === 'object' ? {
    promptTokens: Number.isFinite(payload.usage.prompt_tokens) ? payload.usage.prompt_tokens : undefined,
    completionTokens: Number.isFinite(payload.usage.completion_tokens) ? payload.usage.completion_tokens : undefined,
    totalTokens: Number.isFinite(payload.usage.total_tokens) ? payload.usage.total_tokens : undefined,
  } : undefined;
  return { content: content.trim(), ...(usage ? { usage } : {}) };
}
