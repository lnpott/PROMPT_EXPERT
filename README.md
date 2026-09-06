# PROMPT_EXPERT

Compilador de prompts de programação com perfis para Grok, GPT/Codex, Claude, Gemini, DeepSeek, Qwen3-Coder, Codestral, Kimi e Llama.

A interface separa o **modelo de destino** (que receberá o prompt) do **motor de compilação** (que melhora o prompt). O catálogo inicial oferece cinco modelos Gemini selecionáveis; todos usam a mesma `GEMINI_API_KEY` no backend.

## Executar

```bash
npm install
npm run dev
```

O compilador local funciona sem conta, banco ou chave de API. Em uma publicação Vercel, configure `GEMINI_API_KEY` para aprimorar os prompts com IA. `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` são opcionais e permitem usar outra base de perfis ativos.

As instruções exatas para cadastrar e testar chaves estão em [CONFIGURACAO_APIS.md](CONFIGURACAO_APIS.md). Não são necessárias chaves dos nove modelos de destino; somente a Gemini é chamada pelo backend atual.

A proveniência pública das regras revisadas fica disponível em `GET /api/provenance` no mesmo domínio Vercel da aplicação.

Os motores públicos disponíveis ficam em `GET /api/compilers`. O endpoint informa o nome da variável necessária, nunca o valor da chave.

O estado, a arquitetura, as validações e o plano operacional do projeto estão em [PROJECT_GUIDE.md](PROJECT_GUIDE.md).

## Avaliação de qualidade

Execute `npm run evaluate` para validar de forma determinística os nove perfis contra os briefings versionados. O comando imprime um relatório JSON e falha se algum requisito estrutural regredir.
