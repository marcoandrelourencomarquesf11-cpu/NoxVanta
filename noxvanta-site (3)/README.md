# NOXVANTA — site + API (Vercel)

Ficheiros (todos na RAIZ do repositório):
- `index.html`   site
- `api/index.js` servidor (contas, funções, táticas, candidaturas)
- `vercel.json`, `package.json`

## 1) GitHub
Cria o repositório e carrega estes ficheiros mantendo a pasta `api/` (Add file → Upload files, arrasta a pasta `api` inteira).
O `index.html` tem de aparecer logo na primeira página do repositório.

## 2) Vercel — importar
Add New → Project → importa o repositório. Framework Preset: **Other**. Build e Output vazios. Deploy.

## 3) Vercel — base de dados (obrigatório)
Projeto → **Storage** → Create Database / Marketplace → **Upstash for Redis** (plano gratuito) → liga ao projeto, ambientes Production + Preview.
Isto cria sozinho `KV_REST_API_URL` e `KV_REST_API_TOKEN`.

## 4) Vercel — variáveis do dono
Projeto → Settings → **Environment Variables**:
- `OWNER_USER` = o teu utilizador de dono (ex.: junior)
- `OWNER_PASS` = a tua palavra-passe (forte, 10+ caracteres)
- `OWNER_NAME` = nome mostrado (opcional, por omissão "Junior")

## 5) Redeploy
Deployments → ⋯ → **Redeploy** (as variáveis só entram num deploy novo).
Abre o site e entra com OWNER_USER / OWNER_PASS. A conta de dono é criada no primeiro login.

## Como adicionar jogadores
1. A pessoa cria conta no site e vê "O teu ID: NOX-XXXXXX" em Conta. Envia-te o ID.
2. Painel → "Tornar jogador pelo ID" → cola o ID, escolhe função e rank → Atribuir.
3. Sub-donos: Painel → Sub-donos (só o dono).

## Notas
- Tudo fica na base de dados (contas, funções, táticas, candidaturas). Palavras-passe com scrypt; sessões de 30 dias.
- Call: ligação direta entre browsers (PeerJS). Entram só integrantes (com função) que usem o mesmo código da call.
- Google/Apple: só referência; início de sessão com eles não está ativo.

## Recrutadores
- No Painel, atribui a função **Recrutador** a uma conta (pelo ID, ou na tabela de contas). Sub-donos também podem.
- Recrutadores veem a aba **Candidaturas**, onde aceitam ou recusam. Ao aceitar uma candidatura ligada a uma conta, a pessoa passa a jogador com a função escolhida (por omissão Suplente). Não veem o Painel nem as contas.
- Quando alguém envia candidatura com sessão iniciada, a candidatura fica ligada à conta dela.
