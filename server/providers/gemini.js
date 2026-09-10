const BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';
const LIMIT = 1_000_000;
export class GeminiProviderError extends Error { constructor(code, status=502){ super(code); this.code=code; this.status=status; } }
function classify(status){ if([401,403].includes(status)) return ['credential_invalid',401]; if(status===429)return ['provider_rate_limited',429]; if(status===404)return ['provider_model_unavailable',404]; if(status>=500)return ['provider_unavailable',503]; return ['provider_error',502]; }
async function call(path, apiKey, options={}, request=fetch){
  const controller=new AbortController(); const timer=setTimeout(()=>controller.abort(),12000);
  try { const response=await request(`${BASE_URL}${path}`,{...options,redirect:'error',headers:{Accept:'application/json','Content-Type':'application/json','x-goog-api-key':apiKey},signal:controller.signal});
    if(!response.ok){const [code,status]=classify(response.status);throw new GeminiProviderError(code,status);}
    const declared=Number(response.headers?.get?.('content-length')); if(Number.isFinite(declared)&&declared>LIMIT)throw new GeminiProviderError('provider_invalid_response');
    const text=await response.text(); if(Buffer.byteLength(text)>LIMIT)throw new GeminiProviderError('provider_invalid_response');
    try{return JSON.parse(text);}catch{throw new GeminiProviderError('provider_invalid_response');}
  } catch(error){if(error instanceof GeminiProviderError)throw error;if(['AbortError','TimeoutError'].includes(error?.name))throw new GeminiProviderError('provider_timeout',504);throw new GeminiProviderError('provider_network_error');} finally{clearTimeout(timer);}
}
export async function validateGeminiKey(apiKey,request){if(!apiKey)throw new GeminiProviderError('credential_missing',404);const data=await call('/models?pageSize=1',apiKey,{method:'GET'},request);if(!Array.isArray(data.models))throw new GeminiProviderError('provider_invalid_response');return {status:'valid'};}
export async function generateWithGemini({apiKey,model,instruction},request){if(!apiKey)throw new GeminiProviderError('credential_missing',404);const data=await call(`/models/${encodeURIComponent(model)}:generateContent`,apiKey,{method:'POST',body:JSON.stringify({contents:[{role:'user',parts:[{text:instruction}]}],generationConfig:{temperature:.35,maxOutputTokens:4096}})},request);const content=data.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join('').trim();if(!content||content.length>100000)throw new GeminiProviderError('provider_invalid_response');return {content};}
