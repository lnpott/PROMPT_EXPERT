function setHidden(element, hidden) {
  if (element) element.hidden = hidden;
}

export function renderAccountState(elements, state) {
  const authenticated = Boolean(state.user);
  const recovery = authenticated && state.recoverySession;
  const loading = state.initialized === false;
  setHidden(elements.sessionLoading, !loading);
  setHidden(elements.accountPanel, loading || (authenticated && !recovery));
  // The public compiler is part of the product core. Authentication gates
  // personal areas (account/providers), not the generator shell.
  setHidden(elements.appContent, loading || recovery);
  setHidden(elements.accountNavigation, loading || recovery);
  if (loading) return;
  setHidden(elements.signedOut, authenticated);
  setHidden(elements.signedIn, !authenticated || recovery);
  setHidden(elements.recoveryPanel, !recovery);
  setHidden(elements.providersLocked, authenticated && !recovery);
  setHidden(elements.providersPlaceholder, !authenticated || recovery);
  elements.accountStatus.textContent = recovery ? 'recuperação' : authenticated ? state.user.email || 'conta' : 'desconectado';
  elements.userEmail.textContent = authenticated ? state.user.email || 'Conta autenticada' : '';

  if (!state.configured && !authenticated) {
    elements.feedback.textContent = 'Contas indisponíveis neste ambiente.';
  }
  if (state.recoverySession) {
    elements.feedback.textContent = 'Defina uma nova senha para concluir a recuperação segura.';
  }
}

function setBusy(elements, busy) {
  for (const button of elements.actionButtons) button.disabled = busy;
  elements.authForm.setAttribute('aria-busy', String(busy));
}

export function initializeAuthUI(controller, elements, request = fetch) {
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

  elements.changePasswordSubmit?.addEventListener('click', async () => {
    const password = elements.changePassword.value;
    if (password !== elements.changePasswordConfirm.value) {
      elements.changePasswordFeedback.textContent = 'As senhas não coincidem.';
      return;
    }
    elements.changePasswordSubmit.disabled = true;
    elements.changePasswordFeedback.textContent = 'Atualizando senha…';
    try {
      const result = await controller.updatePassword(password);
      elements.changePasswordFeedback.textContent = result.error || 'Senha alterada. Suas chaves de API foram preservadas.';
    } catch {
      elements.changePasswordFeedback.textContent = 'Não foi possível alterar a senha.';
    } finally {
      elements.changePassword.value = '';
      elements.changePasswordConfirm.value = '';
      elements.changePasswordSubmit.disabled = false;
    }
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

  elements.completeRecovery.addEventListener('click', async () => {
    if (elements.recoveryForm.getAttribute('aria-busy') === 'true') return;
    const password = elements.newPassword.value;
    const confirmation = elements.confirmPassword.value;
    if (password !== confirmation) {
      elements.recoveryFeedback.textContent = 'As senhas não coincidem.';
      return;
    }
    elements.recoveryForm.setAttribute('aria-busy', 'true');
    elements.completeRecovery.disabled = true;
    elements.recoveryFeedback.textContent = 'Removendo credenciais salvas…';
    try {
      const token = controller.getAccessToken();
      if (!token || !controller.getSnapshot().recoverySession) throw new Error('Sessão de recuperação indisponível. Solicite um novo link.');
      const purge = await request('/api/account/recovery/purge-credentials', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!purge.ok || !(await purge.json().catch(() => ({}))).purged) {
        throw new Error('Não foi possível remover as credenciais. Tente novamente antes de redefinir a senha.');
      }
      elements.recoveryFeedback.textContent = 'Credenciais removidas. Atualizando a senha…';
      const updated = await controller.updatePassword(password);
      if (updated.error) throw new Error(updated.error);
      const finished = await controller.finishRecovery();
      if (finished?.error) throw new Error('Senha redefinida, mas não foi possível encerrar a sessão. Saia manualmente antes de continuar.');
      elements.recoveryFeedback.textContent = 'Senha redefinida. Entre novamente e cadastre suas chaves de API.';
    } catch (error) {
      elements.recoveryFeedback.textContent = error.message || 'Não foi possível concluir a recuperação.';
    } finally {
      elements.newPassword.value = '';
      elements.confirmPassword.value = '';
      elements.recoveryForm.setAttribute('aria-busy', 'false');
      elements.completeRecovery.disabled = false;
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
