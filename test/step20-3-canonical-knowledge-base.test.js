import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import corpus from '../docs/methodology-corpus-v1.json' with { type: 'json' };
import { compilePrompt, resolveMethodologyPackage } from '../api/model-profiles.js';
import { clearCanonicalMethodologyCache, loadCanonicalMethodology } from '../server/canonical-methodology.js';

const migration = readFileSync(new URL('../supabase/migrations/20260912120000_canonical_methodology_knowledge_base.sql', import.meta.url), 'utf8');

test('canonical release import is primary and validated independently from ai_models', async () => {
  clearCanonicalMethodologyCache();
  const release = await loadCanonicalMethodology({ fetchImpl: async (url) => {
    assert.match(url, /methodology_releases/); assert.doesNotMatch(url, /ai_models/);
    return { ok: true, json: async () => [{ version: '2.0.0', payload: corpus, content_sha256: 'bdc5581868d28cd0c9db6d284b9f33baa7cc01a670cf69ee3ccd9aed34639623' }] };
  }, allowLocalFallback: false });
  assert.equal(release.origin, 'supabase');
  assert.equal(release.corpus.corpusVersion, '2.0.0');
  clearCanonicalMethodologyCache();
});

test('migration persists releases, sources, targets, rules, applicability and examples with RLS', () => {
  for (const object of ['methodology_releases','methodology_sources','methodology_targets','methodology_rules','methodology_rule_applicability','methodology_examples']) assert.match(migration, new RegExp(`create table if not exists public\\.${object}`));
  assert.match(migration, /VERIFIED_OFFICIAL.*VERIFIED_EMPIRICAL.*PROJECT_HEURISTIC.*UNVERIFIED.*DEPRECATED.*CONFLICTING/);
  assert.match(migration, /one_active_methodology_release/);
  assert.doesNotMatch(migration, /user_api_credentials|credential_ciphertext|auth\.users/);
});

test('decision trace explains selected and rejected rules with source and inheritance', () => {
  const custom = structuredClone(corpus);
  custom.targets.find(({ slug }) => slug === 'claude').rules.push(
    { id: 'reject-me', level: 'family', priority: 1, text: 'NO', ruleType: 'PROMPT_STRUCTURE', sourceId: 'claude-prompting', status: 'UNVERIFIED', confidence: 'low', active: true, taskTypes: ['debug'] },
  );
  const pkg = resolveMethodologyPackage('claude-sonnet-5', 'debug', custom);
  assert.ok(pkg.trace.selected.every((item) => item.ruleId && item.source && item.provenance && item.inheritanceLevel && item.reason));
  assert.ok(pkg.trace.selected.some(({ reason }) => reason === 'eligible_inherited_rule'));
  assert.deepEqual(pkg.trace.rejected.find(({ ruleId }) => ruleId === 'reject-me').reason, 'status:UNVERIFIED');
});

test('prompt compiler excludes API/platform/cache rules from prompt instructions', () => {
  const custom = structuredClone(corpus);
  custom.generalRules.push({ id: 'api-only', level: 'general', priority: 1, text: 'reasoning_effort=high', ruleType: 'API_PARAMETER', sourceId: 'openai-prompt-engineering', status: 'VERIFIED_OFFICIAL', confidence: 'high', active: true, taskTypes: ['debug'] });
  const pkg = resolveMethodologyPackage('gpt-5.6-sol', 'debug', custom);
  assert.ok(pkg.rules.some(({ id }) => id === 'api-only'));
  assert.doesNotMatch(compilePrompt({ brief: 'Corrija.', profile: pkg.profile, taskType: 'debug', methodologyPackage: pkg }), /reasoning_effort=high/);
});

const golden = [
  ['gpt-5.6-sol','debug','openai-instruction-boundary'], ['claude-sonnet-5','debug','claude-xml-boundaries'],
  ['gemini-3.8-flash','debug','gemini-output-contract'], ['grok-4.6','agent','grok-tool-schema'],
  ['deepseek-flash','debug','deepseek-no-reasoning-request'], ['qwen3.7-plus','agent','qwen-tool-schema'],
  ['codestral','fim','codestral-fim-fields'], ['kimi-k3','debug','kimi-context-boundary'], ['llama-3.1','debug','llama-runtime-roles'],
];
for (const [target, task, expected] of golden) test(`golden trace: ${target}/${task}`, () => {
  const pkg = resolveMethodologyPackage(target, task);
  assert.ok(pkg.rules.some(({ id }) => id === expected));
  assert.ok(pkg.trace.selected.some(({ ruleId }) => ruleId === expected));
  assert.ok(pkg.trace.rejected.every(({ reason }) => reason));
  assert.equal(pkg.trace.taskType, task);
});
