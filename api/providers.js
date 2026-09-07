import { getActiveApiProviders } from './knowledge-base.js';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    const providers = await getActiveApiProviders();
    return response.status(200).json({ status: 'ok', providers });
  } catch {
    return response.status(503).json({
      status: 'unavailable',
      error: 'O catálogo de provedores não está disponível agora.',
    });
  }
}
