# Source inventory — canonical methodology 2.1.0

Authority tiers: TIER 1 manufacturer docs; TIER 2 hosting platform docs; TIER 3 official paper/repository; TIER 4 reproducible empirical evidence; TIER 5 secondary discovery only.

| Source | Organization | Tier | Official | Status | URL | Claims supported |
|---|---|---:|---|---|---|---:|
| `project-quality-baseline` | PROMPT_EXPERT | 4 | No | VERIFIED_EMPIRICAL | PROJECT_GUIDE.md | 4 |
| `xai-function-calling` | xAI | 1 | Yes | VERIFIED_OFFICIAL | https://docs.x.ai/developers/tools/function-calling | 3 |
| `openai-prompt-engineering` | OpenAI | 1 | Yes | VERIFIED_OFFICIAL | https://developers.openai.com/api/docs/guides/prompt-engineering | 2 |
| `claude-prompting` | Anthropic | 1 | Yes | VERIFIED_OFFICIAL | https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices | 2 |
| `gemini-prompting` | Google | 1 | Yes | VERIFIED_OFFICIAL | https://ai.google.dev/gemini-api/docs/prompting-strategies | 2 |
| `deepseek-thinking` | DeepSeek | 1 | Yes | VERIFIED_OFFICIAL | https://api-docs.deepseek.com/guides/thinking_mode | 4 |
| `qwen-function-calling` | Qwen Team | 1 | Yes | VERIFIED_OFFICIAL | https://qwen.readthedocs.io/en/latest/framework/function_call.html | 2 |
| `mistral-fim` | Mistral AI | 1 | Yes | VERIFIED_OFFICIAL | https://docs.mistral.ai/api/endpoint/fim | 2 |
| `kimi-overview` | Moonshot AI | 1 | Yes | VERIFIED_OFFICIAL | https://platform.kimi.ai/docs/overview | 4 |
| `llama-prompt-format` | Meta | 1 | Yes | VERIFIED_OFFICIAL | https://developer.meta.com/ai/docs/model-cards-and-prompt-formats/llama3_1/ | 2 |
| `openai-structured-outputs` | OpenAI | 1 | Yes | VERIFIED_OFFICIAL | https://developers.openai.com/api/docs/guides/structured-outputs | 1 |
| `openai-reasoning` | OpenAI | 1 | Yes | VERIFIED_OFFICIAL | https://developers.openai.com/api/docs/guides/reasoning | 2 |
| `anthropic-tool-use` | Anthropic | 1 | Yes | VERIFIED_OFFICIAL | https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview | 1 |
| `anthropic-extended-thinking` | Anthropic | 1 | Yes | VERIFIED_OFFICIAL | https://platform.claude.com/docs/en/build-with-claude/extended-thinking | 1 |
| `anthropic-prompt-caching` | Anthropic | 1 | Yes | VERIFIED_OFFICIAL | https://platform.claude.com/docs/en/build-with-claude/prompt-caching | 1 |
| `gemini-structured-output` | Google | 1 | Yes | VERIFIED_OFFICIAL | https://ai.google.dev/gemini-api/docs/structured-output | 1 |
| `gemini-function-calling` | Google | 1 | Yes | VERIFIED_OFFICIAL | https://ai.google.dev/gemini-api/docs/function-calling | 1 |
| `gemini-thinking` | Google | 1 | Yes | VERIFIED_OFFICIAL | https://ai.google.dev/gemini-api/docs/thinking | 1 |
| `xai-structured-outputs` | xAI | 1 | Yes | VERIFIED_OFFICIAL | https://docs.x.ai/developers/model-capabilities/structured-outputs | 1 |
| `deepseek-json-output` | DeepSeek | 1 | Yes | VERIFIED_OFFICIAL | https://api-docs.deepseek.com/guides/json_mode | 1 |
| `qwen-agent-function-calling` | Qwen Team | 1 | Yes | VERIFIED_OFFICIAL | https://qwen.readthedocs.io/en/latest/framework/function_call.html | 2 |
| `mistral-agents` | Mistral AI | 1 | Yes | VERIFIED_OFFICIAL | https://docs.mistral.ai/agents/agents | 1 |
| `mistral-structured-output` | Mistral AI | 1 | Yes | VERIFIED_OFFICIAL | https://docs.mistral.ai/capabilities/structured_output/custom_structured_output | 1 |
| `meta-llama31-model-card` | Meta | 3 | Yes | VERIFIED_OFFICIAL | https://github.com/meta-llama/llama-models/blob/main/models/llama3_1/MODEL_CARD.md | 2 |

NotebookLM direct access redirected to authentication; `NOTEBOOKLM_DIRECT_ACCESS = NOT_AVAILABLE`. Repository exports were used for claim discovery only, never as sole evidence for `VERIFIED_OFFICIAL`. All URLs were inventoried on 2026-09-12; documentation without a stable updated date records retrieval date only.
