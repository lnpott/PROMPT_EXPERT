import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import test from 'node:test';

import { publicCompilerModels } from '../api/compiler-models.js';
import { REGISTERED_GENERATION_PROVIDER_SLUGS } from '../server/providers/generation-registry.js';

const audit = JSON.parse(readFileSync(new URL('../docs/model-catalog-audit-2026-09-12.json', import.meta.url), 'utf8'));
const migrationsDirectory = new URL('../supabase/migrations/', import.meta.url);
const migrations = readdirSync(migrationsDirectory).sort().map((name) => ({
  name,
  sql: readFileSync(new URL(name, migrationsDirectory), 'utf8'),
}));
const catalogMigration = migrations.find(({ name }) => name === '20260908230000_enrich_provider_model_catalog.sql').sql;
const deepSeekMigration = migrations.find(({ name }) => name === '20260912010000_replace_deepseek_legacy_model.sql').sql;

const seededPairs = [...catalogMigration.matchAll(/where slug='([^']+)'\), '([^']+)'/g)]
  .map(([, provider, modelId]) => `${provider}:${modelId}`);
const currentPairs = new Set(seededPairs);
for (const { sql } of migrations) {
  const replacement = sql.match(/set model_id = '([^']+)'[\s\S]*?where provider_id = [\s\S]*?slug = '([^']+)'[\s\S]*?and model_id = '([^']+)'/);
  if (!replacement) continue;
  const [, currentModelId, provider, previousModelId] = replacement;
  currentPairs.delete(`${provider}:${previousModelId}`);
  currentPairs.add(`${provider}:${currentModelId}`);
}
for (const { slug } of publicCompilerModels()) currentPairs.add(`google-gemini:${slug}`);

test('every versioned or Gemini-runtime model ID has a dated official audit record', () => {
  const auditedPairs = new Set(audit.models.map(({ provider, modelId }) => `${provider}:${modelId}`));
  const rollout = audit.postRollout;
  auditedPairs.delete(`${rollout.provider}:${rollout.previousModelId}`);
  auditedPairs.add(`${rollout.provider}:${rollout.currentModelId}`);
  assert.deepEqual([...currentPairs].sort(), [...auditedPairs].sort());
  assert.equal(audit.models.length, 16);
  assert.equal(new Set(audit.models.map(({ provider, modelId }) => `${provider}:${modelId}`)).size, 16);
  for (const model of audit.models) {
    assert.ok(audit.statusVocabulary.includes(model.status));
    assert.match(model.officialSource, /^https:\/\//);
    assert.equal(model.endpointCompatible, true);
  }
});

test('Gemini platform allowlist contains only officially confirmed models', () => {
  const gemini = audit.models.filter(({ provider }) => provider === 'google-gemini');
  assert.deepEqual(publicCompilerModels().map(({ slug }) => slug).sort(), gemini.map(({ modelId }) => modelId).sort());
  assert.ok(gemini.every(({ status, deprecated }) => status === 'CONFIRMED' && deprecated === false));
});

test('every catalog provider has an adapter registration while inactive Alibaba remains regional', () => {
  const catalogProviders = new Set(audit.models.map(({ provider }) => provider));
  assert.deepEqual([...REGISTERED_GENERATION_PROVIDER_SLUGS].sort(), [...catalogProviders].sort());
  const alibaba = audit.models.find(({ provider }) => provider === 'alibaba-model-studio');
  assert.equal(alibaba.status, 'REGIONAL');
  assert.match(alibaba.runtime, /inactive and not exposed/);
});

test('retired DeepSeek alias has one applied migration and no invented fallback', () => {
  const legacy = audit.models.find(({ provider }) => provider === 'deepseek');
  assert.equal(legacy.status, 'RENAMED');
  assert.equal(legacy.deprecated, true);
  assert.equal(legacy.officialModelId, 'deepseek-flash');
  assert.equal(audit.postRollout.currentModelId, 'deepseek-flash');
  assert.equal(audit.postRollout.legacyAliasVisible, false);
  assert.match(deepSeekMigration, /set model_id = 'deepseek-flash'/);
  assert.match(deepSeekMigration, /and model_id = 'deepseek-v4-flash'/);
  assert.match(deepSeekMigration, /affected_rows <> 1/);
});
