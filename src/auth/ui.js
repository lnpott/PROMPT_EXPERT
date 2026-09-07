function setHidden(element, hidden) {
  element.hidden = hidden;
}

export function renderAccountState(elements, state) {
  const authenticated = Boolean(state.user);
  setHidden(elements.signedOut, authenticated);
  setHidden(elements.signedIn, !authenticated);
  setHidden(elements.providersLocked, authenticated);
  setHidden(elements.providersPlaceholder, !authenticated);
  elements.accountStatus.textContent = authenticated ? 'autenticado' : 'desconectado';
  elements.userEmail.textContent = authenticated ? state.user.email || 'Conta autenticada' : '';

  if (!state.configured && !authenticated) {
    elements.feedback.textContent = 'Contas indisponíveis neste ambiente. O compilador local continua disponível.';
  }
  if (state.recoverySession) {
    elements.feedback.textContent = 'Sessão de recuperação identificada. A conclusão segura e destrutiva do futuro cofre será implementada no Passo 16.';
  }
}

function setBusy(elements, busy) {
  for (const button of elements.actionButtons) button.disabled = busy;
  elements.authForm.setAttribute('aria-busy', String(busy));
}

export function initializeAuthUI(controller, elements) {
  const unsubscribe = controller.subscribe((state) => renderAccountState(elements, state));

  async function run(action, pendingMessage) {
    if (elements.authForm.getAttribute('aria-busy') === 'true') return;
    setBusy(elements, true);
    elements.feedback.textContent = pendingMessage;
    try {
      const result = await action();
      elements.feedback.textContent = result.error || '';
      return result;
    } finally {
      elements.password.value = '';
      setBusy(elements, false);
    }
  }

  elements.authForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    await run(
      () => controller.signIn(elements.email.value, elements.password.value),
      'Entrando…',
    );
  });

  elements.signUp.addEventListener('click', async () => {
    const result = await run(
      () => controller.signUp(elements.email.value, elements.password.value),
      'Criando conta…',
    );
    if (result?.confirmationRequired) {
      elements.feedback.textContent = 'Conta criada. Confira seu email para confirmar o acesso.';
    }
  });

  elements.signOut.addEventListener('click', async () => {
    const result = await run(() => controller.signOut(), 'Saindo…');
    if (!result?.error) elements.feedback.textContent = 'Sessão encerrada.';
  });

  elements.recovery.addEventListener('click', async () => {
    const redirectTo = `${window.location.origin}${window.location.pathname}#account-recovery`;
    const result = await run(
      () => controller.requestPasswordRecovery(elements.email.value, redirectTo),
      'Enviando instruções…',
    );
    if (!result?.error) {
      elements.feedback.textContent = 'Se a conta existir, as instruções de recuperação serão enviadas por email.';
    }
  });

  controller.initialize().catch(() => {
    elements.feedback.textContent = 'Não foi possível restaurar a sessão. O compilador local continua disponível.';
  });

  return () => {
    unsubscribe();
    controller.destroy();
  };
}
