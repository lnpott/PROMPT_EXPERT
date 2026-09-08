begin;

select plan(16);

select results_eq(
  $$select count(*) from pg_constraint where conrelid = 'public.user_api_credentials'::regclass and conname = 'user_api_credentials_crypto_material_check' and contype = 'c'$$,
  array[1::bigint],
  'definitive cryptographic material constraint exists'
);
select results_eq(
  $$select count(*) from pg_constraint where conname = 'user_api_credentials_step_13_no_secret_check'$$,
  array[0::bigint],
  'temporary Step 13 constraint was removed'
);
select results_eq(
  $$select relrowsecurity and relforcerowsecurity from pg_class where oid = 'public.user_api_credentials'::regclass$$,
  array[true],
  'credential vault keeps enabled and forced RLS'
);
select policies_are(
  'public',
  'user_api_credentials',
  array[
    'users can delete own api credentials',
    'users can insert own api credentials',
    'users can read own api credentials',
    'users can update own api credentials'
  ],
  'credential ownership policies remain unchanged'
);
select policies_are(
  'public',
  'api_providers',
  array['public can read active api providers'],
  'public can read active api providers'
);
select results_eq(
  $$select count(*) from information_schema.columns where table_schema = 'public' and table_name = 'user_api_credentials' and column_name in ('plaintext', 'api_key', 'secret')$$,
  array[0::bigint],
  'vault has no plaintext column'
);

insert into auth.users (id, email)
values
  ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'step14-user-a@example.test'),
  ('bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb', 'step14-user-b@example.test');

set local role authenticated;
set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select lives_ok(
  $$insert into public.user_api_credentials (id, user_id, provider_id, label, ciphertext, iv, auth_tag, key_version, secret_last4) select 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', id, 'Encrypted fixture', 'ZmljdGlvbmFsLXNlY3JldA==', 'MDEyMzQ1Njc4OWFi', 'MDEyMzQ1Njc4OWFiY2RlZg==', 1, 'ture' from public.api_providers where slug = 'openrouter'$$,
  'structurally valid encrypted material is accepted for user A'
);
select results_eq(
  $$select count(*) from public.user_api_credentials$$,
  array[1::bigint],
  'user A can read the encrypted credential'
);
select throws_ok(
  $$insert into public.user_api_credentials (id, user_id, provider_id, ciphertext, iv, key_version) select 'dddddddd-dddd-4ddd-8ddd-dddddddddddd', 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', id, 'ZmljdGlvbmFs', 'MDEyMzQ1Njc4OWFi', 1 from public.api_providers where slug = 'google-gemini'$$,
  '23514',
  null,
  'structurally incomplete cryptographic material is rejected'
);
select throws_ok(
  $$update public.user_api_credentials set iv = 'dG9vLXNob3J0'$$,
  '23514',
  null,
  'invalid IV length is rejected'
);
select throws_ok(
  $$update public.user_api_credentials set auth_tag = 'bm90LTE2LWJ5dGVz'$$,
  '23514',
  null,
  'invalid authentication tag length is rejected'
);

set local request.jwt.claim.sub = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';

select results_eq(
  $$select count(*) from public.user_api_credentials$$,
  array[0::bigint],
  'user B cannot read user A encrypted credential'
);
select is_empty(
  $$update public.user_api_credentials set label = 'Blocked' returning id$$,
  'user B cannot update user A encrypted credential'
);

set local role anon;

select throws_ok(
  $$select * from public.user_api_credentials$$,
  '42501',
  null,
  'anonymous users cannot read encrypted credentials'
);
select results_eq(
  $$select count(*) from public.api_providers where slug = 'openrouter'$$,
  array[1::bigint],
  'anonymous catalog access remains limited to active providers'
);

reset role;

select lives_ok(
  $$delete from auth.users where id in ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb')$$,
  'test users and dependent encrypted fixture can be removed'
);

select * from finish();
rollback;
