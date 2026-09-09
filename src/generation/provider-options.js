export const BYOK_GENERATION_PROVIDERS = Object.freeze(['openrouter', 'openai', 'xai', 'deepseek', 'groq', 'mistral']);

export function catalogSlugFor(provider) {
  return provider === 'groq' ? 'groqcloud' : provider;
}

export function modelsForProvider(providers, provider) {
  if (!BYOK_GENERATION_PROVIDERS.includes(provider)) return [];
  const entry = providers.find((item) => item.slug === catalogSlugFor(provider));
  return Array.isArray(entry?.models) ? entry.models : [];
}

export function controlsForProvider(provider) {
  return {
    platformModel: provider === 'platform',
    providerModel: BYOK_GENERATION_PROVIDERS.includes(provider),
  };
}
