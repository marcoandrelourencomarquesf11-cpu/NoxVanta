-- Cole no Supabase: SQL Editor > New query > Run

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text,
  rank text default '',
  role text not null default 'member',   -- member | player | recruiter | admin
  is_player boolean not null default false,
  account_id text unique not null
);

create table strategies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  content text not null,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table applications (
  id uuid primary key default gen_random_uuid(),
  applicant_id uuid references profiles(id) on delete cascade,
  desired_role text not null,
  message text,
  status text not null default 'pending', -- pending | approved | rejected
  reviewed_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- Cria perfil + Account_ID ao cadastrar
create or replace function handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, nickname, account_id)
  values (new.id, coalesce(new.raw_user_meta_data->>'nickname', 'Jogador'),
          'NVX-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6)));
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

create or replace function is_staff() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role in ('recruiter','admin'));
$$;
create or replace function is_member_player() returns boolean
language sql security definer stable set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and (is_player or role in ('player','recruiter','admin')));
$$;

alter table profiles enable row level security;
alter table strategies enable row level security;
alter table applications enable row level security;

create policy "ver perfil" on profiles for select using (auth.uid() = id or is_staff());
create policy "editar proprio perfil" on profiles for update using (auth.uid() = id);
-- usuário só pode editar nick e rank (nunca role/is_player)
revoke update on profiles from authenticated;
grant update (nickname, rank) on profiles to authenticated;

create policy "jogadores veem estrategias" on strategies for select using (is_member_player());
create policy "staff cria estrategias" on strategies for insert with check (is_staff());
create policy "staff apaga estrategias" on strategies for delete using (is_staff());

create policy "candidato cria" on applications for insert with check (auth.uid() = applicant_id);
create policy "ver candidaturas" on applications for select using (auth.uid() = applicant_id or is_staff());
create policy "staff decide" on applications for update using (is_staff());

create or replace function approve_application(app_id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare a applications%rowtype;
begin
  if not is_staff() then raise exception 'sem permissao'; end if;
  update applications set status = 'approved', reviewed_by = auth.uid()
   where id = app_id and status = 'pending' returning * into a;
  if a.id is null then return; end if;
  update profiles set role = case when role = 'member' then 'player' else role end, is_player = true
   where id = a.applicant_id;
end; $$;

-- Para tornar alguém recrutador/admin (rode manualmente, trocando o ID):
-- update profiles set role = 'admin' where account_id = 'NVX-XXXXXX';
