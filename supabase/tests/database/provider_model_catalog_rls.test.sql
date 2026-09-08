begin;

select plan(20);

select has_table('public', 'ai_models', 'ai_models exists');
select col_is_pk('public', 'ai_models', 'id', 'ai_models has a primary key');
select fk_ok('public', 'ai_models', 'provider_id', 'public', 'api_providers', 'id', 'models belong to providers');
select policies_are('public', 'ai_models', array['public can read active ai models'], 'models have one public read policy');
select results_eq(
  $$select relrowsecurity and relforcerowsecurity from pg_class where oid='public.ai_models'::regclass$$,
  array[true],
  'models keep enabled and forced RLS'
);
select table_privs_are('public', 'ai_models', 'anon', array['SELECT'], 'anonymous model grants are read-only');
select table_privs_are('public', 'ai_models', 'authenticated', array['SELECT'], 'authenticated model grants are read-only');

insert into public.ai_models (provider_id, model_id, display_name, is_active, is_public, is_deprecated)
select id, 'catalog-hidden-test', 'Hidden catalog fixture', false, false, true
from public.api_providers where slug='openrouter';

set local role anon;

select results_eq($$select count(*) from public.api_providers$$, array[9::bigint], 'anonymous users see only nine active providers');
select results_eq($$select count(*) from public.ai_models where model_id='openrouter/free'$$, array[1::bigint], 'anonymous users can read an active public model');
select results_eq($$select count(*) from public.ai_models where model_id='catalog-hidden-test'$$, array[0::bigint], 'inactive deprecated model is hidden');
select results_eq($$select count(*) from public.ai_models where model_id='qwen3.7-plus'$$, array[0::bigint], 'models belonging to an inactive provider are hidden');
select throws_ok($$insert into public.ai_models (provider_id,model_id,display_name) values (gen_random_uuid(),'public-write','Public write')$$, '42501', null, 'anonymous users cannot insert models');
select throws_ok($$update public.ai_models set display_name='Changed'$$, '42501', null, 'anonymous users cannot update models');
select throws_ok($$delete from public.ai_models$$, '42501', null, 'anonymous users cannot delete models');
select throws_ok($$update public.api_providers set short_description='Changed'$$, '42501', null, 'anonymous users cannot edit enriched providers');

set local role authenticated;
set local request.jwt.claim.sub = '99999999-9999-4999-8999-999999999999';

select results_eq($$select count(*) from public.api_providers where slug='alibaba-model-studio'$$, array[0::bigint], 'authenticated user without a credential cannot read inactive provider');
select throws_ok($$insert into public.ai_models (provider_id,model_id,display_name) values (gen_random_uuid(),'auth-write','Auth write')$$, '42501', null, 'authenticated users cannot insert models');
select throws_ok($$update public.api_providers set long_description='Changed'$$, '42501', null, 'authenticated users cannot edit enriched providers');

reset role;

select results_eq($$select count(*) from public.ai_models where last_verified_at='2026-09-08'$$, array[12::bigint], 'twelve curated models have verification dates');
select results_eq($$select count(*) from public.user_api_credentials$$, array[0::bigint], 'catalog tests leave the credential vault untouched');

select * from finish();
rollback;
