# PROMPT_EXPERT - Guia vivo do projeto

> Estado consolidado em 12 de setembro de 2026, após o Passo 21 P0 na branch `step-21-p0-functional-corrections` (PR ainda não mesclado).
> Este arquivo é a referência operacional atual do projeto. Decisões históricas detalhadas continuam preservadas no histórico do Git e nos artefatos versionados em `docs/`.

## Propósito

O PROMPT_EXPERT transforma uma solicitação em linguagem natural em um prompt de programação otimizado para um modelo de destino específico.

O resultado principal do produto é o **prompt otimizado**. O produto não existe para executar automaticamente a tarefa final solicitada pelo usuário.

O sistema separa explicitamente dois conceitos:

1. **Modelo de geração**: modelo realmente chamado para gerar ou refinar o prompt.
2. **Modelo de otimização**: modelo para o qual o prompt final é metodologicamente adaptado.

O modelo de otimização não é chamado, não exige chave própria e pode ser diferente do modelo de geração.

## Estado atual validado

A `main` pós-PR #38 contém:

- geração multi-provider;
- cofre BYOK por usuário;
- Supabase Auth;
- separação entre `generationProvider`, `generationModel`, `credentialSource`, `taskType` e `targetModel`;
- catálogo relacional de providers e modelos de geração;
- compilador local determinístico separado dos modelos de IA externos;
- metodologia canônica versionada e persistida no Supabase;
- release metodológica `2.1.0` ativa;
- 24 fontes metodológicas;
- 25 nós de target;
- 44 regras;
- 165 relações de aplicabilidade;
- 18 exemplos estruturais;
- resolução hierárquica e fail-closed;
- auditoria aplicada das 138 combinações de target e tipo de tarefa existentes no Passo 20.4;
- QA de produto e execução do Passo 20.5/20.6 no PR #38.

A metodologia segue a hierarquia:

```text
GENERAL -> FAMILY -> MODEL -> VERSION -> TASK TYPE -> EXAMPLE
```

Quando não existe evidência confiável de uma diferença própria de uma versão, o target específico herda a metodologia da família. Diferenças de versão não devem ser inventadas.

## Base metodológica e targets

A base canônica no Supabase é a autoridade metodológica primária. O snapshot local versionado permanece como fallback seguro e verificável.

A metodologia ativa pode conter targets de família e targets específicos. Um target de família é válido quando as melhores práticas verificadas se aplicam à família inteira e não existe evidência suficiente para um override de versão.

Exemplos de targets específicos já suportados pela arquitetura incluem:

- `grok-4.6`;
- `grok-code-fast-1`;
- `gpt-5.6-sol`;
- `claude-sonnet-5`;
- versões Gemini Flash cadastradas;
- `deepseek-flash`;
- `qwen3.7-plus`;
- `kimi-k3`;
- `kimi-k2.7-code-highspeed`;
- `llama-3.1`.

Targets específicos podem herdar integralmente a família quando não existe regra própria comprovada.

## Catálogo de geração

O catálogo de geração e o catálogo metodológico são independentes.

O usuário escolhe primeiro o provider de geração e depois um modelo realmente pertencente àquele provider. O sistema não deve mostrar modelos incompatíveis com o provider selecionado.

O compilador local determinístico não é um modelo de IA e nunca deve ser apresentado como se fosse um modelo externo.

### Regra de identificação de modelos

A interface deve identificar cada modelo de forma inequívoca.

- Preferir nome humano + ID canônico do fornecedor quando isso melhorar a clareza.
- Exibir versão explícita quando o fornecedor realmente publicar uma versão.
- Não inventar números de versão para IDs que não possuem versão pública.
- `deepseek-flash`, por exemplo, deve ser tratado pelo ID canônico disponível. Uma versão numérica só deve aparecer se for confirmada pelo fornecedor e representada no catálogo.

## Decisões de produto implementadas no Passo 21

As três decisões abaixo substituem a experiência pública/anônima validada no PR #38 e estão implementadas nesta branch.

### 1. Login obrigatório na entrada

O PROMPT_EXPERT só abre o workspace após a resolução de uma sessão Supabase válida.

Fluxo pretendido:

```text
abrir aplicação
    -> verificar sessão
    -> sessão inexistente: login/cadastro/recuperação
    -> sessão válida: carregar workspace
```

Comportamento implementado:

- enquanto a sessão é verificada, somente o indicador de carregamento aparece; o cabeçalho e o conteúdo começam ocultos no HTML;
- sem sessão, a rota é `#account` e o workspace não é renderizado; `#app` e `#providers` não contornam o gate;
- com sessão, o workspace é restaurado; após login a partir do gate, a rota abre `#app`;
- logout ou entrada em `PASSWORD_RECOVERY` fecha o workspace e cancela uma geração em andamento;
- o navegador envia o JWT em toda geração, inclusive a determinística; `/api/generate` valida a sessão antes de resolver metodologia ou executar provider e devolve 401 sem JWT válido;
- cadastro, login, recuperação e reset destrutivo do vault foram preservados. O contrato criptográfico do cofre não mudou.

O compilador local continua sendo uma estratégia técnica sem IA e sem chave, mas seu uso exige sessão.

### 2. Simplificar a experiência de credenciais

Na interface normal, os estados da chave são descritos em linguagem humana; `credentialSource` continua separado no contrato de geração e aparece somente como escolha prática `Usar` quando uma geração externa tem mais de uma fonte de chave.

Estados exibidos, conforme o caso:

- `Sem chave cadastrada`;
- `Chave cadastrada`;
- `Ainda não testada`;
- `Validada no provedor`;
- `Inválida`;
- `Erro na última validação`.

`Chave cadastrada` indica existência; o complemento indica o último estado de validação. `Ainda não testada` não implica validade. O painel conserva os controles explícitos de salvar, testar e remover. O nome amigável de cada modelo acompanha o ID canônico quando o nome sozinho não o contém; nenhuma versão foi inferida da apresentação.

Não realizar validação paga ou chamada externa automaticamente apenas para renderizar a tela.

### 3. Revisar os tipos de tarefa

O tipo de tarefa não é decorativo. Ele participa da resolução metodológica por `targetModel + taskType` e pode alterar regras e exemplos usados na compilação.

A taxonomia pública implementada usa oito IDs estáveis:

- `cited` — Tarefas citadas;
- `application` — Aplicação completa;
- `refactor_full` — Refatoração completa;
- `refactor_module` — Refatoração de módulo;
- `bug_fix` — Correção de bug;
- `agent` — Agente autônomo;
- `debug` — Depuração;
- `fim` — Fill-in-the-Middle.

O antigo ID `refactor` segue aceito na API para compatibilidade, mas não é exibido na UI. `refactor_full` e `refactor_module` herdam as regras `refactor` do corpus 2.1.0; `bug_fix` herda as regras `debug`. O trace preserva o tipo solicitado e registra o tipo metodológico herdado. A distinção de intenção entre correção e depuração está no tipo declarado ao compilador; não há regra metodológica nova ou diferença de proveniência alegada entre eles.

Os valores percorrem UI, request, validação de `/api/generate`, resolver, compiler e decision trace. Tipo desconhecido recebe erro explícito. `targetModel` permanece independente.

Fill-in-the-Middle significa completar um trecho entre prefixo e sufixo já existentes. A UI só disponibiliza FIM para o target Codestral, que possui a regra comprovada `codestral-fim-fields` no corpus 2.1.0; ao mudar para outro target, uma seleção FIM é descartada. A API ainda aceita pedidos explícitos `fim` para outros targets e aplica apenas as regras gerais disponíveis, sem alegar capacidade específica.

### 4. Refinamento iterativo do prompt

Depois de gerar um prompt, o usuário deve poder acrescentar uma melhoria ou comentário na mesma página e gerar uma nova versão em cima do resultado atual.

Fluxo pretendido:

```text
briefing original
    + prompt atual
    + comentário de refinamento
    + targetModel
    + taskType
    + metodologia aplicável
    -> novo prompt
```

Exemplos de refinamento:

- "Adicione testes unitários e mantenha o restante.";
- "Altere somente a autenticação.";
- "Preserve a arquitetura e refaça apenas este módulo.".

O primeiro desenho pode usar versões simples como `v1 -> v2 -> v3`, sem criar inicialmente um sistema complexo de histórico.

O briefing original continua sendo autoridade de requisitos. O refinamento não deve introduzir requisitos externos que o usuário não pediu.

## Próxima evolução funcional de alta prioridade: contexto real do projeto

Depois das correções imediatas acima e do refinamento iterativo, a evolução funcional mais importante é permitir que o gerador analise contexto real do projeto antes de produzir o prompt.

### Fontes de contexto pretendidas

Prioridade principal:

- repositório GitHub;
- branch;
- diretório;
- arquivos selecionados ou arquivos detectados como relevantes.

Fontes complementares futuras:

- arquivos enviados pelo usuário;
- URL de aplicação publicada;
- Vercel ou outra plataforma de deploy;
- integrações autenticadas adicionais quando forem realmente necessárias.

### Estratégia para GitHub

Não enviar o repositório inteiro indiscriminadamente ao modelo.

Fluxo recomendado:

```text
pedido do usuário
    -> identificar repositório e branch
    -> obter árvore de arquivos
    -> localizar arquivos prováveis para a tarefa
    -> ler somente o contexto relevante
    -> produzir contexto técnico resumido e rastreável
    -> compilar o prompt otimizado
```

Exemplo: para "corrigir o seletor de modelo", o sistema deve localizar os arquivos responsáveis por provider/model selection, catálogo, registry e UI, em vez de melhorar apenas a frase isolada do usuário.

O GitHub deve ser a fonte principal para análise estrutural de código. Uma URL da Vercel é contexto complementar de comportamento/visual e não substitui o acesso aos arquivos.

Esta evolução deve ter prioridade sobre benchmark de modelos, hardening não bloqueante e micro-otimizações de performance.

## Prioridade oficial a partir do PR #38

### P0 - correções funcionais imediatas (implementadas nesta branch)

1. Implementar login obrigatório na entrada.
2. Simplificar estados e microcopy de credenciais.
3. Revisar identificação/nome dos modelos sem inventar versões.
4. Dividir refatoração em completa e de módulo.
5. Garantir que os novos `taskType` realmente participem do runtime e da metodologia.
6. Ajustar FIM para aparecer somente quando fizer sentido ao fluxo.

### P1 - evolução da geração

1. Implementar refinamento iterativo do prompt na mesma página.
2. Manter contexto e resultado anterior de maneira controlada.
3. Exibir de forma clara qual versão do prompt está sendo refinada.

### P2 - contexto de projeto

1. Definir contrato de fonte de contexto.
2. Implementar integração de leitura de repositório GitHub.
3. Resolver branch, árvore e arquivos relevantes.
4. Injetar contexto técnico selecionado no compilador sem exceder limites arbitrariamente.
5. Adicionar arquivos enviados e URL publicada quando houver necessidade funcional.

### Fora da prioridade atual

Não iniciar por iniciativa própria, salvo se bloquear diretamente uma funcionalidade acima:

- benchmark comparativo de modelos;
- hardening adicional sem problema funcional concreto;
- micro-otimização de performance;
- otimização prematura de custo;
- nova camada de observabilidade sem necessidade operacional;
- mudanças cosméticas de segurança que não resolvam risco real do fluxo atual;
- expansão indiscriminada de providers/modelos apenas para aumentar catálogo.

Segurança crítica, regressão real, exposição de segredo ou falha de isolamento continuam sendo bloqueadores e devem ser corrigidos imediatamente. A regra acima apenas impede que hardening genérico desvie o projeto da evolução funcional prioritária.

## Regras obrigatórias de implementação

1. Partir sempre da `main` atualizada.
2. Usar branch específica para cada entrega coerente.
3. Não auto-mergear PRs. O merge final é manual, salvo autorização explícita em contrário.
4. Não inventar comportamento metodológico por modelo ou versão.
5. Não inventar IDs ou versões de modelos.
6. Manter `generationModel` e `targetModel` independentes.
7. Não transformar o compilador local determinístico em um falso modelo de IA.
8. Não executar APIs pagas apenas para QA sem autorização explícita.
9. Não fazer `supabase db push` cego. Alterações remotas devem ser específicas, revisadas e compatíveis com o escopo aprovado.
10. Não alterar Auth, vault, RLS, crypto, billing ou catálogo remoto quando isso estiver fora do escopo da entrega.
11. Toda alteração funcional deve ter regressão/teste correspondente quando tecnicamente viável.
12. O estado visual não pode mentir sobre executor, fallback, provider, modelo, credencial ou target.

## Atualização obrigatória deste guia

`PROJECT_GUIDE.md` faz parte da definição de pronto.

Toda alteração, implementação ou modificação relevante deve atualizar este arquivo no mesmo PR.

A entrega não deve ser considerada concluída até registrar, conforme aplicável:

- o que mudou;
- decisão tomada;
- arquivos/áreas afetados;
- validações realizadas;
- estado remoto alterado ou explicitamente não alterado;
- limitações conhecidas;
- pendências;
- próximo passo recomendado.

Se uma entrega não exigir mudança de planejamento, ainda assim deve registrar o marco concluído quando ele alterar o estado real do projeto.

## Marcos recentes

| Marco | PR | Estado | Resultado principal |
| --- | --- | --- | --- |
| Passo 20 | #30 | Concluído | Fundação metodológica verificável e runtime fail-closed. |
| Passo 20.1 | #31 e correções subsequentes | Concluído | Fluxo de produto e separação geração/target ajustados. |
| Passo 20.2 | #34 | Concluído | Targets específicos com herança metodológica sem diferenças inventadas. |
| Passo 20.3 | #35 | Concluído | Base canônica metodológica persistida no Supabase. |
| Passo 20.3.1 | #36 | Concluído | Release 2.1.0, expansão/revalidação da base canônica. |
| Passo 20.4 | #37 | Concluído | Auditoria reproduzível das 138 resoluções target/task. |
| Passo 20.5/20.6 | #38 | Concluído | QA de fluxo real, correções de UX e semântica de execução. |

## Estado metodológico que não deve regredir

- Release ativa: `2.1.0`.
- Política de proveniência fail-closed.
- Regras elegíveis somente quando compatíveis com os estados permitidos pelo runtime.
- Regras de API, cache, plataforma e constraints não devem vazar como instrução textual de prompt quando não forem prompt rules.
- Examples são referência estrutural e não autoridade de requisitos.
- Briefing do usuário permanece autoridade dos requisitos.
- Targets desconhecidos devem falhar fechado.
- A ausência de orientação específica para uma versão significa herança, não licença para inventar um override.

## Estado de providers e rollout

- Google Gemini permanece suportado conforme os caminhos de credencial já implementados.
- OpenRouter, OpenAI, xAI, Anthropic, DeepSeek, Mistral, GroqCloud e Kimi possuem caminhos BYOK implementados conforme catálogo/registry atual.
- Alibaba/Qwen permanece sujeito ao estado e rollout explicitamente registrados no catálogo. Não ativar apenas para completar lista.
- `ai_models` é catálogo de geração e não deve virar automaticamente catálogo metodológico.

## Entrega do Passo 21 P0

Estado anterior: na `main` inicial `29e1fb3f586782dcffe226ee010e2a4927b23543`, visitantes podiam abrir `#app`, executar o compilador local e enviar `/api/generate` sem JWT; a UI oferecia seis tipos, inclusive `refactor` genérico e FIM universal; a apresentação de credenciais enfatizava termos técnicos e distinguia mal existência de validação.

Áreas afetadas: `index.html`, `src/main.js`, `src/style.css`, `src/auth/ui.js`, `src/generation/provider-options.js`, `src/byok/credentials.js`, `api/generate.js`, `api/model-profiles.js`, testes de autenticação, catálogo, metodologia, fluxo de produto e este guia. Não houve alteração em migrations, RLS, crypto, vault, billing, catálogo remoto ou corpus 2.1.0. Production e Supabase remoto não foram alterados nesta entrega; push da branch e PR não equivalem a deploy.

Validação local em 12/09/2026: testes focados do Passo 21 `8/8`; `npm test` `301/301`; `npm run evaluate` `192/192` casos de prompt e `24/24` casos metodológicos; `npm run build` concluído; `git diff --check` sem erros. Nenhuma chamada paga foi usada para QA. Os testes legados que exigiam o antigo modo público e um roadmap removido da `main` foram atualizados para o contrato atual; o checksum corrigido reflete o corpus 2.1.0 já presente no SHA inicial.

Limitações: não há metodologia específica verificada para os dois subtipos de refatoração nem para distinguir regras de `bug_fix` e `debug`; ambos herdam as categorias comprovadas. FIM é despriorizado na UI fora de Codestral, mas a API preserva pedidos explícitos. A validação de chaves só ocorre mediante ação do usuário. A verificação visual com uma sessão real depende de credenciais de teste e não deve ser inferida do build.

Pendências e próximo passo recomendado: revisar e mesclar manualmente o PR P0 após QA visual autenticado; em entrega separada, iniciar o refinamento iterativo P1. Não iniciar GitHub/contexto, upload, Vercel, benchmark ou expansão de providers neste PR.
