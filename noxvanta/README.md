# NOXVANTA — NXV | VALORANT Esports

Projeto Next.js + TypeScript + Supabase, preparado para deployment na Vercel.

## Incluído
- Website público responsivo com PT-PT, EN e ES.
- Páginas de equipa, jogos, notícias e recrutamento.
- Supabase Auth: login, logout, recuperação e sessão persistente.
- Área privada e centro de operações com permissões separadas para Owner, Sub-owner, IGL e Recrutadores.
- Registo, correção e remoção de resultados; atualização pública automática.
- Plantel público com titulares e banco de reservas; gestão de cargos e função no jogo.
- Aprovação/reprovação de candidaturas por Recrutadores e liderança.
- Tactical Hub privado com quadro tático próprio: marcadores, linhas, notas, guardar, editar, eliminar e exportar PNG.
- SQL com tabelas, trigger de perfil, RLS e políticas.
- Conteúdo inicial de demonstração identificado como demonstração.

## Requisitos
- Node.js 20.9 ou superior.
- Projeto Supabase.
- Conta GitHub e Vercel.

## Instalação local
1. Descompacte o ZIP.
2. Abra a pasta do projeto num terminal.
3. Execute `npm install`.
4. Copie `.env.example` para `.env.local`.
5. Preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` com os dados do seu projeto Supabase.
6. No Supabase, abra SQL Editor e execute `supabase/schema.sql`.
7. Execute primeiro `supabase/migrations/20261107_01_add_extended_roles.sql` isoladamente. Aguarda a conclusão com sucesso.
8. Numa execução separada, execute `supabase/migrations/20261107_02_role_permissions_and_operations.sql`.
9. Execute `npm run dev` e abra `http://localhost:3000`.

## Criar o primeiro Owner
1. Crie primeiro uma conta através de Supabase Authentication > Users > Add user (ou registe-se pela página `/login`).
2. Confirme o utilizador e copie o respetivo UUID.
3. No Supabase SQL Editor, execute, substituindo o UUID:
   ```sql
   update public.profiles
   set role = 'owner', can_manage_strategies = true
   where id = 'UUID-DO-SEU-UTILIZADOR';
   ```
4. O update é feito no SQL Editor com privilégios de projeto. Os utilizadores normais não podem alterar a própria função.
5. Saia e entre novamente no website.

## Funções e permissões
- `owner`: controlo total e único cargo que pode atribuir Sub-owner ou Recrutador.
- `sub_owner`: gestão geral da organização e do plantel, sem poder atribuir outro Sub-owner nem alterar o cargo Owner.
- `igl`: pode gerir resultados, plantel e estratégias.
- `recruiter`: pode consultar candidaturas e aprovar/reprovar candidatos; não gere partidas nem cargos.
- `strategist`: pode gerir estratégias quando `can_manage_strategies = true`.
- `player` e `substitute`: aparecem respetivamente em Titulares e Banco de reservas.
- `pending`: conta ainda sem acesso ao plantel privado.

A página Centro de operações mostra ferramentas de acordo com o cargo. Owner, IGL e Sub-owner podem publicar, corrigir e eliminar resultados. Owner, Sub-owner e Recrutador podem rever candidaturas. O Owner atribui os cargos de Sub-owner e Recrutador; o IGL/Sub-owner podem organizar titulares, suplentes e funções de jogo. A aprovação de uma candidatura regista a decisão, mas não cria automaticamente uma conta de acesso.

### Atualizar uma instalação já existente
Como a base de dados já foi criada e o Owner já existe, **não voltes a executar `supabase/schema.sql`**. No Supabase, abre SQL Editor e executa o ficheiro `20261107_01_add_extended_roles.sql` isoladamente. Depois de concluir com sucesso, executa o ficheiro `20261107_02_role_permissions_and_operations.sql` numa segunda execução. Esta atualização preserva utilizadores, resultados e candidaturas já existentes. Depois, atualiza o código no GitHub para a Vercel fazer o deploy.

Para atribuir cargos, o Owner pode editar a equipa no Centro de operações. A promoção para Sub-owner ou Recrutador só aparece na sessão do Owner.

## Vercel
Importe o repositório GitHub na Vercel, adicione as duas variáveis de ambiente indicadas em `.env.example`, e faça Deploy. O SQL deve ser executado no Supabase antes do primeiro uso.

## Mapas e recursos visuais
O Tactical Hub já permite selecionar mapas e carregar um minimapa que a organização esteja autorizada a utilizar. Para isso, coloca o ficheiro em `public/maps` e indica o caminho no editor (por exemplo `/maps/ascent.png`). Os mapas e elementos visuais de VALORANT pertencem à Riot Games; por isso, os ficheiros oficiais não estão incluídos no ZIP. A política da Riot limita projetos comerciais e projetos ligados a empresas/entidades sem autorização escrita. Confirma a elegibilidade da NOXVANTA antes de publicar assets oficiais. O site inclui uma nota de não afiliação à Riot Games.

## Segurança
- RLS ativado nas tabelas.
- Candidaturas não são públicas.
- Estratégias, calendário interno e comunicados internos exigem autenticação.
- Mensagens para Owner são visíveis apenas ao Owner.
- Funções e permissões não podem ser alteradas pelo perfil do utilizador.
- Nunca publique uma chave `service_role` no frontend ou no GitHub.

## Verificações
Foi feita uma revisão estática dos ficheiros e das relações entre rotas, imports, variáveis e políticas SQL. A compilação final e o teste de autenticação real exigem instalar dependências e ligar este projeto ao seu próprio Supabase; não são declarados como executados neste ambiente.


## Limitações conhecidas desta primeira entrega
- O seletor de idioma traduz a navegação principal; parte dos textos internos das páginas ainda está em português. A internacionalização integral de todo o conteúdo deve ser concluída antes de apresentar o website como totalmente trilingue.
- O Centro de operações permite criar, corrigir e eliminar resultados, atualizar estados das candidaturas e organizar cargos e funções do plantel. A publicação de notícias e a gestão editorial avançada ainda não têm um editor completo.
- O Tactical Hub inclui criação, edição de estratégias guardadas, remoção e exportação PNG. Os minimapas oficiais não são distribuídos com o projeto; devem ser fornecidos pela organização depois da verificação dos direitos de utilização.
- Owner, Sub-owner e IGL têm acesso de edição estratégica; estrategistas precisam de `can_manage_strategies=true`. Contas novas ficam `pending` até serem aprovadas.

## Atualização: perfil e Team Voice

Foram adicionadas as páginas privadas `/account/profile` e `/account/voice`, com ligações na área de membro.

- O perfil permite atualizar o nome de apresentação na tabela `profiles`.
- A alteração de email e palavra-passe usa `supabase.auth.updateUser`; a confirmação de email depende das definições de autenticação do projeto Supabase.
- A sessão usa os cookies SSR do Supabase e é renovada pelo middleware. Não guardes passwords manualmente no browser.

### Chamadas de voz reais (LiveKit)

A página Team Voice apresenta as salas e a estrutura visual, mas o áudio ainda não está ligado. Para chamadas reais entre vários utilizadores é necessário criar um projeto LiveKit, implementar um endpoint seguro de emissão de tokens no servidor e definir `LIVEKIT_URL`, `LIVEKIT_API_KEY` e `LIVEKIT_API_SECRET` apenas como variáveis privadas no servidor/Vercel. Nunca coloques `LIVEKIT_API_SECRET` em variáveis `NEXT_PUBLIC_*` nem no código do browser. As salas também devem validar cargos e identidade no servidor. Esta versão não simula uma chamada funcional sem essas credenciais.

### Mapas táticos

O Tactical Hub mantém o quadro de desenho e gravação de estratégias e permite associar uma imagem local de minimapa em `public/maps`. O ZIP não distribui mapas oficiais; confirma previamente os direitos de utilização.


## Correção da Gestão de Candidaturas

Executa no Supabase SQL Editor o ficheiro `supabase/migrations/20261107_03_fix_recruitment_visibility.sql`. A migração é incremental e não elimina candidaturas nem perfis. Depois, faz redeploy na Vercel. A Gestão passa a apresentar erros reais de leitura em vez de mostrar uma lista vazia silenciosamente.

## Mapas reais

O Tactical Hub tenta carregar automaticamente os minimapas do catálogo comunitário Valorant-API. É necessária ligação à Internet; existe um fundo de reserva se o serviço não responder. A Valorant-API não é oficial nem endossada pela Riot Games.
