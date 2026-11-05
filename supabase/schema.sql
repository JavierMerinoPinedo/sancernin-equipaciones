-- =====================================================================
-- Equipaciones San Cernin · esquema de base de datos (Supabase/Postgres)
-- Ejecuta este archivo completo en Supabase → SQL Editor → New query.
-- =====================================================================

-- Partidos del club, tal y como llegan de la FNB (uno por partido)
create table if not exists public.matches (
  id               text primary key,               -- idMatch de la FNB
  season           text,
  local_dt         timestamp without time zone not null, -- fecha y hora en hora de Madrid
  time_tbd         boolean not null default false, -- la FNB aún no ha fijado hora
  category         text not null,
  competition      text,
  group_name       text,
  is_home          boolean not null,
  our_team_id      text,
  our_team_name    text not null,
  rival_team_id    text,
  rival_name       text not null,
  rival_club_name  text,
  rival_shirt_raw  text,                           -- color de camiseta del rival según la FNB
  rival_pants_raw  text,
  field_name       text,
  field_town       text,
  field_address    text,
  lat              double precision,
  lng              double precision,
  local_score      integer,
  visitor_score    integer,
  removed          boolean not null default false, -- ya no aparece en la FNB
  first_seen_at    timestamptz not null default now(),
  last_seen_at     timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists matches_local_dt_idx on public.matches (local_dt);
create index if not exists matches_team_idx on public.matches (our_team_id);

-- Historial de cambios detectados por la carga diaria
create table if not exists public.match_changes (
  id          bigserial primary key,
  match_id    text not null references public.matches (id) on delete cascade,
  changed_at  timestamptz not null default now(),
  field       text not null,   -- fecha | pabellon | rival | color_rival | local_visitante | eliminado | nuevo
  old_value   text,
  new_value   text
);
create index if not exists match_changes_match_idx on public.match_changes (match_id);
create index if not exists match_changes_time_idx on public.match_changes (changed_at desc);

-- Colores de rival corregidos a mano por el club (prevalecen sobre la FNB)
create table if not exists public.rival_overrides (
  rival_team_id  text primary key,
  rival_name     text,
  shirt          text not null,
  pants          text,
  updated_by     uuid references auth.users (id) on delete set null,
  updated_at     timestamptz not null default now()
);

-- Perfil de cada usuario: token secreto para su suscripción .ics
create table if not exists public.profiles (
  user_id         uuid primary key references auth.users (id) on delete cascade,
  calendar_token  uuid not null default gen_random_uuid() unique,
  created_at      timestamptz not null default now()
);

-- Registro de cada carga desde la FNB
create table if not exists public.sync_runs (
  id            bigserial primary key,
  started_at    timestamptz not null default now(),
  finished_at   timestamptz,
  ok            boolean,
  trigger       text,         -- cron | manual
  matches_seen  integer,
  changes       integer,
  error         text
);

-- Crea el perfil automáticamente al dar de alta un usuario
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id) values (new.id) on conflict do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
-- Perfiles para usuarios que ya existieran
insert into public.profiles (user_id) select id from auth.users on conflict do nothing;

-- ===================== Seguridad (RLS) =====================
-- Solo usuarios con sesión iniciada leen datos. La carga diaria usa la
-- service role key, que salta estas reglas.
alter table public.matches          enable row level security;
alter table public.match_changes    enable row level security;
alter table public.rival_overrides  enable row level security;
alter table public.profiles         enable row level security;
alter table public.sync_runs        enable row level security;

drop policy if exists "leer partidos" on public.matches;
create policy "leer partidos" on public.matches for select to authenticated using (true);

drop policy if exists "leer cambios" on public.match_changes;
create policy "leer cambios" on public.match_changes for select to authenticated using (true);

drop policy if exists "leer colores" on public.rival_overrides;
create policy "leer colores" on public.rival_overrides for select to authenticated using (true);
drop policy if exists "crear colores" on public.rival_overrides;
create policy "crear colores" on public.rival_overrides for insert to authenticated with check (true);
drop policy if exists "editar colores" on public.rival_overrides;
create policy "editar colores" on public.rival_overrides for update to authenticated using (true) with check (true);
drop policy if exists "borrar colores" on public.rival_overrides;
create policy "borrar colores" on public.rival_overrides for delete to authenticated using (true);

drop policy if exists "mi perfil" on public.profiles;
create policy "mi perfil" on public.profiles for select to authenticated using (user_id = auth.uid());

drop policy if exists "leer cargas" on public.sync_runs;
create policy "leer cargas" on public.sync_runs for select to authenticated using (true);
