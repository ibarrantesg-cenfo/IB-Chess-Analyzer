import { createClient } from '@supabase/supabase-js';

// Cloud synchronization is opt-in. Only publishable/anon key is permitted in client code.
// All authorization happens in Supabase PostgreSQL RLS.
const url=import.meta.env.VITE_SUPABASE_URL||'';
const key=import.meta.env.VITE_SUPABASE_ANON_KEY||'';
export const cloudAvailable=Boolean(url&&key);
const api=cloudAvailable?createClient(url,key,{auth:{persistSession:true,autoRefreshToken:true}}):null;
export async function getCloudSession(){if(!api)return null;const {data,error}=await api.auth.getSession();if(error)throw error;return data.session;}
export async function emailLogin(email){if(!api)throw Error('Nube no configurada.');const {error}=await api.auth.signInWithOtp({email,options:{emailRedirectTo:location.origin+location.pathname}});if(error)throw error;}
export async function cloudLogout(){if(!api)return;const {error}=await api.auth.signOut();if(error)throw error;}
export async function cloudSave(study){const session=await getCloudSession();if(!session)throw Error('Primero iniciá sesión.');const item={id:study.id,owner_id:session.user.id,student_label:study.student||'Sin alumno',title:study.name||'Estudio',payload:study,updated_at:new Date().toISOString()};const {error}=await api.from('ib_studies').upsert(item,{onConflict:'id'});if(error)throw error;return item;}
export async function cloudList(){const session=await getCloudSession();if(!session)throw Error('Primero iniciá sesión.');const {data,error}=await api.from('ib_studies').select('id,title,student_label,updated_at,owner_id,payload').order('updated_at',{ascending:false}).limit(150);if(error)throw error;return data||[];}
export async function cloudOpen(id){const session=await getCloudSession();if(!session)throw Error('Primero iniciá sesión.');const {data,error}=await api.from('ib_studies').select('id,owner_id,title,student_label,payload,updated_at').eq('id',id).single();if(error)throw error;return {study:data.payload,ownerId:data.owner_id,shared:data.owner_id!==session.user.id,updatedAt:data.updated_at};}
export async function cloudShare(studyId,memberId){const session=await getCloudSession();if(!session)throw Error('Primero iniciá sesión.');const {error}=await api.from('ib_study_members').upsert({study_id:studyId,owner_id:session.user.id,member_id:memberId,role:'viewer'},{onConflict:'study_id,member_id'});if(error)throw error;}

export async function cloudReviewCopy(source, originalOwnerId){
 const session=await getCloudSession();if(!session)throw Error('Primero iniciá sesión.');
 if(!source?.pgn)throw Error('No hay partida para corregir.');
 if(originalOwnerId===session.user.id)throw Error('El estudio ya es tuyo. Guardá los cambios normalmente.');
 const {data:teacher,error:roleError}=await api.from('ib_teachers').select('teacher_id').eq('teacher_id',session.user.id).maybeSingle();
 if(roleError)throw roleError;
 if(!teacher)throw Error('Solo una cuenta de profesor habilitada puede enviar correcciones.');
 // The review is a new record owned by the coach, never a write into the student's original.
 const copy={...structuredClone(source),id:crypto.randomUUID(),name:'Corrección · '+String(source.name||'Estudio').slice(0,130),reviewOf:source.id,created:new Date().toISOString(),updated:new Date().toISOString()};
 await cloudSave(copy);
 // A separate membership lets the student view the correction while retaining ownership.
 await cloudShare(copy.id,originalOwnerId);
 return copy;
}

export async function accountDetails(){
 const session=await getCloudSession();if(!session)return null;
 const [profile,teacher,teachers]=await Promise.all([
  api.from('ib_profiles').select('display_name').eq('user_id',session.user.id).maybeSingle(),
  api.from('ib_teachers').select('teacher_id,display_name').eq('teacher_id',session.user.id).maybeSingle(),
  api.from('ib_teachers').select('teacher_id,display_name').eq('active',true).order('display_name')
 ]);
 for(const r of [profile,teacher,teachers])if(r.error)throw r.error;
 return {id:session.user.id,email:session.user.email,name:profile.data?.display_name||'',isTeacher:Boolean(teacher.data),teachers:teachers.data||[]};
}
export async function saveAccountName(displayName){
 const session=await getCloudSession();if(!session)throw Error('Iniciá sesión.');
 const name=String(displayName).trim();
 if(name.length<1||name.length>80)throw Error('El nombre debe contener entre 1 y 80 caracteres.');
 const {error}=await api.from('ib_profiles').upsert({user_id:session.user.id,display_name:name},{onConflict:'user_id'});
 if(error)throw error;
}
export async function shareWithTeacher(studyId,teacherId){
 const session=await getCloudSession();if(!session)throw Error('Iniciá sesión.');
 const {data,error}=await api.from('ib_teachers').select('teacher_id').eq('teacher_id',teacherId).eq('active',true).maybeSingle();
 if(error)throw error;
 if(!data)throw Error('El profesor no está habilitado en el directorio.');
 if(teacherId===session.user.id)throw Error('El estudio ya pertenece a tu cuenta.');
 await cloudShare(studyId,teacherId);
}

export async function cloudDeleteOwned(studyId){
 const session=await getCloudSession();
 if(!session)throw Error('Primero iniciá sesión.');
 if(!/^[0-9a-f-]{36}$/i.test(String(studyId)))throw Error('Identificador de estudio inválido.');
 const {data,error}=await api.from('ib_studies')
  .delete().eq('id',studyId).eq('owner_id',session.user.id).select('id');
 if(error)throw error;
 if(!data?.length)throw Error('No se eliminó el estudio. Comprobá que seas propietario y que tus permisos estén activos.');
 return true;
}

export async function passwordSignIn(email,password){
 if(!api)throw Error('Conexión de Supabase no configurada.');
 const {data,error}=await api.auth.signInWithPassword({email,password});
 if(error)throw error;return data;
}
export async function passwordSignUp(email,password,displayName){
 if(!api)throw Error('Conexión de Supabase no configurada.');
 const {data,error}=await api.auth.signUp({email,password,options:{emailRedirectTo:location.origin+location.pathname,data:{display_name:displayName}}});
 if(error)throw error;return data;
}
export async function resetAccountPassword(email){
 if(!api)throw Error('Conexión de Supabase no configurada.');
 const {error}=await api.auth.resetPasswordForEmail(email,{redirectTo:location.origin+location.pathname});if(error)throw error;
}
export async function updateAccountPassword(password){
 if(!api)throw Error('Conexión de Supabase no configurada.');
 const {error}=await api.auth.updateUser({password});if(error)throw error;
}

export async function myEnrollments(){
 const session=await getCloudSession();if(!session)throw Error('Iniciá sesión.');
 const details=await accountDetails();
 if(details?.isTeacher){
  const {data,error}=await api.from('ib_enrollments').select('id,student_id,state,plan,expires_at,created_at').eq('teacher_id',session.user.id).order('created_at',{ascending:false});
  if(error)throw error;
  const ids=(data||[]).map(x=>x.student_id);
  let profiles=[];
  if(ids.length){const r=await api.from('ib_profiles').select('user_id,display_name').in('user_id',ids);if(r.error)throw r.error;profiles=r.data||[];}
  const names=new Map(profiles.map(x=>[x.user_id,x.display_name]));
  return {teacher:true,items:(data||[]).map(x=>({...x,name:names.get(x.student_id)||'Alumno sin nombre'}))};
 }
 const {data,error}=await api.from('ib_enrollments').select('id,teacher_id,state,plan,expires_at').eq('student_id',session.user.id);
 if(error)throw error;return {teacher:false,items:data||[]};
}
export async function requestTeacher(teacherId){
 const session=await getCloudSession();if(!session)throw Error('Iniciá sesión.');
 const {error}=await api.from('ib_enrollments').insert({teacher_id:teacherId,student_id:session.user.id,state:'pending',plan:'Sin plan'});
 if(error)throw error;
}
export async function setStudentEnrollment(id,state,plan,expiresAt){
 const session=await getCloudSession();const account=await accountDetails();
 if(!session||!account?.isTeacher)throw Error('Cuenta de profesor requerida.');
 if(!['pending','active','paused','ended'].includes(state))throw Error('Estado inválido.');
 const payload={state,plan:String(plan||'Sin plan').slice(0,80),expires_at:expiresAt||null};
 const {error}=await api.from('ib_enrollments').update(payload).eq('id',id).eq('teacher_id',session.user.id);
 if(error)throw error;
}
