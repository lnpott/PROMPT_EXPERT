# Auditoria de fontes exportada do notebook

## Proveniência

- Notebook de referência: `https://notebook.google.com/notebook/5a5161c7-5d60-48e7-ac86-f2887f86d07c`.
- Exportação fornecida diretamente pela pessoa responsável pelo projeto em 6 de setembro de 2026.
- Normalização: o conteúdo recebido continha duas cópias consecutivas da mesma exportação. Esta versão registra uma única cópia lógica, sem repetir o corpus operacional que já está preservado em `base-canonica-regras.md`.
- Escopo: este arquivo registra a auditoria, a classificação das fontes e as lacunas editoriais. O corpus operacional permanece no artefato canônico e na migration correspondente.

> A entrega direta confirma a proveniência do conteúdo do notebook, mas não substitui a validação das afirmações técnicas nas URLs primárias. Como a exportação usa referências numéricas sem incluir a bibliografia ou os links de destino, as regras continuam inativas até a verificação fonte a fonte.

## Classificação das 19 fontes

| # | Fonte | Organização / domínio informado | Classe | Cobertura principal |
|---:|---|---|:---:|---|
| 1 | Azure OpenAI reasoning models | Microsoft / `learn.microsoft.com` | A | APIs, esforço de raciocínio, ferramentas e contexto dos modelos OpenAI no Azure. |
| 2 | Best practices for Claude Code | Anthropic / `code.claude.com` | A | Fluxo agêntico, verificação, `CLAUDE.md` e uso de contexto. |
| 3 | DeepSeek API Docs: Your First API Call | DeepSeek / `api-docs.deepseek.com` | A | Endpoints, modelos e integração inicial. |
| 4 | Diretrizes Técnicas de Engenharia de Prompts | Compilação interna em Markdown | C | Síntese multimodelo e matriz conceitual; exige confirmação em fontes A. |
| 5 | Explore the `.claude` directory | Anthropic / `code.claude.com` | A | Persistência, memória, permissões, hooks, MCP e plugins. |
| 6 | Function Calling | xAI / `docs.x.ai` | A | Ferramentas, esquemas e `tool_choice` no Grok. |
| 7 | QwenLM/Qwen3-Coder | Qwen Team / `github.com/QwenLM` | A | FIM, contexto e parsers de ferramentas. |
| 8 | Grok API Documentation | xAI / `docs.x.ai` | A | Plataforma, custos, contexto e APIs do Grok. |
| 9 | Get started with OpenAI o3-mini | Vercel / `ai-sdk.dev` | B | Integração com AI SDK, Zod e interfaces TypeScript. |
| 10 | Interactions API | Google / `ai.google.dev` | A | Interações persistentes, continuidade e retenção. |
| 11 | Kimi K3 | Moonshot AI / `platform.kimi.ai` | A | Esforço, streaming, JSON Schema e ferramentas dinâmicas. |
| 12 | Llama 3.1 model cards and prompt formats | Meta / `developer.meta.com` | A | Tokens, papéis e formato de prompt. |
| 13 | Prompt engineering | OpenAI / `developers.openai.com` | A | Estruturação, APIs, few-shot, RAG e prompting agêntico. |
| 14 | Prompting Claude Opus 5 | Anthropic / `platform.claude.com` | A | Esforço, verbosidade, subagentes e comportamento. |
| 15 | Responses API | DeepSeek / `api-docs.deepseek.com` | A | Endpoint de respostas, imagens, JSON Schema e itens agênticos. |
| 16 | Structured output | Google Cloud / `docs.cloud.google.com` | A | JSON Schema, enums, complexidade e `propertyOrdering`. |
| 17 | Thinking Mode | DeepSeek / `api-docs.deepseek.com` | A | Pensamento, amostragem e passback em ferramentas. |
| 18 | Upgrading agentic coding with Devstral | Mistral AI / `mistral.ai` | A | Devstral, SWE-bench, prompts e frameworks agênticos. |
| 19 | Context Caching Feature of Kimi API | Moonshot AI / `platform.kimi.ai` | A | Cache automático de prefixo, custo e latência. |

### Política editorial resultante

- Manter como fontes primárias de fabricante as fontes 1–3, 5–8 e 10–19.
- Manter a fonte 9 como fonte institucional de integração, sem elevá-la acima da documentação do fabricante.
- Usar a fonte 4 somente como síntese conceitual; nenhuma afirmação técnica dela deve ser ativada sem confirmação primária.
- Não transformar referências informais, como blogs, Medium ou Reddit, em regras estritas do compilador.

## Achados críticos da auditoria recebida

### 1. `strictJsonSchema` não deve ser emitido

A exportação identifica `strictJsonSchema: true` na raiz como parâmetro não confirmado. A regra normalizada proíbe essa chave e orienta validar o formato oficial do endpoint, incluindo a posição correta de `strict` quando aplicável.

### 2. Hierarquia OpenAI de seis níveis requer validação direta

A precedência de mensagens `developer` sobre `user` é tratada como conceito relevante, mas a taxonomia completa `Root > System > Developer > User > Guideline > No Authority` não deve ser representada como parâmetro literal de API. Sua formulação exata deve ser conferida no Model Spec oficial.

### 3. Não impor faixa de 80–120 linhas ao `CLAUDE.md`

A faixa rígida veio de fontes secundárias. A base canônica registra apenas que não se deve impor um limite artificial não documentado; qualquer recomendação de tamanho precisa ser confirmada na documentação vigente da Anthropic.

### 4. Não confundir Devstral com Codestral FIM

A fonte Mistral presente na exportação cobre Devstral, não a especificação completa de Codestral FIM. O roteamento para FIM não deve ser inferido para Devstral, e os detalhes de Codestral precisam de fonte oficial específica.

### 5. Cache do Grok não está confirmado

O cabeçalho `x-grok-conv-id` e o parâmetro `prompt_cache_key` foram descritos na síntese, mas não aparecem nas fontes oficiais do Grok identificadas na própria auditoria. Eles não devem ser gerados pelo sistema sem validação adicional.

## Conflitos que o futuro compilador deve modelar

- Controles de esforço variam por fornecedor, modelo e endpoint; não deve existir um enum universal aplicado sem tradução.
- Temperatura, `top_p` e penalidades podem ser aceitos, ignorados ou rejeitados conforme o modo de raciocínio.
- Histórico de raciocínio e ferramentas têm contratos diferentes por API; não se deve copiar payloads entre fornecedores.
- Regras de cache dependem do provedor e não podem ser presumidas a partir de APIs compatíveis com OpenAI.
- Instruções para expor cadeia de pensamento detalhada devem ser evitadas; o produto deve pedir resultados e evidências verificáveis.

## Lacunas para pesquisa em fontes primárias

1. Especificação oficial de FIM para Codestral, incluindo endpoint e delimitadores suportados.
2. OpenAI Model Spec para confirmar a formulação e a aplicação da hierarquia de instruções.
3. Prompt caching do Claude no Vertex AI, incluindo configuração, TTL e comportamento regional.
4. Especificação nativa de tool calling do Qwen3-Coder e integração com o parser Hermes.

## Relação com o corpus operacional

O arquivo `base-canonica-regras.md` contém a Parte II recebida na exportação: modelos, regras de prompting, controles de esforço, regras de coding, restrições, anti-patterns, matriz de roteamento e lacunas. Seu checksum continua sendo a identidade do corpus importável. A migration mantém as 12 regras normalizadas como `supplied_unverified` e `is_active = false` até que as fontes primárias sejam registradas e verificadas.
