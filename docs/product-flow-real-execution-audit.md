# Passo 20.5/20.6 — Product flow & real execution validation

Date: 2026-09-12  
Initial SHA: `1673989e5938a1a9f3a49618b6762a5e5d938fd4`  
Canonical methodology: `2.1.0`

## Scope and initial audit

This audit did not reopen methodology research or change Production. The initial desktop/mobile inspection found five product-flow defects:

1. local deterministic mode still displayed an unrelated external-provider control and credential panel;
2. the local switch appeared after the Generate button, so execution mode was learned too late;
3. family and specific optimization targets were visually indistinguishable;
4. a provider-catalog failure left the permanent text “Carregando catálogo…”;
5. a Gemini Platform failure returning `local-fallback` named Gemini as “Gerado por”, although the returned prompt was compiled locally.

The account remained auxiliary and the public generator remained available. Existing provider/model reconciliation, BYOK blocking, task labels, target independence, copy behavior, and methodology resolution were correct.

## Official visible flow after corrections

1. briefing;
2. choose local deterministic or external AI;
3. external provider when applicable;
4. specific generation model;
5. task type;
6. optimization target;
7. generate;
8. inspect executor/target/task metadata;
9. copy only the prompt.

Local mode now says “Compilação local determinística — Sem conta, sem chave e sem chamada externa. Não usa IA.” It hides external-only controls while active. Family optimization options receive the suffix “Família”; internal ancestor `claude-sonnet` remains hidden.

## TABLE A — product scenarios

| Scenario | Account | Provider | Generation model | Target | Expected | Actual | Status |
|---|---|---|---|---|---|---|---|
| Public free core | Visitor | Local | `local-deterministic` | Claude Sonnet 5 | Generate without account/key/call | Prompt returned; executor/target/task correct | PASS — DETERMINISTIC LOCAL + MOCKED BROWSER |
| Public copy | Visitor | Local | `local-deterministic` | Claude Sonnet 5 | Clipboard contains prompt only | Exact `output.textContent`; no metadata/trace | PASS — MOCKED BROWSER |
| Visitor selects BYOK | Visitor | DeepSeek | `deepseek-flash` | Claude Sonnet 5 | Block before provider; preserve work; login CTA | Button disabled, CTA visible, briefing/target preserved | PASS — MOCKED BROWSER + CONTRACT |
| Authenticated without key | Authenticated fixture | OpenAI | `gpt-5.6-sol` | Gemini 3.8 Flash | Visible catalog; “Configure sua chave”; no fallback | State non-executable before network | PASS — CONTRACT |
| Saved untested key | Authenticated fixture | BYOK provider | provider model | any | “Ainda não testada”; policy permits attempt | Label differs from validation; adapter owns response | PASS — CONTRACT |
| Valid/invalid/error key | Authenticated fixture | BYOK provider | provider model | any | Exact distinct states | Validada / Inválida / Erro na última validação | PASS — CONTRACT |
| Provider change | Any | DeepSeek → OpenAI | stale → valid OpenAI default | unchanged | Remove incompatible model, preserve target | Reconciler resets only cross-provider model | PASS — CONTRACT |
| Same-provider refresh | Any | OpenAI | manual valid selection | unchanged | Preserve manual model | Selection preserved | PASS — CONTRACT |
| Gemini Platform | Existing environment key | Google Gemini | `gemini-3.8-flash` | Claude Sonnet 5 | Gemini result or explicit safe fallback | Real attempt reached controlled path; environment produced `TypeError`; local fallback identified explicitly | LIMITED — REAL ATTEMPT, NO SUCCESS CLAIM |
| Invalid key / 401/403 | Authenticated fixture | BYOK | provider model | unchanged | Safe credential error, no external fallback | Taxonomy returns `credential_invalid`; state remains client-side | PASS — MOCKED/CONTRACT |
| 404 | Authenticated fixture | BYOK | provider model | unchanged | Model unavailable | `provider_model_unavailable` | PASS — MOCKED/CONTRACT |
| 429 | Authenticated fixture | BYOK | provider model | unchanged | Rate-limit message | `provider_rate_limited` | PASS — MOCKED/CONTRACT |
| Timeout/network/5xx | Authenticated fixture | BYOK | provider model | unchanged | Understandable error; unlock UI; no paid fallback | Typed error, `finally` unlock, no direct-provider fallback | PASS — MOCKED/CONTRACT |
| Unknown target | Any | Local | local | unknown | Fail closed | `target_model_invalid`; target not called | PASS — CONTRACT |

## TABLE B — provider/catalog state

Production was read-only. Active public models come from `ai_models`; adapter and credential routing come from the generation registry.

| Provider | Models | Credential source | Key state | Executable? | UI status |
|---|---|---|---|---|---|
| OpenRouter | `openrouter/free` | BYOK | distinct stored state | With own key | Visible |
| Google Gemini | five Gemini Flash IDs | Platform or BYOK | platform needs no personal key; BYOK distinct | Platform after login / BYOK with key | Visible as Google Gemini, never “Platform” provider |
| xAI | `grok-4.6`, `grok-code-fast-1` | BYOK | distinct | With own key | Visible |
| OpenAI | `gpt-5.6-sol` | BYOK | distinct | With own key | Visible |
| Anthropic | `claude-sonnet-5` | BYOK | distinct | With own key | Visible |
| DeepSeek | `deepseek-flash` | BYOK | distinct | With own key | Visible |
| Mistral | `mistral-small-latest` | BYOK | distinct | With own key | Visible |
| GroqCloud | `openai/gpt-oss-120b` | BYOK | distinct | With own key | Visible |
| Kimi | `kimi-k3`, `kimi-k2.7-code-highspeed` | BYOK | distinct | With own key | Visible |
| Alibaba Model Studio | `qwen3.7-plus` | BYOK | N/A | No; provider inactive | Not exposed |
| Local compiler | `local-deterministic` strategy | Local | no key | Always | Separate non-AI mode |

Provider-less adapters are shown as non-executable by the existing capability contract. Missing BYOK never removes provider/model visibility; it blocks execution.

## TABLE C — execution and target independence

| Generation model | Target | Task | Methodology | Execution type | Result |
|---|---|---|---|---|---|
| `local-deterministic` | Claude Sonnet 5 | debug | Claude inherited, release 2.1.0 | DETERMINISTIC LOCAL | PASS |
| `local-deterministic` | GPT-5.6 Sol | application | OpenAI inherited | DETERMINISTIC LOCAL | PASS |
| `local-deterministic` | Gemini 3.8 Flash | cited | Gemini inherited | DETERMINISTIC LOCAL | PASS |
| Gemini Platform / `gemini-3.8-flash` | Claude Sonnet 5 | cited | Claude inherited | REAL CONTROLLED ATTEMPT | Local fallback after environment `TypeError`; no external success claimed |
| Gemini Platform fixture | Grok 4.6 | agent | Grok inherited | MOCKED + CONTRACT | PASS |
| `deepseek-flash` | Claude Sonnet 5 | debug | Claude inherited | MOCKED + CONTRACT | PASS; target not called |
| `gpt-5.6-sol` | Gemini 3.8 Flash | application | Gemini inherited | MOCKED + CONTRACT | PASS; target not called |
| `grok-4.6` | DeepSeek Flash | debug | DeepSeek inherited | MOCKED + CONTRACT | PASS; target not called |

All nine methodology families were also executed locally across all six task types: 54 deterministic-local combinations. The complete methodology audit remains 23 × 6 = 138.

## TABLE D — error UX

| Error scenario | Expected UX | Actual UX | Fix | Regression |
|---|---|---|---|---|
| Missing catalog | Stop loading text; explain unavailable | Previously stayed “Carregando catálogo…” | Render explicit unavailable option/status | Product-flow test |
| Missing visitor BYOK | Login CTA; preserve work | Correct | None | Browser + source contract |
| Missing authenticated BYOK | Configure-key CTA; no call/fallback | Correct | None | Credential-state contract |
| Invalid key 401/403 | Safe provider credential error | Correct taxonomy | None | Adapter suites |
| 404 | Model unavailable | Correct taxonomy | None | Adapter suites |
| 429 | Temporary rate-limit guidance | Correct taxonomy | None | Adapter suites |
| Timeout/network/5xx | Error then controls unlock | Correct `finally`; direct BYOK has no fallback | Lock credential-source control too | Product-flow test |
| Platform local fallback | Name actual returned-prompt executor | Previously named Gemini | “Compilador local (fallback)” plus failure context | Result-label test |

Errors use the selected generation model as attempted executor metadata and retain target/task. The briefing is never cleared.

## TABLE E — desktop/mobile UI

| UI element | Desktop | Mobile | Problem | Fix |
|---|---|---|---|---|
| Public generator | Clear two-column flow | Single-column, no horizontal overflow | None | — |
| Local mode | Compact explicit card | Full-width touch-friendly card | External fields previously remained visible | Hide external-only provider/credential fields |
| Provider/model terminology | Distinct | Distinct | Provider/model semantics were terse | “Provedor de geração — IA chamada” / “Modelo de geração — específico” |
| Target list | Grouped by organization | Native grouped select | Family/model distinction absent | Family suffix; ancestor stays private |
| Generate/loading | Stable button | Full-width button | Credential source was not locked | Lock all mutable execution controls |
| Result metadata | Executor/target/task visible | Wraps without overflow | Fallback executor could be wrong | Central result-label mapping |
| Prompt/copy | Pre-wrap and scroll-safe | Readable; exact copy | None | — |
| Account navigation | Auxiliary top navigation | Stacked compact navigation | None | — |

Screenshots: `screenshots/step-20-5-6-desktop.png` and `screenshots/step-20-5-6-mobile.png`.

## TABLE F — proven bugs and corrections

| Bug | Severity | Root cause | Fix | Test |
|---|---|---|---|---|
| Local mode visually mixed with external provider | P1 UX | External-only controls always rendered | Mode data attribute hides external-only controls | focused product-flow + browser QA |
| Local execution choice appeared after Generate | P1 UX | Switch followed submit control in DOM | Move local choice before generation controls | DOM-order regression |
| Family targets indistinguishable | P2 UX | Same option text convention | Append “Família” only to root profiles | source/browser regression |
| Catalog failure never left loading state | P2 | Empty fetch catch | Explicit unavailable option and state | product-flow regression |
| Platform fallback credited Gemini | P1 correctness | Metadata keyed only on model except pure local | Central labels identify local fallback | result-label regression |
| Credential source mutable during request | P2 | Busy lock omitted select | Disable it while local/busy | loading regression |
| Early render accessed `workspace` before initialization | P1 regression caught during browser QA | DOM reference declared after synchronous auth subscription | Move DOM references before subscription | browser console QA |

## State, accessibility, copy and performance

- Generate is disabled during execution; briefing, model, target, task, local mode, provider and credential source are locked. `finally` restores controls.
- Login/logout and error paths do not assign to or clear `brief.value`. Provider changes only reconcile the generation model. Target/task changes make no network call.
- Every input/select has an associated label or wrapping label. Status regions are polite live regions; native keyboard navigation remains available; buttons have visible disabled state.
- Copy uses only `output.textContent`; decision trace, provenance, credentials and result metadata are excluded.
- Catalog/profile fetches occur once at startup. Target/provider changes do not generate. Canonical release caching remains unchanged.

## Real, mocked and contract distinction

- **REAL READ-ONLY:** Supabase methodology and provider/model catalog audit.
- **REAL CONTROLLED ATTEMPT:** one Gemini Platform generation route using the preconfigured environment key. It returned the product’s safe local fallback after an environment `TypeError`; therefore `REAL_EXECUTION_SUCCESS` is not claimed.
- **DETERMINISTIC LOCAL:** all 9 families × all 6 task types, plus representative browser flow.
- **MOCKED BROWSER:** desktop and mobile local generation, copy, metadata, visitor BYOK block, model reconciliation and state retention.
- **CONTRACT/MOCKED ADAPTER:** BYOK routes and 401/403/404/429/5xx/invalid response/network/timeout taxonomy. No BYOK provider was called.
- **REAL_EXECUTION_NOT_RUN:** OpenAI, DeepSeek, xAI, Anthropic, Mistral, GroqCloud, Kimi and OpenRouter; no justified cost-free credential execution was available.

## Production, security and remaining limitations

Production remained unchanged. Release 2.1.0 is active and the local snapshot remains semantically equivalent. No migration was needed. No credential, service-role key, master key, JWT or provider secret is exposed to the client or committed. Alibaba remains inactive.

The local Vite environment cannot execute Vercel API routes and its direct provider-catalog call returned unavailable; catalog behavior was therefore verified via Production read-only SQL, server contract tests and mocked browser QA. A successful real Gemini response was not obtained in this environment, so the controlled attempt is reported as limited rather than silently promoted to successful E2E.

## Prior inline-review follow-up

The merged audit CLI now enumerates public targets from `options.sourceCorpus`, so an audit of a different release cannot silently retain the bundled target list. The 2.1 migration’s rollback comment is complemented by `supabase/rollout/rollback_methodology_release_2_1.sql`, which atomically reactivates 2.0.0 and rebuilds normalized rules, applicability, examples and sources from that immutable payload. The rollback was reviewed statically and was not executed against Production.
