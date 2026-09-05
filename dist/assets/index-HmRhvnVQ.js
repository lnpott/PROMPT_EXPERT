(function(){const r=document.createElement("link").relList;if(r&&r.supports&&r.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))a(e);new MutationObserver(e=>{for(const t of e)if(t.type==="childList")for(const i of t.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&a(i)}).observe(document,{childList:!0,subtree:!0});function d(e){const t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?t.credentials="include":e.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function a(e){if(e.ep)return;e.ep=!0;const t=d(e);fetch(e.href,t)}})();const n=document.querySelector("#brief"),l=document.querySelector("#model"),m=document.querySelector("#generate"),c=document.querySelector("#result"),u=document.querySelector("#output"),s=document.querySelector("#copy");function p(o,r){return`Atue como um desenvolvedor front-end sênior. Crie uma solução completa para o pedido abaixo.

PEDIDO DO USUÁRIO
${o}

CONTEXTO DE IMPLEMENTAÇÃO
- Modelo de destino: ${r}
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

Não invente requisitos que contradigam o pedido. Se faltar uma informação realmente essencial, declare a melhor suposição antes do código.`}m.addEventListener("click",()=>{const o=n.value.trim();if(!o){n.focus(),n.setAttribute("aria-invalid","true"),n.placeholder="Conte o que você quer criar antes de gerar o prompt.";return}n.removeAttribute("aria-invalid"),u.textContent=p(o,l.value),c.classList.remove("is-empty"),s.disabled=!1,s.textContent="Copiar",c.scrollIntoView({behavior:"smooth",block:"nearest"})});s.addEventListener("click",async()=>{await navigator.clipboard.writeText(u.textContent),s.textContent="Copiado",window.setTimeout(()=>{s.textContent="Copiar"},1800)});
