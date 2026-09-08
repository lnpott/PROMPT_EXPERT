import { getReviewedEvidenceSources } from '../server/knowledge-base.js';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Método não permitido.' });
  }

  try {
    const sources = await getReviewedEvidenceSources();
    const summary = sources.reduce((counts, source) => {
      counts[source.validation_status] = (counts[source.validation_status] || 0) + 1;
      return counts;
    }, {});

    return response.status(200).json({
      status: 'ok',
      reviewedOn: '2026-09-06',
      count: sources.length,
      summary,
      sources,
    });
  } catch {
    return response.status(503).json({ status: 'unavailable', error: 'A proveniência não está disponível agora.' });
  }
}
