-- ESQUEMA DE DISEÑO — NO EJECUTAR EN PRODUCCIÓN SIN AUDITORÍA.
-- Primera versión deliberadamente aislada. Políticas de denegación por defecto.
-- Debe revisarse con la estructura y las migraciones actuales de Supabase.
create table if not exists public.ib_ci_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table if not exists public.ib_ci_players (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  fide_id text,
  aliases text[] not null default '{}',
  priority text not null default 'C' check (priority in ('A','B','C')),
  notes text not null default '',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.ib_ci_games (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.ib_ci_players(id) on delete cascade,
  source_url text,
  source_name text,
  external_id text,
  played_at date,
  time_control text,
  player_color text check (player_color in ('w','b')),
  pgn text not null,
  pgn_sha256 text not null,
  created_at timestamptz not null default now(),
  unique(player_id,pgn_sha256)
);
create table if not exists public.ib_ci_observations (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.ib_ci_players(id) on delete cascade,
  code text not null,
  claim text not null,
  evidence jsonb not null default '[]'::jsonb,
  sample_n integer not null default 0 check(sample_n >= 0),
  confidence text not null default 'pending' check(confidence in ('pending','low','medium','high')),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
create table if not exists public.ib_ci_preparations (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.ib_ci_players(id) on delete cascade,
  title text not null,
  study_id uuid,
  plan text not null default '',
  status text not null default 'draft' check(status in ('draft','review','ready','archived')),
  created_at timestamptz not null default now()
);
alter table public.ib_ci_admins enable row level security;
alter table public.ib_ci_players enable row level security;
alter table public.ib_ci_games enable row level security;
alter table public.ib_ci_observations enable row level security;
alter table public.ib_ci_preparations enable row level security;
-- SECURITY DEFINER function must have controlled owner and fixed search_path.
-- Admin roster MUST be populated by privileged server-side operation, never by client.
create or replace function public.ib_ci_is_admin()
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (
  select 1 from public.ib_ci_admins a where a.user_id = (select auth.uid())
); $$;
revoke all on function public.ib_ci_is_admin() from public;
grant execute on function public.ib_ci_is_admin() to authenticated;
create policy ci_read_players on public.ib_ci_players for select to authenticated using (public.ib_ci_is_admin());
create policy ci_write_players on public.ib_ci_players for all to authenticated using (public.ib_ci_is_admin()) with check (public.ib_ci_is_admin());
create policy ci_read_games on public.ib_ci_games for select to authenticated using (public.ib_ci_is_admin());
create policy ci_write_games on public.ib_ci_games for all to authenticated using (public.ib_ci_is_admin()) with check (public.ib_ci_is_admin());
create policy ci_read_observations on public.ib_ci_observations for select to authenticated using (public.ib_ci_is_admin());
create policy ci_write_observations on public.ib_ci_observations for all to authenticated using (public.ib_ci_is_admin()) with check (public.ib_ci_is_admin());
create policy ci_read_preparations on public.ib_ci_preparations for select to authenticated using (public.ib_ci_is_admin());
create policy ci_write_preparations on public.ib_ci_preparations for all to authenticated using (public.ib_ci_is_admin()) with check (public.ib_ci_is_admin());
-- No policies on ib_ci_admins: no client access to roster.
