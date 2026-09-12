import { compilePrompt, modelProfiles, taskTypes } from '../api/model-profiles.js';

const fixtures = [
  { id: 'accessible-form', brief: 'Crie um formulário de cadastro acessível com validação, estados de erro e testes.', taskType: 'cited' },
  { id: 'secure-api', brief: 'Implemente uma API REST com autenticação, limites de requisição e testes de autorização.', taskType: 'application' },
  { id: 'bug-fix', brief: 'Corrija o envio duplicado de pedidos sem alterar o contrato público e adicione um teste de regressão.', taskType: 'bug_fix' },
  { id: 'refactor-full', brief: 'Refatore a aplicação inteira mantendo compatibilidade e cobertura de testes.', taskType: 'refactor_full' },
  { id: 'refactor-module', brief: 'Separe o módulo de pagamentos em camadas mantendo compatibilidade e cobertura de testes.', taskType: 'refactor_module' },
  { id: 'agent', brief: 'Inspecione o repositório, implemente a tarefa descrita e reporte os comandos de validação executados.', taskType: 'agent' },
  { id: 'debug', brief: 'Diagnostique a falha intermitente e identifique a causa antes de propor a correção.', taskType: 'debug' },
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

const methodologyBrief = 'Corrija uma condição de corrida, preserve o contrato público e comprove a correção com testes.';
const methodologyInvariants = {
  grok: /resultados e erros de ferramentas/,
  openai: /entrada não confiável/,
  claude: /tags XML/,
  gemini: /dados de referência antes/,
  deepseek: /reasoning_content/,
  qwen: /runtime Qwen selecionado/,
  codestral: /não invente prefixo ou sufixo/,
  kimi: /contexto de referência e solicitação variável/,
  llama: /runtime aplicar o formato oficial/,
};
const methodologyResults = modelProfiles.map((profile) => {
  const prompt = compilePrompt({ brief: methodologyBrief, profile, taskType: 'debug', includeExample: false });
  return {
    profile: profile.slug,
    passed: prompt.includes(methodologyBrief) && methodologyInvariants[profile.familySlug].test(prompt),
  };
});

const passed = results.filter((result) => result.passed).length;
const methodologyPassed = methodologyResults.filter(({ passed: resultPassed }) => resultPassed).length;
const report = {
  generatedAt: new Date().toISOString(),
  cases: results.length,
  passed,
  failed: results.length - passed,
  methodologyCases: methodologyResults.length,
  methodologyPassed,
  methodologyFailed: methodologyResults.length - methodologyPassed,
  results,
  methodologyResults,
};
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (report.failed || report.methodologyFailed) process.exitCode = 1;
