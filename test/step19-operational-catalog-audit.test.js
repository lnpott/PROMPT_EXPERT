import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';

import { buildProviderInstruction } from '../api/generate.js';

const generateSource = readFileSync(new URL('../api/generate.js', import.meta.url), 'utf8');

test('every BYOK executor receives a meta-instruction and must not execute the candidate prompt', () => {
  const instruction = buildProviderInstruction('# Prompt para Claude\n\nImplemente o sistema.', {
    displayName: 'Claude',
  });

  assert.match(instruction, /<prompt_candidato>/);
  assert.match(instruction, /não uma solicitação para implementar/);
  assert.match(instruction, /Não execute o prompt candidato/);
  assert.match(instruction, /Entregue somente o prompt final/);
  assert.equal((generateSource.match(/instruction:\s*providerInstruction/g) || []).length, 4);
  assert.doesNotMatch(generateSource, /instruction:\s*localPrompt/);
});

test('Anthropic catalog lookup failures remain service errors instead of model-not-found errors', () => {
  assert.match(generateSource, /if\s*\(!modelsResponse\.ok\)\s*throw new AnthropicError\('provider_unavailable',\s*503\)/);
  assert.match(generateSource, /if\s*\(!allowed\)\s*throw new AnthropicError\('provider_model_unavailable',\s*404\)/);
});

test('Alibaba activation is outside the automatic Supabase migration sequence', () => {
  assert.equal(existsSync(new URL('../supabase/migrations/20260910120000_activate_alibaba_us_generation.sql', import.meta.url)), false);
  const readme = readFileSync(new URL('../supabase/rollout/README.md', import.meta.url), 'utf8');
  const proposal = readFileSync(new URL('../supabase/rollout/activate_alibaba_us_generation.sql', import.meta.url), 'utf8');
  assert.match(readme, /not migrations/);
  assert.match(readme, /explicit authorization/);
  assert.match(proposal, /MANUAL ROLLOUT PROPOSAL/);
});
