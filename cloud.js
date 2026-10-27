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
export async function cloudOpen(id){const session=await getCloudSession();if(!session)throw Error('Primero iniciá sesión.');const {data,error}=await api.from('ib_studies').select('payload').eq('id',id).single();if(error)throw error;return data.payload;}
export async function cloudShare(studyId,memberId){const session=await getCloudSession();if(!session)throw Error('Primero iniciá sesión.');const {error}=await api.from('ib_study_members').upsert({study_id:studyId,owner_id:session.user.id,member_id:memberId,role:'viewer'},{onConflict:'study_id,member_id'});if(error)throw error;}
