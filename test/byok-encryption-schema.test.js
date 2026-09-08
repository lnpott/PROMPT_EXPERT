import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const step13 = readFileSync(
  new URL('../supabase/migrations/20260907195224_create_byok_vault_schema.sql', import.meta.url),
  'utf8',
);
const migration = readFileSync(
  new URL('../supabase/migrations/20260908120000_enable_byok_encrypted_credentials.sql', import.meta.url),
  'utf8',
);
const rlsTest = readFileSync(
  new URL('../supabase/tests/database/byok_encryption_rls.test.sql', import.meta.url),
  'utf8',
);

test('Step 14 evolves rather than rewriting the applied Step 13 migration', () => {
  assert.match(step13, /user_api_credentials_step_13_no_secret_check/);
  assert.match(migration, /drop constraint user_api_credentials_step_13_no_secret_check/);
  assert.match(migration, /add constraint user_api_credentials_crypto_material_check/);
  assert.doesNotMatch(migration, /create table|drop table|alter policy|create policy|disable row level security/i);
});

test('definitive constraint accepts only complete, bounded Base64 material', () => {
  assert.match(migration, /ciphertext is not null[\s\S]*iv is not null[\s\S]*auth_tag is not null/);
  assert.match(migration, /length\(decode\(ciphertext, 'base64'\)\) between 1 and 16384/);
  assert.ok(migration.includes("iv ~ '^[A-Za-z0-9+/]{16}$'"));
  assert.ok(migration.includes("auth_tag ~ '^[A-Za-z0-9+/]{22}==$'"));
  assert.match(migration, /key_version between 1 and 2147483647/);
  assert.match(migration, /validation_status = 'untested' and last_validated_at is null/);
  assert.match(migration, /validation_status in \('valid', 'invalid', 'error'\) and last_validated_at is not null/);
  assert.doesNotMatch(migration, /plaintext|api_key text|secret text/i);
});

test('new grants are restricted to cryptographic persistence columns', () => {
  assert.match(migration, /grant insert \([\s\S]*?id,[\s\S]*?ciphertext,[\s\S]*?last_validated_at[\s\S]*?\) on public\.user_api_credentials to authenticated/);
  assert.match(migration, /grant update \([\s\S]*?ciphertext,[\s\S]*?last_validated_at[\s\S]*?\) on public\.user_api_credentials to authenticated/);
  assert.doesNotMatch(migration, /to anon|grant all|user_id|provider_id|created_at/i);
});

test('Step 14 SQL suite preserves the original isolation contract', () => {
  assert.match(rlsTest, /set local role anon/);
  assert.match(rlsTest, /set local role authenticated/);
  assert.match(rlsTest, /user B cannot read user A encrypted credential/);
  assert.match(rlsTest, /anonymous users cannot read encrypted credentials/);
  assert.match(rlsTest, /structurally incomplete cryptographic material is rejected/);
  assert.match(rlsTest, /public can read active api providers/);
  assert.match(rlsTest, /select plan\(16\)/);
});
