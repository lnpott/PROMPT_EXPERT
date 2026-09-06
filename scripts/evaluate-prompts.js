import { compilePrompt, modelProfiles, taskTypes } from '../api/model-profiles.js';

const fixtures = [
  { id: 'accessible-form', brief: 'Crie um formulário de cadastro acessível com validação, estados de erro e testes.', taskType: 'cited' },
  { id: 'secure-api', brief: 'Implemente uma API REST com autenticação, limites de requisição e testes de autorização.', taskType: 'application' },
  { id: 'bug-fix', brief: 'Corrija o envio duplicado de pedidos sem alterar o contrato público e adicione um teste de regressão.', taskType: 'debug' },
  { id: 'refactor', brief: 'Separe o módulo de pagamentos em camadas mantendo compatibilidade e cobertura de testes.', taskType: 'refactor' },
  { id: 'agent', brief: 'Inspecione o repositório, implemente a tarefa descrita e reporte os comandos de validação executados.', taskType: 'agent' },
  { id: 'fim', brief: 'Complete o trecho entre o prefixo e o sufixo preservando tipos e estilo existentes.', taskType: 'fim' },
];

const checks = [
  ['brief-preserved', (prompt, fixture) => prompt.includes(fixture.brief)],
  ['task-declared', (prompt, fixture) => prompt.includes(taskTypes[fixture.taskType])],
  ['acceptance-criteria', (prompt) => /critérios de aceite/i.test(prompt)],
  ['testing', (prompt) => /testes/i.test(prompt)],
  ['security', (prompt) => /segurança/i.test(prompt)],
  ['no-complexity', (prompt) => !/complexidade/i.test(prompt)],
  ['no-chain-of-thought-request', (prompt) => !/pense passo a passo|mostre (sua|o) (lógica|raciocínio)/i.test(prompt)],
];

const results = modelProfiles.flatMap((profile) => fixtures.map((fixture) => {
  const prompt = compilePrompt({ ...fixture, profile });
  const failed = checks.filter(([, check]) => !check(prompt, fixture)).map(([name]) => name);
  return { profile: profile.slug, fixture: fixture.id, passed: failed.length === 0, failed };
}));

const passed = results.filter((result) => result.passed).length;
const report = { generatedAt: new Date().toISOString(), cases: results.length, passed, failed: results.length - passed, results };
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (report.failed) process.exitCode = 1;
