# Canonical content audit — release 2.1.0

## Status

`NOTEBOOKLM_DIRECT_ACCESS = NOT_AVAILABLE`. The URL redirects to authentication. Repository exports establish that prior research exists, but are used only for claim discovery. Active rules require manufacturer documentation or reproducible internal evidence.

## Table C — historical claim verdicts

| Claim | Previous status | Official evidence | Final verdict |
|---|---|---|---|
| OpenAI instruction hierarchy | active broad rule | OpenAI prompt engineering | CONFIRMED |
| `strictJsonSchema` is universal | historical claim | Provider-specific structured-output docs | REFUTED |
| Claude XML boundaries | active family rule | Anthropic prompting best practices | CONFIRMED |
| Universal `CLAUDE.md` line limit | historical claim | No current manufacturer evidence | REFUTED |
| Gemini `propertyOrdering` is prompt prose | historical mixed claim | Gemini structured-output API docs | CORRECTED: API_CONSTRAINT |
| DeepSeek `reasoning_content` passback | previously excluded | DeepSeek thinking-mode contract | CONFIRMED: API_CONSTRAINT |
| One common reasoning effort vocabulary | historical claim | Provider-specific API docs | REFUTED |
| `x-grok-conv-id` mandatory | historical claim | Not found in audited current xAI docs | UNVERIFIED |
| Kimi automatic cross-request cache | historical claim | Not found in audited current Kimi docs | UNVERIFIED |
| Codestral FIM equals Devstral agent flow | historical mixed claim | Separate Mistral FIM and Agents docs | REFUTED |
| Qwen tool calling | family claim | Qwen official docs/repository | CONFIRMED |
| Llama 3.1 tokens apply to later versions | historical extrapolation | Llama 3.1 version-scoped card only | REFUTED |

## Table F — Supabase before/expected after

| Supabase object | Before | After 2.1.0 migration |
|---|---:|---:|
| releases | 1 active (`2.0.0`) | 2 retained; exactly 1 active (`2.1.0`) |
| sources | 10 | 24 |
| targets | 25 | 25 |
| rules | 22 | 44 |
| applicability | 95 | 165 |
| examples | 18 | 18 |
| legacy tables | preserved | preserved |

The normalized tables are a current projection; immutable release history lives in `methodology_releases.payload`. No production result is claimed until the post-migration query verifies it.

## Risks and gaps

Specific IDs without stable public manufacturer documentation inherit family rules. This includes the future-style GPT, Claude and Gemini identifiers in the operational catalog. Kimi cache/effort, Grok conversation ID, DeepSeek alias-specific effort, and Qwen alias/Coder equivalence remain excluded. No paid model API was used.
