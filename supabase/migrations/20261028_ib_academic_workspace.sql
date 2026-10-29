-- IB Chess Analyzer · Academic workspace v1
-- Apply in Supabase SQL Editor after ib_enrollments and ib_teachers.
-- Data belongs to the student; the linked teacher may review it.
create table if not exists public.ib_student_games (
 id uuid primary key default gen_random_uuid(),
 student_id uuid not null references auth.users(id) on delete cascade,
 title text not null check(length(title) between 1 and 180),
 event_name text not null default 'Sin torneo',
 played_at date,
 pgn text not null check(length(pgn) between 10 and 500000),
 white_name text not null default '',
 black_name text not null default '',
 result text not null default '*',
 student_side text not null default 'w' check(student_side in ('w','b')),
 review jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now()
);
create index if not exists ib_games_student_event_idx on public.ib_student_games(student_id,event_name,created_at desc);
create table if not exists public.ib_assignments (
 id uuid primary key default gen_random_uuid(),
 teacher_id uuid not null references public.ib_teachers(teacher_id),
 student_id uuid not null references auth.users(id) on delete cascade,
 title text not null check(length(title) between 3 and 180),
 instructions text not null default '',
 kind text not null default 'analysis' check(kind in ('analysis','calculation','opening','endgame','other')),
 reference_pgn text not null default '',
 due_at date,
 created_at timestamptz not null default now()
);
create index if not exists ib_assignments_student_idx on public.ib_assignments(student_id,created_at desc);
create table if not exists public.ib_assignment_submissions (
 id uuid primary key default gen_random_uuid(),
 assignment_id uuid not null references public.ib_assignments(id) on delete cascade,
 student_id uuid not null references auth.users(id) on delete cascade,
 notes text not null default '',
 submitted_pgn text not null default '',
 feedback text not null default '',
 reviewed_at timestamptz,
 submitted_at timestamptz not null default now(),
 unique(assignment_id,student_id)
);
alter table public.ib_student_games enable row level security;
alter table public.ib_assignments enable row level security;
alter table public.ib_assignment_submissions enable row level security;
grant select,insert,update,delete on public.ib_student_games,public.ib_assignments,public.ib_assignment_submissions to authenticated;

-- A linked teacher may read the game portfolio, including inactive enrollments
-- (the student's history remains available for professional review).
create policy "ib_game_read" on public.ib_student_games for select to authenticated
using(student_id=(select auth.uid()) or exists(
 select 1 from public.ib_enrollments e where e.student_id=ib_student_games.student_id and e.teacher_id=(select auth.uid())
));
create policy "ib_game_insert" on public.ib_student_games for insert to authenticated
with check(student_id=(select auth.uid()) and exists(
 select 1 from public.ib_enrollments e where e.student_id=(select auth.uid()) and e.state='active'
 and (e.expires_at is null or e.expires_at>now())
));
create policy "ib_game_delete" on public.ib_student_games for delete to authenticated
using(student_id=(select auth.uid()));

create policy "ib_assignment_read" on public.ib_assignments for select to authenticated
using(student_id=(select auth.uid()) or teacher_id=(select auth.uid()));
create policy "ib_assignment_insert" on public.ib_assignments for insert to authenticated
with check(teacher_id=(select auth.uid()) and exists(
 select 1 from public.ib_teachers t where t.teacher_id=(select auth.uid()) and t.active=true)
 and exists(select 1 from public.ib_enrollments e
  where e.teacher_id=(select auth.uid()) and e.student_id=ib_assignments.student_id
  and e.state='active' and (e.expires_at is null or e.expires_at>now())));
create policy "ib_assignment_update" on public.ib_assignments for update to authenticated
using(teacher_id=(select auth.uid())) with check(teacher_id=(select auth.uid()));
create policy "ib_assignment_delete" on public.ib_assignments for delete to authenticated
using(teacher_id=(select auth.uid()));

-- The submission is readable to both parties, but only students edit their work.
-- Teacher feedback is edited through a separate security-definer RPC below.
create policy "ib_submission_read" on public.ib_assignment_submissions for select to authenticated
using(student_id=(select auth.uid()) or exists(
 select 1 from public.ib_assignments a where a.id=assignment_id and a.teacher_id=(select auth.uid())));
create policy "ib_submission_insert" on public.ib_assignment_submissions for insert to authenticated
with check(student_id=(select auth.uid()) and exists(
 select 1 from public.ib_assignments a join public.ib_enrollments e on e.student_id=a.student_id
 and e.teacher_id=a.teacher_id where a.id=assignment_id and a.student_id=(select auth.uid())
 and e.state='active' and (e.expires_at is null or e.expires_at>now())));
-- Disallow direct updates to feedback from students by giving column-level permissions.
revoke update on public.ib_assignment_submissions from authenticated;
grant update (notes,submitted_pgn,submitted_at) on public.ib_assignment_submissions to authenticated;
create policy "ib_submission_update" on public.ib_assignment_submissions for update to authenticated
using(student_id=(select auth.uid())) with check(student_id=(select auth.uid()));

create or replace function public.ib_review_submission(p_assignment uuid,p_student uuid,p_feedback text)
returns void language plpgsql security definer set search_path='' as $$
begin
 if not exists(select 1 from public.ib_assignments a
 join public.ib_teachers t on t.teacher_id=a.teacher_id and t.active=true
 where a.id=p_assignment and a.teacher_id=auth.uid() and a.student_id=p_student)
 then raise exception 'Not authorized'; end if;
 update public.ib_assignment_submissions
 set feedback=left(p_feedback,10000), reviewed_at=now()
 where assignment_id=p_assignment and student_id=p_student;
end; $$;
revoke all on function public.ib_review_submission(uuid,uuid,text) from public,anon;
grant execute on function public.ib_review_submission(uuid,uuid,text) to authenticated;
notify pgrst,'reload schema';
