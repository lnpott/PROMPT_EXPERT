const STATUS_LABELS = Object.freeze({
  untested: 'Ainda não testada',
  valid: 'Validada no provedor',
  invalid: 'Inválida',
  error: 'Erro na última validação',
});

function button(label, action, secondary = false) {
  const element = document.createElement('button');
  element.type = 'button';
  element.dataset.action = action;
  element.textContent = label;
  if (secondary) element.className = 'secondary';
  return element;
}

function metadataFor(provider, credentials) {
  return credentials.find((credential) => credential.providerSlug === provider.slug) || null;
}

export function renderCredentialProviders(elements, providers, credentials, handlers) {
  const cards = providers.map((provider) => {
    const credential = metadataFor(provider, credentials);
    const card = document.createElement('article');
    card.className = 'provider-card';
    const heading = document.createElement('div');
    heading.className = 'provider-card-head';
    const title = document.createElement('h3');
    title.textContent = provider.display_name;
    const state = document.createElement('span');
    state.className = credential ? 'credential-state configured' : 'credential-state';
    state.textContent = credential ? 'Configurada' : 'Sem credencial';
    heading.append(title, state);

    const detail = document.createElement('p');
    detail.className = 'credential-detail';
    detail.textContent = credential
      ? `${credential.secretLast4 ? `••••••••${credential.secretLast4} · ` : ''}${STATUS_LABELS[credential.validationStatus] || 'Status indisponível'}`
      : 'Adicione uma credencial para este provedor.';

    const form = document.createElement('form');
    form.className = 'credential-form';
    const secretLabel = document.createElement('label');
    secretLabel.textContent = credential ? 'Nova API key para substituir' : 'API key';
    const secret = document.createElement('input');
    secret.type = 'password';
    secret.name = 'secret';
    secret.autocomplete = 'off';
    secret.spellcheck = false;
    secret.required = true;
    secret.minLength = 4;
    secret.maxLength = 16384;
    const label = document.createElement('input');
    label.type = 'text';
    label.name = 'label';
    label.placeholder = 'Rótulo opcional';
    label.maxLength = 100;
    const actions = document.createElement('div');
    actions.className = 'credential-actions';
    const save = button(credential ? 'Substituir' : 'Adicionar', 'save');
    save.type = 'submit';
    actions.append(save);
    if (credential) actions.append(button('Testar integridade', 'test', true), button('Remover', 'remove', true));
    form.append(secretLabel, secret, label, actions);

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const submittedSecret = secret.value;
      const submittedLabel = label.value;
      secret.value = '';
      handlers.save(provider.slug, submittedSecret, submittedLabel, form);
    });
    actions.addEventListener('click', (event) => {
      const action = event.target?.dataset?.action;
      if (action === 'test') handlers.test(provider.slug, form);
      if (action === 'remove') handlers.remove(provider.slug, provider.display_name, form);
    });
    card.append(heading, detail, form);
    return card;
  });
  elements.list.replaceChildren(...cards);
}

async function payload(response) {
  return response.json().catch(() => ({}));
}

export function initializeCredentialManager(controller, elements, request = fetch) {
  let credentials = [];
  let providers = [];
  let activeUserId = null;

  const message = (text, kind = '') => {
    elements.feedback.textContent = text;
    elements.feedback.dataset.kind = kind;
  };
  const setBusy = (form, busy) => {
    form.setAttribute('aria-busy', String(busy));
    for (const control of form.querySelectorAll('input, button')) control.disabled = busy;
  };
  const authorized = async (url, options = {}) => {
    const token = controller.getAccessToken();
    if (!token) throw new Error('Sua sessão não está disponível. Entre novamente.');
    return request(url, { ...options, headers: { ...options.headers, Authorization: `Bearer ${token}` } });
  };
  const refresh = async () => {
    const requestedForUser = activeUserId;
    message('Carregando provedores e credenciais…');
    const [providersResponse, credentialsResponse] = await Promise.all([
      request('/api/providers'),
      authorized('/api/credentials'),
    ]);
    const providersPayload = await payload(providersResponse);
    const credentialsPayload = await payload(credentialsResponse);
    if (!providersResponse.ok || !credentialsResponse.ok) {
      throw new Error(credentialsPayload.error || providersPayload.error || 'Não foi possível carregar suas credenciais.');
    }
    if (!requestedForUser || requestedForUser !== activeUserId) return;
    providers = providersPayload.providers || [];
    credentials = credentialsPayload.credentials || [];
    render();
    message(credentials.length ? 'Credenciais carregadas.' : 'Nenhuma credencial configurada.', 'success');
  };
  const operation = async (form, pending, action) => {
    setBusy(form, true);
    message(pending);
    try {
      await action();
    } catch (error) {
      message(error.message || 'Não foi possível concluir a operação.', 'error');
    } finally {
      setBusy(form, false);
    }
  };
  const handlers = {
    save(slug, secret, label, form) {
      return operation(form, 'Salvando credencial…', async () => {
        const response = await authorized(`/api/credentials/${encodeURIComponent(slug)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ secret, ...(label.trim() ? { label: label.trim() } : {}) }),
        });
        const result = await payload(response);
        if (!response.ok) throw new Error(result.error || 'Não foi possível salvar a credencial.');
        await refresh();
        message('Credencial salva com segurança.', 'success');
      });
    },
    test(slug, form) {
      return operation(form, 'Testando integridade…', async () => {
        const response = await authorized(`/api/credentials/${encodeURIComponent(slug)}/test`, { method: 'POST' });
        const result = await payload(response);
        if (!response.ok) throw new Error(result.error || 'Não foi possível testar a credencial.');
        message(result.message || 'Integridade verificada localmente.', 'success');
      });
    },
    remove(slug, name, form) {
      if (!window.confirm(`Remover a credencial de ${name}?`)) return;
      return operation(form, 'Removendo credencial…', async () => {
        const response = await authorized(`/api/credentials/${encodeURIComponent(slug)}`, { method: 'DELETE' });
        if (!response.ok) {
          const result = await payload(response);
          throw new Error(result.error || 'Não foi possível remover a credencial.');
        }
        await refresh();
        message('Credencial removida.', 'success');
      });
    },
  };
  const render = () => renderCredentialProviders(elements, providers, credentials, handlers);

  return controller.subscribe((state) => {
    const userId = state.user?.id || null;
    if (!userId) {
      activeUserId = null;
      credentials = [];
      providers = [];
      elements.list.replaceChildren();
      message('Entre em sua conta para gerenciar credenciais.');
      return;
    }
    if (userId === activeUserId) return;
    activeUserId = userId;
    refresh().catch((error) => message(error.message || 'Não foi possível carregar suas credenciais.', 'error'));
  });
}
