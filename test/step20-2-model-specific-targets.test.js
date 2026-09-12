import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { compilePrompt, findProfile, publicProfiles, selectMethodologyExample, selectMethodologyRules } from '../api/model-profiles.js';

const generateSource = readFileSync(new URL('../api/generate.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');

const specificTargets = [
  'grok-4.6', 'grok-code-fast-1', 'gpt-5.6-sol', 'claude-sonnet-5',
  'gemini-3.8-flash', 'gemini-3.7-flash', 'gemini-3.5-flash',
  'gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'deepseek-flash',
  'qwen3.7-plus', 'kimi-k3', 'kimi-k2.7-code-highspeed', 'llama-3.1',
];

test('specific targets resolve independently and inherit their verified family methodology', () => {
  const profiles = publicProfiles();
  for (const slug of specificTargets) assert.ok(profiles.some((profile) => profile.slug === slug), slug);
  const claude = findProfile('claude-sonnet-5');
  assert.deepEqual(claude.methodologyPath, ['claude-sonnet-5', 'claude-sonnet', 'claude']);
  assert.equal(claude.ownRules.length, 0);
  assert.ok(selectMethodologyRules(claude, 'debug').some(({ id }) => id === 'claude-xml-boundaries'));
  assert.equal(findProfile('unknown-model'), undefined);
});

test('a verified specific override wins a family rule and missing overrides fall back deterministically', () => {
  const base = { id: 'family', level: 'family', priority: 1, text: 'FAMILY', status: 'VERIFIED_OFFICIAL', active: true, conflictGroup: 'format' };
  const override = { id: 'version', level: 'version', priority: 999, text: 'VERSION', status: 'VERIFIED_OFFICIAL', active: true, conflictGroup: 'format' };
  assert.equal(selectMethodologyRules({ methodologyRules: [base, override] }, 'debug')[0].id, 'version');
  assert.equal(selectMethodologyRules({ methodologyRules: [base] }, 'debug')[0].id, 'family');
  assert.deepEqual(
    selectMethodologyRules({ methodologyRules: [base, override] }, 'debug').map(({ id }) => id),
    selectMethodologyRules({ methodologyRules: [base, override] }, 'debug').map(({ id }) => id),
  );
});

test('inherited examples require the same task and contribute structure rather than requirements', () => {
  const target = findProfile('gemini-3.8-flash');
  assert.equal(selectMethodologyExample(target, 'debug').target, 'gemini');
  assert.equal(selectMethodologyExample(target, 'refactor'), null);
  const prompt = compilePrompt({ brief: 'Corrija o problema descrito pelo usuário.', profile: target, taskType: 'application' });
  assert.match(prompt, /única autoridade/);
  assert.doesNotMatch(prompt, /serviço de upload|cancelamento encerra recursos|tipo e tamanho antes do envio/i);
});

test('generation executor and optimization target remain separate and targets require no credential', () => {
  const claudeTarget = compilePrompt({ brief: 'Corrija a corrida.', profile: findProfile('claude-sonnet-5'), taskType: 'debug', includeExample: false });
  const geminiTarget = compilePrompt({ brief: 'Corrija a corrida.', profile: findProfile('gemini-3.8-flash'), taskType: 'debug', includeExample: false });
  assert.match(claudeTarget, /tags XML/);
  assert.match(geminiTarget, /campos obrigatórios/);
  assert.doesNotMatch(claudeTarget + geminiTarget, /API key|credencial/i);
  assert.match(generateSource, /resolveMethodologyPackage\(targetModel, taskType/);
  assert.match(generateSource, /directProvider\(canonicalProvider\)/);
  assert.match(main, /generationModel: generationModel\.value[\s\S]*targetModel: targetModel\.value/);
  assert.match(html, /não será chamado e não exige chave/);
});

test('unverified, heuristic and deprecated specific rules cannot influence runtime', () => {
  const methodologyRules = ['UNVERIFIED', 'PROJECT_HEURISTIC', 'DEPRECATED'].map((status, index) => ({
    id: status, level: 'version', priority: index, text: `FORBIDDEN-${status}`, status, active: true,
  }));
  const selected = selectMethodologyRules({ methodologyRules }, 'debug');
  assert.deepEqual(selected.map(({ id }) => id), ['general-objective', 'general-preserve-intent', 'general-verification', 'general-safety']);
  assert.ok(selected.every(({ text }) => !text.startsWith('FORBIDDEN')));
});
