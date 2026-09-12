# Methodology coverage matrix — release 2.1.0

Every public optimization target was reviewed against every required dimension. `INHERITED` means the specific target has no proven override and receives eligible family/general rules. `NO_SPECIFIC_GUIDANCE` is an investigated negative result, not an omitted cell.

| Target | Dimension | Status | Rule(s) | Source(s) |
|---|---|---|---|---|
| `grok-4.6` | prompt structure | NO_SPECIFIC_GUIDANCE | — | — |
| `grok-4.6` | instruction style | NO_SPECIFIC_GUIDANCE | — | — |
| `grok-4.6` | context structure | NO_SPECIFIC_GUIDANCE | — | — |
| `grok-4.6` | role/system semantics | NO_SPECIFIC_GUIDANCE | — | — |
| `grok-4.6` | few-shot/examples | NO_SPECIFIC_GUIDANCE | — | — |
| `grok-4.6` | coding | INHERITED | general rules | `project-quality-baseline` |
| `grok-4.6` | debugging | INHERITED | general rules | `project-quality-baseline` |
| `grok-4.6` | refactoring | INHERITED | general rules | `project-quality-baseline` |
| `grok-4.6` | application generation | INHERITED | general rules | `project-quality-baseline` |
| `grok-4.6` | autonomous agents | NO_SPECIFIC_GUIDANCE | — | — |
| `grok-4.6` | tool use/function calling | INHERITED | `grok-tool-schema`, `grok-tool-results` | `xai-function-calling` |
| `grok-4.6` | structured output | INHERITED | `grok-structured-schema` | `xai-structured-outputs` |
| `grok-4.6` | FIM | NOT_APPLICABLE | — | — |
| `grok-4.6` | reasoning/thinking | NO_SPECIFIC_GUIDANCE | — | — |
| `grok-4.6` | context management | NO_SPECIFIC_GUIDANCE | — | — |
| `grok-4.6` | long context | NO_SPECIFIC_GUIDANCE | — | — |
| `grok-4.6` | cache | NO_SPECIFIC_GUIDANCE | — | — |
| `grok-4.6` | API constraints | NO_SPECIFIC_GUIDANCE | — | — |
| `grok-4.6` | sampling/effort | NO_SPECIFIC_GUIDANCE | — | — |
| `grok-4.6` | anti-patterns | NO_SPECIFIC_GUIDANCE | — | — |
| `grok-4.6` | security/instruction boundaries | INHERITED | general rules | `project-quality-baseline` |
| `grok-4.6` | verification/testing behavior | INHERITED | general rules | `project-quality-baseline` |
| `grok-code-fast-1` | prompt structure | NO_SPECIFIC_GUIDANCE | — | — |
| `grok-code-fast-1` | instruction style | NO_SPECIFIC_GUIDANCE | — | — |
| `grok-code-fast-1` | context structure | NO_SPECIFIC_GUIDANCE | — | — |
| `grok-code-fast-1` | role/system semantics | NO_SPECIFIC_GUIDANCE | — | — |
| `grok-code-fast-1` | few-shot/examples | NO_SPECIFIC_GUIDANCE | — | — |
| `grok-code-fast-1` | coding | INHERITED | general rules | `project-quality-baseline` |
| `grok-code-fast-1` | debugging | INHERITED | general rules | `project-quality-baseline` |
| `grok-code-fast-1` | refactoring | INHERITED | general rules | `project-quality-baseline` |
| `grok-code-fast-1` | application generation | INHERITED | general rules | `project-quality-baseline` |
| `grok-code-fast-1` | autonomous agents | NO_SPECIFIC_GUIDANCE | — | — |
| `grok-code-fast-1` | tool use/function calling | INHERITED | `grok-tool-schema`, `grok-tool-results` | `xai-function-calling` |
| `grok-code-fast-1` | structured output | INHERITED | `grok-structured-schema` | `xai-structured-outputs` |
| `grok-code-fast-1` | FIM | NOT_APPLICABLE | — | — |
| `grok-code-fast-1` | reasoning/thinking | NO_SPECIFIC_GUIDANCE | — | — |
| `grok-code-fast-1` | context management | NO_SPECIFIC_GUIDANCE | — | — |
| `grok-code-fast-1` | long context | NO_SPECIFIC_GUIDANCE | — | — |
| `grok-code-fast-1` | cache | NO_SPECIFIC_GUIDANCE | — | — |
| `grok-code-fast-1` | API constraints | NO_SPECIFIC_GUIDANCE | — | — |
| `grok-code-fast-1` | sampling/effort | NO_SPECIFIC_GUIDANCE | — | — |
| `grok-code-fast-1` | anti-patterns | NO_SPECIFIC_GUIDANCE | — | — |
| `grok-code-fast-1` | security/instruction boundaries | INHERITED | general rules | `project-quality-baseline` |
| `grok-code-fast-1` | verification/testing behavior | INHERITED | general rules | `project-quality-baseline` |
| `gpt-5.6-sol` | prompt structure | NO_SPECIFIC_GUIDANCE | — | — |
| `gpt-5.6-sol` | instruction style | NO_SPECIFIC_GUIDANCE | — | — |
| `gpt-5.6-sol` | context structure | NO_SPECIFIC_GUIDANCE | — | — |
| `gpt-5.6-sol` | role/system semantics | NO_SPECIFIC_GUIDANCE | — | — |
| `gpt-5.6-sol` | few-shot/examples | NO_SPECIFIC_GUIDANCE | — | — |
| `gpt-5.6-sol` | coding | INHERITED | general rules | `project-quality-baseline` |
| `gpt-5.6-sol` | debugging | INHERITED | general rules | `project-quality-baseline` |
| `gpt-5.6-sol` | refactoring | INHERITED | general rules | `project-quality-baseline` |
| `gpt-5.6-sol` | application generation | INHERITED | general rules | `project-quality-baseline` |
| `gpt-5.6-sol` | autonomous agents | NO_SPECIFIC_GUIDANCE | — | — |
| `gpt-5.6-sol` | tool use/function calling | NO_SPECIFIC_GUIDANCE | — | — |
| `gpt-5.6-sol` | structured output | INHERITED | `openai-structured-schema` | `openai-structured-outputs` |
| `gpt-5.6-sol` | FIM | NOT_APPLICABLE | — | — |
| `gpt-5.6-sol` | reasoning/thinking | INHERITED | `openai-reasoning-effort-api` | `openai-reasoning` |
| `gpt-5.6-sol` | context management | NO_SPECIFIC_GUIDANCE | — | — |
| `gpt-5.6-sol` | long context | NO_SPECIFIC_GUIDANCE | — | — |
| `gpt-5.6-sol` | cache | NO_SPECIFIC_GUIDANCE | — | — |
| `gpt-5.6-sol` | API constraints | NO_SPECIFIC_GUIDANCE | — | — |
| `gpt-5.6-sol` | sampling/effort | NO_SPECIFIC_GUIDANCE | — | — |
| `gpt-5.6-sol` | anti-patterns | INHERITED | `openai-no-hidden-cot` | `openai-reasoning` |
| `gpt-5.6-sol` | security/instruction boundaries | INHERITED | general rules | `project-quality-baseline` |
| `gpt-5.6-sol` | verification/testing behavior | INHERITED | general rules | `project-quality-baseline` |
| `claude-sonnet-5` | prompt structure | INHERITED | `claude-xml-boundaries` | `claude-prompting` |
| `claude-sonnet-5` | instruction style | INHERITED | `claude-positive-directions` | `claude-prompting` |
| `claude-sonnet-5` | context structure | NO_SPECIFIC_GUIDANCE | — | — |
| `claude-sonnet-5` | role/system semantics | NO_SPECIFIC_GUIDANCE | — | — |
| `claude-sonnet-5` | few-shot/examples | NO_SPECIFIC_GUIDANCE | — | — |
| `claude-sonnet-5` | coding | INHERITED | general rules | `project-quality-baseline` |
| `claude-sonnet-5` | debugging | INHERITED | general rules | `project-quality-baseline` |
| `claude-sonnet-5` | refactoring | INHERITED | general rules | `project-quality-baseline` |
| `claude-sonnet-5` | application generation | INHERITED | general rules | `project-quality-baseline` |
| `claude-sonnet-5` | autonomous agents | NO_SPECIFIC_GUIDANCE | — | — |
| `claude-sonnet-5` | tool use/function calling | INHERITED | `claude-tool-description` | `anthropic-tool-use` |
| `claude-sonnet-5` | structured output | NO_SPECIFIC_GUIDANCE | — | — |
| `claude-sonnet-5` | FIM | NOT_APPLICABLE | — | — |
| `claude-sonnet-5` | reasoning/thinking | INHERITED | `claude-thinking-api` | `anthropic-extended-thinking` |
| `claude-sonnet-5` | context management | NO_SPECIFIC_GUIDANCE | — | — |
| `claude-sonnet-5` | long context | NO_SPECIFIC_GUIDANCE | — | — |
| `claude-sonnet-5` | cache | INHERITED | `claude-cache-breakpoint-api` | `anthropic-prompt-caching` |
| `claude-sonnet-5` | API constraints | NO_SPECIFIC_GUIDANCE | — | — |
| `claude-sonnet-5` | sampling/effort | NO_SPECIFIC_GUIDANCE | — | — |
| `claude-sonnet-5` | anti-patterns | NO_SPECIFIC_GUIDANCE | — | — |
| `claude-sonnet-5` | security/instruction boundaries | INHERITED | general rules | `project-quality-baseline` |
| `claude-sonnet-5` | verification/testing behavior | INHERITED | general rules | `project-quality-baseline` |
| `gemini-3.8-flash` | prompt structure | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.8-flash` | instruction style | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.8-flash` | context structure | INHERITED | `gemini-context-order` | `gemini-prompting` |
| `gemini-3.8-flash` | role/system semantics | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.8-flash` | few-shot/examples | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.8-flash` | coding | INHERITED | general rules | `project-quality-baseline` |
| `gemini-3.8-flash` | debugging | INHERITED | general rules | `project-quality-baseline` |
| `gemini-3.8-flash` | refactoring | INHERITED | general rules | `project-quality-baseline` |
| `gemini-3.8-flash` | application generation | INHERITED | general rules | `project-quality-baseline` |
| `gemini-3.8-flash` | autonomous agents | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.8-flash` | tool use/function calling | INHERITED | `gemini-function-declarations` | `gemini-function-calling` |
| `gemini-3.8-flash` | structured output | INHERITED | `gemini-output-contract` | `gemini-prompting` |
| `gemini-3.8-flash` | FIM | NOT_APPLICABLE | — | — |
| `gemini-3.8-flash` | reasoning/thinking | INHERITED | `gemini-thinking-budget-api` | `gemini-thinking` |
| `gemini-3.8-flash` | context management | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.8-flash` | long context | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.8-flash` | cache | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.8-flash` | API constraints | INHERITED | `gemini-json-schema-api` | `gemini-structured-output` |
| `gemini-3.8-flash` | sampling/effort | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.8-flash` | anti-patterns | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.8-flash` | security/instruction boundaries | INHERITED | general rules | `project-quality-baseline` |
| `gemini-3.8-flash` | verification/testing behavior | INHERITED | general rules | `project-quality-baseline` |
| `gemini-3.7-flash` | prompt structure | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.7-flash` | instruction style | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.7-flash` | context structure | INHERITED | `gemini-context-order` | `gemini-prompting` |
| `gemini-3.7-flash` | role/system semantics | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.7-flash` | few-shot/examples | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.7-flash` | coding | INHERITED | general rules | `project-quality-baseline` |
| `gemini-3.7-flash` | debugging | INHERITED | general rules | `project-quality-baseline` |
| `gemini-3.7-flash` | refactoring | INHERITED | general rules | `project-quality-baseline` |
| `gemini-3.7-flash` | application generation | INHERITED | general rules | `project-quality-baseline` |
| `gemini-3.7-flash` | autonomous agents | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.7-flash` | tool use/function calling | INHERITED | `gemini-function-declarations` | `gemini-function-calling` |
| `gemini-3.7-flash` | structured output | INHERITED | `gemini-output-contract` | `gemini-prompting` |
| `gemini-3.7-flash` | FIM | NOT_APPLICABLE | — | — |
| `gemini-3.7-flash` | reasoning/thinking | INHERITED | `gemini-thinking-budget-api` | `gemini-thinking` |
| `gemini-3.7-flash` | context management | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.7-flash` | long context | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.7-flash` | cache | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.7-flash` | API constraints | INHERITED | `gemini-json-schema-api` | `gemini-structured-output` |
| `gemini-3.7-flash` | sampling/effort | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.7-flash` | anti-patterns | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.7-flash` | security/instruction boundaries | INHERITED | general rules | `project-quality-baseline` |
| `gemini-3.7-flash` | verification/testing behavior | INHERITED | general rules | `project-quality-baseline` |
| `gemini-3.5-flash` | prompt structure | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.5-flash` | instruction style | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.5-flash` | context structure | INHERITED | `gemini-context-order` | `gemini-prompting` |
| `gemini-3.5-flash` | role/system semantics | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.5-flash` | few-shot/examples | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.5-flash` | coding | INHERITED | general rules | `project-quality-baseline` |
| `gemini-3.5-flash` | debugging | INHERITED | general rules | `project-quality-baseline` |
| `gemini-3.5-flash` | refactoring | INHERITED | general rules | `project-quality-baseline` |
| `gemini-3.5-flash` | application generation | INHERITED | general rules | `project-quality-baseline` |
| `gemini-3.5-flash` | autonomous agents | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.5-flash` | tool use/function calling | INHERITED | `gemini-function-declarations` | `gemini-function-calling` |
| `gemini-3.5-flash` | structured output | INHERITED | `gemini-output-contract` | `gemini-prompting` |
| `gemini-3.5-flash` | FIM | NOT_APPLICABLE | — | — |
| `gemini-3.5-flash` | reasoning/thinking | INHERITED | `gemini-thinking-budget-api` | `gemini-thinking` |
| `gemini-3.5-flash` | context management | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.5-flash` | long context | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.5-flash` | cache | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.5-flash` | API constraints | INHERITED | `gemini-json-schema-api` | `gemini-structured-output` |
| `gemini-3.5-flash` | sampling/effort | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.5-flash` | anti-patterns | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.5-flash` | security/instruction boundaries | INHERITED | general rules | `project-quality-baseline` |
| `gemini-3.5-flash` | verification/testing behavior | INHERITED | general rules | `project-quality-baseline` |
| `gemini-3.5-flash-lite` | prompt structure | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.5-flash-lite` | instruction style | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.5-flash-lite` | context structure | INHERITED | `gemini-context-order` | `gemini-prompting` |
| `gemini-3.5-flash-lite` | role/system semantics | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.5-flash-lite` | few-shot/examples | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.5-flash-lite` | coding | INHERITED | general rules | `project-quality-baseline` |
| `gemini-3.5-flash-lite` | debugging | INHERITED | general rules | `project-quality-baseline` |
| `gemini-3.5-flash-lite` | refactoring | INHERITED | general rules | `project-quality-baseline` |
| `gemini-3.5-flash-lite` | application generation | INHERITED | general rules | `project-quality-baseline` |
| `gemini-3.5-flash-lite` | autonomous agents | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.5-flash-lite` | tool use/function calling | INHERITED | `gemini-function-declarations` | `gemini-function-calling` |
| `gemini-3.5-flash-lite` | structured output | INHERITED | `gemini-output-contract` | `gemini-prompting` |
| `gemini-3.5-flash-lite` | FIM | NOT_APPLICABLE | — | — |
| `gemini-3.5-flash-lite` | reasoning/thinking | INHERITED | `gemini-thinking-budget-api` | `gemini-thinking` |
| `gemini-3.5-flash-lite` | context management | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.5-flash-lite` | long context | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.5-flash-lite` | cache | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.5-flash-lite` | API constraints | INHERITED | `gemini-json-schema-api` | `gemini-structured-output` |
| `gemini-3.5-flash-lite` | sampling/effort | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.5-flash-lite` | anti-patterns | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.5-flash-lite` | security/instruction boundaries | INHERITED | general rules | `project-quality-baseline` |
| `gemini-3.5-flash-lite` | verification/testing behavior | INHERITED | general rules | `project-quality-baseline` |
| `gemini-3.1-flash-lite` | prompt structure | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.1-flash-lite` | instruction style | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.1-flash-lite` | context structure | INHERITED | `gemini-context-order` | `gemini-prompting` |
| `gemini-3.1-flash-lite` | role/system semantics | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.1-flash-lite` | few-shot/examples | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.1-flash-lite` | coding | INHERITED | general rules | `project-quality-baseline` |
| `gemini-3.1-flash-lite` | debugging | INHERITED | general rules | `project-quality-baseline` |
| `gemini-3.1-flash-lite` | refactoring | INHERITED | general rules | `project-quality-baseline` |
| `gemini-3.1-flash-lite` | application generation | INHERITED | general rules | `project-quality-baseline` |
| `gemini-3.1-flash-lite` | autonomous agents | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.1-flash-lite` | tool use/function calling | INHERITED | `gemini-function-declarations` | `gemini-function-calling` |
| `gemini-3.1-flash-lite` | structured output | INHERITED | `gemini-output-contract` | `gemini-prompting` |
| `gemini-3.1-flash-lite` | FIM | NOT_APPLICABLE | — | — |
| `gemini-3.1-flash-lite` | reasoning/thinking | INHERITED | `gemini-thinking-budget-api` | `gemini-thinking` |
| `gemini-3.1-flash-lite` | context management | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.1-flash-lite` | long context | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.1-flash-lite` | cache | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.1-flash-lite` | API constraints | INHERITED | `gemini-json-schema-api` | `gemini-structured-output` |
| `gemini-3.1-flash-lite` | sampling/effort | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.1-flash-lite` | anti-patterns | NO_SPECIFIC_GUIDANCE | — | — |
| `gemini-3.1-flash-lite` | security/instruction boundaries | INHERITED | general rules | `project-quality-baseline` |
| `gemini-3.1-flash-lite` | verification/testing behavior | INHERITED | general rules | `project-quality-baseline` |
| `deepseek-flash` | prompt structure | NO_SPECIFIC_GUIDANCE | — | — |
| `deepseek-flash` | instruction style | NO_SPECIFIC_GUIDANCE | — | — |
| `deepseek-flash` | context structure | NO_SPECIFIC_GUIDANCE | — | — |
| `deepseek-flash` | role/system semantics | NO_SPECIFIC_GUIDANCE | — | — |
| `deepseek-flash` | few-shot/examples | NO_SPECIFIC_GUIDANCE | — | — |
| `deepseek-flash` | coding | INHERITED | general rules | `project-quality-baseline` |
| `deepseek-flash` | debugging | INHERITED | general rules | `project-quality-baseline` |
| `deepseek-flash` | refactoring | INHERITED | general rules | `project-quality-baseline` |
| `deepseek-flash` | application generation | INHERITED | general rules | `project-quality-baseline` |
| `deepseek-flash` | autonomous agents | NO_SPECIFIC_GUIDANCE | — | — |
| `deepseek-flash` | tool use/function calling | NO_SPECIFIC_GUIDANCE | — | — |
| `deepseek-flash` | structured output | NO_SPECIFIC_GUIDANCE | — | — |
| `deepseek-flash` | FIM | NOT_APPLICABLE | — | — |
| `deepseek-flash` | reasoning/thinking | NO_SPECIFIC_GUIDANCE | — | — |
| `deepseek-flash` | context management | NO_SPECIFIC_GUIDANCE | — | — |
| `deepseek-flash` | long context | NO_SPECIFIC_GUIDANCE | — | — |
| `deepseek-flash` | cache | NO_SPECIFIC_GUIDANCE | — | — |
| `deepseek-flash` | API constraints | INHERITED | `deepseek-json-mode-api`, `deepseek-reasoning-passback-api` | `deepseek-json-output`, `deepseek-thinking` |
| `deepseek-flash` | sampling/effort | NO_SPECIFIC_GUIDANCE | — | — |
| `deepseek-flash` | anti-patterns | NO_SPECIFIC_GUIDANCE | — | — |
| `deepseek-flash` | security/instruction boundaries | INHERITED | general rules | `project-quality-baseline` |
| `deepseek-flash` | verification/testing behavior | INHERITED | general rules | `project-quality-baseline` |
| `qwen3.7-plus` | prompt structure | NO_SPECIFIC_GUIDANCE | — | — |
| `qwen3.7-plus` | instruction style | NO_SPECIFIC_GUIDANCE | — | — |
| `qwen3.7-plus` | context structure | NO_SPECIFIC_GUIDANCE | — | — |
| `qwen3.7-plus` | role/system semantics | NO_SPECIFIC_GUIDANCE | — | — |
| `qwen3.7-plus` | few-shot/examples | NO_SPECIFIC_GUIDANCE | — | — |
| `qwen3.7-plus` | coding | INHERITED | general rules | `project-quality-baseline` |
| `qwen3.7-plus` | debugging | INHERITED | general rules | `project-quality-baseline` |
| `qwen3.7-plus` | refactoring | INHERITED | general rules | `project-quality-baseline` |
| `qwen3.7-plus` | application generation | INHERITED | general rules | `project-quality-baseline` |
| `qwen3.7-plus` | autonomous agents | NO_SPECIFIC_GUIDANCE | — | — |
| `qwen3.7-plus` | tool use/function calling | INHERITED | `qwen-tool-schema` | `qwen-function-calling` |
| `qwen3.7-plus` | structured output | NO_SPECIFIC_GUIDANCE | — | — |
| `qwen3.7-plus` | FIM | NOT_APPLICABLE | — | — |
| `qwen3.7-plus` | reasoning/thinking | NO_SPECIFIC_GUIDANCE | — | — |
| `qwen3.7-plus` | context management | NO_SPECIFIC_GUIDANCE | — | — |
| `qwen3.7-plus` | long context | NO_SPECIFIC_GUIDANCE | — | — |
| `qwen3.7-plus` | cache | NO_SPECIFIC_GUIDANCE | — | — |
| `qwen3.7-plus` | API constraints | INHERITED | `qwen-runtime-template`, `qwen-tool-template-orchestrator` | `qwen-agent-function-calling`, `qwen-function-calling` |
| `qwen3.7-plus` | sampling/effort | NO_SPECIFIC_GUIDANCE | — | — |
| `qwen3.7-plus` | anti-patterns | NO_SPECIFIC_GUIDANCE | — | — |
| `qwen3.7-plus` | security/instruction boundaries | INHERITED | general rules | `project-quality-baseline` |
| `qwen3.7-plus` | verification/testing behavior | INHERITED | general rules | `project-quality-baseline` |
| `kimi-k3` | prompt structure | NO_SPECIFIC_GUIDANCE | — | — |
| `kimi-k3` | instruction style | NO_SPECIFIC_GUIDANCE | — | — |
| `kimi-k3` | context structure | NO_SPECIFIC_GUIDANCE | — | — |
| `kimi-k3` | role/system semantics | NO_SPECIFIC_GUIDANCE | — | — |
| `kimi-k3` | few-shot/examples | NO_SPECIFIC_GUIDANCE | — | — |
| `kimi-k3` | coding | INHERITED | general rules | `project-quality-baseline` |
| `kimi-k3` | debugging | INHERITED | general rules | `project-quality-baseline` |
| `kimi-k3` | refactoring | INHERITED | general rules | `project-quality-baseline` |
| `kimi-k3` | application generation | INHERITED | general rules | `project-quality-baseline` |
| `kimi-k3` | autonomous agents | NO_SPECIFIC_GUIDANCE | — | — |
| `kimi-k3` | tool use/function calling | NO_SPECIFIC_GUIDANCE | — | — |
| `kimi-k3` | structured output | NO_SPECIFIC_GUIDANCE | — | — |
| `kimi-k3` | FIM | NOT_APPLICABLE | — | — |
| `kimi-k3` | reasoning/thinking | NO_SPECIFIC_GUIDANCE | — | — |
| `kimi-k3` | context management | NO_SPECIFIC_GUIDANCE | — | — |
| `kimi-k3` | long context | NO_SPECIFIC_GUIDANCE | — | — |
| `kimi-k3` | cache | NO_SPECIFIC_GUIDANCE | — | — |
| `kimi-k3` | API constraints | NO_SPECIFIC_GUIDANCE | — | — |
| `kimi-k3` | sampling/effort | NO_SPECIFIC_GUIDANCE | — | — |
| `kimi-k3` | anti-patterns | NO_SPECIFIC_GUIDANCE | — | — |
| `kimi-k3` | security/instruction boundaries | INHERITED | general rules | `project-quality-baseline` |
| `kimi-k3` | verification/testing behavior | INHERITED | general rules | `project-quality-baseline` |
| `kimi-k2.7-code-highspeed` | prompt structure | NO_SPECIFIC_GUIDANCE | — | — |
| `kimi-k2.7-code-highspeed` | instruction style | NO_SPECIFIC_GUIDANCE | — | — |
| `kimi-k2.7-code-highspeed` | context structure | NO_SPECIFIC_GUIDANCE | — | — |
| `kimi-k2.7-code-highspeed` | role/system semantics | NO_SPECIFIC_GUIDANCE | — | — |
| `kimi-k2.7-code-highspeed` | few-shot/examples | NO_SPECIFIC_GUIDANCE | — | — |
| `kimi-k2.7-code-highspeed` | coding | INHERITED | general rules | `project-quality-baseline` |
| `kimi-k2.7-code-highspeed` | debugging | INHERITED | general rules | `project-quality-baseline` |
| `kimi-k2.7-code-highspeed` | refactoring | INHERITED | general rules | `project-quality-baseline` |
| `kimi-k2.7-code-highspeed` | application generation | INHERITED | general rules | `project-quality-baseline` |
| `kimi-k2.7-code-highspeed` | autonomous agents | NO_SPECIFIC_GUIDANCE | — | — |
| `kimi-k2.7-code-highspeed` | tool use/function calling | NO_SPECIFIC_GUIDANCE | — | — |
| `kimi-k2.7-code-highspeed` | structured output | NO_SPECIFIC_GUIDANCE | — | — |
| `kimi-k2.7-code-highspeed` | FIM | NOT_APPLICABLE | — | — |
| `kimi-k2.7-code-highspeed` | reasoning/thinking | NO_SPECIFIC_GUIDANCE | — | — |
| `kimi-k2.7-code-highspeed` | context management | NO_SPECIFIC_GUIDANCE | — | — |
| `kimi-k2.7-code-highspeed` | long context | NO_SPECIFIC_GUIDANCE | — | — |
| `kimi-k2.7-code-highspeed` | cache | NO_SPECIFIC_GUIDANCE | — | — |
| `kimi-k2.7-code-highspeed` | API constraints | NO_SPECIFIC_GUIDANCE | — | — |
| `kimi-k2.7-code-highspeed` | sampling/effort | NO_SPECIFIC_GUIDANCE | — | — |
| `kimi-k2.7-code-highspeed` | anti-patterns | NO_SPECIFIC_GUIDANCE | — | — |
| `kimi-k2.7-code-highspeed` | security/instruction boundaries | INHERITED | general rules | `project-quality-baseline` |
| `kimi-k2.7-code-highspeed` | verification/testing behavior | INHERITED | general rules | `project-quality-baseline` |
| `llama-3.1` | prompt structure | NO_SPECIFIC_GUIDANCE | — | — |
| `llama-3.1` | instruction style | NO_SPECIFIC_GUIDANCE | — | — |
| `llama-3.1` | context structure | NO_SPECIFIC_GUIDANCE | — | — |
| `llama-3.1` | role/system semantics | INHERITED | `llama-runtime-roles`, `llama-no-special-token-copy` | `llama-prompt-format` |
| `llama-3.1` | few-shot/examples | NO_SPECIFIC_GUIDANCE | — | — |
| `llama-3.1` | coding | INHERITED | general rules | `project-quality-baseline` |
| `llama-3.1` | debugging | INHERITED | general rules | `project-quality-baseline` |
| `llama-3.1` | refactoring | INHERITED | general rules | `project-quality-baseline` |
| `llama-3.1` | application generation | INHERITED | general rules | `project-quality-baseline` |
| `llama-3.1` | autonomous agents | NO_SPECIFIC_GUIDANCE | — | — |
| `llama-3.1` | tool use/function calling | NO_SPECIFIC_GUIDANCE | — | — |
| `llama-3.1` | structured output | NO_SPECIFIC_GUIDANCE | — | — |
| `llama-3.1` | FIM | NOT_APPLICABLE | — | — |
| `llama-3.1` | reasoning/thinking | NO_SPECIFIC_GUIDANCE | — | — |
| `llama-3.1` | context management | NO_SPECIFIC_GUIDANCE | — | — |
| `llama-3.1` | long context | NO_SPECIFIC_GUIDANCE | — | — |
| `llama-3.1` | cache | NO_SPECIFIC_GUIDANCE | — | — |
| `llama-3.1` | API constraints | NO_SPECIFIC_GUIDANCE | — | — |
| `llama-3.1` | sampling/effort | NO_SPECIFIC_GUIDANCE | — | — |
| `llama-3.1` | anti-patterns | INHERITED | `llama-cross-version-format-antipattern` | `meta-llama31-model-card` |
| `llama-3.1` | security/instruction boundaries | INHERITED | general rules | `project-quality-baseline` |
| `llama-3.1` | verification/testing behavior | INHERITED | general rules | `project-quality-baseline` |
