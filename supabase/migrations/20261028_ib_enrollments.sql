-- Apply once in Supabase SQL Editor AFTER previous ib_teachers/ib_profiles migrations.
-- A student may request to join a teacher; teacher must approve.
create table if not exists public.ib_enrollments (
 id uuid primary key default gen_random_uuid(),
 teacher_id uuid not null references public.ib_teachers(teacher_id),
 student_id uuid not null references auth.users(id),
 state text not null default 'pending' check(state in ('pending','active','paused','ended')),
 plan text not null default 'Sin plan',
 expires_at timestamptz,
 created_at timestamptz not null default now(),
 unique(teacher_id,student_id)
);
create index if not exists ib_enrollments_teacher_idx on public.ib_enrollments(teacher_id);
create index if not exists ib_enrollments_student_idx on public.ib_enrollments(student_id);
alter table public.ib_enrollments enable row level security;
revoke all on public.ib_enrollments from anon,authenticated;
grant select,insert,update,delete on public.ib_enrollments to authenticated;
create policy "ib_enroll_read" on public.ib_enrollments for select to authenticated
using(student_id=(select auth.uid()) or teacher_id=(select auth.uid()));
create policy "ib_enroll_student_request" on public.ib_enrollments for insert to authenticated
with check(student_id=(select auth.uid()) and state='pending' and plan='Sin plan' and expires_at is null
 and exists(select 1 from public.ib_teachers t where t.teacher_id=teacher_id and t.active=true));
-- Students cannot promote themselves; only their authorized teacher updates access.
create policy "ib_enroll_teacher_update" on public.ib_enrollments for update to authenticated
using(teacher_id=(select auth.uid()) and exists(select 1 from public.ib_teachers t where t.teacher_id=(select auth.uid()) and t.active=true))
with check(teacher_id=(select auth.uid()) and exists(select 1 from public.ib_teachers t where t.teacher_id=(select auth.uid()) and t.active=true));
create policy "ib_enroll_teacher_delete" on public.ib_enrollments for delete to authenticated
using(teacher_id=(select auth.uid()));
-- Student/teacher directory read: teachers can see the display names of their enrolled students.
create policy "ib_profile_teacher_roster" on public.ib_profiles for select to authenticated
using(exists(select 1 from public.ib_enrollments e where e.student_id=user_id and e.teacher_id=(select auth.uid())));
