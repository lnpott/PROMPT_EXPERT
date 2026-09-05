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
- Configuração de build da Vercel e modelo de variáveis públicas versionados.

### Validado

- Build de produção executado com sucesso.
- Fluxo principal testado no navegador: informar uma ideia, gerar o prompt e habilitar a cópia.
- Repositório local sincronizado com a branch principal do GitHub após o push confirmado.
- Verificação de segurança do Supabase concluída sem alertas para a estrutura inicial.
- Perfil Grok e cinco regras iniciais carregados e consultados com sucesso pela função de backend.
- Fluxo local testado após a integração: o modo-base continua disponível enquanto a chave Gemini não existe.
- Geração completa validada com Gemini Flash 3.8, perfil Grok e regras armazenadas no Supabase.

### Ainda não implementado

- Chave Gemini cadastrada na Vercel e validação da geração dinâmica.
- Carga do conteúdo do notebook.
- Persistência de perfis de modelos, regras, exemplos ou histórico.
- Área administrativa para alimentar a base a partir do notebook.
- Autenticação de usuários.
- Publicação na Vercel.

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

## Próximo marco: plataforma de teste

Antes de conectar uma API de IA, consolidar a base do produto:

1. Conectar o front-end a dados públicos controlados, sem chaves privadas no navegador.
2. Publicar uma versão de teste na Vercel.
3. Definir como o conteúdo do notebook será revisado e inserido na base.
4. Adicionar o plano operacional de dez passos e atualizar este guia a cada marco.

## Plano operacional em dez passos

| Etapa | Entrega | Estado |
| --- | --- | --- |
| 1 | Definir o produto, público e fluxo principal. | Concluída |
| 2 | Criar e validar o MVP local de geração para Grok. | Concluída |
| 3 | Versionar guia vivo, configuração Vercel e estrutura Supabase. | Concluída |
| 4 | Importar `PROMPT_EXPERT` do GitHub na Vercel e validar o primeiro deploy. | Aguardando vínculo na Vercel |
| 5 | Cadastrar a chave Gemini secreta na Vercel. | Aguardando vínculo na Vercel |
| 6 | Conectar a interface à função segura, aos perfis e às regras do Supabase. | Implementada, aguardando deploy |
| 7 | Revisar e importar a base do notebook como conteúdo auditado. | Pendente |
| 8 | Criar uma área administrativa protegida para atualizar a base. | Pendente |
| 9 | Escolher a API de IA e implementar a geração segura no backend. | Pendente |
| 10 | Executar validação de qualidade, segurança e publicação de produção. | Pendente |

Cada mudança deve atualizar esta tabela, as seções **Implementado** e **Validado**, e registrar uma evidência de verificação.

## Marco posterior: geração inteligente

Após validar a plataforma de teste:

1. Escolher a API de IA geradora: Grok/xAI ou OpenAI.
2. Criar uma função de backend protegida para chamar essa API.
3. Passar o briefing, o perfil de modelo e as regras ao gerador.
4. Avaliar respostas com exemplos reais e registrar melhorias.

## Decisões pendentes

- Qual API gerará os prompts: Grok/xAI ou OpenAI?
- Onde está o notebook/base atual e em qual formato seu conteúdo será entregue?
- O primeiro lançamento será aberto ao público ou restrito ao administrador?

## Variáveis de ambiente

O repositório contém `.env.example` com as variáveis da função de backend. Para a primeira versão, basta cadastrar `GEMINI_API_KEY` na Vercel nos ambientes Preview e Production. `GEMINI_MODEL` é opcional; o padrão atual é `gemini-3.8-flash`. A função usa apenas a chave pública de leitura do Supabase, protegida pelas políticas de RLS; `service_role` nunca entra no GitHub, no front-end ou neste guia.

## Regra de atualização

Ao fim de cada marco, atualizar as seções **Implementado**, **Validado**, **Ainda não implementado** e **Próximo marco**. Nenhuma etapa deve ser marcada como validada sem evidência de teste.
