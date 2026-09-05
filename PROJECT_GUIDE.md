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

### Validado

- Build de produção executado com sucesso.
- Fluxo principal testado no navegador: informar uma ideia, gerar o prompt e habilitar a cópia.
- Repositório local sincronizado com a branch principal do GitHub após o push confirmado.
- Verificação de segurança do Supabase concluída sem alertas para a estrutura inicial.
- Perfil Grok e cinco regras iniciais carregados e consultados com sucesso pela função de backend.
- Fluxo local testado após a integração: o modo-base continua disponível fora da Vercel ou enquanto a chave Gemini não existe.
- Geração completa validada com Gemini Flash 3.8, perfil Grok e regras armazenadas no Supabase.
- Testes de acesso da API executados localmente com serviços externos simulados, sem usar credenciais reais.
- Acesso externo ao GitHub, Supabase e Gemini verificado em 5 de setembro de 2026; as limitações encontradas na Vercel estão registradas nas evidências abaixo.
- Build de Preview da Vercel corrigido e concluído com sucesso após remover `node_modules` do versionamento.

### Ainda não implementado

- Carga do conteúdo do notebook.
- Histórico de gerações e avaliação de qualidade dos prompts.
- Área administrativa para alimentar a base a partir do notebook.
- Autenticação de usuários.
- Deploy da branch principal, autenticação da CLI e liberação controlada do acesso à aplicação publicada na Vercel.

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

## Próximo marco: primeiro deploy integrado

O código e a base foram preparados. O próximo marco é fazer a integração entre GitHub, Vercel, Supabase e Gemini funcionar no ambiente publicado:

1. Consultar o erro do primeiro deploy da Vercel e corrigi-lo.
2. Cadastrar `GEMINI_API_KEY` somente nas variáveis protegidas da Vercel.
3. Testar `/api/health` e `/api/generate` na URL publicada.
4. Registrar URL, resultado e evidência de validação neste guia.

## Plano operacional em dez passos

| Etapa | Entrega | Estado |
| --- | --- | --- |
| 1 | Definir o produto, público e fluxo principal. | Concluída |
| 2 | Criar e validar o MVP local de geração para Grok. | Concluída |
| 3 | Versionar guia vivo, configuração Vercel e estrutura Supabase. | Concluída |
| 4 | Importar `PROMPT_EXPERT` do GitHub na Vercel e validar o primeiro deploy. | Preview corrigido; produção aguarda merge e validação pública |
| 5 | Cadastrar a chave Gemini secreta na Vercel. | Pendente após corrigir o deploy |
| 6 | Conectar a interface à função segura, aos perfis e às regras do Supabase. | Concluída e validada localmente |
| 7 | Revisar e importar a base do notebook como conteúdo auditado. | Pendente |
| 8 | Criar uma área administrativa protegida para atualizar a base. | Pendente |
| 9 | Escolher a API de IA e implementar a geração segura no backend. | Concluída localmente com Gemini Flash 3.8 |
| 10 | Executar validação de qualidade, segurança e publicação de produção. | Pendente |

## Evidências de verificação

- `npm test`: valida seis cenários de acesso de `/api/generate` e `/api/health`, incluindo respostas 200, 400, 405, 503 e o fluxo integrado simulado.
- `npm run build`: confirma que a inclusão da suíte não interfere no build de produção.

### Acessos externos — 5 de setembro de 2026

| Serviço | Resultado | Evidência e diagnóstico |
| --- | --- | --- |
| GitHub | Positivo | `gh auth status` confirmou autenticação como `lnpott`; a API retornou permissão administrativa sobre `lnpott/PROMPT_EXPERT`, e a branch `main` remota apontava para `d0dec6e`. O clone local inicialmente não tinha remoto configurado, portanto isso foi corrigido antes do envio desta atualização. |
| Supabase | Positivo | Consultas HTTPS autenticadas com a chave pública retornaram HTTP 200, um perfil Grok ativo e cinco regras ativas. O teste confirmou acesso real de leitura sem usar `service_role`. |
| Gemini | Positivo | A consulta autenticada a `models/gemini-3.8-flash` retornou HTTP 200 e confirmou suporte a `generateContent`. Nenhuma chave foi exibida ou persistida. |
| Vercel | Parcial | O erro de build foi corrigido: o Preview `CPS8dVxvmyzNBzNt4ynRGE1E7r3D` terminou com `Deployment has completed`. A causa removida era o diretório `node_modules` versionado com binários de outra plataforma. O acesso público continua bloqueado: `/` e `/api/health` retornam HTTP 302 para o login da Vercel, e `/api/generate` retorna HTTP 401 `Protected deployment`. |

O deploy de Preview agora está saudável, mas a validação funcional externa ainda é negativa porque o deployment exige autenticação da Vercel. É necessário desativar a proteção para o ambiente que deve ser público ou fornecer uma credencial de bypass; depois, repetir os testes de `/`, `/api/health` e `/api/generate`. A CLI deste ambiente permanece sem sessão/token da Vercel, embora o estado do deploy possa ser confirmado pela integração do GitHub.

Cada mudança deve atualizar esta tabela, as seções **Implementado** e **Validado**, e registrar uma evidência de verificação.

## Decisões pendentes

- Onde está o notebook/base atual e em qual formato seu conteúdo será entregue?
- O primeiro lançamento será aberto ao público ou restrito ao administrador?
- Qual regra de retenção será usada para o futuro histórico de gerações?

## Variáveis de ambiente

O repositório contém `.env.example` com as variáveis da função de backend. Para a primeira versão, basta cadastrar `GEMINI_API_KEY` na Vercel nos ambientes Preview e Production. `GEMINI_MODEL` é opcional; o padrão atual é `gemini-3.8-flash`. A função usa apenas a chave pública de leitura do Supabase, protegida pelas políticas de RLS; `service_role` nunca entra no GitHub, no front-end ou neste guia.

## Regra de atualização

Ao fim de cada marco, atualizar as seções **Implementado**, **Validado**, **Ainda não implementado** e **Próximo marco**. Nenhuma etapa deve ser marcada como validada sem evidência de teste.

