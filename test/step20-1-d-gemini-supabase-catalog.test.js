import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migration = readFileSync(new URL('../supabase/migrations/20260912020000_add_missing_gemini_models.sql', import.meta.url), 'utf8');
const expected = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-flash-lite',
];

test('20.1-D versions the four missing Gemini catalog records', () => {
  for (const modelId of expected.slice(1)) assert.match(migration, new RegExp(`'${modelId}'`));
  assert.match(migration, /where slug = 'google-gemini'/i);
  assert.match(migration, /ON CONFLICT \(provider_id, model_id\) DO NOTHING/i);
  assert.match(migration, /Catálogo Gemini agora: 5\/5/);
});

test('the complete Gemini catalog remains the five audited model IDs', () => {
  const audit = JSON.parse(readFileSync(new URL('../docs/model-catalog-audit-2026-09-12.json', import.meta.url), 'utf8'));
  assert.deepEqual(
    audit.models.filter(({ provider, deprecated }) => provider === 'google-gemini' && !deprecated).map(({ modelId }) => modelId).sort(),
    [...expected].sort(),
  );
});
