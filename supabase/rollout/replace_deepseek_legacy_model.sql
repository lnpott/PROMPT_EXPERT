-- MANUAL ROLLOUT PROPOSAL. Do not execute without explicit authorization.
-- DeepSeek documents deepseek-v4-flash as a retired legacy alias served by
-- DeepSeek-V4.1-Flash and directs API clients to use deepseek-flash.
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

-- Precondition: the provider must not already contain model_id=deepseek-flash.
-- Rollback (restores catalog identity only; it does not unretire the model):
-- update public.ai_models set model_id='deepseek-v4-flash',
--   display_name='DeepSeek V4 Flash', family='DeepSeek V4',
--   is_deprecated=false where model_id='deepseek-flash'
--   and provider_id=(select id from public.api_providers where slug='deepseek');
