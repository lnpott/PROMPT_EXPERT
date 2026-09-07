import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const migration = readFileSync(
  new URL('../supabase/migrations/20260907195224_create_byok_vault_schema.sql', import.meta.url),
  'utf8',
);
const rlsTest = readFileSync(
  new URL('../supabase/tests/database/byok_vault_rls.test.sql', import.meta.url),
  'utf8',
);

test('BYOK migration creates the provider catalog and private credential schema', () => {
  assert.match(migration, /create table public\.api_providers/);
  assert.match(migration, /create table public\.user_api_credentials/);
  assert.match(migration, /category in \('direct', 'gateway'\)/);
  assert.match(migration, /references auth\.users\(id\) on delete cascade/);
  assert.match(migration, /references public\.api_providers\(id\) on delete restrict/);
  assert.match(migration, /unique \(user_id, provider_id\)/);
  assert.match(migration, /user_api_credentials_provider_id_idx/);
});

test('cryptographic columns remain nullable and unusable until Step 14', () => {
  for (const column of ['ciphertext text,', 'iv text,', 'auth_tag text,', 'key_version integer,']) {
    assert.match(migration, new RegExp(column));
  }
  assert.match(migration, /user_api_credentials_step_13_no_secret_check/);
  assert.match(migration, /ciphertext is null[\s\S]*secret_last4 is null[\s\S]*validation_status = 'untested'/);
  assert.doesNotMatch(migration, /AES-256-GCM|HKDF|MASTER_KEY|encrypt|decrypt/i);
});

test('RLS and grants enforce public catalog reads and credential ownership', () => {
  assert.equal((migration.match(/enable row level security/g) || []).length, 2);
  assert.equal((migration.match(/force row level security/g) || []).length, 2);
  assert.match(migration, /grant select on table public\.api_providers to anon, authenticated/);
  assert.doesNotMatch(migration, /grant (insert|update|delete)[^;]*api_providers[^;]*to (anon|authenticated)/i);
  assert.match(migration, /grant select, delete on table public\.user_api_credentials to authenticated/);
  assert.doesNotMatch(migration, /grant[^;]*user_api_credentials[^;]*to anon/i);

  const operationPolicies = [
    /for select to authenticated\s+using \(\(select auth\.uid\(\)\) = user_id\)/,
    /for insert to authenticated\s+with check \(\(select auth\.uid\(\)\) = user_id\)/,
    /for update to authenticated\s+using \(\(select auth\.uid\(\)\) = user_id\)\s+with check \(\(select auth\.uid\(\)\) = user_id\)/,
    /for delete to authenticated\s+using \(\(select auth\.uid\(\)\) = user_id\)/,
  ];
  for (const policy of operationPolicies) assert.match(migration, policy);
  assert.doesNotMatch(migration, /for all|using \(true\)/i);
});

test('column grants prevent authenticated users from changing credential identity', () => {
  const insertGrant = migration.match(/grant insert \(([\s\S]*?)\) on public\.user_api_credentials to authenticated;/)?.[1] || '';
  const updateGrant = migration.match(/grant update \(([\s\S]*?)\) on public\.user_api_credentials to authenticated;/)?.[1] || '';
  assert.ok(insertGrant);
  assert.ok(updateGrant);
  assert.doesNotMatch(`${insertGrant}\n${updateGrant}`, /\bciphertext\b|\biv\b|\bauth_tag\b|\bkey_version\b|\bsecret_last4\b|\bvalidation_status\b|\blast_validated_at\b/);
  assert.doesNotMatch(insertGrant, /\bid\b/);
  assert.doesNotMatch(updateGrant, /\buser_id\b/);
  assert.doesNotMatch(updateGrant, /\bprovider_id\b/);
  assert.doesNotMatch(updateGrant, /\bid\b/);
  assert.doesNotMatch(updateGrant, /\bcreated_at\b/);
});

test('initial catalog contains ten providers and keeps regional Alibaba routing inactive', () => {
  const expectedSlugs = [
    'openrouter',
    'google-gemini',
    'xai',
    'openai',
    'anthropic',
    'deepseek',
    'mistral',
    'groqcloud',
    'alibaba-model-studio',
    'kimi',
  ];
  for (const slug of expectedSlugs) assert.match(migration, new RegExp(`'${slug}'`));
  const alibabaSeed = migration.match(/\(\s*'alibaba-model-studio',[\s\S]*?\n  \),/)?.[0] || '';
  assert.match(alibabaSeed, /null,\s*'bearer',[\s\S]*false,\s*90/);
  assert.match(migration, /base_url text check \(base_url is null or base_url ~ '\^https:\/\//);
});

test('SQL isolation suite covers users A and B, anonymous CRUD, catalog visibility and cascade', () => {
  assert.match(rlsTest, /set local role anon/);
  assert.match(rlsTest, /set local role authenticated/);
  assert.match(rlsTest, /11111111-1111-4111-8111-111111111111/);
  assert.match(rlsTest, /22222222-2222-4222-8222-222222222222/);
  assert.match(rlsTest, /anonymous users cannot (read|insert|update|delete) credentials/g);
  assert.match(rlsTest, /user B cannot read user A credentials/);
  assert.match(rlsTest, /user B cannot update user A credentials/);
  assert.match(rlsTest, /user B cannot delete user A credentials/);
  assert.match(rlsTest, /anonymous users cannot read an inactive provider/);
  assert.match(rlsTest, /authenticated users cannot read an inactive provider/);
  assert.match(rlsTest, /cannot (insert into|update|delete from) the provider catalog/g);
  assert.match(rlsTest, /nonexistent credential id/g);
  assert.match(rlsTest, /ON DELETE CASCADE/);
});
