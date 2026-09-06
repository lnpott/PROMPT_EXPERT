export const DEFAULT_COMPILER_MODEL = 'gemini-3.5-flash-lite';

const compilerModels = [
  { slug: 'gemini-3.5-flash-lite', displayName: 'Gemini 3.5 Flash-Lite', provider: 'Google', apiKeyEnvironmentVariable: 'GEMINI_API_KEY', tier: 'Econômico', recommendation: 'Padrão: rápido e econômico para a maioria dos briefings.' },
  { slug: 'gemini-3.5-flash', displayName: 'Gemini 3.5 Flash', provider: 'Google', apiKeyEnvironmentVariable: 'GEMINI_API_KEY', tier: 'Equilibrado', recommendation: 'Prefira quando quiser mais qualidade sem usar o modelo mais novo.' },
  { slug: 'gemini-3.8-flash', displayName: 'Gemini 3.8 Flash', provider: 'Google', apiKeyEnvironmentVariable: 'GEMINI_API_KEY', tier: 'Qualidade', recommendation: 'Prefira para briefings difíceis quando qualidade for mais importante que economia.' },
  { slug: 'gemini-3.7-flash', displayName: 'Gemini 3.7 Flash', provider: 'Google', apiKeyEnvironmentVariable: 'GEMINI_API_KEY', tier: 'Alternativo', recommendation: 'Alternativa estável para comparação e avaliação.' },
  { slug: 'gemini-3.1-flash-lite', displayName: 'Gemini 3.1 Flash-Lite', provider: 'Google', apiKeyEnvironmentVariable: 'GEMINI_API_KEY', tier: 'Legado econômico', recommendation: 'Use somente para compatibilidade ou comparação com a geração anterior.' },
];

export function findCompilerModel(slug) {
  return compilerModels.find((model) => model.slug === slug);
}

export function publicCompilerModels() {
  return compilerModels.map((model) => ({ ...model, isDefault: model.slug === DEFAULT_COMPILER_MODEL }));
}

export function compilerApiKey(model) {
  return model ? process.env[model.apiKeyEnvironmentVariable] : undefined;
}
