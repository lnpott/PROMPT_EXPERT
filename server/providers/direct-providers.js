import { generateCompatible, validateCompatibleCredential } from './openai-compatible.js';

const configurations = Object.freeze({
  openai: Object.freeze({ slug: 'openai', credentialSlug: 'openai', displayName: 'OpenAI', baseUrl: 'https://api.openai.com/v1', modelsPath: '/models', chatPath: '/chat/completions' }),
  xai: Object.freeze({ slug: 'xai', credentialSlug: 'xai', displayName: 'xAI', baseUrl: 'https://api.x.ai/v1', modelsPath: '/models', chatPath: '/chat/completions' }),
  deepseek: Object.freeze({ slug: 'deepseek', credentialSlug: 'deepseek', displayName: 'DeepSeek', baseUrl: 'https://api.deepseek.com', modelsPath: '/models', chatPath: '/chat/completions' }),
  groq: Object.freeze({ slug: 'groq', credentialSlug: 'groqcloud', displayName: 'GroqCloud', baseUrl: 'https://api.groq.com/openai/v1', modelsPath: '/models', chatPath: '/chat/completions' }),
  mistral: Object.freeze({ slug: 'mistral', credentialSlug: 'mistral', displayName: 'Mistral', baseUrl: 'https://api.mistral.ai/v1', modelsPath: '/models', chatPath: '/chat/completions' }),
});

export const DIRECT_PROVIDER_SLUGS = Object.freeze(Object.keys(configurations));

export function directProvider(slug) {
  if (slug === 'groqcloud') return configurations.groq;
  return configurations[slug] || null;
}

export async function validateDirectCredential(slug, apiKey, request) {
  const config = directProvider(slug);
  if (!config) throw new TypeError('Unsupported direct provider.');
  return validateCompatibleCredential(config, apiKey, request);
}

export async function generateWithDirectProvider(slug, input, request) {
  const config = directProvider(slug);
  if (!config) throw new TypeError('Unsupported direct provider.');
  return generateCompatible(config, input, request);
}
