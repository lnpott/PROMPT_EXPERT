# Auditoria metodológica — Passo 20

- Corpus: `1.0.0`
- Revisão: `2026-09-12`
- Escopo: nove targets existentes; nenhum provider/model operacional.
- Estado remoto nesta execução: leitura pública indisponível por `ENETUNREACH`; o inventário remoto mais recente versionado no Passo 19.1 (Grok: 5 regras ativas; demais profiles: ausentes; exemplos: 0) foi tratado como histórico, nunca como conteúdo verificado de runtime.

## Inventário e cobertura

| Target | Profile local | Regras oficiais | Regras empíricas gerais | Heurísticas ativas | Não verificadas ativas | Exemplos revisados | Cobertura | Lacunas |
|---|---:|---:|---:|---:|---:|---:|---|---|
| `grok` | sim | 2 | 4 | 0 | 0 | 2 | target + baseline; debug/application | sem regras específicas de versão; examples ainda sem validação de Production |
| `openai` | sim | 2 | 4 | 0 | 0 | 2 | target + baseline; debug/application | sem regras específicas de versão; examples ainda sem validação de Production |
| `claude` | sim | 2 | 4 | 0 | 0 | 2 | target + baseline; debug/application | sem regras específicas de versão; examples ainda sem validação de Production |
| `gemini` | sim | 2 | 4 | 0 | 0 | 2 | target + baseline; debug/application | sem regras específicas de versão; examples ainda sem validação de Production |
| `deepseek` | sim | 2 | 4 | 0 | 0 | 2 | target + baseline; debug/application | sem regras específicas de versão; examples ainda sem validação de Production |
| `qwen` | sim | 2 | 4 | 0 | 0 | 2 | target + baseline; debug/application | sem regras específicas de versão; examples ainda sem validação de Production |
| `codestral` | sim | 2 | 4 | 0 | 0 | 2 | target + baseline; debug/application | sem regras específicas de versão; examples ainda sem validação de Production |
| `kimi` | sim | 2 | 4 | 0 | 0 | 2 | target + baseline; debug/application | sem regras específicas de versão; examples ainda sem validação de Production |
| `llama` | sim | 2 | 4 | 0 | 0 | 2 | target + baseline; debug/application | sem regras específicas de versão; examples ainda sem validação de Production |

As cinco regras Grok originalmente semeadas são classificadas como `PROJECT_HEURISTIC`: úteis como histórico, mas sem proveniência por regra e, por isso, não são carregadas. As 12 `canonical_prompt_rules` continuam `supplied_unverified`, inativas e fora do runtime. Não foram apagadas nem promovidas.

### Revisão das cinco regras Grok históricas

| rule_key | Classificação | Duplicação/escopo | Decisão |
|---|---|---|---|
| `clarity` | PROJECT_HEURISTIC | genérica; duplicada por `general-objective` | preservar no banco como histórico; não carregar |
| `implementation` | PROJECT_HEURISTIC | genérica; inadequada para toda tarefa/FIM | substituir no corpus por entrega proporcional e task-scoped |
| `quality` | PROJECT_HEURISTIC | genérica; acessibilidade/UI apenas quando aplicável | substituir por `general-safety` condicionado |
| `constraints` | PROJECT_HEURISTIC | genérica; duplicada por `general-preserve-intent` | preservar no banco como histórico; não carregar |
| `assumptions` | PROJECT_HEURISTIC | genérica; duplicada por `general-preserve-intent` | preservar no banco como histórico; não carregar |

Nenhuma das cinco conflita diretamente com fonte oficial, mas nenhuma possui proveniência suficiente para `VERIFIED_OFFICIAL` ou `VERIFIED_EMPIRICAL`. As regras oficiais Grok novas ficam restritas a ferramentas; não se extrapolou uma preferência universal de estilo a partir da documentação da API.

## Matriz de proveniência das regras

| Regra | Target/escopo | Fonte | Tipo | Verificada em | Status | Runtime |
|---|---|---|---|---|---|---|
| `general-objective` | geral | `project-quality-baseline` — PROJECT_GUIDE.md | internal_empirical | 2026-09-12 | VERIFIED_EMPIRICAL | sim |
| `general-preserve-intent` | geral | `project-quality-baseline` — PROJECT_GUIDE.md | internal_empirical | 2026-09-12 | VERIFIED_EMPIRICAL | sim |
| `general-verification` | geral | `project-quality-baseline` — PROJECT_GUIDE.md | internal_empirical | 2026-09-12 | VERIFIED_EMPIRICAL | sim |
| `general-safety` | geral | `project-quality-baseline` — PROJECT_GUIDE.md | internal_empirical | 2026-09-12 | VERIFIED_EMPIRICAL | sim |
| `grok-tool-schema` | `grok` | [xai-function-calling](https://docs.x.ai/developers/tools/function-calling) | official | 2026-09-12 | VERIFIED_OFFICIAL | sim |
| `grok-tool-results` | `grok` | [xai-function-calling](https://docs.x.ai/developers/tools/function-calling) | official | 2026-09-12 | VERIFIED_OFFICIAL | sim |
| `openai-instruction-boundary` | `openai` | [openai-prompt-engineering](https://developers.openai.com/api/docs/guides/prompt-engineering) | official | 2026-09-12 | VERIFIED_OFFICIAL | sim |
| `openai-agent-verification` | `openai` | [openai-prompt-engineering](https://developers.openai.com/api/docs/guides/prompt-engineering) | official | 2026-09-12 | VERIFIED_OFFICIAL | sim |
| `claude-xml-boundaries` | `claude` | [claude-prompting](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices) | official | 2026-09-12 | VERIFIED_OFFICIAL | sim |
| `claude-positive-directions` | `claude` | [claude-prompting](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices) | official | 2026-09-12 | VERIFIED_OFFICIAL | sim |
| `gemini-output-contract` | `gemini` | [gemini-prompting](https://ai.google.dev/gemini-api/docs/prompting-strategies) | official | 2026-09-12 | VERIFIED_OFFICIAL | sim |
| `gemini-context-order` | `gemini` | [gemini-prompting](https://ai.google.dev/gemini-api/docs/prompting-strategies) | official | 2026-09-12 | VERIFIED_OFFICIAL | sim |
| `deepseek-no-reasoning-request` | `deepseek` | [deepseek-thinking](https://api-docs.deepseek.com/guides/thinking_mode) | official | 2026-09-12 | VERIFIED_OFFICIAL | sim |
| `deepseek-tool-continuity` | `deepseek` | [deepseek-thinking](https://api-docs.deepseek.com/guides/thinking_mode) | official | 2026-09-12 | VERIFIED_OFFICIAL | sim |
| `qwen-tool-schema` | `qwen` | [qwen-function-calling](https://qwen.readthedocs.io/en/latest/framework/function_call.html) | official | 2026-09-12 | VERIFIED_OFFICIAL | sim |
| `qwen-runtime-template` | `qwen` | [qwen-function-calling](https://qwen.readthedocs.io/en/latest/framework/function_call.html) | official | 2026-09-12 | VERIFIED_OFFICIAL | sim |
| `codestral-fim-fields` | `codestral` | [mistral-fim](https://docs.mistral.ai/api/endpoint/fim) | official | 2026-09-12 | VERIFIED_OFFICIAL | sim |
| `codestral-no-forced-fim` | `codestral` | [mistral-fim](https://docs.mistral.ai/api/endpoint/fim) | official | 2026-09-12 | VERIFIED_OFFICIAL | sim |
| `kimi-context-boundary` | `kimi` | [kimi-overview](https://platform.kimi.ai/docs/overview) | official | 2026-09-12 | VERIFIED_OFFICIAL | sim |
| `kimi-no-cache-assumption` | `kimi` | [kimi-overview](https://platform.kimi.ai/docs/overview) | official | 2026-09-12 | VERIFIED_OFFICIAL | sim |
| `llama-runtime-roles` | `llama` | [llama-prompt-format](https://developer.meta.com/ai/docs/model-cards-and-prompt-formats/llama3_1/) | official | 2026-09-12 | VERIFIED_OFFICIAL | sim |
| `llama-no-special-token-copy` | `llama` | [llama-prompt-format](https://developer.meta.com/ai/docs/model-cards-and-prompt-formats/llama3_1/) | official | 2026-09-12 | VERIFIED_OFFICIAL | sim |

## Matriz de proveniência dos exemplos

| Exemplo | Target | taskType | Fonte/rationale | Verificada em | Status | Runtime |
|---|---|---|---|---|---|---|
| `grok-debug-01` | `grok` | `debug` | [xai-function-calling](https://docs.x.ai/developers/tools/function-calling); Exemplo editorial revisado que aplica a orientação oficial de grok a uma tarefa debug, mantendo requisitos verificáveis. | 2026-09-12 | VERIFIED_EMPIRICAL | no máximo 1 em match exato |
| `grok-application-01` | `grok` | `application` | [xai-function-calling](https://docs.x.ai/developers/tools/function-calling); Exemplo editorial revisado que aplica a orientação oficial de grok a uma tarefa application, mantendo requisitos verificáveis. | 2026-09-12 | VERIFIED_EMPIRICAL | no máximo 1 em match exato |
| `openai-debug-01` | `openai` | `debug` | [openai-prompt-engineering](https://developers.openai.com/api/docs/guides/prompt-engineering); Exemplo editorial revisado que aplica a orientação oficial de openai a uma tarefa debug, mantendo requisitos verificáveis. | 2026-09-12 | VERIFIED_EMPIRICAL | no máximo 1 em match exato |
| `openai-application-01` | `openai` | `application` | [openai-prompt-engineering](https://developers.openai.com/api/docs/guides/prompt-engineering); Exemplo editorial revisado que aplica a orientação oficial de openai a uma tarefa application, mantendo requisitos verificáveis. | 2026-09-12 | VERIFIED_EMPIRICAL | no máximo 1 em match exato |
| `claude-debug-01` | `claude` | `debug` | [claude-prompting](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices); Exemplo editorial revisado que aplica a orientação oficial de claude a uma tarefa debug, mantendo requisitos verificáveis. | 2026-09-12 | VERIFIED_EMPIRICAL | no máximo 1 em match exato |
| `claude-application-01` | `claude` | `application` | [claude-prompting](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices); Exemplo editorial revisado que aplica a orientação oficial de claude a uma tarefa application, mantendo requisitos verificáveis. | 2026-09-12 | VERIFIED_EMPIRICAL | no máximo 1 em match exato |
| `gemini-debug-01` | `gemini` | `debug` | [gemini-prompting](https://ai.google.dev/gemini-api/docs/prompting-strategies); Exemplo editorial revisado que aplica a orientação oficial de gemini a uma tarefa debug, mantendo requisitos verificáveis. | 2026-09-12 | VERIFIED_EMPIRICAL | no máximo 1 em match exato |
| `gemini-application-01` | `gemini` | `application` | [gemini-prompting](https://ai.google.dev/gemini-api/docs/prompting-strategies); Exemplo editorial revisado que aplica a orientação oficial de gemini a uma tarefa application, mantendo requisitos verificáveis. | 2026-09-12 | VERIFIED_EMPIRICAL | no máximo 1 em match exato |
| `deepseek-debug-01` | `deepseek` | `debug` | [deepseek-thinking](https://api-docs.deepseek.com/guides/thinking_mode); Exemplo editorial revisado que aplica a orientação oficial de deepseek a uma tarefa debug, mantendo requisitos verificáveis. | 2026-09-12 | VERIFIED_EMPIRICAL | no máximo 1 em match exato |
| `deepseek-application-01` | `deepseek` | `application` | [deepseek-thinking](https://api-docs.deepseek.com/guides/thinking_mode); Exemplo editorial revisado que aplica a orientação oficial de deepseek a uma tarefa application, mantendo requisitos verificáveis. | 2026-09-12 | VERIFIED_EMPIRICAL | no máximo 1 em match exato |
| `qwen-debug-01` | `qwen` | `debug` | [qwen-function-calling](https://qwen.readthedocs.io/en/latest/framework/function_call.html); Exemplo editorial revisado que aplica a orientação oficial de qwen a uma tarefa debug, mantendo requisitos verificáveis. | 2026-09-12 | VERIFIED_EMPIRICAL | no máximo 1 em match exato |
| `qwen-application-01` | `qwen` | `application` | [qwen-function-calling](https://qwen.readthedocs.io/en/latest/framework/function_call.html); Exemplo editorial revisado que aplica a orientação oficial de qwen a uma tarefa application, mantendo requisitos verificáveis. | 2026-09-12 | VERIFIED_EMPIRICAL | no máximo 1 em match exato |
| `codestral-debug-01` | `codestral` | `debug` | [mistral-fim](https://docs.mistral.ai/api/endpoint/fim); Exemplo editorial revisado que aplica a orientação oficial de codestral a uma tarefa debug, mantendo requisitos verificáveis. | 2026-09-12 | VERIFIED_EMPIRICAL | no máximo 1 em match exato |
| `codestral-application-01` | `codestral` | `application` | [mistral-fim](https://docs.mistral.ai/api/endpoint/fim); Exemplo editorial revisado que aplica a orientação oficial de codestral a uma tarefa application, mantendo requisitos verificáveis. | 2026-09-12 | VERIFIED_EMPIRICAL | no máximo 1 em match exato |
| `kimi-debug-01` | `kimi` | `debug` | [kimi-overview](https://platform.kimi.ai/docs/overview); Exemplo editorial revisado que aplica a orientação oficial de kimi a uma tarefa debug, mantendo requisitos verificáveis. | 2026-09-12 | VERIFIED_EMPIRICAL | no máximo 1 em match exato |
| `kimi-application-01` | `kimi` | `application` | [kimi-overview](https://platform.kimi.ai/docs/overview); Exemplo editorial revisado que aplica a orientação oficial de kimi a uma tarefa application, mantendo requisitos verificáveis. | 2026-09-12 | VERIFIED_EMPIRICAL | no máximo 1 em match exato |
| `llama-debug-01` | `llama` | `debug` | [llama-prompt-format](https://developer.meta.com/ai/docs/model-cards-and-prompt-formats/llama3_1/); Exemplo editorial revisado que aplica a orientação oficial de llama a uma tarefa debug, mantendo requisitos verificáveis. | 2026-09-12 | VERIFIED_EMPIRICAL | no máximo 1 em match exato |
| `llama-application-01` | `llama` | `application` | [llama-prompt-format](https://developer.meta.com/ai/docs/model-cards-and-prompt-formats/llama3_1/); Exemplo editorial revisado que aplica a orientação oficial de llama a uma tarefa application, mantendo requisitos verificáveis. | 2026-09-12 | VERIFIED_EMPIRICAL | no máximo 1 em match exato |

## Auditoria e decisões

- **Precedência:** modelo/versão explicitamente selecionado → target/família → geral → fallback seguro. Em conflito, vence maior precedência; no mesmo escopo, menor prioridade numérica e então ID lexical.
- **Task type:** regras declaram escopo. Codestral FIM só entra em `fim`; fora disso a regra explícita proíbe transformar a tarefa em FIM. Regras de ferramentas só entram nos tipos pertinentes.
- **Examples:** 18 exemplos locais, dois por target (`debug` e `application`), todos `VERIFIED_EMPIRICAL`, ativos e revisados. A seleção exige target e taskType exatos, limita a um exemplo e 3.500 caracteres, e instrui não copiar fatos/requisitos.
- **Fail closed:** somente `VERIFIED_OFFICIAL` e `VERIFIED_EMPIRICAL` entram no runtime. `UNVERIFIED`, `PROJECT_HEURISTIC`, `DEPRECATED` e `CONFLICTING` ficam excluídos.
- **Chain-of-thought:** nenhuma regra ou exemplo solicita raciocínio interno. O corpus pede evidência observável.
- **Schema:** nenhuma migration é necessária para o corpus versionado. Popular as tabelas remotas exigiria uma migration futura para proveniência de `prompt_rules` e `prompt_examples`; isso não é necessário nem autorizado para o runtime local deste passo.
- **Manutenção:** revisar URLs/status trimestralmente ou após mudança documentada do provider; alterar corpus e testes no mesmo PR; nunca promover conteúdo sem source, data e revisão.

## Recomendação

O corpus local está pronto para uso e os examples estão integrados sob política explícita. **Production não deve ser populada ainda**: primeiro revisar editorialmente os 18 prompts com avaliação humana por target e projetar o vínculo normalizado de proveniência no schema. Nenhuma autorização remota é solicitada neste passo.

## Extensão auditada — Passo 20.2

A releitura do repositório e do Supabase confirmou que a autoridade efetivamente usada pelo runtime é o corpus local versionado, não `model_profiles`, `prompt_rules`, `prompt_examples`, `canonical_prompt_rules` ou `ai_models`. Em Production há um profile Grok, cinco regras históricas ativas sem classificação de proveniência no próprio schema, zero examples e 12 regras canônicas inativas. `ai_models` é somente catálogo operacional e não foi reutilizado como autoridade metodológica.

O repositório contém `base-canonica-regras.md`, `notebook-auditoria-fontes.md` e referências a um notebook Google. Esses exports provam que houve uma consolidação declarada a partir de materiais fornecidos, mas não permitem verificar a sessão, cadeia de custódia ou conteúdo original do NotebookLM. **NÃO FOI POSSÍVEL CONFIRMAR** a origem NotebookLM de forma independente. Nada foi promovido por essa alegação.

Foram adicionados targets específicos somente como identidades metodológicas que herdam famílias já verificadas. Não foi criada diferença por versão sem fonte. Todos os novos targets possuem zero regras próprias e herdam a família. A fonte Llama 3.1 é específica de versão, mas as regras históricas continuam no nó familiar para preservar o comportamento anterior; refinar esse escopo exige uma revisão separada, em vez de inferir novos contrastes nesta etapa.

Examples continuam sendo selecionados pelo `taskType` exato e pelo ancestral metodológico mais próximo. O runtime não injeta mais o conteúdo do example no prompt: inclui apenas uma referência de estrutura e uma proibição explícita de copiar linguagem, framework, banco, arquitetura, ferramenta, biblioteca ou requisito. Assim, examples não se tornam uma segunda fonte de requisitos.
