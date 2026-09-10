import './style.css';
import { compilePrompt, findProfile, publicProfiles } from '../api/model-profiles.js';
import { publicCompilerModels } from '../api/compiler-models.js';
import { createAuthController } from './auth/session.js';
import { initializeAuthUI } from './auth/ui.js';
import { initializeCredentialManager } from './byok/credentials.js';
import { createSupabaseBrowserClient } from './lib/supabase.js';
import { BYOK_GENERATION_PROVIDERS, catalogSlugFor, generationModelsForProvider } from './generation/provider-options.js';

const brief = document.querySelector('#brief');
const targetModel = document.querySelector('#target-model');
const taskType = document.querySelector('#task-type');
const generationModel = document.querySelector('#generation-model');
const generationModelDescription = document.querySelector('#generation-model-description');
const generationProvider = document.querySelector('#generation-provider');
const targetModelDescription = document.querySelector('#target-model-description');
const providerGuidance = document.querySelector('#provider-guidance');
const credentialState = document.querySelector('#credential-state');
const credentialCta = document.querySelector('#credential-cta');
const generate = document.querySelector('#generate');
const result = document.querySelector('#result');
const output = document.querySelector('#output');
const copy = document.querySelector('#copy');
const source = document.querySelector('#source');
let profiles = publicProfiles();
let compilers = publicCompilerModels();
let byokProviders = [];
let credentialMetadata = new Map();
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
    credentialMetadata = new Map(credentials.map((credential) => [credential.providerSlug, credential]));
    updateGenerationModels();
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
    generationModel.replaceChildren();
    credentialMetadata = new Map();
    brief.value = '';
    output.textContent = 'Seu prompt aparecerá aqui.';
    source.textContent = '';
    copy.disabled = true;
    result.classList.add('is-empty');
    updateGenerationModels();
  }
}

authController.subscribe(renderRoute);
window.addEventListener('hashchange', () => renderRoute(authController.getSnapshot()));

function updateTargetDescription() {
  const profile = profiles.find((item) => item.slug === targetModel.value);
  targetModelDescription.textContent = profile ? `${profile.provider} · ${profile.guidance}` : 'Perfil especializado selecionado.';
}

function updateGenerationDescription() {
  const compiler = compilers.find((item) => item.slug === generationModel.value);
  const byokModel = byokProviders.flatMap((provider) => provider.models || []).find((item) => item.model_id === generationModel.value);
  generationModelDescription.textContent = compiler
    ? `Plataforma · ${compiler.tier} · ${compiler.recommendation}`
    : byokModel?.description || (generationProvider.value === 'local' ? 'Execução determinística, sem chamada a provider.' : 'Modelo executável selecionado para esta geração.');
}

async function loadProfiles() {
  const renderProfiles = () => {
    const groups = new Map();
    for (const profile of profiles) {
      if (!groups.has(profile.provider)) groups.set(profile.provider, []);
      groups.get(profile.provider).push(profile);
    }
    targetModel.replaceChildren(...[...groups].map(([provider, entries]) => {
      const group = document.createElement('optgroup');
      group.label = provider;
      group.append(...entries.map((profile) => {
        const option = document.createElement('option');
        option.value = profile.slug;
        option.textContent = profile.displayName;
        return option;
      }));
      return group;
    }));
    updateTargetDescription();
  };

  renderProfiles();
  try {
    const response = await fetch('/api/profiles');
    if (!response.ok) throw new Error();
    ({ profiles } = await response.json());
    renderProfiles();
  } catch {
    targetModelDescription.textContent = `${profiles.find((item) => item.slug === targetModel.value)?.provider || 'Local'} · compilador local disponível`;
  }
}

async function loadCompilers() {
  updateGenerationModels();
  try {
    const response = await fetch('/api/compilers');
    if (!response.ok) throw new Error();
    ({ compilers } = await response.json());
    updateGenerationModels();
  } catch {
    generationModelDescription.textContent = 'Catálogo local · a geração continua disponível por fallback';
  }
}

targetModel.addEventListener('change', updateTargetDescription);
generationModel.addEventListener('change', updateGenerationDescription);
function updateGenerationModels() {
  const models = generationModelsForProvider({ providers: byokProviders, compilers }, generationProvider.value);
  generationModel.replaceChildren(...models.map((item) => {
    const option = document.createElement('option');
    option.value = item.modelId;
    option.textContent = `${item.displayName}${item.isDefault ? ' · padrão' : ''}`;
    return option;
  }));
  const byok = BYOK_GENERATION_PROVIDERS.includes(generationProvider.value);
  generate.disabled = generationBusy || models.length === 0 || (byok && !credentialMetadata.has(catalogSlugFor(generationProvider.value)));
  const credentialSlug = catalogSlugFor(generationProvider.value);
  const credential = credentialMetadata.get(credentialSlug);
  const configured = Boolean(credential);
  providerGuidance.hidden = !byok;
  credentialState.textContent = configured ? `Use your own key. Status: ${credential.validationStatus || 'untested'}.` : 'Configure your key first.';
  credentialCta.hidden = configured;
  updateGenerationDescription();
}
generationProvider.addEventListener('change', updateGenerationModels);
fetch('/api/providers').then((response) => response.ok ? response.json() : null).then((payload) => {
  byokProviders = payload?.providers || [];
  updateGenerationModels();
}).catch(() => {});
loadProfiles();
loadCompilers();

function setGenerationBusy(busy) {
  generationBusy = busy;
  for (const control of [brief, generationProvider, generationModel, targetModel, taskType]) control.disabled = busy;
  updateGenerationModels();
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
  if (BYOK_GENERATION_PROVIDERS.includes(generationProvider.value) && !credentialMetadata.has(credentialSlug)) {
    output.textContent = `Configure sua API em APIs e provedores para usar ${generationProvider.selectedOptions[0]?.textContent || 'este provider'}.`;
    source.textContent = 'Credencial BYOK não configurada';
    result.hidden = false;
    result.classList.remove('is-empty');
    copy.disabled = true;
    return;
  }
  if (!generationModel.value) {
    output.textContent = 'Nenhum modelo de geração válido está disponível para este provedor.';
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
      body: JSON.stringify({ brief: request, generationProvider: generationProvider.value, generationModel: generationModel.value, taskType: taskType.value, targetModel: targetModel.value }),
    });
    const payload = await response.json().catch(() => ({}));

    if (response.status === 404 && generationProvider.value === 'platform') {
      const profile = findProfile(targetModel.value);
      output.textContent = compilePrompt({ brief: request, profile, taskType: taskType.value });
      source.textContent = 'Compilador local · sem chave necessária';
    } else if (!response.ok) {
      throw new Error(payload.error || 'Não foi possível gerar o prompt.');
    } else {
      output.textContent = payload.prompt;
      source.textContent = ['openrouter', 'openai', 'xai', 'deepseek', 'groq', 'mistral'].includes(payload.source) ? `${payload.source} BYOK · ${payload.generationModel}` : payload.source === 'gemini' ? `Compilado por ${payload.generationModel || generationModel.value}` : payload.source === 'local-fallback' ? 'Compilador local · fallback seguro' : 'Compilador local · sem chave necessária';
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
