alter table public.api_providers
  add column short_description text check (short_description is null or char_length(short_description) between 1 and 240),
  add column long_description text check (long_description is null or char_length(long_description) between 1 and 2000),
  add column company_name text check (company_name is null or char_length(company_name) between 1 and 120),
  add column country_region text check (country_region is null or char_length(country_region) between 1 and 120),
  add column website_url text check (website_url is null or website_url ~ '^https://[^[:space:]]+$'),
  add column logo_url text check (logo_url is null or logo_url ~ '^https://[^[:space:]]+$'),
  add column media_url text check (media_url is null or media_url ~ '^https://[^[:space:]]+$'),
  add column primary_uses text[],
  add column strengths text[],
  add column limitations text[],
  add column free_tier_status text check (free_tier_status is null or free_tier_status in ('none', 'quota', 'promotional', 'gateway_free', 'unknown')),
  add column billing_notes text check (billing_notes is null or char_length(billing_notes) between 1 and 1000),
  add column card_required boolean,
  add column openai_compatible boolean,
  add column region_notes text check (region_notes is null or char_length(region_notes) between 1 and 1000),
  add column last_verified_at date,
  add column source_url text check (source_url is null or source_url ~ '^https://[^[:space:]]+$');

create table public.ai_models (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.api_providers(id) on delete cascade,
  model_id text not null check (char_length(btrim(model_id)) between 1 and 160),
  display_name text not null check (char_length(btrim(display_name)) between 1 and 160),
  family text check (family is null or char_length(family) between 1 and 120),
  description text check (description is null or char_length(description) between 1 and 1200),
  input_modalities text[],
  output_modalities text[],
  reasoning_support boolean,
  coding_suitability smallint check (coding_suitability is null or coding_suitability between 1 and 5),
  tool_calling boolean,
  vision boolean,
  audio boolean,
  image_generation boolean,
  context_window_tokens bigint check (context_window_tokens is null or context_window_tokens > 0),
  max_output_tokens bigint check (max_output_tokens is null or max_output_tokens > 0),
  input_price numeric(14,6) check (input_price is null or input_price >= 0),
  output_price numeric(14,6) check (output_price is null or output_price >= 0),
  cached_input_price numeric(14,6) check (cached_input_price is null or cached_input_price >= 0),
  currency char(3) check (currency is null or currency ~ '^[A-Z]{3}$'),
  pricing_unit text check (pricing_unit is null or pricing_unit in ('million_tokens', 'request', 'image', 'second', 'minute', 'hour')),
  pricing_notes text check (pricing_notes is null or char_length(pricing_notes) between 1 and 1200),
  free_tier_status text check (free_tier_status is null or free_tier_status in ('none', 'quota', 'promotional', 'gateway_free', 'unknown')),
  is_active boolean not null default true,
  is_public boolean not null default true,
  is_deprecated boolean not null default false,
  official_url text check (official_url is null or official_url ~ '^https://[^[:space:]]+$'),
  pricing_source_url text check (pricing_source_url is null or pricing_source_url ~ '^https://[^[:space:]]+$'),
  last_verified_at date,
  sort_order smallint not null default 100 check (sort_order between 1 and 999),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (provider_id, model_id)
);

create index ai_models_provider_id_idx on public.ai_models (provider_id, sort_order);

alter table public.ai_models enable row level security;
alter table public.ai_models force row level security;
revoke all on table public.ai_models from public, anon, authenticated;
grant select on table public.ai_models to anon, authenticated;

create policy "public can read active ai models"
on public.ai_models for select to anon, authenticated
using (is_active = true and is_public = true and is_deprecated = false);

-- Anonymous catalog reads remain active-only. Authenticated users may resolve an
-- inactive provider only when they own a credential for it, so deactivation can
-- never strand a secret that its owner needs to delete.
drop policy "public can read active api providers" on public.api_providers;
create policy "anonymous can read active api providers"
on public.api_providers for select to anon
using (is_active = true);
create policy "authenticated can read available api providers"
on public.api_providers for select to authenticated
using (
  is_active = true
  or exists (
    select 1 from public.user_api_credentials
    where user_api_credentials.provider_id = api_providers.id
      and user_api_credentials.user_id = (select auth.uid())
  )
);

update public.api_providers set
  short_description = 'Gateway unificado para acessar modelos de diversos laboratórios por uma API.',
  long_description = 'O OpenRouter agrega modelos e provedores de inferência, com roteamento e preços exibidos por modelo. A disponibilidade e o preço dependem da rota escolhida.',
  company_name = 'OpenRouter', country_region = 'United States', website_url = 'https://openrouter.ai/', logo_url = 'https://openrouter.ai/favicon.ico',
  primary_uses = array['Comparar modelos', 'Roteamento multi-provider', 'Protótipos'], strengths = array['API unificada', 'Catálogo amplo'], limitations = array['Preço e disponibilidade variam por rota'],
  free_tier_status = 'gateway_free', billing_notes = 'Modelos com sufixo :free têm limites baixos; outros consomem créditos em USD e a compra de créditos possui taxa.', card_required = null, openai_compatible = true,
  region_notes = null, last_verified_at = '2026-09-08', source_url = 'https://openrouter.ai/docs/faq'
where slug = 'openrouter';

update public.api_providers set
  short_description = 'API multimodal do Google para texto, código, visão, áudio e ferramentas.',
  long_description = 'A Gemini Developer API oferece modelos Flash orientados a velocidade, custo e fluxos agentic, além de modalidades especializadas. Limites e uso de dados diferem entre o free tier e o paid tier.',
  company_name = 'Google', country_region = 'United States', website_url = 'https://ai.google.dev/', logo_url = null,
  primary_uses = array['Programação', 'Agentes', 'Aplicações multimodais'], strengths = array['Multimodalidade', 'Free tier documentado'], limitations = array['Cotas variam por modelo e projeto'],
  free_tier_status = 'quota', billing_notes = 'Há free tier com cota e paid tier por token; preços e disponibilidade dependem do modelo.', card_required = null, openai_compatible = false,
  region_notes = 'Disponibilidade do free tier e de modelos depende da região e elegibilidade.', last_verified_at = '2026-09-08', source_url = 'https://ai.google.dev/gemini-api/docs/pricing'
where slug = 'google-gemini';

update public.api_providers set
  short_description = 'Plataforma de modelos Grok para código, raciocínio, ferramentas e multimodalidade.',
  long_description = 'A API xAI publica modelos Grok gerais e especializados em código, com preços por token e opções regionais documentadas para alguns modelos.',
  company_name = 'xAI', country_region = 'United States', website_url = 'https://x.ai/', logo_url = 'https://x.ai/favicon.ico',
  primary_uses = array['Programação', 'Agentes', 'Raciocínio'], strengths = array['Tool calling', 'Raciocínio configurável'], limitations = array['Cobrança por uso'],
  free_tier_status = 'unknown', billing_notes = 'A documentação consultada publica preços por modelo; nenhuma gratuidade permanente foi afirmada neste catálogo.', card_required = null, openai_compatible = true,
  region_notes = 'Alguns modelos documentam clusters e preços regionais.', last_verified_at = '2026-09-08', source_url = 'https://docs.x.ai/docs/models'
where slug = 'xai';

update public.api_providers set
  short_description = 'Plataforma de modelos para raciocínio, código, agentes e aplicações multimodais.',
  long_description = 'A OpenAI API oferece modelos de uso geral e especializados, com ferramentas e Responses API. Preços podem variar por modo de processamento e região.',
  company_name = 'OpenAI', country_region = 'United States', website_url = 'https://openai.com/', logo_url = null,
  primary_uses = array['Programação', 'Agentes', 'Raciocínio'], strengths = array['Ferramentas integradas', 'Modelos especializados'], limitations = array['Preço varia por modo e região'],
  free_tier_status = 'unknown', billing_notes = 'O catálogo registra preços padrão por milhão de tokens apenas quando comparáveis.', card_required = null, openai_compatible = true,
  region_notes = 'Endpoints elegíveis de residência de dados podem ter acréscimo.', last_verified_at = '2026-09-08', source_url = 'https://developers.openai.com/api/docs/pricing'
where slug = 'openai';

update public.api_providers set
  short_description = 'Claude API para agentes, programação, raciocínio e trabalho de conhecimento.',
  long_description = 'A Claude Platform oferece famílias com diferentes níveis de inteligência, velocidade e contexto, incluindo tool use e extended/adaptive thinking conforme o modelo.',
  company_name = 'Anthropic', country_region = 'United States', website_url = 'https://www.anthropic.com/', logo_url = 'https://www.anthropic.com/favicon.ico',
  primary_uses = array['Programação agentic', 'Raciocínio', 'Texto longo'], strengths = array['Contexto longo', 'Tool use'], limitations = array['Cobrança separada de cache e tokens'],
  free_tier_status = 'unknown', billing_notes = 'Input, output e prompt caching têm preços próprios; opções regionais podem usar multiplicadores.', card_required = null, openai_compatible = false,
  region_notes = 'Roteamento global e endpoints regionais têm condições distintas.', last_verified_at = '2026-09-08', source_url = 'https://docs.anthropic.com/en/docs/about-claude/models/overview'
where slug = 'anthropic';

update public.api_providers set
  short_description = 'API de modelos DeepSeek com raciocínio, ferramentas e formatos compatíveis.',
  long_description = 'A API DeepSeek documenta modelos gerais, visionais e modos thinking/non-thinking, com preços que variam entre cache hit, cache miss e horário.',
  company_name = 'DeepSeek', country_region = 'China', website_url = 'https://www.deepseek.com/', logo_url = 'https://www.deepseek.com/favicon.ico',
  primary_uses = array['Programação', 'Raciocínio', 'Tool calling'], strengths = array['Contexto longo', 'Preços estruturados por cache'], limitations = array['Preço varia por pico e cache'],
  free_tier_status = 'unknown', billing_notes = 'Os preços oficiais distinguem cache hit/miss e períodos peak/off-peak; não são reduzidos a um único valor.', card_required = null, openai_compatible = true,
  region_notes = null, last_verified_at = '2026-09-08', source_url = 'https://api-docs.deepseek.com/quick_start/pricing/'
where slug = 'deepseek';

update public.api_providers set
  short_description = 'Plataforma europeia com modelos gerais, de código, áudio e documentos.',
  long_description = 'A Mistral AI publica modelos abertos e comerciais, incluindo famílias voltadas a software engineering e modelos pequenos eficientes.',
  company_name = 'Mistral AI', country_region = 'France', website_url = 'https://mistral.ai/', logo_url = 'https://mistral.ai/favicon.ico',
  primary_uses = array['Programação', 'Agentes', 'Texto'], strengths = array['Modelos de código', 'Opções abertas e comerciais'], limitations = array['Preço depende do modelo e produto'],
  free_tier_status = 'unknown', billing_notes = 'A maior parte da inferência é cobrada por milhão de tokens; ferramentas especializadas usam outras unidades.', card_required = null, openai_compatible = true,
  region_notes = null, last_verified_at = '2026-09-08', source_url = 'https://docs.mistral.ai/getting-started/models/models_overview'
where slug = 'mistral';

update public.api_providers set
  short_description = 'Serviço de inferência de baixa latência para modelos abertos selecionados.',
  long_description = 'A GroqCloud hospeda modelos de terceiros e publica IDs, contexto, limites e preços quando aplicáveis. O catálogo muda conforme modelos entram em preview ou depreciação.',
  company_name = 'Groq', country_region = 'United States', website_url = 'https://groq.com/', logo_url = 'https://groq.com/favicon.ico',
  primary_uses = array['Inferência rápida', 'Agentes', 'Modelos abertos'], strengths = array['Baixa latência', 'API compatível com OpenAI'], limitations = array['Catálogo hospedado pode mudar'],
  free_tier_status = 'quota', billing_notes = 'O Developer Plan documenta limites; preços por token são registrados apenas quando publicados para o modelo.', card_required = null, openai_compatible = true,
  region_notes = null, last_verified_at = '2026-09-08', source_url = 'https://console.groq.com/docs/models'
where slug = 'groqcloud';

update public.api_providers set
  short_description = 'Alibaba Cloud Model Studio para modelos Qwen e modelos de terceiros.',
  long_description = 'O Model Studio oferece texto, visão, áudio e vídeo. IDs, preços, free quota e endpoints dependem do deployment scope e da região.',
  company_name = 'Alibaba Cloud', country_region = 'China / international regions', website_url = 'https://www.alibabacloud.com/product/model-studio', logo_url = 'https://www.alibabacloud.com/favicon.ico',
  primary_uses = array['Programação', 'Raciocínio', 'Multimodal'], strengths = array['Família Qwen', 'Modalidades diversas'], limitations = array['Endpoints e preços regionais'],
  free_tier_status = 'promotional', billing_notes = 'Alguns modelos oferecem quota por 90 dias em regiões específicas; isso não representa gratuidade permanente.', card_required = null, openai_compatible = true,
  region_notes = 'Free quota e preço variam entre Singapore, International e Chinese mainland.', last_verified_at = '2026-09-08', source_url = 'https://www.alibabacloud.com/help/en/model-studio/model-pricing'
where slug = 'alibaba-model-studio';

update public.api_providers set
  short_description = 'Kimi API para programação agentic, raciocínio e entradas multimodais.',
  long_description = 'A Kimi API Platform, da Moonshot AI, publica modelos gerais e dedicados a código e oferece compatibilidade com SDKs OpenAI e Anthropic.',
  company_name = 'Moonshot AI', country_region = 'China', website_url = 'https://platform.moonshot.ai/', logo_url = 'https://platform.moonshot.ai/favicon.ico',
  primary_uses = array['Programação agentic', 'Raciocínio', 'Texto longo'], strengths = array['Contexto longo', 'Modelos dedicados a código'], limitations = array['Preço detalhado varia por modelo'],
  free_tier_status = 'unknown', billing_notes = 'Input e output são cobrados por uso; upload e extração de arquivos estavam temporariamente gratuitos, sem implicar inferência gratuita.', card_required = null, openai_compatible = true,
  region_notes = null, last_verified_at = '2026-09-08', source_url = 'https://platform.moonshot.ai/docs/pricing/chat'
where slug = 'kimi';

insert into public.ai_models (
  provider_id, model_id, display_name, family, description, input_modalities, output_modalities,
  reasoning_support, coding_suitability, tool_calling, vision, audio, image_generation,
  context_window_tokens, max_output_tokens, input_price, output_price, cached_input_price,
  currency, pricing_unit, pricing_notes, free_tier_status, official_url, pricing_source_url,
  last_verified_at, sort_order
)
values
  ((select id from public.api_providers where slug='openrouter'), 'openrouter/free', 'OpenRouter Free Models Router', 'OpenRouter Router', 'Seleciona automaticamente um modelo gratuito disponível; modelo e limites podem variar por requisição.', array['text'], array['text'], null, 3, null, null, null, null, null, null, null, null, null, null, null, 'Gratuito via gateway, com seleção dinâmica e limites baixos.', 'gateway_free', 'https://openrouter.ai/docs/faq', 'https://openrouter.ai/docs/faq', '2026-09-08', 10),
  ((select id from public.api_providers where slug='google-gemini'), 'gemini-3.8-flash', 'Gemini 3.8 Flash', 'Gemini 3 Flash', 'Modelo Flash para engenharia de software de longo horizonte, agentes e workflows complexos.', array['text','image','audio','video'], array['text'], true, 5, true, true, true, false, null, null, 0.75, 3.75, 0.075, 'USD', 'million_tokens', 'Preços standard verificados e válidos até 31 de dezembro de 2026; a página oficial anuncia alteração posterior.', 'quota', 'https://ai.google.dev/gemini-api/docs/models', 'https://ai.google.dev/gemini-api/docs/pricing', '2026-09-08', 10),
  ((select id from public.api_providers where slug='xai'), 'grok-4.6', 'Grok 4.6', 'Grok', 'Modelo principal xAI para código, agentes, tool calling e raciocínio configurável.', array['text'], array['text'], true, 5, true, null, null, false, 500000, null, 2.00, 6.00, null, 'USD', 'million_tokens', null, 'unknown', 'https://docs.x.ai/docs/models', 'https://docs.x.ai/docs/models', '2026-09-08', 10),
  ((select id from public.api_providers where slug='xai'), 'grok-code-fast-1', 'Grok Code Fast 1', 'Grok Code', 'Modelo especializado em código com reasoning, function calling e structured outputs.', array['text','image'], array['text'], true, 5, true, true, false, false, 256000, null, 1.00, 2.00, 0.20, 'USD', 'million_tokens', 'A documentação indica preços regionais distintos acima de 200K tokens.', 'unknown', 'https://docs.x.ai/docs/models/grok-code-fast-1', 'https://docs.x.ai/docs/models/grok-code-fast-1', '2026-09-08', 20),
  ((select id from public.api_providers where slug='openai'), 'gpt-5.6-sol', 'GPT-5.6 Sol', 'GPT-5.6', 'Modelo para trabalho profissional complexo, código, ferramentas e raciocínio configurável.', array['text','image'], array['text'], true, 5, true, true, false, false, 1050000, 128000, 4.00, 20.00, 0.40, 'USD', 'million_tokens', 'Preço standard; modos batch/flex/priority e processamento regional possuem valores distintos.', 'unknown', 'https://platform.openai.com/docs/models', 'https://developers.openai.com/api/docs/pricing', '2026-09-08', 10),
  ((select id from public.api_providers where slug='anthropic'), 'claude-sonnet-5', 'Claude Sonnet 5', 'Claude 5', 'Modelo equilibrado para programação, agentes e trabalho de conhecimento.', array['text','image'], array['text'], true, 5, true, true, false, false, 1000000, 128000, 2.00, 10.00, 0.20, 'USD', 'million_tokens', 'Cached input representa cache hit/refresh; cache write usa preços próprios.', 'unknown', 'https://docs.anthropic.com/en/docs/about-claude/models/overview', 'https://docs.anthropic.com/en/docs/about-claude/pricing', '2026-09-08', 10),
  ((select id from public.api_providers where slug='deepseek'), 'deepseek-v4-flash', 'DeepSeek V4 Flash', 'DeepSeek V4', 'Modelo geral com thinking/non-thinking, tool calls, JSON e FIM.', array['text'], array['text'], true, 5, true, false, false, false, 1000000, 384000, null, null, null, 'USD', 'million_tokens', 'Preço varia por cache hit/miss e períodos peak/off-peak; consulte a fonte oficial.', 'unknown', 'https://api-docs.deepseek.com/quick_start/pricing/', 'https://api-docs.deepseek.com/quick_start/pricing/', '2026-09-08', 10),
  ((select id from public.api_providers where slug='mistral'), 'mistral-small-latest', 'Mistral Small 4', 'Mistral Small', 'Modelo híbrido eficiente para instrução, raciocínio e código.', array['text'], array['text'], true, 4, true, null, false, false, null, null, null, null, null, null, null, 'Preço não registrado porque a página consultada não apresentou um valor simples associado ao alias.', 'unknown', 'https://docs.mistral.ai/getting-started/models/models_overview', 'https://mistral.ai/pricing', '2026-09-08', 10),
  ((select id from public.api_providers where slug='groqcloud'), 'openai/gpt-oss-120b', 'GPT OSS 120B', 'GPT OSS', 'Modelo aberto hospedado para raciocínio e geração de texto em alta velocidade.', array['text'], array['text'], true, 4, true, false, false, false, 131072, 65536, 0.15, 0.60, null, 'USD', 'million_tokens', null, 'quota', 'https://console.groq.com/docs/models', 'https://console.groq.com/docs/models', '2026-09-08', 10),
  ((select id from public.api_providers where slug='alibaba-model-studio'), 'qwen3.7-plus', 'Qwen 3.7 Plus', 'Qwen Plus', 'Modelo Qwen com modos thinking e non-thinking e suporte a contexto longo.', array['text'], array['text'], true, 5, true, true, null, null, 1000000, null, 0.40, 1.60, null, 'USD', 'million_tokens', 'Preço internacional para requisições até 256K tokens; acima disso há tier distinto. Desconto temporário não foi usado como preço canônico.', 'promotional', 'https://www.alibabacloud.com/help/en/model-studio/models', 'https://www.alibabacloud.com/help/en/model-studio/model-pricing', '2026-09-08', 10),
  ((select id from public.api_providers where slug='kimi'), 'kimi-k3', 'Kimi K3', 'Kimi K3', 'Modelo principal para programação de longo horizonte, conhecimento e raciocínio, com visão nativa.', array['text','image'], array['text'], true, 5, true, true, false, false, 1000000, null, null, null, null, null, null, 'A página central referencia pricing por modelo, sem valor comparável no documento consultado.', 'unknown', 'https://platform.moonshot.ai/docs/guide/start-using-kimi-api', 'https://platform.moonshot.ai/docs/pricing/chat', '2026-09-08', 10),
  ((select id from public.api_providers where slug='kimi'), 'kimi-k2.7-code-highspeed', 'Kimi K2.7 Code Highspeed', 'Kimi K2.7 Code', 'Modelo dedicado a geração, edição de código e agentes de programação.', array['text','image','video'], array['text'], true, 5, true, true, false, false, 256000, null, null, null, null, null, null, 'Preço não estruturado porque o valor específico não estava presente na página central consultada.', 'unknown', 'https://platform.moonshot.ai/docs/guide/start-using-kimi-api', 'https://platform.moonshot.ai/docs/pricing/chat', '2026-09-08', 20);
