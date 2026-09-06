import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const sourcePath = new URL('../base-canonica-regras.md', import.meta.url);
const migrationPath = new URL('../supabase/migrations/20260906020000_import_canonical_prompt_rules.sql', import.meta.url);
const auditPath = new URL('../notebook-auditoria-fontes.md', import.meta.url);
const guidePath = new URL('../PROJECT_GUIDE.md', import.meta.url);

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

test('notebook audit preserves source inventory and editorial safeguards', () => {
  const audit = readFileSync(auditPath, 'utf8');
  const sourceRows = audit.match(/^\| \d+ \|/gm) || [];

  assert.equal(sourceRows.length, 19);
  assert.match(audit, /learn\.microsoft\.com/);
  assert.match(audit, /code\.claude\.com/);
  assert.match(audit, /api-docs\.deepseek\.com/);
  assert.match(audit, /docs\.x\.ai/);
  assert.match(audit, /ai\.google\.dev/);
  assert.match(audit, /Model Spec/i);
  assert.match(audit, /supplied_unverified/);
  assert.match(audit, /is_active = false/);
  assert.match(audit, /duas cópias consecutivas/);
});

test('project guide defines ten auditable next steps', () => {
  const guide = readFileSync(guidePath, 'utf8');
  const roadmap = guide.match(/## Próximos dez passos([\s\S]*?)### Protocolo obrigatório por passo/)?.[1] || '';
  const roadmapRows = roadmap.match(/^\| \d+ \|/gm) || [];
  const execution = guide.match(/### Registro de execução dos próximos passos([\s\S]*?)### Modelo de auditoria/)?.[1] || '';
  const executionRows = execution.match(/^\| \d+ \|/gm) || [];

  assert.equal(roadmapRows.length, 10);
  assert.equal(executionRows.length, 10);
  assert.match(guide, /Auditoria obrigatória/);
  assert.match(guide, /Commit sugerido/);
  assert.match(guide, /PR sugerido/);
  assert.match(guide, /#### Auditoria do passo N/);
  assert.match(guide, /Segurança, segredos e dados pessoais/);
  assert.match(guide, /Rollback:/);
});
