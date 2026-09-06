import { publicCompilerModels } from './compiler-models.js';

export default function handler(request, response) {
  if (request.method !== 'GET') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ error: 'Método não permitido.' });
  }

  return response.status(200).json({ compilers: publicCompilerModels() });
}
