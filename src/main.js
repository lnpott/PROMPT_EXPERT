import './style.css';
import { compilePrompt, findProfile, publicProfiles } from '../api/model-profiles.js';
import { publicCompilerModels } from '../api/compiler-models.js';
import { createAuthController } from './auth/session.js';
import { initializeAuthUI } from './auth/ui.js';
import { initializeCredentialManager } from './byok/credentials.js';
import { createSupabaseBrowserClient } from './lib/supabase.js';
import { BYOK_GENERATION_PROVIDERS, catalogSlugFor, controlsForProvider, modelsForProvider } from './generation/provider-options.js';

const brief = document.querySelector('#brief');
const model = document.querySelector('#model');
const taskType = document.querySelector('#task-type');
const compilerModel = document.querySelector('#compiler-model');
const compilerDescription = document.querySelector('#compiler-description');
const compilerModelField = document.querySelector('#compiler-model-field');
const generationProvider = document.querySelector('#generation-provider');
const providerModel = document.querySelector('#provider-model');
const providerModelField = document.querySelector('#provider-model-field');
const modelDescription = document.querySelector('#model-description');
const providerGuidance = document.querySelector('#provider-guidance');
const generate = document.querySelector('#generate');
const result = document.querySelector('#result');
const output = document.querySelector('#output');
const copy = document.querySelector('#copy');
const source = document.querySelector('#source');
let profiles = publicProfiles();
let compilers = publicCompilerModels();
let byokProviders = [];
let configuredCredentialSlugs = new Set();
let generationBusy = false;

const authController = createAuthController(createSupabaseBrowserClient());

initializeAuthUI(authController, {
  sessionLoading: document.querySelector('#session-loading'),
  accountPanel: document.querySelector('#account'),
  appContent: document.querySelector('#app-content'),
  accountNavigation: document.querySelector('#account-navigation'),
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
  onChange(credentials) {
    configuredCredentialSlugs = new Set(credentials.map((credential) => credential.providerSlug));
    updateProviderModels();
  },
});

const intro = document.querySelector('.intro');
const workspace = document.querySelector('.workspace');
const providersPanel = document.querySelector('#providers');

function currentRoute() {
  return ['#app', '#providers', '#account', '#account-recovery'].includes(window.location.hash) ? window.location.hash : '#login';
}

function renderRoute(state) {
  if (state.initialized === false) return;
  const recovery = Boolean(state.user && state.recoverySession);
  const authenticated = Boolean(state.user) && !recovery;
  let route = currentRoute();
  if (recovery) route = '#account-recovery';
  else if (!authenticated) route = '#login';
  else if (route === '#login' || route === '#account-recovery') route = '#app';
  if (window.location.hash !== route) history.replaceState(null, '', route);
  const generatorRoute = authenticated && route === '#app';
  const providersRoute = authenticated && route === '#providers';
  const accountRoute = authenticated && route === '#account';
  document.querySelector('#app-content').hidden = !(generatorRoute || providersRoute);
  document.querySelector('#account').hidden = !(route === '#login' || route === '#account-recovery' || accountRoute);
  intro.hidden = !generatorRoute;
  workspace.hidden = !generatorRoute;
  result.hidden = !generatorRoute;
  providersPanel.hidden = !providersRoute;
  if (!authenticated) {
    generationProvider.value = 'platform';
    providerModel.replaceChildren();
    configuredCredentialSlugs = new Set();
    brief.value = '';
    output.textContent = 'Seu prompt aparecerá aqui.';
    source.textContent = '';
    copy.disabled = true;
    result.classList.add('is-empty');
    updateProviderModels();
  }
}

authController.subscribe(renderRoute);
window.addEventListener('hashchange', () => renderRoute(authController.getSnapshot()));

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
function updateProviderModels() {
  const models = modelsForProvider(byokProviders, generationProvider.value);
  providerModel.replaceChildren(...models.map((item) => {
    const option = document.createElement('option');
    option.value = item.model_id;
    option.textContent = item.display_name;
    return option;
  }));
  const controls = controlsForProvider(generationProvider.value);
  const byok = controls.providerModel;
  providerModelField.hidden = !controls.providerModel;
  compilerModelField.hidden = !controls.platformModel;
  compilerDescription.hidden = !controls.platformModel;
  generate.disabled = generationBusy || (byok && models.length === 0);
  const credentialSlug = catalogSlugFor(generationProvider.value);
  providerGuidance.hidden = !byok || configuredCredentialSlugs.has(credentialSlug);
}
generationProvider.addEventListener('change', updateProviderModels);
fetch('/api/providers').then((response) => response.ok ? response.json() : null).then((payload) => {
  byokProviders = payload?.providers || [];
  updateProviderModels();
}).catch(() => {});
loadProfiles();
loadCompilers();

function setGenerationBusy(busy) {
  generationBusy = busy;
  for (const control of [brief, generationProvider, providerModel, model, compilerModel, taskType]) control.disabled = busy;
  updateProviderModels();
}

generate.addEventListener('click', async () => {
  const request = brief.value.trim();

  if (!request) {
    brief.focus();
    brief.setAttribute('aria-invalid', 'true');
    brief.placeholder = 'Conte o que você quer criar antes de gerar o prompt.';
    return;
  }

  const credentialSlug = catalogSlugFor(generationProvider.value);
  if (BYOK_GENERATION_PROVIDERS.includes(generationProvider.value) && !configuredCredentialSlugs.has(credentialSlug)) {
    output.textContent = `Configure sua API em APIs e provedores para usar ${generationProvider.selectedOptions[0]?.textContent || 'este provider'}.`;
    source.textContent = 'Credencial BYOK não configurada';
    result.hidden = false;
    result.classList.remove('is-empty');
    copy.disabled = true;
    return;
  }
  if (!providerModelField.hidden && !providerModel.value) {
    output.textContent = 'Nenhum modelo válido está disponível para este provider.';
    result.hidden = false;
    result.classList.remove('is-empty');
    copy.disabled = true;
    return;
  }

  brief.removeAttribute('aria-invalid');
  setGenerationBusy(true);
  generate.textContent = 'Gerando…';

  try {
    const accessToken = BYOK_GENERATION_PROVIDERS.includes(generationProvider.value) ? authController.getAccessToken() : null;
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
      body: JSON.stringify({ brief: request, model: model.value, taskType: taskType.value, compilerModel: compilerModel.value, provider: generationProvider.value, ...(generationProvider.value === 'openrouter' ? { openRouterModel: providerModel.value } : {}), ...(BYOK_GENERATION_PROVIDERS.filter((slug) => slug !== 'openrouter').includes(generationProvider.value) ? { providerModel: providerModel.value } : {}) }),
    });
    const payload = await response.json().catch(() => ({}));

    if (response.status === 404 && generationProvider.value === 'platform') {
      const profile = findProfile(model.value);
      output.textContent = compilePrompt({ brief: request, profile, taskType: taskType.value });
      source.textContent = 'Compilador local · sem chave necessária';
    } else if (!response.ok) {
      throw new Error(payload.error || 'Não foi possível gerar o prompt.');
    } else {
      output.textContent = payload.prompt;
      source.textContent = ['openrouter', 'openai', 'xai', 'deepseek', 'groq', 'mistral'].includes(payload.source) ? `${payload.source} BYOK · ${payload.model || payload.compilerModel}` : payload.source === 'gemini' ? `Compilado por ${payload.compilerModel || compilerModel.value}` : payload.source === 'local-fallback' ? 'Compilador local · fallback seguro' : 'Compilador local · sem chave necessária';
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
    setGenerationBusy(false);
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
