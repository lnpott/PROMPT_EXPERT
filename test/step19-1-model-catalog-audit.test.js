import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { publicCompilerModels } from '../api/compiler-models.js';
import { REGISTERED_GENERATION_PROVIDER_SLUGS } from '../server/providers/generation-registry.js';

const audit = JSON.parse(readFileSync(new URL('../docs/model-catalog-audit-2026-09-12.json', import.meta.url), 'utf8'));
const catalogMigration = readFileSync(new URL('../supabase/migrations/20260908230000_enrich_provider_model_catalog.sql', import.meta.url), 'utf8');
const deepSeekRollout = readFileSync(new URL('../supabase/rollout/replace_deepseek_legacy_model.sql', import.meta.url), 'utf8');

const seededIds = [...catalogMigration.matchAll(/where slug='[^']+'\), '([^']+)'/g)].map((match) => match[1]);
const runtimeIds = new Set([...seededIds, ...publicCompilerModels().map(({ slug }) => slug)]);

test('every versioned or Gemini-runtime model ID has a dated official audit record', () => {
  const auditedIds = new Set(audit.models.map(({ modelId }) => modelId));
  assert.deepEqual([...runtimeIds].sort(), [...auditedIds].sort());
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

test('retired DeepSeek alias has one explicit, gated replacement and no invented fallback', () => {
  const legacy = audit.models.find(({ provider }) => provider === 'deepseek');
  assert.equal(legacy.status, 'RENAMED');
  assert.equal(legacy.deprecated, true);
  assert.equal(legacy.officialModelId, 'deepseek-flash');
  assert.match(deepSeekRollout, /model_id = 'deepseek-flash'/);
  assert.match(deepSeekRollout, /model_id = 'deepseek-v4-flash'/);
  assert.match(deepSeekRollout, /Do not execute without explicit authorization/);
});
