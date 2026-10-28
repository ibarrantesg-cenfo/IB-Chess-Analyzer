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
export async function cloudList(){const session=await getCloudSession();if(!session)throw Error('Primero iniciá sesión.');const {data,error}=await api.from('ib_studies').select('id,title,student_label,updated_at,owner_id').order('updated_at',{ascending:false}).limit(150);if(error)throw error;return data||[];}
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
