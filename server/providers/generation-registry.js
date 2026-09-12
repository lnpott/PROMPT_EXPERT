import { DIRECT_PROVIDER_SLUGS } from './direct-providers.js';

const directCatalogSlugs = Object.freeze(DIRECT_PROVIDER_SLUGS.map((slug) => slug === 'groq' ? 'groqcloud' : slug));

const entries = Object.freeze({
  'google-gemini': Object.freeze({ adapter: 'gemini', adapterStatus: 'available', credentialSources: Object.freeze(['platform', 'byok']), validationSupported: true }),
  openrouter: Object.freeze({ adapter: 'openrouter', adapterStatus: 'available', credentialSources: Object.freeze(['byok']) }),
  ...Object.fromEntries(directCatalogSlugs.map((slug) => [slug, Object.freeze({ adapter: 'openai-compatible', adapterStatus: 'available', credentialSources: Object.freeze(['byok']) })])),
  anthropic: Object.freeze({ adapter: 'anthropic', adapterStatus: 'available', credentialSources: Object.freeze(['byok']), validationSupported: true }),
});

export const LOCAL_GENERATION_STRATEGY = Object.freeze({
  slug: 'local', modelId: 'local-deterministic', credentialSource: 'local', adapter: 'local',
});

export function generationCapability(providerSlug) {
  const entry = entries[providerSlug];
  return entry ? {
    adapterStatus: entry.adapterStatus,
    generationSupported: entry.adapterStatus === 'available',
    credentialSources: [...entry.credentialSources],
    validationSupported: Boolean(entry.validationSupported ?? entry.credentialSources.includes('byok')),
  } : { adapterStatus: 'unavailable', generationSupported: false, credentialSources: [] };
}

export function resolveGenerationRoute(providerSlug, credentialSource) {
  // Temporary compatibility for clients predating Passo 18.6.1. The public UI
  // never exposes "platform" as a provider; remove after legacy clients migrate.
  if (providerSlug === 'platform' && (!credentialSource || credentialSource === 'platform')) {
    return { providerSlug: 'google-gemini', credentialSource: 'platform', adapter: 'gemini', legacyAlias: true };
  }
  if (providerSlug === LOCAL_GENERATION_STRATEGY.slug) {
    return credentialSource === 'local'
      ? { providerSlug: 'local', credentialSource: 'local', adapter: 'local', legacyAlias: false }
      : null;
  }
  const entry = entries[providerSlug];
  if (!entry || entry.adapterStatus !== 'available' || !entry.credentialSources.includes(credentialSource)) return null;
  return { providerSlug, credentialSource, adapter: entry.adapter, legacyAlias: false };
}

export const REGISTERED_GENERATION_PROVIDER_SLUGS = Object.freeze(Object.keys(entries));
