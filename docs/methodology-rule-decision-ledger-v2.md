# Rule decision ledger — 2.1.0

| Rule | Scope | Type/effect | Provenance | Source | Decision |
|---|---|---|---|---|---|
| `general-objective` | general | PROMPT_STRUCTURE / prompt | VERIFIED_EMPIRICAL | `project-quality-baseline` | KEEP/CONFIRMED |
| `general-preserve-intent` | general | SECURITY / prompt | VERIFIED_EMPIRICAL | `project-quality-baseline` | KEEP/CONFIRMED |
| `general-verification` | general | CODING_AGENT / prompt | VERIFIED_EMPIRICAL | `project-quality-baseline` | KEEP/CONFIRMED |
| `general-safety` | general | SECURITY / prompt | VERIFIED_EMPIRICAL | `project-quality-baseline` | KEEP/CONFIRMED |
| `grok-tool-schema` | grok | TOOL_USE / prompt | VERIFIED_OFFICIAL | `xai-function-calling` | KEEP/CONFIRMED |
| `grok-tool-results` | grok | TOOL_USE / prompt | VERIFIED_OFFICIAL | `xai-function-calling` | KEEP/CONFIRMED |
| `grok-structured-schema` | grok | STRUCTURED_OUTPUT / prompt | VERIFIED_OFFICIAL | `xai-structured-outputs` | KEEP/CONFIRMED |
| `grok-conversation-id-unverified` | grok | API_CONSTRAINT / orchestrator | UNVERIFIED | `xai-function-calling` | REMOVE_FROM_RUNTIME/UNVERIFIED |
| `openai-instruction-boundary` | openai | INSTRUCTION_STYLE / prompt | VERIFIED_OFFICIAL | `openai-prompt-engineering` | KEEP/CONFIRMED |
| `openai-agent-verification` | openai | CODING_AGENT / prompt | VERIFIED_OFFICIAL | `openai-prompt-engineering` | KEEP/CONFIRMED |
| `openai-structured-schema` | openai | STRUCTURED_OUTPUT / prompt | VERIFIED_OFFICIAL | `openai-structured-outputs` | KEEP/CONFIRMED |
| `openai-reasoning-effort-api` | openai | API_PARAMETER / orchestrator | VERIFIED_OFFICIAL | `openai-reasoning` | KEEP/CONFIRMED |
| `openai-no-hidden-cot` | openai | ANTI_PATTERN / prompt | VERIFIED_OFFICIAL | `openai-reasoning` | KEEP/CONFIRMED |
| `claude-xml-boundaries` | claude | PROMPT_STRUCTURE / prompt | VERIFIED_OFFICIAL | `claude-prompting` | KEEP/CONFIRMED |
| `claude-positive-directions` | claude | INSTRUCTION_STYLE / prompt | VERIFIED_OFFICIAL | `claude-prompting` | KEEP/CONFIRMED |
| `claude-tool-description` | claude | TOOL_USE / prompt | VERIFIED_OFFICIAL | `anthropic-tool-use` | KEEP/CONFIRMED |
| `claude-thinking-api` | claude | API_PARAMETER / orchestrator | VERIFIED_OFFICIAL | `anthropic-extended-thinking` | KEEP/CONFIRMED |
| `claude-cache-breakpoint-api` | claude | CACHE / orchestrator | VERIFIED_OFFICIAL | `anthropic-prompt-caching` | KEEP/CONFIRMED |
| `gemini-output-contract` | gemini | STRUCTURED_OUTPUT / prompt | VERIFIED_OFFICIAL | `gemini-prompting` | KEEP/CONFIRMED |
| `gemini-context-order` | gemini | CONTEXT_STRUCTURE / prompt | VERIFIED_OFFICIAL | `gemini-prompting` | KEEP/CONFIRMED |
| `gemini-json-schema-api` | gemini | API_CONSTRAINT / orchestrator | VERIFIED_OFFICIAL | `gemini-structured-output` | KEEP/CONFIRMED |
| `gemini-function-declarations` | gemini | TOOL_USE / prompt | VERIFIED_OFFICIAL | `gemini-function-calling` | KEEP/CONFIRMED |
| `gemini-thinking-budget-api` | gemini | API_PARAMETER / orchestrator | VERIFIED_OFFICIAL | `gemini-thinking` | KEEP/CONFIRMED |
| `deepseek-no-reasoning-request` | deepseek | REASONING_GUIDANCE / prompt | VERIFIED_OFFICIAL | `deepseek-thinking` | KEEP/CONFIRMED |
| `deepseek-tool-continuity` | deepseek | TOOL_USE / prompt | VERIFIED_OFFICIAL | `deepseek-thinking` | KEEP/CONFIRMED |
| `deepseek-json-mode-api` | deepseek | API_CONSTRAINT / orchestrator | VERIFIED_OFFICIAL | `deepseek-json-output` | KEEP/CONFIRMED |
| `deepseek-reasoning-passback-api` | deepseek | API_CONSTRAINT / orchestrator | VERIFIED_OFFICIAL | `deepseek-thinking` | KEEP/CONFIRMED |
| `deepseek-sampling-effort-unverified` | deepseek | API_PARAMETER / orchestrator | UNVERIFIED | `deepseek-thinking` | REMOVE_FROM_RUNTIME/UNVERIFIED |
| `qwen-tool-schema` | qwen | TOOL_USE / prompt | VERIFIED_OFFICIAL | `qwen-function-calling` | KEEP/CONFIRMED |
| `qwen-runtime-template` | qwen | API_CONSTRAINT / orchestrator | VERIFIED_OFFICIAL | `qwen-function-calling` | KEEP/CONFIRMED |
| `qwen-tool-template-orchestrator` | qwen | API_CONSTRAINT / orchestrator | VERIFIED_OFFICIAL | `qwen-agent-function-calling` | KEEP/CONFIRMED |
| `qwen-coder-version-unverified` | qwen | CODING_AGENT / prompt | UNVERIFIED | `qwen-agent-function-calling` | REMOVE_FROM_RUNTIME/UNVERIFIED |
| `codestral-fim-fields` | codestral | FIM / prompt | VERIFIED_OFFICIAL | `mistral-fim` | KEEP/CONFIRMED |
| `codestral-no-forced-fim` | codestral | FIM / prompt | VERIFIED_OFFICIAL | `mistral-fim` | KEEP/CONFIRMED |
| `mistral-structured-schema-api` | codestral | API_CONSTRAINT / orchestrator | VERIFIED_OFFICIAL | `mistral-structured-output` | KEEP/CONFIRMED |
| `devstral-agent-separation` | codestral | PLATFORM / orchestrator | VERIFIED_OFFICIAL | `mistral-agents` | KEEP/CONFIRMED |
| `kimi-context-boundary` | kimi | CONTEXT_STRUCTURE / prompt | VERIFIED_OFFICIAL | `kimi-overview` | KEEP/CONFIRMED |
| `kimi-no-cache-assumption` | kimi | CACHE / orchestrator | VERIFIED_OFFICIAL | `kimi-overview` | KEEP/CONFIRMED |
| `kimi-cache-claim-unverified` | kimi | CACHE / orchestrator | UNVERIFIED | `kimi-overview` | REMOVE_FROM_RUNTIME/UNVERIFIED |
| `kimi-effort-claim-unverified` | kimi | API_PARAMETER / orchestrator | UNVERIFIED | `kimi-overview` | REMOVE_FROM_RUNTIME/UNVERIFIED |
| `llama-runtime-roles` | llama | PROMPT_STRUCTURE / prompt | VERIFIED_OFFICIAL | `llama-prompt-format` | KEEP/CONFIRMED |
| `llama-no-special-token-copy` | llama | PROMPT_STRUCTURE / prompt | VERIFIED_OFFICIAL | `llama-prompt-format` | KEEP/CONFIRMED |
| `llama31-special-tokens-version` | llama | PLATFORM / orchestrator | VERIFIED_OFFICIAL | `meta-llama31-model-card` | KEEP/CONFIRMED |
| `llama-cross-version-format-antipattern` | llama | ANTI_PATTERN / prompt | VERIFIED_OFFICIAL | `meta-llama31-model-card` | KEEP/CONFIRMED |
