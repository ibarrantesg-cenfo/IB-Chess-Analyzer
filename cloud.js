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
export async function cloudSave(study){await assertCloudStudyAccess();const session=await getCloudSession();if(!session)throw Error('Primero iniciá sesión.');const item={id:study.id,owner_id:session.user.id,student_label:study.student||'Sin alumno',title:study.name||'Estudio',payload:study,updated_at:new Date().toISOString()};const {error}=await api.from('ib_studies').upsert(item,{onConflict:'id'});if(error)throw error;return item;}
export async function cloudList(){await assertCloudStudyAccess();const session=await getCloudSession();if(!session)throw Error('Primero iniciá sesión.');const {data,error}=await api.from('ib_studies').select('id,title,student_label,updated_at,owner_id,payload').order('updated_at',{ascending:false}).limit(150);if(error)throw error;return data||[];}
export async function cloudOpen(id){await assertCloudStudyAccess();const session=await getCloudSession();if(!session)throw Error('Primero iniciá sesión.');const {data,error}=await api.from('ib_studies').select('id,owner_id,title,student_label,payload,updated_at').eq('id',id).single();if(error)throw error;return {study:data.payload,ownerId:data.owner_id,shared:data.owner_id!==session.user.id,updatedAt:data.updated_at};}
export async function cloudShare(studyId,memberId){await assertCloudStudyAccess();const session=await getCloudSession();if(!session)throw Error('Primero iniciá sesión.');const {error}=await api.from('ib_study_members').upsert({study_id:studyId,owner_id:session.user.id,member_id:memberId,role:'viewer'},{onConflict:'study_id,member_id'});if(error)throw error;}

export async function cloudReviewCopy(source, originalOwnerId){await assertCloudStudyAccess();
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

export async function cloudDeleteOwned(studyId){await assertCloudStudyAccess();
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

export function onAccountChange(callback){if(!api)return ()=>{};const {data}=api.auth.onAuthStateChange(()=>{queueMicrotask(()=>callback());});return ()=>data.subscription.unsubscribe();}

export async function submitAccessRequest(email,fullName,requestedRole='student'){
 if(!api)throw Error('Supabase no está configurado.');
 const payload={email:String(email).trim().toLowerCase(),full_name:String(fullName).trim(),requested_role:requestedRole==='teacher'?'teacher':'student'};
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email)||payload.full_name.length<2)throw Error('Ingresá un correo y nombre válidos.');
 const {error}=await api.from('ib_access_requests').insert(payload);
 if(error)throw error;return true;
}
export async function getAccessRequests(){
 const account=await accountDetails();if(!account?.isTeacher)throw Error('Solo profesores autorizados.');
 const {data,error}=await api.from('ib_access_requests').select('id,email,full_name,requested_role,granted_role,status,created_at,reviewed_at').order('created_at',{ascending:false});
 if(error)throw error;return data||[];
}
export async function reviewAccessRequest(id,status,grantedRole){
 const session=await getCloudSession(),account=await accountDetails();
 if(!session||!account?.isTeacher)throw Error('Solo profesores autorizados.');
 if(!['approved','rejected','suspended'].includes(status)||!['student','teacher'].includes(grantedRole))throw Error('Decisión inválida.');
 const {error}=await api.from('ib_access_requests').update({status,granted_role:grantedRole,reviewed_at:new Date().toISOString(),reviewed_by:session.user.id}).eq('id',id);
 if(error)throw error;
}

export async function assertCloudStudyAccess(){
 const session=await getCloudSession();
 if(!session)throw Error('Iniciá sesión para utilizar tus estudios en la nube.');
 const {data:teacher,error:teacherError}=await api.from('ib_teachers').select('teacher_id').eq('teacher_id',session.user.id).eq('active',true).maybeSingle();
 if(teacherError)throw teacherError;
 if(teacher)return true;
 const {data:enrollments,error}=await api.from('ib_enrollments').select('state,expires_at').eq('student_id',session.user.id).eq('state','active');
 if(error)throw error;
 const now=Date.now();
 if(!(enrollments||[]).some(e=>!e.expires_at||new Date(e.expires_at).getTime()>now))
  throw Error('Tu acceso a estudios en la nube no está activo o venció. Contactá a Profe Ian. Tus archivos no fueron eliminados.');
 return true;
}

export async function completeApprovedStudentOnboarding(){
 const session=await getCloudSession();if(!session)return 'not_authenticated';
 const {data,error}=await api.rpc('ib_complete_approved_student_onboarding');
 if(error){if(error.code==='PGRST202'||error.code==='42883')return 'setup_required';throw error;}
 return data;
}

/* Academic portfolio and assignments. All access is additionally enforced in Supabase RLS. */
export async function academicGames(studentId){
 const session=await getCloudSession();if(!session)throw Error('Iniciá sesión.');
 const query=api.from('ib_student_games').select('id,student_id,title,event_name,played_at,white_name,black_name,result,pgn,review,created_at').order('created_at',{ascending:false}).limit(250);
 const {data,error}=await query.eq('student_id',studentId||session.user.id);if(error)throw error;return data||[];
}
export async function submitAcademicGame(item){
 const session=await getCloudSession();if(!session)throw Error('Iniciá sesión.');
 const payload={student_id:session.user.id,title:String(item.title||'Partida').slice(0,180),event_name:String(item.event_name||'Sin torneo').slice(0,160),played_at:item.played_at||null,pgn:String(item.pgn||''),white_name:item.white_name||'',black_name:item.black_name||'',result:item.result||'*',review:item.review||{}};
 const {error}=await api.from('ib_student_games').insert(payload);if(error)throw error;
}
export async function academicAssignments(studentId){
 const session=await getCloudSession();if(!session)throw Error('Iniciá sesión.');
 const {data,error}=await api.from('ib_assignments').select('id,teacher_id,student_id,title,instructions,kind,reference_pgn,due_at,created_at').eq('student_id',studentId||session.user.id).order('created_at',{ascending:false});if(error)throw error;return data||[];
}
export async function createAcademicAssignment(item){
 const session=await getCloudSession(),account=await accountDetails();if(!account?.isTeacher||!session)throw Error('Solo profesores.');
 const payload={teacher_id:session.user.id,student_id:item.student_id,title:item.title,instructions:item.instructions||'',kind:item.kind||'analysis',reference_pgn:item.reference_pgn||'',due_at:item.due_at||null};
 const {error}=await api.from('ib_assignments').insert(payload);if(error)throw error;
}
export async function academicSubmissions(assignmentIds){
 if(!assignmentIds?.length)return [];
 const {data,error}=await api.from('ib_assignment_submissions').select('id,assignment_id,student_id,notes,submitted_pgn,feedback,reviewed_at,submitted_at').in('assignment_id',assignmentIds);
 if(error)throw error;return data||[];
}
export async function deliverAcademicAssignment(assignmentId,notes,pgn){
 const session=await getCloudSession();if(!session)throw Error('Iniciá sesión.');
 const {error}=await api.from('ib_assignment_submissions').upsert({assignment_id:assignmentId,student_id:session.user.id,notes:String(notes||'').slice(0,10000),submitted_pgn:String(pgn||'').slice(0,500000),submitted_at:new Date().toISOString()},{onConflict:'assignment_id,student_id'});
 if(error)throw error;
}
export async function reviewAcademicSubmission(assignmentId,studentId,feedback){
 const {error}=await api.rpc('ib_review_submission',{p_assignment:assignmentId,p_student:studentId,p_feedback:feedback});if(error)throw error;
}

export async function academicSharedStudies(studentId){
 const session=await getCloudSession();if(!session)throw Error('Iniciá sesión.');
 const {data,error}=await api.from('ib_studies').select('id,owner_id,title,student_label,payload,updated_at').eq('owner_id',studentId).order('updated_at',{ascending:false}).limit(100);
 if(error)throw error;return data||[];
}
