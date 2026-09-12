import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import corpus from '../docs/methodology-corpus-v1.json' with { type: 'json' };
import { compilePrompt, resolveMethodologyPackage } from '../api/model-profiles.js';
import { canonicalJson, clearCanonicalMethodologyCache, loadCanonicalMethodology } from '../server/canonical-methodology.js';

const claims = JSON.parse(readFileSync(new URL('../docs/methodology-claim-inventory-v2.json', import.meta.url)));
const coverage = readFileSync(new URL('../docs/methodology-coverage-matrix-v2.md', import.meta.url), 'utf8');
const migration = readFileSync(new URL('../supabase/migrations/20260912130000_canonical_methodology_release_2_1.sql', import.meta.url), 'utf8');
const expectedSha = 'f7b019502b7f418fc8d717bff23c79615fa4845afe600c30b42c7b7ffbf47e40';

test('2.1 release has a reproducible checksum and atomic activation', () => {
  assert.equal(corpus.corpusVersion, '2.1.0');
  assert.equal(createHash('sha256').update(canonicalJson(corpus)).digest('hex'), expectedSha);
  assert.match(migration, new RegExp(expectedSha));
  assert.match(migration, /begin;[\s\S]*status='archived'[\s\S]*status='active'[\s\S]*commit;/);
  assert.doesNotMatch(migration, /drop table|truncate|user_api_credentials|auth\.users|vault/i);
});

test('claim and coverage inventories are complete and use closed verdict vocabularies', () => {
  assert.equal(claims.claims.length, 52);
  for (const claim of claims.claims) for (const field of ['claim_id','text','research_origin','manufacturer','family','candidateRuleType','initialState','finalVerdict','runtime']) assert.ok(Object.hasOwn(claim, field), `${claim.claim_id}:${field}`);
  const publicTargets = corpus.specificTargets.filter((target) => target.public !== false);
  const dimensions = ['prompt structure','instruction style','context structure','role/system semantics','few-shot/examples','coding','debugging','refactoring','application generation','autonomous agents','tool use/function calling','structured output','FIM','reasoning/thinking','context management','long context','cache','API constraints','sampling/effort','anti-patterns','security/instruction boundaries','verification/testing behavior'];
  for (const target of publicTargets) for (const dimension of dimensions) {
    const row = coverage.split('\n').find((line) => line.startsWith('| `' + target.slug + '` | ' + dimension + ' |'));
    assert.ok(row, `${target.slug}/${dimension}`);
    assert.match(row, /\| (CONFIRMED|INHERITED|NO_SPECIFIC_GUIDANCE|NOT_APPLICABLE|CONFLICTING|UNVERIFIED|RESEARCH_GAP) \|/);
  }
});

test('fail-closed trace explains API/prompt effects and rejected historical claims', () => {
  const pkg = resolveMethodologyPackage('deepseek-flash', 'agent');
  assert.ok(pkg.trace.selected.some(({ ruleId, ruleType, effect }) => ruleId === 'deepseek-reasoning-passback-api' && ruleType === 'API_CONSTRAINT' && effect === 'orchestrator'));
  assert.ok(pkg.trace.rejected.some(({ ruleId, reason, source }) => ruleId === 'deepseek-sampling-effort-unverified' && reason === 'status_unverified' && source));
  const prompt = compilePrompt({ brief: 'Corrija o serviço em Python.', profile: pkg.profile, taskType: 'agent', methodologyPackage: pkg });
  assert.doesNotMatch(prompt, /Em conversas thinking multi-turn/);
  assert.match(prompt, /Python/);
});

test('canonical package cannot hallucinate methodology or example requirements', () => {
  const pkg = resolveMethodologyPackage('claude-sonnet-5', 'application');
  const prompt = compilePrompt({ brief: 'Crie um processador em Python.', profile: pkg.profile, taskType: 'application', methodologyPackage: pkg });
  assert.doesNotMatch(prompt, /React|PostgreSQL|TypeScript/);
  assert.match(prompt, /Python/);
  assert.ok(prompt.includes('Referência claude-application-01'));
  assert.ok(pkg.rules.every((rule) => pkg.trace.selected.some(({ ruleId }) => ruleId === rule.id)));
});

test('local fallback is checksummed and semantically identical to release 2.1', async () => {
  clearCanonicalMethodologyCache();
  const release = await loadCanonicalMethodology({ fetchImpl: async () => { throw new Error('offline'); } });
  assert.equal(release.version, '2.1.0');
  assert.equal(release.checksum, expectedSha);
  assert.deepEqual(release.corpus, corpus);
  clearCanonicalMethodologyCache();
});
