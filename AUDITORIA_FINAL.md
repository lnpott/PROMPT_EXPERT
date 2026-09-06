# Auditoria funcional e de segurança

Data: 6 de setembro de 2026.

## Escopo validado

- Compilação local sem credenciais para os nove perfis publicados.
- Aprimoramento opcional por Gemini, sem exposição da chave no navegador.
- Consulta opcional de perfis ativos no Supabase e fallback local quando a base está indisponível.
- Validação de método, modelo permitido e briefing de 3 a 6.000 caracteres.
- Rate limit por instância, timeout de fornecedor, retry limitado e identificador de requisição.
- Interface responsiva, seleção opcional do tipo de tarefa, estados de carregamento, cópia com fallback e identificação da origem do prompt.

## Resultado

| Controle | Resultado | Evidência |
| --- | --- | --- |
| Operação sem chaves | Aprovado | `/api/generate` devolve `source: local`; o navegador também compila localmente quando a rota não existe no Vite. |
| Perfis permitidos | Aprovado | Nove slugs definidos em uma allowlist única e publicados sem o conjunto interno de regras. |
| Segredos | Aprovado | Somente variáveis de ambiente são usadas para a chave Gemini; nenhuma chave privada foi adicionada ao repositório. |
| Falha de fornecedor | Aprovado | Timeout ou erro da Gemini/Supabase resulta em `local-fallback`, preservando a função principal. |
| Abuso básico | Aprovado com limitação | Limite de 20 requisições por minuto e cliente, armazenado por instância serverless. |
| Observabilidade | Aprovado com limitação | `X-Request-Id` e evento sanitizado de fallback; o briefing e o prompt não são registrados. |
| Conteúdo canônico | Aprovado | As 12 regras importadas permanecem não verificadas e inativas. |
| Dependências | Aprovado | `npm audit --omit=dev` não encontrou vulnerabilidades conhecidas. |
| Testes e build | Aprovado | 21 testes e build Vite concluídos. |

## Riscos aceitos antes da configuração externa

1. O rate limit em memória é uma proteção de melhor esforço por instância; uma implantação com alto tráfego deve usar armazenamento compartilhado, como Vercel KV/Upstash.
2. Sem `GEMINI_API_KEY`, o produto gera prompts determinísticos localmente, mas não realiza refinamento generativo.
3. Autenticação, histórico e área administrativa não fazem parte do fluxo público atual e continuam desabilitados; isso evita persistir dados pessoais antes da definição da política de retenção.
4. Os perfis locais são orientações editoriais conservadoras. Regras canônicas específicas só devem substituí-los depois de validação e ativação explícitas.

## Configuração restante

| Variável | Obrigatória | Finalidade |
| --- | --- | --- |
| `GEMINI_API_KEY` | Não para o modo local; sim para aprimoramento por IA | Chamar Gemini no backend. |
| `GEMINI_MODEL` | Não | Substituir o modelo Gemini padrão. |
| `SUPABASE_URL` | Não | Apontar para outro projeto Supabase. |
| `SUPABASE_PUBLISHABLE_KEY` | Não | Ler perfis ativos protegidos por RLS em outro projeto. |

## Parecer

A experiência principal está funcional sem credenciais: escolher um dos nove destinos, manter “Tarefas citadas” ou selecionar um tipo específico, compilar, revisar e copiar o prompt. A aplicação pode ser publicada como está; adicionar `GEMINI_API_KEY` habilita o aprimoramento por IA sem mudar o frontend.

## Validação do Preview

- Preview: `https://prompt-expert-git-functional-multimodel-lnpotts-projects.vercel.app`.
- `/api/profiles`: nove perfis retornados.
- `/api/generate`: prompt para GPT/Codex gerado pela Gemini, com `requestId` e 4.235 bytes de resposta.
- `/api/health`: HTTP 200, base `Grok` e gerador `gemini`.
- Observação: a primeira chamada de geração durante a propagação do deployment recebeu HTTP 502; a repetição imediata após o deployment ficar `Ready` respondeu HTTP 200. Não houve recorrência no teste final.

## Validação de produção

- Commit publicado: `4fe3030de63a910300fe7c7275803a15dcf57d3f` na `main`.
- Deployment: `dpl_HDbabx1hprV7TRZrKssf676Mwq5i`, estado `READY`.
- `/api/profiles`: nove perfis retornados.
- `/api/health`: HTTP 200, base `Grok` e gerador `gemini`.
- `/api/generate`: “Tarefas citadas” gerou um prompt com 2.831 caracteres, `source: "gemini"`, `requestId` e nenhuma classificação de complexidade.

## Verificação das credenciais configuradas

A API da Vercel confirmou que `GEMINI_API_KEY` e `GEMINI_MODEL` existem em Preview e Production; somente nomes, escopos e tipo foram consultados. A chave está classificada como `sensitive` e seu valor não foi lido. A geração real no Preview confirmou que a Gemini está acessível. As instruções operacionais estão em `CONFIGURACAO_APIS.md`.

## Proveniência aplicada

- 24 fontes modeladas: as 19 entradas recebidas e cinco referências complementares usadas para resolver lacunas.
- 23 snapshots de consultas web e um artefato interno versionado.
- 19 vínculos entre regras e evidências, classificados como suporte, suporte parcial, contexto ou incerteza.
- 12 eventos iniciais de revisão, um para cada regra canônica.
- Zero regras canônicas ativas.
- Trigger de banco impede ativação sem `evidence_status = 'verified'` e ao menos uma evidência de suporte confirmada.
- A URL pública `/api/provenance` respondeu HTTP 200 no Preview Vercel com as 22 fontes confirmadas ou parciais; tabelas administrativas permanecem inacessíveis a visitantes.

## Encerramento do núcleo funcional

A avaliação reproduzível cobre 54 combinações de nove perfis e seis briefings versionados, um para cada tipo de tarefa público. Cada caso exige preservação literal do briefing, tipo de tarefa correto, testes, segurança e critérios de aceite, além de rejeitar complexidade e pedidos de cadeia de pensamento. O comando `npm run evaluate` retorna código diferente de zero se qualquer contrato regredir.

A telemetria de geração foi consolidada em um único evento sanitizado por requisição concluída. Ela contém somente `requestId`, modelo, origem, status, duração, número de tentativas e classe de erro; não contém briefing, prompt ou chave. O contrato de tipos de tarefa agora é uma allowlist compartilhada e requisições limitadas retornam `Retry-After: 60`.

A revisão editorial não promoveu nenhuma regra canônica para Grok: as regras importadas verificadas tratam de outros fornecedores ou não têm evidência específica suficiente. As 12 regras continuam inativas. Autenticação e área administrativa seguem deliberadamente adiadas porque o produto público não possui contas nem persiste gerações; adicioná-las agora criaria coleta e superfície de ataque desnecessárias.
