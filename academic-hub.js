import {Chess} from 'chess.js';
import {accountDetails,getCloudSession,myEnrollments,academicGames,submitAcademicGame,academicAssignments,createAcademicAssignment,academicSubmissions,deliverAcademicAssignment,reviewAcademicSubmission,academicSharedStudies} from './cloud.js';
import {gameMetrics} from './performance.js';

const make=(tag,text='',className='')=>{const el=document.createElement(tag);if(text)el.textContent=text;if(className)el.className=className;return el;};
const button=(label,handler,cls='btn outline')=>{const b=make('button',label,cls);b.type='button';b.onclick=handler;return b;};
const field=(label,type='text',value='')=>{const wrap=make('label','', 'academic-field');const span=make('span',label);const input=make(type==='textarea'?'textarea':'input');if(type!=='textarea')input.type=type;input.value=value;wrap.append(span,input);return {wrap,input};};
const localDate=x=>x?new Date(x).toLocaleDateString('es-CR'):'—';
const validatePGN=(text)=>{const chess=new Chess();try{chess.loadPgn(text,{strict:false});if(!chess.history().length)throw Error('El PGN no contiene jugadas.');return {pgn:chess.pgn(),headers:chess.header(),moves:chess.history({verbose:true})};}catch(e){throw Error('PGN inválido: '+e.message);}};
const textOf=(x)=>String(x??'');
export function initAcademicHub({notify}){
 const page=document.querySelector('main.main'),layout=page.querySelector('.layout'),toolbar=page.querySelector('.toolbar'),tools=page.querySelector('.workspace-tools');
 const screen=make('section','','academic-hub');screen.hidden=true;
 page.insertBefore(screen,page.querySelector('footer'));
 const nav=document.querySelector('#nav-academic');
 let opened=false;
 async function open(){
  const account=await accountDetails();if(!account){notify('Ingresá con tu cuenta de alumno.','err');return;}
  opened=true;layout.hidden=true;toolbar.hidden=true;tools.hidden=true;
  document.querySelector('.topbar h1').textContent='Mi entrenamiento';
  document.querySelector('.topbar p').textContent='Mis partidas, torneos y tareas de IB Chess Academy.';
  screen.hidden=false;nav?.classList.add('active');await refresh();
 }
 function close(){opened=false;screen.hidden=true;nav?.classList.remove('active');}
 async function refresh(){
  if(!opened)return;screen.replaceChildren();
  const head=make('div','','academic-title');head.append(make('h2','Mi entrenamiento'),make('p','Las partidas enviadas se guardan en la nube. Tus análisis locales solo se comparten cuando elegís enviarlos.'));
  screen.append(head);
  try{
   const session=await getCloudSession();
   const [games,tasks]=await Promise.all([academicGames(),academicAssignments()]);
   const submissions=await academicSubmissions(tasks.map(t=>t.id));
   const stat=make('div','','academic-summary');for(const [n,label] of [[games.length,'Partidas enviadas'],[new Set(games.map(g=>g.event_name)).size,'Torneos'],[tasks.length,'Tareas asignadas'],[submissions.length,'Entregas']]){const box=make('div','','academy-stat');box.append(make('strong',String(n)),make('span',label));stat.append(box);}screen.append(stat);
   const submit=make('details','','academic-panel');submit.open=!games.length;
   const sm=make('summary','Enviar una partida PGN');submit.append(sm);
   submit.append(make('p','Pegá un PGN válido. También podés copiar la partida abierta en Game Review; si ya fue analizada se adjuntará el informe técnico.'));
   const title=field('Título de la partida'),event=field('Torneo / evento'),date=field('Fecha de la partida','date'),pgn=field('PGN completo','textarea');
   submit.append(title.wrap,event.wrap,date.wrap,pgn.wrap);
   submit.append(button('Usar partida de Game Review',()=>{const current=window.IB_ACADEMIC_CURRENT?.();if(!current){notify('No hay una partida abierta.','err');return;}pgn.input.value=current.pgn;title.input.value=current.title;event.input.value=current.event;notify('Partida copiada desde Game Review.');}));
   submit.append(button('Enviar a mi profesor',async()=>{try{const parsed=validatePGN(pgn.input.value.trim());const current=window.IB_ACADEMIC_CURRENT?.();const review=current?.pgn===parsed.pgn?current.review:{};await submitAcademicGame({title:title.input.value.trim()||parsed.headers.Event||'Partida',event_name:event.input.value.trim()||parsed.headers.Event||'Sin torneo',played_at:date.input.value||null,pgn:parsed.pgn,white_name:parsed.headers.White||'',black_name:parsed.headers.Black||'',result:parsed.headers.Result||'*',review});notify('Partida enviada a tu carpeta académica.');await refresh();}catch(e){notify(e.message,'err');}},'btn primary'));
   screen.append(submit);
   const history=make('section','','academic-panel');history.append(make('h3','Mis partidas y torneos'));
   if(!games.length)history.append(make('p','Aún no hay partidas enviadas.'));
   const byEvent=new Map();for(const g of games){const k=g.event_name||'Sin torneo';if(!byEvent.has(k))byEvent.set(k,[]);byEvent.get(k).push(g);}
   for(const [eventName,list] of byEvent){const group=make('details','','academic-event');group.append(make('summary',eventName+' · '+list.length+' partida(s)'));for(const g of list){const row=make('div','','academic-game-row');row.append(make('strong',g.title),make('small',[g.white_name,g.black_name].filter(Boolean).join(' – ')+' · '+(g.result||'*')));const summary=technicalSummary(g);row.append(make('small',summary));row.append(button('Abrir partida',()=>window.IB_LOAD_ACADEMIC_GAME?.(g.pgn,g.title)));group.append(row);}history.append(group);}screen.append(history);
   const taskSection=make('section','','academic-panel');taskSection.append(make('h3','Tareas asignadas'));
   if(!tasks.length)taskSection.append(make('p','Tu profesor todavía no te asignó tareas.'));
   for(const task of tasks){const own=submissions.find(s=>s.assignment_id===task.id);const card=make('details','','academic-task');card.append(make('summary',task.title+' · '+(own?.reviewed_at?'Corregida':own?'Entregada':'Pendiente')));
     card.append(make('p',task.instructions||'Sin instrucciones'),make('small','Entrega: '+(task.due_at||'sin fecha')));
     if(task.reference_pgn)card.append(button('Abrir PGN de la tarea',()=>window.IB_LOAD_ACADEMIC_GAME?.(task.reference_pgn,task.title)));
     const note=field('Tu resolución / observaciones','textarea',own?.notes||''),answer=field('PGN resuelto (opcional)','textarea',own?.submitted_pgn||'');
     card.append(note.wrap,answer.wrap);
     card.append(button('Entregar tarea',async()=>{try{if(answer.input.value.trim())validatePGN(answer.input.value);await deliverAcademicAssignment(task.id,note.input.value,answer.input.value);notify('Tarea entregada.');await refresh();}catch(e){notify(e.message,'err');}},'btn primary'));
     if(own?.feedback)card.append(make('p','Devolución del profesor: '+own.feedback,'academic-feedback'));
     taskSection.append(card);
   }
   screen.append(taskSection);
  }catch(e){screen.append(make('p','No se pudo cargar Mi entrenamiento. Aplicá la migración ib_academic_workspace.sql en Supabase. Detalle: '+e.message,'academic-error'));}
 }
 return {open,close,refresh};
}
function technicalSummary(game){
 const reports=game.review?.reports;if(!Array.isArray(reports)||!reports.length)return 'Sin análisis técnico compartido';
 try{const parsed=validatePGN(game.pgn);const m=gameMetrics(parsed,reports);const fmt=s=>m[s].complete?m[s].quality.toFixed(1)+'%':m[s].count?m[s].quality.toFixed(1)+'% parcial':'—';return 'Precisión estimada B: '+fmt('w')+' · N: '+fmt('b');}catch{return 'Informe técnico pendiente';}
}
export function appendTeacherAcademicTools(card,student,notify){
 const details=make('details','','academic-teacher-panel');details.append(make('summary','Ficha deportiva · Partidas, torneos y tareas'));
 const content=make('div','','academic-teacher-content');details.append(content);card.append(details);
 details.addEventListener('toggle',()=>{if(details.open)load();});
 async function load(){
  content.replaceChildren(make('p','Cargando ficha del alumno...'));
  try{
   const [games,tasks]=await Promise.all([academicGames(student.student_id),academicAssignments(student.student_id)]);
   const submissions=await academicSubmissions(tasks.map(t=>t.id));content.replaceChildren();
   const stats=make('div','','academic-summary');
   for(const [v,label] of [[games.length,'Partidas'],[new Set(games.map(g=>g.event_name)).size,'Torneos'],[tasks.length,'Tareas'],[submissions.length,'Entregas']]){const item=make('div','','academy-stat');item.append(make('strong',String(v)),make('span',label));stats.append(item);}content.append(stats);
   const tourney=make('div','','academic-subsection');tourney.append(make('h4','Torneos y partidas'));
   const events=new Map();for(const g of games){const k=g.event_name||'Sin torneo';if(!events.has(k))events.set(k,[]);events.get(k).push(g);}
   if(!games.length)tourney.append(make('p','El alumno aún no ha compartido partidas.'));else for(const [event,rounds] of events){const grp=make('details','','academic-event');grp.append(make('summary',event+' · '+rounds.length+' partidas'));let quality={w:[],b:[]};for(const g of rounds){let summary=technicalSummary(g);if(g.review?.reports?.length)try{const m=gameMetrics(validatePGN(g.pgn),g.review.reports);for(const side of ['w','b'])if(m[side].complete)quality[side].push(m[side].quality);}catch{}const row=make('div','','academic-game-row');row.append(make('strong',g.title),make('small',g.white_name+' – '+g.black_name+' · '+g.result),make('small',summary));row.append(button('Analizar en Game Review',()=>window.IB_LOAD_ACADEMIC_GAME?.(g.pgn,g.title)));grp.append(row);}const mean=a=>a.length?(a.reduce((x,y)=>x+y,0)/a.length).toFixed(1)+'%':'—';grp.prepend(make('p','Precisión estimada (solo análisis completos): Blancas '+mean(quality.w)+' · Negras '+mean(quality.b)));tourney.append(grp);}content.append(tourney);
   const sharedPanel=make('section','','academic-subsection');sharedPanel.append(make('h4','Estudios de biblioteca compartidos con el profesor'));
   try{const shared=await academicSharedStudies(student.student_id);
    if(!shared.length)sharedPanel.append(make('p','Este alumno todavía no compartió estudios desde la biblioteca en la nube.'));
    for(const item of shared){const row=make('div','','academic-game-row');row.append(make('strong',item.title||'Estudio'),make('small','Actualizado: '+localDate(item.updated_at)));
     const pgn=item.payload?.pgn;if(pgn)row.append(button('Abrir estudio',()=>window.IB_LOAD_ACADEMIC_GAME?.(pgn,item.title)));
     else row.append(make('small','Estudio sin PGN directo; consultalo en Biblioteca PGN.'));
     sharedPanel.append(row);}
   }catch(e){sharedPanel.append(make('p','No se pudieron consultar estudios compartidos: '+e.message));}
   content.append(sharedPanel);
   const assignment=make('section','','academic-subsection');assignment.append(make('h4','Asignar tarea'));
   const title=field('Título'),instructions=field('Instrucciones','textarea'),kind=field('Tipo de tarea'),due=field('Fecha límite','date'),ref=field('PGN de referencia (opcional)','textarea');
   const kindSelect=make('select');for(const [v,n] of [['analysis','Análisis de partida'],['calculation','Cálculo'],['opening','Aperturas'],['endgame','Finales'],['other','Otra']]){const o=make('option',n);o.value=v;kindSelect.append(o);}kind.input.replaceWith(kindSelect);
   assignment.append(title.wrap,instructions.wrap,kind.wrap,due.wrap,ref.wrap);
   assignment.append(button('Asignar tarea',async()=>{try{if(title.input.value.trim().length<3)throw Error('El título debe tener al menos 3 caracteres.');if(ref.input.value.trim())validatePGN(ref.input.value);await createAcademicAssignment({student_id:student.student_id,title:title.input.value.trim(),instructions:instructions.input.value,kind:kindSelect.value,due_at:due.input.value,reference_pgn:ref.input.value});notify('Tarea asignada.');await load();}catch(e){notify(e.message,'err');}},'btn primary'));content.append(assignment);
   const taskList=make('section','','academic-subsection');taskList.append(make('h4','Tareas y correcciones'));
   for(const task of tasks){const sub=submissions.find(s=>s.assignment_id===task.id),t=make('details','','academic-task');t.append(make('summary',task.title+' · '+(sub?.reviewed_at?'Corregida':sub?'Entregada':'Pendiente')));
    t.append(make('p',task.instructions),make('small','Límite: '+(task.due_at||'sin fecha')));
    if(sub){t.append(make('p','Respuesta: '+sub.notes));if(sub.submitted_pgn)t.append(button('Abrir PGN entregado',()=>window.IB_LOAD_ACADEMIC_GAME?.(sub.submitted_pgn,task.title)));const fb=field('Devolución al estudiante','textarea',sub.feedback||'');t.append(fb.wrap,button('Guardar corrección',async()=>{try{await reviewAcademicSubmission(task.id,student.student_id,fb.input.value);notify('Corrección enviada.');await load();}catch(e){notify(e.message,'err');}},'btn primary'));}taskList.append(t);
   }if(!tasks.length)taskList.append(make('p','Todavía no hay tareas.'));content.append(taskList);
  }catch(e){content.replaceChildren(make('p','No se pudo abrir la ficha. '+e.message,'academic-error'));}
 }
}
