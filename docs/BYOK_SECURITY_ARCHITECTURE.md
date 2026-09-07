# Arquitetura de segurança do ciclo BYOK

**Passo:** 11 — auditoria pré-BYOK e contrato de segurança

**Data:** 7 de setembro de 2026

**Branch:** `step-11-byok-security-contract`

**Natureza:** documentação e desenho; nenhuma autenticação, migration, credencial de usuário ou alteração remota foi criada.

## 1. Resumo executivo

O produto encontrado é uma aplicação Vite de página única, escrita em HTML, CSS e JavaScript nativos, com funções serverless JavaScript em `api/`. Não há framework de componentes, roteador, SDK Supabase, autenticação ou estado persistente no navegador. O compilador determinístico roda no navegador e no backend; a geração opcional usa uma chave Gemini da plataforma no backend. O backend lê conteúdo público do Supabase pelo REST/PostgREST com chave publicável e RLS.

A arquitetura planejada no `PROJECT_GUIDE.md` é compatível com essa base e fica ratificada com ressalvas de segurança detalhadas neste documento. A evolução não exige reescrever a interface: módulos pequenos para cliente Supabase/sessão, telas de conta e provedores e inclusão condicional do JWT nas chamadas protegidas bastam. O cofre deverá ser implementado exclusivamente no backend, com isolamento simultâneo por JWT e RLS, criptografia autenticada e destinos externos em allowlist.

Este passo não instala o SDK, não altera `.env.example`, não cria tabelas, não acessa infraestrutura remota e não implementa qualquer parte do cofre.

## 2. Arquitetura encontrada

### 2.1 Frontend

- `index.html` contém toda a estrutura da tela: briefing, modelo de destino, motor Gemini, tipo de tarefa, geração, resultado e cópia.
- `src/style.css` contém o layout responsivo e os estados visuais. Não há CSP versionada em `index.html` ou `vercel.json`.
- `src/main.js` mantém estado somente em variáveis de módulo (`profiles` e `compilers`) e no DOM. Briefing e prompt não são persistidos em cookies, storage ou banco.
- Os catálogos locais vêm de módulos compartilhados de `api/`, usados diretamente pelo bundle como fallback.
- `GET /api/profiles` e `GET /api/compilers` são chamados por `fetch`, sem headers de autenticação. Falhas preservam os catálogos locais.
- `POST /api/generate` recebe JSON com `brief`, `model`, `taskType` e `compilerModel`, sem autenticação. Em 404, o navegador chama o compilador local; em falha declarada pela API, mostra uma mensagem; em sucesso, usa `textContent`, não `innerHTML`, para o resultado.
- O único uso dinâmico de `innerHTML` repõe um texto constante do botão. As opções são criadas com `createElement` e `textContent`, reduzindo a superfície de XSS atual.

**Mudança mínima futura para autenticação:** adicionar a dependência oficial do Supabase, um módulo isolado de cliente/sessão, controles de cadastro/login/logout e recuperação no HTML, e listeners/estado de sessão em módulos próprios. O compilador local e as três seleções atuais devem permanecer independentes da sessão. Somente chamadas de cofre e geração BYOK enviarão `Authorization: Bearer <JWT>`; os endpoints públicos atuais podem continuar anônimos. Não é necessário migrar para React, Vue ou outro framework.

### 2.2 Backend

| Rota | Método | Estado atual |
| --- | --- | --- |
| `/api/generate` | `POST` | Valida allowlists e briefing, limita por IP/instância, compila localmente e opcionalmente chama Gemini. |
| `/api/health` | não restringe método | Consulta o perfil Grok e informa somente modo local/Gemini. Deve ganhar allowlist de método em hardening. |
| `/api/profiles` | `GET` | Devolve nove perfis locais sem regras internas. |
| `/api/compilers` | `GET` | Devolve cinco motores Gemini permitidos e o **nome** da variável necessária. |
| `/api/provenance` | `GET` | Devolve fontes revisadas públicas ou falha fechada com 503. |

Utilitários compartilhados:

- `api/model-profiles.js`: perfis, tipos de tarefa, lookup e compilador determinístico.
- `api/compiler-models.js`: allowlist Gemini, modelo padrão e resolução do segredo de ambiente.
- `api/knowledge-base.js`: acesso REST ao Supabase para perfis, regras e fontes.

Controles observados em `/api/generate`:

- entrada: método `POST`, perfil, tipo e motor em allowlists; briefing aparado entre 3 e 6.000 caracteres;
- rate limit: 20 chamadas/minuto por identificador derivado de `x-forwarded-for` ou endereço remoto, em memória por instância; é proteção de melhor esforço e o header deve ser aceito somente quando normalizado pela plataforma confiável;
- timeout: 9 segundos por tentativa Gemini;
- retry: até três tentativas apenas para 429/503, com `Retry-After` limitado a 2 segundos ou backoff com jitter;
- saída Gemini: `maxOutputTokens` de 4.096; resposta vazia ou erro aciona fallback local;
- logs: um evento JSON com request ID, destino, motor, origem, status, duração, tentativas e classe de erro; briefing, prompt e segredo não são registrados;
- erros: a captura devolve fallback sanitizado e registra apenas `error.name`;
- Gemini: endpoint HTTPS fixo, modelo em allowlist e chave no header `x-goog-api-key`.

Ainda não há validação de JWT, quota distribuída, limite explícito do corpo HTTP, idempotência/replay protection ou abstração de provedor. O ponto correto de extensão é separar de `generate.js`: (1) autenticação/contexto do usuário; (2) serviço de cofre; (3) registry imutável de provedores/modelos; e (4) adaptadores com contrato comum. `requestGemini` deverá migrar para o adaptador Gemini, e a construção/validação de geração deve permanecer independente do fornecedor. URLs de destino jamais devem vir do body nem de campos editáveis pelo usuário.

### 2.3 Supabase versionado

As migrations existentes criam:

- `model_profiles`, `prompt_rules` e `prompt_examples`;
- `knowledge_sources` e `canonical_prompt_rules`;
- `evidence_sources`, `source_snapshots`, `rule_evidence` e `rule_review_events`.

Todas essas tabelas têm RLS habilitada. Os grants versionados revogam tudo de `anon` e `authenticated` e concedem `SELECT` apenas onde existe leitura pública. As policies públicas limitam perfis/regras/exemplos e corpus a registros ativos/verificados; fontes e snapshots exigem estado revisado. `rule_evidence` e `rule_review_events` não recebem leitura pública. Não existe policy por proprietário porque ainda não existe dado de usuário.

O backend acessa PostgREST diretamente com `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY`, enviando a chave publicável como `apikey` e `Authorization`. Há defaults públicos versionados para ambos em `api/knowledge-base.js`; isso não é, por definição, segredo administrativo, mas amarra o build ao projeto atual e exige que RLS/grants sejam sempre tratados como a barreira de autorização. Não foi encontrado uso de `service_role`, SDK Supabase ou `auth.uid()`.

### 2.4 Inventário de variáveis, sem valores

| Nome | Local esperado/encontrado | Classificação atual |
| --- | --- | --- |
| `GEMINI_API_KEY` | `.env.example`, Vercel Secrets e leitura em `api/compiler-models.js`/`api/health.js` | segredo da plataforma; somente backend |
| `GEMINI_MODEL` | `.env.example`, Vercel e leitura em `api/generate.js` | configuração não secreta; ainda submetida à allowlist |
| `SUPABASE_URL` | `.env.example`, Vercel e default em `api/knowledge-base.js` | identificador público |
| `SUPABASE_PUBLISHABLE_KEY` | `.env.example`, Vercel e default em `api/knowledge-base.js` | chave publicável; segurança depende de RLS/grants |
| `USER_CREDENTIALS_MASTER_KEY` | somente planejada para Vercel Secrets no passo 14 | **não existe atualmente** |

Também não existe `USER_CREDENTIALS_KEY_VERSION`, armazenamento de chaves por usuário, tabela de credenciais, ciphertext, código AES/HKDF nem variável BYOK. Nenhum valor de variável é reproduzido neste documento.

## 3. Arquitetura-alvo validada

1. **Identidade e sessão:** Supabase Auth por e-mail/senha. A senha é enviada apenas ao Supabase Auth e nunca é armazenada ou registrada pela aplicação.
2. **Modo anônimo:** compilador local determinístico continua disponível sem conta e sem chamadas ao cofre.
3. **Recursos protegidos:** cadastrar, listar metadados, testar, remover e usar BYOK exige JWT válido.
4. **Autorização em profundidade:** o backend deriva `user_id` apenas do JWT validado e usa um cliente Supabase no contexto desse JWT, preservando RLS por `auth.uid()`. IDs enviados pelo cliente são localizadores, nunca prova de propriedade.
5. **Persistência:** o banco recebe somente ciphertext, IV, tag, versão criptográfica e metadados mínimos. Nunca recebe plaintext.
6. **Criptografia:** AES-256-GCM com IV aleatório por gravação; subchave por usuário via HKDF-SHA-256; AAD canônica inclui usuário, provedor, ID da credencial e versão de esquema.
7. **Raiz de confiança:** `USER_CREDENTIALS_MASTER_KEY` existe apenas como segredo da Vercel e não é enviada ao Supabase ou navegador.
8. **Uso:** o backend lê somente a linha do usuário, autentica/decriptografa em memória, chama um host HTTPS pré-cadastrado e descarta referências ao segredo no `finally` (reconhecendo que garbage collection não garante apagamento físico imediato em JavaScript).
9. **Resposta:** nenhuma API retorna plaintext, ciphertext, IV ou tag; apenas status, rótulo, provedor, timestamps e dica mascarada mínima.
10. **Provedores:** OpenRouter é o primeiro adaptador. Um registry controlado pelo servidor relaciona slug, hosts, métodos, esquema de autenticação, capacidades e modelos permitidos. `base_url` do catálogo não deve ser editável por usuário nem usado sem validação contra a allowlist compilada/versionada.
11. **Privilégio:** o fluxo normal não usa `service_role`. Operações do usuário rodam sob seu JWT e RLS. Eventual tarefa administrativa excepcional deve ser separada, mínima e documentada.

## 4. Fronteiras de confiança

| Fronteira | Dados que atravessam | Contrato obrigatório |
| --- | --- | --- |
| Navegador ↔ Supabase Auth | e-mail, senha, tokens/sessão | TLS; SDK oficial; senha nunca passa pelo backend da aplicação; evitar armazenamento acessível a scripts quando uma alternativa segura compatível estiver definida. |
| Navegador ↔ API Vercel | JWT, briefing, seleção, chave somente no cadastro/teste | HTTPS; mesmos origins esperados; limite de corpo; schema estrito; nunca logar corpo ou Authorization. |
| API Vercel ↔ Supabase | chave publicável, JWT do usuário, ciphertext/metadados | TLS; RLS e grants; queries sempre vinculadas ao usuário; sem `service_role` no fluxo normal. |
| API Vercel ↔ Vercel Secrets | chave-mestra/versão | somente runtime backend; acesso operacional mínimo e auditado. |
| API Vercel ↔ provedor | chave BYOK em header e payload de geração necessário | host/método fixos por adaptador; TLS; timeout; sem redirects para hosts não permitidos; sem query string secreta. |
| Código/logs/telemetria | metadados operacionais | nunca incluir senha, JWT, Authorization, chave, ciphertext, briefing ou prompt completo. |

O navegador é não confiável; DOM, body, headers encaminhados e IDs podem ser adulterados. O Supabase público também deve ser considerado acessível por atacantes com a chave publicável. RLS, validação de JWT e criptografia de aplicação são controles complementares, não intercambiáveis.

## 5. Fluxos de segurança

### 5.1 Login

1. A interface coleta e-mail e senha e chama Supabase Auth diretamente por TLS.
2. O Auth valida identidade, confirmação de e-mail e política de sessão; a aplicação recebe a sessão, não a senha persistida.
3. A interface mantém estado de autenticação separado do estado do compilador local.
4. Em chamada protegida, envia o access token no header `Authorization`; nunca em URL.
5. O backend valida assinatura, emissor, audiência, expiração e usuário do JWT antes de executar qualquer operação BYOK.
6. Logout invalida/encerra a sessão conforme suporte do Auth e limpa estado sensível da tela.

### 5.2 Gravação/substituição futura de chave

1. Usuário autenticado escolhe um `provider_slug` conhecido e digita a chave em campo de senha sem autocomplete indevido.
2. O frontend envia uma única requisição HTTPS protegida; limpa imediatamente o valor de seu estado e DOM ao final, inclusive em erro.
3. O backend aplica limite de corpo, schema estrito, reautorização e rate limit; deriva usuário exclusivamente do JWT.
4. O registry resolve o provedor e rejeita IDs/URLs desconhecidos. Validação remota, se usada, tem timeout e resposta sanitizada.
5. O backend gera o ID da credencial e IV aleatório, deriva a subchave por HKDF e cifra com AAD canônica via AES-256-GCM.
6. Um upsert sob o JWT do usuário grava somente ciphertext/tag/IV/versões e metadados permitidos. A constraint única impede duplicidade usuário/provedor.
7. A resposta contém somente metadados mascarados. Plaintext e buffers temporários são sobrescritos quando tecnicamente possível e perdem referência em `finally`.

Substituição deve ser atômica: a credencial antiga permanece utilizável se validação/cifragem/gravação da nova falhar. Não registrar a chave nem ecoar erros do fornecedor.

### 5.3 Uso futuro da chave

1. `/api/generate` valida JWT, provider/modelo em allowlist e autorização de uso.
2. A consulta usa JWT/RLS e seleciona uma única credencial do usuário/provedor, com colunas explícitas.
3. O backend seleciona a chave-mestra pela `key_version`, recompõe a AAD e autentica/decriptografa. Falha de tag termina de modo seguro, sem fallback pago.
4. O adaptador envia a chave apenas em header exigido para um host HTTPS fixo, com redirects desabilitados/validados, timeout, limite de resposta e retry seguro.
5. O resultado sanitizado volta ao usuário. A chave não integra prompt, URL, resposta, exceção ou telemetria.
6. Na ausência/invalidade da chave, o sistema informa o estado e oferece fallback **local**; não troca silenciosamente para chave da plataforma ou outro BYOK.

### 5.4 Reset destrutivo

Recuperação de senha e alteração voluntária são fluxos distintos:

- **alteração voluntária:** exige sessão válida e confirmação recente da senha atual; como a chave de dados deriva da chave-mestra e do `user_id`, não da senha, o cofre pode ser preservado;
- **esqueci minha senha:** antes de liberar novamente recursos BYOK, a interface exibe aviso inequívoco. Após o retorno autenticado de recuperação, um estado de recuperação verificável bloqueia o uso do cofre; o backend apaga todas as credenciais do `auth.uid()` e registra apenas o evento não sensível. Somente após confirmação do delete o estado BYOK é reabilitado.

Não se deve confiar em uma flag do navegador para distinguir recuperação. O passo 16 deverá definir e testar um marcador server-side/idempotente ligado ao usuário e à sessão/evento de recovery. Se a ordem exata oferecida pelo Supabase não permitir apagar antes da troca de senha, “antes de concluir” significa bloquear todo acesso ao cofre desde a sessão de recovery e concluir a retomada da aplicação apenas depois do delete. Falha parcial mantém o cofre bloqueado e permite repetir o delete; jamais restaura ou revela chaves antigas.

## 6. Modelo de ameaça e controles exigidos

| Ameaça | Exposição atual/futura | Controle contratado |
| --- | --- | --- |
| XSS | Um XSS futuro na tela de chave pode capturar plaintext/JWT antes do envio. Hoje a renderização dinâmica usa majoritariamente `textContent`, mas não há CSP. | Não usar HTML de fornecedor/usuário; CSP restrita em `vercel.json`; dependências mínimas; sanitização; testes de payload; limpar campo; evitar scripts de terceiros na área do cofre. |
| CSRF | Endpoints atuais são anônimos. Será aplicável sobretudo se sessão usar cookies; bearer explícito reduz CSRF, mas não XSS. | Preferir header bearer do SDK; validar `Origin` nos métodos mutáveis; cookies, se adotados, `Secure`, `HttpOnly`, `SameSite` e token anti-CSRF; nunca aceitar GET mutável. |
| IDOR | IDs de credencial/provedor serão manipuláveis. | Usuário somente do JWT; RLS por `auth.uid()`; filtro composto proprietário+ID; respostas 404/403 não enumeráveis; testes com dois usuários. |
| RLS incorreta | A chave publicável e PostgREST são públicos; uma policy ruim expõe ciphertext/metadados. | RLS habilitada antes de grants, policies explícitas por operação, `WITH CHECK`, `FORCE ROW LEVEL SECURITY` quando apropriado, testes anon/A/B e auditoria de grants/functions/views. |
| Authorization exposto | Pode vazar por logs, exceptions, proxy, analytics ou redirects. | Redação central de headers/erros, nunca logar request/response completos, sem token em URL, CORS restrito, redirects externos bloqueados e testes canário. |
| Logs/stack traces | Erros de SDK/crypto/provedor podem conter request config. | Error taxonomy própria, respostas genéricas, logging allowlist, sem serializar `error`, headers ou bodies; stack somente em ambiente controlado e sanitizado. |
| SSRF | `base_url` arbitrária pode atingir metadata/rede interna ou exfiltrar chave. | Registry server-side com origem e path permitidos; apenas HTTPS; resolver/bloquear IP privado/link-local; sem URL do cliente; validar cada redirect ou desabilitá-lo. |
| Provider spoofing | Slug/modelo/base URL divergentes podem enviar chave ao host errado. | Relacionamento FK + slug imutável; adaptador e host associados em código/versionamento; catálogo de banco não é autoridade única para destino; binding do provedor na AAD. |
| Plaintext acidental | Banco, debug, fixtures, estado, crash dump ou analytics. | Cifrar antes da persistência; DTOs separados; proibir dump de segredo; scans automatizados; testes que interceptam persistência/logs/respostas; retenção mínima. `secret_last4` deve ser tratado como dado sensível mascarado. |
| Replay | Repetição de PUT/test/delete pode gerar efeitos/custo. | Sessão recente para operações críticas, idempotência no upsert/delete, nonce/idempotency key curto para testes remotos, janela temporal e rate limit distribuído. Não alegar proteção completa apenas com TLS. |
| Abuso de teste | Endpoint pode virar proxy caro e validar chaves roubadas. | Autenticação, quotas por usuário/IP/provedor, cooldown, uma operação mínima e não generativa quando disponível, limite de concorrência, sem resposta bruta, telemetria e circuit breaker. |
| Fallback caro | Falha BYOK pode consumir chave da plataforma/outro usuário. | Fallback somente local por padrão; consentimento e flag explícitos para qualquer cota patrocinada; orçamento/quota e indicação clara da origem. |
| Rotação da chave-mestra | Troca abrupta inutiliza ciphertext; chave comprometida exige recriptografia. | `key_version`, keyring temporário, recriptografia autenticada e idempotente, métricas sem segredo, verificação antes de retirar chave antiga e rollback definido. |
| Reset sem destruição | Recovery pode preservar chaves contra o contrato do produto. | Marcador server-side de recovery, bloqueio do cofre, delete por `auth.uid()`, idempotência e testes end-to-end de falha parcial. |
| Alteração de ciphertext | Banco comprometido pode adulterar material. | GCM + AAD canônica; tratar falha de autenticação como credencial indisponível; nunca tentar plaintext/fallback de versão. |

Riscos adicionais: rate limit atual é local à instância e facilmente distribuível; `/api/health` não restringe método; não existe CSP; defaults Supabase criam acoplamento operacional; e a geração Gemini pública pode causar custo enquanto não houver política explícita de fallback/cota.

## 7. Requisitos de RLS e banco para o passo 13

### `api_providers`

- RLS habilitada; `anon` e `authenticated` recebem apenas `SELECT` de registros ativos.
- Nenhuma escrita pública. Seeds/alterações ocorrem por migration auditável.
- Slug único, categoria e capacidades com checks; URLs somente HTTPS e revisadas. Ainda assim, o backend usa sua própria allowlist de host.

### `user_api_credentials`

- FK `user_id → auth.users(id) ON DELETE CASCADE`, FK de provedor e `UNIQUE(user_id, provider_id)`.
- RLS habilitada antes de liberar acesso; `anon` sem grants/policies.
- Policies separadas para `authenticated`: `SELECT` e `DELETE` com `USING (auth.uid() = user_id)`; `INSERT` com `WITH CHECK`; `UPDATE` com ambos `USING` e `WITH CHECK`.
- `user_id` não pode ser alterado para transferir uma linha; backend nunca o aceita do body.
- Respostas REST/backend usam lista explícita de colunas e jamais devolvem `ciphertext`, `iv` ou `auth_tag`.
- Testes executados com anon, usuário A e usuário B para todas as operações, IDs inexistentes e tentativas de trocar `user_id`/`provider_id`.
- Grants em sequences, functions e views também devem ser auditados; nenhuma view `security_definer` deve contornar RLS sem justificativa e teste.

## 8. Requisitos criptográficos para o passo 14

- `USER_CREDENTIALS_MASTER_KEY`: exatamente 32 bytes aleatórios codificados em base64, validada no boot/primeiro uso; não reutilizar string textual como chave.
- HKDF-SHA-256: salt versionado e definido pelo protocolo (não secreto, distinto por versão); `info` com domínio da aplicação e `user_id` em codificação canônica; saída de 32 bytes.
- AES-256-GCM: IV aleatório de 96 bits por gravação, tag de 128 bits e chave nunca reutilizada com o mesmo IV.
- AAD canônica, sem concatenação ambígua: versão do esquema, ID da credencial, UUID do usuário e ID/slug imutável do provedor. Mesmo bytes devem ser recompostos na leitura.
- Campos binários codificados em base64 e validados por tamanho/formato antes da decriptação.
- Key version obrigatória; formatos desconhecidos falham fechados.
- Testes: round-trip, usuários/provedores diferentes, IV único, chave/AAD/tag/ciphertext adulterados, versão desconhecida, master key malformada, ausência de plaintext em mocks de banco/log/resposta.

Derivar por usuário limita a reutilização acidental entre contas, mas não protege contra comprometimento da chave-mestra e ciphertext conjuntamente. A separação de acesso, rotação e monitoramento continua obrigatória.

## 9. Rotação da chave-mestra

1. Manter um keyring backend com versão ativa para escrita e versões anteriores somente para leitura; cada versão é um segredo Vercel separado ou um formato operacional que não exponha valores.
2. Publicar primeiro o código que lê versão antiga e nova, sem alterar linhas.
3. Adicionar a nova chave em Preview, executar testes de round-trip/tamper e um ensaio com dados descartáveis.
4. Tornar a nova versão ativa para novas gravações.
5. Recriptografar linhas em lotes pequenos: ler sob JWT/processo administrativo estritamente desenhado, autenticar com versão antiga, cifrar com novo IV/AAD e atualizar atomicamente com compare-and-swap da versão.
6. Verificar contagens e fazer leitura de todas as linhas migradas sem registrar conteúdo.
7. Repetir de forma idempotente até zero linhas antigas; aguardar janela de rollback antes de remover a chave antiga.
8. Remover a chave antiga da Vercel apenas após backup/rollback aprovado e auditoria. Rotação emergencial exige revogar acesso e pode exigir invalidar/destruir o cofre se a confidencialidade não puder ser garantida.

## 10. Estratégia de rollback

**Deste passo 11:** reverter o commit documental. Não há rollback remoto, de schema ou runtime porque nenhuma infraestrutura/código de produção foi alterada.

**Dos passos futuros:** migrations devem ter plano reversível testado em ambiente descartável. Em incidentes, desligar BYOK por flag server-side e manter compilador local, sem redirecionar para provedor pago. Nunca fazer downgrade de ciphertext para plaintext. Se uma release não ler uma nova `key_version`, restaurar primeiro a versão de código compatível e preservar o keyring; não apagar a chave antiga até validar a recuperação. Exclusão destrutiva do cofre não tem rollback e precisa de confirmação explícita.

## 11. Mapa previsto de arquivos — passos 12 a 20

Este mapa é previsão de impacto, não autorização para implementar tudo de uma vez:

| Passo | Arquivos existentes prováveis | Novos artefatos prováveis |
| --- | --- | --- |
| 12 — Auth | `package.json`, `package-lock.json`, `index.html`, `src/main.js`, `src/style.css`, `.env.example`, `CONFIGURACAO_APIS.md`, testes | módulos `src/auth*`/`src/supabase*` e testes de sessão |
| 13 — schema/RLS | `PROJECT_GUIDE.md`, testes | nova migration em `supabase/migrations/` e testes estáticos/RLS |
| 14 — crypto | `.env.example`, `CONFIGURACAO_APIS.md`, `package.json` se necessário | utilitários backend de crypto/cofre e testes unitários |
| 15 — gestão | `index.html`, `src/main.js`, `src/style.css`, `vercel.json` | rotas de providers/credentials e módulos de UI |
| 16 — recovery | frontend/auth, configuração e documentação | rota de reset-vault, estado server-side e testes E2E/contrato |
| 17 — OpenRouter | `api/generate.js`, catálogos, documentação | registry/contrato e adaptador OpenRouter com testes |
| 18 — diretos | registry, geração, configuração | adaptadores por provedor e testes de contrato |
| 19 — hardening | `vercel.json`, frontend, todas as rotas/testes | suíte de segurança, RLS e abuso; rate limit distribuído |
| 20 — rollout | `.env.example`, `CONFIGURACAO_APIS.md`, `AUDITORIA_FINAL.md`, `PROJECT_GUIDE.md` | runbook de rollout/rollback e evidências de Preview |

O **Passo 12**, especificamente, deve começar por `package.json`, `package-lock.json`, `index.html`, `src/main.js`, `src/style.css`, `.env.example`, `CONFIGURACAO_APIS.md` e testes; poderá criar módulos pequenos de cliente Supabase, estado de sessão e UI de conta. Não deve criar ainda as tabelas do cofre nem criptografia.

## 12. Riscos e decisões ainda não resolvidos

- formato exato e armazenamento da sessão no navegador, inclusive trade-off entre persistência, XSS e experiência;
- política de CSP compatível com Supabase Auth/Vercel e ausência de scripts de terceiros;
- protocolo server-side que distingue recovery destrutivo de alteração voluntária de senha;
- política de reautenticação, MFA e duração de sessão para operações do cofre;
- rate limit/quota distribuídos, retenção de telemetria e resposta a abuso;
- política final da chave Gemini da plataforma e orçamento explícito;
- propriedade operacional e procedimento de emergência/escrow da chave-mestra sem permitir recuperação de segredo de usuário;
- mecanismo seguro e testável para job de rotação sem tornar `service_role` parte do fluxo normal;
- validação dos links/hosts/modelos OpenRouter imediatamente antes de implementar o adaptador;
- limites de payload/resposta por rota/provedor e política de retry para operações não idempotentes;
- política de exclusão de conta, backup e prazo de remoção de ciphertext em backups;
- valor informacional e privacidade de `secret_last4`, labels, status e timestamps;
- CORS/origens de Preview e Production e confiança no `x-forwarded-for` fornecido pela Vercel.

## 13. Parecer do passo 11

**Aprovado para avançar somente ao Passo 12**, preservando o compilador local e os contratos acima. A aprovação não afirma que BYOK já é seguro ou implementado. Antes de produção BYOK ainda são obrigatórios Auth, schema/RLS, criptografia, gestão, recovery destrutivo, OpenRouter, testes com dois usuários, CSP, rate limit distribuído, rotação ensaiada e rollout em Preview.
