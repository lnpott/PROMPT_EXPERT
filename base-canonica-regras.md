# BASE CANÔNICA DE REGRAS: COMPILADOR DE PROMPTS & PAYLOADS (PROMPT OPTIMIZER)

Este documento estabelece o repositório unificado e canônico de conhecimento técnico para o motor de decisão do **Prompt Optimizer**. Todas as diretrizes aqui consolidadas foram extraídas exclusivamente das fontes técnicas primárias oficiais e especificações das plataformas fornecidas no notebook, expurgando de forma rigorosa as premissas refutadas nas auditorias.

---

## A. MODELOS E PLATAFORMAS

### 1. Provedores e Famílias de Modelos Suportados
*   **OpenAI**: GPT-6 Astra, GPT-5 Series (incluindo `gpt-5.6-sol`, `gpt-5.5`, `gpt-5-pro`, `gpt-5-mini`), o1 (incluindo `o1-mini`), o3 (incluindo `o3-mini`, `o3-pro`), o4-mini, gpt-4o e gpt-4o-mini [12, 78, 125, 133].
*   **Anthropic**: Claude Sonnet (Séries 5, 4.6 e 4.5), Claude Opus (Séries 5, 4.8, 4.7 e 4.6) e Claude Haiku (Série 4.5) [164, 174].
*   **Alibaba Cloud (Qwen)**: Qwen3-Coder (incluindo `Qwen3-Coder-Next`, `Qwen3-Coder-480B-A35B-Instruct` e `Qwen3-Coder-30B-A3B-Instruct`) [301].
*   **SpaceXAI (xAI)**: Grok 4.6 [183, 311].
*   **DeepSeek**: DeepSeek-V4-Flash-0731 e DeepSeek-V4-Pro-0813 [671].
*   **Moonshot AI**: Kimi K3 [372].
*   **Meta**: Llama 3.1, 3.2 e 3.3 [387].

### 2. Ambientes e Plataformas de Integração
*   **OpenAI API**: Endpoints `/v1/chat/completions` (Stateless, Legado) e `/v1/responses` (Stateful, Moderno, com armazenamento de sessão por até 30 dias) [6, 188, 189].
*   **Google Cloud's Agent Platform (Vertex AI)**: Hospedagem gerenciada de modelos Claude com suporte a endpoints globais e multi-regionais, controle de segurança via IAM e ADC [168, 178].
*   **Claude Code CLI**: Agente de terminal autônomo com ciclos de execução modular e memória local (`CLAUDE.md`, `.claude/rules/`, `.claude/skills/`) [140, 146].
*   **Motores de Inferência Locais (vLLM / SGLang)**: Orquestradores de inferência de código aberto com analisadores de chamadas de ferramenta (`--tool-call-parser`) e cogitação (`--reasoning-parser`) [279, 642].

---

## B. REGRAS CANÔNICAS DE PROMPTING

### Regra 1: Hierarquia de Instruções de Governança (Instruction Hierarchy)
*   **Fornecedor**: OpenAI
*   **Modelo/Família**: GPT-5, GPT-6 Astra, Séries o1, o3 e o4 [12, 133].
*   **Versão**: Model Spec (2026/08/18) [409].
*   **Plataforma**: OpenAI API / Azure OpenAI [84, 85].
*   **Tipo de Tarefa**: Geral / Alinhamento Comportamental [409, 410].
*   **Regra de Prompting**: As instruções estruturadas pelo desenvolvedor que delimitam o comportamento do sistema e as regras de negócio devem ser passadas de forma isolada e prioritária no papel `developer` (em modelos de raciocínio moderno) [12, 219]. Em caso de conflitos no prompt, a prioridade absoluta segue a ordem de autoridade: `Root` (Políticas OpenAI) > `System` (Plataforma) > `Developer` (Mensagem do desenvolvedor) > `User` (Instruções do usuário final) > `Guideline` (Estilos de formatação globais que podem ser implicitamente ignorados) [219, 419, 428].
*   **Reasoning/Thinking/Effort Aplicável**: Compatível com todos os níveis de raciocínio.
*   **Parâmetros de API Relevantes**: Payload JSON `role: "developer"` [98, 423]. Nos SDKs de transição, o papel `system` é automaticamente remapeado para `developer` ao focar modelos de deliberação profunda [12, 34, 650].
*   **Quando usar**: Sempre que for necessário programar as regras de comportamento do agente de forma que as instruções enviadas pelo usuário final (ex: injeção de prompt) fiquem estritamente subordinadas e incapazes de subverter as regras do sistema [219].
*   **Quando evitar**: Nunca. É a fundação do alinhamento sistêmico [219]. Evite apenas simular papéis não oficiais (como declarar `"no_authority"` no JSON de chamadas) [649].
*   **Fonte**: OpenAI Model Spec, "System and Developer Roles - API" [30, 219].
*   **Evidência**: `[OFICIAL]` [219, 419].
*   **Status**: CURRENT

### Regra 2: Estrutura XML e Regras Negativas Justificadas
*   **Fornecedor**: Anthropic
*   **Modelo/Família**: Claude (Claude Sonnet, Claude Opus) [174, 224].
*   **Versão**: Claude Opus 5, Claude Sonnet 5 [164, 174].
*   **Plataforma**: Anthropic API / Google Cloud Agent Platform [13, 172].
*   **Tipo de Tarefa**: Geral / Raciocínio Agêntico [141, 142].
*   **Regra de Prompting**: Divida as seções do prompt utilizando **tags XML estritas** (ex: `<instructions>`, `<context>`, `<example>`, `<input>`) para demarcar os metadados de forma inequívoca [224]. Configure o papel comportamental no parâmetro `system` nativo, injetando dados, poucos disparos (few-shot) e entradas na mensagem `user` [225]. Restrições comportamentais negativas (o que o agente *não* deve executar) devem sempre vir acompanhadas de uma justificativa racional descrita no próprio prompt para garantir máxima conformidade de resposta [225].
*   **Reasoning/Thinking/Effort Aplicável**: Raciocínio agêntico nativo.
*   **Parâmetros de API Relevantes**: Campo de nível raiz `system` (na API nativa) [225].
*   **Quando usar**: Sempre que estiver orquestrando tarefas de contexto longo ou que exijam a injeção de grandes blocos de dados de referência para separar claramente comandos de conteúdos estruturados [224].
*   **Quando evitar**: Nunca. XML é o formato ideal interpretado de forma otimizada pela família Claude [224].
*   **Fonte**: "claude-code-handbook/Claude-Prompt-Guide.md", "Prompting best practices" [13, 15, 224].
*   **Evidência**: `[OFICIAL]` [224].
*   **Status**: CURRENT

### Regra 3: Ordenação Rígida de Propriedades no Gemini (propertyOrdering)
*   **Fornecedor**: Google
*   **Modelo/Família**: Gemini (Gemini 3.8 Flash, 3.7 Flash, 3.5, 2.5 Pro) [705].
*   **Versão**: Séries Gemini 2.5, 3 e superiores [705].
*   **Plataforma**: Google AI Studio / Google Cloud Agent Platform [230].
*   **Tipo de Tarefa**: Geração de Dados Estruturados (Structured Outputs) [233, 706].
*   **Regra de Prompting**: O prompt de instruções textuais e os exemplos fornecidos (ex: few-shot ou dados para RAG) devem listar e discutir as propriedades do JSON **na exata mesma ordem** declarada na especificação do esquema de API e no vetor de prioridade de campos [233, 708, 712]. Qualquer divergência na sequência de chaves entre as instruções textuais do prompt e o esquema técnico confunde o modelo, provocando saídas truncadas, malformadas ou falhas de parse [708, 712].
*   **Reasoning/Thinking/Effort Aplicável**: Compatível com modo pensamento (`thinking`) ativado.
*   **Parâmetros de API Relevantes**: Payload JSON `response_mime_type: "application/json"`, emparelhado com a chave de prioridade de ordenação `propertyOrdering` declarada dentro do objeto `responseSchema` [707, 714].
*   **Quando usar**: Sempre que for necessário garantir a conformidade de dados JSON estruturados sem desperdiçar tempo e processamento de rede em parsers locais adicionais de correção no cliente [704, 706].
*   **Quando evitar**: Quando a aplicação não exige conformidade sintática rígida ou opera com saídas textuais livres e não estruturadas [709].
*   **Fonte**: "Structured output | Gemini - Google Cloud Documentation", "Using Gemini Structured Outputs... - GDELT" [11, 29, 233].
*   **Evidência**: `[OFICIAL]` [233, 707].
*   **Status**: CURRENT

---

## C. REGRAS DE REASONING / THINKING / EFFORT

### Regra 4: Parametrização e Controle de Esforço Cognitivo (Thinking Effort)
As lógicas de amostragem e a alocação de poder de pensamento intermediário (através de tokens de raciocínio ocultos no contexto) devem ser configuradas de forma distinta por fornecedor e endpoint técnico:

```
[Mapeamento de Payloads do Compilador de Prompts]

   OpenAI (Responses API)     -----> reasoning.effort ("none", "low", "medium", "high", "max") [10]
   OpenAI (Chat API)          -----> reasoning_effort ("none", "low", "medium", "high") [100]
   Anthropic (Claude API)     -----> effort ("low", "medium", "high", "xhigh") [14]
   DeepSeek (Responses API)   -----> reasoning.effort ("none", "low", "medium", "high", "max") [675]
   Kimi (Moonshot API)        -----> reasoning_effort ("low", "high", "max") [376]
```

#### Parâmetros de API e Comportamentos Homologados:

1.  **OpenAI (Chat Completions & Responses)**:
    *   **Configuração**: Campo `reasoning_effort` (no Chat Completions) ou `reasoning.effort` (na Responses API) [10, 100].
    *   **Valores Suportados**: `'none'` (anula a fase de raciocínio para priorizar velocidade), `'minimal'`, `'low'`, `'medium'`, `'high'`, `'xhigh'`, `'max'` [10, 96, 97].
    *   *Comportamento de Amostragem*: **Temperatura e top_p são totalmente ignorados** e anulados de forma automática pelos servidores da OpenAI quando o raciocínio está ativo, mantendo a consistência da árvore lógica de tokens [126, 135].
    *   *Nota*: O `gpt-5-pro` suporta unicamente o nível `'high'` (padrão) [128]. O modelo `o1-mini` não aceita a passagem deste parâmetro, falhando na requisição se fornecido [96].
2.  **Anthropic (Claude API)**:
    *   **Configuração**: Propriedade `effort` no payload de amostragem [14, 229].
    *   **Valores Suportados**: `'low'`, `'medium'`, `'high'`, `'xhigh'` [14, 229].
    *   *Comportamento de Amostragem*: Diferente de outros provedores, no Claude **os parâmetros de amostragem convencionais (temperatura, top_p) continuam ativos** e são aplicados de forma cumulativa com o esforço de pensamento ativado [14, 247].
3.  **DeepSeek API**:
    *   **Configuração**: Chave `reasoning.effort` (na Responses API) ou via chamada combinada contendo `extra_body={"thinking": {"type": "enabled"}}` emparelhada a `reasoning_effort: "high"` (no Chat Completions) [40, 675, 742].
    *   **Mapeamento de Valores**:
        *   Os valores `'low'` ou `'minimal'` ativam o processamento interno de **baixo esforço** [239, 675].
        *   Os valores `'medium'`, `'high'` ou `'xhigh'` ativam o processamento de **alto esforço** [239, 675].
        *   O valor `'max'` aciona a computação cognitiva máxima de **esforço extremo** [239, 675].
    *   *Comportamento de Amostragem*: Temperatura, `top_p` e as penalidades de frequência/presença são **completamente ignoradas** quando o modo pensamento deliberativo está ativo [677, 740].
4.  **Moonshot AI (Kimi K3)**:
    *   **Configuração**: Chave de nível raiz do payload `reasoning_effort` [376].
    *   **Valores Suportados**: `'low'`, `'high'`, `'max'` (padrão ativo de fábrica: `'max'`) [377, 382]. O modelo mantém o modo de pensamento habilitado permanentemente [376].
    *   *Comportamento de Amostragem*: Temperatura é fixa em `1.0`, `top_p` em `0.95`, `n` em `1`, `presence_penalty` e `frequency_penalty` em `0` [382]. **Estes parâmetros devem ser omitidos da requisição** para evitar erros de validação sintática [382].

*   **Evidência**: `[OFICIAL]` [10, 14, 239, 382].
*   **Status**: CURRENT

---

## D. REGRAS DE CODING E AGENTES

### Regra 5: Acoplamento Incondicional do Histórico de Raciocínio (DeepSeek Passback)
*   **Fornecedor**: DeepSeek
*   **Modelo/Família**: DeepSeek-V4 (V4-Flash-0731, V4-Pro-0813) [236, 671].
*   **Versão**: Série V4 (2026) [236].
*   **Plataforma**: DeepSeek API (Chat Completions & Responses API) [237, 670].
*   **Tipo de Tarefa**: Engenharia de Software / Chamada de Ferramentas Agênticas (Tool Calling) [238, 743].
*   **Regra de Prompting**: O compilador de prompts e orquestrador cliente deve capturar o conteúdo técnico retornado no campo `reasoning_content` em cada turno e **reenviá-lo integralmente à API nas requisições consecutivas de múltiplos turnos**. O passback de todos os blocos de raciocínio intermediário é obrigatório e de cumprimento absoluto, mesmo para os turnos agênticos em que o modelo decidiu não invocar nenhuma ferramenta local [238, 743].
*   **Reasoning/Thinking/Effort Aplicável**: Pensamento deliberativo ativo (modo `thinking` habilitado) [237, 740].
*   **Parâmetros de API Relevantes**: Reenvio do objeto estruturado completo da mensagem de assistente no payload: `{"role": "assistant", "content": "...", "reasoning_content": "...", "tool_calls": [...]}` [238, 745].
*   **Quando usar**: Obrigatoriamente em todas as sessões agênticas de engenharia de software que façam uso do parâmetro `tools` com o DeepSeek V4 [238, 743].
*   **Quando evitar**: Em conversas de chat puro que não envolvam ferramentas (onde o reenvio de `reasoning_content` é voluntariamente ignorado pelos servidores, sendo descartável para economizar tráfego) [238, 741]. A omissão de qualquer bloco de raciocínio em sessões com ferramentas ativas resultará na **rejeição imediata da chamada com erro HTTP 400** [238, 743].
*   **Fonte**: "Thinking Mode - DeepSeek API Docs", "Relatório de Auditoria Técnica de APIs" [40, 238].
*   **Evidência**: `[OFICIAL]` [238, 743].
*   **Status**: CURRENT

### Regra 6: Enquadramento de Programação Autônoma e Verificação Empírica
*   **Fornecedor**: OpenAI
*   **Modelo/Família**: GPT-5, o1, o3-mini [220].
*   **Versão**: o3-mini (Lançado em Janeiro de 2025) [218].
*   **Plataforma**: OpenAI API / Azure OpenAI Foundry [221, 650].
*   **Tipo de Tarefa**: Geração de código-fonte / Refatorações complexas [220].
*   **Regra de Prompting**: Enquadre o modelo explicitamente como um **agente de programação autônomo** e forneça exemplos objetivos de como ele deve acionar ferramentas de edição de arquivos estruturados (ex: `apply_patch`) [220]. Instrua o agente a criar testes unitários locais e executar os scripts de validação contra a base modificada, exigindo que ele apresente evidências empíricas de sucesso de teste na resposta, em vez de presumir o acerto da refatoração de forma teórica com base no retorno padrão "Done" emitido pelas ferramentas [220].
*   **Reasoning/Thinking/Effort Aplicável**: Esforço de raciocínio em nível `'medium'` ou `'high'` [222].
*   **Parâmetros de API Relevantes**: Payload estruturado de ferramentas agênticas locais.
*   **Quando usar**: Em sessões agênticas autônomas de engenharia de software destinadas a corrigir bugs em repositórios complexos sem supervisão contínua [220, 253].
*   **Quando evitar**: Em edições triviais de arquivo único onde a verificação local possa ser dispensada por economia de recursos [252].
*   **Fonte**: "Diretrizes Técnicas de Engenharia de Prompts...", "Prompt engineering | OpenAI API" [9, 220].
*   **Evidência**: `[OFICIAL]` [220].
*   **Status**: CURRENT

---

## E. PARÂMETROS E RESTRIÇÕES DE API

Esta seção mapeia os principais parâmetros de cabeçalho e payloads aceitos para gerenciar o cache persistente e o roteamento geográfico estável das requisições agênticas:

### 1. Parâmetros de Gerenciamento de KV Cache e Sessão

| Provedor / API | Parâmetro de Roteamento de Cache (Header HTTP) | Parâmetro de Payload JSON (Request Body) | Limite Mínimo de Ativação do Cache | Comportamento de Invalidação de Cache |
| :--- | :--- | :--- | :--- | :--- |
| **OpenAI (Responses API)** | Não se aplica | `promptCacheKey` (manual) [12] | Automático a partir de 1024 tokens [72] | Alterações em mensagens do histórico de entrada invalidam o cache subsequente [72]. |
| **xAI (Chat Completions)** | `"x-grok-conv-id"` [235, 656] | Não se aplica | Baseado no tamanho e estabilidade do prefixo [248] | Alteração do servidor físico de destino ou falha em manter a chave idêntica [248, 656]. |
| **xAI (Responses API)** | Não se aplica | `"prompt_cache_key"` [235, 656] | Baseado no tamanho e estabilidade do prefixo [248] | Alteração da string identificadora de roteamento ou da ordem de prompts [248, 656]. |
| **Kimi API (Chat)** | Não se aplica | Caching implícito automático [379, 755] | **Acima de 256 tokens** acumulados na requisição de origem [241, 379, 756] | Qualquer inserção de novas ferramentas ou mensagens no meio do prompt estável [241, 248]. |
| **Claude (Vertex AI)** | Não se aplica | Tratado implicitamente pelos endpoints multi-regionais [14, 232, 635] | Variável por modelo [248] | Modificações em prompts longos de sistema ou dados de ferramentas [248]. |

### 2. Controle de Roteamento de Nuvem no Google Cloud Vertex AI (Claude)
*   **Roteamento Estável**: Requisições de longo contexto direcionadas para endpoints multi-regionais (`us` ou `eu`) realizam o balanceamento e direcionam o payload preferencialmente para a região geográfica física que detém a cópia ativa do cache do prompt [14, 232, 635].
*   **Mecanismo de Failover**: Em cenários de congestionamento ou indisponibilidade temporária do nó regional quente, a infraestrutura do Google desvia a requisição automaticamente para outra região ativa dentro da mesma geografia para manter o tempo de atividade da aplicação, sacrificando temporariamente a velocidade e a cobrança reduzida de hit para reter a estabilidade operacional do agente [14, 232].

*   **Evidência**: `[PLATAFORMA]` / `[OFICIAL]` [14, 232, 235, 379].
*   **Status**: CURRENT

---

## F. ANTI-PATTERNS E REGRAS A EVITAR

Devem ser removidas do motor de decisão lógicas obsoletas e práticas prejudiciais de engenharia de prompts mapeadas nesta consolidação:

### 1. Práticas a Eliminar Urgentemente

*   **Parâmetro Inexistente `strictJsonSchema: true`**:
    *   *Erro Comum*: Declaração deste parâmetro na raiz do payload do Chat Completions [644, 660].
    *   *Ação Corretiva*: O compilador deve banir essa chave do payload de envio bruto REST [660]. O parâmetro aceito nativamente pela API OpenAI é `"strict": true`, aninhado especificamente no objeto `json_schema` da propriedade `response_format` [26, 645, 660].
*   **Obrigatoriedade Restrita de 80-120 Linhas do `CLAUDE.md`**:
    *   *Erro Comum*: Enforçar limites artificiais de 80 a 120 linhas para a governança local, gerando alertas desnecessários ao desenvolvedor [652, 661].
    *   *Ação Corretiva*: A recomendação técnica oficial da Anthropic estabelece o limite de teto como **abaixo de 200 linhas** [38, 259, 652]. O compilador de regras deve aplicar o linter apenas contra o teto formal de 200 linhas [661].
*   **Direcionamento do Modelo Devstral para Endpoints FIM (`/v1/fim/completions`)**:
    *   *Erro Comum*: Tentar usar modelos da linha Devstral para completude inteligente rápida na linha de código, o que resultará em erro imediato [666].
    *   *Ação Corretiva*: Os modelos Devstral Small e Medium devem ser mapeados exclusivamente para tarefas textuais sequenciais e orquestração agêntica via `/v1/chat/completions` [244, 634, 666]. Apenas modelos da linha Codestral (ex: `codestral-2508`) devem ser encaminhados para o endpoint de preenchimento de lacunas `/v1/fim/completions` [244, 631, 666].

### 2. Instruções Verbosas de Cadeia de Pensamento (CoT) em o1/o3-mini
*   *Anti-pattern*: Injetar comandos como *"pense passo a passo"* ou *"mostre sua lógica detalhadamente"* ao interagir com modelos de raciocínio profundo da OpenAI ou DeepSeek [1, 220, 250].
*   *Impacto*: Modelos dotados de tokens de pensamento nativos executam a deliberação analítica de forma oculta e automática. Adicionar ordens explícitas de CoT degrada sensivelmente o tempo de processamento inicial, infla o faturamento ocioso de tokens de saída de forma nociva e pode prejudicar o alinhamento de precisão da resposta [1, 216, 220].

*   **Evidência**: `[OFICIAL]` [1, 38, 244, 660].
*   **Status**: CURRENT / DEPRECATED

---

## G. MATRIZ TAREFA → MODELO → PLATAFORMA → CONFIGURAÇÃO

Esta matriz canônica resume a rota lógica recomendada e os parâmetros necessários para o compilador do **Prompt Optimizer** processar as requisições com base no tipo de tarefa:

| Tipo de Tarefa | Complexidade | Modelo Recomendado | Plataforma / Endpoint | Parâmetros de API Chave | Configuração de Esforço (Thinking) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Completude de Código na Linha (FIM)** [244] | Baixa | `codestral-2508` [244] | Mistral API (`/v1/fim/completions`) [244] | `{ "prompt": "<prefix>", "suffix": "<suffix>" }` [266, 631] | Não aplicável (latência ultrabaixa) [244, 252]. |
| **Refatoração Complexa Multi-Arquivo** [252] | Alta | `o3-mini` [252] | OpenAI API (`/v1/responses`) [221, 253] | `{ "reasoning_effort": "high" }`, reativação de tags Markdown via developer prompt [136, 222, 251]. | `'high'` [222]. |
| **Agente de Engenharia SWE-Bench** [214] | Alta | `devstral-small-2507` (v1.1) [213, 244] | OpenHands / Mistral API (`/v1/chat/completions`) [244, 634] | Suporte intercambiável a XML agêntico e esquemas JSON [244, 247]. | Médio nativo (`devstral` opera sem tokens ocultos convencionais) [244]. |
| **Refatoração Baseada em Contexto Longo** [168] | Alta | `claude-sonnet-5` [164, 168] | Google Cloud Agent Platform [168] | Mapeamento via endpoints globais, variável de ambiente `ENABLE_PROMPT_CACHING_1H=1` se TTL estendido de cache for justificado [161, 636]. | Ativo (Thinking habilitado por padrão) [177, 621]. |
| **Chamada de Ferramenta Agêntica Múltiplos Turnos** [238] | Média | `deepseek-v4-pro` [238] | DeepSeek API (`/responses` ou `/chat/completions`) [237] | Passback absoluto obrigatório de todo `reasoning_content` gerado nos turnos anteriores para evitar HTTP 400 [238, 743]. | `'high'` ou `'max'` [239]. |
| **Processamento de Grandes Bases com Cache Estável** [240] | Alta | `kimi-k3` [240] | Kimi API Platform [240] | `{ "reasoning_effort": "max" }`, injeção de base estática > 256 tokens no início para ativação do cache automático [240, 241, 379]. | `'max'` (padrão) [240]. |

---

## H. LACUNAS E ITENS INCERTOS

Os seguintes pontos técnicos carecem de documentação formal de referência por parte dos respectivos fabricantes, demandando validação empírica contínua do sistema:

### 1. Tempos de Propagação do KV Cache na Nuvem (Google Cloud)
`[INCERTO]` Embora a infraestrutura de endpoints globais e multi-regionais do Vertex AI garanta que requisições longas são roteadas preferencialmente para a região que detém o cache quente [14, 232, 635], as documentações não especificam:
*   Os tempos máximos ou latências de sincronização do KV cache entre nós geográficos vizinhos.
*   A persistência ou vida útil do cache quando ocorrem desvios de tráfego por load-balancing ativo do Google [14, 232].

### 2. Colisão Sintática de Tags de Pensamento no vLLM com Qwen3
`[INCERTO]` Não existe especificação formal ou garantia documentada descrevendo como o parser de inferência integrado do vLLM (`--reasoning-parser qwen3`) reage caso o modelo decida gerar, de forma estritamente didática ou ilustrativa (ex: simulando um exemplo de resposta para o usuário), caracteres idênticos às tags estruturadas de controle (ex: `<tool_call>` ou `<think>`) dentro de seu bloco ativo de reflexões `<think> ... </think>` [17, 18, 21]. Há risco iminente de processamento fantasma de ferramentas cliente ou quebras de parsing no servidor local [21, 667].

---

*Esta base de regras constitui a especificação conceitual definitiva do Prompt Optimizer. Nenhuma inferência ou dado de canais de terceiros foi introduzido para preencher lacunas, garantindo a rastreabilidade absoluta de todas as conclusões técnicos expostas.*
