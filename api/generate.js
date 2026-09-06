import { randomUUID } from 'node:crypto';

import { getModelKnowledge } from './knowledge-base.js';
import { compilePrompt, findProfile } from './model-profiles.js';

const MAX_BRIEF_LENGTH = 6000;
const DEFAULT_GEMINI_MODEL = 'gemini-3.8-flash';
const PROVIDER_TIMEOUT_MS = 9000;
const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;
const requestsByClient = new Map();

function sendJson(response, status, body) {
  return response.status(status).json(body);
}

function buildInstruction(brief, profile, rules) {
  const orderedRules = rules.map(({ rule_text: rule }) => `- ${rule}`).join('\n');

  return `Você é o motor do PROMPT_EXPERT. Produza um único prompt de programação em português, pronto para ser copiado e enviado ao ${profile.display_name}.

Pedido da pessoa usuária:
${brief}

Perfil de destino:
${profile.system_guidance}

Regras ativas:
${orderedRules}

Contrato de saída:
${profile.output_contract}

Não responda com código. Entregue somente o prompt final, estruturado em Markdown, sem prefácio nem comentário sobre o seu processo.`;
}

async function requestGemini(url, options) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const response = await fetch(url, { ...options, signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS) });
    if (response.ok || ![429, 503].includes(response.status) || attempt === 2) return response;
    const retryAfter = Number(response.headers?.get?.('retry-after')) * 1000;
    const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 300 * (attempt + 1) + Math.floor(Math.random() * 150);
    await new Promise((resolve) => setTimeout(resolve, Math.min(delay, 2000)));
  }
}

function clientIsLimited(request) {
  const client = String(request.headers?.['x-forwarded-for'] || request.socket?.remoteAddress || 'local').split(',')[0].trim();
  const now = Date.now();
  const recent = (requestsByClient.get(client) || []).filter((timestamp) => now - timestamp < RATE_WINDOW_MS);
  recent.push(now);
  requestsByClient.set(client, recent);
  return recent.length > RATE_LIMIT;
}

export default async function handler(request, response) {
  const requestId = randomUUID();
  response.setHeader('X-Request-Id', requestId);

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return sendJson(response, 405, { error: 'Método não permitido.' });
  }

  const brief = typeof request.body?.brief === 'string' ? request.body.brief.trim() : '';
  const model = typeof request.body?.model === 'string' ? request.body.model : '';
  const profile = findProfile(model);
  const taskType = typeof request.body?.taskType === 'string' ? request.body.taskType : 'application';
  const complexity = typeof request.body?.complexity === 'string' ? request.body.complexity : 'medium';

  if (!profile || brief.length < 3 || brief.length > MAX_BRIEF_LENGTH) {
    return sendJson(response, 400, { error: 'Descreva o que deseja construir em até 6.000 caracteres.' });
  }

  if (clientIsLimited(request)) return sendJson(response, 429, { error: 'Limite temporário atingido. Aguarde um minuto.' });

  const localPrompt = compilePrompt({ brief, profile, taskType, complexity });
  if (!process.env.GEMINI_API_KEY) return sendJson(response, 200, { prompt: localPrompt, source: 'local', requestId });

  try {
    const remoteKnowledge = await getModelKnowledge(profile.slug);
    const generationProfile = remoteKnowledge ? {
      display_name: remoteKnowledge.profile.display_name,
      system_guidance: remoteKnowledge.profile.system_guidance,
      output_contract: remoteKnowledge.profile.output_contract,
    } : {
      display_name: profile.displayName,
      system_guidance: profile.guidance,
      output_contract: profile.format,
    };
    const rules = remoteKnowledge?.rules || profile.rules.map((rule, priority) => ({ rule_text: rule, priority }));
    const geminiModel = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
    const geminiResponse = await requestGemini(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: buildInstruction(localPrompt, generationProfile, rules) }] }],
          generationConfig: { temperature: 0.35, maxOutputTokens: 4096 },
        }),
      },
    );

    if (!geminiResponse.ok) {
      return sendJson(response, 502, { error: 'O provedor de IA não conseguiu gerar o prompt. Tente novamente.' });
    }

    const payload = await geminiResponse.json();
    const prompt = payload.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join('').trim();

    if (!prompt) return sendJson(response, 502, { error: 'O provedor de IA retornou uma resposta vazia.' });
    return sendJson(response, 200, { prompt, source: 'gemini', requestId });
  } catch (error) {
    console.error(JSON.stringify({ event: 'generation_fallback', requestId, model, error: error?.name || 'Error' }));
    return sendJson(response, 200, { prompt: localPrompt, source: 'local-fallback', requestId });
  }
}
