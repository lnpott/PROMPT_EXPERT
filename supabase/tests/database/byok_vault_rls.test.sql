begin;

select plan(38);

select has_table('public', 'api_providers', 'api_providers exists');
select has_table('public', 'user_api_credentials', 'user_api_credentials exists');
select col_is_pk('public', 'api_providers', 'id', 'api_providers has a UUID primary key');
select col_is_pk('public', 'user_api_credentials', 'id', 'user_api_credentials has a UUID primary key');
select policies_are(
  'public',
  'api_providers',
  array['public can read active api providers'],
  'api_providers exposes only its active-row SELECT policy'
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
  'credential policies are separated by operation'
);

insert into auth.users (id, email)
values
  ('11111111-1111-4111-8111-111111111111', 'vault-user-a@example.test'),
  ('22222222-2222-4222-8222-222222222222', 'vault-user-b@example.test');

insert into public.api_providers (
  slug,
  display_name,
  category,
  docs_url,
  auth_scheme,
  supports_generation,
  is_active,
  sort_order
)
values (
  'inactive-test-provider',
  'Inactive test provider',
  'direct',
  'https://example.test/docs',
  'bearer',
  false,
  false,
  999
);

set local role anon;

select results_eq(
  $$select count(*) from public.api_providers where slug = 'openrouter'$$,
  array[1::bigint],
  'anonymous users can read an active provider'
);
select results_eq(
  $$select count(*) from public.api_providers where slug = 'inactive-test-provider'$$,
  array[0::bigint],
  'anonymous users cannot read an inactive provider'
);
select throws_ok(
  $$update public.api_providers set display_name = 'Changed' where slug = 'openrouter'$$,
  '42501',
  null,
  'anonymous users cannot update the provider catalog'
);
select throws_ok(
  $$insert into public.api_providers (slug, display_name, category, auth_scheme) values ('anon-provider', 'Anonymous provider', 'direct', 'bearer')$$,
  '42501',
  null,
  'anonymous users cannot insert into the provider catalog'
);
select throws_ok(
  $$delete from public.api_providers where slug = 'openrouter'$$,
  '42501',
  null,
  'anonymous users cannot delete from the provider catalog'
);
select throws_ok(
  $$select * from public.user_api_credentials$$,
  '42501',
  null,
  'anonymous users cannot read credentials'
);
select throws_ok(
  $$insert into public.user_api_credentials (user_id, provider_id) select '11111111-1111-4111-8111-111111111111', id from public.api_providers where slug = 'openrouter'$$,
  '42501',
  null,
  'anonymous users cannot insert credentials'
);
select throws_ok(
  $$update public.user_api_credentials set label = 'Changed'$$,
  '42501',
  null,
  'anonymous users cannot update credentials'
);
select throws_ok(
  $$delete from public.user_api_credentials$$,
  '42501',
  null,
  'anonymous users cannot delete credentials'
);

set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';

select lives_ok(
  $$insert into public.user_api_credentials (user_id, provider_id, label) select '11111111-1111-4111-8111-111111111111', id, 'User A metadata only' from public.api_providers where slug = 'openrouter'$$,
  'user A can insert an owned credential row'
);
select results_eq(
  $$select count(*) from public.user_api_credentials$$,
  array[1::bigint],
  'user A can read the owned credential row'
);
select results_eq(
  $$update public.user_api_credentials set label = 'User A updated' returning label$$,
  array['User A updated'::text],
  'user A can update the owned credential row'
);
select throws_ok(
  $$update public.user_api_credentials set user_id = '22222222-2222-4222-8222-222222222222'$$,
  '42501',
  null,
  'user A cannot transfer ownership through user_id'
);
select throws_ok(
  $$update public.user_api_credentials set provider_id = (select id from public.api_providers where slug = 'google-gemini')$$,
  '42501',
  null,
  'user A cannot change provider_id'
);
select throws_ok(
  $$insert into public.user_api_credentials (user_id, provider_id) select '22222222-2222-4222-8222-222222222222', id from public.api_providers where slug = 'google-gemini'$$,
  '42501',
  null,
  'user A cannot insert a credential for user B'
);
select throws_ok(
  $$update public.api_providers set display_name = 'Changed' where slug = 'openrouter'$$,
  '42501',
  null,
  'authenticated users cannot update the provider catalog'
);
select throws_ok(
  $$insert into public.api_providers (slug, display_name, category, auth_scheme) values ('user-provider', 'User provider', 'direct', 'bearer')$$,
  '42501',
  null,
  'authenticated users cannot insert into the provider catalog'
);
select throws_ok(
  $$delete from public.api_providers where slug = 'openrouter'$$,
  '42501',
  null,
  'authenticated users cannot delete from the provider catalog'
);
select results_eq(
  $$select count(*) from public.api_providers where slug = 'inactive-test-provider'$$,
  array[0::bigint],
  'authenticated users cannot read an inactive provider'
);
select results_eq(
  $$select count(*) from public.user_api_credentials where id = '33333333-3333-4333-8333-333333333333'$$,
  array[0::bigint],
  'user A gets no row for a nonexistent credential id'
);
select is_empty(
  $$update public.user_api_credentials set label = 'Missing' where id = '33333333-3333-4333-8333-333333333333' returning id$$,
  'user A cannot update a nonexistent credential id'
);
select is_empty(
  $$delete from public.user_api_credentials where id = '33333333-3333-4333-8333-333333333333' returning id$$,
  'user A cannot delete a nonexistent credential id'
);

set local request.jwt.claim.sub = '22222222-2222-4222-8222-222222222222';

select results_eq(
  $$select count(*) from public.user_api_credentials$$,
  array[0::bigint],
  'user B cannot read user A credentials'
);
select results_eq(
  $$select count(*) from public.user_api_credentials where id = '33333333-3333-4333-8333-333333333333'$$,
  array[0::bigint],
  'user B gets no row for a nonexistent credential id'
);
select is_empty(
  $$update public.user_api_credentials set label = 'User B changed it' returning id$$,
  'user B cannot update user A credentials'
);
select is_empty(
  $$delete from public.user_api_credentials returning id$$,
  'user B cannot delete user A credentials'
);

set local request.jwt.claim.sub = '11111111-1111-4111-8111-111111111111';

select results_eq(
  $$delete from public.user_api_credentials returning label$$,
  array['User A updated'::text],
  'user A can delete the owned credential row'
);
select results_eq(
  $$select count(*) from public.user_api_credentials$$,
  array[0::bigint],
  'user A credential is absent after deletion'
);

reset role;

select lives_ok(
  $$insert into public.user_api_credentials (user_id, provider_id, label) select '22222222-2222-4222-8222-222222222222', id, 'Cascade metadata only' from public.api_providers where slug = 'openrouter'$$,
  'cascade fixture can be created without plaintext'
);
select lives_ok(
  $$delete from auth.users where id = '22222222-2222-4222-8222-222222222222'$$,
  'deleting user B cascades to the dependent credential'
);
select results_eq(
  $$select count(*) from public.user_api_credentials where user_id = '22222222-2222-4222-8222-222222222222'$$,
  array[0::bigint],
  'ON DELETE CASCADE removes user B credentials'
);
select lives_ok(
  $$delete from auth.users where id = '11111111-1111-4111-8111-111111111111'$$,
  'user deletion succeeds with ON DELETE CASCADE'
);

select * from finish();
rollback;
