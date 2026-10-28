import {accountDetails,myEnrollments,setStudentEnrollment,cloudAvailable} from './cloud.js';
export function initAcademy({notify,onBack}){
 const page=document.querySelector('main.main'),layout=page.querySelector('.layout'),toolbar=page.querySelector('.toolbar'),tools=page.querySelector('.workspace-tools'),screen=document.createElement('section');
 screen.className='academy-screen';screen.hidden=true;
 screen.innerHTML='<header class="academy-head"><div><div class="eyebrow">IB CHESS ACADEMY · ADMINISTRACIÓN</div><h2>Academia · Profe Ian</h2><p>Alumnos, solicitudes, planes y vigencias en un espacio independiente.</p></div><button class="btn outline" id="academy-refresh">↻ Actualizar</button></header><div id="academy-notice" role="status"></div><div class="academy-stats" id="academy-stats"></div><div class="academy-roster" id="academy-roster"></div>';
 page.insertBefore(screen,page.querySelector('footer'));
 const $=id=>screen.querySelector('#'+id);
 let active=false;
 const close=()=>{active=false;screen.hidden=true;document.querySelector('#nav-academy')?.classList.remove('active');};
 const show=async()=>{const account=await accountDetails().catch(()=>null);if(!account?.isTeacher){notify('Solo un profesor autorizado puede abrir Academia.','err');return;}active=true;screen.hidden=false;layout.hidden=true;toolbar.hidden=true;tools.hidden=true;document.querySelector('#nav-academy')?.classList.add('active');document.querySelector('.topbar h1').textContent='Academia';window.scrollTo(0,0);await refresh();};
 const refresh=async()=>{
  if(!active)return;
  try{
   const account=await accountDetails();if(!account?.isTeacher){close();onBack();return;}
   const response=await myEnrollments(),items=response.items||[];
   const total=items.length,activeCount=items.filter(x=>x.state==='active').length,pending=items.filter(x=>x.state==='pending').length;
   $('academy-notice').textContent='Gestioná las solicitudes desde tu cuenta. Solo Supabase Auth valida identidades; nunca se muestran contraseñas.';
   $('academy-stats').replaceChildren();
   for(const [value,label] of [[total,'Alumnos'],[activeCount,'Activos'],[pending,'Pendientes']]){const b=document.createElement('div');b.className='academy-stat';const n=document.createElement('strong');n.textContent=value;const t=document.createElement('span');t.textContent=label;b.append(n,t);$('academy-stats').append(b);}
   $('academy-roster').replaceChildren();
   if(!items.length){const p=document.createElement('p');p.textContent='Todavía no hay alumnos vinculados. Compartí el enlace de registro para recibir solicitudes.';$('academy-roster').append(p);}
   for(const item of items){
    const card=document.createElement('section');card.className='academy-student';
    const heading=document.createElement('div');heading.className='academy-student-head';
    const name=document.createElement('h3');name.textContent=item.name||'Alumno';const state=document.createElement('span');state.textContent=item.state;heading.append(name,state);
    const fields=document.createElement('div');fields.className='academy-fields';
    const status=document.createElement('select');for(const [value,label] of [['pending','Pendiente'],['active','Activo'],['paused','Pausado'],['ended','Finalizado']]){const o=document.createElement('option');o.value=value;o.textContent=label;status.append(o);}status.value=item.state;
    const plan=document.createElement('input');plan.placeholder='Plan de suscripción';plan.value=item.plan||'Sin plan';plan.maxLength=80;
    const expiry=document.createElement('input');expiry.type='date';expiry.value=item.expires_at?.slice(0,10)||'';
    for(const [label,input] of [['Acceso',status],['Plan',plan],['Vencimiento',expiry]]){const wrapper=document.createElement('label');wrapper.textContent=label;wrapper.append(input);fields.append(wrapper);}
    const save=document.createElement('button');save.className='btn primary';save.textContent='Guardar cambios';
    save.onclick=async()=>{save.disabled=true;try{await setStudentEnrollment(item.id,status.value,plan.value,expiry.value?new Date(expiry.value+'T23:59:59Z').toISOString():null);notify('Alumno actualizado.');await refresh();}catch(e){notify(e.message,'err');}finally{save.disabled=false;}};
    card.append(heading,fields,save);$('academy-roster').append(card);
   }
  }catch(e){$('academy-notice').textContent='No se pudo cargar la academia: '+e.message;}
 };
 $('academy-refresh').onclick=refresh;
 return {show,close,refresh};
}
