import { getGrokKnowledge } from './knowledge-base.js';

const MAX_BRIEF_LENGTH = 6000;
const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

function sendJson(response, status, body) {
  response.status(status).json(body);
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

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return sendJson(response, 405, { error: 'Método não permitido.' });
  }

  const brief = typeof request.body?.brief === 'string' ? request.body.brief.trim() : '';
  const model = request.body?.model === 'Grok' ? 'Grok' : null;

  if (!model || brief.length < 3 || brief.length > MAX_BRIEF_LENGTH) {
    return sendJson(response, 400, { error: 'Descreva o que deseja construir em até 6.000 caracteres.' });
  }

  if (!process.env.GEMINI_API_KEY) {
    return sendJson(response, 503, { code: 'GEMINI_NOT_CONFIGURED', error: 'A geração por IA ainda não foi configurada.' });
  }

  try {
    const { profile, rules } = await getGrokKnowledge();
    const geminiModel = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: buildInstruction(brief, profile, rules) }] }],
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
    return sendJson(response, 200, { prompt, source: 'gemini' });
  } catch {
    return sendJson(response, 502, { error: 'Não foi possível montar o prompt agora. Tente novamente.' });
  }
}
