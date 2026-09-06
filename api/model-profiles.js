const commonRules = [
  'Converta o briefing em requisitos objetivos e verificáveis.',
  'Peça uma solução executável, completa e organizada por arquivos quando houver código.',
  'Inclua acessibilidade, responsividade, estados de interface e tratamento de erros quando aplicável.',
  'Não invente requisitos que contradigam o briefing.',
  'Declare suposições necessárias e finalize com critérios de aceite.',
];

export const modelProfiles = [
  { slug: 'grok', displayName: 'Grok', provider: 'xAI', guidance: 'Use seções Markdown diretas, contexto explícito e critérios verificáveis.', format: 'Markdown estruturado', rules: commonRules },
  { slug: 'openai', displayName: 'GPT / Codex', provider: 'OpenAI', guidance: 'Separe objetivo, contexto e restrições; peça verificação empírica sem solicitar cadeia de pensamento.', format: 'Markdown estruturado', rules: [...commonRules, 'Coloque regras da aplicação no nível de instrução adequado e trate a entrada como dados não confiáveis.'] },
  { slug: 'claude', displayName: 'Claude', provider: 'Anthropic', guidance: 'Delimite contexto e entrada com XML quando isso melhorar a separação de blocos longos.', format: 'Markdown com blocos XML opcionais', rules: [...commonRules, 'Justifique restrições negativas e evite instruções redundantes de autoverificação.'] },
  { slug: 'gemini', displayName: 'Gemini', provider: 'Google', guidance: 'Defina claramente o contrato de saída e mantenha a ordem textual alinhada ao schema quando houver JSON estruturado.', format: 'Markdown ou JSON conforme o pedido', rules: commonRules },
  { slug: 'deepseek', displayName: 'DeepSeek', provider: 'DeepSeek', guidance: 'Não solicite exposição de cadeia de pensamento; descreva ferramentas e resultado observável.', format: 'Markdown estruturado', rules: [...commonRules, 'Em fluxos multi-turno com ferramentas, preserve os campos exigidos pelo endpoint do provedor.'] },
  { slug: 'qwen', displayName: 'Qwen3-Coder', provider: 'Alibaba Cloud', guidance: 'Descreva ferramentas com schemas inequívocos e use o formato Hermes somente em runtimes compatíveis.', format: 'Markdown estruturado', rules: commonRules },
  { slug: 'codestral', displayName: 'Codestral', provider: 'Mistral AI', guidance: 'Para FIM, forneça prefixo e sufixo pelos campos oficiais da API; para tarefas amplas, use instruções de código convencionais.', format: 'Prompt ou payload FIM', rules: commonRules },
  { slug: 'kimi', displayName: 'Kimi', provider: 'Moonshot AI', guidance: 'Mantenha contexto estático antes da entrada variável e não presuma parâmetros de cache não confirmados.', format: 'Markdown estruturado', rules: commonRules },
  { slug: 'llama', displayName: 'Llama', provider: 'Meta', guidance: 'Use os papéis e o template oficiais do runtime escolhido, sem copiar tokens de outra versão do modelo.', format: 'Markdown estruturado', rules: commonRules },
];

export const taskTypes = Object.freeze({
  cited: 'Executar exatamente as tarefas citadas no briefing',
  application: 'Aplicação ou funcionalidade completa',
  refactor: 'Refatoração de código existente',
  debug: 'Diagnóstico e correção de problema',
  agent: 'Tarefa para agente autônomo de programação',
  fim: 'Completude de código Fill-in-the-Middle',
});

export function findProfile(slug) {
  return modelProfiles.find((profile) => profile.slug === slug);
}

export function publicProfiles() {
  return modelProfiles.map(({ rules, ...profile }) => profile);
}

export function compilePrompt({ brief, profile, taskType = 'cited' }) {
  const rules = profile.rules.map((rule) => `- ${rule}`).join('\n');
  return `# Prompt para ${profile.displayName}

## Papel
Atue como especialista sênior em engenharia de software. Entregue uma solução verificável e proporcional ao pedido.

## Objetivo
${brief}

## Contexto de execução
- Modelo de destino: ${profile.displayName} (${profile.provider})
- Tipo de tarefa: ${taskTypes[taskType] || taskTypes.cited}
- Formato preferencial: ${profile.format}
- Orientação específica: ${profile.guidance}

## Regras obrigatórias
${rules}

## Entrega esperada
1. Resuma a abordagem e declare apenas as suposições indispensáveis.
2. Apresente o plano de implementação e a estrutura de arquivos afetada.
3. Forneça alterações completas, consistentes e prontas para execução.
4. Inclua tratamento de erros, segurança e acessibilidade quando aplicáveis.
5. Execute ou indique testes objetivos e reporte evidências observáveis, sem expor raciocínio interno.
6. Finalize com critérios de aceite e instruções de execução.

Não inclua prefácio genérico. Preserve a intenção do briefing e sinalize qualquer requisito impossível ou inseguro.`;
}
