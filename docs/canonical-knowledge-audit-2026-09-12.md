# P0 — Canonical Knowledge Base — Passo 20.3

`NOTEBOOKLM_DIRECT_ACCESS = NOT_AVAILABLE`

A URL pública fornecida respondeu 401 no acesso automatizado. Isso não significa que a pesquisa não exista. Foram recuperados do repositório `base-canonica-regras.md`, `notebook-auditoria-fontes.md`, `fontes-primarias-validadas.md`, o corpus 1.1 e migrations históricas de proveniência. A cadeia de custódia direta do NotebookLM não pôde ser confirmada.

## Comparação antes da migration

| Camada | Estado | Classificação |
|---|---|---|
| exports do notebook no repositório | síntese extensa, referências numéricas sem snapshots primários completos | existente, parcialmente auditável |
| corpus 1.1 | 10 fontes, 22 regras, 24 nós, 18 examples | usado exclusivamente pelo runtime |
| Supabase legado | 1 profile Grok, 5 regras heurísticas, 0 examples, 12 regras canônicas inativas | histórico/desconectado |
| evidence_sources legado | fontes e evidência de auditorias anteriores | existente/desconectado do compilador |
| ai_models | modelos executáveis | operacional; deliberadamente não metodológico |

## Release canônico 2.0

O corpus foi enriquecido sem alterar o texto das regras: cada fonte agora tem tipo, organização, título, URL canônica e datas; cada regra tem tipo, evidence reference, confidence, supersession e notes. Os tipos separam prompting (`PROMPT_STRUCTURE`, `INSTRUCTION_STYLE`, `CONTEXT_STRUCTURE`, `REASONING_GUIDANCE`, `CODING_AGENT`, `TOOL_USE`, `STRUCTURED_OUTPUT`, `FIM`, `SECURITY`) de API/plataforma (`API_PARAMETER`, `API_CONSTRAINT`, `CACHE`, `PLATFORM`). Regras API-only podem integrar o pacote/trace, mas não são copiadas como instrução textual ao modelo-alvo.

Somente `VERIFIED_OFFICIAL` e `VERIFIED_EMPIRICAL` entram no runtime. `PROJECT_HEURISTIC`, `UNVERIFIED`, `DEPRECATED` e `CONFLICTING` são rejeitados com motivo no decision trace. Não foram promovidas as 12 regras canônicas históricas nem as cinco heurísticas Grok.

## Supabase depois

| Objeto | Antes | Depois | Migration |
|---|---:|---:|---|
| methodology_releases | 0 | 1 active (`2.0.0`) | `20260912120000` |
| methodology_sources | 0 | 10 | `20260912120000` |
| methodology_targets | 0 | 25 (general + 9 families + hierarchy) | `20260912120000` |
| methodology_rules | 0 | 22 | `20260912120000` |
| methodology_rule_applicability | 0 | 95 | `20260912120000` |
| methodology_examples | 0 | 18 structural references | `20260912120000` |
| legacy model_profiles/prompt_rules/examples | 1/5/0 | 1/5/0, preserved | none |
| canonical_prompt_rules legacy | 12 inactive | 12 inactive, preserved | none |

## Runtime and trace

The active Supabase `methodology_releases` row is now the primary runtime authority. The checked-in corpus is the safe, versioned availability fallback and has the same release semantics. Resolution returns selected and rejected rules, own/inherited level, provenance/source, task type, selection/rejection reason, conflict outcome, and structural example reference. The compiled prompt receives only eligible prompt-writing rules; the generator is an executor of the compiled package.

## Gaps and conflicts

No new model/version differences were asserted. Current specific targets inherit family rules. Historical uncertain claims about Kimi cache, rigid Claude line limits, Vertex cache propagation, vLLM tag collision, and provider-specific effort remain outside normal runtime. The repository export includes more API constraints than the 22 prompt-optimization rules; importing them requires per-claim current official revalidation rather than bulk promotion. Direct NotebookLM access remains unavailable.
