import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import corpus from '../docs/methodology-corpus-v1.json' with { type: 'json' };
import { publicProfiles, resolveMethodologyPackage, taskTypes } from '../api/model-profiles.js';
import { API_RULE_TYPES, AUDIT_BRIEF, auditAll, auditResolution } from '../scripts/audit-methodology-resolution.mjs';

const allowed = new Set(['VERIFIED_OFFICIAL', 'VERIFIED_EMPIRICAL']);
const auditDoc = readFileSync(new URL('../docs/methodology-applied-audit-2.1.0.md', import.meta.url), 'utf8');
const mainSource = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');

test('audit covers every public target across every real task type', () => {
  const profiles = publicProfiles(corpus);
  const audit = auditAll();
  assert.equal(profiles.length, 23);
  assert.equal(Object.keys(taskTypes).length, 6);
  assert.equal(audit.length, profiles.length * Object.keys(taskTypes).length);
  for (const profile of profiles) for (const taskType of Object.keys(taskTypes)) {
    assert.ok(audit.some(({ target, taskType: task }) => target === profile.slug && task === taskType));
    assert.ok(auditDoc.includes('| `' + profile.slug + '` | ' + taskType + ' |'));
  }
});

test('audit-all enumerates targets from the supplied release instead of the bundled snapshot', () => {
  const custom = structuredClone(corpus);
  custom.specificTargets = custom.specificTargets.filter(({ slug }) => slug !== 'grok-4.6');
  custom.specificTargets.push({ slug: 'audit-only-target', displayName: 'Audit Only', provider: 'OpenAI', parentSlug: 'openai', level: 'model', rules: [] });
  const targets = new Set(auditAll({ sourceCorpus: custom }).map(({ target }) => target));
  assert.ok(targets.has('audit-only-target'));
  assert.ok(!targets.has('grok-4.6'));
});

test('every selected rule has allowed provenance and a resolvable source', () => {
  for (const item of auditAll()) for (const rule of [...item.selectedPromptRules, ...item.orchestrationRules]) {
    assert.ok(allowed.has(rule.provenance), `${item.target}/${item.taskType}/${rule.ruleId}`);
    assert.ok(rule.sourceId && rule.sourceOrganization);
    assert.ok(item.sources.some(({ id }) => id === rule.sourceId));
    assert.ok(rule.reason.startsWith('selected_'));
  }
});

test('prompt, API and anti-pattern classifications are auditable without API contamination', () => {
  for (const item of auditAll()) {
    assert.ok(item.selectedPromptRules.every(({ ruleType }) => !API_RULE_TYPES.has(ruleType)));
    assert.ok(item.orchestrationRules.every(({ ruleType }) => API_RULE_TYPES.has(ruleType)));
    assert.ok(item.antiPatterns.every(({ ruleType }) => ruleType === 'ANTI_PATTERN'));
    for (const rule of item.orchestrationRules) assert.ok(!item.compiledPrompt.includes(rule.text), `${item.target}/${rule.ruleId}`);
  }
});

test('all examples remain structural and never inject an absent stack', () => {
  for (const item of auditAll()) {
    assert.match(item.compiledPrompt, new RegExp(AUDIT_BRIEF.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    assert.doesNotMatch(item.compiledPrompt, /React|TypeScript|PostgreSQL|Docker/);
    if (item.example) {
      assert.match(item.compiledPrompt, new RegExp(`Referência ${item.example.id}`));
      assert.match(item.compiledPrompt, /briefing acima é a única autoridade/i);
    }
  }
  const python = auditResolution('claude-sonnet-5', 'application', { brief: 'Crie a solução em Python.' });
  assert.match(python.compiledPrompt, /Python/);
  assert.doesNotMatch(python.compiledPrompt, /TypeScript/);
});

test('specific targets expose no invented own rule or version override', () => {
  for (const target of corpus.specificTargets.filter(({ public: visible }) => visible !== false)) {
    for (const taskType of Object.keys(taskTypes)) {
      const item = auditResolution(target.slug, taskType);
      assert.deepEqual(item.ownRules, []);
      assert.equal(item.methodologyPath.at(-1), 'general');
      assert.ok(item.methodologyPath.includes(target.parentSlug));
    }
  }
});

test('fail-closed rejects every forbidden provenance status', () => {
  for (const status of ['UNVERIFIED', 'DEPRECATED', 'CONFLICTING', 'PROJECT_HEURISTIC']) {
    const custom = structuredClone(corpus);
    custom.targets.find(({ slug }) => slug === 'openai').rules.push({ id: `forbidden-${status}`, text: 'MUST NOT ENTER', level: 'family', priority: 1, ruleType: 'PROMPT_STRUCTURE', effect: 'prompt', sourceId: 'openai-prompt-engineering', status, active: true, taskTypes: ['debug'] });
    const item = auditResolution('gpt-5.6-sol', 'debug', { sourceCorpus: custom });
    assert.ok(!item.compiledPrompt.includes('MUST NOT ENTER'));
    assert.equal(item.rejectedRules.find(({ ruleId }) => ruleId === `forbidden-${status}`).reason, `status_${status.toLowerCase()}`);
  }
});

test('version conflict override wins family deterministically and trace names supersession', () => {
  const custom = structuredClone(corpus);
  custom.targets.find(({ slug }) => slug === 'openai').rules.push({ id: 'family-conflict', text: 'FAMILY', level: 'family', priority: 1, ruleType: 'PROMPT_STRUCTURE', effect: 'prompt', sourceId: 'openai-prompt-engineering', status: 'VERIFIED_OFFICIAL', active: true, taskTypes: ['debug'], conflictGroup: 'audit-conflict' });
  custom.specificTargets.find(({ slug }) => slug === 'gpt-5.6-sol').rules.push({ id: 'version-conflict', text: 'VERSION', level: 'version', priority: 999, ruleType: 'PROMPT_STRUCTURE', effect: 'prompt', sourceId: 'openai-prompt-engineering', status: 'VERIFIED_OFFICIAL', active: true, taskTypes: ['debug'], conflictGroup: 'audit-conflict' });
  const item = auditResolution('gpt-5.6-sol', 'debug', { sourceCorpus: custom });
  assert.ok(item.ownRules.some(({ ruleId }) => ruleId === 'version-conflict'));
  assert.equal(item.rejectedRules.find(({ ruleId }) => ruleId === 'family-conflict').reason, 'superseded_by_higher_precedence');
});

test('task and platform applicability reject mismatches explicitly', () => {
  for (const task of ['debug', 'application', 'agent']) {
    const item = auditResolution('codestral', task);
    assert.ok(!item.selectedPromptRules.some(({ ruleId }) => ruleId === 'codestral-fim-fields'));
    assert.equal(item.rejectedRules.find(({ ruleId }) => ruleId === 'codestral-fim-fields').reason, 'task_type_mismatch');
  }
  assert.ok(auditResolution('codestral', 'fim').selectedPromptRules.some(({ ruleId }) => ruleId === 'codestral-fim-fields'));
  const custom = structuredClone(corpus);
  custom.targets.find(({ slug }) => slug === 'gemini').rules.push({ id: 'vertex-only', text: 'VERTEX ONLY', level: 'family', priority: 1, ruleType: 'PROMPT_STRUCTURE', effect: 'prompt', sourceId: 'gemini-prompting', status: 'VERIFIED_OFFICIAL', active: true, taskTypes: ['debug'], platforms: ['vertex'] });
  assert.equal(auditResolution('gemini-3.8-flash', 'debug', { sourceCorpus: custom, platform: 'ai-studio' }).rejectedRules.find(({ ruleId }) => ruleId === 'vertex-only').reason, 'platform_mismatch');
  assert.ok(auditResolution('gemini-3.8-flash', 'debug', { sourceCorpus: custom, platform: 'vertex' }).selectedPromptRules.some(({ ruleId }) => ruleId === 'vertex-only'));
});

test('unknown targets fail closed and empty eligible bases use only safe fallback', () => {
  assert.throws(() => auditResolution('does-not-exist', 'debug'), /unknown_target/);
  assert.equal(resolveMethodologyPackage('does-not-exist', 'debug'), null);
  const custom = structuredClone(corpus);
  custom.generalRules = [];
  for (const target of custom.targets) target.rules = [];
  const item = auditResolution('claude-sonnet-5', 'debug', { sourceCorpus: custom });
  assert.deepEqual(item.selectedPromptRules.map(({ ruleId }) => ruleId), ['safe-local-fallback']);
});

test('generation executor choices cannot change target methodology', () => {
  const matrix = [
    ['deepseek-flash', 'claude-sonnet-5', 'claude'], ['gemini-3.8-flash', 'grok-4.6', 'grok'],
    ['gpt-5.6-sol', 'gemini-3.8-flash', 'gemini'], ['local-deterministic', 'openai', 'openai'],
    ['grok-4.6', 'deepseek-flash', 'deepseek'],
  ];
  for (const [, target, family] of matrix) assert.equal(auditResolution(target, 'debug').family, family);
});

test('UI obtains exactly the canonical public profile authority', () => {
  assert.match(mainSource, /let profiles = publicProfiles\(\)/);
  assert.match(mainSource, /fetch\('\/api\/profiles'\)/);
  assert.match(mainSource, /option\.value = profile\.slug/);
  for (const profile of publicProfiles(corpus)) assert.ok(resolveMethodologyPackage(profile.slug, 'cited'));
});
