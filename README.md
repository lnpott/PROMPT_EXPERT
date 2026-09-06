# PROMPT_EXPERT

Compilador de prompts de programação com perfis para Grok, GPT/Codex, Claude, Gemini, DeepSeek, Qwen3-Coder, Codestral, Kimi e Llama.

## Executar

```bash
npm install
npm run dev
```

O compilador local funciona sem conta, banco ou chave de API. Em uma publicação Vercel, configure `GEMINI_API_KEY` para aprimorar os prompts com IA. `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY` são opcionais e permitem usar outra base de perfis ativos.

O estado, a arquitetura, as validações e o plano operacional do projeto estão em [PROJECT_GUIDE.md](PROJECT_GUIDE.md).
