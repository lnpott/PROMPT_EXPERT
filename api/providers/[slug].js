import { richProviders } from '../providers.js';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Método não permitido.' });
  }
  const slug = typeof request.query?.slug === 'string' ? request.query.slug : '';
  try {
    const provider = (await richProviders()).find((item) => item.slug === slug);
    if (!provider) return response.status(404).json({ error: 'Provedor não encontrado.' });
    return response.status(200).json({ status: 'ok', provider });
  } catch {
    return response.status(503).json({ status: 'unavailable', error: 'O catálogo de provedores não está disponível agora.' });
  }
}
