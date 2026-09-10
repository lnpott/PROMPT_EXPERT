-- LOCAL ONLY until explicitly authorized for remote application.
update public.api_providers
set is_active = true,
    base_url = 'https://dashscope-us.aliyuncs.com/compatible-mode/v1',
    api_key_url = 'https://www.alibabacloud.com/help/model-studio/get-api-key',
    docs_url = 'https://www.alibabacloud.com/help/en/model-studio/compatibility-of-openai-with-dashscope',
    region_notes = 'Fixed US (Virginia) international endpoint; users in Brazil should review latency and data residency requirements.',
    last_verified_at = '2026-09-10',
    source_url = 'https://www.alibabacloud.com/help/en/model-studio/compatibility-of-openai-with-dashscope'
where slug = 'alibaba-model-studio';

update public.ai_models
set last_verified_at = '2026-09-10',
    official_url = 'https://www.alibabacloud.com/help/en/model-studio/models'
where provider_id = (select id from public.api_providers where slug = 'alibaba-model-studio')
  and model_id = 'qwen3.7-plus';

-- Rollback:
-- update public.api_providers set is_active=false, base_url=null where slug='alibaba-model-studio';
