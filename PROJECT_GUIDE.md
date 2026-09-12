# PROMPT_EXPERT — Guia vivo do projeto

> Estado revisado em 12 de setembro de 2026 — core público, cofre BYOK,
> geração multi-provider e metodologia verificável. As seções datadas
> abaixo preservam o histórico e não substituem este estado presente.

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

O contrato atual separa `generationProvider`, `generationModel`,
`credentialSource`, `taskType` e `targetModel`. Google Gemini aceita
Plataforma ou BYOK; OpenRouter, OpenAI, xAI, Anthropic, DeepSeek, Mistral,
GroqCloud e Kimi usam BYOK; local é uma estratégia separada. Alibaba/Qwen
permanece inativo e sujeito a autorização de rollout. O catálogo definitivo e
suas ressalvas estão na seção do Passo 19.1; bullets antigos abaixo descrevem o
estado existente quando cada marco foi registrado.

## Fluxo oficial de uso do produto

O produto transforma um pedido em linguagem natural em um **prompt otimizado**:

```text
briefing → generationProvider/generationModel → taskType → targetModel
         → gerar → prompt otimizado → copiar
```

- O core local/determinístico é público: visitante pode abrir o gerador,
  escolher tipo e target, gerar e copiar sem conta, chave ou API paga.
- Conta é opcional para o core e obrigatória somente para identidade persistente,
  gerenciamento de credenciais e execução BYOK. Selecionar BYOK deslogado mostra
  um CTA para entrar, sem expulsar o visitante do gerador.
- `generationProvider` e `generationModel` identificam quem efetivamente refina
  o prompt. `targetModel` seleciona somente a metodologia: não é executado, não
  exige credencial e pode pertencer a outra família.
- Google Gemini com `credentialSource=platform` conserva a política existente:
  exige sessão na UI para limitar risco de quota. O backend histórico não foi
  ampliado nem recebeu novo segredo neste passo. BYOK nunca faz fallback oculto.

### Roadmap oficial a partir do Passo 20

| Passo | Estado | Objetivo |
| --- | --- | --- |
| 20 | Concluído no PR #30 | Base metodológica verificável, corpus 1.0.0 e runtime fail-closed. |
| 20.1 | Concluído no PR #31 | Alinhar o fluxo real: core local público, prompt como resultado e conta apenas quando necessária. |
| 20.1-A/B | Atual | Desbloquear o catálogo de providers e exibir labels PT-BR de credencial no gerador. |
| 20.2 | Planejado | Pesquisa editorial de diferenças metodológicas por versão específica de modelo. |
| 20.3 | Planejado | Revisar o corpus para 1.0.1 ou 1.1.0 com base no benchmark. |
| 21 | Planejado | Persistência/proveniência metodológica no Supabase, somente se justificada e autorizada. |
| 22 | Planejado | Hardening operacional e UX. |

O rollout Alibaba/Qwen continua opcional, separado e não bloqueia este roadmap.

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
- Schema versionado do catálogo de provedores e do futuro cofre BYOK, com grants mínimos, RLS por proprietário, dez provedores iniciais e endpoint público `/api/providers`; a migration ainda não foi aplicada remotamente e não existe armazenamento funcional de chaves.

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
- Contratos do Passo 13 validados localmente por 46 testes Node: estrutura da migration, grants, policies separadas, bloqueio de alteração de identidade da credencial e resposta pública de `/api/providers`. O teste pgTAP de isolamento A/B/anônimo foi versionado, mas ainda depende de uma stack PostgreSQL/Supabase apropriada para execução real.

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
| 13 | Schema do catálogo e cofre com RLS. | Criar `api_providers` e `user_api_credentials`; migrations reversíveis; isolamento por usuário provado com testes. | `feat(database): add byok credential vault schema` | Concluído no remoto: migration aplicada e 38/38 pgTAP aprovados |
| 14 | Criptografia de aplicação. | Implementar AES-256-GCM + HKDF, versionamento, testes de round-trip/tamper e zero plaintext em persistência/logs. | `feat(security): encrypt user api credentials` | Concluído na branch; migration aplicada e validada no remoto |
| 15 | Gestão de credenciais na interface. | Tela APIs/provedores, links oficiais, salvar/substituir/testar/excluir e exibição mascarada. | `feat(settings): add provider credential manager` | Concluído na branch: API autenticada e interface de gestão implementadas |
| 16 | Recuperação destrutiva do cofre. | Esquecimento de senha exige aviso explícito e destrói credenciais antes de reativar o uso; alteração com senha atual preserva cofre. | `feat(auth): add destructive vault recovery` | Concluído |
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

#### Auditoria do passo 13 — 2026-09-07

- **Branch:** `step-13-byok-vault-schema`, criada da `main` atualizada no merge `5b05a21` do PR #12. O diretório não rastreado `.freebuff/` já existia e permaneceu fora do escopo.
- **Migration:** `20260907195224_create_byok_vault_schema.sql`, criada com Supabase CLI `2.117.0`, cria `api_providers` e `user_api_credentials`, habilita e força RLS, define grants explícitos, policies e seed auditável. A CLI global e o Docker não estavam disponíveis; a CLI foi executada localmente via cache do `npx`.
- **Schema e constraints:** UUIDs gerados no banco; slug único e normalizado; categoria limitada a `direct`/`gateway`; URLs somente HTTPS; estados e ordem limitados por `CHECK`; FK de usuário com `ON DELETE CASCADE`; FK de provedor com `ON DELETE RESTRICT`; unicidade `(user_id, provider_id)`; índice separado para `provider_id`. `ciphertext`, `iv`, `auth_tag`, `key_version`, `secret_last4` e `last_validated_at` permanecem nullable e são obrigatoriamente nulos por uma constraint temporária; `validation_status` permanece `untested`. O Passo 14 deverá substituir essa barreira por constraints de formato/tamanho junto com a criptografia funcional.
- **RLS e grants:** `anon` e `authenticated` recebem somente `SELECT` no catálogo, cuja policy retorna apenas `is_active = true`. `anon` não recebe acesso ao cofre. `authenticated` recebe `SELECT` e `DELETE`; o `INSERT` permite apenas `user_id`, `provider_id` e `label`, e o `UPDATE` apenas `label` e `updated_at`. O `id` é sempre gerado pelo banco, e `user_id`, `provider_id`, material criptográfico, status, `id` e `created_at` não podem ser alterados nesta etapa. Policies separadas usam `(select auth.uid()) = user_id`, com `USING` e `WITH CHECK` no update.
- **Catálogo inicial:** OpenRouter, Google Gemini, xAI, OpenAI, Anthropic/Claude Platform, DeepSeek, Mistral, GroqCloud, Alibaba Cloud Model Studio/Qwen e Kimi. Nove entradas ficam ativas. Alibaba fica versionada como inativa e sem `base_url`/URL direta de chave porque host, credencial e modelos dependem de região, workspace e plano; ativação exige contrato server-side específico.
- **Endpoint:** `GET /api/providers` usa a abstração REST existente com chave publicável, filtro ativo no PostgREST e allowlist explícita de colunas públicas. `base_url` e `auth_scheme` permanecem fora da resposta por serem configuração de roteamento. Métodos mutáveis retornam 405; indisponibilidade do catálogo falha fechada com 503. Nenhum dado do cofre entra na resposta.
- **Testes executados:** `npm test` aprovou 46/46 testes após `npm ci`; `npm run evaluate` aprovou 54/54 casos; `npm run build` concluiu com 51 módulos transformados; `git diff --check` não encontrou erros. Os novos casos cobrem schema, constraints, grants, policies, catálogo, endpoint e ausência de criptografia. O teste SQL `supabase/tests/database/byok_vault_rls.test.sql` prepara 38 asserções pgTAP para usuário A, usuário B, anônimo, catálogo, IDs inexistentes e cascata.
- **Testes não executados:** `supabase test db --local` e `supabase db lint --local` foram solicitados pela CLI, mas não chegaram a executar SQL: ambos receberam `ECONNREFUSED` no PostgreSQL local `127.0.0.1:54322`. O ambiente não possui Docker, `supabase/config.toml` ou banco local. Execução real requer uma stack Supabase descartável/apropriada; o projeto remoto não foi usado porque esta etapa não autorizou alterações de infraestrutura.
- **Segurança:** `base_url` é controlada apenas pelo catálogo sem grants de escrita pública; grants por coluna impedem troca de proprietário/provedor e qualquer escrita de material criptográfico antes do Passo 14; não há policy `FOR ALL`, plaintext, chave real, `service_role` na aplicação, AES, HKDF, chave-mestra ou endpoint de gestão de credenciais. A busca segura nas linhas adicionadas encontrou zero padrões de chave Google/provedor, JWT Supabase, token GitHub, chave privada ou atribuição de segredo; a única fixture de credencial persiste somente IDs e rótulo não secreto, com material criptográfico nulo.
- **Riscos:** SQL/pgTAP ainda precisam de execução real; o catálogo no banco não substitui a futura allowlist compilada do backend; metadata e ciphertext do próprio usuário serão legíveis sob seu JWT no desenho atual; `updated_at` dependerá do futuro fluxo de escrita; links e endpoints dos provedores exigem revisão antes dos adaptadores dos Passos 17–18.
- **Rollback:** antes de uso funcional ou dados reais, criar uma migration de rollback revisada com `drop table if exists public.user_api_credentials;` seguido de `drop table if exists public.api_providers;`, e reverter o endpoint/testes no mesmo release. Esse SQL não foi executado por ausência de stack local e, em ambiente remoto, exige autorização explícita; nenhuma reversão remota é necessária nesta entrega local.
- **Arquivos alterados:** `api/knowledge-base.js`, `api/providers.js`, `supabase/migrations/20260907195224_create_byok_vault_schema.sql`, `supabase/tests/database/byok_vault_rls.test.sql`, `test/api-access.test.js`, `test/byok-vault-schema.test.js`, `PROJECT_GUIDE.md` e `CONFIGURACAO_APIS.md`.
- **Próxima ação:** após revisão, execução do pgTAP e aplicação autorizada da migration em ambiente apropriado, encerrar o Passo 13. O próximo desenvolvimento é o Passo 14, em outra branch, para criptografia de aplicação; ele não foi iniciado aqui.

#### Encerramento remoto do passo 13 — 2026-09-07

- A migration `20260907195224_create_byok_vault_schema.sql` foi aplicada e registrada no Supabase remoto do PROMPT_EXPERT após o merge do PR #13.
- As duas tabelas, constraints, grants mínimos, cinco policies e RLS habilitada/forçada foram confirmados diretamente nos catálogos do banco. A suíte pgTAP original aprovou 38/38 asserções para anônimo, usuário A e usuário B.
- Todas as fixtures foram executadas dentro de transação com rollback; o cofre e os usuários descartáveis ficaram ausentes ao final. Com isso, o Passo 13 está concluído.

#### Auditoria do passo 14 — 2026-09-08

- **Branch:** `step-14-byok-encryption`, criada da `main` que já continha o merge `ce9f9c7` do PR #13.
- **Camada server-side:** `api/security/credential-crypto.js` usa somente `node:crypto`; valida uma master key de exatamente 32 bytes em Base64 canônico e uma versão decimal positiva. Ausência ou má formação falha fechada por erro próprio genérico, sem material sensível.
- **Derivação e cifra:** HKDF-SHA-256 produz subchave de 32 bytes por usuário. O salt público versionado é `PROMPT_EXPERT/BYOK/HKDF-SHA-256/salt/v1`; `info` usa `PROMPT_EXPERT/BYOK/user-key/v1`, separadores NUL, versão da chave e UUID canônico do usuário. AES-256-GCM usa IV aleatório de 12 bytes por gravação e tag de 16 bytes. Binários persistíveis usam Base64 canônico.
- **AAD e formato:** a AAD é o UTF-8 da matriz JSON ordenada `[domínio, formatVersion, keyVersion, userId, providerId, credentialId]`, com domínio `PROMPT_EXPERT/BYOK/credential`, formato `1` e UUIDs minúsculos. Essa representação fixa ordem, tipos e limites sem concatenação ambígua. Troca de usuário, provedor, credencial ou versão, assim como alteração de IV, tag ou ciphertext, falha antes de retornar qualquer plaintext.
- **Versão e dica:** a versão ativa vem de `USER_CREDENTIALS_KEY_VERSION`, é gravada com o material e precisa coincidir na leitura; versões desconhecidas são rejeitadas. Esta entrega suporta uma chave ativa e prepara o campo para um keyring futuro, mas não implementa rotação/recriptografia. `secret_last4` contém somente quatro caracteres; segredos menores produzem `null` para não revelar o valor inteiro.
- **Migration:** `20260908120000_enable_byok_encrypted_credentials.sql` remove apenas a barreira temporária do Passo 13 e adiciona uma constraint que aceita uma linha legada sem material ou um conjunto criptográfico completo: ciphertext Base64 de 1–16.384 bytes, IV Base64 de 12 bytes, tag Base64 de 16 bytes, versão positiva e estado/timestamp coerentes. Não há coluna de plaintext. Grants adicionais são por coluna: o `id` entra no INSERT porque precisa existir antes da cifra para integrar a AAD; campos criptográficos entram em INSERT/UPDATE. `user_id`, `provider_id` e `created_at` continuam imutáveis no update, `anon` continua sem grant e as policies não foram alteradas.
- **Supabase remoto:** antes da aplicação, `user_api_credentials` tinha zero linhas e a migration ainda não estava registrada. A migration foi validada dentro de transação, aplicada somente ao projeto correto e registrada. Depois, a suíte original passou 38/38 e a nova passou 16/16. Catálogos confirmaram constraint definitiva, RLS habilitada/forçada, quatro policies intactas, grants mínimos, zero fixtures e zero credenciais. A extensão pgTAP temporária também foi revertida.
- **Testes:** `npm test` aprovou 61/61 testes, incluindo round-trip, IV único, tamper de todos os componentes, AAD/contextos incorretos, versão desconhecida, configuração inválida, limites/tamanhos e ausência de plaintext. `npm run evaluate` aprovou 54/54 casos; `npm run build` transformou 51 módulos. O módulo server-side não é importado por `src/` nem aparece como entrada do bundle. `git diff --check` e a varredura segura do diff foram aprovados; `api/generate.js` e o guest mode não mudaram.
- **Segredos e escopo:** `.env.example` contém somente placeholder vazio e versão não secreta. Nenhuma master key real foi criada/configurada, nenhuma API key real foi persistida, nenhum `service_role`, endpoint/UI BYOK ou integração de provedor foi introduzido. Buffers de master key/subchave são sobrescritos quando possível; JavaScript não garante apagamento físico imediato pela coleta de lixo.
- **Riscos/limitações:** o backend ainda não possui endpoint consumidor, validação JWT para o futuro cofre, keyring/rotação, recriptografia ou configuração operacional da master key real. Usuários autenticados podem enviar material estruturalmente válido diretamente ao PostgREST, mas RLS mantém propriedade; somente o futuro backend saberá produzir material autenticável. O ciphertext continua visível ao próprio dono por contrato do Passo 13.
- **Rollback:** se ainda não houver credenciais, uma migration revisada pode revogar apenas os novos grants, remover `user_api_credentials_crypto_material_check` e restaurar a constraint temporária do Passo 13. Se houver ciphertext, não restaurar a barreira nem apagar/downgradear dados; primeiro restaurar código compatível e preservar a chave/versionamento. Reverter o commit remove código e documentação, mas não substitui uma migration remota de rollback.
- **Configuração pendente:** gerar e cadastrar `USER_CREDENTIALS_MASTER_KEY` real como segredo server-side continua sendo ação operacional explícita antes de receber credenciais. Nenhum valor foi provisionado nesta etapa.
- **Próxima ação:** Passo 15, em branch e PR próprios, para gestão de credenciais. O Passo 15 não foi iniciado.

#### Auditoria do passo 15 — 2026-09-08

- **Branch e escopo:** `step-15-byok-credential-management`, criada da `main` no merge `947f1e3` do PR #14. Foram implementados somente gestão de credenciais e o ajuste versionado necessário da constraint criptográfica; `/api/generate`, adaptadores de provedores, recovery e Passos 16–18 permaneceram fora do escopo.
- **Autenticação em profundidade:** todos os endpoints do cofre exigem bearer token. O backend valida o token em `Supabase Auth /auth/v1/user`, obtém `user_id` exclusivamente da identidade validada e encaminha o mesmo JWT com a chave publicável ao PostgREST, mantendo RLS como segunda barreira. Não há `service_role`; `user_id` do body é rejeitado pelo schema estrito.
- **Endpoints:** `GET /api/credentials` retorna somente provider slug/nome, label, `secret_last4`, status e timestamps. `PUT /api/credentials/:provider` exige JSON limitado, provedor ativo do catálogo, define o UUID antes da cifra e faz um único POST ou PATCH com material AES-GCM completo; substituições preservam o ID/AAD. `DELETE` no mesmo caminho é idempotente e limitado por provedor sob RLS. `POST /api/credentials/:provider/test` autentica/decriptografa somente em memória e informa `local_integrity`, sem chamada, custo ou alegação de validação no provedor.
- **Proteção de segredo:** respostas usam DTO por allowlist e nunca incluem plaintext, ciphertext, IV, tag, versão, JWT ou Authorization. O body aceita somente `secret` e `label`, limita payload a 18.000 bytes e segredo a 4–16.384 bytes, exige `application/json` e limpa o campo/referências assim que possível. Erros de configuração/criptografia são genéricos e não refletem entrada.
- **Interface:** a área autenticada combina o catálogo público `/api/providers` com `/api/credentials`, renderiza via `createElement`/`textContent`, apresenta estados configurada/não configurada, dica final, status e ações adicionar/substituir/testar/remover. O input é `password`, nunca é repopulado, é limpo antes do `await`, não usa Web Storage/cookies e remoção exige confirmação. Logout limpa a lista; respostas atrasadas de outra sessão são descartadas. Guest mode e compilador local continuam independentes.
- **Correção da revisão do Passo 14:** o comentário inline do PR #14 identificou que `CHECK` aceita resultado SQL `NULL`; portanto, material completo sem `key_version` poderia ultrapassar a constraint. A nova migration `20260908160000_require_byok_key_version.sql` recria somente a constraint com `key_version is not null`. Ela foi validada em transação, aplicada e registrada no Supabase remoto com cofre previamente vazio. Não houve mudança de grants, policies, Auth ou outros recursos.
- **Banco remoto e RLS:** depois da migration, pgTAP aprovou 38/38 na suíte original e 17/17 na suíte criptográfica ampliada. RLS permanece habilitada/forçada, as quatro policies permanecem, `anon` possui zero grants no cofre e o teste rejeita material sem versão. Todas as fixtures foram revertidas; zero usuários de fixture, zero credenciais e nenhuma extensão pgTAP permaneceram.
- **Testes e build:** `npm test` aprovou 74/74 testes; `npm run evaluate` aprovou 54/54; `npm run build` concluiu com o módulo criptográfico apenas no backend; `git diff --check` e varredura segura do diff foram aprovados. Testes cobrem autenticação, allowlist de resposta, criação/substituição, delete idempotente, integridade local, A/B, provedor inválido/inativo, payload/content-type/tamanho, master key ausente, limpeza do input e ausência de Web Storage.
- **Master key operacional:** `USER_CREDENTIALS_MASTER_KEY` não estava presente neste ambiente e nenhum secret da Vercel foi lido ou alterado. O código está pronto e foi testado apenas com chaves efêmeras em memória; persistência real continua bloqueada por falha fechada até provisionamento explicitamente autorizado.
- **Limitações:** o teste prova integridade criptográfica, não validade junto ao provedor, e mantém `validation_status = untested`/`last_validated_at = null`. Ainda não há proteção distribuída contra abuso, adaptadores, uso no gerador, rotação completa, recovery destrutivo ou master key real. Criação/substituição é uma gravação atômica individual após lookup; uma corrida simultânea de primeira criação pode retornar conflito de unicidade sem corromper a linha existente e deve ser repetida pelo usuário.
- **Rollback:** reverter o commit remove UI/endpoints, preservando guest mode. Como a migration corretiva já está remota, rollback de schema exige nova migration revisada e só deve remover o `is not null` se houver justificativa; não alterar migrations aplicadas nem converter ciphertext em plaintext. Desabilitar os endpoints no deploy é o rollback operacional seguro, sem apagar credenciais.
- **Próxima etapa:** Passo 16, em branch e autorização próprias, para recovery destrutivo. O Passo 16 não foi iniciado.

#### Auditoria do passo 15.5 — 2026-09-08

- **Branch e escopo:** `step-15-5-provider-model-catalog`, criada da `main` no merge `28aa565` do PR #15. O catálogo ganhou apresentação e descoberta, sem alterar `api/generate.js`, criptografia, Auth, credenciais ou iniciar os Passos 16–18.
- **Estrutura provider/model:** a migration `20260908230000_enrich_provider_model_catalog.sql` preserva `api_providers` como entidade pai e adiciona somente metadados opcionais de apresentação, links oficiais, cobrança, compatibilidade, região, fontes e verificação. A nova `ai_models` mantém identificador oficial, família, modalidades/capacidades, limites, preços estruturados, free tier, publicação, depreciação, fontes e FK para o provedor. Campos desconhecidos permanecem `NULL`; não se usa JSON arbitrário nem mídia binária.
- **Fontes e atualização:** os dez provedores e doze modelos curados foram verificados em páginas oficiais de modelos, API e pricing de OpenRouter, Google AI for Developers, xAI, OpenAI Developers, Anthropic, DeepSeek, Mistral AI, Groq, Alibaba Cloud Model Studio e Moonshot AI/Kimi. URLs de fonte acompanham os registros e `last_verified_at = 2026-09-08` explicita a validade temporal; preço, catálogo, limites e disponibilidade exigem revisão periódica.
- **Pricing e free tier:** preços comparáveis são `numeric` em moeda/unidade explícitas, sem conversão silenciosa; exceções por cache, contexto, modalidade, região ou roteamento ficam em `pricing_notes`. `free_tier_status` distingue indisponível, cota limitada, gratuito e gratuito somente via gateway; créditos promocionais não são rotulados como grátis.
- **Mídia:** somente URLs HTTPS oficiais são permitidas. Logos usam origem institucional quando confirmada e a UI possui fallback textual; mídia/vídeo fica `NULL` quando não há recurso oficial útil, e nunca condiciona a funcionalidade.
- **API pública:** `GET /api/providers` usa allowlists explícitas, aceita somente GET, devolve provedores com seus modelos públicos aninhados, omite IDs internos, `base_url`, `auth_scheme` e todo dado de `user_api_credentials`, e esconde provedor/modelo não publicável, inativo ou depreciado. As rotas opcionais de detalhe foram removidas no Passo 16.5 para respeitar o limite operacional de Functions sem afetar a UI.
- **UI:** a área “APIs e provedores” combina o catálogo público com os metadados autenticados do cofre. Cards mostram logo/fallback, resumo, conexão, capacidades, cobrança/free tier, modelos principais e links; detalhes expansíveis apresentam descrição, limitações, pricing, contexto, status, fontes e última verificação. Ausências de preço ou mídia são tratadas sem inferência e a gestão de segredo do Passo 15 permanece intacta.
- **Correções da revisão do PR #15:** substituição sem `label` agora preserva o rótulo anterior. Exclusão de credencial em provedor posteriormente inativado continua possível: a policy autenticada do catálogo permite enxergar somente o provedor inativo ao próprio dono de uma credencial, enquanto anônimo e demais usuários continuam vendo apenas ativos. Criação e teste ainda exigem provedor ativo.
- **RLS, grants e remoto:** `ai_models` tem RLS habilitada e forçada, leitura `SELECT` para `anon`/`authenticated` somente de modelos ativos, públicos, não depreciados e cujo provedor esteja ativo, e nenhuma escrita pública. A migration principal e a correção restritiva `20260908233000_scope_models_to_active_providers.sql` foram validadas, aplicadas e registradas no Supabase remoto; o catálogo final contém 10 provedores (9 ativos), 12 modelos curados e 11 modelos atualmente visíveis, pois o modelo Qwen acompanha o provedor regional inativo. O schema de `user_api_credentials` permaneceu com o mesmo hash auditado, zero credenciais e zero fixtures.
- **Testes:** as suítes pgTAP remotas aprovaram 38/38 (cofre), 17/17 (criptografia) e 20/20 (catálogo). Testes JS cobrem migration/FK/RLS/grants, allowlists/404/405, ocultação de inativos e depreciados, UI com e sem preço/mídia/free tier, correções de revisão, guest mode e invariância do gerador. `npm test`, avaliação, build, diff check e varredura de segredos foram aprovados na conclusão desta branch.
- **Riscos e limitações:** dados comerciais são instantâneos e podem mudar; algumas opções dependem de região, conta ou gateway e por isso ficam nulas ou qualificadas. Não há sincronização automática, comparação cambial, chamada a provedor, saldo/quota/plano, adaptador de geração ou uso de BYOK no gerador. URLs externas podem mudar e sempre têm fallback visual.
- **Rollback:** reverter a UI/endpoints pelo commit desta entrega. Como a migration está aplicada, rollback de banco requer nova migration revisada: revogar acesso e remover `ai_models` antes de remover apenas as novas colunas de `api_providers`; não editar migration aplicada, não tocar em `user_api_credentials` e não apagar catálogo sem confirmar dependências.
- **Próxima etapa:** Passo 16, sob branch e autorização próprias. Os Passos 16, 17 e 18 não foram iniciados.

#### Auditoria do passo 16 — 2026-09-08

- **Branch e escopo:** `step-16-destructive-password-recovery`, criada da `main` no merge `4d4634f` do PR #16. A entrega altera somente recuperação/troca de senha, purge do cofre, testes e documentação; catálogo, criptografia, Auth remoto, `/api/generate` e Passos 17–18 permanecem inalterados.
- **Garantia realmente disponível:** o SDK Supabase emite `PASSWORD_RECOVERY` no navegador depois que o link de recuperação estabelece a sessão. A auditoria da documentação oficial e da resposta `/auth/v1/user` não encontrou claim ou propriedade server-side documentada que diferencie de forma inequívoca esse access token de uma sessão autenticada comum. Portanto, a UI usa o evento como controle de fluxo, mas o backend não aceita nem afirma uma flag `recovery` do cliente. O endpoint de purge autoriza somente a destruição dos dados do próprio JWT validado; ele não afirma provar a origem recovery da sessão.
- **Mecanismo necessário para garantia absoluta:** uma transação de recovery controlada pelo backend, criada antes do envio do email, com nonce opaco de uso único armazenado server-side, validade curta e vínculo ao usuário/evento verificado por hook ou exchange confiável do Supabase. Somente esse marcador poderia restringir o endpoint exclusivamente a recovery. Implementá-lo exige mudança coordenada no fluxo Auth e infraestrutura não fornecida pelo contrato atual; inventar um marcador a partir de boolean do navegador seria uma falsa garantia.
- **Fluxo destrutivo:** `PASSWORD_RECOVERY` fica latched no controller até logout/conclusão, oculta sessão comum e catálogo/cofre e mostra formulário exclusivo com aviso. A ordem é `POST /api/account/recovery/purge-credentials` → confirmação `{ purged: true }` → `auth.updateUser({ password })` → logout obrigatório. O novo login reduz o risco de manter uma sessão de recuperação ativa.
- **Purge:** o endpoint aceita somente POST, valida o bearer token em `/auth/v1/user`, deriva `user_id` exclusivamente dessa identidade e executa DELETE filtrado pelo mesmo ID sob o JWT e RLS. Ele não lê/decriptografa/copia credenciais, não depende da master key, não retorna contagem ou material e é idempotente para cofre já vazio. `user_id` no body é ignorado e não altera autoridade.
- **Falhas e concorrência:** falha do purge impede `updateUser`; a UI mantém o estado de recovery e oferece nova tentativa com erro genérico. Duplo clique é bloqueado por `aria-busy`; chamadas repetidas/refesh continuam seguras pelo delete idempotente. Se o purge for confirmado e a troca de senha falhar, o cofre já está seguramente vazio e a tentativa pode ser repetida; o caso proibido — senha nova com credenciais antigas — não ocorre pela ordem escolhida.
- **Troca voluntária:** a operação normal `updatePassword` não chama purge. Como a chave criptográfica deriva de master key e `user_id`, a senha não participa da cifra; IDs, ciphertext, versão e metadados ficam preservados. Esta etapa não publica uma nova tela de troca voluntária sem reautenticação recente; o contrato foi testado no controller sem ampliar a superfície de conta.
- **Banco e remoto:** nenhuma migration foi necessária e nenhuma configuração ou dado remoto foi alterado. Os grants `DELETE` e a policy por `auth.uid()` existentes já suportam a operação. As suítes pgTAP remotas aprovaram 38/38 (cofre), 17/17 (criptografia), 20/20 (catálogo) e 8/8 no novo isolamento de purge A/B; todas rodaram em transações com rollback, e zero credenciais, usuários de fixture ou extensão pgTAP permaneceram.
- **Testes:** testes automatizados cobrem autenticação, autoridade exclusiva do JWT, body adulterado, A/B, múltiplas linhas, cofre vazio, resposta allowlisted, ausência de master key, UI exclusiva, ordem, falha, duplo envio, troca voluntária, latch de `PASSWORD_RECOVERY`, guest mode e invariância do gerador. `npm test`, `npm run evaluate`, `npm run build`, `git diff --check` e secret scan foram aprovados na conclusão.
- **Risco residual:** qualquer sessão válida do próprio usuário pode invocar diretamente o purge porque o Supabase não expõe prova server-side documentada do evento recovery; isso não permite atingir outro usuário, mas permite autodestruição do próprio cofre. XSS com JWT também mantém esse poder. A garantia absoluta depende do marcador server-side descrito acima. Exclusão é irreversível e não possui backup por decisão de segurança.
- **Rollback:** reverter código/UI desabilita o fluxo sem mudança de schema. O purge já executado não pode nem deve restaurar credenciais; o usuário precisa cadastrá-las novamente. Em incidente, desabilitar a rota e manter o guest mode, sem usar `service_role` ou recuperar ciphertext.
- **Próxima etapa:** Passo 17, sob autorização e branch próprias. Os Passos 17 e 18 não foram iniciados nesta entrega.

#### Auditoria do passo 16.5 — 2026-09-08

- **Projeto e acesso:** a API Vercel autenticada confirmou o projeto `prompt-expert`, ID `prj_d1OxCDz8PYgWsJxSrGfKCOXqg5bE`, Team `team_bKvMwCJYcXG71WxOUHonqEFx` e vínculo `lnpott/PROMPT_EXPERT`. O token é restrito ao Team e por isso `/v2/user` retorna `not_found`; a identificação autoritativa foi feita pelo endpoint de projeto com `teamId`, sem reproduzir o token.
- **Provisionamento:** antes da mudança, as duas variáveis BYOK estavam ausentes e `user_api_credentials` tinha zero linhas com RLS habilitada e forçada. Uma única master key CSPRNG de 32 bytes em Base64 canônico foi enviada diretamente da memória à Vercel como `Sensitive`, sem eco ou arquivo, para Preview e Production; `USER_CREDENTIALS_KEY_VERSION=1` foi configurada nos mesmos targets. O valor não foi lido, documentado, versionado nem enviado ao Supabase/frontend.
- **Estratégia de ambientes:** Preview foi usado para a validação. Preview e Production apontam para o mesmo cofre Supabase, então receberam a mesma chave para evitar ciphertext ilegível entre deployments. A configuração de Production fica disponível no próximo deployment aprovado; não foi promovido código de branch diretamente para Production.
- **Bug operacional corrigido:** os deployments posteriores ao Passo 14 falhavam com `exceeded_serverless_functions_per_deployment` porque helpers sob `api/` e rotas de detalhe opcionais elevavam a saída acima do limite de 12 Functions do plano. Helpers exclusivamente server-side foram movidos para `server/`, as três rotas redundantes de detalhe foram removidas e `GET /api/providers` continua fornecendo o catálogo/modelos consumido pela UI. O Preview final `dpl_AaHxuricz7GZJgjGUbDunhhgC7Uy` concluiu `READY` com 12 Functions e foi novamente submetido ao ciclo completo.
- **Ciclo remoto:** no Preview real, CREATE retornou 201; LIST devolveu somente metadados e `secretLast4`; o teste retornou `check=local_integrity`, `integrityVerified=true` e `providerValidated=false`; REPLACE retornou 200, preservou ID/rótulo e mudou IV/ciphertext; uma request posterior descriptografou o material substituído; DELETE e novo DELETE retornaram 204; a listagem final ficou vazia.
- **Inspeção segura e isolamento:** durante o ciclo, o banco confirmou apenas presença/tamanhos: ciphertext de 33 bytes, IV de 12 bytes, tag de 16 bytes, versão 1, dica final coerente e nenhuma coluna de plaintext. Usuário B recebeu lista vazia enquanto A possuía a linha. Nenhum binário, segredo ou JWT foi impresso. Usuários A/B, credenciais e demais fixtures foram removidos ao final.
- **Frontend:** o deployment carregou a UI e os endpoints; a automação confirmou o input de senha no bundle e o backend completo. Login E2E pelo navegador não pôde ser concluído porque as variáveis públicas `VITE_SUPABASE_URL`/`VITE_SUPABASE_PUBLISHABLE_KEY` já estavam ausentes em Preview e não faziam parte das duas únicas variáveis autorizadas nesta operação. Não foi contornada essa fronteira com segredo ou configuração adicional.
- **Logs:** os 37 eventos disponíveis do deployment foram inspecionados por contagem/padrões, sem imprimir conteúdo sensível; não houve ocorrência do segredo fictício, Authorization/Bearer, master key, ciphertext, IV, tag ou body de credencial.
- **Validação:** o fail-closed ausente/inválido continua coberto pelos testes automatizados e nenhuma variável operacional foi removida para testá-lo. `npm test`, avaliação, build, diff check, pgTAP/RLS e secret scan foram executados; nenhuma migration ou alteração no Supabase/Auth/catálogo foi necessária.
- **Estado e riscos:** cofre e usuários de fixture terminaram em zero; nenhuma API key real foi usada. A master key e versão 1 permanecem configuradas. Rotação/keyring continuam pendentes; Production precisa de deployment aprovado após merge e o login Preview precisa das variáveis públicas já contratadas para uma validação visual completa.
- **Rollback:** se não houver credenciais, remover as duas variáveis e redeployar desabilita o cofre por fail-closed. Depois de qualquer uso real, nunca remover/substituir a master key: primeiro desabilitar escrita, preservar o segredo, restaurar o deployment compatível e executar rotação aprovada. Reverter o commit restaura as rotas/helpers, mas também restaura o erro de limite de Functions.
- **Próxima etapa:** Passo 17, em branch/autorização próprias. OpenRouter e BYOK em `/api/generate` não foram iniciados.

#### Auditoria do passo 16.6 — 2026-09-09

- **Projetos e configuração:** o Supabase `PROMPT_EXPERT` (`pqprtkdvzyhqlidlcpxg`) e o projeto Vercel `prompt-expert` (`prj_d1OxCDz8PYgWsJxSrGfKCOXqg5bE`) no Team `team_bKvMwCJYcXG71WxOUHonqEFx`, vinculado a `lnpott/PROMPT_EXPERT`, foram revalidados antes da mudança. `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` estavam ausentes e foram configuradas somente com a URL pública e a chave publicável `default` do mesmo projeto, nos targets Preview e Production. Nenhum valor foi documentado, e nenhum secret administrativo recebeu prefixo `VITE_`.
- **Estratégia e deployment:** Preview e Production executam o mesmo frontend e usam o mesmo projeto Supabase, por isso receberam os mesmos identificadores públicos. A validação ocorreu em um redeploy Preview do commit `f0b4239` da `main`, sem commit artificial; o deployment `dpl_59DJJj4s5wxuLBWAjwptzYvkgemB` concluiu `READY` com o bundle reconstruído. A master key e sua versão não foram lidas nem alteradas.
- **QA visual E2E:** no Preview real, a página iniciou sem erro de configuração, o login criou sessão e exibiu a área autenticada, e o catálogo rico carregou. Pelo navegador, um usuário A criou uma credencial fictícia no OpenRouter; LIST mostrou apenas máscara final/metadados; o teste respondeu `local_integrity`, `integrityVerified=true` e `providerValidated=false`; REPLACE sem label preservou o rótulo e atualizou a máscara; reload, logout e novo login preservaram o estado. O input permaneceu `password`, foi limpo após o envio e nenhum segredo completo reapareceu. Nenhum provedor externo foi chamado.
- **Isolamento e exclusão:** enquanto A possuía a credencial, o login de um usuário B exibiu o mesmo provedor como sem credencial, comprovando o isolamento do fluxo normal sob JWT/RLS. A voltou a enxergar somente seus metadados, removeu a credencial pela UI e, após reload, o cofre apareceu vazio. Os dois usuários temporários foram excluídos e a conferência final encontrou zero fixtures e zero linhas no cofre.
- **Logs e validação:** os 37 eventos disponíveis do deployment foram inspecionados sem reproduzir seu conteúdo; não houve ocorrência do segredo fictício, Authorization/Bearer, master key, ciphertext, IV, tag ou body sensível. A automação do navegador terminou sem erros de console. `npm test`, `npm run evaluate`, `npm run build`, `git diff --check`, secret scan e os testes RLS aplicáveis foram reexecutados para encerrar a branch.
- **Alterações e riscos:** nenhuma migration, mudança de schema/Auth/RLS/criptografia/catálogo, integração de provider ou alteração funcional foi necessária. A URL e a chave publicável estão no bundle por design e dependem de RLS correto; XSS/CSP, rotação da master key, proteção distribuída contra abuso e hardening permanecem riscos das etapas futuras. Rollback desta configuração consiste em remover somente as duas variáveis públicas e redeployar, o que volta a desabilitar Auth visual preservando guest mode; isso não deve tocar na master key nem em credenciais persistidas.
- **Próxima etapa:** Passo 17, em branch e autorização próprias, para OpenRouter. OpenRouter, adapters e consumo BYOK em `/api/generate` não foram iniciados neste passo.



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

#### Passo 17 — OpenRouter BYOK — 2026-09-09

- O gerador aceita explicitamente `platform`, `local` e `openrouter`. O modo local nunca consulta API externa; o modo plataforma mantém Gemini e seu fallback histórico; o modo OpenRouter não faz fallback para Gemini nem para geração local.
- O adapter dedicado fixa `https://openrouter.ai/api/v1` no servidor, valida a chave em `GET /key` e gera em `POST /chat/completions`, com bearer construído exclusivamente no backend, timeout de 12 segundos, limite de resposta e parsing defensivo.
- O fluxo OpenRouter autentica pelo Supabase, consulta provider/modelo ativos e apenas a credencial visível ao próprio JWT/RLS, autentica AES-GCM/AAD e descriptografa somente no servidor. A validação persiste `valid`, `invalid` ou `error` e `last_validated_at`; apenas 401/403 tornam a chave inválida. 402, 404, 429, 5xx, timeout, rede e resposta malformada são erros operacionais.
- A interface oferece Plataforma, Somente local e OpenRouter BYOK. Exibe apenas `secretLast4` e os estados `untested`, `valid`, `invalid` e `error`; nenhum segredo completo retorna do backend.
- Somente OpenRouter foi implementado. Nenhuma API key real foi usada nesta validação automatizada e um smoke pago não foi declarado. O Passo 18 não foi iniciado.

#### Passo 18A — providers BYOK diretos OpenAI-compatible — 2026-09-09

- **Escopo:** foram adicionados exclusivamente OpenAI, xAI, DeepSeek, GroqCloud e Mistral. Gemini BYOK, Anthropic/Claude, Alibaba/Qwen, Kimi e demais providers permanecem fora de escopo; nenhuma migration, secret de plataforma ou mudança criptográfica foi necessária.
- **Pesquisa oficial (verificada em 2026-09-09):** OpenAI documenta [Models](https://platform.openai.com/docs/api-reference/models/list) e [Chat Completions](https://platform.openai.com/docs/api-reference/chat/create); xAI documenta sua [API Reference](https://docs.x.ai/docs/api-reference) e [Chat](https://docs.x.ai/docs/guides/chat); DeepSeek documenta [List Models](https://api-docs.deepseek.com/api/list-models) e [Create Chat Completion](https://api-docs.deepseek.com/api/create-chat-completion); GroqCloud documenta [API Reference](https://console.groq.com/docs/api-reference) e [Text/Chat](https://console.groq.com/docs/text-chat); Mistral documenta a [API](https://docs.mistral.ai/api/) e [Chat Completion](https://docs.mistral.ai/capabilities/completion/). A validação usa `GET /models`, operação oficial, autenticada, somente leitura e menos destrutiva que uma geração. Não se consulta saldo/plano nem se infere free tier.
- **Destinos fixos:** OpenAI `https://api.openai.com/v1`; xAI `https://api.x.ai/v1`; DeepSeek `https://api.deepseek.com`; GroqCloud `https://api.groq.com/openai/v1`; Mistral `https://api.mistral.ai/v1`. Todos usam bearer, `GET /models` para validação e `POST /chat/completions` para geração. Redirects são rejeitados; URL, endpoint, host, headers, auth e corpo bruto nunca vêm do cliente.
- **Arquitetura compartilhada:** `openai-compatible.js` concentra AbortController/timeout de 12s, fetch, bearer, limite de 1 MB, parsing, payload de chat allowlisted, resposta/usage normalizados e taxonomia segura. `direct-providers.js` é um registry imutável das peculiaridades de destino e faz o vínculo `groq` (seleção pública) → `groqcloud` (slug do catálogo/cofre). A abstração cobre somente os endpoints OpenAI-compatible efetivamente comuns.
- **Validação e erros:** 401/403 são a única evidência de `invalid`; 402 é crédito insuficiente; 429, 5xx, timeout, rede, redirects e resposta malformada persistem `error`. 404 de geração é modelo indisponível. Respostas brutas e mensagens upstream não atravessam a API.
- **Cofre/RLS/modelos:** o fluxo existente autentica JWT, resolve provider ativo, lê uma única credencial sob RLS, autentica AES-256-GCM/AAD vinculada ao provider e descriptografa server-side. O modelo precisa pertencer ao mesmo provider e estar ativo, público e não depreciado no catálogo. Não existe reutilização cross-provider nem segundo armazenamento.
- **Fallback:** falha em qualquer BYOK retorna diretamente ao navegador e nunca chama Gemini, OpenRouter, outro provider ou local. Foi corrigida uma regressão herdada do Passo 17 em que qualquer HTTP 404 no frontend acionava compilação local; agora esse fallback de compatibilidade é exclusivo de `platform`.
- **UI:** as oito origens explícitas são Plataforma, Somente local, OpenRouter BYOK e os cinco providers deste lote. Modelos são montados a partir do catálogo público e filtrados pelo provider selecionado; o navegador envia apenas provider e model IDs. Cards continuam mostrando somente máscara/metadados/status e usam o mesmo endpoint dinâmico, sem novas Vercel Functions.
- **Riscos e rollback:** disponibilidade/modelos/status HTTP dos providers podem mudar e exigem revisão das fontes; `GET /models` prova aceitação da key naquele instante, não saldo ou acesso a cada modelo. Rate limiting continua best-effort por instância. Rollback consiste em reverter o commit do Passo 18A; credenciais permanecem cifradas no cofre e não devem ser apagadas. O Passo 18B não foi iniciado.

#### Passo 18.5 — workspace autenticado e coerência provider/model — 2026-09-09

- **Account-first e loading:** a aplicação inicia somente com “Verificando sessão…”. Depois de `getSession`, visitante vê “Sua conta”; workspace, resultado, navegação privada e cofre permanecem ocultos. Sessão válida substitui a porta de entrada pelo gerador. A capacidade técnica local/backend permanece, mas a UI principal agora exige conta.
- **Sessão e recovery:** a renderização deriva exclusivamente do snapshot real do controller Supabase, que passou a expor `initialized`. Logout limpa briefing, resultado, origem/modelo BYOK, metadados locais e volta a `#login`. `PASSWORD_RECOVERY` tem precedência, mantém workspace/menu/cofre ocultos e preserva integralmente purge → troca de senha → sign-out.
- **Navegação:** hashes `#login`, `#app`, `#account`, `#providers` e `#account-recovery` fornecem estados SPA leves sem Functions ou rewrites. Rotas privadas são normalizadas conforme sessão: visitante é levado a login, autenticado em login vai ao app e recovery só mostra a conta destrutiva. O header autenticado exibe email/estado e links para Gerador, APIs e provedores e Sessão/Sair.
- **Provider/model:** “Modelo de destino” foi renomeado para “Perfil do prompt”, pois adapta o conteúdo e não escolhe a API. O antigo “Motor de compilação” era efetivamente o seletor Gemini da plataforma e agora se chama “Modelo da plataforma”, visível somente em `platform`. Para BYOK existe um único seletor “Modelo”, reconstruído do catálogo a cada troca de provider; Groq mapeia para `groqcloud`. Modelo anterior é removido por `replaceChildren`, e geração fica bloqueada sem modelo.
- **Credencial ausente:** providers BYOK continuam descobríveis. Sem credencial própria, a UI bloqueia antes do request, explica que a API não está configurada e oferece CTA para `#providers`; não seleciona Gemini, local, OpenRouter ou outro provider. Backend e suas validações provider/model/no-fallback continuam como autoridade e não foram alterados.
- **Escopo e segurança:** nenhuma migration, API backend, RLS, crypto, master key, variável Supabase, service role ou provider foi alterado/adicionado. O limite segue em 12 Functions. Gemini BYOK, Anthropic, Qwen/Alibaba e Kimi não foram iniciados.
- **Testes e rollback:** regressões cobrem loading sem flash, visitante, sessão restaurada, logout, recovery, rotas, header, CTA, todos os vínculos provider/model, remoção de modelo stale, seletor Gemini exclusivo da plataforma e no-fallback. Rollback é reverter o commit de UI; não há estado remoto/schema a desfazer.

#### Diagnóstico e tratamento de conectividade do Supabase Auth — 2026-09-09

- **Diagnóstico:** a Production do commit `332da41` foi auditada sem criar usuário. O bundle publicado contém uma única origem Supabase, `pqprtkdvzyhqlidlcpxg.supabase.co`, e uma chave com formato publicável `sb_publishable_`; não contém host `undefined` nem domínio Supabase alternativo. Na Vercel, `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` existem como encrypted em Preview e Production. Nenhuma variável foi lida integralmente ou alterada.
- **Conectividade externa:** DNS resolveu o host esperado para endereços públicos Cloudflare. A raiz respondeu 404 esperado para path inválido; `/auth/v1/health` respondeu 200 com GoTrue `v2.196.0` quando recebeu apenas a chave publicável. Um POST `/auth/v1/signup` deliberadamente inválido (`{}`) respondeu 422 sem usuário/token, comprovando DNS/TLS/rota Auth sem criar fixture.
- **Configuração Auth:** a API administrativa somente leitura informou email/password habilitado, signup permitido (`disable_signup=false`), confirmação por email ativa (`mailer_autoconfirm=false`), CAPTCHA desabilitado, Site URL da Production e quatro redirect URLs allowlisted. SMTP customizado não está configurado, portanto limites/entrega do mailer padrão continuam risco operacional; o limite configurado de emails é baixo e pode causar 429, mas não `ERR_NAME_NOT_RESOLVED`. Nenhuma configuração remota foi modificada.
- **Causa:** não foi encontrado erro de URL, env, build, payload ou SDK. `auth.signUp({ email, password })` usa diretamente `@supabase/supabase-js`, sem fetch wrapper, callback customizado ou fallback. `ERR_NAME_NOT_RESOLVED` é falha DNS no cliente e, diante da resolução remota saudável, permanece compatível com rede/DNS/browser local. Eventos `gc.kis.v2.scr.kaspersky-labs.com` demonstram injeção/bloqueio local do Kaspersky, mas não provam que ele bloqueou Supabase; não foi criado contorno.
- **Bug de UX corrigido:** o SDK pode rejeitar a Promise com `TypeError: Failed to fetch`/`AuthRetryableFetchError`. O controller não capturava essa rejeição, deixando “Criando conta…” e uma exceção no console. Sign-up, login e recuperação agora convertem somente falhas de transporte inequívocas em orientação sanitizada sobre conexão/DNS/bloqueio. Erros estruturados (`invalid_credentials`, confirmação, conta existente, signup desabilitado e 429) continuam distintos e não são rotulados como rede.
- **Escopo e rollback:** Supabase Auth segue como autoridade única. Não houve conta local, retry infinito, proxy, migration, RLS, crypto, vault, provider, master key ou `service_role`. Rollback consiste em reverter apenas o commit de tratamento de erro; não existe estado remoto a desfazer.

#### Passo 18.6 — modelo executor e modelo-alvo de otimização — 2026-09-10

- **Problema anterior e decisão:** a interface e o contrato de `/api/generate` sobrepunham “modelo”, “modelo do provider” e o antigo “motor de compilação”. O contrato definitivo separa os quatro eixos `generationProvider`, `generationModel`, `taskType` e `targetModel`. O primeiro escolhe a integração realmente chamada, o segundo é o API model ID executável, o terceiro altera a estrutura da tarefa e o quarto escolhe somente a metodologia. IDs/slugs estáveis são autoridade; `displayName` é exclusivamente apresentação.
- **Catálogos distintos:** o catálogo de geração é composto pelos modelos públicos, ativos e não depreciados de `ai_models`, associados a `api_providers`; pelos modelos Gemini allowlisted da Plataforma; e pela estratégia técnica estável `local-deterministic`. O catálogo de otimização é composto somente pelos nove `model_profiles` versionados e revisados. Um target é disponibilizado apenas quando seu profile local existe; o sistema não inventa versões nem expõe como suportado conteúdo apenas planejado. A base de Notebook não está disponível neste clone além dos exports já incorporados e documentados.
- **Metodologia:** `targetModel` resolve `model_profile` e `prompt_rules`; a instrução é compilada com briefing e `taskType` antes de ser enviada ao executor. `prompt_examples` está modelado no schema, mas não participa hoje do runtime de `getModelKnowledge`; sua incorporação exige corpus revisado e precedência explícita em etapa futura. Não existe fallback silencioso de target inválido/sem metodologia para família genérica, executor ou Gemini.
- **Execução e BYOK:** `generationProvider` seleciona o adapter; `generationModel` é validado server-side contra o mesmo provider e fornece o API model ID. Uma credencial BYOK é necessária somente para o provedor que executa a geração. O modelo-alvo de otimização não exige credencial e não é chamado pela aplicação. Um modelo DeepSeek pode gerar um prompt otimizado para Claude. Nesse caso, somente a API do DeepSeek é chamada. Existência de metadado no cofre aparece como “Use your own key” com o status persistido, não como prova de validade, saldo ou acesso; ausência aparece como “Configure your key first”, bloqueia gerar e oferece CTA, sem esconder o provider nem causar fallback. Nenhum teste remoto de chave ocorre no carregamento, restauração de sessão ou seleção.
- **Plataforma e local:** Plataforma permanece um serviço da aplicação e usa somente sua allowlist Gemini server-side; o fallback local histórico da Plataforma continua explícito na resposta. “Somente local” foi segregado visualmente como estratégia sem API, usa `local-deterministic` e preserva a capacidade backend, mas não é tratado como provider externo ou BYOK. Providers BYOK continuam sem fallback pago ou local.
- **Autoridade e contrato:** o navegador envia somente `brief`, `generationProvider`, `generationModel`, `taskType` e `targetModel`. Campos legados ambíguos (`provider`, `model`, `providerModel`, `compilerModel`) não são normalizados silenciosamente. O backend valida target/profile, provider executável, modelo da Plataforma ou vínculo provider/model no catálogo e credencial vinculada ao usuário/provider sob JWT/RLS. Labels, URL, host, headers e chaves enviados pelo cliente não controlam execução.
- **Segurança e schema:** nenhuma migration foi necessária. AES-256-GCM, HKDF-SHA-256, AAD, key version, user/provider binding, RLS, Auth, recovery destrutivo e limite de 12 Functions permanecem inalterados. Nenhum adapter do Passo 18B, configuração remota, secret ou teste pago foi adicionado.
- **Testes, limitações e rollback:** regressões cobrem filtro e troca de modelos executores, IDs estáveis, targets cross-family, target inválido fail-closed, contrato inequívoco, estado/CTA BYOK, ausência de teste automático de chave, seleção de adapter/model ID e compatibilidade de Plataforma/local/Auth/recovery/vault. A expansão do catálogo metodológico depende de fontes incorporadas e revisadas; exemplos ainda não são carregados no runtime. Rollback é reverter este commit de frontend/API/testes/documentação; não há schema ou estado remoto a desfazer.

#### Roadmap futuro após o Passo 18.6

| Marco | Estado e direção |
| --- | --- |
| 18.5 — account-first e coerência inicial provider/model | Concluído; Auth real libera workspace e protege navegação privada. |
| 18.6 — executor versus alvo metodológico | Esta entrega; consolida contrato, catálogos e validação independentes. |
| 18.6.1 — catálogo real de geração | Corrige provider, adapter, disponibilidade e origem/status de credencial sem alterar o target. |
| Account Security / Password Lifecycle | Planejado, sem implementação neste passo; detalhes abaixo. |
| 18B — adapters especializados | Futuro; expansão separada para providers ainda não executáveis. |
| Hardening e rollout | Futuro; observabilidade, segurança operacional e promoção controlada após os marcos anteriores. |

##### Marco planejado — gestão do ciclo de senha via Supabase Auth

- **Alteração voluntária autenticada:** estudar a tela Conta → Segurança → Alterar senha usando `supabase.auth.updateUser({ password })`. A dependência instalada é `@supabase/supabase-js ^2.109.0`; seus tipos incluem `current_password` e o cliente inclui `reauthenticate()`, mas suporte/configuração e regressões precisam ser auditados antes de uso. Se “Secure password change” exigir reautenticação, o fluxo oficial deverá obter nonce/OTP por `reauthenticate()` e fornecê-lo ao update. Como a master key não deriva da senha, esse fluxo deve preservar integralmente o vault.
- **Senha esquecida:** preservar `resetPasswordForEmail(email, { redirectTo })`, a sessão `PASSWORD_RECOVERY`, purge das credenciais do próprio usuário, `updateUser({ password })` e logout obrigatório já implementados no Passo 16. Esse fluxo permanece destrutivo para o vault e exige novo cadastro das chaves; não usar `service_role` nem `admin.updateUserById`.
- **Separação e privacidade:** mudança voluntária autenticada preserva o vault; recuperação por email destrói o vault conforme contrato. A resposta pública de recuperação deve continuar semanticamente equivalente a “Se houver uma conta associada a este email, enviaremos as instruções”, sem enumeração de usuários.
- **Redirects e entrega:** antes da implementação, auditar Production, Preview, Site URL, allowlist, `#account-recovery`, refresh e sessão recovery. Confirmação de cadastro, recovery e reautenticação dependem de email; o mailer padrão atual do Supabase deve ser reavaliado para SMTP próprio no hardening, sem alterar SMTP agora.
- **Testes planejados:** cobrir senha atual incorreta quando aplicável, change password, reauthenticate/nonce, vault preservado na alteração voluntária, `resetPasswordForEmail`, `PASSWORD_RECOVERY`, purge destrutivo, `updateUser`, logout obrigatório, redirect inválido, link expirado, rate limit, não enumeração, rede, ausência de password armazenado e ausência de `service_role`.

#### Passo 18.6.1 — catálogo de geração, adapter e credencial — 2026-09-10

- **Correção após 18.6:** a separação executor/target estava correta, mas a UI ainda apresentava `platform` como se fosse um fornecedor e construía a lista a partir dos adapters já conhecidos no frontend. A regra definitiva passa a ser: provider no catálogo não implica adapter; adapter disponível não implica credencial cadastrada; credencial cadastrada não torna disponível um adapter inexistente.
- **Autoridade:** `server/providers/generation-registry.js` deriva os providers OpenAI-compatible do registry já existente e centraliza capability de geração, adapter e origens de credencial. `/api/providers` combina esses dados calculados com o catálogo público. Nenhum campo de schema foi necessário: `is_active`/`is_public`/`is_deprecated` continuam descrevendo catálogo, enquanto suporte de execução é derivado do código realmente instalado.
- **Provider real e origem:** Google Gemini (`google-gemini`) é o provider real. A Plataforma é apenas `credentialSource=platform`, suportada exclusivamente para Gemini por meio do adapter interno `gemini-platform` e `GEMINI_API_KEY`. A UI nunca lista “Plataforma” como vendor. O alias de request `generationProvider=platform` permanece temporariamente no backend apenas para clientes anteriores, é normalizado explicitamente para Google Gemini e deve ser removido depois da migração desses consumidores. Gemini BYOK não existe e continua reservado ao Passo 18B.
- **Local:** `local-deterministic` permanece funcional como estratégia técnica selecionada por controle próprio, fora do select de providers externos. Seu contrato usa `generationProvider=local` e `credentialSource=local`; não representa empresa, adapter remoto ou credencial.
- **Catálogo visível:** o select é preenchido exclusivamente pelo `GET /api/providers`. Providers ativos sem adapter, hoje Anthropic e Kimi, continuam visíveis com seus modelos catalogados e rótulo “Em breve”; o botão permanece bloqueado, ainda que exista metadata de chave. Alibaba Cloud Model Studio existe no schema versionado, mas está inativo e, conforme RLS/public availability, não integra o catálogo público nem a UI.
- **Estados independentes:** disponibilidade mostra `Disponível`, `Disponível com BYOK` ou `Execução ainda não disponível`. Origem mostra `Chave da plataforma`, `Sua chave` ou nenhuma origem executável. Status mostra `Nenhuma chave pessoal necessária`, `Configure sua chave`, `Chave configurada · status …` ou adapter indisponível. “Use your own key” deixou de ser usado como status. O status persistido continua informativo e existência não é apresentada como validação.
- **Contrato e segurança:** o contrato preserva `generationProvider`, `generationModel`, `taskType` e `targetModel` e acrescenta o eixo inequívoco `credentialSource`. O backend rejeita origem não permitida, provider sem adapter e modelo inválido; BYOK continua consultando somente a credencial vinculada ao provider canônico e ao JWT/RLS. Nenhuma chave é testada no page load, nenhum host vem do browser e falhas BYOK não caem em Gemini/local.
- **OpenRouter:** permanece o provider de API/agregador. Seus IDs de modelo continuam pertencendo ao catálogo OpenRouter, mesmo quando o modelo subjacente pertence a outra família; não há reclassificação automática nem sincronização externa do catálogo.
- **Schema, escopo e rollback:** nenhuma migration local/remota, Auth, recovery, password lifecycle, crypto, RLS, variável ou configuração remota foi alterada. Nenhum adapter 18B foi implementado. Rollback consiste em reverter código/UI/testes/documentação; o catálogo e o cofre remotos permanecem intactos.

##### Catálogo versionado auditado no Passo 18.6.1

| Provider (slug) | Modelos versionados | Ativo | Adapter | BYOK | Plataforma | Estado na UI |
| --- | --- | --- | --- | --- | --- | --- |
| OpenRouter (`openrouter`) | `openrouter/free` | Sim | OpenRouter | Sim | Não | Disponível com BYOK |
| Google Gemini (`google-gemini`) | `gemini-3.8-flash`; allowlist executável também contém `gemini-3.5-flash-lite`, `gemini-3.5-flash`, `gemini-3.7-flash` e `gemini-3.1-flash-lite` | Sim | Gemini da plataforma | Não | Sim | Disponível, chave da plataforma |
| xAI (`xai`) | `grok-4.6`, `grok-code-fast-1` | Sim | OpenAI-compatible | Sim | Não | Disponível com BYOK |
| OpenAI (`openai`) | `gpt-5.6-sol` | Sim | OpenAI-compatible | Sim | Não | Disponível com BYOK |
| Anthropic (`anthropic`) | `claude-sonnet-5` | Sim | Não implementado | Não executável | Não | Em breve |
| DeepSeek (`deepseek`) | `deepseek-v4-flash` | Sim | OpenAI-compatible | Sim | Não | Disponível com BYOK |
| Mistral (`mistral`) | `mistral-small-latest` | Sim | OpenAI-compatible | Sim | Não | Disponível com BYOK |
| GroqCloud (`groqcloud`) | `openai/gpt-oss-120b` | Sim | OpenAI-compatible | Sim | Não | Disponível com BYOK |
| Alibaba Cloud Model Studio (`alibaba-model-studio`) | `qwen3.7-plus` | Não | Não implementado | Não executável | Não | Oculto pela política de catálogo inativo |
| Kimi (`kimi`) | `kimi-k3`, `kimi-k2.7-code-highspeed` | Sim | Não implementado | Não executável | Não | Em breve |

Todos os 12 registros de `ai_models` versionados têm defaults `is_active=true`, `is_public=true` e `is_deprecated=false`; o modelo Qwen permanece invisível porque seu provider está inativo. Os dados de source, modalidades, coding suitability e capabilities continuam nos registros da migration `20260908230000_enrich_provider_model_catalog.sql` e são expostos somente por allowlist. Para Gemini, a UI usa a allowlist realmente executável da Plataforma em vez de afirmar que apenas o único registro comercial de `ai_models` é chamável.

#### Passo 18B — conclusão da geração multi-provider — 2026-09-10

- **Registry e contrato:** o registry central agora declara adapter, status, `credentialSources` e suporte de validação. `credentialSource` escolhe `platform` ou `byok` sem alterar `generationProvider`; modelos continuam vinculados server-side ao provider e `targetModel` permanece metodológico e independente.
- **Google Gemini:** fontes oficiais consultadas em 2026-09-10: [GenerateContent](https://ai.google.dev/api/generate-content) e [Models](https://ai.google.dev/api/models). O adapter fixa `https://generativelanguage.googleapis.com/v1beta`, autentica por `x-goog-api-key`, valida por `GET /models?pageSize=1` e gera por `POST /models/{model}:generateContent`. BYOK exige JWT/vault e nunca usa `GEMINI_API_KEY` ou fallback; Plataforma nunca lê o vault e preserva somente seu fallback histórico.
- **Anthropic:** fontes oficiais: [Messages](https://platform.claude.com/docs/en/api/messages) e [List Models](https://platform.claude.com/docs/en/api/models/list). Adapter nativo fixa `https://api.anthropic.com/v1`, `POST /messages`, `GET /models?limit=1`, `x-api-key`, `anthropic-version: 2023-06-01`, `system`, mensagem `user` e `max_tokens`. Não é tratado como OpenAI-compatible.
- **Kimi/Moonshot:** [Overview](https://platform.moonshot.ai/docs/overview) e [Chat](https://platform.moonshot.ai/docs/api/chat) confirmam `https://api.moonshot.ai/v1`, bearer, OpenAI compatibility, `/models`, `/chat/completions`, `kimi-k3` e `kimi-k2.7-code-highspeed`. O provider versionado corresponde à Kimi API Platform internacional.
- **Alibaba/Qwen:** [OpenAI compatibility](https://www.alibabacloud.com/help/en/model-studio/compatibility-of-openai-with-dashscope) e [Models](https://www.alibabacloud.com/help/en/model-studio/models) confirmam bearer, `/models`, `/chat/completions`, `qwen3.7-plus` e destinos regionais. Foi escolhido o host fixo US/Virginia `https://dashscope-us.aliyuncs.com/compatible-mode/v1`. A proposta manual `supabase/rollout/activate_alibaba_us_generation.sql` registra ativação, URLs e aviso regional; ela fica deliberadamente fora de `supabase/migrations`, **não foi aplicada remotamente** e requer autorização explícita. Até isso ocorrer, Qwen continua indisponível na UI remota.
- **Providers preservados:** OpenRouter continua adapter próprio. OpenAI, xAI, DeepSeek, GroqCloud e Mistral continuam no transporte OpenAI-compatible com host fixo, bearer server-side, redirects bloqueados, timeout de 12 s, resposta máxima de 1 MB e erros normalizados. Kimi e Alibaba reutilizam esse transporte porque as fontes oficiais confirmam o contrato.
- **Modelos e validação:** foram confirmados nas fontes consultadas `claude-sonnet-5`, `kimi-k3`, `kimi-k2.7-code-highspeed`, `qwen3.7-plus` e os modelos Gemini versionados. Testes de credencial são explícitos e usam Models. 401/403 são `invalid`; timeout, rede, 429, 5xx, malformed e oversized são erros operacionais. Nenhuma substituição remota silenciosa foi feita.
- **Password Lifecycle:** a troca voluntária autenticada foi exposta em Conta → Segurança usando `auth.updateUser({ password })`, com confirmação e limpeza dos inputs; não chama purge e preserva o vault. Forgot-password permanece `resetPasswordForEmail` → `PASSWORD_RECOVERY` → purge → `updateUser` → logout. `current_password`/`reauthenticate()` dependem da configuração remota Secure Password Change e permanecem pendentes; nenhuma configuração Auth foi alterada. SMTP próprio continua hardening futuro.
- **Prompt examples:** não há seed versionado de exemplos revisados; portanto eles não foram incorporados nem inventados. Profiles e rules continuam a metodologia autoritativa.
- **Roadmap:** 18.5, 18.6 e 18.6.1 permanecem concluídos; 18B entrega o código multi-provider. O Passo 19 cobre hardening/security/observability e o Passo 20, rollout. A ativação remota Alibaba e QA com chaves reais permanecem gates explícitos.

#### Passo 19 — auditoria operacional do catálogo — 2026-09-11

- **Reconstrução verificável:** a auditoria partiu da `main` sincronizada no commit `d3dd377c094875efa55bc7c9de4df40f42a65125`, merge do PR #26, e releu o guia, código, migrations, testes e configuração versionados. O inventário resultante mantém 12 Functions, seis módulos de provider, dez providers no seed e 12 modelos no catálogo versionado. O deployment Vercel desse commit estava `success`; `/`, `/api/health` e `/api/providers` responderam 200 em leitura.
- **Catálogo remoto observado:** `/api/providers` retornou nove providers ativos: OpenRouter (1 modelo), Google Gemini (5), xAI (2), OpenAI (1), Anthropic (1), DeepSeek (1), Mistral (1), GroqCloud (1) e Kimi (2). Alibaba/Qwen permaneceu ausente, coerente com `is_active=false`; nenhuma escrita remota foi realizada.
- **Correção da geração:** executores BYOK recebiam o prompt candidato como pedido direto e podiam executar a tarefa em vez de fabricar o prompt final. Agora Gemini BYOK, Anthropic, OpenRouter e todos os adapters OpenAI-compatible recebem uma meta-instrução comum, delimitada, que identifica o conteúdo como dado, proíbe execução/código e exige somente o prompt final. `targetModel` continua determinando a metodologia.
- **Classificação Anthropic:** falha de leitura do catálogo agora produz `provider_unavailable`/503; somente uma consulta bem-sucedida sem o modelo solicitado produz `provider_model_unavailable`/404.
- **Gate Alibaba:** um comentário não impede `supabase db push`. Por isso, o SQL de ativação foi removido da sequência ordenada e colocado em `supabase/rollout`, que não é executado automaticamente. Após autorização, a proposta deve ser revisada e copiada para uma nova migration; ela não deve ser executada diretamente.
- **Escopo remoto e rollback:** não houve alteração de Supabase, Vercel, Auth, RLS, secrets, vault ou catálogo remoto. Rollback local consiste em reverter a meta-instrução e a reorganização da proposta, sem qualquer estado remoto a desfazer.

#### Auditoria definitiva do catálogo — Passo 19.1 — 2026-09-12

- **Escopo e fonte:** foram auditados os 16 IDs distintos presentes no seed de `ai_models` e/ou na allowlist Gemini do runtime. O artefato legível por máquina `docs/model-catalog-audit-2026-09-12.json` registra status, ID oficial, depreciação, compatibilidade de endpoint e URL primária por item. A conferência usou somente documentação oficial atual e, para OpenRouter, também o catálogo público oficial `GET /api/v1/models`.
- **Resultado:** 14 IDs são `CONFIRMED`, um é `RENAMED` e um é `REGIONAL`; não há `DEPRECATED` como status primário, `INVALID` ou `UNVERIFIED`. `deepseek-v4-flash` é um alias legado ainda aceito, mas o modelo correspondente foi retirado e a documentação manda usar `deepseek-flash`; por isso ele é `RENAMED` e possui `deprecated=true`. `qwen3.7-plus` é oficial e compatível, mas classificado `REGIONAL` porque a ativação proposta fixa US/Virginia.
- **Gemini Plataforma:** `gemini-3.5-flash-lite`, `gemini-3.5-flash`, `gemini-3.8-flash`, `gemini-3.7-flash` e `gemini-3.1-flash-lite` possuem páginas oficiais individuais, versões estáveis documentadas e suporte ao fluxo GenerateContent. Nenhum ID histórico inexistente permaneceu na allowlist.
- **Consistência executor/catálogo:** todos os dez providers presentes no seed possuem entrada no generation registry; os nove providers ativos do Supabase Production são expostos por `/api/providers`. Todos os modelos expostos possuem adapter e endpoint compatível. A única divergência material é o alias DeepSeek retirado, ainda exposto até autorização do rollout de substituição. Alibaba possui adapter, porém permanece fora da API pública porque seu provider está inativo.
- **Correção local e gate remoto:** `supabase/rollout/replace_deepseek_legacy_model.sql` propõe a substituição inequívoca `deepseek-v4-flash` → `deepseek-flash`, sem fallback e sem alterar migrations aplicadas. Não foi executado. Após autorização, a proposta deve ser revisada, receber precondition contra colisão e ser copiada para uma nova migration. Até lá, Production continua aceitando/expondo o alias legado documentado.

##### Providers e execução

| Provider | Adapter | credentialSource | Modelos confirmados | Problema | Estado remoto |
| --- | --- | --- | --- | --- | --- |
| OpenRouter | Próprio | BYOK | `openrouter/free` | Nenhum | Ativo |
| Google Gemini | Próprio | Plataforma, BYOK | 5 IDs da allowlist | Catálogo da API substitui a única linha Gemini do banco pela allowlist | Ativo |
| xAI | OpenAI-compatible | BYOK | `grok-4.6`, `grok-code-fast-1` | Nenhum | Ativo |
| OpenAI | OpenAI-compatible | BYOK | `gpt-5.6-sol` | Nenhum | Ativo |
| Anthropic | Messages nativo | BYOK | `claude-sonnet-5` | Nenhum | Ativo |
| DeepSeek | OpenAI-compatible | BYOK | `deepseek-flash` | Runtime ainda expõe alias legado `deepseek-v4-flash` | Ativo; correção pendente |
| Mistral | OpenAI-compatible | BYOK | `mistral-small-latest` | Nenhum | Ativo |
| GroqCloud | OpenAI-compatible | BYOK | `openai/gpt-oss-120b` | Nenhum | Ativo |
| Kimi | OpenAI-compatible | BYOK | `kimi-k3`, `kimi-k2.7-code-highspeed` | Nenhum | Ativo |
| Alibaba/Qwen | OpenAI-compatible | BYOK | `qwen3.7-plus` regional | Região precisa de aceite explícito | Inativo |

##### Model IDs auditados

| Provider | model_id atual | Encontrado oficialmente? | Status | ID oficial atual | Deprecated? | Endpoint compatível? | Fonte oficial | Alteração necessária |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| OpenRouter | `openrouter/free` | Sim | CONFIRMED | `openrouter/free` | Não | Chat Completions | [Free Models Router](https://openrouter.ai/docs/guides/routing/routers/free-router) | Nenhuma |
| Google Gemini | `gemini-3.5-flash-lite` | Sim | CONFIRMED | igual | Não | GenerateContent | [Models](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite) | Nenhuma |
| Google Gemini | `gemini-3.5-flash` | Sim | CONFIRMED | igual | Não | GenerateContent | [Models](https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash) | Nenhuma |
| Google Gemini | `gemini-3.8-flash` | Sim | CONFIRMED | igual | Não | GenerateContent | [Models](https://ai.google.dev/gemini-api/docs/models/gemini-3.8-flash) | Nenhuma |
| Google Gemini | `gemini-3.7-flash` | Sim | CONFIRMED | igual | Não | GenerateContent | [Models](https://ai.google.dev/gemini-api/docs/models/gemini-3.7-flash) | Nenhuma |
| Google Gemini | `gemini-3.1-flash-lite` | Sim | CONFIRMED | igual | Não | GenerateContent | [Models](https://ai.google.dev/gemini-api/docs/models/gemini-3.1-flash-lite) | Nenhuma |
| xAI | `grok-4.6` | Sim | CONFIRMED | igual | Não | Chat Completions | [Models](https://docs.x.ai/developers/models/grok-4.6) | Nenhuma |
| xAI | `grok-code-fast-1` | Sim | CONFIRMED | igual | Não | Chat Completions | [Models](https://docs.x.ai/developers/models) | Nenhuma |
| OpenAI | `gpt-5.6-sol` | Sim | CONFIRMED | igual | Não | Chat Completions | [Model](https://developers.openai.com/api/docs/models/gpt-5.6-sol) | Nenhuma |
| Anthropic | `claude-sonnet-5` | Sim | CONFIRMED | igual | Não | Messages | [Models overview](https://platform.claude.com/docs/en/models/overview) | Nenhuma |
| DeepSeek | `deepseek-v4-flash` | Sim, como alias legado | RENAMED | `deepseek-flash` | Sim; modelo retirado | Chat Completions | [Pricing/model aliases](https://api-docs.deepseek.com/quick_start/pricing/) | Aplicar rollout autorizado |
| Mistral | `mistral-small-latest` | Sim | CONFIRMED | igual | Não | Chat Completions | [API reference](https://docs.mistral.ai/api/) | Nenhuma |
| GroqCloud | `openai/gpt-oss-120b` | Sim | CONFIRMED | igual | Não | Chat Completions | [Model](https://console.groq.com/docs/model/openai/gpt-oss-120b) | Nenhuma |
| Kimi | `kimi-k3` | Sim | CONFIRMED | igual | Não | Chat Completions | [Kimi K3](https://platform.kimi.ai/docs/guide/kimi-k3-quickstart) | Nenhuma |
| Kimi | `kimi-k2.7-code-highspeed` | Sim | CONFIRMED | igual | Não | Chat Completions | [Overview](https://platform.kimi.ai/docs/overview) | Nenhuma |
| Alibaba/Qwen | `qwen3.7-plus` | Sim | REGIONAL | igual | Não | Chat Completions | [Models](https://www.alibabacloud.com/help/en/model-studio/models) | Manter inativo até autorização regional |

##### Cobertura metodológica

O runtime local oferece os nove targets abaixo. Apenas Grok também existe no Supabase Production, com cinco `prompt_rules` ativos. `prompt_rules` não possui campo de verificação nem vínculo com `canonical_prompt_rules`; portanto “verified rules” não pode ser inferido e é registrado como zero formalmente verificável. As 12 regras canônicas versionadas permanecem inativas/`supplied_unverified` e não são regras de profile. `prompt_examples` possui zero registros remotos e nenhum seed.

| targetModel/profile | prompt_rules total | active | verified | prompt_examples | cobertura estimada | lacunas |
| --- | ---: | ---: | ---: | ---: | --- | --- |
| `grok` | 5 local + 5 remotas | 5 remotas | 0 formalmente vinculadas | 0 | Base local e remota | Sem proveniência por regra de profile |
| `openai` | 6 locais | 6 locais | 0 formalmente vinculadas | 0 | Baseline local | Sem profile/rules remotos e exemplos |
| `claude` | 6 locais | 6 locais | 0 formalmente vinculadas | 0 | Baseline local | Sem profile/rules remotos e exemplos |
| `gemini` | 5 locais | 5 locais | 0 formalmente vinculadas | 0 | Baseline local | Sem profile/rules remotos e exemplos |
| `deepseek` | 6 locais | 6 locais | 0 formalmente vinculadas | 0 | Baseline local | Sem profile/rules remotos e exemplos |
| `qwen` | 5 locais | 5 locais | 0 formalmente vinculadas | 0 | Baseline local | Sem profile/rules remotos e exemplos |
| `codestral` | 5 locais | 5 locais | 0 formalmente vinculadas | 0 | Baseline local | Sem profile/rules remotos e exemplos |
| `kimi` | 5 locais | 5 locais | 0 formalmente vinculadas | 0 | Baseline local | Sem profile/rules remotos e exemplos |
| `llama` | 5 locais | 5 locais | 0 formalmente vinculadas | 0 | Baseline local | Sem profile/rules remotos e exemplos |

- **Prompt examples:** quantidade real remota e versionada: zero; ativos: zero; verificados: zero; targets cobertos: zero; proveniência: inexistente. Não há corpus suficiente para integração futura.
- **Drift read-only:** o repositório contém dez providers/12 linhas de `ai_models`; o Supabase público retorna nove providers ativos/11 modelos porque Alibaba está inativo; a Production API retorna esses mesmos nove providers e substitui o único modelo Gemini do banco pela allowlist de cinco IDs, totalizando 15 opções. Esse desvio Gemini é intencional e documentado; o drift DeepSeek requer rollout. Nenhum write foi realizado.
- **Alibaba:** endpoint proposto `https://dashscope-us.aliyuncs.com/compatible-mode/v1`, região US/Virginia, modelo `qwen3.7-plus`, bearer e Chat Completions são confirmados pelas páginas oficiais de [compatibilidade](https://www.alibabacloud.com/help/en/model-studio/compatibility-of-openai-with-dashscope) e [modelos](https://www.alibabacloud.com/help/en/model-studio/models). Rollback e gate estão preservados fora de migrations. Classificação: **READY_FOR_AUTHORIZATION**, condicionada à aceitação explícita de região, residência/latência e aplicação de uma nova migration revisada.
- **Próxima prioridade:** autorizar e aplicar primeiro a correção DeepSeek; depois decidir o rollout regional Alibaba. Em seguida, modelar proveniência verificável para `prompt_rules` e criar um corpus revisado de `prompt_examples`, antes de integrar exemplos ao compilador.

#### Passo 19.2 — rollout DeepSeek — 2026-09-12

- **Preconditions observadas antes do write:** o Supabase Production continha exatamente um provider `deepseek`, ativo e com `supports_generation=true`; exatamente uma linha vinculada `deepseek-v4-flash`, ativa, pública e não marcada como depreciada; e nenhuma linha `deepseek-flash`. Alibaba permanecia inativo com `qwen3.7-plus` intacto.
- **Migration aplicada:** `20260912010000_replace_deepseek_legacy_model.sql` valida novamente essas condições dentro do banco, aborta diante de conflito, atualiza exatamente uma linha e verifica `row_count=1`. O UUID, `provider_id`, flags ativa/pública e vínculo com DeepSeek foram preservados. Foram atualizados somente `model_id`, nome, família, descrição, URLs oficiais e `last_verified_at`; o registro final permanece não depreciado porque agora representa o alias oficial atual.
- **Estado posterior:** o Supabase e `/api/providers` de Production expõem `deepseek-flash`, não `deepseek-v4-flash`. DeepSeek continua ativo; Alibaba continua inativo. A versão `20260912010000` foi registrada em `supabase_migrations.schema_migrations`. Nenhum alias antigo existe no código de runtime: requests antigos falham na validação provider/model, enquanto `generationProvider=deepseek`, `generationModel=deepseek-flash` e `credentialSource=byok` avançam até a exigência normal de JWT/vault.
- **Compatibilidade:** o adapter permanece o transporte OpenAI-compatible existente em `https://api.deepseek.com`, com `POST /chat/completions`; nenhuma chave real ou chamada paga foi usada. A identidade antiga aparece apenas em migrations/documentação/testes históricos e no rollback, não na UI.
- **Escopo remoto:** somente a linha de modelo DeepSeek foi alterada. Não houve alteração de Alibaba, outro provider/modelo, Auth, RLS, vault, crypto, secrets, Vercel, target profiles ou `targetModel`.
- **Rollback:** se estritamente necessário, criar uma nova migration revisada com o bloco documentado ao final da migration aplicada. Não editar ou remover `20260912010000` do histórico; o rollback restaura metadados legados, mas não torna o modelo retirado novamente atual.

#### Passo 20 — base metodológica verificável — 2026-09-12

- **Diagnóstico:** os nove profiles locais continham orientações sem proveniência legível pelo runtime; somente Grok possuía cinco `prompt_rules` remotas, sem vínculo formal de evidência. As 12 `canonical_prompt_rules` continuavam corretamente inativas e `supplied_unverified`; `prompt_examples` não possuía seed nem corpus remoto. O inventário completo e a classificação histórica estão em `docs/methodology-audit-2026-09-12.md`.
- **Corpus versionado:** `docs/methodology-corpus-v1.json` é a autoridade metodológica auditável desta versão. Ele cobre somente `grok`, `openai`, `claude`, `gemini`, `deepseek`, `qwen`, `codestral`, `kimi` e `llama`, com 18 regras target-specific oficiais, quatro regras gerais empíricas e 18 exemplos editoriais revisados. Cada item referencia uma fonte com URL/tipo, data, status e notas. Não foram criados targets ou IDs operacionais.
- **Estados e ativação:** somente `VERIFIED_OFFICIAL` e `VERIFIED_EMPIRICAL` ativos entram na compilação. `PROJECT_HEURISTIC`, `UNVERIFIED`, `DEPRECATED` e `CONFLICTING` ficam preservados para auditoria, mas excluídos por padrão. Assim, as regras Grok remotas e o corpus canônico histórico não entram silenciosamente no prompt final.
- **Precedência determinística:** versão/modelo explicitamente solicitado → família/target → regra geral → fallback local seguro. Um `conflictGroup` admite apenas a regra de maior precedência; no mesmo nível, vence menor prioridade numérica e, por fim, ID lexical. Escopo de `taskType` é aplicado antes da ordenação; Codestral FIM, por exemplo, só usa a regra FIM quando o tipo é `fim`.
- **Examples:** há exatamente dois exemplos por target, um de correção de bug e um de implementação estruturada. O runtime seleciona no máximo um, somente por match exato de target + `taskType`, com teto de 3.500 caracteres e aviso para reutilizar apenas a estrutura, nunca fatos ou requisitos. Não há chain-of-thought, segredo ou exemplo indiscriminado.
- **Runtime:** `api/model-profiles.js` carrega o corpus versionado e expõe seleção fail-closed de regras/exemplo. Todos os executores recebem a mesma compilação definida por `targetModel`; o executor não altera a metodologia. O caminho Gemini Plataforma deixou de concatenar `prompt_rules` remotas sem proveniência e usa a mesma seleção verificada. `server/knowledge-base.js` permanece para catálogo/evidência e compatibilidade de health, mas não é autoridade metodológica da geração.
- **Evaluation:** além dos 54 casos de qualidade existentes, nove casos usam o mesmo briefing e verificam invariantes observáveis distintos por target, sem igualdade textual e sem solicitar raciocínio interno. Regressões cobrem proveniência, nove targets, exclusão de status não aprovados, precedência/conflitos, task scope, limite de examples, fallback e independência do target.
- **Schema e remoto:** nenhuma migration foi necessária e nenhuma escrita Supabase/Vercel foi realizada. Popular Production ainda não é recomendado: exige revisão humana dos 18 exemplos e uma futura proposta normalizada para ligar proveniência a `prompt_rules`/`prompt_examples`. Nesta entrega não há SQL remoto nem autorização solicitada.
- **Escopo preservado:** providers, adapters, Auth, vault, crypto, RLS, secrets, catálogo operacional e Alibaba não foram alterados. Alibaba continua inativo; DeepSeek continua operacionalmente em `deepseek-flash`; `targetModel` permanece independente. Rollback local é reverter corpus, loader, testes e documentação, sem estado remoto a desfazer.
- **Manutenção:** revisar fontes trimestralmente ou após mudança oficial; toda promoção exige fonte específica, data, status, revisão editorial e regressão. Próximo gate: avaliação humana comparativa por target; somente depois projetar/popular a base remota e reavaliar a integração em Production.

#### Passo 20.1-A/B — catálogo visível e labels de credencial — 2026-09-12

- **Causa do provider preso em Gemini:** após carregar `/api/providers`, `src/main.js` forçava `generationProvider.value = 'google-gemini'` sempre que o slug existia no catálogo. O select era preenchido corretamente; a linha de inicialização remanescente da fase Gemini/Plataforma revertia a escolha. A linha foi removida. O primeiro item do catálogo ordenado permanece o default do `<select>`.
- **Geração local:** o checkbox continua `checked` no HTML para o visitante anônimo gerar sem conta. Depois da sessão autenticada, a geração local passa a ser opt-in (`preferLocal = !authenticated`), sem alterar a escolha se a pessoa já tiver mexido no controle e sem `localGeneration.checked = false` literal. Logout de quem não tocou o controle restaura o default local público.
- **Labels de credencial:** `generationUiState` passa a reutilizar `STATUS_LABELS` de `src/byok/credentials.js`. O painel do gerador mostra `Ainda não testada`, `Validada no provedor`, `Inválida` ou `Erro na última validação` em vez do status bruto `untested`.
- **Fora de escopo:** nenhuma migration, Auth, vault, RLS, adapter, model ID, corpus ou ativação Alibaba. `20.2`–`20.6` continuam dependentes de pesquisa editorial ou autorização explícita.
- **Nomenclatura:** o compilador local permanece `local-deterministic` / “Compilador determinístico local”. Não é um modelo de IA; é compilação por template.

#### Passo 20.1-C — auditoria de GENERATION MODEL por provider — 2026-09-12

- **SHA inicial:** `0232959` (main, PR #33 já mergeado — 20.1-A/B confirmados presentes antes de qualquer alteração).
- **Branch:** nenhuma criada. Não houve código para commitar: a auditoria concluiu que o defeito relatado no teste manual já havia sido corrigido pelo PR #33, e uma tentativa de correção adicional foi revertida (ver abaixo). O working tree está idêntico ao HEAD de `main` (`git diff` vazio).
- **Auditoria realizada (somente leitura):**
  - `api/providers.js`, `server/providers/generation-registry.js`, `server/providers/direct-providers.js`, `server/providers/gemini.js`, `api/generate.js`, `src/generation/provider-options.js`, `src/main.js`, `index.html`.
  - Catálogo real do Supabase Production (`pqprtkdvzyhqlidlcpxg`) consultado via conector OAuth já autorizado nesta sessão, sem uso de `service_role key` nem de qualquer segredo colado em texto — apenas `SELECT` em `api_providers`/`ai_models`.
  - Testes: `test/step19-1-model-catalog-audit.test.js`, `test/authenticated-workspace.test.js`, `test/step20-1-product-flow.test.js`.
- **Causa raiz do sintoma relatado ("Modelo de geração preso no Compilador determinístico local"):** já eliminada no PR #33. Antes dele, `src/main.js` reatribuía `generationProvider.value = 'google-gemini'` depois de popular o `<select>`, resetando a escolha da pessoa. Hoje isso não existe mais; o provider selecionado é preservado e `updateGenerationModels()` já troca a lista de modelos corretamente a cada `change` do `<select id="generation-provider">`.
- **Tentativa de correção adicional (revertida):** por hipótese, cheguei a alterar (a) o atributo `checked` padrão do checkbox `#local-generation` em `index.html` e (b) o listener de `change` do provider para forçar `localGeneration.checked = false`. Isso quebrou dois testes que protegem decisões já tomadas no Passo 20: `id="local-generation" type="checkbox" checked` é o default intencional para visitante anônimo (gerar sem conta), e a proibição literal de `localGeneration.checked = false` no código impede que qualquer interação futura desmarque a geração local sem um clique explícito da pessoa no próprio checkbox. As duas alterações foram revertidas; suíte voltou a 242/242 sem falhas.
- **Estado confirmado por provider (leitura direta do Supabase, sem escrita):**

  | Provider | Generation models expostos (ativos/públicos/não-depreciados) | Adapter | Credential source | Estado |
  |---|---|---|---|---|
  | google-gemini | 5 (allowlist auditada em `docs/model-catalog-audit-2026-09-12.json`, protegida por `test/step19-1-model-catalog-audit.test.js`); somente 1 (`gemini-3.8-flash`) existe hoje em `ai_models` | gemini | platform, byok | operacional; catálogo do app é a fonte correta, Supabase está incompleto (ver pendência) |
  | deepseek | 1 (`deepseek-flash`) | openai-compatible | byok | operacional |
  | openai | 1 (`gpt-5.6-sol`) | openai-compatible | byok | operacional |
  | xai | 2 (`grok-4.6`, `grok-code-fast-1`) | openai-compatible | byok | operacional |
  | groqcloud | 1 (`openai/gpt-oss-120b`) | openai-compatible | byok | operacional |
  | mistral | 1 (`mistral-small-latest`) | openai-compatible | byok | operacional |
  | kimi | 2 (`kimi-k3`, `kimi-k2.7-code-highspeed`) | openai-compatible | byok | operacional |
  | anthropic | 1 (`claude-sonnet-5`) | anthropic | byok | operacional |
  | openrouter | 1 (`openrouter/free`) | openrouter | byok | operacional |
  | alibaba-model-studio | 1 (`qwen3.7-plus`) | openai-compatible | byok | inativo (`is_active=false`), como já era |

- **Pendência formal (não implementada nesta etapa — exige aprovação e migration, proibida pela seção 13 deste passo):** popular `ai_models` no Supabase Production com os 4 modelos Gemini já confirmados na auditoria oficial e ausentes na tabela hoje: `gemini-3.5-flash-lite`, `gemini-3.5-flash`, `gemini-3.7-flash`, `gemini-3.1-flash-lite`. Enquanto isso não é feito, `api/providers.js` continua deliberadamente usando o allowlist estático de `api/compiler-models.js` para o Google Gemini (mecanismo do Passo 19.1, com teste de regressão dedicado) em vez da tabela `ai_models` — não é bug, é o workaround documentado e testado até a migration ser autorizada.
- **Testes executados:** `npm test` → 242/242 (`pass 242, fail 0`). Nenhum `npm run build` foi necessário porque nenhum arquivo de produto foi alterado nesta etapa.
- **PR:** nenhum aberto. Não há conector do GitHub disponível nesta sessão para autenticar push/PR sem expor token em texto; o repositório foi apenas clonado publicamente para leitura. Nenhuma alteração de código resultou desta auditoria para ser enviada.
- **Preview:** nenhum gerado (nenhum deploy realizado).
- **Confirmações finais:** provider não fica preso em Gemini (já corrigido no PR #33); `generationModel` muda conforme provider (confirmado por leitura de código + testes existentes); local não é confundido com modelo externo (comportamento é o default intencional documentado, protegido por teste); `targetModel` permanece independente (não tocado); BYOK permanece seguro (não tocado); nenhuma migration aplicada; nenhuma escrita remota; nenhum secret alterado ou usado (as credenciais coladas em chat pelo usuário nunca foram utilizadas e devem ser rotacionadas); nenhuma API paga chamada; DeepSeek permanece `deepseek-flash`; Alibaba permanece inativo; nenhum PR foi aberto ou mergeado.

#### Passo 20.1-D — fluxo definitivo provider → modelo — 2026-09-12

- **Causa:** a UI reconstruía o `<select>` de modelo em toda atualização de sessão/credencial sem distinguir troca de provider de uma renderização do mesmo provider. Isso tornava implícita a seleção do primeiro item e não formalizava simultaneamente as duas regras necessárias: invalidar sempre o modelo do provider anterior e preservar uma escolha manual ainda válida no provider atual. Além disso, Gemini ainda era uma exceção estática em `/api/providers`, embora a migration 20.1-D já tivesse sido preparada fora da árvore oficial de migrations.
- **Correção de UI:** a reconciliação agora guarda o provider efetivamente renderizado. Uma troca de provider escolhe deterministicamente o primeiro modelo do novo catálogo; uma nova renderização do mesmo provider conserva o `model_id` manual somente se ele ainda estiver presente. O catálogo continua sendo filtrado pelo vínculo provider/model retornado por `/api/providers`; não existe dependência de `targetModel`.
- **Local e BYOK:** `local-deterministic` permanece uma estratégia separada, acionada pelo controle local e nunca incluída entre modelos externos. Ausência de chave BYOK afeta apenas `generationUiState`/execução; não remove provider nem modelos do catálogo. O provider não é reatribuído a Gemini.
- **Catálogo:** `api/providers.js` deixou de substituir os modelos Gemini por uma allowlist estática e agora usa, para todos os providers, exclusivamente os registros ativos, públicos e não depreciados relacionados em `ai_models`. A allowlist do compilador Gemini continua existindo apenas para validação do adapter da Plataforma.
- **Supabase Production:** a migration versionada `20260912020000_add_missing_gemini_models.sql` foi revisada, aplicada pelo Management API e registrada em `supabase_migrations.schema_migrations`. A leitura pública posterior confirmou exatamente cinco modelos Gemini ativos/públicos/não depreciados, nos sort orders 10–50: `gemini-3.8-flash`, `gemini-3.7-flash`, `gemini-3.5-flash`, `gemini-3.5-flash-lite` e `gemini-3.1-flash-lite`. `deepseek-flash` foi preservado e Alibaba (`alibaba-model-studio`) continua `is_active=false`.
- **Cobertura:** regressões verificam a origem relacional do catálogo Gemini, a preservação de escolha manual válida, o descarte em troca de provider ou diante de ID obsoleto, a migration e os cinco IDs auditados.

#### Passo 20.2 — targets específicos e herança metodológica — 2026-09-12

- **Base e auditoria:** trabalho iniciado sobre `origin/main` em `7bace3b294ddcae9aefbdb4a6703800875898a69`, com as correções 20.1-C/D preservadas no commit predecessor da branch `step-20-2-model-specific-targets`. A auditoria completa está em `docs/methodology-audit-2026-09-12.md`. Production, consultada somente em leitura, contém 1 `model_profile` (Grok), 5 `prompt_rules` ativos sem status de proveniência no schema, 0 `prompt_examples` e 12 `canonical_prompt_rules` inativas; o runtime usa exclusivamente `docs/methodology-corpus-v1.json`. Nenhuma migration 20.2 foi necessária ou aplicada.
- **NotebookLM:** existem exports e um link histórico para notebook, mas não há artefato que prove de maneira independente a cadeia de origem da sessão NotebookLM. Situação registrada: **NÃO FOI POSSÍVEL CONFIRMAR**. Conteúdo não foi promovido com base nessa alegação.
- **Arquitetura:** o catálogo metodológico agora representa nós `family`, `model` e `version`, ligados por `parentSlug`; resolução recursiva produz `methodologyPath`, agrega regras sem duplicá-las e mantém a precedência `version → model → family → target legado → general → fallback`. `taskType` filtra antes da ordenação, e conflitos continuam resolvidos por especificidade, prioridade e ID lexical. Ciclo ou ancestral ausente falha fechado.
- **Targets:** os nove targets de família anteriores foram preservados. Foram habilitados `grok-4.6`, `grok-code-fast-1`, `gpt-5.6-sol`, `claude-sonnet-5`, cinco versões Gemini Flash, `deepseek-flash`, `qwen3.7-plus`, `kimi-k3`, `kimi-k2.7-code-highspeed` e `llama-3.1`. `claude-sonnet` é um ancestral interno não exibido. Nenhum target específico recebeu regra própria: todos herdam, sem diferenças inventadas. A arquitetura aceita overrides futuros somente quando houver evidência permitida.
- **Examples:** um target específico procura primeiro example próprio e depois nos ancestrais, sempre com `taskType` exato e política de status. Somente a estrutura é apresentada ao compilador; fatos e requisitos do example não são copiados, e o briefing permanece autoridade exclusiva.
- **Independência e UI:** `targetModel` continua resolvido antes e separadamente de `generationProvider`/`generationModel`, adapter e credencial. O select “Otimizado para” agrupa targets por organização/família e informa que o alvo não é chamado nem exige chave. Alterar executor não altera target. `ai_models` não alimenta automaticamente targets.
- **Escopo remoto e segurança:** nenhuma escrita Supabase, API paga, secret, Auth, vault, crypto, RLS de credencial, adapter ou catálogo de geração foi alterado no 20.2. Alibaba continua inativo.
- **Gaps:** não há evidência de diferenças próprias para as versões Grok, GPT, Claude Sonnet 5, Gemini Flash, DeepSeek, Qwen ou Kimi listadas; elas herdam. Examples continuam editoriais locais e não foram populados remotamente. Uma futura promoção ao Supabase exige schema explícito de hierarquia/proveniência e revisão humana, mas não é necessária ao runtime atual.

#### P0 — CANONICAL KNOWLEDGE BASE — Passo 20.3 — 2026-09-12

- **Prioridade:** a metodologia auditável, não o LLM executor, é o núcleo do produto. SHA inicial `fc60a015049763dbaa61ab2c5508e3f27c2d4f81` (`main`, PR #34 incorporado); branch `step-20-3-canonical-knowledge-base`.
- **NotebookLM e recuperação:** o acesso automatizado à URL pública retornou 401: `NOTEBOOKLM_DIRECT_ACCESS = NOT_AVAILABLE`. A pesquisa não foi declarada ausente; foram auditados os exports `base-canonica-regras.md`, `notebook-auditoria-fontes.md`, `fontes-primarias-validadas.md`, corpus e migrations. Detalhes e comparação estão em `docs/canonical-knowledge-audit-2026-09-12.md`.
- **Persistência:** `20260912120000_canonical_methodology_knowledge_base.sql` cria release imutavelmente identificado por versão/checksum e projeções normalizadas de sources, targets, rules, applicability e examples, com RLS pública limitada a release ativa e conhecimento permitido. Dados históricos não foram apagados. Rollback é arquivar release, reverter runtime ao snapshot versionado e só então remover objetos novos.
- **Production:** antes: 1 profile/5 regras/0 examples, 12 canonical rules inativas. A migration específica foi aplicada isoladamente e registrada; depois: 1 release ativa, 10 sources, 25 target nodes, 22 rules, 95 applicability rows e 18 example references. Legado permaneceu intacto; Alibaba, Auth, vault, crypto, credentials, secrets e `ai_models` não foram alterados.
- **Runtime:** `methodology_releases` ativa no Supabase é autoridade primária. O corpus 2.0 versionado é fallback seguro de disponibilidade, não uma fonte diferente. O resolver produz pacote com profile, próprias/herdadas, selected/rejected, conflict outcome, example e decision trace. Cada item selecionado registra rule ID, source, provenance, target/level, task e motivo; rejeitados registram status/task/conflict e motivo.
- **Separação semântica:** regras carregam `ruleType`. API parameters, API constraints, cache e platform podem ser rastreados, mas são excluídos das instruções textuais de prompting. `targetModel` permanece independente do executor e de `ai_models`.
- **Fail-closed/examples:** somente `VERIFIED_OFFICIAL`/`VERIFIED_EMPIRICAL` são elegíveis. Heuristic, unverified, deprecated e conflicting não entram. Examples fornecem apenas referência estrutural compatível com target ancestral e `taskType`; briefing é autoridade exclusiva de requisitos.
- **Gaps:** acesso direto ao NotebookLM indisponível; claims antigas incertas não foram promovidas; diferenças específicas de versões continuam herdadas até evidência oficial; importação futura de constraints adicionais exige revalidação individual atual.

#### P0 — CANONICAL KNOWLEDGE BASE — Passo 20.3.1 (conteúdo) — 2026-09-12

- **Base registrada:** `main` conhecida `7bace3b`; início da continuação do PR #35 `6dc0dd11a7eb27006000975e062539e341c2279d`. O clone não tinha remote configurado; a continuidade foi preservada na branch `step-20-3-canonical-knowledge-base` sem reconstruir o schema 20.3.
- **NotebookLM e recuperação:** a URL redirecionou para autenticação; `NOTEBOOKLM_DIRECT_ACCESS = NOT_AVAILABLE`. Isso não nega a pesquisa. Foram recuperados `base-canonica-regras.md`, `notebook-auditoria-fontes.md`, `fontes-primarias-validadas.md`, auditorias, corpus, migrations, seeds e histórico deste guia. Exports são discovery/TIER 5, nunca evidência oficial isolada.
- **Auditoria de conteúdo:** `docs/methodology-claim-inventory-v2.json` registra 52 claims e seus vereditos; o inventário de 24 fontes, ledger de 44 regras, matriz de cobertura de 14 targets públicos × 22 dimensões e matriz target/herança ficam nos demais artefatos `methodology-*-v2` e `target-methodology-matrix-v2.md`. Toda célula tem resultado explícito; ausência de orientação é `NO_SPECIFIC_GUIDANCE`, não omissão.
- **Release 2.1.0:** preserva 2.0.0, acrescenta fontes oficiais e separa regras de prompt, warning e orquestração/API por `ruleType` + `effect`. Claims de `x-grok-conv-id`, Kimi cache/effort, equivalência Qwen alias/Coder e DeepSeek effort permanecem `UNVERIFIED`, inativas e rastreáveis. Nenhuma diferença de versão foi inventada.
- **Runtime e trace:** o trace agora registra source, provenance, target scope real, inheritance level, task, rule type, effect, platform e motivo normalizado para cada regra selecionada/rejeitada. API/CACHE/PLATFORM continuam fora do texto compilado. O fallback local agora também retorna o checksum SHA-256 reproduzível do snapshot.
- **Examples e briefing:** os 18 examples permaneceram referências estruturais auditadas; não injetam conteúdo. Regressões proíbem React/PostgreSQL/TypeScript quando ausentes e preservam Python quando solicitado.
- **Migration:** `20260912130000_canonical_methodology_release_2_1.sql` cria o release como draft, projeta sources/rules/applicability e troca o release ativo atomicamente em transação. Rollback: arquivar 2.1.0 e reativar 2.0.0 na mesma transação. Não toca Auth, vault, crypto, credenciais, `ai_models` ou Alibaba.
- **Production:** antes, 2.0.0 estava ativo (10 sources, 25 targets, 22 rules, 95 applicability, 18 examples). A migration 2.1.0 foi aplicada isoladamente pelo Management API e registrada; depois, 2.0.0 ficou arquivado, 2.1.0 ficou como única release ativa, com 24 sources, 25 targets, 44 rules, 165 applicability, 18 examples e checksum `f7b019502b7f418fc8d717bff23c79615fa4845afe600c30b42c7b7ffbf47e40`.
- **Gaps explícitos:** IDs futuros/operacionais sem documentação pública específica continuam herdando família; Kimi possui documentação insuficiente para cache/effort; não se extrapolam templates Llama 3.1; Qwen3-Coder não é equiparado a `qwen3.7-plus`; claims de versões futuras aguardam fonte oficial. P0 significa fail-closed e cobertura investigada, não quantidade artificial de regras.
