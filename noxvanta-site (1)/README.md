# NOXVANTA

Site estático (um único ficheiro: `index.html`). Sem build, sem dependências.

## Publicar no GitHub + Vercel
1. Cria um repositório novo no GitHub (ex.: `noxvanta-site`).
2. Carrega para lá estes ficheiros: `index.html`, `vercel.json`, `README.md`
   (GitHub → Add file → Upload files).
3. Em vercel.com → Add New → Project → importa o repositório.
4. Framework Preset: **Other**. Deixa Build Command e Output Directory vazios. Deploy.

## Login do dono (muda logo!)
- Utilizador: `dono`
- Palavra-passe: `Nox@2026`

## Limitações fora do claude.ai
- As contas, táticas e candidaturas ficam guardadas no **browser de cada pessoa** (localStorage), não são partilhadas entre dispositivos.
- O bloqueio de "inspecionar" é só dissuasor.
Para contas partilhadas e call a sério é preciso um back-end (ex.: Vercel + base de dados + WebRTC).

## Call (aba "Call")
- Funciona no Vercel com ligação direta entre browsers (PeerJS, servidor público gratuito para os apresentar uns aos outros).
- Escolhe um **código** secreto e dá-o só à equipa. Quem escrever o mesmo código entra na mesma sala (até 10 pessoas).
- Tem microfone, câmara e partilha de ecrã. Precisa de HTTPS (o Vercel já dá).
- Sem servidor TURN, algumas redes (empresas, escolas, 4G restrito) podem não ligar.
