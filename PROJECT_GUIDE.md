# PROMPT_EXPERT — Guia vivo do projeto

> Atualização de planejamento: 7 de setembro de 2026 — ciclo de contas, cofre BYOK e múltiplos provedores.

## Propósito

O PROMPT_EXPERT transforma uma descrição comum de um produto ou funcionalidade em um prompt de programação claro, completo e adaptado ao modelo de destino. A versão funcional suporta nove perfis: Grok, GPT/Codex, Claude, Gemini, DeepSeek, Qwen3-Coder, Codestral, Kimi e Llama.

O produto não é um arquivo de prompt estático. A pessoa descreve o que quer construir em linguagem natural; o sistema aplica um perfil de modelo e regras de qualidade para produzir um prompt pronto para copiar.

## Princípios do produto

- Começar pequeno, validar o fluxo e ampliar em etapas.
- Não exigir API, conta ou banco de dados para provar a experiência principal.
- Tratar os perfis de modelo, regras e exemplos como conteúdo versionado e auditável.
- Nunca expor chaves privadas no front-end, no repositório ou em documentos.
- Registrar decisões, implementação e validação neste arquivo.
- Separar segredos da plataforma dos segredos pertencentes às pessoas usuárias.
- Nunca persistir senha de autenticação, chave de API ou token de provedor em texto puro.
- Manter o compilador local disponível como caminho sem credenciais; recursos BYOK exigem autenticação.
- Qualquer recuperação de acesso deve preservar a regra de que segredos salvos não são recuperados por terceiros nem reaparecem após um reset destrutivo do cofre.

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
- Seleção opcional do tipo de tarefa, iniciando sempre em “Tarefas citadas”, com instruções especializadas por fornecedor e sem classificação de complexidade.
- Endpoint `/api/profiles` para descoberta segura dos perfis públicos.
- Seletor independente de motor de compilação, com catálogo público em `/api/compilers`, cinco modelos Gemini verificados e allowlist no backend.
- Geração aprimorada opcional pela Gemini, com fallback automático para o compilador local.
- Proteções iniciais de produção: limite por cliente, timeout, retry com `Retry-After`, identificador de requisição e logs sanitizados.
- Modelo de proveniência aplicado no Supabase com 24 fontes, 23 snapshots, 19 vínculos regra-evidência e 12 eventos iniciais de revisão.
- Endpoint público `/api/provenance` no domínio Vercel para consultar fontes confirmadas ou parciais sem expor a trilha administrativa.
- Fundação de conta com Supabase Auth por email e senha, restauração/observação de sessão e área protegida apenas visual para “APIs e provedores”, sem cofre ou credenciais BYOK.

### Validado

- Build de produção executado com sucesso.
- Fluxo principal testado no navegador: informar uma ideia, gerar o prompt e habilitar a cópia.
- Sincronização inicial do repositório com a branch principal do GitHub concluída em marco anterior; a divergência atual de escrita está registrada abaixo.
- Verificação de segurança do Supabase concluída sem alertas para a estrutura inicial.
- Perfil Grok e cinco regras iniciais carregados e consultados com sucesso pela função de backend.
- Fluxo local testado após a integração: o modo-base continua disponível fora da Vercel ou enquanto a chave Gemini não existe.
- Geração completa validada com Gemini 3.5 Flash-Lite como motor geral, perfil Grok e regras armazenadas no Supabase.
- Testes de acesso da API executados localmente com serviços externos simulados, sem usar credenciais reais.
- Acesso externo ao GitHub, Supabase e Gemini verificado em 5 de setembro de 2026; as limitações encontradas na Vercel estão registradas nas evidências abaixo.
- Build de Preview da Vercel corrigido e concluído com sucesso após remover `node_modules` do versionamento.
- Produção validada em 6 de setembro de 2026 em `https://prompt-expert-blush.vercel.app`: `/api/health` retornou `status: ok`, perfil `Grok` e Gemini configurado; `/api/generate` retornou um prompt por Gemini com sucesso.
- Testes de integridade confirmam o checksum da base canônica e que suas 12 regras importadas permanecem inativas até validação primária por fornecedor.
- Exportação textual do notebook recebida diretamente em 6 de setembro de 2026; a proveniência do conteúdo foi confirmada, mas as referências numéricas ainda não possuem URLs correspondentes e não autorizam ativação automática das regras.
- Corpus remoto auditado com acesso administrativo e público: uma fonte e 12 regras existem, todas as regras estão `supplied_unverified` e inativas, a leitura anônima retorna zero registros e a escrita anônima é rejeitada.
- Quatro lacunas prioritárias pesquisadas em documentação oficial: Codestral FIM e Qwen Hermes foram confirmados; a hierarquia do OpenAI Model Spec foi confirmada como conceitual; cache regional do Claude e cache do Kimi permanecem parcialmente ou não confirmados.
- Fluxo sem credenciais validado por testes: os nove perfis compilam prompts completos localmente e a indisponibilidade do Supabase ou da Gemini não interrompe o produto.
- Versão multi-modelo publicada na `main` e validada em produção: nove perfis, “Tarefas citadas” como padrão, ausência de complexidade e geração real pela Gemini.
- Proteção editorial validada no Supabase: tentativa de ativar regra não verificada foi rejeitada, escrita pública segue bloqueada e tabelas administrativas de evidência e revisão não são expostas.
- Estados anônimo e autenticado da fundação de Auth validados com cliente Supabase simulado; o modo visitante e o compilador local permanecem disponíveis sem configuração Auth.

### Não bloqueia a versão funcional atual

- Histórico persistente de gerações.
- Área administrativa web para alimentar a base a partir do notebook.
- Uso anônimo do compilador local determinístico.

A autenticação deixa de ser uma evolução opcional para o novo ciclo BYOK: ela passa a ser obrigatória para salvar e usar credenciais pessoais de provedores. O modo local sem conta continua preservado como caminho degradado e de demonstração, sem acesso ao cofre.

## Estado funcional consolidado

A aplicação continua pronta para uso local sem configuração externa. O compilador local determinístico permanece o fallback obrigatório e não exige conta, banco ou chave privada.

Até o início do ciclo BYOK, a Vercel ainda possui `GEMINI_API_KEY` e `GEMINI_MODEL` como segredos da própria plataforma para o aprimoramento atual. Esse segredo da plataforma não deve ser confundido com as futuras chaves pessoais dos usuários. O ciclo novo introduzirá credenciais BYOK por conta e, depois da validação em Preview, o uso público da chave Gemini da plataforma deverá ficar atrás de uma flag de migração ou restrito a smoke tests administrativos.

“Modelo de destino”, “motor de compilação” e “provedor de API” passam a ser três conceitos independentes:

1. **Modelo de destino**: para qual modelo o prompt final será adaptado.
2. **Motor de compilação**: qual modelo efetivamente gera/refina o prompt.
3. **Provedor de API**: qual serviço recebe a chamada, por exemplo OpenRouter, Google, xAI, OpenAI, Anthropic, DeepSeek, Mistral, Groq, Alibaba Cloud Model Studio ou Kimi.

A pessoa autenticada poderá cadastrar uma credencial por provedor, substituí-la, testá-la e removê-la. Depois de salva, a credencial nunca deverá voltar integralmente ao navegador; a interface exibirá apenas estado, rótulo e dica mascarada. O backend descriptografa a chave somente em memória para a chamada necessária e deve limpar referências assim que a requisição terminar.

O parecer e os riscos aceitos da entrega anterior continuam registrados em `AUDITORIA_FINAL.md`. As seções históricas abaixo permanecem como evidência do estado anterior e não devem ser reescritas para aparentar que o novo ciclo já foi implementado.

## Arquitetura planejada

```text
Pessoa usuária
    ├─ sem conta → compilador local determinístico
    │
    └─ autenticada
         ↓
      Supabase Auth
         ↓ JWT
      Interface web na Vercel
         ↓
      Catálogo público de provedores + metadados do cofre
         ↓
      Backend seguro / funções Vercel
         ├─ valida JWT do usuário
         ├─ lê somente credencial pertencente ao usuário
         ├─ descriptografa em memória
         ├─ chama adaptador do provedor selecionado
         └─ nunca registra segredo, prompt completo ou senha
         ↓
      OpenRouter / Gemini / xAI / OpenAI / Anthropic /
      DeepSeek / Mistral / Groq / Qwen / Kimi
         ↓
      Prompt estruturado para o modelo de destino
```

### Responsabilidades

| Camada | Responsabilidade |
| --- | --- |
| Interface | Login, cadastro, briefing, seleção de destino/motor/provedor, gestão mascarada das credenciais e exibição/cópia do prompt. |
| Supabase Auth | Identidade, sessão, confirmação de e-mail, alteração de senha e sessão de recuperação. A senha nunca é armazenada pela aplicação. |
| Supabase Database | Perfis, regras, catálogo público de provedores e somente ciphertext/metadados das credenciais do usuário, com RLS por `auth.uid()`. |
| Backend Vercel | Autenticar a requisição, criptografar/descriptografar credenciais, chamar provedores, aplicar allowlists, limites e telemetria sanitizada. |
| Vercel Secrets | Guardar `USER_CREDENTIALS_MASTER_KEY` e, durante a migração, os segredos próprios da plataforma. |
| Provedores | Executar a geração usando a chave BYOK escolhida pela pessoa usuária. |
| GitHub | Versionar código, migrations, documentação, testes, decisões e auditorias. |

### Decisão de segurança do cofre

O Supabase armazenará apenas material criptografado e metadados não secretos. Para o primeiro desenho, não usar a extensão Supabase Vault como cofre multiusuário da interface. O backend fará criptografia de aplicação com primitivas nativas do Node.js:

- `AES-256-GCM` para cada segredo;
- IV aleatório exclusivo por gravação;
- chave derivada por usuário com `HKDF-SHA-256` a partir de `USER_CREDENTIALS_MASTER_KEY`;
- `user_id`, `provider_id`, versão do esquema e identificador da credencial como AAD;
- versão de chave explícita para permitir rotação futura;
- nenhum valor secreto em logs, respostas de erro, analytics, documentação, fixtures ou Git.

A chave-mestra existe somente como segredo da Vercel em Preview e Production. A chave publicável do Supabase pode permanecer no frontend com RLS correto; `service_role` não deve ser necessário para o fluxo normal de credenciais.

### Política de senha e recuperação

- Login inicial: e-mail + senha pelo Supabase Auth.
- A aplicação nunca guarda ou consegue exibir a senha original.
- Alteração voluntária de senha, com sessão válida e confirmação da senha atual, pode preservar o cofre.
- “Esqueci minha senha” não recupera a senha anterior. O usuário recebe o fluxo de recuperação do Supabase e o PROMPT_EXPERT executa um **reset destrutivo do cofre** antes de concluir a retomada do uso.
- Reset destrutivo remove todas as credenciais BYOK do usuário; após criar a nova senha, as chaves precisam ser cadastradas de novo.
- A interface deve explicar essa consequência antes de iniciar o reset.
- O fluxo de recuperação não deve retornar, exportar ou revelar as credenciais antigas.

## Marcos concluídos

| Etapa | Entrega | Estado |
| --- | --- | --- |
| 1 | Definir o produto, público e fluxo principal. | Concluída |
| 2 | Criar e validar o MVP local de geração para Grok. | Concluída |
| 3 | Versionar guia vivo, configuração Vercel e estrutura Supabase. | Concluída |
| 4 | Importar `PROMPT_EXPERT` do GitHub na Vercel e validar o primeiro deploy. | Concluída: `main` sincronizado e deployment de produção validado |
| 5 | Cadastrar a chave Gemini secreta na Vercel. | Concluída em Preview e Production |
| 6 | Conectar a interface à função segura, aos perfis e às regras do Supabase. | Concluída e validada localmente |
| 7 | Revisar e importar a base do notebook como conteúdo auditado. | Concluída: exportação deduplicada, corpus aplicado, fontes validadas e proveniência modelada |
| 8 | Criar uma área administrativa protegida para atualizar a base. | Adiada até haver operadores autenticados e política de retenção |
| 9 | Escolher a API de IA e implementar a geração segura no backend. | Concluída com Gemini 3.5 Flash-Lite como motor geral |
| 10 | Executar validação de qualidade, segurança e publicação de produção. | Concluída para o deployment de produção atual |

## Próximos dez passos

Os próximos passos transformam o MVP publicado em um produto auditável, protegido e extensível. Cada passo deve ser implementado em branch própria e só pode ser marcado como concluído depois da auditoria, do commit e do pull request correspondentes.

| Passo | Entrega | Critérios de aceite | Auditoria obrigatória | Commit sugerido | PR sugerido | Estado |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Aplicar o corpus canônico no Supabase. | Criar `knowledge_sources` e `canonical_prompt_rules`; importar uma fonte e 12 regras; manter `supplied_unverified` e `is_active = false`; impedir leitura pública desses registros. | Conferir contagens com acesso administrativo, testar RLS com chave pública, revisar grants, registrar rollback e executar a suíte local. | `feat(database): apply canonical knowledge corpus` | `Aplica corpus canônico inativo no Supabase` | Concluído |
| 2 | Validar as fontes primárias. | Registrar URL direta, fornecedor, título, data de consulta, escopo e regras relacionadas; classificar cada afirmação como confirmada, refutada, obsoleta ou incerta. | Verificar domínio oficial e suporte direto de cada fonte; priorizar Codestral FIM, OpenAI Model Spec, cache do Claude no Vertex AI e tool calling do Qwen3-Coder. | `docs(knowledge): validate primary prompt sources` | `Valida fontes primárias da base de conhecimento` | Concluído |
| 3 | Modelar proveniência e revisão editorial. | Criar migration para fontes, versões, revisões, responsáveis e relação fonte-regra; preservar histórico; bloquear escrita pública. | Revisar constraints, integridade referencial, RLS, grants, aplicação e rollback; adicionar testes estáticos da migration. | `feat(knowledge): add source verification model` | `Adiciona proveniência verificável às regras` | Concluído |
| 4 | Ativar somente regras verificadas e aplicáveis ao Grok. | Promover apenas regras sustentadas por fontes oficiais e explicitamente compatíveis com Grok; registrar justificativa por ativação. | Comparar prompts antes e depois, verificar contradições, custo e aderência e confirmar que regras de outros fornecedores não foram aplicadas indevidamente. | `feat(knowledge): activate verified grok rules` | `Ativa regras verificadas do perfil Grok` | Concluído sem promoção: nenhuma regra importada é simultaneamente verificada e específica do Grok |
| 5 | Proteger o endpoint de geração. | Adicionar rate limit, quota, timeouts, limite de resposta, backoff com jitter e tratamento de `Retry-After`. | Testar abuso, concorrência, timeout, falha de fornecedor, proteção de custo e ausência de segredos; ampliar `test/api-access.test.js`. | `feat(api): add generation safeguards` | `Protege geração contra abuso e indisponibilidade` | Concluído |
| 6 | Adicionar observabilidade segura. | Gerar identificador de requisição e métricas de status, duração, fornecedor, retry e fallback sem armazenar briefing, prompt ou credenciais. | Inspecionar logs reais na Vercel, testar sanitização e documentar acesso e retenção dos registros. | `feat(observability): add sanitized request telemetry` | `Adiciona telemetria segura às funções` | Concluído |
| 7 | Criar avaliação reproduzível da qualidade dos prompts. | Versionar briefings sem dados pessoais e medir aderência, clareza, completude, suposições, requisitos e critérios de aceite. | Comparar fallback local e geração integrada, medir regressões e custos e registrar modelo, perfil e regras utilizados. | `test(quality): add prompt evaluation suite` | `Adiciona avaliação reproduzível de prompts` | Concluído |
| 8 | Implementar autenticação e política de retenção. | Definir retenção antes de persistir histórico; implementar Supabase Auth, papéis mínimos, exclusão e RLS por proprietário. | Testar isolamento entre usuários, expiração, privilégios, exclusão e ausência de dados pessoais indevidos. | `feat(auth): add access and retention foundations` | `Implementa autenticação e política de retenção` | Adiado: não há conta nem persistência de briefings no produto público |
| 9 | Criar área administrativa auditável. | Permitir revisar, verificar, ativar, desativar e substituir regras; exigir fonte e justificativa; manter trilha de auditoria; nunca expor `service_role`. | Testar autorização positiva e negativa, CSRF, XSS, elevação de privilégio, rollback e integridade do histórico. | `feat(admin): add audited knowledge management` | `Cria administração protegida da base` | Adiado: revisão permanece por migrations administrativas auditáveis |
| 10 | Generalizar o compilador para múltiplos modelos. | Remover o acoplamento fixo ao Grok; separar gerador, destino, provedor, endpoint e capacidades; adicionar um segundo perfil somente após validação. | Executar testes unitários, contratos, integração, qualidade e smoke test em Preview; auditar isolamento, segurança, custo e compatibilidade. | `feat(compiler): support capability-based model profiles` | `Generaliza o compilador para múltiplos modelos` | Concluído |

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
| 1 | Concluído | Aprovada em 06/09/2026 | `e79a1fa` | [PR #3](https://github.com/lnpott/PROMPT_EXPERT/pull/3) | Supabase remoto validado | Encerrado. |
| 2 | Concluído | Aprovada em 06/09/2026 | `d6e2701` | [PR #4](https://github.com/lnpott/PROMPT_EXPERT/pull/4) | Documentação oficial consultada | Encerrado. |
| 3 | Concluído | Aprovada em 06/09/2026 | `8fbc6d1` | [PR #7](https://github.com/lnpott/PROMPT_EXPERT/pull/7) | Supabase e produção validados | Encerrado. |
| 4 | Concluído sem promoção | Aprovada em 06/09/2026 | `32de2b7` | [PR #8](https://github.com/lnpott/PROMPT_EXPERT/pull/8) | Zero regras canônicas ativas | Reavaliar somente com evidência oficial específica do Grok. |
| 5 | Concluído | Aprovada em 06/09/2026 | `32de2b7` | [PR #8](https://github.com/lnpott/PROMPT_EXPERT/pull/8) | Testes de limite, fallback e retry | Migrar limite para storage distribuído se o tráfego exigir. |
| 6 | Concluído | Aprovada em 06/09/2026 | `32de2b7` | [PR #8](https://github.com/lnpott/PROMPT_EXPERT/pull/8) | Telemetria sanitizada testada | Definir retenção de logs na operação Vercel. |
| 7 | Concluído | Aprovada em 06/09/2026 | `32de2b7` | [PR #8](https://github.com/lnpott/PROMPT_EXPERT/pull/8) | 54 casos reproduzíveis | Ampliar fixtures quando os perfis mudarem. |
| 8 | Adiado por desenho | Aprovada em 06/09/2026 | — | — | Sem contas ou histórico | Implementar apenas após política de retenção aprovada. |
| 9 | Adiado por desenho | Aprovada em 06/09/2026 | — | — | Administração via migration e PR | Criar UI somente quando houver operadores autenticados. |
| 10 | Concluído | Aprovada em 06/09/2026 | `4fe3030` + `32de2b7` | [PR #5](https://github.com/lnpott/PROMPT_EXPERT/pull/5) + [PR #8](https://github.com/lnpott/PROMPT_EXPERT/pull/8) | Nove perfis em produção | Manter contratos e avaliação sincronizados. |

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
- Estado final: concluído após o merge do PR #4; o passo 3 foi liberado.

#### Auditoria do passo 3 — 2026-09-06

- Branch: `provenance-model`.
- Commit: `8fbc6d1` (`feat(knowledge): add source verification model`).
- Pull request: [#7 — Adiciona proveniência verificável à base de regras](https://github.com/lnpott/PROMPT_EXPERT/pull/7).
- Escopo revisado: migration de fontes, snapshots, vínculos de evidência, eventos de revisão, políticas RLS, bloqueio de ativação e endpoint Vercel `/api/provenance`.
- Testes executados: consultas SQL administrativas, leitura REST anônima, tentativa administrativa de ativar regra não verificada, testes automatizados, build e verificação de diff.
- Resultado dos testes: 24 fontes, 23 snapshots externos, 19 vínculos de evidência, 12 eventos de revisão e zero regras canônicas ativas.
- Segurança, segredos e dados pessoais: nenhuma credencial ou dado pessoal persistido; fontes e snapshots confirmados/parciais têm leitura pública, enquanto vínculos e eventos administrativos não possuem grants públicos.
- Banco e RLS: RLS habilitado nas quatro tabelas; leitura pública limitada por status; escrita anônima bloqueada; trigger rejeitou ativação sem status verificado e evidência confirmada.
- Custos e limites: conteúdo textual e links públicos; sem chamadas adicionais ao gerador Gemini.
- Preview ou produção: migration aplicada no Supabase `pqprtkdvzyhqlidlcpxg`; `/api/provenance` respondeu HTTP 200 no Preview com 22 fontes públicas, sendo 18 confirmadas e quatro parciais.
- Evidências: 18 fontes confirmadas, quatro parciais, uma secundária e uma não localizada; acesso anônimo retornou 22 fontes/snapshots e HTTP 401 para `rule_evidence` e `rule_review_events`.
- Riscos remanescentes: snapshots web não possuem hash porque as páginas são mutáveis; promoções continuam exigindo revisão individual e migration explícita.
- Rollback: remover trigger e função, depois `rule_review_events`, `rule_evidence`, `source_snapshots` e `evidence_sources`; remover a versão da migration apenas em reaplicação controlada.
- Estado final: concluído após o merge do PR #7, sem ativar regras canônicas.

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

O deployment de produção atual está saudável, acessível publicamente e sincronizado com o commit `3a5c97a` da `main`. A migration do corpus canônico já foi aplicada e as fontes receberam uma primeira validação documental sem ativação de regras; o próximo marco deve modelar no banco a proveniência e o histórico de revisão antes de qualquer promoção para produção.

Cada mudança deve atualizar esta tabela, as seções **Implementado** e **Validado**, e registrar uma evidência de verificação.

## Novo ciclo — Contas, cofre BYOK e provedores de API

### Objetivo

Permitir que uma pessoa crie uma conta no PROMPT_EXPERT, salve com segurança suas próprias chaves de API e escolha qual provedor/modelo usará como motor de compilação. O produto deve continuar útil sem credenciais graças ao compilador local.

### Escopo aprovado

1. Cadastro, login, logout e sessão com Supabase Auth.
2. Cofre BYOK por usuário, sem plaintext no banco.
3. Tela “APIs e provedores” com status das chaves, cadastro, substituição, teste e exclusão.
4. Links oficiais para criar conta, gerar chave e consultar documentação.
5. OpenRouter como primeiro gateway agregado.
6. Adaptadores diretos incrementais para provedores prioritários.
7. Roteamento por capacidade, sem acoplar “modelo de destino” a “provedor”.
8. Reset destrutivo do cofre no fluxo de esquecimento de senha.
9. Auditoria de segurança, RLS, logs, CSP, rate limits e custos antes de produção.
10. Atualização sincronizada de `PROJECT_GUIDE.md`, `CONFIGURACAO_APIS.md`, migrations, testes e documentação operacional.

### Fora do escopo inicial

- Guardar histórico completo dos prompts por padrão.
- Compartilhar chaves entre usuários ou equipes.
- Exportar chave salva em texto puro.
- Marketplace, cobrança própria ou revenda de créditos.
- OAuth com provedores de IA.
- Administração web de segredos de usuários.
- Armazenar senhas de contas externas dos provedores.

### Modelo de dados proposto

#### `api_providers`

Catálogo público versionado e auditável.

Campos mínimos:

- `id uuid primary key`
- `slug text unique not null`
- `display_name text not null`
- `category text check (category in ('direct','gateway'))`
- `signup_url text`
- `api_key_url text`
- `docs_url text`
- `base_url text`
- `auth_scheme text`
- `key_prefix_hint text`
- `supports_generation boolean`
- `supports_model_listing boolean`
- `is_active boolean`
- `sort_order integer`
- `created_at timestamptz`
- `updated_at timestamptz`

Leitura pública somente para registros ativos. Escrita pública proibida.

#### `user_api_credentials`

Armazena somente ciphertext e metadados da chave.

Campos mínimos:

- `id uuid primary key`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `provider_id uuid not null references api_providers(id)`
- `label text`
- `ciphertext text not null`
- `iv text not null`
- `auth_tag text not null`
- `key_version integer not null`
- `secret_last4 text`
- `validation_status text`
- `last_validated_at timestamptz`
- `created_at timestamptz`
- `updated_at timestamptz`

Primeiro MVP: uma credencial ativa por usuário/provedor, com `unique(user_id, provider_id)`. Se surgir necessidade real de múltiplas chaves por provedor, migrar o contrato posteriormente.

RLS obrigatória:

- `SELECT`: somente `auth.uid() = user_id`;
- `INSERT`: somente `auth.uid() = user_id`;
- `UPDATE`: somente `auth.uid() = user_id`;
- `DELETE`: somente `auth.uid() = user_id`;
- `anon`: nenhum acesso;
- nunca criar policy que permita leitura cruzada.

### Contrato do backend do cofre

Endpoints sugeridos:

| Endpoint | Função | Retorna segredo? |
| --- | --- | --- |
| `GET /api/providers` | Catálogo público e links oficiais. | Não |
| `GET /api/credentials` | Lista status das credenciais do usuário autenticado. | Não |
| `PUT /api/credentials/:provider` | Valida formato mínimo, criptografa e salva/substitui. | Não |
| `DELETE /api/credentials/:provider` | Exclui a credencial do usuário. | Não |
| `POST /api/credentials/:provider/test` | Testa autenticação sem persistir resposta sensível. | Não |
| `POST /api/account/reset-vault` | Apaga todas as credenciais no fluxo destrutivo autorizado. | Não |
| `POST /api/generate` | Busca e usa em memória a credencial selecionada para chamar o provedor. | Não |

Requisitos obrigatórios:

- exigir JWT válido em todos os endpoints de credenciais;
- nunca aceitar `user_id` do body como fonte de autorização;
- resolver o usuário exclusivamente a partir da sessão/JWT;
- não devolver `ciphertext`, `iv`, `auth_tag` ou segredo completo ao frontend;
- não incluir a chave em URL, query string, prompt ou logs;
- limpar o campo de chave do estado da interface após sucesso;
- mascarar somente com dica não sensível, por exemplo `••••••••abcd`;
- chamadas externas somente por HTTPS;
- timeouts e limites por provedor;
- mensagens de erro sanitizadas.

### Catálogo inicial de provedores

O seed inicial deve conter apenas links oficiais verificados. URLs podem mudar e precisam ser revisadas antes do merge.

| Prioridade | Provedor | Tipo | Uso inicial |
| --- | --- | --- | --- |
| 1 | OpenRouter | Gateway | Primeiro adaptador BYOK; centraliza muitos modelos e provedores. |
| 2 | Google Gemini | Direto | Continuidade com o motor já conhecido pelo projeto. |
| 3 | xAI | Direto | Grok via API oficial. |
| 4 | OpenAI | Direto | GPT/Codex e modelos OpenAI disponíveis por API. |
| 5 | Anthropic / Claude Platform | Direto | Claude. |
| 6 | DeepSeek | Direto | Modelos DeepSeek e endpoint compatível. |
| 7 | Mistral | Direto | Mistral/Codestral quando disponíveis no catálogo. |
| 8 | GroqCloud | Gateway/infra | Modelos servidos pela Groq com chave própria. |
| 9 | Alibaba Cloud Model Studio | Direto/Gateway | Qwen e modelos compatíveis; endpoint depende da região/workspace. |
| 10 | Kimi API Platform | Direto | Kimi/Moonshot, após validação de contrato e modelos. |

Links oficiais já verificados em 7 de setembro de 2026 para o planejamento:

- OpenRouter: `https://openrouter.ai/` e gerenciamento de chaves em `https://openrouter.ai/settings/keys`.
- Gemini: `https://aistudio.google.com/app/apikey`.
- xAI: `https://console.x.ai/`.
- OpenAI: `https://platform.openai.com/api-keys`.
- Anthropic/Claude Platform: `https://platform.claude.com/settings/keys`.
- DeepSeek: documentação oficial em `https://api-docs.deepseek.com/`; a página de chaves é acessada pela plataforma DeepSeek.
- Mistral: documentação oficial em `https://docs.mistral.ai/` e console em `https://console.mistral.ai/`.
- GroqCloud: `https://console.groq.com/keys`.
- Qwen / Alibaba Cloud Model Studio: documentação de chave em `https://www.alibabacloud.com/help/en/model-studio/get-api-key`.
- Kimi API Platform: `https://platform.kimi.ai/console/api-keys`.

### Estratégia de roteamento

O backend deve adotar um contrato único de adaptador, por exemplo:

```ts
interface ProviderAdapter {
  id: string
  validateCredential(secret: string, context: ProviderContext): Promise<CredentialValidation>
  listModels?(secret: string, context: ProviderContext): Promise<ProviderModel[]>
  generate(request: GenerateRequest, secret: string, context: ProviderContext): Promise<GenerateResult>
}
```

Nenhum modelo deve aparecer como disponível apenas porque seu nome existe na interface. Para estar ativo, precisa existir:

1. provedor ativo;
2. adaptador implementado;
3. modelo em allowlist/catálogo;
4. credencial válida quando BYOK for exigido;
5. teste de contrato;
6. fallback conhecido.

OpenRouter será o primeiro adaptador porque permite validar a arquitetura multi-provedor antes de multiplicar integrações diretas.

### Política de fallback e custo

Durante a migração:

1. compilador local continua sempre disponível;
2. usuário autenticado pode selecionar um provedor BYOK configurado;
3. se a chave selecionada estiver ausente/inválida, não trocar silenciosamente para outro provedor pago;
4. a antiga `GEMINI_API_KEY` da plataforma pode permanecer temporariamente sob uma flag explícita, somente enquanto a migração é validada;
5. após o BYOK estabilizar, decidir se a chave da plataforma será apenas administrativa/smoke test ou se existirá uma cota pública patrocinada;
6. nenhum fallback deve gerar custo inesperado para o dono do projeto ou para o usuário.

### Novo plano de dez passos

Cada passo segue o protocolo obrigatório já estabelecido: branch exclusiva, implementação limitada ao escopo, testes, auditoria, commit convencional, PR, Preview e atualização deste guia.

| Passo | Entrega | Critérios de aceite | Commit sugerido | Estado |
| --- | --- | --- | --- | --- |
| 11 | Auditoria pré-BYOK e contrato de segurança. | Mapear código atual, endpoints, dependências, RLS, variáveis e riscos; documentar desenho antes de alterar produção. | `docs(security): define byok vault architecture` | Concluído: contrato documentado, sem alteração remota |
| 12 | Fundação de Supabase Auth. | Cadastro, confirmação de e-mail, login, logout, sessão e rotas protegidas; modo local sem conta preservado. | `feat(auth): add user account foundation` | Concluído: sessão e UI de conta; BYOK permanece ausente |
| 13 | Schema do catálogo e cofre com RLS. | Criar `api_providers` e `user_api_credentials`; migrations reversíveis; isolamento por usuário provado com testes. | `feat(database): add byok credential vault schema` | Planejado |
| 14 | Criptografia de aplicação. | Implementar AES-256-GCM + HKDF, versionamento, testes de round-trip/tamper e zero plaintext em persistência/logs. | `feat(security): encrypt user api credentials` | Planejado |
| 15 | Gestão de credenciais na interface. | Tela APIs/provedores, links oficiais, salvar/substituir/testar/excluir e exibição mascarada. | `feat(settings): add provider credential manager` | Planejado |
| 16 | Recuperação destrutiva do cofre. | Esquecimento de senha exige aviso explícito e destrói credenciais antes de reativar o uso; alteração com senha atual preserva cofre. | `feat(auth): add destructive vault recovery` | Planejado |
| 17 | Adaptador OpenRouter. | Salvar/testar chave, catálogo de modelos permitido, geração BYOK real e fallback local sem vazamento. | `feat(providers): add openrouter byok adapter` | Planejado |
| 18 | Adaptadores diretos prioritários. | Gemini, xAI, OpenAI, Anthropic, DeepSeek, Mistral e Groq por contrato comum; Qwen/Kimi entram após validação regional/contratual. | `feat(providers): add direct provider adapters` | Planejado |
| 19 | Hardening e QA. | CSP, XSS/CSRF, rate limit, timeouts, sanitização, testes RLS, abuso, concorrência, custos e rotação da chave-mestra. | `test(security): harden byok provider flows` | Planejado |
| 20 | Rollout e política final de chaves da plataforma. | Preview completo, smoke tests reais, documentação atualizada, decisão sobre `GEMINI_API_KEY` pública e produção sem regressão. | `chore(release): roll out authenticated byok` | Planejado |

### Critérios de aceite do ciclo BYOK

O ciclo só poderá ser considerado concluído quando:

- dois usuários de teste não conseguirem ler, substituir, testar ou apagar as credenciais um do outro;
- dump da tabela `user_api_credentials` não contiver nenhuma chave utilizável em plaintext;
- logs Vercel/Supabase não contiverem chaves, Authorization headers ou passwords;
- uma alteração maliciosa de `provider_id`, `user_id` ou ID da credencial não permita acesso cruzado;
- recuperação de senha destrutiva deixe o cofre vazio;
- alteração de senha com confirmação da senha atual preserve o cofre;
- OpenRouter BYOK gere um prompt real;
- pelo menos um provedor direto gere um prompt real;
- falha/ausência da API externa preserve o compilador local;
- o build, suíte de API, avaliação de qualidade, testes de RLS e `git diff --check` passem;
- `CONFIGURACAO_APIS.md` explique claramente a diferença entre segredos da plataforma e BYOK;
- nenhuma chave real apareça em commits, PRs, screenshots ou fixtures.

### Ameaças que devem ser testadas

- XSS capturando uma chave digitada antes do envio;
- IDOR alterando IDs de credencial ou provedor;
- policy RLS ausente ou permissiva;
- vazamento por stack trace, `console.log`, telemetria ou erro de fornecedor;
- replay de requisição de salvamento;
- ciphertext adulterado;
- rotação da chave-mestra;
- tentativa de usar uma credencial de outro usuário;
- provider spoofing por `base_url` controlada pelo cliente;
- SSRF por endpoint arbitrário;
- chave enviada como query string;
- abuso de endpoints de teste para gerar custo;
- reset de senha sem destruição do cofre;
- fallback pago silencioso.


## Decisões pendentes

- Qual regra de retenção será usada para o futuro histórico de gerações?
- Depois do rollout BYOK, a `GEMINI_API_KEY` da plataforma será removida do fluxo público, mantida apenas para smoke tests ou terá uma cota patrocinada explícita?
- O MVP permitirá somente uma chave por provedor ou precisará de múltiplas chaves/ambientes depois da validação inicial?
- Haverá MFA obrigatório ou opcional para contas que armazenam credenciais de provedores?
- Qual política de rotação será adotada para `USER_CREDENTIALS_MASTER_KEY`?

## Corpus canônico importado

- Artefato: `base-canonica-regras.md`.
- Auditoria de origem: `notebook-auditoria-fontes.md`, com as 19 fontes classificadas e as quatro lacunas de pesquisa registradas.
- Validação primária: `fontes-primarias-validadas.md`, com URLs oficiais, classificações e limites de evidência consultados em 6 de setembro de 2026.
- Referência fornecida: `https://notebook.google.com/notebook/5a5161c7-5d60-48e7-ac86-f2887f86d07c`.
- Integridade: SHA-256 `7b7e52a038a86e67248b4d98c02931a1fe1cccf5805eed1cb2d80a34ddbff509`.
- Destino: migration `20260906020000_import_canonical_prompt_rules.sql`, com 12 regras e lacunas normalizadas.
- Segurança editorial: a exportação do notebook foi fornecida diretamente, porém não contém a bibliografia nem URLs correspondentes às citações numéricas. Por isso, as regras entram como `supplied_unverified` e `is_active = false`; não alteram o perfil Grok nem a saída de produção até validação por fonte primária.

## Variáveis de ambiente

O repositório contém `.env.example` com as variáveis da função de backend.

### Estado atual

- `GEMINI_API_KEY`: segredo da própria plataforma, cadastrado na Vercel em Preview e Production.
- `GEMINI_MODEL`: modelo padrão da integração Gemini atual.
- `SUPABASE_URL`: URL pública do projeto.
- `SUPABASE_PUBLISHABLE_KEY`: chave publicável usada com RLS.

### Novo ciclo BYOK

Adicionar somente quando o passo de criptografia for implementado:

```dotenv
USER_CREDENTIALS_MASTER_KEY=<32-bytes-random-em-base64>
USER_CREDENTIALS_KEY_VERSION=1
ALLOW_PLATFORM_GEMINI_FALLBACK=false
```

Regras:

- `USER_CREDENTIALS_MASTER_KEY` deve ser gerada fora do código com entropia criptográfica, armazenada somente em Vercel Secrets e nunca exibida em logs.
- Preview e Production devem usar segredos administrados de forma controlada; rotação precisa de procedimento documentado antes de trocar a versão.
- `.env.example` deve conter apenas nomes/placeholders.
- `service_role` continua proibida no frontend, Git e documentação e não deve ser introduzida no fluxo normal de credenciais.
- Chaves BYOK de usuários nunca viram variáveis de ambiente da Vercel; são dados individuais criptografados no Supabase.
- O backend deve usar o JWT do próprio usuário para respeitar RLS ao buscar metadados/ciphertext.

## Regra de atualização

Ao fim de cada marco, atualizar as seções **Implementado**, **Validado**, **Ainda não implementado** e **Próximo marco**, além da linha correspondente no **Novo plano de dez passos** quando o ciclo BYOK estiver em execução. Nenhuma etapa deve ser marcada como validada sem evidência de teste.

Mudanças que afetem autenticação, criptografia, RLS, provedores ou recuperação de acesso também exigem atualização de `CONFIGURACAO_APIS.md` e uma entrada de auditoria com riscos, testes negativos e rollback.

#### Auditoria do passo 11 — 2026-09-07

- **Branch:** `step-11-byok-security-contract`, criada a partir da referência atualizada de `main` no commit `0007d5f`; o repositório não tinha remote configurado no ambiente, então `origin` foi restaurado para `lnpott/PROMPT_EXPERT` antes do fetch. O working tree estava limpo.
- **Escopo:** auditoria exclusivamente documental da arquitetura existente e validação do contrato de segurança para Supabase Auth, cofre BYOK e adaptadores. Nenhuma autenticação, migration, tabela, criptografia, credencial por usuário, segredo ou alteração de produção foi implementada.
- **Arquivos auditados:** `PROJECT_GUIDE.md`, `CONFIGURACAO_APIS.md`, `AUDITORIA_FINAL.md`, `.env.example`, `package.json`, `index.html`, `src/main.js`, `src/style.css`, todos os módulos de `api/`, as quatro migrations em `supabase/migrations/`, os três testes em `test/` e `vercel.json`.
- **Arquitetura encontrada:** SPA Vite em HTML/CSS/JavaScript nativos, estado efêmero em DOM/módulo, compilador determinístico local, cinco funções públicas e backend Gemini opcional. O backend acessa somente conteúdo público do Supabase via REST, chave publicável, grants e RLS; não existem Auth, `auth.uid()`, `service_role`, cofre ou chave-mestra.
- **Contrato e resultado:** `docs/BYOK_SECURITY_ARCHITECTURE.md` registra arquitetura atual/alvo, fronteiras de confiança, login, gravação/uso futuro, reset destrutivo, ameaças, RLS, AES-256-GCM/HKDF-SHA-256, rotação, rollback e mapa dos passos 12–20. A arquitetura planejada foi ratificada com controles adicionais e está aprovada apenas para iniciar o passo 12.
- **Riscos:** XSS antes do envio, CSP ausente, CSRF conforme transporte da sessão, IDOR/RLS, vazamento de Authorization/log/stack, SSRF e spoofing de provedor, plaintext acidental, replay/abuso do teste, rate limit por instância, fallback pago, rotação e distinção segura entre recovery destrutivo e alteração voluntária de senha continuam abertos até os passos correspondentes.
- **Segredos:** a auditoria inventariou somente nomes e locais. `GEMINI_API_KEY`, `GEMINI_MODEL`, `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` são o contrato atual; `USER_CREDENTIALS_MASTER_KEY` e armazenamento de API keys de usuário não existem. Nenhum valor secreto foi incluído ou reutilizado.
- **Testes:** `npm test` aprovou 28/28 testes; `npm run evaluate` aprovou 54/54 casos; `npm run build` concluiu com seis módulos transformados; `git diff --check` não encontrou erros. A busca por padrões de possíveis segredos no repositório e no diff não encontrou padrão de segredo real; referências textuais a `service_role` são proibições/documentação/teste, não credenciais.
- **Rollback:** reverter o commit documental deste passo; não há schema, configuração remota ou deployment a desfazer.
- **Próxima ação:** Passo 12 em branch própria, alterando somente a fundação de Supabase Auth e preservando o modo local; os passos 13–20 permanecem planejados e não implementados.

#### Auditoria do passo 12 — 2026-09-07

- **Branch:** `step-12-auth-foundation`, criada a partir da `main` atualizada no merge `ac655d1` do PR #11, depois de confirmar o documento e o registro do Passo 11.
- **Arquivos alterados:** `package.json`, `package-lock.json`, `.env.example`, `CONFIGURACAO_APIS.md`, `index.html`, `src/main.js`, `src/style.css` e `PROJECT_GUIDE.md`; criados `src/lib/supabase.js`, `src/auth/session.js`, `src/auth/ui.js` e `test/auth-foundation.test.js`.
- **Arquitetura criada:** cliente oficial `@supabase/supabase-js` configurado somente por variáveis públicas Vite; controller independente para signup, login, logout, restauração, eventos de sessão e solicitação de recovery; renderização/ações de conta isoladas do fluxo principal. Email e feedback usam `textContent`; nenhuma senha ou sessão é persistida ou registrada por código próprio.
- **Guest mode:** abrir a aplicação, selecionar destino/tipo/motor, escrever briefing e usar o compilador determinístico continua possível sem login e mesmo sem configuração pública do Supabase. Apenas o placeholder “APIs e provedores” muda visualmente conforme a sessão.
- **Variáveis públicas:** adicionadas apenas `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` vazias ao exemplo. As variáveis backend existentes continuam separadas; nenhum segredo server-side recebeu prefixo `VITE_`.
- **Recuperação:** o pedido de email usa a API oficial e URL de retorno identificável; `PASSWORD_RECOVERY` é preservado como evento distinto. Não há troca de senha, cofre ou delete nesta etapa. O Passo 16 ainda deverá bloquear o cofre server-side e executar reset destrutivo antes de reabilitar BYOK.
- **Testes:** `npm test` aprovou 37/37 testes, inclusive nove cenários novos de Auth; `npm run evaluate` aprovou 54/54 casos; `npm run build` concluiu; `git diff --check` foi aprovado. A busca segura no diff não encontrou padrão de segredo real. A revisão do PR também confirmou que URL pública inválida preserva o guest mode e que o listener continua ativo após falha de restauração.
- **Limitações e riscos:** signup/login reais dependem de configurar as duas variáveis públicas e as opções de email/redirect do projeto Supabase; esta entrega usa proteção visual, não autorização de dados. Persistência padrão do SDK permanece exposta ao risco de XSS do navegador; CSP/hardening seguem para o Passo 19. Recovery destrutivo server-side permanece obrigatório no Passo 16.
- **Rollback:** reverter o commit do Passo 12 e remover as duas variáveis públicas do ambiente de build, se tiverem sido configuradas. Não há migration, tabela, credencial BYOK nem alteração de `/api/generate` a desfazer.
- **Próxima ação:** Passo 13 em branch própria para schema do catálogo/cofre e RLS com testes de isolamento. Os Passos 14–20 permanecem não implementados.



#### Auditoria de encerramento dos passos 4–7 e 10 — 2026-09-06

- Branch: `complete-core`.
- Commit: `32de2b7` (`test(quality): complete core prompt evaluation`).
- Pull request: [#8 — Conclui núcleo com avaliação reproduzível e telemetria segura](https://github.com/lnpott/PROMPT_EXPERT/pull/8).
- Escopo revisado: aplicabilidade das regras ao Grok, proteção do endpoint, telemetria sanitizada, avaliação reproduzível e contratos multi-modelo.
- Decisão editorial do passo 4: nenhuma das 12 regras importadas é simultaneamente verificada por evidência confirmada **e** específica do Grok; por isso, zero regras foram promovidas. Não ativar conteúdo inadequado é o resultado seguro e esperado.
- Proteção e observabilidade: tipos de tarefa passam por allowlist; o limite retorna `Retry-After`; cada resultado registra somente identificador, modelo, origem, status, duração, tentativas e classe de erro.
- Avaliação: `npm run evaluate` executa 54 combinações (nove perfis × seis tipos de tarefa) e falha o processo em qualquer regressão de contrato.
- Segurança e dados pessoais: briefing, prompt e credenciais não aparecem na telemetria; o produto não cria contas nem persiste gerações.
- Passos 8 e 9: adiados deliberadamente. Autenticação sem funcionalidade dependente e administração web sem operadores definidos ampliariam superfície de ataque e coleta de dados sem benefício ao fluxo público.
- Rollback: reverter o commit desta entrega; não há mudança de banco nesta etapa e as regras canônicas continuam inativas.
- Preview: deployment Vercel `READY`; health, nove perfis e proveniência responderam HTTP 200. Em três gerações reais, a primeira e a segunda usaram o fallback local seguro por indisponibilidade/timeout transitório e a terceira respondeu pela Gemini, comprovando os dois caminhos sem interromper o produto.
- Estado final: núcleo funcional concluído; expansões futuras dependem de requisito de negócio, evidência nova ou escala operacional.
