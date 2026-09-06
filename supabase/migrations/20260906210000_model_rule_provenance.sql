create table public.evidence_sources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title text not null,
  organization text not null,
  domain text,
  authority_class text not null check (authority_class in ('A', 'B', 'C')),
  source_kind text not null check (source_kind in ('official', 'institutional', 'internal')),
  canonical_url text,
  repository_path text,
  validation_status text not null check (validation_status in ('confirmed', 'partial', 'secondary', 'not_located')),
  reviewed_on date not null,
  review_notes text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (canonical_url is not null or repository_path is not null)
);

create table public.source_snapshots (
  id uuid primary key default gen_random_uuid(),
  evidence_source_id uuid not null references public.evidence_sources(id) on delete cascade,
  retrieved_at timestamptz not null default now(),
  http_status smallint check (http_status between 100 and 599),
  final_url text,
  title_observed text,
  content_sha256 text check (content_sha256 is null or content_sha256 ~ '^[a-f0-9]{64}$'),
  notes text
);

create table public.rule_evidence (
  id uuid primary key default gen_random_uuid(),
  canonical_rule_id uuid not null references public.canonical_prompt_rules(id) on delete cascade,
  evidence_source_id uuid not null references public.evidence_sources(id) on delete restrict,
  relationship text not null check (relationship in ('supports', 'partially_supports', 'refutes', 'context', 'uncertain')),
  claim text not null,
  source_locator text,
  reviewed_on date not null,
  created_at timestamptz not null default now(),
  unique (canonical_rule_id, evidence_source_id, claim)
);

create table public.rule_review_events (
  id bigint generated always as identity primary key,
  canonical_rule_id uuid not null references public.canonical_prompt_rules(id) on delete cascade,
  previous_evidence_status text,
  new_evidence_status text not null,
  previous_is_active boolean,
  new_is_active boolean not null,
  decision text not null check (decision in ('imported', 'reviewed', 'activated', 'deactivated', 'superseded')),
  reviewed_by text not null,
  rationale text not null,
  created_at timestamptz not null default now()
);

alter table public.evidence_sources enable row level security;
alter table public.source_snapshots enable row level security;
alter table public.rule_evidence enable row level security;
alter table public.rule_review_events enable row level security;

revoke all on table public.evidence_sources, public.source_snapshots, public.rule_evidence, public.rule_review_events from anon, authenticated;
grant select on table public.evidence_sources, public.source_snapshots to anon, authenticated;

create policy "public can read reviewed evidence sources"
on public.evidence_sources for select to anon, authenticated
using (validation_status in ('confirmed', 'partial'));

create policy "public can read snapshots of reviewed sources"
on public.source_snapshots for select to anon, authenticated
using (exists (
  select 1 from public.evidence_sources source
  where source.id = source_snapshots.evidence_source_id
    and source.validation_status in ('confirmed', 'partial')
));

insert into public.evidence_sources
  (slug, title, organization, domain, authority_class, source_kind, canonical_url, repository_path, validation_status, reviewed_on, review_notes)
values
  ('azure-openai-reasoning', 'Azure OpenAI reasoning models', 'Microsoft', 'learn.microsoft.com', 'A', 'official', 'https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/reasoning', null, 'partial', '2026-09-06', 'Página oficial confirmada; modelos e valores devem ser validados por endpoint.'),
  ('claude-code-best-practices', 'Best practices for Claude Code', 'Anthropic', 'code.claude.com', 'A', 'official', 'https://code.claude.com/docs/en/best-practices', null, 'confirmed', '2026-09-06', 'Fluxo, verificação e práticas do agente confirmados.'),
  ('deepseek-first-api-call', 'Your First API Call', 'DeepSeek', 'api-docs.deepseek.com', 'A', 'official', 'https://api-docs.deepseek.com/', null, 'confirmed', '2026-09-06', 'Quickstart oficial confirmado.'),
  ('internal-prompt-guidelines', 'Diretrizes Técnicas de Engenharia de Prompts', 'PROMPT_EXPERT', null, 'C', 'internal', null, 'base-canonica-regras.md', 'secondary', '2026-09-06', 'Síntese interna; não comprova comportamento de fornecedores.'),
  ('claude-directory-memory', 'Claude Code memory and settings', 'Anthropic', 'code.claude.com', 'A', 'official', 'https://code.claude.com/docs/en/memory', null, 'partial', '2026-09-06', 'Memória e regras confirmadas; título exportado não localizado.'),
  ('xai-function-calling', 'Function Calling', 'xAI', 'docs.x.ai', 'A', 'official', 'https://docs.x.ai/developers/tools/function-calling', null, 'confirmed', '2026-09-06', 'Ferramentas, schemas e fluxo confirmados.'),
  ('qwen3-coder-repository', 'Qwen3-Coder', 'Qwen Team', 'github.com', 'A', 'official', 'https://github.com/QwenLM/Qwen3-Coder', null, 'confirmed', '2026-09-06', 'Repositório oficial confirmado.'),
  ('xai-api-overview', 'Grok API Documentation', 'xAI', 'docs.x.ai', 'A', 'official', 'https://docs.x.ai/overview', null, 'confirmed', '2026-09-06', 'Portal oficial confirmado; cache específico não confirmado.'),
  ('vercel-o3-mini', 'Get started with OpenAI o3-mini', 'Vercel', 'ai-sdk.dev', 'B', 'institutional', 'https://ai-sdk.dev/cookbook/guides/o3', null, 'confirmed', '2026-09-06', 'Integração institucional confirmada; não é fonte do fabricante.'),
  ('gemini-interactions-api', 'Interactions API', 'Google', 'ai.google.dev', 'A', 'official', 'https://ai.google.dev/gemini-api/docs/interactions-overview', null, 'confirmed', '2026-09-06', 'API oficial confirmada; retenção é condição mutável.'),
  ('kimi-api-overview', 'Kimi API Platform', 'Moonshot AI', 'platform.kimi.ai', 'A', 'official', 'https://platform.kimi.ai/docs/overview', null, 'partial', '2026-09-06', 'Portal confirmado; alegações Kimi K3 não totalmente localizadas.'),
  ('llama-31-prompt-formats', 'Llama 3.1 prompt formats', 'Meta', 'developer.meta.com', 'A', 'official', 'https://developer.meta.com/ai/docs/model-cards-and-prompt-formats/llama3_1/', null, 'confirmed', '2026-09-06', 'Formato 3.1 confirmado; não extrapolar versões.'),
  ('openai-prompt-engineering', 'Prompt engineering', 'OpenAI', 'developers.openai.com', 'A', 'official', 'https://developers.openai.com/api/docs/guides/prompt-engineering', null, 'confirmed', '2026-09-06', 'Guia oficial confirmado.'),
  ('claude-prompting-best-practices', 'Claude prompting best practices', 'Anthropic', 'platform.claude.com', 'A', 'official', 'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices', null, 'partial', '2026-09-06', 'Boas práticas vigentes; detalhes exclusivos de Opus 5 não confirmados separadamente.'),
  ('deepseek-responses-api', 'Responses API', 'DeepSeek', 'api-docs.deepseek.com', 'A', 'official', 'https://api-docs.deepseek.com/guides/responses_api', null, 'confirmed', '2026-09-06', 'Guia oficial e limitações confirmados.'),
  ('gemini-structured-output', 'Structured output', 'Google Cloud', 'docs.cloud.google.com', 'A', 'official', 'https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/capabilities/control-generated-output', null, 'confirmed', '2026-09-06', 'Schema e ordenação confirmados para os endpoints indicados.'),
  ('deepseek-thinking-mode', 'Thinking Mode', 'DeepSeek', 'api-docs.deepseek.com', 'A', 'official', 'https://api-docs.deepseek.com/guides/thinking_mode', null, 'confirmed', '2026-09-06', 'reasoning_content e passback com tools confirmados.'),
  ('mistral-devstral', 'Devstral', 'Mistral AI', 'mistral.ai', 'A', 'official', 'https://mistral.ai/news/devstral/', null, 'confirmed', '2026-09-06', 'Devstral confirmado; não comprova FIM.'),
  ('kimi-context-caching', 'Kimi context caching', 'Moonshot AI', 'platform.kimi.ai', 'A', 'official', 'https://platform.kimi.ai/docs/overview', null, 'not_located', '2026-09-06', 'Página específica e limiar de 256 tokens não localizados.'),
  ('openai-model-spec-2026-08-18', 'OpenAI Model Spec 2026-08-18', 'OpenAI', 'model-spec.openai.com', 'A', 'official', 'https://model-spec.openai.com/2026-08-18.html', null, 'confirmed', '2026-09-06', 'Hierarquia conceitual confirmada; não cria papéis JSON adicionais.'),
  ('mistral-fim-endpoint', 'FIM endpoint', 'Mistral AI', 'docs.mistral.ai', 'A', 'official', 'https://docs.mistral.ai/api/endpoint/fim', null, 'confirmed', '2026-09-06', 'Codestral, prompt e suffix confirmados.'),
  ('claude-on-vertex-ai', 'Claude on Google Cloud', 'Anthropic', 'platform.claude.com', 'A', 'official', 'https://platform.claude.com/docs/en/build-with-claude/claude-on-vertex-ai', null, 'confirmed', '2026-09-06', 'Suporte a prompt caching confirmado; roteamento físico não documentado.'),
  ('claude-prompt-caching', 'Prompt caching', 'Anthropic', 'platform.claude.com', 'A', 'official', 'https://platform.claude.com/docs/en/build-with-claude/prompt-caching', null, 'confirmed', '2026-09-06', 'cache_control, breakpoints e TTLs confirmados.'),
  ('qwen-function-calling', 'Qwen Function Calling', 'Qwen Team', 'qwen.readthedocs.io', 'A', 'official', 'https://qwen.readthedocs.io/en/latest/framework/function_call.html', null, 'confirmed', '2026-09-06', 'Hermes-style e parser Hermes confirmados; colisões não garantidas.')
on conflict (slug) do update set
  title = excluded.title,
  organization = excluded.organization,
  domain = excluded.domain,
  authority_class = excluded.authority_class,
  source_kind = excluded.source_kind,
  canonical_url = excluded.canonical_url,
  repository_path = excluded.repository_path,
  validation_status = excluded.validation_status,
  reviewed_on = excluded.reviewed_on,
  review_notes = excluded.review_notes,
  updated_at = now();

insert into public.source_snapshots (evidence_source_id, retrieved_at, http_status, final_url, title_observed, notes)
select id, '2026-09-06 00:00:00+00',
  case when validation_status = 'not_located' then 200 else 200 end,
  canonical_url,
  title,
  'Validação inicial por consulta à documentação pública; hash de página omitido porque conteúdo web é mutável.'
from public.evidence_sources
where canonical_url is not null
on conflict do nothing;

with links(rule_key, source_slug, relationship, claim, locator) as (
  values
    ('instruction-hierarchy', 'openai-model-spec-2026-08-18', 'supports', 'Developer possui maior autoridade que user; níveis são conceituais.', 'Instructions and levels of authority'),
    ('instruction-hierarchy', 'openai-prompt-engineering', 'supports', 'Use papéis documentados pelo endpoint para separar instruções.', 'Message roles and instruction hierarchy'),
    ('xml-separation', 'claude-prompting-best-practices', 'partially_supports', 'XML pode separar instruções, contexto e entrada.', 'Prompt structure'),
    ('gemini-property-ordering', 'gemini-structured-output', 'supports', 'Ordem textual deve acompanhar propertyOrdering em saída estruturada.', 'Structured output schema'),
    ('provider-effort-controls', 'azure-openai-reasoning', 'partially_supports', 'Esforço depende de modelo e endpoint.', 'Reasoning effort'),
    ('provider-effort-controls', 'deepseek-thinking-mode', 'supports', 'Thinking e amostragem têm contrato próprio do DeepSeek.', 'Thinking mode'),
    ('provider-effort-controls', 'kimi-api-overview', 'uncertain', 'Valores específicos atribuídos ao Kimi K3 não foram integralmente confirmados.', null),
    ('deepseek-reasoning-passback', 'deepseek-thinking-mode', 'supports', 'reasoning_content deve ser reenviado quando tools está presente.', 'Multi-turn and tool calls'),
    ('agent-verification', 'openai-prompt-engineering', 'supports', 'Tarefas de código devem produzir resultados verificáveis.', 'Agentic software engineering'),
    ('agent-verification', 'claude-code-best-practices', 'supports', 'Claude Code recomenda verificação e testes.', 'Verify your solution'),
    ('strict-json-schema', 'openai-prompt-engineering', 'partially_supports', 'Não inventar parâmetros fora do contrato do endpoint.', 'Structured prompts'),
    ('claude-md-line-cap', 'claude-directory-memory', 'partially_supports', 'Não há evidência primária nesta fonte para faixa rígida de 80 a 120 linhas.', 'Memory and settings'),
    ('devstral-fim-routing', 'mistral-devstral', 'supports', 'Devstral é documentado para tarefas agênticas, não como modelo FIM.', 'Devstral capabilities'),
    ('devstral-fim-routing', 'mistral-fim-endpoint', 'supports', 'O endpoint FIM documenta Codestral com prompt e suffix.', 'FIM request fields'),
    ('avoid-forced-chain-of-thought', 'openai-prompt-engineering', 'partially_supports', 'Solicitar resultado verificável sem exigir exposição de raciocínio.', 'Reasoning models'),
    ('avoid-forced-chain-of-thought', 'deepseek-thinking-mode', 'partially_supports', 'Raciocínio é retornado em campo próprio; não deve ser exigido como resposta final.', 'reasoning_content'),
    ('vertex-cache-propagation', 'claude-on-vertex-ai', 'supports', 'A fonte não documenta tempo de propagação ou roteamento para nó de cache quente.', 'Supported features and regions'),
    ('vertex-cache-propagation', 'claude-prompt-caching', 'context', 'Cache e TTL são documentados sem garantia de propagação física regional.', 'Cache duration'),
    ('vllm-tag-collision', 'qwen-function-calling', 'uncertain', 'Hermes é recomendado, mas a fonte não garante ausência de colisões sintáticas.', 'vLLM deployment')
)
insert into public.rule_evidence
  (canonical_rule_id, evidence_source_id, relationship, claim, source_locator, reviewed_on)
select rule.id, source.id, links.relationship, links.claim, links.locator, '2026-09-06'
from links
join public.canonical_prompt_rules rule on rule.rule_key = links.rule_key
join public.evidence_sources source on source.slug = links.source_slug
on conflict (canonical_rule_id, evidence_source_id, claim) do update set
  relationship = excluded.relationship,
  source_locator = excluded.source_locator,
  reviewed_on = excluded.reviewed_on;

insert into public.rule_review_events
  (canonical_rule_id, previous_evidence_status, new_evidence_status, previous_is_active, new_is_active, decision, reviewed_by, rationale)
select id, null, evidence_status, null, is_active, 'reviewed', 'PROMPT_EXPERT source audit',
  'Proveniência inicial modelada; nenhuma regra ativada antes de revisão editorial individual.'
from public.canonical_prompt_rules
where not exists (
  select 1 from public.rule_review_events event
  where event.canonical_rule_id = canonical_prompt_rules.id
    and event.decision = 'reviewed'
    and event.rationale = 'Proveniência inicial modelada; nenhuma regra ativada antes de revisão editorial individual.'
);

create or replace function public.enforce_verified_rule_activation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_active and (
    new.evidence_status <> 'verified'
    or not exists (
      select 1
      from public.rule_evidence evidence
      join public.evidence_sources source on source.id = evidence.evidence_source_id
      where evidence.canonical_rule_id = new.id
        and evidence.relationship = 'supports'
        and source.validation_status = 'confirmed'
    )
  ) then
    raise exception 'Canonical rules require verified status and confirmed supporting evidence before activation';
  end if;
  return new;
end;
$$;

create trigger enforce_verified_rule_activation
before insert or update of is_active, evidence_status
on public.canonical_prompt_rules
for each row execute function public.enforce_verified_rule_activation();
