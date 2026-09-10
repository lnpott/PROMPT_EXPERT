import './style.css';
import { publicProfiles } from '../api/model-profiles.js';
import { createAuthController } from './auth/session.js';
import { initializeAuthUI } from './auth/ui.js';
import { initializeCredentialManager } from './byok/credentials.js';
import { createSupabaseBrowserClient } from './lib/supabase.js';
import { executableProviders, generationModelsForProvider, generationUiState, LOCAL_GENERATION_OPTION, providerBySlug } from './generation/provider-options.js';

const brief = document.querySelector('#brief');
const targetModel = document.querySelector('#target-model');
const taskType = document.querySelector('#task-type');
const generationModel = document.querySelector('#generation-model');
const generationModelDescription = document.querySelector('#generation-model-description');
const generationProvider = document.querySelector('#generation-provider');
const localGeneration = document.querySelector('#local-generation');
const targetModelDescription = document.querySelector('#target-model-description');
const credentialState = document.querySelector('#credential-state');
const executionStatus = document.querySelector('#execution-status');
const credentialSource = document.querySelector('#credential-source');
const credentialCta = document.querySelector('#credential-cta');
const generate = document.querySelector('#generate');
const result = document.querySelector('#result');
const output = document.querySelector('#output');
const copy = document.querySelector('#copy');
const source = document.querySelector('#source');
let profiles = publicProfiles();
let generationProviders = [];
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
    localGeneration.checked = false;
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
  if (localGeneration.checked) {
    generationModelDescription.textContent = 'Estratégia técnica local, sem provider de IA ou chamada externa.';
    return;
  }
  const model = providerBySlug(generationProviders, generationProvider.value)?.models?.find((item) => item.model_id === generationModel.value);
  generationModelDescription.textContent = model?.description || 'Modelo cadastrado para este provider.';
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

targetModel.addEventListener('change', updateTargetDescription);
generationModel.addEventListener('change', updateGenerationDescription);
function updateGenerationModels() {
  const provider = providerBySlug(generationProviders, generationProvider.value);
  const local = localGeneration.checked;
  const models = local ? [{ modelId: LOCAL_GENERATION_OPTION.model, displayName: 'Compilador determinístico local' }] : generationModelsForProvider(generationProviders, generationProvider.value);
  generationModel.replaceChildren(...models.map((item) => {
    const option = document.createElement('option');
    option.value = item.modelId;
    option.textContent = item.displayName;
    return option;
  }));
  const credential = credentialMetadata.get(generationProvider.value);
  const state = local ? { executable: true, availability: 'Disponível', credentialSource: 'Nenhuma', credentialStatus: 'Execução local' } : generationUiState({ provider, credential });
  generate.disabled = generationBusy || models.length === 0 || !state.executable;
  executionStatus.textContent = state.availability;
  credentialSource.textContent = state.credentialSource;
  credentialState.textContent = state.credentialStatus;
  credentialCta.hidden = local || state.credentialSource !== 'Sua chave' || Boolean(credential);
  generationProvider.disabled = local || generationBusy;
  updateGenerationDescription();
}
generationProvider.addEventListener('change', updateGenerationModels);
localGeneration.addEventListener('change', updateGenerationModels);
fetch('/api/providers').then((response) => response.ok ? response.json() : null).then((payload) => {
  generationProviders = executableProviders(payload?.providers || []);
  generationProvider.replaceChildren(...generationProviders.map((provider) => {
    const option = document.createElement('option');
    option.value = provider.slug;
    option.textContent = `${provider.display_name}${provider.generation?.generationSupported ? '' : ' · Em breve'}`;
    return option;
  }));
  if (generationProviders.some((provider) => provider.slug === 'google-gemini')) generationProvider.value = 'google-gemini';
  updateGenerationModels();
}).catch(() => {});
loadProfiles();

function setGenerationBusy(busy) {
  generationBusy = busy;
  for (const control of [brief, generationModel, targetModel, taskType, localGeneration]) control.disabled = busy;
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

  const provider = providerBySlug(generationProviders, generationProvider.value);
  const selectedCredentialSource = localGeneration.checked ? LOCAL_GENERATION_OPTION.credentialSource : provider?.generation?.credentialSources?.[0];
  if (!localGeneration.checked && selectedCredentialSource === 'byok' && !credentialMetadata.has(generationProvider.value)) {
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
    const selectedProvider = localGeneration.checked ? LOCAL_GENERATION_OPTION.provider : generationProvider.value;
    const accessToken = selectedCredentialSource === 'byok' ? authController.getAccessToken() : null;
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) },
      body: JSON.stringify({ brief: request, generationProvider: selectedProvider, generationModel: generationModel.value, credentialSource: selectedCredentialSource, taskType: taskType.value, targetModel: targetModel.value }),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload.error || 'Não foi possível gerar o prompt.');
    } else {
      output.textContent = payload.prompt;
      source.textContent = payload.credentialSource === 'byok' ? `${payload.generationProvider} · sua chave · ${payload.generationModel}` : payload.source === 'gemini' ? `Google Gemini · chave da plataforma · ${payload.generationModel}` : payload.source === 'local-fallback' ? 'Google Gemini · fallback local seguro' : 'Estratégia local · sem chave necessária';
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
