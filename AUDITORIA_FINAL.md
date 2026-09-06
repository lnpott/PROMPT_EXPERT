# Auditoria funcional e de segurança

Data: 6 de setembro de 2026.

## Escopo validado

- Compilação local sem credenciais para os nove perfis publicados.
- Aprimoramento opcional por Gemini, sem exposição da chave no navegador.
- Consulta opcional de perfis ativos no Supabase e fallback local quando a base está indisponível.
- Validação de método, modelo permitido e briefing de 3 a 6.000 caracteres.
- Rate limit por instância, timeout de fornecedor, retry limitado e identificador de requisição.
- Interface responsiva, estados de carregamento, cópia com fallback e identificação da origem do prompt.

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
| Testes e build | Aprovado | 17 testes e build Vite concluídos. |

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

A experiência principal está funcional sem credenciais: escolher um dos nove destinos, informar tipo e complexidade, compilar, revisar e copiar o prompt. A aplicação pode ser publicada como está; adicionar `GEMINI_API_KEY` habilita o aprimoramento por IA sem mudar o frontend.

## Validação do Preview

- Preview: `https://prompt-expert-git-functional-multimodel-lnpotts-projects.vercel.app`.
- `/api/profiles`: nove perfis retornados.
- `/api/generate`: prompt para GPT/Codex gerado pela Gemini, com `requestId` e 4.235 bytes de resposta.
- `/api/health`: HTTP 200, base `Grok` e gerador `gemini`.
- Observação: a primeira chamada de geração durante a propagação do deployment recebeu HTTP 502; a repetição imediata após o deployment ficar `Ready` respondeu HTTP 200. Não houve recorrência no teste final.

## Verificação das credenciais configuradas

A API da Vercel confirmou que `GEMINI_API_KEY` e `GEMINI_MODEL` existem em Preview e Production; somente nomes, escopos e tipo foram consultados. A chave está classificada como `sensitive` e seu valor não foi lido. A geração real no Preview confirmou que a Gemini está acessível. As instruções operacionais estão em `CONFIGURACAO_APIS.md`.
