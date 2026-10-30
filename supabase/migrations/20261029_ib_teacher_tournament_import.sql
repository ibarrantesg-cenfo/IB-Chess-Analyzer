-- Instructor-managed tournament import; run after 20261028_ib_academic_workspace.sql.
-- Only the ACTIVE verified teacher linked to an ACTIVE non-expired student may upload games.
DROP POLICY IF EXISTS "ib_teacher_game_insert" ON public.ib_student_games;
CREATE POLICY "ib_teacher_game_insert" ON public.ib_student_games
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.ib_teachers t
    JOIN public.ib_enrollments e ON e.teacher_id=t.teacher_id
    WHERE t.teacher_id=(SELECT auth.uid())
      AND t.active=true
      AND e.student_id=ib_student_games.student_id
      AND e.state='active'
      AND (e.expires_at IS NULL OR e.expires_at>now())
  )
);
NOTIFY pgrst, 'reload schema';
