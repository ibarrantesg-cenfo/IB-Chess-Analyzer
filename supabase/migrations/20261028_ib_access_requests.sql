-- Applicant requests before account creation. Run in Supabase SQL editor.
create table if not exists public.ib_access_requests(
 id uuid primary key default gen_random_uuid(),
 email text not null,
 full_name text not null,
 requested_role text not null default 'student' check(requested_role in ('student','teacher')),
 granted_role text check(granted_role in ('student','teacher')),
 status text not null default 'pending' check(status in ('pending','approved','rejected','suspended')),
 created_at timestamptz not null default now(),
 reviewed_at timestamptz,
 reviewed_by uuid references auth.users(id),
 constraint valid_request_email check(length(email) between 5 and 254 and email ~* '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'),
 constraint valid_request_name check(length(full_name) between 2 and 80)
);
create unique index if not exists ib_request_email_unique on public.ib_access_requests(lower(email));
alter table public.ib_access_requests enable row level security;
revoke all on public.ib_access_requests from public,anon,authenticated;
grant insert on public.ib_access_requests to anon,authenticated;
grant select,update on public.ib_access_requests to authenticated;
create policy "ib_request_public_submit" on public.ib_access_requests for insert to anon,authenticated
with check(status='pending' and reviewed_by is null and reviewed_at is null and granted_role is null);
create policy "ib_request_admin_read" on public.ib_access_requests for select to authenticated
using(exists(select 1 from public.ib_teachers where teacher_id=(select auth.uid()) and active=true));
create policy "ib_request_admin_update" on public.ib_access_requests for update to authenticated
using(exists(select 1 from public.ib_teachers where teacher_id=(select auth.uid()) and active=true))
with check(exists(select 1 from public.ib_teachers where teacher_id=(select auth.uid()) and active=true));
-- Approval here is an administrative decision only.
-- Do not use granted_role to give teacher rights until an authorized server
-- validates verified email and provisions ib_teachers.
-- Do not claim registration is blocked merely by this table.
