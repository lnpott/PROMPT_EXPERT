-- Migration: 20260912020000_add_missing_gemini_models
-- Passo: 20.1-D
-- Objetivo: Popular os 4 modelos Google Gemini confirmados na auditoria
--           de 2026-09-12 que estavam faltando em ai_models.
--
-- Modelos inseridos:
--   gemini-3.7-flash     (sort_order=20)
--   gemini-3.5-flash     (sort_order=30)
--   gemini-3.5-flash-lite (sort_order=40)
--   gemini-3.1-flash-lite (sort_order=50)
--
-- Não altera: gemini-3.8-flash (já existe, sort_order=10)
-- Idempotente via ON CONFLICT (provider_id, model_id) DO NOTHING
-- Fonte da verdade: docs/model-catalog-audit-2026-09-12.json

DO $$
DECLARE
  v_provider_id UUID;
  v_inserted    INT;
BEGIN
  -- Resolver provider_id dinamicamente por slug (nunca UUID hardcoded)
  SELECT id INTO v_provider_id
  FROM api_providers
  WHERE slug = 'google-gemini';

  IF v_provider_id IS NULL THEN
    RAISE EXCEPTION 'Provider google-gemini não encontrado em api_providers — abortar.';
  END IF;

  -- Inserir os 4 modelos faltantes
  INSERT INTO ai_models (
    provider_id,
    model_id,
    display_name,
    family,
    description,
    is_active,
    is_public,
    is_deprecated,
    sort_order,
    tool_calling,
    vision,
    reasoning_support,
    coding_suitability,
    context_window_tokens,
    max_output_tokens,
    input_price,
    output_price,
    currency,
    pricing_unit,
    official_url,
    pricing_source_url,
    last_verified_at,
    free_tier_status,
    created_at,
    updated_at
  ) VALUES

  -- gemini-3.7-flash (segundo mais recente da família Flash)
  (
    v_provider_id,
    'gemini-3.7-flash',
    'Gemini 3.7 Flash',
    'Gemini 3 Flash',
    'Modelo Flash avançado da geração 3.7, com desempenho superior em raciocínio e geração de código.',
    true, true, false,
    20,
    true, true, true, 4,
    NULL, NULL,
    NULL, NULL, 'USD', 'million_tokens',
    'https://ai.google.dev/gemini-api/docs/models',
    'https://ai.google.dev/gemini-api/docs/models',
    '2026-09-12',
    'unknown',
    NOW(), NOW()
  ),

  -- gemini-3.5-flash
  (
    v_provider_id,
    'gemini-3.5-flash',
    'Gemini 3.5 Flash',
    'Gemini 3 Flash',
    'Modelo Flash de uso geral da geração 3.5, com bom equilíbrio entre velocidade, custo e capacidade.',
    true, true, false,
    30,
    true, true, false, 4,
    NULL, NULL,
    NULL, NULL, 'USD', 'million_tokens',
    'https://ai.google.dev/gemini-api/docs/models',
    'https://ai.google.dev/gemini-api/docs/models',
    '2026-09-12',
    'unknown',
    NOW(), NOW()
  ),

  -- gemini-3.5-flash-lite
  (
    v_provider_id,
    'gemini-3.5-flash-lite',
    'Gemini 3.5 Flash Lite',
    'Gemini 3 Flash',
    'Versão leve do Gemini 3.5 Flash, balanceando velocidade e custo para tarefas de volume elevado.',
    true, true, false,
    40,
    true, true, false, 3,
    NULL, NULL,
    NULL, NULL, 'USD', 'million_tokens',
    'https://ai.google.dev/gemini-api/docs/models',
    'https://ai.google.dev/gemini-api/docs/models',
    '2026-09-12',
    'unknown',
    NOW(), NOW()
  ),

  -- gemini-3.1-flash-lite (modelo mais leve/econômico da família)
  (
    v_provider_id,
    'gemini-3.1-flash-lite',
    'Gemini 3.1 Flash Lite',
    'Gemini 3 Flash',
    'Modelo leve e de baixo custo da família Gemini Flash, otimizado para tarefas de alta velocidade.',
    true, true, false,
    50,
    true, true, false, 3,
    NULL, NULL,
    NULL, NULL, 'USD', 'million_tokens',
    'https://ai.google.dev/gemini-api/docs/models',
    'https://ai.google.dev/gemini-api/docs/models',
    '2026-09-12',
    'unknown',
    NOW(), NOW()
  )

  ON CONFLICT (provider_id, model_id) DO NOTHING;

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  -- Assertion de integridade: as 4 linhas devem existir após o INSERT
  IF (
    SELECT COUNT(*) FROM ai_models
    WHERE provider_id = v_provider_id
      AND model_id IN (
        'gemini-3.1-flash-lite',
        'gemini-3.5-flash-lite',
        'gemini-3.5-flash',
        'gemini-3.7-flash'
      )
  ) < 4 THEN
    RAISE EXCEPTION 'Migration incompleta: nem todas as 4 linhas Gemini estão presentes após INSERT — verificar manualmente.';
  END IF;

  RAISE NOTICE 'Migration 20260912020000 concluída: % linha(s) inserida(s). Catálogo Gemini agora: 5/5.', v_inserted;
END $$;
