/**
 * Passo 20.1-D — Teste: catálogo Gemini completo em ai_models (Supabase)
 *
 * Valida que os 5 modelos Gemini confirmados na auditoria de 2026-09-12
 * estão presentes em ai_models, todos is_active=true, is_public=true,
 * is_deprecated=false, e sem duplicatas.
 *
 * Este teste usa o cliente Supabase (variável de ambiente SUPABASE_URL +
 * SUPABASE_ANON_KEY ou SUPABASE_SERVICE_ROLE_KEY), ou um fixture JSON
 * se a variável TEST_USE_FIXTURE=true estiver definida.
 *
 * Para rodar localmente contra o banco real:
 *   SUPABASE_URL=... SUPABASE_KEY=... npm test -- test/step20-1-d-gemini-supabase-catalog.test.js
 *
 * Para rodar com fixture (CI sem acesso ao banco):
 *   TEST_USE_FIXTURE=true npm test -- test/step20-1-d-gemini-supabase-catalog.test.js
 */

'use strict';

const assert = require('node:assert/strict');
const { describe, it, before } = require('node:test');
const path = require('node:path');

// -----------------------------------------------------------------------
// Modelos que devem estar em ai_models para o provider google-gemini
// Fonte: docs/model-catalog-audit-2026-09-12.json (status: CONFIRMED)
// -----------------------------------------------------------------------
const EXPECTED_GEMINI_MODELS = [
  'gemini-3.8-flash',       // já existia antes do 20.1-D (sort_order=10)
  'gemini-3.7-flash',       // inserido no 20.1-D (sort_order=20)
  'gemini-3.5-flash',       // inserido no 20.1-D (sort_order=30)
  'gemini-3.5-flash-lite',  // inserido no 20.1-D (sort_order=40)
  'gemini-3.1-flash-lite',  // inserido no 20.1-D (sort_order=50)
];

// -----------------------------------------------------------------------
// Fixture (usado quando TEST_USE_FIXTURE=true ou banco inacessível)
// Representa o estado esperado APÓS a migration 20260912020000
// -----------------------------------------------------------------------
const FIXTURE = [
  {
    model_id: 'gemini-3.8-flash',
    display_name: 'Gemini 3.8 Flash',
    is_active: true,
    is_public: true,
    is_deprecated: false,
    sort_order: 10,
  },
  {
    model_id: 'gemini-3.7-flash',
    display_name: 'Gemini 3.7 Flash',
    is_active: true,
    is_public: true,
    is_deprecated: false,
    sort_order: 20,
  },
  {
    model_id: 'gemini-3.5-flash',
    display_name: 'Gemini 3.5 Flash',
    is_active: true,
    is_public: true,
    is_deprecated: false,
    sort_order: 30,
  },
  {
    model_id: 'gemini-3.5-flash-lite',
    display_name: 'Gemini 3.5 Flash Lite',
    is_active: true,
    is_public: true,
    is_deprecated: false,
    sort_order: 40,
  },
  {
    model_id: 'gemini-3.1-flash-lite',
    display_name: 'Gemini 3.1 Flash Lite',
    is_active: true,
    is_public: true,
    is_deprecated: false,
    sort_order: 50,
  },
];

// -----------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------

async function fetchFromSupabase() {
  const { createClient } = require('@supabase/supabase-js');
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY;

  if (!url || !key) {
    throw new Error(
      'Variáveis SUPABASE_URL e SUPABASE_KEY (ou SUPABASE_SERVICE_ROLE_KEY) são obrigatórias ' +
      'quando TEST_USE_FIXTURE não está definida.'
    );
  }

  const supabase = createClient(url, key);

  // Buscar provider_id de google-gemini
  const { data: providers, error: provErr } = await supabase
    .from('api_providers')
    .select('id')
    .eq('slug', 'google-gemini')
    .single();

  if (provErr || !providers) {
    throw new Error(`Provider google-gemini não encontrado: ${provErr?.message}`);
  }

  // Buscar modelos do provider
  const { data: models, error: modErr } = await supabase
    .from('ai_models')
    .select('model_id, display_name, is_active, is_public, is_deprecated, sort_order')
    .eq('provider_id', providers.id)
    .order('sort_order');

  if (modErr) {
    throw new Error(`Erro ao buscar ai_models: ${modErr.message}`);
  }

  return models;
}

function fetchFromFixture() {
  return Promise.resolve(FIXTURE);
}

// -----------------------------------------------------------------------
// Testes
// -----------------------------------------------------------------------

describe('Passo 20.1-D — Catálogo Gemini completo em ai_models', () => {
  let models = [];
  const useFixture = process.env.TEST_USE_FIXTURE === 'true';

  before(async () => {
    models = useFixture
      ? await fetchFromFixture()
      : await fetchFromSupabase();
  });

  it('deve ter exatamente 5 modelos Gemini em ai_models (sem duplicatas)', () => {
    const ids = models.map(m => m.model_id);
    const unique = new Set(ids);
    assert.equal(unique.size, ids.length, `Duplicatas detectadas: ${ids}`);
    assert.equal(
      models.length,
      5,
      `Esperado 5 modelos Gemini, encontrado ${models.length}: ${ids.join(', ')}`
    );
  });

  it('deve conter todos os 5 model_ids confirmados na auditoria 2026-09-12', () => {
    const ids = models.map(m => m.model_id);
    for (const expected of EXPECTED_GEMINI_MODELS) {
      assert.ok(
        ids.includes(expected),
        `Modelo faltando em ai_models: ${expected}. Encontrados: ${ids.join(', ')}`
      );
    }
  });

  it('todos os modelos Gemini devem ter is_active=true', () => {
    for (const m of models) {
      assert.equal(m.is_active, true, `${m.model_id} tem is_active=${m.is_active}`);
    }
  });

  it('todos os modelos Gemini devem ter is_public=true', () => {
    for (const m of models) {
      assert.equal(m.is_public, true, `${m.model_id} tem is_public=${m.is_public}`);
    }
  });

  it('todos os modelos Gemini devem ter is_deprecated=false', () => {
    for (const m of models) {
      assert.equal(m.is_deprecated, false, `${m.model_id} tem is_deprecated=${m.is_deprecated}`);
    }
  });

  it('gemini-3.8-flash (pré-existente) deve ter sort_order=10 e não ter sido alterado', () => {
    const existing = models.find(m => m.model_id === 'gemini-3.8-flash');
    assert.ok(existing, 'gemini-3.8-flash não encontrado — foi removido acidentalmente?');
    assert.equal(existing.sort_order, 10, `sort_order de gemini-3.8-flash: ${existing.sort_order}`);
  });

  it('os 4 modelos inseridos no 20.1-D devem ter sort_order coerente com a ordem da família', () => {
    const byId = Object.fromEntries(models.map(m => [m.model_id, m]));
    // gemini-3.8 > 3.7 > 3.5 > 3.5-lite > 3.1-lite em relevância → sort_order crescente
    const expected = {
      'gemini-3.8-flash':      10,
      'gemini-3.7-flash':      20,
      'gemini-3.5-flash':      30,
      'gemini-3.5-flash-lite': 40,
      'gemini-3.1-flash-lite': 50,
    };
    for (const [id, order] of Object.entries(expected)) {
      assert.ok(byId[id], `Modelo ${id} não encontrado`);
      assert.equal(
        byId[id].sort_order,
        order,
        `sort_order de ${id}: esperado ${order}, encontrado ${byId[id].sort_order}`
      );
    }
  });

  it('nenhum modelo Gemini deve ter sort_order duplicado', () => {
    const orders = models.map(m => m.sort_order);
    const unique = new Set(orders);
    assert.equal(
      unique.size,
      orders.length,
      `sort_orders duplicados detectados: ${orders}`
    );
  });
});
