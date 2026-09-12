do $$
declare
  deepseek_provider_id uuid;
  affected_rows integer;
begin
  select id into deepseek_provider_id
  from public.api_providers
  where slug = 'deepseek'
    and is_active = true;

  if deepseek_provider_id is null then
    raise exception 'Precondition failed: active DeepSeek provider not found';
  end if;

  if exists (
    select 1 from public.ai_models
    where provider_id = deepseek_provider_id
      and model_id = 'deepseek-flash'
  ) then
    raise exception 'Precondition failed: deepseek-flash already exists';
  end if;

  if not exists (
    select 1 from public.ai_models
    where provider_id = deepseek_provider_id
      and model_id = 'deepseek-v4-flash'
      and is_active = true
      and is_public = true
      and is_deprecated = false
  ) then
    raise exception 'Precondition failed: expected public DeepSeek legacy model not found';
  end if;

  update public.ai_models
  set model_id = 'deepseek-flash',
      display_name = 'DeepSeek Flash',
      family = 'DeepSeek V4.1',
      description = 'Alias estável atual para o modelo Flash da DeepSeek.',
      official_url = 'https://api-docs.deepseek.com/api/create-chat-completion/',
      pricing_source_url = 'https://api-docs.deepseek.com/quick_start/pricing/',
      last_verified_at = '2026-09-12',
      is_deprecated = false
  where provider_id = (select id from public.api_providers where slug = 'deepseek')
    and model_id = 'deepseek-v4-flash';

  get diagnostics affected_rows = row_count;
  if affected_rows <> 1 then
    raise exception 'Precondition failed: expected one DeepSeek model, updated %', affected_rows;
  end if;
end
$$;

-- Rollback (new reviewed migration; do not edit this applied migration):
-- update public.ai_models
-- set model_id='deepseek-v4-flash', display_name='DeepSeek V4 Flash',
--     family='DeepSeek V4',
--     description='Modelo geral com thinking/non-thinking, tool calls, JSON e FIM.',
--     official_url='https://api-docs.deepseek.com/quick_start/pricing/',
--     pricing_source_url='https://api-docs.deepseek.com/quick_start/pricing/',
--     last_verified_at='2026-09-08', is_deprecated=false
-- where model_id='deepseek-flash'
--   and provider_id=(select id from public.api_providers where slug='deepseek');
