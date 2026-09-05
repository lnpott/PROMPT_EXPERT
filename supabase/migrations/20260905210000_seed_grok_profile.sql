with profile as (
  insert into public.model_profiles (
    slug,
    display_name,
    description,
    system_guidance,
    output_contract
  ) values (
    'grok',
    'Grok',
    'Perfil inicial para transformar um briefing em prompt de programação.',
    'Estruture o pedido com contexto, objetivo, restrições, requisitos técnicos e critérios de aceite. Preserve a intenção da pessoa usuária e declare suposições somente quando necessárias.',
    'Entregue um único prompt em Markdown, pronto para copiar, que solicite resumo da solução, estrutura de arquivos, código completo, instruções para executar e critérios de validação.'
  ) on conflict (slug) do update set
    display_name = excluded.display_name,
    description = excluded.description,
    system_guidance = excluded.system_guidance,
    output_contract = excluded.output_contract,
    is_active = true,
    updated_at = now()
  returning id
)
insert into public.prompt_rules (model_profile_id, rule_key, rule_text, priority)
select profile.id, rules.rule_key, rules.rule_text, rules.priority
from profile
cross join (
  values
    ('clarity', 'Converta o briefing em requisitos objetivos e verificáveis.', 10),
    ('implementation', 'Peça código executável, completo e organizado por arquivos.', 20),
    ('quality', 'Inclua responsividade, acessibilidade, tratamento de estados e foco visível quando aplicável.', 30),
    ('constraints', 'Não invente requisitos que contradigam o briefing.', 40),
    ('assumptions', 'Se faltar uma informação essencial, declare a suposição antes da solução.', 50)
) as rules(rule_key, rule_text, priority)
on conflict (model_profile_id, rule_key) do update set
  rule_text = excluded.rule_text,
  priority = excluded.priority,
  is_active = true;
