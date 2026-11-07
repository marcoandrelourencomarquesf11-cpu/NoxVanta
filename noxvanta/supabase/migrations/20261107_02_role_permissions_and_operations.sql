
-- PASSO 2 — executar APENAS depois do passo 1 ter terminado com sucesso.
-- Migração incremental: preserva utilizadores, Owner atual e registos existentes.

create or replace function public.nxv_is_owner()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.profiles where id = auth.uid() and role::text = 'owner') $$;

create or replace function public.nxv_is_member()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.profiles where id = auth.uid() and role::text in ('owner','sub_owner','igl','strategist','player','substitute')) $$;

create or replace function public.nxv_can_manage_content()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.profiles where id = auth.uid() and role::text in ('owner','sub_owner','admin')) $$;

create or replace function public.nxv_can_manage_competitive()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.profiles where id = auth.uid() and role::text in ('owner','sub_owner','igl')) $$;

create or replace function public.nxv_can_manage_recruitment()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.profiles where id = auth.uid() and role::text in ('owner','sub_owner','recruiter')) $$;

create or replace function public.nxv_can_manage_roster()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.profiles where id = auth.uid() and role::text in ('owner','sub_owner','igl')) $$;

create or replace function public.nxv_can_manage_strategies()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.profiles where id = auth.uid() and (role::text in ('owner','sub_owner','igl') or (role::text = 'strategist' and can_manage_strategies))) $$;

-- Protege cargos elevados e impede auto-promoção.
create or replace function public.nxv_protect_profile_privileges()
returns trigger language plpgsql security definer set search_path = public
as $$ begin
  if auth.uid() = old.id then
    if new.role is distinct from old.role or new.can_manage_strategies is distinct from old.can_manage_strategies then
      raise exception 'Não podes alterar as tuas próprias permissões.';
    end if;
  end if;

  if auth.uid() is not null and new.role::text in ('owner','sub_owner','recruiter') and not public.nxv_is_owner() then
    raise exception 'Só o Owner pode atribuir este cargo.';
  end if;

  if auth.uid() is not null and new.role is distinct from old.role and not public.nxv_is_owner() then
    if not public.nxv_can_manage_roster() then
      raise exception 'Sem permissão para alterar cargos.';
    end if;

    if exists(select 1 from public.profiles where id = auth.uid() and role::text = 'igl')
       and new.role::text not in ('player','substitute','strategist') then
      raise exception 'O IGL só pode organizar titulares, suplentes e estrategistas.';
    end if;

    if exists(select 1 from public.profiles where id = auth.uid() and role::text = 'sub_owner')
       and new.role::text not in ('igl','player','substitute','strategist') then
      raise exception 'O Sub-owner não pode atribuir cargos reservados ao Owner.';
    end if;
  end if;

  if auth.uid() is not null and new.can_manage_strategies is distinct from old.can_manage_strategies and not public.nxv_is_owner() then
    raise exception 'Só o Owner pode alterar permissões estratégicas.';
  end if;

  return new;
end $$;

drop trigger if exists nxv_profile_privileges_guard on public.profiles;
create trigger nxv_profile_privileges_guard
before update on public.profiles
for each row execute procedure public.nxv_protect_profile_privileges();

-- Perfis: leitura pública limitada ao roster; gestão vê todos para organizar a equipa.
drop policy if exists "public roster and own profile" on public.profiles;
drop policy if exists "profiles update safe self" on public.profiles;
drop policy if exists "public roster and authorized profiles" on public.profiles;
drop policy if exists "self or team manager profile update" on public.profiles;

create policy "public roster and authorized profiles"
on public.profiles
for select to anon, authenticated
using (
  role::text in ('igl','strategist','player','substitute')
  or id = auth.uid()
  or public.nxv_can_manage_roster()
);

create policy "self or team manager profile update"
on public.profiles
for update to authenticated
using (id = auth.uid() or public.nxv_can_manage_roster())
with check (id = auth.uid() or public.nxv_can_manage_roster());

-- Resultados: Owner, Sub-owner e IGL podem criar, corrigir e eliminar partidas.
drop policy if exists "content managers matches insert" on public.matches;
drop policy if exists "content managers matches update" on public.matches;
drop policy if exists "content managers matches delete" on public.matches;
drop policy if exists "competitive managers matches insert" on public.matches;
drop policy if exists "competitive managers matches update" on public.matches;
drop policy if exists "competitive managers matches delete" on public.matches;

create policy "competitive managers matches insert"
on public.matches for insert to authenticated
with check (public.nxv_can_manage_competitive());

create policy "competitive managers matches update"
on public.matches for update to authenticated
using (public.nxv_can_manage_competitive())
with check (public.nxv_can_manage_competitive());

create policy "competitive managers matches delete"
on public.matches for delete to authenticated
using (public.nxv_can_manage_competitive());

-- Recrutamento: Owner, Sub-owner e Recrutadores consultam e decidem candidaturas.
drop policy if exists "managers read applications" on public.applications;
drop policy if exists "managers update applications" on public.applications;
drop policy if exists "managers delete applications" on public.applications;
drop policy if exists "recruiters and leaders read applications" on public.applications;
drop policy if exists "recruiters and leaders update applications" on public.applications;

create policy "recruiters and leaders read applications"
on public.applications for select to authenticated
using (public.nxv_can_manage_recruitment());

create policy "recruiters and leaders update applications"
on public.applications for update to authenticated
using (public.nxv_can_manage_recruitment())
with check (public.nxv_can_manage_recruitment());

-- Recrutadores só podem atualizar a coluna status, não os dados pessoais submetidos.
revoke update on public.applications from authenticated;
grant update (status) on public.applications to authenticated;

-- Os privilégios da tabela profiles já são concedidos no schema inicial.
