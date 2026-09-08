const STATUS_LABELS = Object.freeze({
  untested: 'Ainda não testada',
  valid: 'Validada no provedor',
  invalid: 'Inválida',
  error: 'Erro na última validação',
});
const FREE_TIER_LABELS = Object.freeze({
  none: 'Sem opção gratuita confirmada',
  quota: 'Free tier com cota',
  promotional: 'Crédito ou cota promocional',
  gateway_free: 'Grátis via gateway',
  unknown: 'Gratuidade não confirmada',
});

function externalLink(label, url) {
  if (!url) return null;
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noreferrer';
  link.textContent = label;
  return link;
}

function capabilityLabels(model) {
  return [
    model.reasoning_support ? 'Raciocínio' : null,
    model.tool_calling ? 'Ferramentas' : null,
    model.vision ? 'Visão' : null,
    model.audio ? 'Áudio' : null,
    model.image_generation ? 'Geração de imagem' : null,
  ].filter(Boolean);
}

export function priceSummary(model) {
  if (model.input_price == null && model.output_price == null) return model.pricing_notes || null;
  const unit = model.pricing_unit === 'million_tokens' ? 'por 1M tokens' : model.pricing_unit || '';
  const currency = model.currency || '';
  const parts = [];
  if (model.input_price != null) parts.push(`entrada ${currency} ${Number(model.input_price).toFixed(2)}`);
  if (model.output_price != null) parts.push(`saída ${currency} ${Number(model.output_price).toFixed(2)}`);
  return `${parts.join(' · ')} ${unit}`.trim();
}

function modelCard(model) {
  const item = document.createElement('li');
  const title = document.createElement('strong');
  title.textContent = model.display_name;
  const description = document.createElement('p');
  description.textContent = model.description || 'Descrição detalhada não publicada.';
  item.append(title, description);
  const capabilities = capabilityLabels(model);
  if (capabilities.length) {
    const line = document.createElement('p');
    line.className = 'model-meta';
    line.textContent = capabilities.join(' · ');
    item.append(line);
  }
  const pricing = priceSummary(model);
  if (pricing) {
    const line = document.createElement('p');
    line.className = 'model-price';
    line.textContent = pricing;
    item.append(line);
  }
  const official = externalLink('Modelo oficial ↗', model.official_url);
  if (official) item.append(official);
  return item;
}

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
    const identity = document.createElement('div');
    identity.className = 'provider-identity';
    const logoFallback = document.createElement('span');
    logoFallback.className = 'provider-logo-fallback';
    logoFallback.textContent = provider.display_name?.slice(0, 2).toUpperCase() || 'AI';
    if (provider.logo_url) {
      const logo = document.createElement('img');
      logo.className = 'provider-logo';
      logo.src = provider.logo_url;
      logo.alt = '';
      logo.loading = 'lazy';
      logo.referrerPolicy = 'no-referrer';
      logo.addEventListener('load', () => { logoFallback.hidden = true; });
      logo.addEventListener('error', () => logo.remove());
      identity.append(logo);
    }
    identity.append(logoFallback);
    const title = document.createElement('h3');
    title.textContent = provider.display_name;
    identity.append(title);
    const state = document.createElement('span');
    state.className = credential ? 'credential-state configured' : 'credential-state';
    state.textContent = credential ? 'Configurada' : 'Sem credencial';
    heading.append(identity, state);

    const detail = document.createElement('p');
    detail.className = 'credential-detail';
    detail.textContent = provider.short_description || 'Informações adicionais ainda não foram publicadas.';

    const quickFacts = document.createElement('p');
    quickFacts.className = 'provider-quick-facts';
    const freeTier = FREE_TIER_LABELS[provider.free_tier_status] || 'Gratuidade não informada';
    const uses = Array.isArray(provider.primary_uses) ? provider.primary_uses.slice(0, 2).join(' · ') : '';
    quickFacts.textContent = [freeTier, uses].filter(Boolean).join(' · ');

    const credentialDetail = document.createElement('p');
    credentialDetail.className = 'credential-detail';
    credentialDetail.textContent = credential
      ? `${credential.secretLast4 ? `••••••••${credential.secretLast4} · ` : ''}${STATUS_LABELS[credential.validationStatus] || 'Status indisponível'}`
      : 'Adicione uma credencial para conectar esta plataforma.';

    const highlights = document.createElement('ul');
    highlights.className = 'model-highlights';
    for (const model of (provider.models || []).slice(0, 3)) {
      const item = document.createElement('li');
      item.textContent = model.display_name;
      highlights.append(item);
    }

    const details = document.createElement('details');
    details.className = 'provider-details';
    const summary = document.createElement('summary');
    summary.textContent = 'Ver plataforma e modelos';
    const expanded = document.createElement('p');
    expanded.textContent = provider.long_description || provider.short_description || 'Descrição expandida não disponível.';
    const links = document.createElement('div');
    links.className = 'provider-links';
    for (const link of [externalLink('Site oficial ↗', provider.website_url), externalLink('Documentação ↗', provider.docs_url)]) {
      if (link) links.append(link);
    }
    const notes = document.createElement('p');
    notes.className = 'provider-notes';
    notes.textContent = [provider.billing_notes, provider.region_notes].filter(Boolean).join(' ');
    const modelsTitle = document.createElement('h4');
    modelsTitle.textContent = 'Modelos em destaque';
    const models = document.createElement('ul');
    models.className = 'provider-models';
    for (const model of provider.models || []) models.append(modelCard(model));
    const verified = document.createElement('p');
    verified.className = 'last-verified';
    verified.textContent = provider.last_verified_at ? `Verificado em ${provider.last_verified_at}` : 'Data de verificação não disponível';
    details.append(summary, expanded, links);
    if (notes.textContent) details.append(notes);
    if ((provider.models || []).length) details.append(modelsTitle, models);
    details.append(verified);

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
    label.value = credential?.label || '';
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
    card.append(heading, detail, quickFacts);
    if (highlights.children.length) card.append(highlights);
    card.append(credentialDetail, details, form);
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
    if (!userId || state.recoverySession) {
      activeUserId = null;
      credentials = [];
      providers = [];
      elements.list.replaceChildren();
      message(state.recoverySession ? 'O cofre fica oculto durante a recuperação.' : 'Entre em sua conta para gerenciar credenciais.');
      return;
    }
    if (userId === activeUserId) return;
    activeUserId = userId;
    refresh().catch((error) => message(error.message || 'Não foi possível carregar suas credenciais.', 'error'));
  });
}
