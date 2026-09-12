import { STATUS_LABELS } from '../byok/credentials.js';

export function executableProviders(providers) {
  return providers.filter((provider) => provider?.slug && provider?.display_name);
}

export function providerBySlug(providers, slug) {
  return providers.find((provider) => provider.slug === slug) || null;
}

export function generationModelsForProvider(providers, providerSlug) {
  const provider = providerBySlug(providers, providerSlug);
  return (provider?.models || []).map((model) => ({
    modelId: model.model_id,
    displayName: model.display_name,
    description: model.description,
    generationSupported: Boolean(provider.generation?.generationSupported),
  }));
}

export function generationUiState({ provider, credential, credentialSource: selectedSource, authenticated = true }) {
  if (!provider) return { executable: false, availability: 'Catálogo indisponível', credentialSource: '', credentialStatus: '' };
  const supported = Boolean(provider.generation?.generationSupported);
  const credentialSource = selectedSource || provider.generation?.credentialSources?.[0];
  if (!supported) return {
    executable: false,
    availability: 'Execução ainda não disponível',
    credentialSource: 'Nenhuma origem de credencial executável',
    credentialStatus: credential ? 'Chave configurada; adapter ainda indisponível' : 'Adapter ainda não implementado',
  };
  if (credentialSource === 'platform') return {
    executable: authenticated,
    availability: authenticated ? 'Disponível' : 'Disponível após entrar',
    credentialSource: 'Chave da plataforma',
    credentialStatus: authenticated ? 'Nenhuma chave pessoal necessária' : 'Entre para usar a geração da plataforma',
  };
  if (!authenticated) return {
    executable: false,
    availability: 'Disponível com BYOK',
    credentialSource: 'Sua chave',
    credentialStatus: 'Entrar para configurar sua chave',
  };
  return {
    executable: Boolean(credential),
    availability: 'Disponível com BYOK',
    credentialSource: 'Sua chave',
    credentialStatus: credential
      ? `Chave configurada · ${STATUS_LABELS[credential.validationStatus] || STATUS_LABELS.untested}`
      : 'Configure sua chave',
  };
}

export const LOCAL_GENERATION_OPTION = Object.freeze({
  provider: 'local', model: 'local-deterministic', credentialSource: 'local',
});
