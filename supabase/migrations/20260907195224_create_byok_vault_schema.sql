create table public.api_providers (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  display_name text not null check (char_length(btrim(display_name)) between 1 and 100),
  category text not null check (category in ('direct', 'gateway')),
  signup_url text check (signup_url is null or signup_url ~ '^https://[^[:space:]]+$'),
  api_key_url text check (api_key_url is null or api_key_url ~ '^https://[^[:space:]]+$'),
  docs_url text check (docs_url is null or docs_url ~ '^https://[^[:space:]]+$'),
  base_url text check (base_url is null or base_url ~ '^https://[^[:space:]?#]+$'),
  auth_scheme text not null check (auth_scheme in ('bearer', 'x-api-key', 'x-goog-api-key')),
  key_prefix_hint text check (key_prefix_hint is null or char_length(key_prefix_hint) between 2 and 24),
  supports_generation boolean not null default false,
  supports_model_listing boolean not null default false,
  is_active boolean not null default true,
  sort_order smallint not null default 100 check (sort_order between 1 and 999),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_api_credentials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider_id uuid not null references public.api_providers(id) on delete restrict,
  label text check (label is null or char_length(btrim(label)) between 1 and 100),
  ciphertext text,
  iv text,
  auth_tag text,
  key_version integer,
  secret_last4 text check (secret_last4 is null or char_length(secret_last4) = 4),
  validation_status text not null default 'untested'
    check (validation_status in ('untested', 'valid', 'invalid', 'error')),
  last_validated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider_id),
  constraint user_api_credentials_step_13_no_secret_check check (
    ciphertext is null
    and iv is null
    and auth_tag is null
    and key_version is null
    and secret_last4 is null
    and validation_status = 'untested'
    and last_validated_at is null
  )
);

-- The unique constraint leads with user_id for RLS and user deletion. This
-- separate index keeps provider deletion and joins from scanning the vault.
create index user_api_credentials_provider_id_idx
on public.user_api_credentials (provider_id);

alter table public.api_providers enable row level security;
alter table public.api_providers force row level security;
alter table public.user_api_credentials enable row level security;
alter table public.user_api_credentials force row level security;

revoke all on table public.api_providers, public.user_api_credentials from public, anon, authenticated;

grant select on table public.api_providers to anon, authenticated;

grant select, delete on table public.user_api_credentials to authenticated;
grant insert (
  user_id,
  provider_id,
  label
) on public.user_api_credentials to authenticated;
grant update (
  label,
  updated_at
) on public.user_api_credentials to authenticated;

create policy "public can read active api providers"
on public.api_providers for select to anon, authenticated
using (is_active = true);

create policy "users can read own api credentials"
on public.user_api_credentials for select to authenticated
using ((select auth.uid()) = user_id);

create policy "users can insert own api credentials"
on public.user_api_credentials for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "users can update own api credentials"
on public.user_api_credentials for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "users can delete own api credentials"
on public.user_api_credentials for delete to authenticated
using ((select auth.uid()) = user_id);

insert into public.api_providers (
  slug,
  display_name,
  category,
  signup_url,
  api_key_url,
  docs_url,
  base_url,
  auth_scheme,
  key_prefix_hint,
  supports_generation,
  supports_model_listing,
  is_active,
  sort_order
)
values
  (
    'openrouter',
    'OpenRouter',
    'gateway',
    'https://openrouter.ai/',
    'https://openrouter.ai/settings/keys',
    'https://openrouter.ai/docs/quickstart',
    'https://openrouter.ai/api/v1',
    'bearer',
    'sk-or-',
    true,
    true,
    true,
    10
  ),
  (
    'google-gemini',
    'Google Gemini',
    'direct',
    'https://aistudio.google.com/',
    'https://aistudio.google.com/app/apikey',
    'https://ai.google.dev/gemini-api/docs',
    'https://generativelanguage.googleapis.com/v1beta',
    'x-goog-api-key',
    'AIza',
    true,
    true,
    true,
    20
  ),
  (
    'xai',
    'xAI',
    'direct',
    'https://console.x.ai/',
    'https://console.x.ai/',
    'https://docs.x.ai/overview',
    'https://api.x.ai/v1',
    'bearer',
    null,
    true,
    true,
    true,
    30
  ),
  (
    'openai',
    'OpenAI',
    'direct',
    'https://platform.openai.com/',
    'https://platform.openai.com/api-keys',
    'https://platform.openai.com/docs/api-reference',
    'https://api.openai.com/v1',
    'bearer',
    'sk-',
    true,
    true,
    true,
    40
  ),
  (
    'anthropic',
    'Anthropic / Claude Platform',
    'direct',
    'https://platform.claude.com/',
    'https://platform.claude.com/settings/keys',
    'https://platform.claude.com/docs/en/api/overview',
    'https://api.anthropic.com/v1',
    'x-api-key',
    'sk-ant-',
    true,
    true,
    true,
    50
  ),
  (
    'deepseek',
    'DeepSeek',
    'direct',
    'https://platform.deepseek.com/',
    null,
    'https://api-docs.deepseek.com/',
    'https://api.deepseek.com',
    'bearer',
    'sk-',
    true,
    true,
    true,
    60
  ),
  (
    'mistral',
    'Mistral',
    'direct',
    'https://console.mistral.ai/',
    'https://console.mistral.ai/',
    'https://docs.mistral.ai/',
    'https://api.mistral.ai/v1',
    'bearer',
    null,
    true,
    true,
    true,
    70
  ),
  (
    'groqcloud',
    'GroqCloud',
    'gateway',
    'https://console.groq.com/',
    'https://console.groq.com/keys',
    'https://console.groq.com/docs/overview',
    'https://api.groq.com/openai/v1',
    'bearer',
    'gsk_',
    true,
    true,
    true,
    80
  ),
  (
    'alibaba-model-studio',
    'Alibaba Cloud Model Studio / Qwen',
    'gateway',
    'https://www.alibabacloud.com/',
    null,
    'https://www.alibabacloud.com/help/en/model-studio/get-api-key',
    null,
    'bearer',
    null,
    true,
    true,
    false,
    90
  ),
  (
    'kimi',
    'Kimi API Platform',
    'direct',
    'https://platform.kimi.ai/',
    'https://platform.kimi.ai/console/api-keys',
    'https://platform.kimi.ai/docs/api/overview',
    'https://api.moonshot.ai/v1',
    'bearer',
    null,
    true,
    true,
    true,
    100
  );
