import { publicProfiles } from './model-profiles.js';
import { loadCanonicalMethodology } from '../server/canonical-methodology.js';

export default async function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Método não permitido.' });
  }

  const canonical = await loadCanonicalMethodology();
  return response.status(200).json({ profiles: publicProfiles(canonical.corpus), methodologyOrigin: canonical.origin, methodologyVersion: canonical.version });
}
