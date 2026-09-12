import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import generate from './helpers/authenticated-generate.js';
import { publicProfiles, taskTypes } from '../api/model-profiles.js';
import { generationModelSelection, generationModelsForProvider, generationResultLabels, generationUiState } from '../src/generation/provider-options.js';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/style.css', import.meta.url), 'utf8');
const rollback = readFileSync(new URL('../supabase/rollout/rollback_methodology_release_2_1.sql', import.meta.url), 'utf8');

function responseHarness() {
  return { statusCode: 200, body: null, headers: {}, setHeader(name, value) { this.headers[name] = value; }, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
}

test('public product presents the official workflow in an accessible order', () => {
  const labels = ['brief', 'local-generation', 'generation-provider', 'generation-model', 'task-type', 'target-model', 'generate', 'result', 'copy'];
  for (let index = 1; index < labels.length; index += 1) assert.ok(html.indexOf(`id="${labels[index - 1]}"`) < html.indexOf(`id="${labels[index]}"`));
  assert.match(html, /Compilação local determinística[\s\S]*Sem chave ou chamada externa\. Não usa IA\./);
  assert.match(html, /Provedor de geração — IA chamada[\s\S]*Empresa cuja IA será realmente chamada/);
  assert.match(html, /Modelo de geração — específico[\s\S]*Modelo chamado para gerar ou refinar/);
  assert.match(html, /Modelo-alvo metodológico; não será chamado e não exige chave/);
  for (const id of ['brief','generation-provider','generation-model','task-type','target-model']) assert.match(html, new RegExp(`for="${id}"`));
  assert.match(html, /aria-live="polite"/);
});

test('local mode is visually and semantically separate from external providers', () => {
  assert.match(css, /data-generation-mode='local'[\s\S]*external-generation-control/);
  assert.match(main, /workspace\.dataset\.generationMode = local \? 'local' : 'external'/);
  assert.match(main, /Compilador local · regras metodológicas 2\.1\.0 · nenhuma IA será chamada/);
  assert.doesNotMatch(html, /Modelo local/);
});

test('provider model reconciliation remains provider-bound and preserves only valid choices', () => {
  const providers = [
    { slug: 'deepseek', models: [{ model_id: 'deepseek-flash', display_name: 'DeepSeek Flash' }] },
    { slug: 'openai', models: [{ model_id: 'gpt-5.6-sol', display_name: 'GPT-5.6 Sol' }, { model_id: 'gpt-manual', display_name: 'Manual' }] },
  ];
  assert.deepEqual(generationModelsForProvider(providers, 'deepseek').map(({ modelId }) => modelId), ['deepseek-flash']);
  const openai = generationModelsForProvider(providers, 'openai');
  assert.equal(generationModelSelection(openai, 'gpt-manual', false), 'gpt-manual');
  assert.equal(generationModelSelection(openai, 'deepseek-flash', true), 'gpt-5.6-sol');
  assert.match(main, /Catálogo temporariamente indisponível/);
  assert.doesNotMatch(main, /generationProvider\.value = 'google-gemini'/);
});

test('credential states distinguish login, absence, untested, valid, invalid and validation error', () => {
  const provider = { generation: { generationSupported: true, credentialSources: ['byok'] } };
  assert.equal(generationUiState({ provider, authenticated: false }).credentialStatus, 'Entrar para configurar sua chave');
  assert.equal(generationUiState({ provider, authenticated: true }).credentialStatus, 'Sem chave cadastrada');
  for (const [validationStatus, label] of [['untested','Ainda não testada'],['valid','Validada no provedor'],['invalid','Inválida'],['error','Erro na última validação']]) {
    assert.match(generationUiState({ provider, authenticated: true, credential: { validationStatus } }).credentialStatus, new RegExp(label));
  }
  const platform = generationUiState({ provider: { generation: { generationSupported: true, credentialSources: ['platform','byok'] } }, credentialSource: 'platform', authenticated: true });
  assert.equal(platform.credentialSource, 'Chave da plataforma');
  assert.equal(platform.credentialStatus, 'Nenhuma chave pessoal necessária');
});

test('result metadata names the executor actually responsible for the returned prompt', () => {
  assert.deepEqual(generationResultLabels({ source: 'local' }), { generatedBy: 'Compilador local', sourceText: 'Compilador local · sem chave ou chamada externa' });
  assert.deepEqual(generationResultLabels({ source: 'local-fallback', generationModel: 'gemini-x' }), { generatedBy: 'Compilador local (fallback)', sourceText: 'Falha do Google Gemini · fallback local seguro' });
  assert.deepEqual(generationResultLabels({ source: 'deepseek', credentialSource: 'byok', generationProvider: 'deepseek', generationModel: 'deepseek-flash' }), { generatedBy: 'deepseek-flash', sourceText: 'deepseek · sua chave · deepseek-flash' });
  assert.match(main, /resultTarget\.textContent = targetModel\.selectedOptions/);
  assert.match(main, /resultTaskType\.textContent = taskType\.selectedOptions/);
});

test('local deterministic execution works for every family and task without target credentials', async () => {
  const families = publicProfiles().filter(({ parentSlug }) => !parentSlug);
  for (const profile of families) for (const taskType of Object.keys(taskTypes)) {
    const response = responseHarness();
    await generate({ method: 'POST', headers: { 'x-forwarded-for': `local-${profile.slug}-${taskType}` }, body: { brief: 'Crie uma API de tarefas com validação e testes.', generationProvider: 'local', generationModel: 'local-deterministic', credentialSource: 'local', taskType, targetModel: profile.slug } }, response);
    assert.equal(response.statusCode, 200, `${profile.slug}/${taskType}`);
    assert.equal(response.body.source, 'local');
    assert.equal(response.body.targetModel, profile.slug);
    assert.match(response.body.prompt, new RegExp(`Prompt para ${profile.displayName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`));
  }
});

test('BYOK blocks before network and preserves visible work/state paths', () => {
  assert.match(main, /if \(!localGeneration\.checked && selectedCredentialSource === 'byok' && !credentialMetadata\.has/);
  assert.match(main, /if \(!session\.initialized \|\| !session\.user/);
  assert.match(main, /Configure sua chave primeiro em APIs e provedores/);
  assert.match(main, /showGenerationError[\s\S]*updateResultMetadata/);
  assert.doesNotMatch(main, /brief\.value\s*=\s*['"]/);
});

test('loading prevents duplicates, locks mutable selections and always recovers', () => {
  assert.match(main, /generationBusy = busy/);
  assert.match(main, /for \(const control of \[brief, generationModel, targetModel, taskType, localGeneration\]\) control\.disabled = busy/);
  assert.match(main, /generationProvider\.disabled = local \|\| generationBusy/);
  assert.match(main, /credentialSourceSelect\.disabled = local \|\| generationBusy/);
  assert.match(main, /finally \{[\s\S]*setGenerationBusy\(false\)/);
});

test('copy writes only rendered prompt and never internal metadata', () => {
  assert.match(main, /navigator\.clipboard\.writeText\(output\.textContent\)/);
  assert.doesNotMatch(main, /clipboard\.writeText\([^)]*(trace|provenance|credentialState)/);
  assert.match(main, /Copiado/);
  assert.match(main, /Selecione e copie/);
});

test('documented release rollback restores the normalized projection atomically', () => {
  assert.match(rollback, /begin;[\s\S]*delete from public\.methodology_rule_applicability[\s\S]*methodology_rules[\s\S]*methodology_examples[\s\S]*methodology_sources[\s\S]*version='2\.0\.0'[\s\S]*commit;/);
  assert.doesNotMatch(rollback, /user_api_credentials|auth\.users|vault|ai_models/i);
});
