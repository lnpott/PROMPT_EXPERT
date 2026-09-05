(function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))u(e);new MutationObserver(e=>{for(const o of e)if(o.type==="childList")for(const d of o.addedNodes)d.tagName==="LINK"&&d.rel==="modulepreload"&&u(d)}).observe(document,{childList:!0,subtree:!0});function s(e){const o={};return e.integrity&&(o.integrity=e.integrity),e.referrerPolicy&&(o.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?o.credentials="include":e.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function u(e){if(e.ep)return;e.ep=!0;const o=s(e);fetch(e.href,o)}})();const a=document.querySelector("#brief"),p=document.querySelector("#model"),i=document.querySelector("#generate"),c=document.querySelector("#result"),l=document.querySelector("#output"),n=document.querySelector("#copy");function m(r,t){return`Atue como um desenvolvedor front-end sênior. Crie uma solução completa para o pedido abaixo.

PEDIDO DO USUÁRIO
${r}

CONTEXTO DE IMPLEMENTAÇÃO
- Modelo de destino: ${t}
- Use React com componentes pequenos e bem nomeados.
- Entregue código executável, responsivo e acessível.
- Evite dependências desnecessárias.
- Preserve uma hierarquia visual clara e estados de foco visíveis.

FORMATO DA RESPOSTA
1. Resuma a proposta em até 3 linhas.
2. Mostre a estrutura de arquivos necessária.
3. Entregue o código completo de cada arquivo, em blocos separados.
4. Explique como executar localmente.
5. Inclua uma pequena lista de critérios para validar se o resultado atende ao pedido.

Não invente requisitos que contradigam o pedido. Se faltar uma informação realmente essencial, declare a melhor suposição antes do código.`}i.addEventListener("click",async()=>{const r=a.value.trim();if(!r){a.focus(),a.setAttribute("aria-invalid","true"),a.placeholder="Conte o que você quer criar antes de gerar o prompt.";return}a.removeAttribute("aria-invalid"),i.disabled=!0,i.textContent="Gerando…";try{const t=await fetch("/api/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({brief:r,model:p.value})}),s=await t.json().catch(()=>({}));if(t.ok)l.textContent=s.prompt;else if(s.code==="GEMINI_NOT_CONFIGURED"||t.status===404)l.textContent=m(r,p.value);else throw new Error(s.error||"Não foi possível gerar o prompt.");c.classList.remove("is-empty"),n.disabled=!1,n.textContent="Copiar",c.scrollIntoView({behavior:"smooth",block:"nearest"})}catch(t){l.textContent=t.message,c.classList.remove("is-empty"),n.disabled=!0,c.scrollIntoView({behavior:"smooth",block:"nearest"})}finally{i.disabled=!1,i.innerHTML='Gerar prompt <span aria-hidden="true">↗</span>'}});n.addEventListener("click",async()=>{await navigator.clipboard.writeText(l.textContent),n.textContent="Copiado",window.setTimeout(()=>{n.textContent="Copiar"},1800)});
