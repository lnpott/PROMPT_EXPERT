# Configuração das APIs

## Recomendação

Comece pela **Gemini API**. Ela é a única API privada chamada pelo backend atual e aprimora prompts para todos os nove modelos de destino. As APIs da OpenAI, Anthropic, xAI, DeepSeek, Qwen, Mistral, Moonshot e Meta **não são necessárias**, porque esses nomes representam o destino do prompt; o PROMPT_EXPERT não envia requisições diretamente a esses fornecedores.

O compilador continua funcional sem qualquer chave. Sem Gemini, ele responde de forma determinística com `source: local`; se a Gemini falhar, responde com `source: local-fallback`.

## Onde inserir a chave na Vercel

1. Gere ou consulte a chave em [Google AI Studio](https://ai.google.dev/gemini-api/docs/api-key).
2. Abra o projeto `prompt-expert` na Vercel.
3. Acesse **Settings → Environment Variables**.
4. Cadastre `GEMINI_API_KEY` como variável **Sensitive** nos ambientes **Production** e **Preview**.
5. Opcionalmente, cadastre `GEMINI_MODEL` para substituir `gemini-3.5-flash-lite`.
6. Salve e faça um novo deployment, pois mudanças em variáveis não alteram deployments já concluídos. Consulte também a [documentação de variáveis da Vercel](https://vercel.com/docs/environment-variables/managing-environment-variables).

Não coloque o valor real em `.env.example`, no GitHub, em documentação, no frontend ou em variáveis prefixadas com `VITE_`.

## Motores selecionáveis

Uma única `GEMINI_API_KEY` atende aos cinco motores Google disponíveis no seletor:

| Motor | Uso recomendado |
| --- | --- |
| `gemini-3.5-flash-lite` | Padrão econômico para a maior parte dos briefings. |
| `gemini-3.5-flash` | Equilíbrio entre qualidade e velocidade. |
| `gemini-3.8-flash` | Briefings mais difíceis, priorizando qualidade. |
| `gemini-3.7-flash` | Comparação e alternativa ao modelo mais novo. |
| `gemini-3.1-flash-lite` | Compatibilidade e comparação com a geração anterior. |

Esses cinco identificadores foram confirmados em 6 de setembro de 2026 na listagem autenticada `GET /v1beta/models`, todos com suporte a `generateContent`. Os nomes genéricos `gemini-3.8` e `gemini-3.1-flash` citados na análise preliminar **não** apareceram nessa listagem e, por segurança, não foram adicionados. Gratuidade, limites e disponibilidade dependem da conta e da região no Google AI Studio; o sistema não promete cota gratuita.

Para cadastrar futuramente outro fornecedor, adicione seu adaptador e seu modelo à allowlist do backend, associe uma variável de ambiente própria e cadastre a chave somente na Vercel. Apenas colocar um nome no HTML não habilita um provedor e não deve ser feito.

## Ambiente local

O comando `npm run dev` usa o compilador local e não precisa de chave. Para testar funções serverless localmente com uma ferramenta compatível com Vercel, crie um arquivo não versionado `.env.local`:

```dotenv
GEMINI_API_KEY=sua_chave_real
GEMINI_MODEL=gemini-3.5-flash-lite
```

O padrão `.env.*` já está ignorado pelo Git. Nunca copie a chave real para `.env.example`.

## Supabase

O projeto atual já possui uma URL e uma chave publicável de leitura como defaults seguros. Só configure as variáveis abaixo se quiser trocar de projeto:

```dotenv
SUPABASE_URL=https://SEU_PROJETO.supabase.co
SUPABASE_PUBLISHABLE_KEY=sua_chave_publicavel
```

Não use `service_role` na Vercel para o fluxo público de geração. A aplicação precisa apenas de leitura sujeita às políticas RLS.

### Supabase Auth no frontend

A interface de conta usa o cliente oficial `@supabase/supabase-js` e requer duas variáveis públicas no build Vite:

```dotenv
VITE_SUPABASE_URL=https://SEU_PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sua_chave_publicavel
```

Esses valores identificam o projeto e são apropriados para o navegador; autorização real continua dependendo do Supabase Auth, de grants mínimos e de RLS. Configure-os nos ambientes desejados da Vercel sem copiar valores reais para o repositório. As variáveis backend `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` continuam separadas porque as funções em `/api` não recebem automaticamente valores `VITE_*` em runtime.

Nunca use prefixo `VITE_` em `GEMINI_API_KEY`, `service_role`, futura chave-mestra ou qualquer outro segredo: variáveis `VITE_*` são incorporadas ao bundle público. A aplicação não cria armazenamento próprio para senha ou token; persistência e renovação da sessão ficam a cargo do mecanismo padrão do SDK Supabase.

Sem as duas variáveis públicas, os formulários de conta informam que Auth não está configurado, mas o compilador local e o restante do modo visitante continuam disponíveis.

### Recuperação de conta nesta etapa

“Esqueci minha senha” solicita ao Supabase Auth o envio do link e usa uma URL de retorno identificável. O listener preserva o evento `PASSWORD_RECOVERY` como estado distinto de login normal. Ainda não há cofre nem credenciais para apagar: a barreira server-side e o reset destrutivo obrigatório serão implementados somente no Passo 16. Não trate uma sessão de recovery como alteração voluntária de senha ao evoluir esse fluxo.

## Como confirmar a Gemini

Health check:

```bash
curl https://SEU_DOMINIO/api/health
```

Resultado esperado quando a chave está ativa:

```json
{"status":"ok","knowledgeBase":"Grok","generator":"gemini"}
```

Geração de teste:

```bash
curl -X POST https://SEU_DOMINIO/api/generate \
  -H 'Content-Type: application/json' \
  --data '{"brief":"Crie uma API REST segura com testes.","model":"openai","taskType":"cited"}'
```

Confirme que a resposta tem `source: "gemini"`, um `requestId` e um `prompt` não vazio. Se `source` for `local` ou `local-fallback`, a experiência continua operacional, mas a chamada generativa não foi usada.

## Estado verificado em 6 de setembro de 2026

- `GEMINI_API_KEY`: cadastrada como **Sensitive** em Preview e Production.
- `GEMINI_MODEL`: cadastrada em Preview e Production.
- Preview multi-modelo: `/api/health` retornou `generator: "gemini"`.
- Preview multi-modelo: uma geração GPT/Codex retornou `source: "gemini"`, `requestId` e prompt não vazio.
- Nenhum valor secreto foi lido, exibido ou persistido durante a verificação.
