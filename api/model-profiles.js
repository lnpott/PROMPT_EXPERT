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
  const modelRules = (profile.modelRules || []).filter((rule) => modelRuleIds.includes(rule.id));
  const candidates = [...modelRules, ...profile.targetRules, ...corpus.generalRules]
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
  const maximum = corpus.runtimePolicy.examples.maximum;
  if (maximum < 1) return null;
  const match = corpus.examples.find((example) => example.target === profile.slug
    && example.taskType === taskType && eligible(example, taskType));
  if (!match) return null;
  return match.expectedOptimizedPrompt.length <= corpus.runtimePolicy.examples.maximumCharacters ? match : null;
}

export const modelProfiles = corpus.targets.map((target) => {
  const profile = {
    slug: target.slug,
    displayName: target.displayName,
    provider: target.provider,
    guidance: target.guidance,
    format: target.format,
    targetRules: target.rules,
    modelRules: target.modelRules || [],
  };
  return { ...profile, rules: selectMethodologyRules(profile).map(({ text }) => text) };
});

export function findProfile(slug) {
  return modelProfiles.find((profile) => profile.slug === slug);
}

export function publicProfiles() {
  return modelProfiles.map(({ rules, targetRules, modelRules, ...profile }) => profile);
}

export function compilePrompt({ brief, profile, taskType = 'cited', includeExample = true }) {
  const selectedRules = selectMethodologyRules(profile, taskType);
  const rules = selectedRules.map(({ text }) => `- ${text}`).join('\n');
  const example = includeExample ? selectMethodologyExample(profile, taskType) : null;
  const exampleSection = example
    ? `\n\n## Exemplo revisado para este target e tipo de tarefa\nUse somente como padrão de estrutura; não copie fatos nem requisitos do exemplo.\n\n${example}`
    : '';
  return `# Prompt para ${profile.displayName}

## Papel
Atue como especialista sênior em engenharia de software. Entregue uma solução verificável e proporcional ao pedido.

## Objetivo
${brief}

## Contexto de execução
- Modelo de destino: ${profile.displayName} (${profile.provider})
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
