import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const migration = readFileSync(new URL('../supabase/migrations/20260908230000_enrich_provider_model_catalog.sql', import.meta.url), 'utf8');
const policyMigration = readFileSync(new URL('../supabase/migrations/20260908233000_scope_models_to_active_providers.sql', import.meta.url), 'utf8');
const sqlTest = readFileSync(new URL('../supabase/tests/database/provider_model_catalog_rls.test.sql', import.meta.url), 'utf8');

test('catalog migration separates provider presentation from canonical models', () => {
  assert.match(migration, /alter table public\.api_providers/);
  assert.match(migration, /create table public\.ai_models/);
  assert.match(migration, /provider_id uuid not null references public\.api_providers\(id\) on delete cascade/);
  assert.match(migration, /unique \(provider_id, model_id\)/);
  assert.doesNotMatch(migration, /alter table public\.user_api_credentials|USER_CREDENTIALS_MASTER_KEY|ciphertext|auth_tag/);
});

test('provider and model fields are structured and optional where facts may be unknown', () => {
  for (const field of ['short_description', 'long_description', 'company_name', 'country_region', 'logo_url', 'media_url', 'free_tier_status', 'billing_notes', 'openai_compatible', 'last_verified_at']) assert.match(migration, new RegExp(`add column ${field}`));
  for (const field of ['model_id', 'family', 'input_modalities', 'output_modalities', 'reasoning_support', 'coding_suitability', 'tool_calling', 'context_window_tokens', 'max_output_tokens', 'input_price', 'output_price', 'cached_input_price', 'currency', 'pricing_unit', 'is_deprecated', 'official_url']) assert.match(migration, new RegExp(`\\b${field}\\b`));
  assert.doesNotMatch(migration, /metadata json|jsonb/i);
});

test('catalog remains read-only and active-only for public roles', () => {
  assert.match(migration, /enable row level security[\s\S]*force row level security/);
  assert.match(migration, /revoke all on table public\.ai_models from public, anon, authenticated/);
  assert.match(migration, /grant select on table public\.ai_models to anon, authenticated/);
  assert.match(migration, /is_active = true and is_public = true and is_deprecated = false/);
  assert.match(policyMigration, /api_providers\.is_active = true/);
  assert.doesNotMatch(migration, /grant (insert|update|delete|all)[^;]*ai_models[^;]*to (anon|authenticated)/i);
});

test('curated seed covers ten providers and twelve relevant models with official sources', () => {
  for (const slug of ['openrouter','google-gemini','xai','openai','anthropic','deepseek','mistral','groqcloud','alibaba-model-studio','kimi']) assert.match(migration, new RegExp(`slug ?= ?'${slug}'`));
  assert.equal((migration.match(/\(\(select id from public\.api_providers where slug=/g) || []).length, 12);
  assert.equal((migration.match(/'2026-09-08'/g) || []).length >= 22, true);
  assert.match(migration, /https:\/\/ai\.google\.dev\/gemini-api\/docs\/pricing/);
  assert.match(migration, /https:\/\/developers\.openai\.com\/api\/docs\/pricing/);
  assert.match(migration, /https:\/\/docs\.anthropic\.com\/en\/docs\/about-claude\/pricing/);
});

test('pgTAP suite covers visibility, write denial and untouched credentials', () => {
  assert.match(sqlTest, /select plan\(20\)/);
  assert.match(sqlTest, /inactive deprecated model is hidden/);
  assert.match(sqlTest, /models belonging to an inactive provider are hidden/);
  assert.match(sqlTest, /anonymous users cannot (insert|update|delete) models/g);
  assert.match(sqlTest, /credential vault untouched/);
});
