import { richProviders } from '../../../providers.js';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Método não permitido.' });
  }
  const slug = typeof request.query?.slug === 'string' ? request.query.slug : '';
  const modelId = typeof request.query?.model === 'string' ? request.query.model : '';
  try {
    const provider = (await richProviders()).find((item) => item.slug === slug);
    const model = provider?.models.find((item) => item.model_id === modelId);
    if (!provider || !model) return response.status(404).json({ error: 'Modelo não encontrado.' });
    return response.status(200).json({ status: 'ok', provider: { slug: provider.slug, display_name: provider.display_name }, model });
  } catch {
    return response.status(503).json({ status: 'unavailable', error: 'O catálogo de modelos não está disponível agora.' });
  }
}
