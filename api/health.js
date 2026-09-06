import { getGrokKnowledge } from './knowledge-base.js';

export default async function handler(_request, response) {
  try {
    const { profile } = await getGrokKnowledge();
    response.status(200).json({ status: 'ok', knowledgeBase: profile.display_name, generator: process.env.GEMINI_API_KEY ? 'gemini' : 'local' });
  } catch {
    response.status(200).json({ status: 'ok', knowledgeBase: 'local', generator: process.env.GEMINI_API_KEY ? 'gemini' : 'local' });
  }
}
