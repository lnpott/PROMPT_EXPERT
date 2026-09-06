# PROMPT_EXPERT — Guia vivo do projeto

## Propósito

O PROMPT_EXPERT transforma uma descrição comum de um produto ou funcionalidade em um prompt de programação claro, completo e adaptado ao modelo de destino. A versão funcional suporta nove perfis: Grok, GPT/Codex, Claude, Gemini, DeepSeek, Qwen3-Coder, Codestral, Kimi e Llama.

O produto não é um arquivo de prompt estático. A pessoa descreve o que quer construir em linguagem natural; o sistema aplica um perfil de modelo e regras de qualidade para produzir um prompt pronto para copiar.

## Princípios do produto

- Começar pequeno, validar o fluxo e ampliar em etapas.
- Não exigir API, conta ou banco de dados para provar a experiência principal.
- Tratar os perfis de modelo, regras e exemplos como conteúdo versionado e auditável.
- Nunca expor chaves privadas no front-end, no repositório ou em documentos.
- Registrar decisões, implementação e validação neste arquivo.

## Estado atual

### Implementado

- Página local responsiva do Prompt Expert.
- Campo para a pessoa descrever o que quer construir.
- Seletor de modelo com Grok como primeiro perfil.
- Geração local de um prompt estruturado para desenvolvimento front-end.
- Botão para copiar o prompt gerado.
- Projeto Vite pronto para desenvolvimento e build de produção.
- Projeto Supabase exclusivo criado na região de São Paulo.
- Estrutura versionada de banco para perfis de modelo, regras e exemplos.
- Leitura pública limitada a registros ativos; escrita bloqueada para visitantes.
- Configuração de build da Vercel e modelo de variáveis de ambiente versionados.
- Função de backend `/api/generate`, que combina o briefing, o perfil Grok e as regras ativas antes de chamar a Gemini.
- Endpoint `/api/health` para diagnóstico da disponibilidade da base e da configuração da Gemini.
- Perfil Grok inicial e cinco regras de qualidade persistidos no Supabase.
- Testes automatizados de acesso aos endpoints, cobrindo método permitido, validação de entrada, configuração, dependências disponíveis e modo degradado.
- Dependências instaladas removidas do versionamento para que a Vercel instale os binários corretos para Linux durante o build.
- Produção pública na Vercel, com as funções `/api/health` e `/api/generate` ativas.
- Base canônica de regras recebida como `base-canonica-regras.md`, versionada com checksum e normalizada em uma migration de corpus auditável.
- Auditoria completa do notebook normalizada em `notebook-auditoria-fontes.md`, com inventário das 19 fontes, achados críticos e lacunas de pesquisa, sem duplicar o bloco repetido na exportação recebida.
- Migration do corpus canônico aplicada no Supabase remoto, com uma fonte e 12 regras editoriais preservadas como não verificadas e inativas.
- Registro de validação das 19 fontes criado em `fontes-primarias-validadas.md`, com URLs oficiais, resultados por fonte e decisões editoriais.
- Compilador local determinístico para nove perfis, disponível sem chave de API, conta ou banco.
- Seleção de tipo de tarefa e complexidade, com instruções especializadas por fornecedor.
- Endpoint `/api/profiles` para descoberta segura dos perfis públicos.
- Geração aprimorada opcional pela Gemini, com fallback automático para o compilador local.
- Proteções iniciais de produção: limite por cliente, timeout, retry com `Retry-After`, identificador de requisição e logs sanitizados.

### Validado

- Build de produção executado com sucesso.
- Fluxo principal testado no navegador: informar uma ideia, gerar o prompt e habilitar a cópia.
- Sincronização inicial do repositório com a branch principal do GitHub concluída em marco anterior; a divergência atual de escrita está registrada abaixo.
- Verificação de segurança do Supabase concluída sem alertas para a estrutura inicial.
- Perfil Grok e cinco regras iniciais carregados e consultados com sucesso pela função de backend.
- Fluxo local testado após a integração: o modo-base continua disponível fora da Vercel ou enquanto a chave Gemini não existe.
- Geração completa validada com Gemini Flash 3.8, perfil Grok e regras armazenadas no Supabase.
- Testes de acesso da API executados localmente com serviços externos simulados, sem usar credenciais reais.
- Acesso externo ao GitHub, Supabase e Gemini verificado em 5 de setembro de 2026; as limitações encontradas na Vercel estão registradas nas evidências abaixo.
- Build de Preview da Vercel corrigido e concluído com sucesso após remover `node_modules` do versionamento.
- Produção validada em 6 de setembro de 2026 em `https://prompt-expert-blush.vercel.app`: `/api/health` retornou `status: ok`, perfil `Grok` e Gemini configurado; `/api/generate` retornou um prompt por Gemini com sucesso.
- Testes de integridade confirmam o checksum da base canônica e que suas 12 regras importadas permanecem inativas até validação primária por fornecedor.
- Exportação textual do notebook recebida diretamente em 6 de setembro de 2026; a proveniência do conteúdo foi confirmada, mas as referências numéricas ainda não possuem URLs correspondentes e não autorizam ativação automática das regras.
- Corpus remoto auditado com acesso administrativo e público: uma fonte e 12 regras existem, todas as regras estão `supplied_unverified` e inativas, a leitura anônima retorna zero registros e a escrita anônima é rejeitada.
- Quatro lacunas prioritárias pesquisadas em documentação oficial: Codestral FIM e Qwen Hermes foram confirmados; a hierarquia do OpenAI Model Spec foi confirmada como conceitual; cache regional do Claude e cache do Kimi permanecem parcialmente ou não confirmados.
- Fluxo sem credenciais validado por testes: os nove perfis compilam prompts completos localmente e a indisponibilidade do Supabase ou da Gemini não interrompe o produto.

### Não bloqueia a versão funcional

- Histórico de gerações e avaliação de qualidade dos prompts.
- Área administrativa para alimentar a base a partir do notebook.
- Autenticação de usuários.

Esses itens permanecem como evolução administrativa. A experiência principal de compilar e copiar prompts não depende deles nem de chaves externas.

## Estado funcional consolidado

A aplicação está pronta para uso local sem configuração externa. Na Vercel, a única chave privada necessária para habilitar o aprimoramento por IA é `GEMINI_API_KEY`; sem ela, `/api/generate` responde pelo compilador local. As variáveis `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` são opcionais para trocar a base pública de perfis. A auditoria consolidada de código e interface foi registrada e deverá ser confirmada no Preview antes do merge.

O parecer e os riscos aceitos desta entrega estão em `AUDITORIA_FINAL.md`. Autenticação, histórico e administração permanecem fora do fluxo público até existir uma política de retenção; não bloqueiam a compilação e a cópia de prompts.

## Arquitetura planejada

```text
Pessoa usuária
    ↓ descreve a necessidade
Interface web na Vercel
    ↓ consulta perfil e regras
Supabase
    ↓ quando habilitado
Servidor seguro / função de backend
    ↓ usa chave privada
API de IA escolhida
    ↓
Prompt estruturado para o modelo de destino
```

### Responsabilidades

| Camada | Responsabilidade |
| --- | --- |
| Interface | Coletar o briefing, escolher o modelo e exibir/copiar o prompt. |
| Supabase | Guardar perfis de modelos, regras, exemplos e futuramente histórico. |
| Backend | Proteger chaves e chamar a API de IA. |
| Vercel | Publicar a aplicação e executar o backend quando necessário. |
| GitHub | Versionar o código, documentação e mudanças auditáveis. |

## Marcos concluídos

| Etapa | Entrega | Estado |
| --- | --- | --- |
| 1 | Definir o produto, público e fluxo principal. | Concluída |
| 2 | Criar e validar o MVP local de geração para Grok. | Concluída |
| 3 | Versionar guia vivo, configuração Vercel e estrutura Supabase. | Concluída |
| 4 | Importar `PROMPT_EXPERT` do GitHub na Vercel e validar o primeiro deploy. | Concluída: `main` sincronizado e deployment de produção validado |
| 5 | Cadastrar a chave Gemini secreta na Vercel. | Concluída em Preview e Production |
| 6 | Conectar a interface à função segura, aos perfis e às regras do Supabase. | Concluída e validada localmente |
| 7 | Revisar e importar a base do notebook como conteúdo auditado. | Exportação recebida, deduplicada e versionada; migration preparada, pendente de aplicação administrativa e validação por fontes primárias |
| 8 | Criar uma área administrativa protegida para atualizar a base. | Pendente |
| 9 | Escolher a API de IA e implementar a geração segura no backend. | Concluída e validada em produção com Gemini Flash 3.8 |
| 10 | Executar validação de qualidade, segurança e publicação de produção. | Concluída para o deployment de produção atual |

## Próximos dez passos

Os próximos passos transformam o MVP publicado em um produto auditável, protegido e extensível. Cada passo deve ser implementado em branch própria e só pode ser marcado como concluído depois da auditoria, do commit e do pull request correspondentes.

| Passo | Entrega | Critérios de aceite | Auditoria obrigatória | Commit sugerido | PR sugerido | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Aplicar o corpus canônico no Supabase. | Criar `knowledge_sources` e `canonical_prompt_rules`; importar uma fonte e 12 regras; manter `supplied_unverified` e `is_active = false`; impedir leitura pública desses registros. | Conferir contagens com acesso administrativo, testar RLS com chave pública, revisar grants, registrar rollback e executar a suíte local. | `feat(database): apply canonical knowledge corpus` | `Aplica corpus canônico inativo no Supabase` | Concluído |
| 2 | Validar as fontes primárias. | Registrar URL direta, fornecedor, título, data de consulta, escopo e regras relacionadas; classificar cada afirmação como confirmada, refutada, obsoleta ou incerta. | Verificar domínio oficial e suporte direto de cada fonte; priorizar Codestral FIM, OpenAI Model Spec, cache do Claude no Vertex AI e tool calling do Qwen3-Coder. | `docs(knowledge): validate primary prompt sources` | `Valida fontes primárias da base de conhecimento` | Em revisão |
| 3 | Modelar proveniência e revisão editorial. | Criar migration para fontes, versões, revisões, responsáveis e relação fonte-regra; preservar histórico; bloquear escrita pública. | Revisar constraints, integridade referencial, RLS, grants, aplicação e rollback; adicionar testes estáticos da migration. | `feat(knowledge): add source verification model` | `Adiciona proveniência verificável às regras` | Pendente |
| 4 | Ativar somente regras verificadas e aplicáveis ao Grok. | Promover apenas regras sustentadas por fontes oficiais e explicitamente compatíveis com Grok; registrar justificativa por ativação. | Comparar prompts antes e depois, verificar contradições, custo e aderência e confirmar que regras de outros fornecedores não foram aplicadas indevidamente. | `feat(knowledge): activate verified grok rules` | `Ativa regras verificadas do perfil Grok` | Pendente |
| 5 | Proteger o endpoint de geração. | Adicionar rate limit, quota, timeouts, limite de resposta, backoff com jitter e tratamento de `Retry-After`. | Testar abuso, concorrência, timeout, falha de fornecedor, proteção de custo e ausência de segredos; ampliar `test/api-access.test.js`. | `feat(api): add generation safeguards` | `Protege geração contra abuso e indisponibilidade` | Pendente |
| 6 | Adicionar observabilidade segura. | Gerar identificador de requisição e métricas de status, duração, fornecedor, retry e fallback sem armazenar briefing, prompt ou credenciais. | Inspecionar logs reais na Vercel, testar sanitização e documentar acesso e retenção dos registros. | `feat(observability): add sanitized request telemetry` | `Adiciona telemetria segura às funções` | Pendente |
| 7 | Criar avaliação reproduzível da qualidade dos prompts. | Versionar briefings sem dados pessoais e medir aderência, clareza, completude, suposições, requisitos e critérios de aceite. | Comparar fallback local e geração integrada, medir regressões e custos e registrar modelo, perfil e regras utilizados. | `test(quality): add prompt evaluation suite` | `Adiciona avaliação reproduzível de prompts` | Pendente |
| 8 | Implementar autenticação e política de retenção. | Definir retenção antes de persistir histórico; implementar Supabase Auth, papéis mínimos, exclusão e RLS por proprietário. | Testar isolamento entre usuários, expiração, privilégios, exclusão e ausência de dados pessoais indevidos. | `feat(auth): add access and retention foundations` | `Implementa autenticação e política de retenção` | Pendente |
| 9 | Criar área administrativa auditável. | Permitir revisar, verificar, ativar, desativar e substituir regras; exigir fonte e justificativa; manter trilha de auditoria; nunca expor `service_role`. | Testar autorização positiva e negativa, CSRF, XSS, elevação de privilégio, rollback e integridade do histórico. | `feat(admin): add audited knowledge management` | `Cria administração protegida da base` | Pendente |
| 10 | Generalizar o compilador para múltiplos modelos. | Remover o acoplamento fixo ao Grok; separar gerador, destino, provedor, endpoint e capacidades; adicionar um segundo perfil somente após validação. | Executar testes unitários, contratos, integração, qualidade e smoke test em Preview; auditar isolamento, segurança, custo e compatibilidade. | `feat(compiler): support capability-based model profiles` | `Generaliza o compilador para múltiplos modelos` | Pendente |

### Protocolo obrigatório por passo

Para cada um dos dez passos:

1. Criar uma branch exclusiva a partir da `main` atualizada.
2. Implementar somente o escopo daquele passo e atualizar este guia no mesmo conjunto de mudanças.
3. Executar testes automatizados, build, `git diff --check` e as verificações específicas descritas na tabela.
4. Auditar segurança, segredos, dados pessoais, banco/RLS, custos, riscos e rollback.
5. Registrar abaixo as evidências, inclusive limitações e resultados negativos; não marcar como validado sem evidência.
6. Criar um commit convencional com o assunto indicado ou equivalente.
7. Enviar a branch e abrir um PR exclusivo para `main`, incluindo resumo, riscos, rollback e comandos de validação.
8. Validar o Preview quando houver mudança executável e anexar evidência visual quando a interface for perceptivelmente alterada.
9. Incorporar a revisão do PR e repetir a auditoria se o diff mudar.
10. Só então atualizar o estado para `Concluído` e avançar ao passo seguinte.

### Registro de execução dos próximos passos

| Passo | Estado | Auditoria | Commit | Pull request | Preview/Produção | Próxima ação |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Concluído | Aprovada em 06/09/2026 | `e79a1fa` | [PR #3](https://github.com/lnpott/PROMPT_EXPERT/pull/3) | Supabase remoto validado | Passo 2 iniciado após o merge. |
| 2 | Em revisão | Aprovada em 06/09/2026 | `d6e2701` | [PR #4](https://github.com/lnpott/PROMPT_EXPERT/pull/4) | Documentação oficial consultada | Aguardar revisão e merge; depois modelar a proveniência. |
| 3 | Pendente | — | — | — | — | Iniciar após a auditoria e o PR do passo 2. |
| 4 | Pendente | — | — | — | — | Iniciar após a auditoria e o PR do passo 3. |
| 5 | Pendente | — | — | — | — | Iniciar após a auditoria e o PR do passo 4. |
| 6 | Pendente | — | — | — | — | Iniciar após a auditoria e o PR do passo 5. |
| 7 | Pendente | — | — | — | — | Iniciar após a auditoria e o PR do passo 6. |
| 8 | Pendente | — | — | — | — | Iniciar após a auditoria e o PR do passo 7. |
| 9 | Pendente | — | — | — | — | Iniciar após a auditoria e o PR do passo 8. |
| 10 | Pendente | — | — | — | — | Iniciar após a auditoria e o PR do passo 9. |

### Modelo de auditoria de cada passo

```markdown
#### Auditoria do passo N — AAAA-MM-DD

- Branch:
- Commit:
- Pull request:
- Escopo revisado:
- Testes executados:
- Resultado dos testes:
- Segurança, segredos e dados pessoais:
- Banco e RLS:
- Custos e limites:
- Preview ou produção:
- Evidências:
- Riscos remanescentes:
- Rollback:
- Estado final:
```

#### Auditoria do passo 1 — 2026-09-06

- Branch: `step-1-canonical-corpus`.
- Commit: `e79a1fa` (`feat(database): apply canonical knowledge corpus`).
- Pull request: [#3 — Aplica corpus canônico inativo no Supabase](https://github.com/lnpott/PROMPT_EXPERT/pull/3).
- Escopo revisado: aplicação de `20260906020000_import_canonical_prompt_rules.sql` e registro da versão `20260906020000` em `supabase_migrations.schema_migrations`.
- Testes executados: consultas SQL administrativas, leituras REST com chave pública e `service_role`, tentativa anônima de escrita, `npm test`, `npm run build` e `git diff --check`.
- Resultado dos testes: uma fonte, 12 regras e 12 regras simultaneamente inativas e não verificadas; histórico da migration com uma entrada; suíte e build aprovados.
- Segurança, segredos e dados pessoais: nenhuma credencial foi gravada; as verificações só registraram contagens, status e metadados não sensíveis; escrita anônima rejeitada com HTTP 401.
- Banco e RLS: as duas tabelas têm RLS ativo; as políticas liberam apenas registros verificados e ativos; leituras anônimas retornaram HTTP 200 com zero registros.
- Custos e limites: mudança apenas de conteúdo e esquema; nenhuma regra passou a afetar chamadas da Gemini.
- Preview ou produção: banco Supabase de produção `pqprtkdvzyhqlidlcpxg`; aplicação Vercel não alterada por este passo.
- Evidências: consulta administrativa retornou `sources = 1`, `rules = 12` e `inactive_unverified = 12`; `knowledge_sources` e `canonical_prompt_rules` retornaram zero linhas para a chave pública; a chave administrativa retornou 1 e 12 linhas, respectivamente.
- Riscos remanescentes: as referências numéricas ainda não possuem URLs diretas verificadas; nenhuma regra canônica deve ser ativada antes do passo 2.
- Rollback: desativar qualquer regra eventualmente promovida, remover primeiro `canonical_prompt_rules` e depois `knowledge_sources`, e excluir a versão `20260906020000` do histórico somente se for necessário reaplicar a migration; executar rollback apenas com revisão administrativa.
- Estado final: concluído após o merge do PR #3; o passo 2 foi liberado.

#### Auditoria do passo 2 — 2026-09-06

- Branch: `step-2-primary-sources`.
- Commit: `d6e2701` (`docs(knowledge): validate primary prompt sources`).
- Pull request: [#4 — Valida fontes primárias da base de conhecimento](https://github.com/lnpott/PROMPT_EXPERT/pull/4).
- Escopo revisado: inventário das 19 fontes e pesquisa das quatro lacunas prioritárias somente em domínios oficiais de fabricantes ou plataformas institucionais.
- Testes executados: consulta HTTP das URLs, inspeção do conteúdo aplicável, `npm test`, `npm run build` e `git diff --check`.
- Resultado dos testes: 13 fontes confirmadas, quatro parciais, uma secundária e uma página específica não localizada; Codestral FIM, Model Spec e Hermes obtiveram evidência oficial direta.
- Segurança, segredos e dados pessoais: pesquisa pública sem credenciais e sem conteúdo pessoal; nenhuma chave foi persistida.
- Banco e RLS: nenhuma linha ou estado editorial foi alterado no Supabase; as 12 regras permanecem não verificadas e inativas.
- Custos e limites: somente consultas documentais públicas; nenhuma chamada adicional à Gemini foi necessária.
- Preview ou produção: mudança documental e de teste, sem alteração executável na aplicação ou no banco.
- Evidências: `fontes-primarias-validadas.md` registra URL, resultado e conclusão para cada fonte e separa confirmações de inferências ainda incertas.
- Riscos remanescentes: faltam evidência específica estável para o cache do Kimi, detalhes exclusivos atribuídos ao Kimi K3 e ao Claude Opus 5, roteamento físico de cache no Vertex AI e cache do Grok.
- Rollback: reverter o commit documental; nenhuma reversão remota é necessária porque banco e produção não foram modificados.
- Estado final: implementação concluída e em revisão; o passo 3 permanece bloqueado até o merge.

## Evidências de verificação

- `npm test`: valida seis cenários de acesso de `/api/generate` e `/api/health`, incluindo respostas 200, 400, 405, 503 e o fluxo integrado simulado.
- `npm run build`: confirma que a inclusão da suíte não interfere no build de produção.

### Acessos externos — 5 de setembro de 2026

| Serviço | Resultado | Evidência e diagnóstico |
| --- | --- | --- |
| GitHub | Positivo | A credencial foi renovada via GitHub CLI, e `git push origin main` avançou a branch de `d0dec6e` para `e9f963e`. A Vercel clonou esse commit da `main` e concluiu o deployment de produção como `Ready`. |
| Supabase | Positivo | Consultas HTTPS autenticadas com a chave pública retornaram HTTP 200, um perfil Grok ativo e cinco regras ativas. O teste confirmou acesso real de leitura sem usar `service_role`. |
| Gemini | Positivo | A consulta autenticada a `models/gemini-3.8-flash` retornou HTTP 200 e confirmou suporte a `generateContent`. Nenhuma chave foi exibida ou persistida. |
| Vercel | Positivo | A falha de produção em `d0dec6e` era `vite: Permission denied` (saída 126), causada por `node_modules` versionado com binários de outra plataforma. O deploy de produção `dpl_9i1NPXiYT1a4gftuea3ojDhcPWbR` terminou `Ready` em 6 de setembro, com build e as três funções concluídos. A proteção SSO foi desativada para o lançamento público. A URL `https://prompt-expert-blush.vercel.app` respondeu `/api/health` com `status: ok`, `knowledgeBase: Grok` e `geminiConfigured: true`; o `POST /api/generate` retornou `source: gemini` e um prompt de 3.155 caracteres. Não houve logs de erro no deployment. |

O deploy de produção está saudável e acessível publicamente. A migration do corpus canônico já foi aplicada e as fontes receberam uma primeira validação documental sem ativação de regras; o próximo marco deve modelar no banco a proveniência e o histórico de revisão antes de qualquer promoção para produção.

Cada mudança deve atualizar esta tabela, as seções **Implementado** e **Validado**, e registrar uma evidência de verificação.

## Decisões pendentes

- Qual regra de retenção será usada para o futuro histórico de gerações?

## Corpus canônico importado

- Artefato: `base-canonica-regras.md`.
- Auditoria de origem: `notebook-auditoria-fontes.md`, com as 19 fontes classificadas e as quatro lacunas de pesquisa registradas.
- Validação primária: `fontes-primarias-validadas.md`, com URLs oficiais, classificações e limites de evidência consultados em 6 de setembro de 2026.
- Referência fornecida: `https://notebook.google.com/notebook/5a5161c7-5d60-48e7-ac86-f2887f86d07c`.
- Integridade: SHA-256 `7b7e52a038a86e67248b4d98c02931a1fe1cccf5805eed1cb2d80a34ddbff509`.
- Destino: migration `20260906020000_import_canonical_prompt_rules.sql`, com 12 regras e lacunas normalizadas.
- Segurança editorial: a exportação do notebook foi fornecida diretamente, porém não contém a bibliografia nem URLs correspondentes às citações numéricas. Por isso, as regras entram como `supplied_unverified` e `is_active = false`; não alteram o perfil Grok nem a saída de produção até validação por fonte primária.

## Variáveis de ambiente

O repositório contém `.env.example` com as variáveis da função de backend. Para a primeira versão, basta cadastrar `GEMINI_API_KEY` na Vercel nos ambientes Preview e Production. `GEMINI_MODEL` é opcional; o padrão atual é `gemini-3.8-flash`. A função usa apenas a chave pública de leitura do Supabase, protegida pelas políticas de RLS; `service_role` nunca entra no GitHub, no front-end ou neste guia.

## Regra de atualização

Ao fim de cada marco, atualizar as seções **Implementado**, **Validado**, **Ainda não implementado** e **Próximo marco**. Nenhuma etapa deve ser marcada como validada sem evidência de teste.

