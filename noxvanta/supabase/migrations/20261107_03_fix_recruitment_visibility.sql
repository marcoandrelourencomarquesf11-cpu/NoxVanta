-- PASSO 3 — corrigir a consulta das candidaturas na Gestão.
-- Seguro para executar mais do que uma vez. Não apaga candidaturas nem perfis.

-- Owner, Sub-owner e Recrutadores podem consultar e atualizar apenas o estado.
create or replace function public.nxv_can_manage_recruitment()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid()
      and role::text in ('owner', 'sub_owner', 'recruiter')
  )
$$;

alter table public.applications enable row level security;

-- Remover políticas antigas com nomes usados pelas versões anteriores.
drop policy if exists "public submit applications" on public.applications;
drop policy if exists "managers read applications" on public.applications;
drop policy if exists "managers update applications" on public.applications;
drop policy if exists "managers delete applications" on public.applications;
drop policy if exists "recruiters and leaders read applications" on public.applications;
drop policy if exists "recruiters and leaders update applications" on public.applications;
drop policy if exists "nxv public submit applications" on public.applications;
drop policy if exists "nxv recruitment managers read" on public.applications;
drop policy if exists "nxv recruitment managers update status" on public.applications;

-- O formulário público pode inserir candidaturas; não pode consultá-las.
create policy "nxv public submit applications"
on public.applications for insert to anon, authenticated
with check (true);

create policy "nxv recruitment managers read"
on public.applications for select to authenticated
using (public.nxv_can_manage_recruitment());

create policy "nxv recruitment managers update status"
on public.applications for update to authenticated
using (public.nxv_can_manage_recruitment())
with check (public.nxv_can_manage_recruitment());

-- Restringir a alteração às decisões de recrutamento.
revoke all on public.applications from anon;
grant insert on public.applications to anon, authenticated;
grant select on public.applications to authenticated;
revoke update on public.applications from authenticated;
grant update (status) on public.applications to authenticated;
