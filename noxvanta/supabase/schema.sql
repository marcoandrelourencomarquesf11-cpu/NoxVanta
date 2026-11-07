-- NOXVANTA NXV — schema inicial.
-- Execute no SQL Editor do projeto Supabase. Não apaga nem altera tabelas existentes.
create extension if not exists pgcrypto;

do $$ begin
  create type public.nxv_role as enum ('pending','owner','igl','strategist','admin','player','substitute');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  role public.nxv_role not null default 'pending',
  can_manage_strategies boolean not null default false,
  country text,
  agent_role text,
  avatar_key text,
  status text default 'Active',
  created_at timestamptz not null default now()
);

create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  opponent text not null,
  starts_at timestamptz not null,
  competition text,
  status text not null default 'upcoming' check (status in ('upcoming','live','completed')),
  score_for integer,
  score_against integer,
  created_at timestamptz not null default now()
);
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  nickname text not null,
  age integer not null check (age between 13 and 99),
  rank text not null,
  player_role text not null,
  experience text not null,
  availability text not null,
  discord text not null,
  introduction text not null,
  status text not null default 'New',
  created_at timestamptz not null default now()
);
create table if not exists public.strategies (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  map_name text not null,
  side text not null check (side in ('attack','defense')),
  description text,
  board jsonb not null default '{"markers":[],"paths":[],"notes":""}'::jsonb,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  visibility text not null default 'team' check (visibility in ('team','owner')),
  created_at timestamptz not null default now()
);
create table if not exists public.internal_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  starts_at timestamptz not null,
  kind text not null default 'training',
  visibility text not null default 'team' check (visibility in ('team','owner')),
  created_at timestamptz not null default now()
);
create table if not exists public.owner_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references public.profiles(id),
  subject text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create or replace function public.nxv_is_owner()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.profiles where id = auth.uid() and role = 'owner') $$;
create or replace function public.nxv_is_member()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.profiles where id = auth.uid() and role in ('owner','igl','strategist','player','substitute')) $$;
create or replace function public.nxv_can_manage_content()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.profiles where id = auth.uid() and role in ('owner','admin')) $$;
create or replace function public.nxv_can_manage_strategies()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.profiles where id = auth.uid() and (role in ('owner','igl') or (role = 'strategist' and can_manage_strategies))) $$;

create or replace function public.nxv_create_profile()
returns trigger language plpgsql security definer set search_path = public
as $$ begin
  insert into public.profiles(id, username, role) values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email,'@',1)), 'pending')
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists nxv_auth_user_created on auth.users;
create trigger nxv_auth_user_created after insert on auth.users for each row execute procedure public.nxv_create_profile();

-- Block self-promotion and self-editing of privileged columns.
create or replace function public.nxv_protect_profile_privileges()
returns trigger language plpgsql security definer set search_path = public
as $$ begin
  if auth.uid() = old.id and not public.nxv_is_owner() then
    if new.role is distinct from old.role or new.can_manage_strategies is distinct from old.can_manage_strategies then
      raise exception 'Role and strategy permissions can only be changed by the Owner';
    end if;
  end if;
  if auth.uid() is not null and new.role = 'owner' and not public.nxv_is_owner() then
    raise exception 'Only an existing Owner can assign Owner role';
  end if;
  return new;
end $$;
drop trigger if exists nxv_profile_privileges_guard on public.profiles;
create trigger nxv_profile_privileges_guard before update on public.profiles for each row execute procedure public.nxv_protect_profile_privileges();

alter table public.profiles enable row level security;
alter table public.news enable row level security;
alter table public.matches enable row level security;
alter table public.applications enable row level security;
alter table public.strategies enable row level security;
alter table public.announcements enable row level security;
alter table public.internal_events enable row level security;
alter table public.owner_messages enable row level security;

-- Profiles: signed-in members can see roster; users can update safe profile fields only.
drop policy if exists "profiles read authenticated" on public.profiles;
create policy "public roster and own profile" on public.profiles for select to anon, authenticated using (role in ('igl','strategist','player','substitute') or id = auth.uid() or public.nxv_is_owner());
drop policy if exists "profiles update safe self" on public.profiles;
create policy "profiles update safe self" on public.profiles for update to authenticated
using (id = auth.uid() or public.nxv_is_owner())
with check (id = auth.uid() or public.nxv_is_owner());
drop policy if exists "profiles owner insert" on public.profiles;
create policy "profiles owner insert" on public.profiles for insert to authenticated with check (public.nxv_is_owner());

-- Public content.
drop policy if exists "published news public" on public.news;
create policy "published news public" on public.news for select to anon, authenticated using (published = true or public.nxv_can_manage_content());
drop policy if exists "content managers news insert" on public.news;
create policy "content managers news insert" on public.news for insert to authenticated with check (public.nxv_can_manage_content());
drop policy if exists "content managers news update" on public.news;
create policy "content managers news update" on public.news for update to authenticated using (public.nxv_can_manage_content()) with check (public.nxv_can_manage_content());
drop policy if exists "content managers news delete" on public.news;
create policy "content managers news delete" on public.news for delete to authenticated using (public.nxv_can_manage_content());

drop policy if exists "matches public read" on public.matches;
create policy "matches public read" on public.matches for select to anon, authenticated using (true);
drop policy if exists "content managers matches insert" on public.matches;
create policy "content managers matches insert" on public.matches for insert to authenticated with check (public.nxv_can_manage_content());
drop policy if exists "content managers matches update" on public.matches;
create policy "content managers matches update" on public.matches for update to authenticated using (public.nxv_can_manage_content()) with check (public.nxv_can_manage_content());
drop policy if exists "content managers matches delete" on public.matches;
create policy "content managers matches delete" on public.matches for delete to authenticated using (public.nxv_can_manage_content());

-- Recruitment: public can submit, but nobody can read except content managers.
drop policy if exists "public submit applications" on public.applications;
create policy "public submit applications" on public.applications for insert to anon, authenticated with check (true);
drop policy if exists "managers read applications" on public.applications;
create policy "managers read applications" on public.applications for select to authenticated using (public.nxv_can_manage_content());
drop policy if exists "managers update applications" on public.applications;
create policy "managers update applications" on public.applications for update to authenticated using (public.nxv_can_manage_content()) with check (public.nxv_can_manage_content());
drop policy if exists "managers delete applications" on public.applications;
create policy "managers delete applications" on public.applications for delete to authenticated using (public.nxv_can_manage_content());

-- Strategies: all authenticated team members can read; only explicit strategy managers can write.
drop policy if exists "team read strategies" on public.strategies;
create policy "team read strategies" on public.strategies for select to authenticated using (public.nxv_is_member());
drop policy if exists "authorized strategy insert" on public.strategies;
create policy "authorized strategy insert" on public.strategies for insert to authenticated with check (public.nxv_can_manage_strategies());
drop policy if exists "authorized strategy update" on public.strategies;
create policy "authorized strategy update" on public.strategies for update to authenticated using (public.nxv_can_manage_strategies()) with check (public.nxv_can_manage_strategies());
drop policy if exists "authorized strategy delete" on public.strategies;
create policy "authorized strategy delete" on public.strategies for delete to authenticated using (public.nxv_can_manage_strategies());

-- Team-only and Owner-only announcements/events.
drop policy if exists "team announcement visibility" on public.announcements;
create policy "team announcement visibility" on public.announcements for select to authenticated using ((visibility = 'team' and public.nxv_is_member()) or (visibility = 'owner' and public.nxv_is_owner()));
drop policy if exists "content managers announcement insert" on public.announcements;
create policy "content managers announcement insert" on public.announcements for insert to authenticated with check (public.nxv_can_manage_content() and (visibility <> 'owner' or public.nxv_is_owner()));
drop policy if exists "owner announcement update" on public.announcements;
create policy "owner announcement update" on public.announcements for update to authenticated using (public.nxv_is_owner()) with check (public.nxv_is_owner());
drop policy if exists "owner announcement delete" on public.announcements;
create policy "owner announcement delete" on public.announcements for delete to authenticated using (public.nxv_is_owner());

drop policy if exists "team event visibility" on public.internal_events;
create policy "team event visibility" on public.internal_events for select to authenticated using ((visibility = 'team' and public.nxv_is_member()) or (visibility = 'owner' and public.nxv_is_owner()));
drop policy if exists "content managers event insert" on public.internal_events;
create policy "content managers event insert" on public.internal_events for insert to authenticated with check (public.nxv_can_manage_content() and (visibility <> 'owner' or public.nxv_is_owner()));
drop policy if exists "owner event update" on public.internal_events;
create policy "owner event update" on public.internal_events for update to authenticated using (public.nxv_is_owner()) with check (public.nxv_is_owner());
drop policy if exists "owner event delete" on public.internal_events;
create policy "owner event delete" on public.internal_events for delete to authenticated using (public.nxv_is_owner());

-- Owner messages: sender may submit; only Owner can read.
drop policy if exists "authenticated send owner message" on public.owner_messages;
create policy "authenticated send owner message" on public.owner_messages for insert to authenticated with check (sender_id = auth.uid());
drop policy if exists "owner read owner messages" on public.owner_messages;
create policy "owner read owner messages" on public.owner_messages for select to authenticated using (public.nxv_is_owner());

grant usage on schema public to anon, authenticated;
grant select on public.news, public.matches to anon, authenticated;
grant select, insert, update, delete on public.profiles, public.news, public.matches, public.applications, public.strategies, public.announcements, public.internal_events, public.owner_messages to authenticated;
grant insert on public.applications to anon, authenticated;

-- No demo roster, scores, opponents or news are inserted: live data must come from the organization.
