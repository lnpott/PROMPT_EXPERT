const PASSWORD_MIN_LENGTH = 8;

export function validateCredentials(email, password) {
  const normalizedEmail = typeof email === 'string' ? email.trim() : '';
  if (!normalizedEmail || !normalizedEmail.includes('@')) {
    return { error: 'Informe um email válido.' };
  }
  if (typeof password !== 'string' || password.length < PASSWORD_MIN_LENGTH) {
    return { error: `A senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.` };
  }
  return { email: normalizedEmail, password };
}

function authErrorMessage(error, action) {
  if (!error) return '';
  if (error.code === 'invalid_credentials') return 'Email ou senha incorretos.';
  if (error.code === 'email_not_confirmed') return 'Confirme seu email antes de entrar.';
  if (error.code === 'user_already_exists' || error.code === 'user_already_registered') {
    return 'Já existe uma conta para este email.';
  }
  if (error.code === 'over_request_rate_limit' || error.status === 429) {
    return 'Muitas tentativas. Aguarde um pouco e tente novamente.';
  }
  return action === 'signup'
    ? 'Não foi possível criar a conta. Verifique os dados e tente novamente.'
    : action === 'recovery'
      ? 'Não foi possível enviar as instruções de recuperação.'
      : 'Não foi possível concluir a autenticação.';
}

export function createAuthController(client) {
  let currentUser = null;
  let currentAccessToken = null;
  let recoverySession = false;
  const listeners = new Set();
  let subscription;

  const snapshot = () => ({ user: currentUser, recoverySession, configured: Boolean(client) });
  const notify = () => listeners.forEach((listener) => listener(snapshot()));

  return {
    getSnapshot: snapshot,
    getAccessToken() {
      return currentAccessToken;
    },
    subscribe(listener) {
      listeners.add(listener);
      listener(snapshot());
      return () => listeners.delete(listener);
    },
    async initialize() {
      if (!client) {
        notify();
        return snapshot();
      }

      const listener = client.auth.onAuthStateChange((event, session) => {
        recoverySession = event === 'PASSWORD_RECOVERY';
        currentUser = session?.user || null;
        currentAccessToken = session?.access_token || null;
        notify();
      });
      subscription = listener.data.subscription;

      const { data, error } = await client.auth.getSession();
      if (error) throw new Error('Não foi possível restaurar a sessão.');
      currentUser = data.session?.user || null;
      currentAccessToken = data.session?.access_token || null;
      notify();
      return snapshot();
    },
    async signIn(email, password) {
      const credentials = validateCredentials(email, password);
      if (credentials.error) return { error: credentials.error };
      if (!client) return { error: 'Configure o Supabase para usar contas.' };
      const { error } = await client.auth.signInWithPassword(credentials);
      return { error: authErrorMessage(error, 'signin') };
    },
    async signUp(email, password) {
      const credentials = validateCredentials(email, password);
      if (credentials.error) return { error: credentials.error };
      if (!client) return { error: 'Configure o Supabase para criar contas.' };
      const { data, error } = await client.auth.signUp(credentials);
      return {
        error: authErrorMessage(error, 'signup'),
        confirmationRequired: !error && !data.session,
      };
    },
    async signOut() {
      if (!client) return { error: '' };
      const { error } = await client.auth.signOut();
      return { error: authErrorMessage(error, 'signout') };
    },
    async requestPasswordRecovery(email, redirectTo) {
      const normalizedEmail = typeof email === 'string' ? email.trim() : '';
      if (!normalizedEmail || !normalizedEmail.includes('@')) return { error: 'Informe um email válido.' };
      if (!client) return { error: 'Configure o Supabase para recuperar a conta.' };
      const { error } = await client.auth.resetPasswordForEmail(normalizedEmail, { redirectTo });
      return { error: authErrorMessage(error, 'recovery') };
    },
    destroy() {
      subscription?.unsubscribe();
      listeners.clear();
    },
  };
}
