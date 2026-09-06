import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const sourcePath = new URL('../base-canonica-regras.md', import.meta.url);
const migrationPath = new URL('../supabase/migrations/20260906020000_import_canonical_prompt_rules.sql', import.meta.url);

test('canonical source is traceable and its import keeps supplied rules inactive', () => {
  const source = readFileSync(sourcePath);
  const migration = readFileSync(migrationPath, 'utf8');
  const checksum = createHash('sha256').update(source).digest('hex');

  assert.equal(checksum, '7b7e52a038a86e67248b4d98c02931a1fe1cccf5805eed1cb2d80a34ddbff509');
  assert.match(migration, /create table public\.knowledge_sources/);
  assert.match(migration, /create table public\.canonical_prompt_rules/);
  assert.match(migration, /enable row level security/);
  assert.match(migration, /'supplied_unverified', false/);
  assert.match(migration, /using \(is_active = true and evidence_status = 'verified'\)/);
  assert.doesNotMatch(migration, /TO_BE_REPLACED/);
});

test('canonical migration registers every auditable rule category', () => {
  const migration = readFileSync(migrationPath, 'utf8');
  const expectedRuleKeys = [
    'instruction-hierarchy',
    'xml-separation',
    'gemini-property-ordering',
    'provider-effort-controls',
    'deepseek-reasoning-passback',
    'agent-verification',
    'strict-json-schema',
    'claude-md-line-cap',
    'devstral-fim-routing',
    'avoid-forced-chain-of-thought',
    'vertex-cache-propagation',
    'vllm-tag-collision',
  ];

  for (const ruleKey of expectedRuleKeys) {
    assert.match(migration, new RegExp(`'${ruleKey}'`));
  }
});
