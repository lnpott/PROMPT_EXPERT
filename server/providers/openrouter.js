const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
export const OPENROUTER_TIMEOUT_MS = 12_000;
const MAX_RESPONSE_BYTES = 1_000_000;
const MAX_PROMPT_LENGTH = 100_000;

export class OpenRouterError extends Error {
  constructor(code, status = 502) {
    super(code);
    this.name = 'OpenRouterError';
    this.code = code;
    this.status = status;
  }
}

function classify(status) {
  if (status === 401 || status === 403) return ['invalid', 401];
  if (status === 402) return ['insufficient_credits', 402];
  if (status === 404) return ['model_unavailable', 404];
  if (status === 429) return ['rate_limit', 429];
  if (status >= 500) return ['temporary_provider_error', 503];
  return ['provider_error', 502];
}

async function call(path, apiKey, options = {}, request = fetch) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), OPENROUTER_TIMEOUT_MS);
  try {
    const response = await request(`${OPENROUTER_BASE_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      signal: controller.signal,
    });
    if (!response.ok) {
      const [code, status] = classify(response.status);
      throw new OpenRouterError(code, status);
    }
    const length = Number(response.headers?.get?.('content-length'));
    if (Number.isFinite(length) && length > MAX_RESPONSE_BYTES) throw new OpenRouterError('malformed_response');
    const text = await response.text();
    if (Buffer.byteLength(text) > MAX_RESPONSE_BYTES) throw new OpenRouterError('malformed_response');
    try { return JSON.parse(text); } catch { throw new OpenRouterError('malformed_response'); }
  } catch (error) {
    if (error instanceof OpenRouterError) throw error;
    if (error?.name === 'AbortError' || error?.name === 'TimeoutError') throw new OpenRouterError('timeout', 504);
    throw new OpenRouterError('network_error');
  } finally {
    clearTimeout(timer);
  }
}

export async function validateOpenRouterKey(apiKey, request) {
  const payload = await call('/key', apiKey, { method: 'GET' }, request);
  if (!payload?.data || typeof payload.data !== 'object') throw new OpenRouterError('malformed_response');
  return { status: 'valid' };
}

export async function generateWithOpenRouter({ apiKey, model, instruction }, request) {
  const payload = await call('/chat/completions', apiKey, {
    method: 'POST',
    body: JSON.stringify({ model, messages: [{ role: 'user', content: instruction }], max_tokens: 4096 }),
  }, request);
  const prompt = payload?.choices?.[0]?.message?.content;
  if (typeof prompt !== 'string' || !prompt.trim() || prompt.length > MAX_PROMPT_LENGTH) {
    throw new OpenRouterError('malformed_response');
  }
  return prompt.trim();
}
