export const BYOK_GENERATION_PROVIDERS = Object.freeze(['openrouter', 'openai', 'xai', 'deepseek', 'groq', 'mistral']);

export function catalogSlugFor(provider) {
  return provider === 'groq' ? 'groqcloud' : provider;
}

export function modelsForProvider(providers, provider) {
  if (!BYOK_GENERATION_PROVIDERS.includes(provider)) return [];
  const entry = providers.find((item) => item.slug === catalogSlugFor(provider));
  return Array.isArray(entry?.models) ? entry.models : [];
}

export function generationModelsForProvider({ providers, compilers }, provider) {
  if (provider === 'platform') return compilers.map((compiler) => ({
    modelId: compiler.slug,
    displayName: compiler.displayName,
    isDefault: compiler.isDefault,
  }));
  if (provider === 'local') return [{ modelId: 'local-deterministic', displayName: 'Compilador determinístico local', isDefault: true }];
  return modelsForProvider(providers, provider).map((model) => ({ modelId: model.model_id, displayName: model.display_name, isDefault: false }));
}
