begin;

select plan(8);

insert into auth.users (id, email) values
  ('71111111-1111-4111-8111-111111111111', 'recovery-a@example.test'),
  ('72222222-2222-4222-8222-222222222222', 'recovery-b@example.test');

set local role authenticated;
set local request.jwt.claim.sub = '71111111-1111-4111-8111-111111111111';

insert into public.user_api_credentials
  (user_id, provider_id, ciphertext, iv, auth_tag, key_version, secret_last4)
select '71111111-1111-4111-8111-111111111111', id,
  'ZmljdGlvbmFs', 'AAAAAAAAAAAAAAAA', 'AAAAAAAAAAAAAAAAAAAAAA==', 1, 'TEST'
from public.api_providers where slug in ('openrouter', 'google-gemini');

select results_eq($$select count(*) from public.user_api_credentials$$, array[2::bigint], 'user A owns two visible credentials');

set local request.jwt.claim.sub = '72222222-2222-4222-8222-222222222222';
insert into public.user_api_credentials
  (user_id, provider_id, ciphertext, iv, auth_tag, key_version, secret_last4)
select '72222222-2222-4222-8222-222222222222', id,
  'ZmljdGlvbmFs', 'AAAAAAAAAAAAAAAA', 'AAAAAAAAAAAAAAAAAAAAAA==', 1, 'TEST'
from public.api_providers where slug = 'openrouter';

select results_eq($$select count(*) from public.user_api_credentials$$, array[1::bigint], 'user B sees only its own credential');

set local request.jwt.claim.sub = '71111111-1111-4111-8111-111111111111';
select results_eq($$delete from public.user_api_credentials returning user_id$$,
  array['71111111-1111-4111-8111-111111111111'::uuid, '71111111-1111-4111-8111-111111111111'::uuid],
  'purge as A deletes every credential visible to A');
select results_eq($$select count(*) from public.user_api_credentials$$, array[0::bigint], 'A vault is empty after purge');
select results_eq($$delete from public.user_api_credentials returning user_id$$, array[]::uuid[], 'second purge is idempotent');

set local request.jwt.claim.sub = '72222222-2222-4222-8222-222222222222';
select results_eq($$select count(*) from public.user_api_credentials$$, array[1::bigint], 'B credential remains after A purge');

reset role;
select results_eq($$select count(*) from public.user_api_credentials where user_id='71111111-1111-4111-8111-111111111111'$$, array[0::bigint], 'database confirms A has no credentials');
select results_eq($$select count(*) from public.user_api_credentials where user_id='72222222-2222-4222-8222-222222222222'$$, array[1::bigint], 'database confirms B remains intact');

select * from finish();
rollback;
