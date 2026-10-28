-- v2.7: Teacher directory and self-service student profiles.
-- Run once in Supabase SQL Editor as project administrator.
-- No client can grant itself professor rights.
create table if not exists public.ib_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null default 'Alumno',
 created_at timestamptz not null default now(),
 constraint ib_profile_name_length check (char_length(display_name) between 1 and 80)
);
alter table public.ib_profiles enable row level security;
grant select, insert, update on public.ib_profiles to authenticated;
create policy "ib_profile_own_read" on public.ib_profiles for select to authenticated using (user_id=(select auth.uid()));
create policy "ib_profile_own_create" on public.ib_profiles for insert to authenticated with check (user_id=(select auth.uid()));
create policy "ib_profile_own_update" on public.ib_profiles for update to authenticated using (user_id=(select auth.uid())) with check (user_id=(select auth.uid()));

create table if not exists public.ib_teachers (
 teacher_id uuid primary key references auth.users(id) on delete cascade,
 display_name text not null,
 active boolean not null default true,
 created_at timestamptz not null default now()
);
alter table public.ib_teachers enable row level security;
-- Students may discover active teachers but cannot modify the directory.
revoke all on public.ib_teachers from anon, authenticated;
grant select on public.ib_teachers to authenticated;
create policy "ib_teacher_directory" on public.ib_teachers for select to authenticated using (active=true);

-- Register the instructor from SQL Editor after confirming the verified account.
-- Do NOT commit a personal email address or auth user UUID to the public repository.
-- Replace the placeholder with the verified account UUID from Authentication > Users:
-- insert into public.ib_teachers(teacher_id,display_name,active)
-- values ('REPLACE_WITH_VERIFIED_TEACHER_UUID'::uuid,'Profe Ian',true)
-- on conflict (teacher_id) do update set display_name=excluded.display_name,active=true;
select teacher_id,display_name from public.ib_teachers where active=true;
