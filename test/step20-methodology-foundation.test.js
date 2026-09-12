import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  compilePrompt,
  findProfile,
  methodologyCorpus,
  modelProfiles,
  selectMethodologyExample,
  selectMethodologyRules,
} from '../api/model-profiles.js';

const rawCorpus = readFileSync(new URL('../docs/methodology-corpus-v1.json', import.meta.url), 'utf8');
const allowed = new Set(methodologyCorpus.runtimePolicy.allowedStatuses);

test('versioned corpus preserves nine methodology families with traceable verified content', () => {
  assert.deepEqual(methodologyCorpus.targets.map(({ slug }) => slug).sort(),
    ['claude', 'codestral', 'deepseek', 'gemini', 'grok', 'kimi', 'llama', 'openai', 'qwen']);
  const sources = new Map(methodologyCorpus.sources.map((source) => [source.id, source]));
  for (const rule of [...methodologyCorpus.generalRules, ...methodologyCorpus.targets.flatMap(({ rules }) => rules)]) {
    assert.ok(sources.has(rule.sourceId), `missing source for ${rule.id}`);
    const source = sources.get(rule.sourceId);
    assert.ok(source.url);
    assert.ok(source.type);
    assert.match(source.verifiedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(methodologyCorpus.statusVocabulary.includes(rule.status));
  }
});

test('corpus contains two reviewed task-scoped examples per methodology family', () => {
  assert.equal(methodologyCorpus.examples.length, 18);
  for (const target of methodologyCorpus.targets) {
    const profile = findProfile(target.slug);
    const examples = methodologyCorpus.examples.filter(({ target: exampleTarget }) => exampleTarget === target.slug);
    assert.deepEqual(examples.map(({ taskType }) => taskType).sort(), ['application', 'debug']);
    assert.ok(examples.every(({ status, active, sourceId, rationale, verifiedAt }) =>
      status === 'VERIFIED_EMPIRICAL' && active && sourceId && rationale && verifiedAt));
  }
});

test('unverified, deprecated and conflicting lower-precedence rules never enter runtime', () => {
  const profile = {
    targetRules: [
      { id: 'target', level: 'target', priority: 20, text: 'TARGET-WINS', status: 'VERIFIED_OFFICIAL', active: true, conflictGroup: 'format' },
      { id: 'unverified', level: 'target', priority: 1, text: 'MUST-NOT-APPEAR', status: 'UNVERIFIED', active: true },
      { id: 'deprecated', level: 'target', priority: 2, text: 'OLD-RULE', status: 'DEPRECATED', active: true },
    ],
    modelRules: [
      { id: 'version', level: 'model', priority: 99, text: 'MODEL-WINS', status: 'VERIFIED_OFFICIAL', active: true, conflictGroup: 'format' },
    ],
  };
  const selected = selectMethodologyRules(profile, 'debug', ['version']);
  assert.equal(selected[0].text, 'MODEL-WINS');
  assert.ok(!selected.some(({ text }) => /TARGET-WINS|MUST-NOT-APPEAR|OLD-RULE/.test(text)));
});

test('example policy selects at most one exact target/task match and has a size cap', () => {
  for (const profile of modelProfiles) {
    assert.ok(selectMethodologyExample(profile, 'debug'));
    assert.ok(selectMethodologyExample(profile, 'application'));
    assert.equal(selectMethodologyExample(profile, 'refactor'), null);
    const prompt = compilePrompt({ brief: 'Corrija o erro.', profile, taskType: 'debug' });
    assert.equal((prompt.match(/## Exemplo revisado/g) || []).length, 1);
  }
});

test('task type scopes FIM behavior without contaminating ordinary Codestral tasks', () => {
  const profile = findProfile('codestral');
  const fim = selectMethodologyRules(profile, 'fim').map(({ id }) => id);
  const debug = selectMethodologyRules(profile, 'debug').map(({ id }) => id);
  assert.ok(fim.includes('codestral-fim-fields'));
  assert.ok(!fim.includes('codestral-no-forced-fim'));
  assert.ok(debug.includes('codestral-no-forced-fim'));
  assert.ok(!debug.includes('codestral-fim-fields'));
});

test('same briefing produces observable target methodology while target stays explicit', () => {
  const brief = 'Corrija uma condição de corrida e valide a solução.';
  const openai = compilePrompt({ brief, profile: findProfile('openai'), taskType: 'debug', includeExample: false });
  const claude = compilePrompt({ brief, profile: findProfile('claude'), taskType: 'debug', includeExample: false });
  assert.match(openai, /entrada não confiável/);
  assert.match(claude, /tags XML/);
  assert.ok(openai.includes(brief) && claude.includes(brief));
  assert.notEqual(openai, claude);
});

test('corpus and generated prompts never request chain-of-thought or contain operational drift', () => {
  assert.doesNotMatch(rawCorpus, /pense passo a passo|mostre (?:sua|o) (?:lógica|raciocínio)/i);
  assert.doesNotMatch(rawCorpus, /deepseek-v4-flash/);
  assert.doesNotMatch(rawCorpus, /api[_ -]?key|authorization:\s*bearer/i);
});

test('runtime status policy is fail-closed', () => {
  assert.deepEqual([...allowed].sort(), ['VERIFIED_EMPIRICAL', 'VERIFIED_OFFICIAL']);
  assert.ok(!allowed.has('UNVERIFIED'));
  assert.ok(!allowed.has('PROJECT_HEURISTIC'));
  assert.ok(!allowed.has('CONFLICTING'));
});

test('unknown task type fails explicitly', () => {
  assert.throws(() => selectMethodologyRules({ targetRules: [], modelRules: [] }, 'unsupported-task'), /unknown_task_type/);
});
