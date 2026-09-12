#!/usr/bin/env node
import corpus from '../docs/methodology-corpus-v1.json' with { type: 'json' };
import { compilePrompt, publicProfiles, resolveMethodologyPackage, taskTypes } from '../api/model-profiles.js';

export const API_RULE_TYPES = new Set(['API_PARAMETER', 'API_CONSTRAINT', 'CACHE', 'PLATFORM']);
export const AUDIT_BRIEF = 'Crie uma API REST simples para cadastro de tarefas com validação, tratamento de erros e testes.';

function sourceMap(sourceCorpus) { return new Map(sourceCorpus.sources.map((source) => [source.id, source])); }

function auditRule(rule, trace, sources, selected) {
  const item = selected ? trace.selected.find(({ ruleId }) => ruleId === rule.id) : trace.rejected.find(({ ruleId }) => ruleId === rule.id);
  return {
    ruleId: rule.id,
    text: rule.text,
    originScope: rule.targetSlug || item?.target || 'general',
    inheritanceLevel: rule.level,
    ruleType: rule.ruleType,
    effect: rule.effect || 'prompt',
    provenance: rule.status,
    sourceId: rule.sourceId,
    sourceOrganization: sources.get(rule.sourceId)?.organization || null,
    taskTypes: rule.taskTypes || [],
    platforms: rule.platforms || [],
    priority: rule.priority,
    conflictGroup: rule.conflictGroup || null,
    reason: item?.reason || (selected ? 'selected' : 'not_applicable'),
  };
}

export function auditResolution(target, taskType, { platform = '', sourceCorpus = corpus, brief = AUDIT_BRIEF } = {}) {
  if (!Object.hasOwn(taskTypes, taskType)) throw new Error(`unknown_task_type:${taskType}`);
  const methodologyPackage = resolveMethodologyPackage(target, taskType, sourceCorpus, { platform });
  if (!methodologyPackage) throw new Error(`unknown_target:${target}`);
  const { profile, rules, rejected, example, trace } = methodologyPackage;
  const sources = sourceMap(sourceCorpus);
  const selected = rules.map((rule) => auditRule(rule, trace, sources, true));
  const rejectedRules = rejected.map(({ rule }) => auditRule(rule, trace, sources, false));
  const promptRules = selected.filter(({ ruleType }) => !API_RULE_TYPES.has(ruleType));
  const orchestrationRules = selected.filter(({ ruleType }) => API_RULE_TYPES.has(ruleType));
  const antiPatterns = selected.filter(({ ruleType }) => ruleType === 'ANTI_PATTERN');
  const ownRules = selected.filter(({ originScope }) => originScope === target);
  const inheritedRules = selected.filter(({ originScope }) => originScope !== target);
  const sourceIds = [...new Set([...selected, ...rejectedRules].map(({ sourceId }) => sourceId).filter(Boolean))];
  return {
    release: sourceCorpus.corpusVersion,
    target: profile.slug,
    displayName: profile.displayName,
    family: profile.familySlug,
    parent: profile.parentSlug,
    version: sourceCorpus.specificTargets.find(({ slug }) => slug === target)?.level === 'version' ? target : null,
    methodologyPath: [...profile.methodologyPath, 'general'],
    taskType,
    platform,
    ownRules,
    inheritedRules,
    selectedPromptRules: promptRules,
    orchestrationRules,
    antiPatterns,
    rejectedRules,
    example,
    provenance: [...new Set(selected.map(({ provenance }) => provenance))],
    sources: sourceIds.map((id) => sources.get(id)).filter(Boolean),
    compiledPrompt: compilePrompt({ brief, profile, taskType, methodologyPackage }),
  };
}

export function auditAll(options = {}) {
  const sourceCorpus = options.sourceCorpus || corpus;
  return publicProfiles(sourceCorpus).flatMap(({ slug }) => Object.keys(taskTypes).map((taskType) => auditResolution(slug, taskType, { ...options, sourceCorpus })));
}

function valueAfter(flag) { const index = process.argv.indexOf(flag); return index >= 0 ? process.argv[index + 1] : null; }
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  try {
    const result = process.argv.includes('--all')
      ? auditAll({ platform: valueAfter('--platform') || '' })
      : auditResolution(valueAfter('--target'), valueAfter('--task-type') || 'cited', { platform: valueAfter('--platform') || '' });
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
