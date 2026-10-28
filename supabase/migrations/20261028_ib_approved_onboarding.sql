-- Onboarding seguro para cuentas invitadas y aprobadas.
-- Ejecutar UNA vez en Supabase SQL Editor DESPUÉS de las migraciones existentes.
-- La función NO crea usuarios: Supabase Auth sigue gestionando las invitaciones.
-- Solo puede vincular la propia cuenta del usuario autenticado, con correo confirmado.
CREATE OR REPLACE FUNCTION public.ib_complete_approved_student_onboarding()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
 v_user uuid := auth.uid();
 v_email text;
 v_confirmed timestamptz;
 v_request public.ib_access_requests%ROWTYPE;
BEGIN
 IF v_user IS NULL THEN RETURN 'not_authenticated'; END IF;
 SELECT lower(u.email),u.email_confirmed_at INTO v_email,v_confirmed
 FROM auth.users u WHERE u.id=v_user;
 IF v_email IS NULL OR v_confirmed IS NULL THEN RETURN 'verify_email_first'; END IF;

 SELECT r.* INTO v_request
 FROM public.ib_access_requests r
 JOIN public.ib_teachers t ON t.teacher_id=r.reviewed_by AND t.active=true
 WHERE lower(r.email)=v_email AND r.status='approved'
  AND r.granted_role='student'
 ORDER BY r.reviewed_at DESC NULLS LAST LIMIT 1;
 IF NOT FOUND THEN RETURN 'not_approved'; END IF;

 INSERT INTO public.ib_profiles(user_id,display_name)
 VALUES (v_user, v_request.full_name)
 ON CONFLICT (user_id) DO NOTHING;

 -- No se reactiva una cuenta ya suspendida/terminada. Solo se inserta si falta.
 INSERT INTO public.ib_enrollments(teacher_id,student_id,state,plan)
 VALUES (v_request.reviewed_by,v_user,'active','Acceso inicial')
 ON CONFLICT (teacher_id,student_id) DO NOTHING;
 RETURN 'linked';
END;
$$;
REVOKE ALL ON FUNCTION public.ib_complete_approved_student_onboarding() FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.ib_complete_approved_student_onboarding() TO authenticated;
NOTIFY pgrst, 'reload schema';
