# Registro de validação das fontes primárias

## Método e limites

- Data da consulta: 6 de setembro de 2026.
- Escopo: localizar a página oficial, confirmar sua identidade e confrontar o tema central atribuído pela exportação do notebook.
- Estados: **Confirmada** (página oficial e tema central encontrados), **Parcial** (fonte oficial localizada, mas nem todas as afirmações/modelos foram confirmados), **Secundária** (não é uma fonte primária) e **Não localizada** (não foi encontrada uma página oficial específica para a alegação).
- Uma resposta HTTP 200 não valida, isoladamente, todas as afirmações atribuídas à página. Nenhuma regra deve ser ativada somente com base neste inventário; a promoção exige vínculo entre regra, evidência e revisão editorial no passo 3.

## Inventário auditado

| # | Fonte exportada | URL oficial consultada | Resultado | Conclusão em 2026-09-06 |
|---:|---|---|---|---|
| 1 | Azure OpenAI reasoning models | [Microsoft Learn](https://learn.microsoft.com/en-us/azure/foundry/openai/how-to/reasoning) | Parcial | A página oficial existe e cobre modelos de raciocínio, APIs e controles de esforço, mas a lista extensa de modelos e valores exportada deve ser validada individualmente por modelo e endpoint. |
| 2 | Best practices for Claude Code | [Claude Code Docs](https://code.claude.com/docs/en/best-practices) | Confirmada | A página oficial cobre o fluxo de trabalho, verificação, contexto e práticas do agente. |
| 3 | DeepSeek API Docs: Your First API Call | [DeepSeek API Docs](https://api-docs.deepseek.com/) | Confirmada | O quickstart oficial existe e documenta endpoint, autenticação e primeira chamada. |
| 4 | Diretrizes Técnicas de Engenharia de Prompts | `base-canonica-regras.md` | Secundária | É uma compilação interna útil para arquitetura, mas não comprova parâmetros ou comportamento de fornecedores. |
| 5 | Explore the `.claude` directory | [Memory](https://code.claude.com/docs/en/memory) e [Settings](https://code.claude.com/docs/en/settings) | Parcial | A documentação oficial confirma arquivos de memória, regras e configurações em `.claude`; o título exato citado na exportação não foi localizado. |
| 6 | Function Calling | [SpaceXAI Docs](https://docs.x.ai/developers/tools/function-calling) | Confirmada | A página oficial documenta ferramentas, schemas e fluxo de function calling no Grok. |
| 7 | Qwen3-Coder | [Repositório oficial](https://github.com/QwenLM/Qwen3-Coder) | Confirmada | O repositório oficial existe e documenta a família Qwen3-Coder; detalhes de tool calling foram validados separadamente na lacuna 4. |
| 8 | Grok API Documentation | [SpaceXAI Docs](https://docs.x.ai/overview) | Confirmada | O portal oficial da API do Grok existe. Alegações específicas de cache continuam sem confirmação nessa fonte. |
| 9 | Get started with OpenAI o3-mini | [Vercel AI SDK](https://ai-sdk.dev/cookbook/guides/o3) | Confirmada — institucional | O guia existe e cobre integração do o3-mini; é fonte da plataforma de integração, não do fabricante do modelo. |
| 10 | Interactions API | [Google AI for Developers](https://ai.google.dev/gemini-api/docs/interactions-overview) | Confirmada | A página oficial da Interactions API existe; retenção e capacidades devem ser relidas antes de qualquer implementação porque são condições de serviço mutáveis. |
| 11 | Kimi K3 | [Kimi API Platform](https://platform.kimi.ai/docs/overview) | Parcial | O portal oficial e o quickstart foram localizados, mas a rota consultada não apresentou uma página específica estável para todas as alegações atribuídas ao Kimi K3. |
| 12 | Llama 3.1 model cards and prompt formats | [Meta for Developers](https://developer.meta.com/ai/docs/model-cards-and-prompt-formats/llama3_1/) | Confirmada | A página oficial de formato de prompt do Llama 3.1 existe; não deve ser usada para inferir automaticamente formatos de versões posteriores. |
| 13 | Prompt engineering | [OpenAI API](https://developers.openai.com/api/docs/guides/prompt-engineering) | Confirmada | O guia oficial existe e cobre hierarquia por papéis, estrutura de prompts e práticas de desenvolvimento. |
| 14 | Prompting Claude Opus 5 | [Claude prompting best practices](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices) | Parcial | Há uma página oficial vigente de boas práticas, mas o título específico exportado e todas as afirmações exclusivas de “Opus 5” não foram confirmados como uma página separada. |
| 15 | Responses API | [DeepSeek Responses API](https://api-docs.deepseek.com/guides/responses_api) | Confirmada | O guia oficial existe e explicita diferenças e campos não suportados; compatibilidade com a Responses API não deve ser presumida como total. |
| 16 | Structured output | [Google Cloud](https://docs.cloud.google.com/gemini-enterprise-agent-platform/models/capabilities/control-generated-output) | Confirmada | A página oficial cobre saída estruturada, schema e ordenação; as regras devem ser limitadas aos endpoints e modelos indicados nela. |
| 17 | Thinking Mode | [DeepSeek API Docs](https://api-docs.deepseek.com/guides/thinking_mode) | Confirmada | A página oficial confirma `reasoning_content` e a necessidade de passback quando a requisição contém `tools`; sem `tools`, o histórico de raciocínio pode ser omitido. |
| 18 | Devstral | [Mistral AI](https://mistral.ai/news/devstral/) | Confirmada | A publicação oficial existe e cobre Devstral. Ela não é evidência suficiente para atribuir FIM à família Devstral. |
| 19 | Context caching do Kimi | [Kimi API Platform](https://platform.kimi.ai/docs/overview) | Não localizada | O portal oficial foi acessado, mas a página específica e o limiar de 256 tokens não foram localizados em uma URL estável; a alegação permanece incerta. |

## Resultado das quatro lacunas prioritárias

### 1. Codestral FIM — parcialmente resolvida

A [referência oficial do endpoint FIM](https://docs.mistral.ai/api/endpoint/fim) confirma o uso de um modelo Codestral e dos campos `prompt` e `suffix`, em que o modelo preenche o conteúdo intermediário. A [página do Codestral](https://docs.mistral.ai/models/codestral-25-08) confirma a família adequada. Isso sustenta o roteamento de Codestral para FIM e refuta a extensão automática desse recurso ao Devstral. Delimitadores internos de tokens não devem ser emitidos pela aplicação sem documentação específica; o contrato REST usa campos de payload.

**Classificação:** confirmada para endpoint/campos; incerta para delimitadores internos de tokens.

### 2. OpenAI Model Spec — resolvida como regra conceitual

O [Model Spec de 18 de agosto de 2026](https://model-spec.openai.com/2026-08-18.html) descreve níveis de autoridade e confirma que mensagens `developer` têm maior autoridade do que mensagens `user` quando ambas existem. A taxonomia é uma regra de comportamento do modelo; ela não autoriza criar papéis JSON inexistentes como `root`, `guideline` ou `no_authority`. A API deve usar somente os papéis documentados pelo endpoint.

**Classificação:** confirmada como hierarquia conceitual; refutada como conjunto de novos papéis de API.

### 3. Prompt caching do Claude no Vertex AI — parcialmente resolvida

A documentação [Claude on Google Cloud](https://platform.claude.com/docs/en/build-with-claude/claude-on-vertex-ai) lista prompt caching entre os recursos suportados e documenta endpoints globais e multirregionais. A documentação geral de [prompt caching](https://platform.claude.com/docs/en/build-with-claude/prompt-caching) confirma `cache_control`, breakpoints e TTLs documentados. Nenhuma dessas páginas sustenta a alegação de que o balanceador roteia preferencialmente para o nó físico que contém um cache quente ou informa tempos de propagação entre regiões.

**Classificação:** suporte ao cache confirmado; roteamento físico e propagação regional continuam incertos.

### 4. Qwen3-Coder tool calling — resolvida para Hermes

A documentação oficial de [Function Calling do Qwen](https://qwen.readthedocs.io/en/latest/framework/function_call.html) recomenda Hermes-style tool use para Qwen3 e apresenta o vLLM com `--tool-call-parser hermes`. A própria página alerta que a geração não é garantida a seguir sempre o protocolo, mesmo com template adequado.

**Classificação:** parser Hermes e formato recomendados estão confirmados; colisões sintáticas dentro de blocos de raciocínio continuam sem garantia formal.

## Decisões editoriais

- Nenhuma das 12 regras do corpus foi ativada durante esta validação.
- `strictJsonSchema` continua proibido como chave de raiz não documentada.
- A hierarquia do Model Spec deve orientar a separação de instruções, sem inventar papéis de payload.
- Devstral não deve ser roteado ao endpoint FIM por inferência a partir de Codestral.
- `x-grok-conv-id` e as alegações de cache do Grok continuam não confirmados.
- O limite exato de 256 tokens atribuído ao cache do Kimi continua não confirmado.
- Afirmações marcadas como parciais ou não localizadas devem continuar `supplied_unverified`.
