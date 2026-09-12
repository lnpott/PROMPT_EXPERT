import corpus from '../docs/methodology-corpus-v1.json' with { type: 'json' };

const allowedStatuses = new Set(corpus.runtimePolicy.allowedStatuses);
const precedence = new Map(corpus.runtimePolicy.precedence.map((level, index) => [level, index]));
const fallbackRule = Object.freeze({
  id: 'safe-local-fallback', level: 'fallback', priority: 999,
  text: 'Preserve o briefing, peça uma entrega segura e verificável e declare limitações relevantes.',
  status: 'VERIFIED_EMPIRICAL', active: true,
});

export const taskTypes = Object.freeze({
  cited: 'Executar exatamente as tarefas citadas no briefing',
  application: 'Aplicação ou funcionalidade completa',
  refactor: 'Refatoração de código existente',
  debug: 'Diagnóstico e correção de problema',
  agent: 'Tarefa para agente autônomo de programação',
  fim: 'Completude de código Fill-in-the-Middle',
});

function eligible(item, taskType) {
  return item.active === true
    && allowedStatuses.has(item.status)
    && (!item.taskTypes || item.taskTypes.includes(taskType));
}

export function selectMethodologyRules(profile, taskType = 'cited', modelRuleIds = []) {
  const legacyModelRules = (profile.modelRules || []).filter((rule) => modelRuleIds.includes(rule.id));
  const inheritedRules = profile.methodologyRules || [...legacyModelRules, ...(profile.targetRules || [])];
  const candidates = [...inheritedRules, ...corpus.generalRules]
    .filter((rule) => eligible(rule, taskType))
    .sort((left, right) => (precedence.get(left.level) - precedence.get(right.level))
      || (left.priority - right.priority) || left.id.localeCompare(right.id));
  const conflicts = new Set();
  const selected = candidates.filter((rule) => {
    if (!rule.conflictGroup) return true;
    if (conflicts.has(rule.conflictGroup)) return false;
    conflicts.add(rule.conflictGroup);
    return true;
  });
  return selected.length ? selected : [fallbackRule];
}

export function selectMethodologyExample(profile, taskType = 'cited') {
  if (corpus.runtimePolicy.examples.maximum < 1) return null;
  for (const target of profile.methodologyPath || [profile.slug]) {
    const match = corpus.examples.find((example) => example.target === target
      && example.taskType === taskType && eligible(example, taskType));
    if (match && match.expectedOptimizedPrompt.length <= corpus.runtimePolicy.examples.maximumCharacters) {
      return { id: match.id, target: match.target, taskType: match.taskType, sourceId: match.sourceId };
    }
  }
  return null;
}

const definitions = [
  ...corpus.targets.map((target) => ({ ...target, level: 'family' })),
  ...(corpus.specificTargets || []),
];
const definitionsBySlug = new Map(definitions.map((target) => [target.slug, target]));

function resolveDefinition(slug, seen = new Set()) {
  const definition = definitionsBySlug.get(slug);
  if (!definition || seen.has(slug)) return null;
  seen.add(slug);
  const parent = definition.parentSlug ? resolveDefinition(definition.parentSlug, seen) : null;
  if (definition.parentSlug && !parent) return null;
  const ownRules = (definition.rules || []).map((rule) => ({ ...rule, level: definition.level }));
  return {
    slug: definition.slug,
    displayName: definition.displayName,
    provider: definition.provider || parent.provider,
    guidance: definition.guidance || parent.guidance,
    format: definition.format || parent.format,
    familySlug: parent?.familySlug || definition.slug,
    parentSlug: definition.parentSlug || null,
    methodologyPath: [definition.slug, ...(parent?.methodologyPath || [])],
    methodologyRules: [...ownRules, ...(parent?.methodologyRules || [])],
    ownRules,
    public: definition.public !== false,
  };
}

export const modelProfiles = definitions.map(({ slug }) => resolveDefinition(slug)).filter(Boolean);

export function findProfile(slug) {
  return modelProfiles.find((profile) => profile.slug === slug);
}

export function publicProfiles() {
  return modelProfiles.filter((profile) => profile.public).map(({
    methodologyRules, ownRules, public: isPublic, ...profile
  }) => ({ ...profile, hasOwnMethodology: ownRules.length > 0 }));
}

export function compilePrompt({ brief, profile, taskType = 'cited', includeExample = true }) {
  const selectedRules = selectMethodologyRules(profile, taskType);
  const rules = selectedRules.map(({ text }) => `- ${text}`).join('\n');
  const example = includeExample ? selectMethodologyExample(profile, taskType) : null;
  const exampleSection = example
    ? `\n\n## Exemplo revisado: estrutura compatível\nReferência ${example.id}: use apenas a organização em objetivo, contexto, entrega e critérios de aceite. O briefing acima é a única autoridade para linguagem, framework, banco, arquitetura, ferramentas, bibliotecas e requisitos.`
    : '';
  return `# Prompt para ${profile.displayName}

## Papel
Atue como especialista sênior em engenharia de software. Entregue uma solução verificável e proporcional ao pedido.

## Objetivo
${brief}

## Contexto de execução
- Modelo de destino: ${profile.displayName} (${profile.provider})
- Família metodológica: ${profile.familySlug}
- Tipo de tarefa: ${taskTypes[taskType] || taskTypes.cited}
- Formato preferencial: ${profile.format}
- Orientação específica: ${profile.guidance}

## Regras obrigatórias
${rules}${exampleSection}

## Entrega esperada
1. Resuma a abordagem e declare apenas as suposições indispensáveis.
2. Apresente o plano de implementação e a estrutura de arquivos afetada.
3. Forneça alterações completas, consistentes e prontas para execução.
4. Inclua tratamento de erros, segurança e acessibilidade quando aplicáveis.
5. Execute ou indique testes objetivos e reporte evidências observáveis, sem expor raciocínio interno.
6. Finalize com critérios de aceite e instruções de execução.

Não inclua prefácio genérico. Preserve a intenção do briefing e sinalize qualquer requisito impossível ou inseguro.`;
}

export const methodologyCorpus = corpus;
