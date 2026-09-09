import './style.css';
import { compilePrompt, findProfile, publicProfiles } from '../api/model-profiles.js';
import { publicCompilerModels } from '../api/compiler-models.js';
import { createAuthController } from './auth/session.js';
import { initializeAuthUI } from './auth/ui.js';
import { initializeCredentialManager } from './byok/credentials.js';
import { createSupabaseBrowserClient } from './lib/supabase.js';

const brief = document.querySelector('#brief');
const model = document.querySelector('#model');
const taskType = document.querySelector('#task-type');
const compilerModel = document.querySelector('#compiler-model');
const compilerDescription = document.querySelector('#compiler-description');
const generationProvider = document.querySelector('#generation-provider');
const openRouterModel = document.querySelector('#openrouter-model');
const openRouterModelField = document.querySelector('#openrouter-model-field');
const modelDescription = document.querySelector('#model-description');
const generate = document.querySelector('#generate');
const result = document.querySelector('#result');
const output = document.querySelector('#output');
const copy = document.querySelector('#copy');
const source = document.querySelector('#source');
let profiles = publicProfiles();
let compilers = publicCompilerModels();

const authController = createAuthController(createSupabaseBrowserClient());

initializeAuthUI(authController, {
  accountStatus: document.querySelector('#account-status'),
  signedOut: document.querySelector('#signed-out'),
  signedIn: document.querySelector('#signed-in'),
  userEmail: document.querySelector('#user-email'),
  providersLocked: document.querySelector('#providers-locked'),
  providersPlaceholder: document.querySelector('#providers-placeholder'),
  feedback: document.querySelector('#auth-feedback'),
  authForm: document.querySelector('#auth-form'),
  email: document.querySelector('#auth-email'),
  password: document.querySelector('#auth-password'),
  signUp: document.querySelector('#sign-up'),
  signOut: document.querySelector('#sign-out'),
  recovery: document.querySelector('#recover-account'),
  recoveryPanel: document.querySelector('#recovery-panel'),
  recoveryForm: document.querySelector('#recovery-form'),
  newPassword: document.querySelector('#recovery-new-password'),
  confirmPassword: document.querySelector('#recovery-confirm-password'),
  completeRecovery: document.querySelector('#complete-recovery'),
  recoveryFeedback: document.querySelector('#recovery-feedback'),
  actionButtons: document.querySelectorAll('#auth-form button'),
});

initializeCredentialManager(authController, {
  feedback: document.querySelector('#credentials-feedback'),
  list: document.querySelector('#providers-list'),
});

function updateProfileDescription() {
  const profile = profiles.find((item) => item.slug === model.value);
  modelDescription.textContent = profile ? `${profile.provider} · ${profile.guidance}` : 'Perfil especializado selecionado.';
}

function updateCompilerDescription() {
  const compiler = compilers.find((item) => item.slug === compilerModel.value);
  compilerDescription.textContent = compiler ? `${compiler.tier} · ${compiler.recommendation}` : 'Motor de compilação selecionado.';
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

async function loadCompilers() {
  const renderCompilers = () => {
    compilerModel.replaceChildren(...compilers.map((compiler) => {
      const option = document.createElement('option');
      option.value = compiler.slug;
      option.textContent = `${compiler.displayName}${compiler.isDefault ? ' · padrão' : ''}`;
      return option;
    }));
    updateCompilerDescription();
  };
  renderCompilers();
  try {
    const response = await fetch('/api/compilers');
    if (!response.ok) throw new Error();
    ({ compilers } = await response.json());
    renderCompilers();
  } catch {
    compilerDescription.textContent = 'Catálogo local · a geração continua disponível por fallback';
  }
}

model.addEventListener('change', updateProfileDescription);
compilerModel.addEventListener('change', updateCompilerDescription);
generationProvider.addEventListener('change', () => {
  openRouterModelField.hidden = generationProvider.value !== 'openrouter';
});
loadProfiles();
loadCompilers();

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
    const accessToken = generationProvider.value === 'openrouter' ? authController.getAccessToken() : null;
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
      body: JSON.stringify({ brief: request, model: model.value, taskType: taskType.value, compilerModel: compilerModel.value, provider: generationProvider.value, ...(generationProvider.value === 'openrouter' ? { openRouterModel: openRouterModel.value } : {}) }),
    });
    const payload = await response.json().catch(() => ({}));

    if (response.status === 404) {
      const profile = findProfile(model.value);
      output.textContent = compilePrompt({ brief: request, profile, taskType: taskType.value });
      source.textContent = 'Compilador local · sem chave necessária';
    } else if (!response.ok) {
      throw new Error(payload.error || 'Não foi possível gerar o prompt.');
    } else {
      output.textContent = payload.prompt;
      source.textContent = payload.source === 'openrouter' ? `OpenRouter BYOK · ${payload.compilerModel}` : payload.source === 'gemini' ? `Compilado por ${payload.compilerModel || compilerModel.value}` : payload.source === 'local-fallback' ? 'Compilador local · fallback seguro' : 'Compilador local · sem chave necessária';
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
