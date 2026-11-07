# NoxVanta

1. `npm install`
2. Copie `.env.example` para `.env.local` e preencha.
3. No Supabase, rode o `supabase.sql` (SQL Editor).
4. Crie sua conta no site, pegue o Account_ID no Perfil e rode no SQL Editor:
   `update profiles set role = 'admin' where account_id = 'SEU-ID';`
5. `npm run dev` e abra http://localhost:3000
6. Deploy: suba no GitHub, importe na Vercel e cadastre as 3 variáveis de ambiente.
