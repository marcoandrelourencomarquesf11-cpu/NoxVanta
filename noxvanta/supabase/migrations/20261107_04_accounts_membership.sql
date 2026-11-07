-- PASSO 4 — contas próprias, candidatura associada e acesso por Account_ID.
-- Migração incremental: não apaga utilizadores, perfis, candidaturas nem o Owner atual.

alter table public.applications
  add column if not exists user_id uuid references auth.users(id) on delete set null;

create index if not exists applications_user_id_idx on public.applications(user_id);
create unique index if not exists applications_one_active_account_idx
  on public.applications(user_id) where user_id is not null and status <> 'Reprovada';

create or replace function public.nxv_can_manage_recruitment()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role::text in ('owner','sub_owner','recruiter'))
$$;

alter table public.applications enable row level security;
drop policy if exists "public submit applications" on public.applications;
drop policy if exists "application submit" on public.applications;
drop policy if exists "application read management" on public.applications;
drop policy if exists "application update management" on public.applications;
drop policy if exists "nxv public submit applications" on public.applications;
drop policy if exists "recruiters and leaders read applications" on public.applications;
drop policy if exists "recruiters and leaders update applications" on public.applications;
drop policy if exists "managers read applications" on public.applications;
drop policy if exists "managers update applications" on public.applications;
drop policy if exists "nxv recruitment managers read" on public.applications;
drop policy if exists "nxv recruitment managers update status" on public.applications;
drop policy if exists "nxv authenticated submit own application" on public.applications;
drop policy if exists "nxv recruitment managers read linked applications" on public.applications;
drop policy if exists "nxv recruitment managers update linked applications" on public.applications;

create policy "nxv authenticated submit own application"
on public.applications for insert to authenticated
with check (auth.uid() is not null and user_id = auth.uid());

create policy "nxv recruitment managers read linked applications"
on public.applications for select to authenticated
using (public.nxv_can_manage_recruitment());

create policy "nxv recruitment managers update linked applications"
on public.applications for update to authenticated
using (public.nxv_can_manage_recruitment())
with check (public.nxv_can_manage_recruitment());

revoke all on public.applications from anon;
revoke insert, update, delete on public.applications from authenticated;
grant insert (user_id,nickname,age,country,current_rank,peak_rank,main_role,agents,competitive_experience,availability,discord,introduction) on public.applications to authenticated;
grant select on public.applications to authenticated;
grant update (status) on public.applications to authenticated;

-- Cada utilizador autenticado pode consultar o próprio perfil/Account_ID.
-- O Owner mantém acesso de leitura e escrita aos perfis para atribuir cargos.
