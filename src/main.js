import './style.css';
import { compilePrompt, findProfile, publicProfiles } from '../api/model-profiles.js';

const brief = document.querySelector('#brief');
const model = document.querySelector('#model');
const taskType = document.querySelector('#task-type');
const complexity = document.querySelector('#complexity');
const modelDescription = document.querySelector('#model-description');
const generate = document.querySelector('#generate');
const result = document.querySelector('#result');
const output = document.querySelector('#output');
const copy = document.querySelector('#copy');
const source = document.querySelector('#source');
let profiles = publicProfiles();

function updateProfileDescription() {
  const profile = profiles.find((item) => item.slug === model.value);
  modelDescription.textContent = profile ? `${profile.provider} · ${profile.guidance}` : 'Perfil especializado selecionado.';
}

async function loadProfiles() {
  const renderProfiles = () => {
    model.replaceChildren(...profiles.map((profile) => {
      const option = document.createElement('option');
      option.value = profile.slug;
      option.textContent = profile.displayName;
      return option;
    }));
    updateProfileDescription();
  };

  renderProfiles();
  try {
    const response = await fetch('/api/profiles');
    if (!response.ok) throw new Error();
    ({ profiles } = await response.json());
    renderProfiles();
  } catch {
    modelDescription.textContent = `${profiles.find((item) => item.slug === model.value)?.provider || 'Local'} · compilador local disponível`;
  }
}

model.addEventListener('change', updateProfileDescription);
loadProfiles();

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
      body: JSON.stringify({ brief: request, model: model.value, taskType: taskType.value, complexity: complexity.value }),
    });
    const payload = await response.json().catch(() => ({}));

    if (response.status === 404) {
      const profile = findProfile(model.value);
      output.textContent = compilePrompt({ brief: request, profile, taskType: taskType.value, complexity: complexity.value });
      source.textContent = 'Compilador local · sem chave necessária';
    } else if (!response.ok) {
      throw new Error(payload.error || 'Não foi possível gerar o prompt.');
    } else {
      output.textContent = payload.prompt;
      source.textContent = payload.source === 'gemini' ? 'Aprimorado por Gemini' : payload.source === 'local-fallback' ? 'Compilador local · fallback seguro' : 'Compilador local · sem chave necessária';
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
  try {
    await navigator.clipboard.writeText(output.textContent);
    copy.textContent = 'Copiado';
    window.setTimeout(() => { copy.textContent = 'Copiar'; }, 1800);
  } catch {
    copy.textContent = 'Selecione e copie';
    window.getSelection()?.selectAllChildren(output);
  }
});
