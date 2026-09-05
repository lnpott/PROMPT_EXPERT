import { getGrokKnowledge } from './knowledge-base.js';

export default async function handler(_request, response) {
  try {
    const { profile } = await getGrokKnowledge();
    response.status(200).json({ status: 'ok', knowledgeBase: profile.display_name, geminiConfigured: Boolean(process.env.GEMINI_API_KEY) });
  } catch {
    response.status(503).json({ status: 'degraded', knowledgeBase: 'unavailable', geminiConfigured: Boolean(process.env.GEMINI_API_KEY) });
  }
}
