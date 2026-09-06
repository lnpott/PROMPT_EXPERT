# PROMPT_EXPERT — Guia vivo do projeto

## Propósito

O PROMPT_EXPERT transforma uma descrição comum de um produto ou funcionalidade em um prompt de programação claro, completo e adaptado ao modelo de destino. O primeiro modelo suportado é o Grok.

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

### Ainda não implementado

- Aplicação da migration do corpus canônico no projeto Supabase remoto; requer acesso administrativo ao banco.
- Histórico de gerações e avaliação de qualidade dos prompts.
- Área administrativa para alimentar a base a partir do notebook.
- Autenticação de usuários.

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

## Próximo marco: conteúdo auditado e repositório sincronizado

O primeiro deploy integrado está funcional e público. O próximo marco é preservar a rastreabilidade do código e evoluir o conteúdo:

1. Aplicar a migration do corpus canônico no Supabase e validar suas políticas de leitura.
2. Definir a política para histórico de gerações e a autenticação administrativa.

## Plano operacional em dez passos

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

O deploy de produção está saudável, acessível publicamente e sincronizado com a `main` do GitHub. A próxima alteração de conteúdo deve começar pela aplicação administrativa da migration do corpus canônico no Supabase; até isso acontecer, as regras importadas permanecem inativas e não alteram a saída do Grok.

Cada mudança deve atualizar esta tabela, as seções **Implementado** e **Validado**, e registrar uma evidência de verificação.

## Decisões pendentes

- Qual regra de retenção será usada para o futuro histórico de gerações?

## Corpus canônico importado

- Artefato: `base-canonica-regras.md`.
- Auditoria de origem: `notebook-auditoria-fontes.md`, com as 19 fontes classificadas e as quatro lacunas de pesquisa registradas.
- Referência fornecida: `https://notebook.google.com/notebook/5a5161c7-5d60-48e7-ac86-f2887f86d07c`.
- Integridade: SHA-256 `7b7e52a038a86e67248b4d98c02931a1fe1cccf5805eed1cb2d80a34ddbff509`.
- Destino: migration `20260906020000_import_canonical_prompt_rules.sql`, com 12 regras e lacunas normalizadas.
- Segurança editorial: a exportação do notebook foi fornecida diretamente, porém não contém a bibliografia nem URLs correspondentes às citações numéricas. Por isso, as regras entram como `supplied_unverified` e `is_active = false`; não alteram o perfil Grok nem a saída de produção até validação por fonte primária.

## Variáveis de ambiente

O repositório contém `.env.example` com as variáveis da função de backend. Para a primeira versão, basta cadastrar `GEMINI_API_KEY` na Vercel nos ambientes Preview e Production. `GEMINI_MODEL` é opcional; o padrão atual é `gemini-3.8-flash`. A função usa apenas a chave pública de leitura do Supabase, protegida pelas políticas de RLS; `service_role` nunca entra no GitHub, no front-end ou neste guia.

## Regra de atualização

Ao fim de cada marco, atualizar as seções **Implementado**, **Validado**, **Ainda não implementado** e **Próximo marco**. Nenhuma etapa deve ser marcada como validada sem evidência de teste.

