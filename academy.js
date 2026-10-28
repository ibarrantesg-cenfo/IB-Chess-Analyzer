import {accountDetails,myEnrollments,setStudentEnrollment,cloudAvailable,getAccessRequests,reviewAccessRequest} from './cloud.js';
export function initAcademy({notify,onBack}){
 const page=document.querySelector('main.main'),layout=page.querySelector('.layout'),toolbar=page.querySelector('.toolbar'),tools=page.querySelector('.workspace-tools'),screen=document.createElement('section');
 screen.className='academy-screen';screen.hidden=true;
 screen.innerHTML='<header class="academy-head"><div><div class="eyebrow">IB CHESS ACADEMY · ADMINISTRACIÓN</div><h2>Academia · Profe Ian</h2><p>Alumnos, solicitudes, planes y vigencias en un espacio independiente.</p></div><button class="btn outline" id="academy-refresh">↻ Actualizar</button></header><div id="academy-notice" role="status"></div><div class="academy-stats" id="academy-stats"></div><h3>Solicitudes pendientes</h3><div class="academy-roster" id="academy-requests"></div><details class="academy-history" id="academy-history"><summary><span>Historial de solicitudes</span><span id="academy-history-count">0 registros</span></summary><div class="academy-history-body" id="academy-history-list"></div></details><h3>Alumnos vinculados</h3><div class="academy-roster" id="academy-roster"></div>';
 page.insertBefore(screen,page.querySelector('footer'));
 const $=id=>screen.querySelector('#'+id);
 let active=false;
 const close=()=>{active=false;screen.hidden=true;document.querySelector('#nav-academy')?.classList.remove('active');};
 const show=async()=>{const account=await accountDetails().catch(()=>null);if(!account?.isTeacher){notify('Solo un profesor autorizado puede abrir Academia.','err');return;}active=true;screen.hidden=false;layout.hidden=true;toolbar.hidden=true;tools.hidden=true;document.querySelector('#nav-academy')?.classList.add('active');document.querySelector('.topbar h1').textContent='Academia';document.querySelector('.topbar p').textContent='Administrá alumnos, solicitudes y suscripciones desde tu cuenta de profesor.';window.scrollTo(0,0);await refresh();};
 const refresh=async()=>{
  if(!active)return;
  try{
   const account=await accountDetails();if(!account?.isTeacher){close();onBack();return;}
   const requestRoot=$('academy-requests'), historyRoot=$('academy-history-list');
   const historyOpen=$('academy-history').open;
   requestRoot.replaceChildren();historyRoot.replaceChildren();
   let pendingRequests=0;
   try{
    const requests=await getAccessRequests();
    const pending=requests.filter(r=>r.status==='pending');
    const archived=requests.filter(r=>r.status!=='pending').sort((a,b)=>new Date(b.reviewed_at||b.created_at)-new Date(a.reviewed_at||a.created_at));
    pendingRequests=pending.length;
    $('academy-history-count').textContent=archived.length+' '+(archived.length===1?'registro':'registros');
    if(!pending.length){const empty=document.createElement('p');empty.className='academy-muted';empty.textContent='No hay solicitudes por revisar.';requestRoot.append(empty);}
    for(const req of pending){
      const card=document.createElement('section');card.className='academy-student academy-request';
      const h=document.createElement('h3');h.textContent=req.full_name;
      const email=document.createElement('p');email.className='academy-muted';email.textContent=req.email;
      const desc=document.createElement('p');desc.textContent='Rol solicitado: '+(req.requested_role==='teacher'?'Profesor':'Alumno');
      const actions=document.createElement('div');actions.className='academy-request-actions';
      const role=document.createElement('select');role.setAttribute('aria-label','Rol que se aprobará');
      for(const [v,t] of [['student','Alumno'],['teacher','Profesor']]){const o=document.createElement('option');o.value=v;o.textContent=t;role.append(o);}
      role.value=req.requested_role;
      const approve=document.createElement('button');approve.className='btn primary';approve.textContent='Aprobar';
      const reject=document.createElement('button');reject.className='btn outline';reject.textContent='Rechazar';
      const act=async status=>{approve.disabled=true;reject.disabled=true;try{await reviewAccessRequest(req.id,status,role.value);notify(status==='approved'?'Solicitud aprobada.':'Solicitud rechazada.');await refresh();}catch(e){notify(e.message,'err');approve.disabled=false;reject.disabled=false;}};
      approve.onclick=()=>act('approved');reject.onclick=()=>act('rejected');
      const note=document.createElement('small');note.textContent='La aprobación autoriza una futura invitación, no crea credenciales por sí sola.';
      actions.append(role,approve,reject);card.append(h,email,desc,actions,note);requestRoot.append(card);
    }
    if(!archived.length){const empty=document.createElement('p');empty.className='academy-muted';empty.textContent='Todavía no hay solicitudes resueltas.';historyRoot.append(empty);}
    for(const req of archived){
      const item=document.createElement('div');item.className='academy-history-entry';
      const info=document.createElement('div');info.className='academy-history-info';
      const name=document.createElement('strong');name.textContent=req.full_name;
      const email=document.createElement('small');email.textContent=req.email;
      const meta=document.createElement('small');meta.textContent='Rol: '+(req.granted_role==='teacher'?'Profesor':req.granted_role==='student'?'Alumno':req.requested_role==='teacher'?'Profesor solicitado':'Alumno solicitado')+' · '+(req.reviewed_at?new Date(req.reviewed_at).toLocaleDateString('es-CR'):'Sin fecha de revisión');
      info.append(name,email,meta);
      const badge=document.createElement('span');badge.className='academy-history-status '+(req.status==='approved'?'approved':'other');
      badge.textContent=({approved:'Aprobada',rejected:'Rechazada',suspended:'Suspendida'})[req.status]||req.status;
      item.append(info,badge);
      if(req.status==='approved'){
        const copy=document.createElement('button');copy.className='btn outline academy-history-copy';copy.textContent='Copiar correo';
        copy.onclick=async()=>{try{await navigator.clipboard.writeText(req.email);notify('Correo copiado para la invitación.');}catch(e){notify('No se pudo copiar el correo.','err');}};
        item.append(copy);
      }
      historyRoot.append(item);
    }
    $('academy-history').open=historyOpen;
   }catch(error){requestRoot.textContent='No se pudieron cargar las solicitudes: '+error.message;}
   const response=await myEnrollments(),items=response.items||[];
   const total=items.length,activeCount=items.filter(x=>x.state==='active').length,pending=pendingRequests+items.filter(x=>x.state==='pending').length;
   $('academy-notice').textContent='Las solicitudes y las cuentas vinculadas se administran por separado. Nunca se muestran contraseñas.';
   $('academy-stats').replaceChildren();
   for(const [value,label] of [[total,'Alumnos'],[activeCount,'Activos'],[pending,'Pendientes']]){const b=document.createElement('div');b.className='academy-stat';const n=document.createElement('strong');n.textContent=value;const t=document.createElement('span');t.textContent=label;b.append(n,t);$('academy-stats').append(b);}
   $('academy-roster').replaceChildren();
   if(!items.length){const p=document.createElement('p');p.textContent='Todavía no hay alumnos vinculados. Compartí el enlace de registro para recibir solicitudes.';$('academy-roster').append(p);}
   for(const item of items){
    const card=document.createElement('section');card.className='academy-student';
    const heading=document.createElement('div');heading.className='academy-student-head';
    const name=document.createElement('h3');name.textContent=item.name&&item.name!=='Alumno sin nombre'?item.name:'Alumno · perfil pendiente de completar';const state=document.createElement('span');state.textContent=item.state;heading.append(name,state);
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
