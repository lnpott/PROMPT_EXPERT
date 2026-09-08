import { authenticateUser, UserApiError, userDatabaseRequest } from '../../security/supabase-user.js';

function publicError(error) {
  if (error instanceof UserApiError && error.code === 'UNAUTHENTICATED') {
    return { status: 401, message: 'Autenticação necessária.' };
  }
  return { status: 503, message: 'Não foi possível preparar a recuperação. Tente novamente.' };
}

export async function purgeRecoveryCredentials(request, response, environment = process.env) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    const auth = await authenticateUser(request, environment);
    const deleted = await userDatabaseRequest(
      `user_api_credentials?user_id=eq.${encodeURIComponent(auth.userId)}`,
      { ...auth, method: 'DELETE', prefer: 'return=minimal' },
      environment,
    );
    if (!deleted.ok) throw new Error('vault purge failed');
    return response.status(200).json({ purged: true });
  } catch (error) {
    const failure = publicError(error);
    return response.status(failure.status).json({ error: failure.message });
  }
}

export default purgeRecoveryCredentials;
