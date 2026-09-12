# PROMPT_EXPERT - Guia vivo do projeto

> Estado consolidado em 12 de setembro de 2026, após o merge do PR #40.
> Esta é a referência operacional atual. O histórico detalhado permanece preservado no Git e nos artefatos versionados em `docs/`.

## Propósito

O PROMPT_EXPERT transforma uma solicitação em linguagem natural em um **prompt de programação otimizado** para um modelo de destino.

O resultado principal do produto é o prompt otimizado. O produto não existe para executar automaticamente a tarefa final solicitada pelo usuário.

O sistema separa dois conceitos independentes:

1. **Modelo de geração (`generationModel`)**: modelo realmente chamado para gerar ou refinar o prompt.
2. **Modelo de otimização (`targetModel`)**: modelo/família para o qual o prompt é metodologicamente adaptado.

O `targetModel` não é chamado, não exige chave própria e pode ser diferente do modelo de geração.

## Estado atual da `main`

Commit de referência pós-PR #40: `1d2799a075e378f9321abaa4c40d8a114d22d78d`.

O produto possui atualmente:

- Supabase Auth;
- login obrigatório antes do workspace;
- geração multi-provider;
- cofre BYOK por usuário;
- separação entre `generationProvider`, `generationModel`, `credentialSource`, `taskType` e `targetModel`;
- catálogo relacional de providers e modelos de geração;
- compilador local determinístico separado dos modelos de IA externos;
- metodologia canônica versionada no Supabase;
- release metodológica `2.1.0` ativa;
- 24 fontes metodológicas;
- 25 nós de target;
- 44 regras;
- 165 relações de aplicabilidade;
- 18 exemplos estruturais;
- resolução hierárquica e fail-closed;
- auditoria aplicada da metodologia;
- QA funcional acumulado até o PR #40.

A metodologia segue:

```text
GENERAL -> FAMILY -> MODEL -> VERSION -> TASK TYPE -> EXAMPLE
```

Quando não existe evidência confiável de diferença própria de uma versão, o target específico herda a metodologia da família. Diferenças não devem ser inventadas.

## Base metodológica

A release ativa no Supabase é a autoridade metodológica primária. O snapshot local versionado permanece como fallback seguro e verificável.

Regras fundamentais:

- somente proveniência permitida pelo runtime pode participar da compilação;
- regras de API, cache, plataforma e constraints não devem vazar indevidamente para o texto do prompt;
- examples servem como referência estrutural, nunca como fonte de requisitos;
- o briefing do usuário permanece autoridade dos requisitos;
- target desconhecido deve falhar fechado;
- ausência de orientação específica de versão significa herança, não licença para inventar override.

A release `2.1.0` **não foi alterada pelo PR #40**. O arquivo do corpus também não foi modificado nesse PR. O checksum canônico permanece o mesmo registrado na migration e nos testes da release:

`f7b019502b7f418fc8d717bff23c79615fa4845afe600c30b42c7b7ffbf47e40`

## Autenticação obrigatória

Desde o PR #40, o gerador não é mais público/anônimo.

Fluxo atual:

```text
abrir aplicação
    -> verificar sessão
    -> sessão inexistente: login/cadastro/recuperação
    -> sessão válida: workspace
```

Comportamento esperado e implementado:

- HTML inicia com `topbar`, conta e workspace protegidos contra flash de conteúdo;
- enquanto `state.initialized === false`, o roteamento não libera telas privadas;
- sem sessão, a rota efetiva é `#account`;
- `#app` e `#providers` não contornam o gate;
- com sessão válida, o workspace é liberado;
- logout fecha o workspace;
- `PASSWORD_RECOVERY` mantém o fluxo de recuperação e reset destrutivo do cofre;
- toda chamada a `/api/generate`, inclusive geração local determinística, exige JWT válido;
- `/api/generate` retorna `401 / UNAUTHENTICATED` sem sessão válida.

O compilador local continua sem IA e sem chave de provider, mas agora exige uma sessão de usuário para uso no produto.

## Credenciais

A UI deve diferenciar claramente **existência da chave** de **estado de validação**.

Estados humanos suportados incluem:

- `Sem chave cadastrada`;
- `Chave cadastrada`;
- `Ainda não testada`;
- `Validada no provedor`;
- `Inválida`;
- `Erro na última validação`.

`credentialSource` continua no contrato técnico quando necessário, mas a interface usa linguagem prática em vez de expor a terminologia interna como conceito principal.

A renderização da tela não deve disparar validação externa automática de chave.

## Catálogo de geração e identificação de modelos

O catálogo de geração e o catálogo metodológico são independentes.

Regras:

- cada provider mostra somente seus próprios modelos de geração;
- troca de provider descarta um `generationModel` incompatível;
- rerender do mesmo provider preserva escolha manual ainda válida;
- o compilador local determinístico não é apresentado como IA externa;
- preferir nome humano + ID canônico quando isso elimina ambiguidade;
- não inventar números de versão;
- `deepseek-flash` permanece o ID canônico atualmente catalogado; uma versão numérica só pode aparecer quando confirmada e representada no catálogo.

## Targets metodológicos

Targets podem ser famílias ou modelos específicos.

Exemplos já suportados pela arquitetura incluem:

- `grok-4.6`;
- `grok-code-fast-1`;
- `gpt-5.6-sol`;
- `claude-sonnet-5`;
- versões Gemini Flash catalogadas;
- `deepseek-flash`;
- `qwen3.7-plus`;
- `kimi-k3`;
- `kimi-k2.7-code-highspeed`;
- `llama-3.1`.

Targets específicos podem herdar integralmente a metodologia da família quando não existe override comprovado.

## Taxonomia de tarefas

A UI pública usa oito IDs:

| ID | Rótulo |
| --- | --- |
| `cited` | Tarefas citadas |
| `application` | Aplicação completa |
| `refactor_full` | Refatoração completa |
| `refactor_module` | Refatoração de módulo |
| `bug_fix` | Correção de bug |
| `agent` | Agente autônomo |
| `debug` | Depuração |
| `fim` | Fill-in-the-Middle |

Compatibilidade metodológica atual:

- `refactor_full` -> herda `refactor`;
- `refactor_module` -> herda `refactor`;
- `bug_fix` -> herda `debug`;
- o antigo `refactor` continua aceito na API para compatibilidade, mas não aparece na UI.

Essa herança é deliberada porque a release 2.1.0 não contém evidência suficiente para inventar regras específicas para os novos subtipos.

O decision trace deve preservar o `taskType` solicitado e também registrar o `methodologyTaskType` efetivamente usado.

### Fill-in-the-Middle

FIM significa completar um trecho entre prefixo e sufixo existentes.

Na UI, FIM é disponibilizado apenas para Codestral porque o corpus 2.1.0 possui a regra específica comprovada `codestral-fim-fields` para esse target. A API continua aceitando pedidos explícitos `fim` para outros targets e, nesses casos, aplica apenas metodologia geral elegível, sem alegar suporte específico inexistente.

## Providers e rollout

- Google Gemini permanece suportado pelos caminhos de credencial existentes.
- OpenRouter, OpenAI, xAI, Anthropic, DeepSeek, Mistral, GroqCloud e Kimi possuem caminhos BYOK implementados conforme o registry atual.
- Alibaba/Qwen permanece sujeito ao rollout explicitamente registrado. Não ativar apenas para completar catálogo.
- `ai_models` é catálogo de geração e não deve virar automaticamente catálogo metodológico.

## Validação do PR #40

O PR #40 (`feat(product): enforce auth and refine task workflow`) foi mesclado na `main`.

Validação reportada na entrega:

- testes focados do Passo 21: `8/8`;
- `npm test`: `301/301`;
- `npm run evaluate`: `192/192` casos de prompt e `24/24` metodológicos;
- `npm run build`: concluído;
- `git diff --check`: sem erros;
- nenhuma API paga usada para QA;
- nenhuma migration aplicada;
- nenhuma alteração em Production/Supabase remoto;
- nenhum ajuste de RLS, crypto, vault ou billing;
- corpus metodológico 2.1.0 preservado.

A revisão pós-merge confirmou que o checksum canônico usado pela release 2.1.0 continua consistente com a migration e os testes existentes. A alteração de testes do PR #40 não modificou o corpus.

### Limitação ainda aberta

O PR #40 não registrou QA visual autenticado com sessão real. Os testes automatizados e o gate implementado cobrem os contratos principais, mas um smoke test autenticado em ambiente executável continua recomendado antes de considerar a experiência visual integralmente validada.

## Prioridade oficial

### P0 - concluído no PR #40

- login obrigatório;
- simplificação da UX de credenciais;
- identificação de modelos sem versões inventadas;
- refatoração completa e de módulo;
- novos `taskType` integrados ao runtime;
- FIM restrito na UI ao contexto metodologicamente comprovado.

### P1 - próxima entrega funcional

Implementar **refinamento iterativo do prompt** na mesma página.

Objetivo:

```text
briefing original
    + prompt atual
    + comentário de refinamento
    + targetModel
    + taskType
    + metodologia aplicável
    -> nova versão do prompt
```

Primeiro desenho recomendado:

- versões simples `v1 -> v2 -> v3`;
- campo de comentário/melhoria após o primeiro resultado;
- refinamento sobre o prompt atual sem obrigar o usuário a recomeçar;
- preservar briefing original como autoridade;
- não criar inicialmente um sistema complexo de histórico.

### P2 - contexto real do projeto

Depois do refinamento iterativo, implementar contexto de projeto com prioridade para:

1. repositório GitHub;
2. branch;
3. diretório;
4. arquivos selecionados ou detectados como relevantes.

Fluxo recomendado:

```text
pedido do usuário
    -> identificar repositório/branch
    -> obter árvore de arquivos
    -> localizar arquivos relevantes
    -> ler somente o contexto necessário
    -> produzir contexto técnico rastreável
    -> compilar o prompt otimizado
```

Arquivos enviados e URL/Vercel podem ser acrescentados depois conforme necessidade funcional.

## Fora da prioridade atual

Não iniciar por iniciativa própria, salvo se bloquear diretamente P1/P2:

- benchmark comparativo de modelos;
- hardening genérico sem problema funcional concreto;
- micro-otimização de performance;
- otimização prematura de custo;
- observabilidade adicional sem necessidade operacional;
- mudanças cosméticas de segurança sem risco real identificado;
- expansão indiscriminada de providers/modelos.

Segurança crítica, exposição de segredo, regressão funcional ou falha de isolamento continuam sendo bloqueadores e devem ser corrigidos imediatamente.

## Regras obrigatórias de implementação

1. Partir sempre da `main` atualizada.
2. Usar branch específica para cada entrega coerente.
3. Não auto-mergear PRs sem autorização explícita.
4. Não inventar comportamento metodológico por modelo ou versão.
5. Não inventar IDs ou versões de modelos.
6. Manter `generationModel` e `targetModel` independentes.
7. Não transformar o compilador local determinístico em falso modelo de IA.
8. Não executar APIs pagas apenas para QA sem autorização explícita.
9. Não fazer `supabase db push` cego.
10. Não alterar Auth, vault, RLS, crypto, billing ou catálogo remoto quando fora do escopo.
11. Toda mudança funcional deve ter regressão/teste correspondente quando tecnicamente viável.
12. O estado visual não pode mentir sobre executor, fallback, provider, modelo, credencial ou target.

## Atualização obrigatória deste guia

`PROJECT_GUIDE.md` faz parte da definição de pronto.

Toda alteração relevante deve atualizar este arquivo no mesmo PR e registrar, conforme aplicável:

- o que mudou;
- decisão tomada;
- arquivos/áreas afetados;
- validações realizadas;
- estado remoto alterado ou explicitamente não alterado;
- limitações conhecidas;
- pendências;
- próximo passo recomendado.

## Marcos recentes

| Marco | PR | Estado | Resultado principal |
| --- | --- | --- | --- |
| Passo 20 | #30 | Concluído | Fundação metodológica verificável e runtime fail-closed. |
| Passo 20.1 | #31 e correções subsequentes | Concluído | Fluxo de produto e separação geração/target. |
| Passo 20.2 | #34 | Concluído | Targets específicos com herança metodológica. |
| Passo 20.3 | #35 | Concluído | Base canônica persistida no Supabase. |
| Passo 20.3.1 | #36 | Concluído | Release metodológica 2.1.0. |
| Passo 20.4 | #37 | Concluído | Auditoria reproduzível da resolução metodológica. |
| Passo 20.5/20.6 | #38 | Concluído | QA de fluxo e semântica de execução. |
| Consolidação de planejamento | #39 | Concluído | Roadmap funcional atualizado. |
| Passo 21 P0 | #40 | Concluído | Auth obrigatório, credenciais e taxonomia de tarefas. |

## Próximo passo recomendado

1. Fazer um smoke test visual autenticado do estado pós-PR #40 quando houver ambiente/sessão disponível.
2. Em seguida iniciar P1: refinamento iterativo do prompt.
3. Manter P2, contexto GitHub/arquivos, como a grande evolução funcional posterior.
