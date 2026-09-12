import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { directProvider } from '../server/providers/direct-providers.js';
import { resolveGenerationRoute } from '../server/providers/generation-registry.js';

const migration = readFileSync(new URL('../supabase/migrations/20260912010000_replace_deepseek_legacy_model.sql', import.meta.url), 'utf8');
const audit = JSON.parse(readFileSync(new URL('../docs/model-catalog-audit-2026-09-12.json', import.meta.url), 'utf8'));
const generation = readFileSync(new URL('../api/generate.js', import.meta.url), 'utf8');

test('DeepSeek migration is conflict-safe, provider-bound and updates exactly one public model', () => {
  assert.match(migration, /slug = 'deepseek'/);
  assert.match(migration, /model_id = 'deepseek-flash'/);
  assert.match(migration, /model_id = 'deepseek-v4-flash'/);
  assert.match(migration, /is_active = true/);
  assert.match(migration, /is_public = true/);
  assert.match(migration, /is_deprecated = false/);
  assert.match(migration, /deepseek-flash already exists/);
  assert.match(migration, /affected_rows <> 1/);
  assert.doesNotMatch(migration, /update public\.api_providers|alibaba|qwen|user_api_credentials|auth\.|service_role/i);
});

test('post-rollout audit records only the official DeepSeek replacement', () => {
  assert.deepEqual(audit.postRollout, {
    appliedOn: '2026-09-12',
    migration: '20260912010000_replace_deepseek_legacy_model.sql',
    provider: 'deepseek',
    previousModelId: 'deepseek-v4-flash',
    currentModelId: 'deepseek-flash',
    remoteApplied: true,
    legacyAliasVisible: false,
  });
});

test('existing DeepSeek adapter accepts the canonical BYOK route without a runtime legacy alias', () => {
  assert.deepEqual(resolveGenerationRoute('deepseek', 'byok'), {
    providerSlug: 'deepseek', credentialSource: 'byok', adapter: 'openai-compatible', legacyAlias: false,
  });
  assert.equal(directProvider('deepseek').baseUrl, 'https://api.deepseek.com');
  assert.equal(directProvider('deepseek').chatPath, '/chat/completions');
  assert.doesNotMatch(generation, /deepseek-v4-flash/);
});
