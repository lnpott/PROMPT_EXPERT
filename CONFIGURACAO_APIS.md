# Configuração das APIs

## Recomendação

Comece pela **Gemini API**. Ela é a única API privada chamada pelo backend atual e aprimora prompts para todos os nove modelos de destino. As APIs da OpenAI, Anthropic, xAI, DeepSeek, Qwen, Mistral, Moonshot e Meta **não são necessárias**, porque esses nomes representam o destino do prompt; o PROMPT_EXPERT não envia requisições diretamente a esses fornecedores.

O compilador continua funcional sem qualquer chave. Sem Gemini, ele responde de forma determinística com `source: local`; se a Gemini falhar, responde com `source: local-fallback`.

## Onde inserir a chave na Vercel

1. Gere ou consulte a chave em [Google AI Studio](https://ai.google.dev/gemini-api/docs/api-key).
2. Abra o projeto `prompt-expert` na Vercel.
3. Acesse **Settings → Environment Variables**.
4. Cadastre `GEMINI_API_KEY` como variável **Sensitive** nos ambientes **Production** e **Preview**.
5. Opcionalmente, cadastre `GEMINI_MODEL` para substituir `gemini-3.8-flash`.
6. Salve e faça um novo deployment, pois mudanças em variáveis não alteram deployments já concluídos. Consulte também a [documentação de variáveis da Vercel](https://vercel.com/docs/environment-variables/managing-environment-variables).

Não coloque o valor real em `.env.example`, no GitHub, em documentação, no frontend ou em variáveis prefixadas com `VITE_`.

## Ambiente local

O comando `npm run dev` usa o compilador local e não precisa de chave. Para testar funções serverless localmente com uma ferramenta compatível com Vercel, crie um arquivo não versionado `.env.local`:

```dotenv
GEMINI_API_KEY=sua_chave_real
GEMINI_MODEL=gemini-3.8-flash
```

O padrão `.env.*` já está ignorado pelo Git. Nunca copie a chave real para `.env.example`.

## Supabase

O projeto atual já possui uma URL e uma chave publicável de leitura como defaults seguros. Só configure as variáveis abaixo se quiser trocar de projeto:

```dotenv
SUPABASE_URL=https://SEU_PROJETO.supabase.co
SUPABASE_PUBLISHABLE_KEY=sua_chave_publicavel
```

Não use `service_role` na Vercel para o fluxo público de geração. A aplicação precisa apenas de leitura sujeita às políticas RLS.

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
