import corpus from '../docs/methodology-corpus-v1.json' with { type: 'json' };

const fallbackRule = Object.freeze({ id: 'safe-local-fallback', level: 'fallback', priority: 999, ruleType: 'SECURITY', text: 'Preserve o briefing, peça uma entrega segura e verificável e declare limitações relevantes.', sourceId: 'project-quality-baseline', status: 'VERIFIED_EMPIRICAL', active: true });
const taskTypeLabels = { cited: 'Executar exatamente as tarefas citadas no briefing', application: 'Aplicação ou funcionalidade completa', refactor_full: 'Refatoração completa do código existente', refactor_module: 'Refatoração de um módulo do código existente', bug_fix: 'Correção de bug', agent: 'Tarefa para agente autônomo de programação', debug: 'Depuração e diagnóstico de problema', fim: 'Preencher trecho entre prefixo e sufixo existentes' };
Object.defineProperty(taskTypeLabels, 'refactor', { value: 'Refatoração de código existente', enumerable: false });
export const taskTypes = Object.freeze(taskTypeLabels);
// A release 2.1.0 uses the broader refactor/debug corpus categories. These
// aliases preserve old requests without claiming unverified subtype rules.
export function methodologyTaskType(taskType) {
  if (taskType === 'refactor' || taskType === 'refactor_full' || taskType === 'refactor_module') return 'refactor';
  if (taskType === 'bug_fix') return 'debug';
  return Object.hasOwn(taskTypes, taskType) ? taskType : null;
}
export function fimAvailableForTarget(targetModel, sourceCorpus = corpus) {
  const packageForFim = resolveMethodologyPackage(targetModel, 'fim', sourceCorpus);
  return Boolean(packageForFim?.rules.some((rule) => rule.id === 'codestral-fim-fields'));
}

function engine(sourceCorpus = corpus) {
  const allowed = new Set(sourceCorpus.runtimePolicy.allowedStatuses);
  const precedence = new Map(sourceCorpus.runtimePolicy.precedence.map((level, index) => [level, index]));
  const definitions = [...sourceCorpus.targets.map((target) => ({ ...target, level: 'family' })), ...(sourceCorpus.specificTargets || [])];
  const bySlug = new Map(definitions.map((target) => [target.slug, target]));
  const sources = new Map(sourceCorpus.sources.map((source) => [source.id, source]));
  const eligible = (item, taskType, platform = '') => item.active === true && allowed.has(item.status)
    && (!item.taskTypes || item.taskTypes.includes(taskType)) && (!item.platforms || item.platforms.includes(platform));
  function resolve(slug, seen = new Set()) {
    const definition = bySlug.get(slug);
    if (!definition || seen.has(slug)) return null;
    seen.add(slug);
    const parent = definition.parentSlug ? resolve(definition.parentSlug, seen) : null;
    if (definition.parentSlug && !parent) return null;
    const ownRules = (definition.rules || []).map((rule) => ({ ...rule, level: definition.level, targetSlug: definition.slug }));
    return { slug: definition.slug, displayName: definition.displayName, provider: definition.provider || parent.provider, guidance: definition.guidance || parent.guidance, format: definition.format || parent.format, familySlug: parent?.familySlug || definition.slug, parentSlug: definition.parentSlug || null, methodologyPath: [definition.slug, ...(parent?.methodologyPath || [])], methodologyRules: [...ownRules, ...(parent?.methodologyRules || [])], ownRules, public: definition.public !== false };
  }
  function select(profile, taskType = 'cited', platform = '') {
    const all = [...(profile.methodologyRules || []), ...sourceCorpus.generalRules];
    const ordered = all.filter((rule) => eligible(rule, taskType, platform)).sort((a, b) => (precedence.get(a.level) - precedence.get(b.level)) || (a.priority - b.priority) || a.id.localeCompare(b.id));
    const conflicts = new Set();
    const selected = [], rejected = [];
    for (const rule of all) {
      if (!allowed.has(rule.status)) rejected.push({ rule, reason: `status_${rule.status.toLowerCase()}` });
      else if (!rule.active) rejected.push({ rule, reason: 'inactive' });
      else if (rule.taskTypes && !rule.taskTypes.includes(taskType)) rejected.push({ rule, reason: 'task_type_mismatch' });
      else if (rule.platforms && !rule.platforms.includes(platform)) rejected.push({ rule, reason: 'platform_mismatch' });
    }
    for (const rule of ordered) {
      if (rule.conflictGroup && conflicts.has(rule.conflictGroup)) rejected.push({ rule, reason: 'superseded_by_higher_precedence' });
      else { selected.push(rule); if (rule.conflictGroup) conflicts.add(rule.conflictGroup); }
    }
    if (!selected.length) selected.push(fallbackRule);
    return { selected, rejected };
  }
  return { definitions, sources, resolve, select, eligible };
}

export function resolveMethodologyPackage(targetModel, taskType = 'cited', sourceCorpus = corpus, { platform = '' } = {}) {
  const corpusTaskType = methodologyTaskType(taskType);
  if (!corpusTaskType) return null;
  const runtime = engine(sourceCorpus);
  const profile = runtime.resolve(targetModel);
  if (!profile) return null;
  const { selected, rejected } = runtime.select(profile, corpusTaskType, platform);
  let example = null;
  if (sourceCorpus.runtimePolicy.examples.maximum > 0) for (const target of profile.methodologyPath) {
    const match = sourceCorpus.examples.find((item) => item.target === target && item.taskType === corpusTaskType && runtime.eligible(item, corpusTaskType));
    if (match && match.expectedOptimizedPrompt.length <= sourceCorpus.runtimePolicy.examples.maximumCharacters) { example = { id: match.id, target: match.target, taskType, sourceId: match.sourceId }; break; }
  }
  const trace = {
    target: targetModel, family: profile.familySlug, taskType,
    platform, methodologyTaskType: corpusTaskType,
    selected: selected.map((rule) => ({ ruleId: rule.id, source: runtime.sources.get(rule.sourceId) || null, provenance: rule.status, target: rule.targetSlug || 'general', inheritanceLevel: rule.level, taskType, ruleType: rule.ruleType, effect: rule.effect || 'prompt', reason: rule.level === 'general' ? 'selected_general' : rule.targetSlug === targetModel ? 'selected_own' : 'selected_inherited' })),
    rejected: rejected.map(({ rule, reason }) => ({ ruleId: rule.id, source: runtime.sources.get(rule.sourceId) || null, provenance: rule.status, target: rule.targetSlug || 'general', inheritanceLevel: rule.level, taskType, ruleType: rule.ruleType, effect: rule.effect || 'prompt', reason })),
    example,
  };
  return { profile, rules: selected, rejected, example, trace };
}

export function selectMethodologyRules(profile, taskType = 'cited', modelRuleIds = []) {
  const legacy = profile.methodologyRules ? profile : { ...profile, methodologyRules: [...(profile.modelRules || []).filter((r) => modelRuleIds.includes(r.id)), ...(profile.targetRules || [])] };
  const corpusTaskType = methodologyTaskType(taskType);
  if (!corpusTaskType) throw new Error('unknown_task_type');
  return engine(corpus).select(legacy, corpusTaskType).selected;
}
export function selectMethodologyExample(profile, taskType = 'cited') { return resolveMethodologyPackage(profile.slug, taskType)?.example || null; }
export const modelProfiles = engine(corpus).definitions.map(({ slug }) => engine(corpus).resolve(slug)).filter(Boolean);
export function findProfile(slug) { return modelProfiles.find((profile) => profile.slug === slug); }
export function publicProfiles(sourceCorpus = corpus) { const e = engine(sourceCorpus); return e.definitions.map(({ slug }) => e.resolve(slug)).filter((profile) => profile?.public).map(({ methodologyRules, ownRules, public: _, ...profile }) => ({ ...profile, hasOwnMethodology: ownRules.length > 0 })); }

export function compilePrompt({ brief, profile, taskType = 'cited', includeExample = true, methodologyPackage = null }) {
  if (!methodologyTaskType(taskType)) throw new Error('unknown_task_type');
  const resolved = methodologyPackage || resolveMethodologyPackage(profile.slug, taskType);
  const rules = (resolved?.rules || [fallbackRule]).filter((rule) => !['API_PARAMETER','API_CONSTRAINT','CACHE','PLATFORM'].includes(rule.ruleType)).map(({ text }) => `- ${text}`).join('\n');
  const example = includeExample ? resolved?.example : null;
  const exampleSection = example ? `\n\n## Exemplo revisado: estrutura compatível\nReferência ${example.id}: use apenas a organização em objetivo, contexto, entrega e critérios de aceite. O briefing acima é a única autoridade para linguagem, framework, banco, arquitetura, ferramentas, bibliotecas e requisitos.` : '';
  return `# Prompt para ${profile.displayName}\n\n## Papel\nAtue como especialista sênior em engenharia de software. Entregue uma solução verificável e proporcional ao pedido.\n\n## Objetivo\n${brief}\n\n## Contexto de execução\n- Modelo de destino: ${profile.displayName} (${profile.provider})\n- Família metodológica: ${profile.familySlug}\n- Tipo de tarefa: ${taskTypes[taskType] || 'Refatoração de código existente'}\n- Formato preferencial: ${profile.format}\n- Orientação específica: ${profile.guidance}\n\n## Regras obrigatórias\n${rules}${exampleSection}\n\n## Entrega esperada\n1. Resuma a abordagem e declare apenas as suposições indispensáveis.\n2. Apresente o plano de implementação e a estrutura de arquivos afetada.\n3. Forneça alterações completas, consistentes e prontas para execução.\n4. Inclua tratamento de erros, segurança e acessibilidade quando aplicáveis.\n5. Execute ou indique testes objetivos e reporte evidências observáveis, sem expor raciocínio interno.\n6. Finalize com critérios de aceite e instruções de execução.\n\nNão inclua prefácio genérico. Preserve a intenção do briefing e sinalize qualquer requisito impossível ou inseguro.`;
}
export const methodologyCorpus = corpus;
