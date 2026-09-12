import './style.css';
import { fimAvailableForTarget, publicProfiles } from '../api/model-profiles.js';
import { createAuthController } from './auth/session.js';
import { initializeAuthUI } from './auth/ui.js';
import { initializeCredentialManager } from './byok/credentials.js';
import { createSupabaseBrowserClient } from './lib/supabase.js';
import { executableProviders, generationModelSelection, generationModelsForProvider, generationResultLabels, generationUiState, LOCAL_GENERATION_OPTION, providerBySlug } from './generation/provider-options.js';

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
const credentialSourceSelect = document.querySelector('#credential-source-select');
const credentialCta = document.querySelector('#credential-cta');
const generate = document.querySelector('#generate');
const result = document.querySelector('#result');
const output = document.querySelector('#output');
const copy = document.querySelector('#copy');
const source = document.querySelector('#source');
const resultGeneratedBy = document.querySelector('#result-generated-by');
const resultTarget = document.querySelector('#result-target');
const resultTaskType = document.querySelector('#result-task-type');
const intro = document.querySelector('.intro');
const workspace = document.querySelector('.workspace');
const providersPanel = document.querySelector('#providers');
let profiles = publicProfiles();
let generationProviders = [];
let credentialMetadata = new Map();
let generationBusy = false;
let renderedGenerationProvider = null;
let activeGeneration = null;
let resolvedSessionSeen = false;
let previousAuthenticated = false;

const authController = createAuthController(createSupabaseBrowserClient());

initializeAuthUI(authController, {
  sessionLoading: document.querySelector('#session-loading'),
  topbar: document.querySelector('#topbar'),
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
  changePassword: document.querySelector('#change-password'),
  changePasswordConfirm: document.querySelector('#change-password-confirm'),
  changePasswordSubmit: document.querySelector('#change-password-submit'),
  changePasswordFeedback: document.querySelector('#change-password-feedback'),
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

function currentRoute() {
  if (window.location.hash === '#login') return '#account';
  return ['#app', '#providers', '#account', '#account-recovery'].includes(window.location.hash) ? window.location.hash : '#app';
}

function renderRoute(state) {
  if (state.initialized === false) return;
  const recovery = Boolean(state.user && state.recoverySession);
  const authenticated = Boolean(state.user) && !recovery;
  let route = currentRoute();
  if (recovery) route = '#account-recovery';
  else if (!authenticated) route = '#account';
  else if (resolvedSessionSeen && !previousAuthenticated && route === '#account') route = '#app';
  else if (route === '#account-recovery') route = '#account';
  resolvedSessionSeen = true;
  previousAuthenticated = authenticated;
  if (window.location.hash !== route) history.replaceState(null, '', route);
  const generatorRoute = route === '#app';
  const providersRoute = route === '#providers';
  const accountRoute = route === '#account';
  document.querySelector('#app-content').hidden = !authenticated || !(generatorRoute || providersRoute);
  document.querySelector('#account').hidden = !(route === '#account-recovery' || accountRoute);
  intro.hidden = !generatorRoute;
  workspace.hidden = !generatorRoute;
  result.hidden = !generatorRoute;
  providersPanel.hidden = !providersRoute;
  if (!authenticated) {
    activeGeneration?.abort();
    credentialMetadata = new Map();
    output.textContent = 'Seu prompt aparecerá aqui.';
    result.classList.add('is-empty');
    copy.disabled = true;
  }
  updateGenerationModels();
}

authController.subscribe(renderRoute);
window.addEventListener('hashchange', () => renderRoute(authController.getSnapshot()));

function updateTargetDescription() {
  const profile = profiles.find((item) => item.slug === targetModel.value);
  targetModelDescription.textContent = profile ? `${profile.provider} · ${profile.guidance}` : 'Perfil especializado selecionado.';
  const fimOption = taskType.querySelector('option[value="fim"]');
  const available = fimAvailableForTarget(targetModel.value);
  fimOption.hidden = !available;
  fimOption.disabled = !available;
  if (!available && taskType.value === 'fim') taskType.value = 'cited';
}

function updateGenerationDescription() {
  if (localGeneration.checked) {
    generationModelDescription.textContent = 'Compilador local · regras metodológicas 2.1.0 · nenhuma IA será chamada.';
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
    const previousTarget = targetModel.value;
    targetModel.replaceChildren(...[...groups].map(([provider, entries]) => {
      const group = document.createElement('optgroup');
      group.label = provider;
      group.append(...entries.map((profile) => {
        const option = document.createElement('option');
        option.value = profile.slug;
        option.textContent = profile.parentSlug ? profile.displayName : `${profile.displayName} · Família`;
        return option;
      }));
      return group;
    }));
    if (profiles.some((profile) => profile.slug === previousTarget)) targetModel.value = previousTarget;
    updateTargetDescription();
  };

  renderProfiles();
  try {
    const response = await fetch('/api/profiles');
    if (!response.ok) throw new Error();
    ({ profiles } = await response.json());
    renderProfiles();
  } catch {
    targetModelDescription.textContent = `${profiles.find((item) => item.slug === targetModel.value)?.provider || 'Metodologia local'} · o alvo não será chamado nem exige chave`;
  }
}

targetModel.addEventListener('change', updateTargetDescription);
generationModel.addEventListener('change', updateGenerationDescription);
function updateGenerationModels() {
  const provider = providerBySlug(generationProviders, generationProvider.value);
  const local = localGeneration.checked;
  workspace.dataset.generationMode = local ? 'local' : 'external';
  const models = local ? [{ modelId: LOCAL_GENERATION_OPTION.model, displayName: 'Compilador determinístico local' }] : generationModelsForProvider(generationProviders, generationProvider.value);
  const previousModel = generationModel.value;
  const selectionProvider = local ? LOCAL_GENERATION_OPTION.provider : generationProvider.value;
  const providerChanged = renderedGenerationProvider !== selectionProvider;
  generationModel.replaceChildren(...models.map((item) => {
    const option = document.createElement('option');
    option.value = item.modelId;
    option.textContent = item.displayName;
    return option;
  }));
  generationModel.value = generationModelSelection(models, previousModel, providerChanged);
  renderedGenerationProvider = selectionProvider;
  const credential = credentialMetadata.get(generationProvider.value);
  const sources = local ? ['local'] : provider?.generation?.credentialSources || [];
  const previousSource = credentialSourceSelect.value;
  credentialSourceSelect.replaceChildren(...sources.map((source) => { const option=document.createElement('option'); option.value=source; option.textContent=source==='platform'?'Chave da plataforma':source==='byok'?'Sua chave':'Nenhuma'; return option; }));
  if (sources.includes(previousSource)) credentialSourceSelect.value = previousSource;
  const authenticated = Boolean(authController.getSnapshot().user);
  const state = local ? { executable: true, availability: 'Disponível na sua conta', credentialSource: 'Nenhuma', credentialStatus: 'Nenhuma chave necessária' } : generationUiState({ provider, credential, credentialSource: credentialSourceSelect.value, authenticated });
  generate.disabled = !authenticated || generationBusy || models.length === 0 || !state.executable;
  executionStatus.textContent = state.availability;
  credentialState.textContent = state.credentialStatus;
  credentialCta.hidden = local || state.executable || state.credentialSource !== 'Sua chave';
  credentialCta.href = '#providers';
  credentialCta.textContent = 'APIs e provedores';
  generationProvider.disabled = local || generationBusy;
  credentialSourceSelect.disabled = local || generationBusy;
  updateGenerationDescription();
}
generationProvider.addEventListener('change', updateGenerationModels);
credentialSourceSelect.addEventListener('change', updateGenerationModels);
localGeneration.addEventListener('change', () => {
  updateGenerationModels();
});
fetch('/api/providers').then((response) => response.ok ? response.json() : null).then((payload) => {
  generationProviders = executableProviders(payload?.providers || []);
  generationProvider.replaceChildren(...generationProviders.map((provider) => {
    const option = document.createElement('option');
    option.value = provider.slug;
    option.textContent = `${provider.display_name}${provider.generation?.generationSupported ? '' : ' · Em breve'}`;
    return option;
  }));
  updateGenerationModels();
}).catch(() => {
  generationProvider.replaceChildren(Object.assign(document.createElement('option'), { value: '', textContent: 'Catálogo temporariamente indisponível' }));
  executionStatus.textContent = localGeneration.checked ? 'Disponível na sua conta' : 'Catálogo temporariamente indisponível';
  updateGenerationModels();
});
loadProfiles();

function setGenerationBusy(busy) {
  generationBusy = busy;
  for (const control of [brief, generationModel, targetModel, taskType, localGeneration]) control.disabled = busy;
  updateGenerationModels();
}

function updateResultMetadata({ generatedBy, target = targetModel.selectedOptions[0]?.textContent || targetModel.value, task = taskType.selectedOptions[0]?.textContent || taskType.value }) {
  resultGeneratedBy.textContent = generatedBy;
  resultTarget.textContent = target;
  resultTaskType.textContent = task;
}

function showGenerationError(message, detail, generatedBy) {
  output.textContent = message;
  source.textContent = detail;
  updateResultMetadata({ generatedBy });
  result.hidden = false;
  result.classList.remove('is-empty');
  copy.disabled = true;
}

generate.addEventListener('click', async () => {
  const session = authController.getSnapshot();
  if (!session.initialized || !session.user || session.recoverySession || !authController.getAccessToken()) return;
  const request = brief.value.trim();

  if (!request) {
    brief.focus();
    brief.setAttribute('aria-invalid', 'true');
    brief.placeholder = 'Conte o que você quer criar antes de gerar o prompt.';
    return;
  }

  const provider = providerBySlug(generationProviders, generationProvider.value);
  const selectedCredentialSource = localGeneration.checked ? LOCAL_GENERATION_OPTION.credentialSource : credentialSourceSelect.value;
  if (!localGeneration.checked && selectedCredentialSource === 'byok' && !credentialMetadata.has(generationProvider.value)) {
    showGenerationError(`Configure sua chave primeiro em APIs e provedores para usar ${generationProvider.selectedOptions[0]?.textContent || 'este provider'}.`,
    'Credencial BYOK não configurada', generationModel.selectedOptions[0]?.textContent || 'IA externa');
    return;
  }
  if (!generationModel.value) {
    showGenerationError('Nenhum modelo de geração válido está disponível para este provedor.', 'Execução indisponível', generationProvider.selectedOptions[0]?.textContent || 'IA externa');
    return;
  }

  brief.removeAttribute('aria-invalid');
  setGenerationBusy(true);
  generate.textContent = 'Gerando…';

  try {
    const selectedProvider = localGeneration.checked ? LOCAL_GENERATION_OPTION.provider : generationProvider.value;
    const accessToken = authController.getAccessToken();
    const generationRequest = new AbortController();
    activeGeneration = generationRequest;
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
      signal: generationRequest.signal,
      body: JSON.stringify({ brief: request, generationProvider: selectedProvider, generationModel: generationModel.value, credentialSource: selectedCredentialSource, taskType: taskType.value, targetModel: targetModel.value }),
    });
    const payload = await response.json().catch(() => ({}));
    if (generationRequest.signal.aborted || !authController.getSnapshot().user) return;

    if (!response.ok) {
      throw new Error(payload.error || 'Não foi possível gerar o prompt.');
    } else {
      output.textContent = payload.prompt;
      const labels = generationResultLabels(payload);
      source.textContent = labels.sourceText;
      resultGeneratedBy.textContent = labels.generatedBy;
      resultTarget.textContent = targetModel.selectedOptions[0]?.textContent || payload.targetModel;
      resultTaskType.textContent = taskType.selectedOptions[0]?.textContent || taskType.value;
    }

    result.classList.remove('is-empty');
    copy.disabled = false;
    copy.textContent = 'Copiar prompt';
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } catch (error) {
    if (error.name === 'AbortError') return;
    showGenerationError(error.message, 'A execução falhou sem alterar seu briefing ou suas escolhas.', localGeneration.checked ? 'Compilador local' : generationModel.selectedOptions[0]?.textContent || 'IA externa');
    result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } finally {
    activeGeneration = null;
    setGenerationBusy(false);
    generate.innerHTML = 'Gerar prompt <span aria-hidden="true">↗</span>';
  }
});

copy.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(output.textContent);
    copy.textContent = 'Copiado';
    window.setTimeout(() => { copy.textContent = 'Copiar prompt'; }, 1800);
  } catch {
    copy.textContent = 'Selecione e copie';
    window.getSelection()?.selectAllChildren(output);
  }
});
