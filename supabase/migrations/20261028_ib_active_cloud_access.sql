-- IB Chess Analyzer: enforce active subscriptions for cloud study access.
-- Run in Supabase SQL Editor only after reviewing current policies and backing up.
-- Existing studies remain stored when an enrollment is paused or expires.
CREATE OR REPLACE FUNCTION public.ib_has_cloud_access(p_user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
 SELECT p_user = (select auth.uid()) AND
 (
   EXISTS (SELECT 1 FROM public.ib_teachers t WHERE t.teacher_id=p_user AND t.active=true)
   OR EXISTS (SELECT 1 FROM public.ib_enrollments e
     WHERE e.student_id=p_user AND e.state='active'
       AND (e.expires_at IS NULL OR e.expires_at>now()))
 );
$$;
REVOKE ALL ON FUNCTION public.ib_has_cloud_access(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ib_has_cloud_access(uuid) TO authenticated;

DROP POLICY IF EXISTS "ib_read_owned_or_shared" ON public.ib_studies;
CREATE POLICY "ib_read_owned_or_shared" ON public.ib_studies
FOR SELECT TO authenticated USING (
 public.ib_has_cloud_access((select auth.uid()))
 AND (
   owner_id=(select auth.uid())
   OR EXISTS (SELECT 1 FROM public.ib_study_members m WHERE m.study_id=id AND m.member_id=(select auth.uid()))
 )
);
DROP POLICY IF EXISTS "ib_create_own" ON public.ib_studies;
CREATE POLICY "ib_create_own" ON public.ib_studies
FOR INSERT TO authenticated WITH CHECK (
 owner_id=(select auth.uid()) AND public.ib_has_cloud_access((select auth.uid()))
);
DROP POLICY IF EXISTS "ib_update_own" ON public.ib_studies;
CREATE POLICY "ib_update_own" ON public.ib_studies
FOR UPDATE TO authenticated USING (
 owner_id=(select auth.uid()) AND public.ib_has_cloud_access((select auth.uid()))
) WITH CHECK (
 owner_id=(select auth.uid()) AND public.ib_has_cloud_access((select auth.uid()))
);
DROP POLICY IF EXISTS "ib_delete_own" ON public.ib_studies;
CREATE POLICY "ib_delete_own" ON public.ib_studies
FOR DELETE TO authenticated USING (
 owner_id=(select auth.uid()) AND public.ib_has_cloud_access((select auth.uid()))
);
-- Membership reads are also disabled on subscription suspension.
DROP POLICY IF EXISTS "ib_read_membership" ON public.ib_study_members;
CREATE POLICY "ib_read_membership" ON public.ib_study_members
FOR SELECT TO authenticated USING (
 public.ib_has_cloud_access((select auth.uid())) AND
 (owner_id=(select auth.uid()) OR member_id=(select auth.uid()))
);
-- Ownership validation remains; only active owners may create/edit shared access.
DROP POLICY IF EXISTS "ib_add_members" ON public.ib_study_members;
CREATE POLICY "ib_add_members" ON public.ib_study_members
FOR INSERT TO authenticated WITH CHECK (
 public.ib_has_cloud_access((select auth.uid()))
 AND owner_id=(select auth.uid()) AND public.ib_can_manage_study(study_id,owner_id)
);
DROP POLICY IF EXISTS "ib_change_members" ON public.ib_study_members;
CREATE POLICY "ib_change_members" ON public.ib_study_members
FOR UPDATE TO authenticated USING (
 public.ib_has_cloud_access((select auth.uid()))
 AND owner_id=(select auth.uid()) AND public.ib_can_manage_study(study_id,owner_id)
) WITH CHECK (
 public.ib_has_cloud_access((select auth.uid()))
 AND owner_id=(select auth.uid()) AND public.ib_can_manage_study(study_id,owner_id)
);
DROP POLICY IF EXISTS "ib_remove_members" ON public.ib_study_members;
CREATE POLICY "ib_remove_members" ON public.ib_study_members
FOR DELETE TO authenticated USING (
 public.ib_has_cloud_access((select auth.uid()))
 AND owner_id=(select auth.uid()) AND public.ib_can_manage_study(study_id,owner_id)
);
NOTIFY pgrst, 'reload schema';
