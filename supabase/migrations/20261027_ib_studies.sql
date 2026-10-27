-- IB Chess Analyzer: opt-in cloud studies schema (NOT applied automatically).
-- Requires a Supabase project, Supabase Auth and explicit administrator setup.
create extension if not exists pgcrypto;
create table if not exists public.ib_studies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  student_label text not null default 'Sin alumno',
  title text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ib_studies_payload_object check (jsonb_typeof(payload) = 'object')
);
create table if not exists public.ib_study_members (
  study_id uuid not null references public.ib_studies(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  member_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'viewer' check (role in ('viewer','editor')),
  primary key (study_id, member_id)
);
create index if not exists ib_studies_owner_idx on public.ib_studies(owner_id);
create index if not exists ib_members_member_idx on public.ib_study_members(member_id);
alter table public.ib_studies enable row level security;
alter table public.ib_study_members enable row level security;
revoke all on public.ib_studies from anon, authenticated;
revoke all on public.ib_study_members from anon, authenticated;
grant select, insert, update, delete on public.ib_studies to authenticated;
grant select, insert, update, delete on public.ib_study_members to authenticated;
-- Members can read a shared study, but only the owner can mutate it.
create policy "ib_read_owned_or_shared" on public.ib_studies for select to authenticated
using (
 owner_id = (select auth.uid())
 or exists (select 1 from public.ib_study_members m
            where m.study_id = id and m.member_id = (select auth.uid()))
);
create policy "ib_create_own" on public.ib_studies for insert to authenticated
with check (owner_id = (select auth.uid()));
create policy "ib_update_own" on public.ib_studies for update to authenticated
using (owner_id = (select auth.uid()))
with check (owner_id = (select auth.uid()));
create policy "ib_delete_own" on public.ib_studies for delete to authenticated
using (owner_id = (select auth.uid()));
-- No policy for memberships queries the studies table, avoiding RLS recursion.
create policy "ib_read_membership" on public.ib_study_members for select to authenticated
using (owner_id = (select auth.uid()) or member_id = (select auth.uid()));
-- A malicious owner must not grant access to a study they do not own.
-- Validate using a security-definer helper to avoid nested policy cycles.
create or replace function public.ib_can_manage_study(p_study uuid, p_owner uuid)
returns boolean language sql stable security definer
set search_path = '' as $$
  select exists (select 1 from public.ib_studies s
    where s.id = p_study and s.owner_id = p_owner
      and p_owner = (select auth.uid()));
$$;
revoke all on function public.ib_can_manage_study(uuid,uuid) from public;
grant execute on function public.ib_can_manage_study(uuid,uuid) to authenticated;
create policy "ib_add_members" on public.ib_study_members for insert to authenticated
with check (
 owner_id = (select auth.uid())
 and public.ib_can_manage_study(study_id, owner_id)
);
create policy "ib_change_members" on public.ib_study_members for update to authenticated
using (owner_id = (select auth.uid()) and public.ib_can_manage_study(study_id,owner_id))
with check (owner_id = (select auth.uid()) and public.ib_can_manage_study(study_id,owner_id));
create policy "ib_remove_members" on public.ib_study_members for delete to authenticated
using (owner_id = (select auth.uid()) and public.ib_can_manage_study(study_id,owner_id));
