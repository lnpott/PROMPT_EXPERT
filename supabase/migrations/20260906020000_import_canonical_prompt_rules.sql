create table public.knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title text not null,
  source_url text,
  repository_path text not null,
  content_sha256 text not null check (content_sha256 ~ '^[a-f0-9]{64}$'),
  verification_status text not null check (verification_status in ('supplied_unverified', 'verified', 'superseded')),
  imported_at timestamptz not null default now()
);

create table public.canonical_prompt_rules (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.knowledge_sources(id) on delete cascade,
  rule_key text not null unique check (rule_key ~ '^[a-z0-9-]+$'),
  title text not null,
  provider text,
  model_family text,
  source_section text not null,
  rule_text text not null,
  applicability text,
  evidence_status text not null check (evidence_status in ('supplied_unverified', 'verified', 'deprecated', 'uncertain')),
  is_active boolean not null default false,
  imported_at timestamptz not null default now()
);

alter table public.knowledge_sources enable row level security;
alter table public.canonical_prompt_rules enable row level security;

revoke all on table public.knowledge_sources, public.canonical_prompt_rules from anon, authenticated;
grant select on table public.knowledge_sources, public.canonical_prompt_rules to anon, authenticated;

create policy "public can read active knowledge sources"
on public.knowledge_sources for select to anon, authenticated
using (
  verification_status = 'verified'
  and exists (
    select 1
    from public.canonical_prompt_rules rule
    where rule.source_id = knowledge_sources.id
      and rule.is_active = true
  )
);

create policy "public can read active canonical prompt rules"
on public.canonical_prompt_rules for select to anon, authenticated
using (is_active = true and evidence_status = 'verified');

with source_document as (
  insert into public.knowledge_sources (
    slug,
    title,
    source_url,
    repository_path,
    content_sha256,
    verification_status
  ) values (
    'base-canonica-regras',
    'Base canônica de regras: compilador de prompts e payloads',
    'https://notebook.google.com/notebook/5a5161c7-5d60-48e7-ac86-f2887f86d07c',
    'base-canonica-regras.md',
    '7b7e52a038a86e67248b4d98c02931a1fe1cccf5805eed1cb2d80a34ddbff509',
    'supplied_unverified'
  ) on conflict (slug) do update set
    title = excluded.title,
    source_url = excluded.source_url,
    repository_path = excluded.repository_path,
    content_sha256 = excluded.content_sha256,
    verification_status = excluded.verification_status,
    imported_at = now()
  returning id
)
insert into public.canonical_prompt_rules (
  source_id,
  rule_key,
  title,
  provider,
  model_family,
  source_section,
  rule_text,
  applicability,
  evidence_status,
  is_active
)
select source_document.id, rules.rule_key, rules.title, rules.provider, rules.model_family,
  rules.source_section, rules.rule_text, rules.applicability, 'supplied_unverified', false
from source_document
cross join (
  values
    ('instruction-hierarchy', 'Hierarquia de instruções de governança', 'OpenAI', 'GPT e modelos de raciocínio', 'B. Regra 1', 'Delimite regras de negócio em instruções de maior autoridade que o conteúdo da pessoa usuária.', 'Proteção contra conflito de instruções e injeção de prompt.'),
    ('xml-separation', 'Separação de contexto com XML', 'Anthropic', 'Claude', 'B. Regra 2', 'Separe instruções, contexto, exemplos e entrada com tags estruturadas quando o perfil do modelo suportar esse padrão.', 'Contextos longos e dados de referência estruturados.'),
    ('gemini-property-ordering', 'Ordem de propriedades em saída estruturada', 'Google', 'Gemini', 'B. Regra 3', 'Mantenha a ordem das propriedades discutidas no prompt alinhada à ordem declarada no esquema de saída.', 'Somente geração JSON estruturada com esquema.'),
    ('provider-effort-controls', 'Controles de esforço por fornecedor', null, null, 'C. Regra 4', 'Ajuste parâmetros de esforço e amostragem conforme o endpoint e o fornecedor; não presuma interoperabilidade entre APIs.', 'Integrações que expõem controles de raciocínio.'),
    ('deepseek-reasoning-passback', 'Reenvio de contexto de raciocínio DeepSeek', 'DeepSeek', 'DeepSeek V4', 'D. Regra 5', 'Em fluxos de ferramentas com DeepSeek, preserve o contexto técnico exigido pelo provedor entre turnos.', 'Chamadas de ferramentas multi-turno no provedor aplicável.'),
    ('agent-verification', 'Verificação empírica para agentes de código', 'OpenAI', 'Modelos de código e raciocínio', 'D. Regra 6', 'Peça alterações verificáveis, testes apropriados e evidências de execução em tarefas de engenharia de software.', 'Implementações e refatorações com alteração de código.'),
    ('strict-json-schema', 'Não usar strictJsonSchema na raiz', 'OpenAI', 'Chat Completions', 'F. Anti-pattern 1', 'Não envie strictJsonSchema como parâmetro de raiz; valide o formato aceito pelo endpoint antes de gerar payloads estruturados.', 'Geração de payloads para OpenAI.'),
    ('claude-md-line-cap', 'Não impor limite artificial ao CLAUDE.md', 'Anthropic', 'Claude Code', 'F. Anti-pattern 2', 'Não aplique limite de linhas não documentado ao arquivo de governança local.', 'Linting de instruções para Claude Code.'),
    ('devstral-fim-routing', 'Não rotear Devstral para FIM', 'Mistral', 'Devstral', 'F. Anti-pattern 3', 'Não direcione modelos Devstral para endpoints de preenchimento de lacunas sem confirmar suporte oficial.', 'Seleção de endpoint por modelo.'),
    ('avoid-forced-chain-of-thought', 'Evitar CoT detalhado forçado', 'OpenAI e DeepSeek', 'Modelos de raciocínio', 'F. Anti-pattern 4', 'Não exija a exposição detalhada do raciocínio; solicite uma resposta final verificável e concisa.', 'Modelos com raciocínio interno.'),
    ('vertex-cache-propagation', 'Lacuna de propagação de cache Vertex', 'Google', 'Vertex AI', 'H. Lacuna 1', 'Não assuma tempos de propagação ou retenção de cache não documentados.', 'Planejamento de cache multi-região.'),
    ('vllm-tag-collision', 'Lacuna de colisão de tags vLLM', 'vLLM', 'Qwen3', 'H. Lacuna 2', 'Trate colisões entre tags de raciocínio e chamadas de ferramenta como comportamento incerto até teste empírico.', 'Integrações com parser de raciocínio Qwen3.')
) as rules(rule_key, title, provider, model_family, source_section, rule_text, applicability)
on conflict (rule_key) do update set
  source_id = excluded.source_id,
  title = excluded.title,
  provider = excluded.provider,
  model_family = excluded.model_family,
  source_section = excluded.source_section,
  rule_text = excluded.rule_text,
  applicability = excluded.applicability,
  evidence_status = excluded.evidence_status,
  is_active = false,
  imported_at = now();
