import './style.css';

const brief = document.querySelector('#brief');
const model = document.querySelector('#model');
const generate = document.querySelector('#generate');
const result = document.querySelector('#result');
const output = document.querySelector('#output');
const copy = document.querySelector('#copy');

function createPrompt(request, targetModel) {
  return `Atue como um desenvolvedor front-end sênior. Crie uma solução completa para o pedido abaixo.\n\nPEDIDO DO USUÁRIO\n${request}\n\nCONTEXTO DE IMPLEMENTAÇÃO\n- Modelo de destino: ${targetModel}\n- Use React com componentes pequenos e bem nomeados.\n- Entregue código executável, responsivo e acessível.\n- Evite dependências desnecessárias.\n- Preserve uma hierarquia visual clara e estados de foco visíveis.\n\nFORMATO DA RESPOSTA\n1. Resuma a proposta em até 3 linhas.\n2. Mostre a estrutura de arquivos necessária.\n3. Entregue o código completo de cada arquivo, em blocos separados.\n4. Explique como executar localmente.\n5. Inclua uma pequena lista de critérios para validar se o resultado atende ao pedido.\n\nNão invente requisitos que contradigam o pedido. Se faltar uma informação realmente essencial, declare a melhor suposição antes do código.`;
}

generate.addEventListener('click', () => {
  const request = brief.value.trim();

  if (!request) {
    brief.focus();
    brief.setAttribute('aria-invalid', 'true');
    brief.placeholder = 'Conte o que você quer criar antes de gerar o prompt.';
    return;
  }

  brief.removeAttribute('aria-invalid');
  output.textContent = createPrompt(request, model.value);
  result.classList.remove('is-empty');
  copy.disabled = false;
  copy.textContent = 'Copiar';
  result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
});

copy.addEventListener('click', async () => {
  await navigator.clipboard.writeText(output.textContent);
  copy.textContent = 'Copiado';
  window.setTimeout(() => { copy.textContent = 'Copiar'; }, 1800);
});
