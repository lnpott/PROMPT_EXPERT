import { getActiveApiProviders, getPublicAiModels } from '../server/knowledge-base.js';
import { publicCompilerModels } from './compiler-models.js';
import { generationCapability } from '../server/providers/generation-registry.js';

const PROVIDER_FIELDS = [
  'slug', 'display_name', 'category', 'signup_url', 'api_key_url', 'docs_url', 'key_prefix_hint',
  'supports_generation', 'supports_model_listing', 'short_description', 'long_description',
  'company_name', 'country_region', 'website_url', 'logo_url', 'media_url', 'primary_uses',
  'strengths', 'limitations', 'free_tier_status', 'billing_notes', 'card_required',
  'openai_compatible', 'region_notes', 'last_verified_at', 'source_url', 'is_active',
];
const MODEL_FIELDS = [
  'model_id', 'display_name', 'family', 'description', 'input_modalities', 'output_modalities',
  'reasoning_support', 'coding_suitability', 'tool_calling', 'vision', 'audio', 'image_generation',
  'context_window_tokens', 'max_output_tokens', 'input_price', 'output_price', 'cached_input_price',
  'currency', 'pricing_unit', 'pricing_notes', 'free_tier_status', 'is_deprecated', 'official_url',
  'pricing_source_url', 'last_verified_at', 'is_active', 'is_public',
];

export function allowlistedModel(model) {
  return Object.fromEntries(MODEL_FIELDS.map((field) => [field, model[field] ?? null]));
}

export function allowlistedProvider(provider, models = []) {
  return {
    ...Object.fromEntries(PROVIDER_FIELDS.map((field) => [field, provider[field] ?? null])),
    models: models.map(allowlistedModel),
    generation: generationCapability(provider.slug),
  };
}

export async function richProviders() {
  const [providers, models] = await Promise.all([getActiveApiProviders(), getPublicAiModels()]);
  return providers.map((provider) => {
    const providerModels = provider.slug === 'google-gemini'
      ? publicCompilerModels().map((model) => ({ model_id: model.slug, display_name: model.displayName, description: model.recommendation, is_active: true, is_public: true, is_deprecated: false }))
      : models.filter((model) => model.api_providers?.slug === provider.slug);
    return allowlistedProvider(provider, providerModels);
  });
}

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    const providers = await richProviders();
    return response.status(200).json({ status: 'ok', providers });
  } catch {
    return response.status(503).json({
      status: 'unavailable',
      error: 'O catálogo de provedores não está disponível agora.',
    });
  }
}
