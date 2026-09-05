import './style.css';

const brief = document.querySelector('#brief');
const model = document.querySelector('#model');
const generate = document.querySelector('#generate');
const result = document.querySelector('#result');
const output = document.querySelector('#output');
const copy = document.querySelector('#copy');

function createLocalPrompt(request, targetModel) {
  return `Atue como um desenvolvedor front-end sênior. Crie uma solução completa para o pedido abaixo.\n\nPEDIDO DO USUÁRIO\n${request}\n\nCONTEXTO DE IMPLEMENTAÇÃO\n- Modelo de destino: ${targetModel}\n- Use React com componentes pequenos e bem nomeados.\n- Entregue código executável, responsivo e acessível.\n- Evite dependências desnecessárias.\n- Preserve uma hierarquia visual clara e estados de foco visíveis.\n\nFORMATO DA RESPOSTA\n1. Resuma a proposta em até 3 linhas.\n2. Mostre a estrutura de arquivos necessária.\n3. Entregue o código completo de cada arquivo, em blocos separados.\n4. Explique como executar localmente.\n5. Inclua uma pequena lista de critérios para validar se o resultado atende ao pedido.\n\nNão invente requisitos que contradigam o pedido. Se faltar uma informação realmente essencial, declare a melhor suposição antes do código.`;
}

generate.addEventListener('click', async () => {
  const request = brief.value.trim();

  if (!request) {
    brief.focus();
    brief.setAttribute('aria-invalid', 'true');
    brief.placeholder = 'Conte o que você quer criar antes de gerar o prompt.';
    return;
  }

  brief.removeAttribute('aria-invalid');
  generate.disabled = true;
  generate.textContent = 'Gerando…';

  try {
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brief: request, model: model.value }),
    });
    const payload = await response.json().catch(() => ({}));

    if (response.ok) {
      output.textContent = payload.prompt;
    } else if (payload.code === 'GEMINI_NOT_CONFIGURED' || response.status === 404) {
      output.textContent = createLocalPrompt(request, model.value);
    } else {
      throw new Error(payload.error || 'Não foi possível gerar o prompt.');
    }

    result.classList.remove('is-empty');
    copy.disabled = false;
    copy.textContent = 'Copiar';
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (error) {
    output.textContent = error.message;
    result.classList.remove('is-empty');
    copy.disabled = true;
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } finally {
    generate.disabled = false;
    generate.innerHTML = 'Gerar prompt <span aria-hidden="true">↗</span>';
  }
});

copy.addEventListener('click', async () => {
  await navigator.clipboard.writeText(output.textContent);
  copy.textContent = 'Copiado';
  window.setTimeout(() => { copy.textContent = 'Copiar'; }, 1800);
});
