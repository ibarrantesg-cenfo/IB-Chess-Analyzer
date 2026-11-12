-- 02 / Autorizar ÚNICAMENTE tu usuario de IB Chess Analyzer
-- Ir a Supabase > Authentication > Users, entrar en tu usuario y copiar 'User UID'.
-- Sustituir SOLO el texto REEMPLAZAR_UUID_DE_MI_USUARIO por ese UUID.
-- NO usar el ID del proyecto, el correo ni una service_role key.
begin;
do $block$
declare mi_uuid uuid := 'REEMPLAZAR_UUID_DE_MI_USUARIO';
begin
  if not exists (select 1 from auth.users where id = mi_uuid) then
    raise exception 'El UUID no coincide con ninguna cuenta de Authentication > Users';
  end if;
  insert into public.ib_ci_admins(user_id)
  values (mi_uuid)
  on conflict (user_id) do nothing;
end $block$;
commit;

-- Confirmar UNA cuenta autorizada: el SQL Editor (owner) puede verla.
select user_id, created_at from public.ib_ci_admins order by created_at;
