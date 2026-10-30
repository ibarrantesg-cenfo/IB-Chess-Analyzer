import { findReview } from './review-cache.js';
import {Chess} from 'chess.js';
import {accountDetails,getCloudSession,myEnrollments,academicGames,submitAcademicGame,academicAssignments,createAcademicAssignment,academicSubmissions,deliverAcademicAssignment,reviewAcademicSubmission,academicSharedStudies,submitAcademicGameForStudent} from './cloud.js';
import {gameMetrics,fidePerformance} from './performance.js';

const make=(tag,text='',className='')=>{const el=document.createElement(tag);if(text)el.textContent=text;if(className)el.className=className;return el;};
const button=(label,handler,cls='btn outline')=>{const b=make('button',label,cls);b.type='button';b.onclick=handler;return b;};
const field=(label,type='text',value='')=>{const wrap=make('label','', 'academic-field');const span=make('span',label);const input=make(type==='textarea'?'textarea':'input');if(type!=='textarea')input.type=type;input.value=value;wrap.append(span,input);return {wrap,input};};
const localDate=x=>x?new Date(x).toLocaleDateString('es-CR'):'—';
const validatePGN=(text)=>{const chess=new Chess();try{chess.loadPgn(text,{strict:false});if(!chess.history().length)throw Error('El PGN no contiene jugadas.');return {pgn:chess.pgn(),headers:chess.header(),moves:chess.history({verbose:true})};}catch(e){throw Error('PGN inválido: '+e.message);}};
const textOf=(x)=>String(x??'');
const normalizePlayer=name=>String(name||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z ]+/g,' ').replace(/\s+/g,' ').trim();
const splitTournamentPGN=source=>{
 const text=String(source||'').replace(/\r/g,'');
 const marks=[...text.matchAll(/^\s*\[(?:Event|Site|Date|Round|White|Black|Result)\s+"/gm)].map(m=>m.index);
 const starts=[...text.matchAll(/^\s*\[Event\s+"/gm)].map(m=>m.index);
 if(starts.length>1)return starts.map((at,i)=>text.slice(at,starts[i+1]??text.length).trim()).filter(Boolean);
 // No event headers? A single PGN can be imported, but not a guess about game boundaries.
 return [text.trim()].filter(Boolean);
};
const cachedAcademicReview=async game=>{
 try{
  const saved=await findReview(game);
  if(saved?.reports?.length===game.moves.length)return {reports:saved.reports,evaluations:saved.evaluations||[],depth:saved.depth||null,engine:saved.engine||'stockfish19'};
 }catch(e){console.warn('No se pudo recuperar el análisis local:',e.message);}
 return {};
};
const pgnDate=x=>/^\d{4}\.\d{2}\.\d{2}$/.test(x||'')&&!String(x).includes('??')?x.replace(/\./g,'-'):null;
const playerSideFor=(headers,name)=>{
 const needle=normalizePlayer(name),white=normalizePlayer(headers.White),black=normalizePlayer(headers.Black);
 if(!needle)return null;
 if(white===needle&&black!==needle)return 'w';
 if(black===needle&&white!==needle)return 'b';
 return null;
};

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
   const account=await accountDetails();const accountNameForImport=()=>account?.name||'';
   const session=await getCloudSession();
   const [games,tasks]=await Promise.all([academicGames(),academicAssignments()]);
   const submissions=await academicSubmissions(tasks.map(t=>t.id));
   const stat=make('div','','academic-summary');for(const [n,label] of [[games.length,'Partidas enviadas'],[new Set(games.map(g=>g.event_name)).size,'Torneos'],[tasks.length,'Tareas asignadas'],[submissions.length,'Entregas']]){const box=make('div','','academy-stat');box.append(make('strong',String(n)),make('span',label));stat.append(box);}screen.append(stat);
   const overdue=tasks.filter(t=>t.due_at&&new Date(t.due_at+'T23:59:59').getTime()<Date.now()&&!submissions.some(x=>x.assignment_id===t.id));
   if(overdue.length)screen.append(make('p','Tenés '+overdue.length+' tarea(s) pendientes fuera de plazo. Revisá las instrucciones y entregalas desde aquí.','academic-alert'));
   const submit=make('details','','academic-panel');submit.open=!games.length;
   const sm=make('summary','Enviar una partida PGN');submit.append(sm);
   submit.append(make('p','Pegá un PGN válido. También podés copiar la partida abierta en Game Review; si ya fue analizada se adjuntará el informe técnico.'));
   const title=field('Título de la partida'),event=field('Torneo / evento'),date=field('Fecha de la partida','date'),pgn=field('PGN completo','textarea');
   const side=make('select');side.setAttribute('aria-label','Color que jugó el estudiante');for(const [v,t] of [['w','Jugué con blancas'],['b','Jugué con negras']]){const o=make('option',t);o.value=v;side.append(o);}const sideWrap=make('label','','academic-field');sideWrap.append(make('span','Mi color en esta partida'),side);
   submit.append(title.wrap,event.wrap,date.wrap,sideWrap,pgn.wrap);
   submit.append(button('Usar partida de Game Review',()=>{const current=window.IB_ACADEMIC_CURRENT?.();if(!current){notify('No hay una partida abierta.','err');return;}pgn.input.value=current.pgn;title.input.value=current.title;event.input.value=current.event;notify('Partida copiada desde Game Review.');}));
   submit.append(button('Enviar a mi profesor',async()=>{try{const parsed=validatePGN(pgn.input.value.trim());const current=window.IB_ACADEMIC_CURRENT?.();const review=current?.pgn===parsed.pgn?current.review:{};await submitAcademicGame({title:title.input.value.trim()||parsed.headers.Event||'Partida',event_name:event.input.value.trim()||parsed.headers.Event||'Sin torneo',played_at:date.input.value||null,pgn:parsed.pgn,white_name:parsed.headers.White||'',black_name:parsed.headers.Black||'',result:parsed.headers.Result||'*',student_side:side.value,review});notify('Partida enviada a tu carpeta académica.');await refresh();}catch(e){notify(e.message,'err');}},'btn primary'));
   screen.append(submit);
   const tournament=make('details','','academic-panel');
   const batchTitle=make('summary','Importar torneo completo · varias partidas PGN');tournament.append(batchTitle);
   tournament.append(make('p','Pegá un archivo PGN con varias partidas y sus encabezados [Event], [White] y [Black]. Revisá el nombre del jugador antes de importar. Si el nombre no coincide, no se guardará esa partida.'));
   const player=field('Nombre exacto del estudiante en los PGN','text',accountNameForImport()),eventTitle=field('Nombre del torneo (opcional; se usarán los eventos de cada PGN)'),batchText=field('PGN de todas las rondas','textarea');
   batchText.input.rows=11;tournament.append(player.wrap,eventTitle.wrap,batchText.wrap);
   const preview=make('div','','academic-import-preview');tournament.append(preview);
   const parsedRows=()=>{const pieces=splitTournamentPGN(batchText.input.value);if(pieces.length>100)throw Error('Importá un máximo de 100 partidas por lote.');return pieces.map((segment,index)=>{try{const game=validatePGN(segment),side=playerSideFor(game.headers,player.input.value);return {index,game,side};}catch(error){return {index,error:error.message};}});};
   const previewBtn=button('Revisar partidas y colores',()=>{
    preview.replaceChildren();try{const rows=parsedRows();if(!rows.length)throw Error('Pegá el PGN del torneo.');
     const valid=rows.filter(x=>x.game&&x.side),ambiguous=rows.length-valid.length;
     preview.append(make('p',valid.length+' partida(s) identificadas correctamente. '+ambiguous+' requieren revisar el nombre, los encabezados o la notación.'));
     for(const row of rows){const g=row.game?.headers||{};preview.append(make('p',(row.index+1)+'. '+(g.White||'?')+' – '+(g.Black||'?')+' · '+(row.side==='w'?'Blancas':row.side==='b'?'Negras':row.error||'Jugador no identificado'),'academic-import-row'));}
    }catch(error){notify(error.message,'err');}
   });
   tournament.append(previewBtn);
   tournament.append(button('Guardar torneo en mi cuenta',async()=>{
    try{const rows=parsedRows(),valid=rows.filter(x=>x.game&&x.side);
     if(!rows.length||valid.length!==rows.length)throw Error('Hay partidas sin jugador identificado o PGN inválidos. Corregí los datos antes de guardar.');
     if(!window.confirm('Se guardarán '+valid.length+' partidas en la cuenta del alumno. ¿Continuar?'))return;
     const submitButton=tournament.querySelector('.academic-import-save');submitButton.disabled=true;
     let saved=0;
     try{for(const row of valid){const g=row.game,h=g.headers;await submitAcademicGame({title:(h.Round?'Ronda '+h.Round+' · ':'')+(h.White||'Blancas')+' – '+(h.Black||'Negras'),event_name:eventTitle.input.value.trim()||h.Event||'Sin torneo',played_at:pgnDate(h.Date),pgn:g.pgn,white_name:h.White||'',black_name:h.Black||'',result:h.Result||'*',student_side:row.side,review:await cachedAcademicReview(g)});saved++;}}
     finally{submitButton.disabled=false;}
     notify(saved+' partida(s) del torneo guardadas correctamente.');if(saved===valid.length)await refresh();
    }catch(error){notify(error.message,'err');}
   },'btn primary academic-import-save'));
   screen.append(tournament);

   const studiesPanel=make('details','','academic-panel');
   studiesPanel.append(make('summary','Mis estudios · Compartir resultados con el profesor'));
   studiesPanel.append(make('p','Elegí un estudio ya guardado en Biblioteca PGN y compartí sus partidas y análisis con tu profesor. Los originales permanecen intactos.'));
   const studySelect=make('select');studySelect.setAttribute('aria-label','Estudios guardados');
   const studyLabel=make('label','','academic-field');studyLabel.append(make('span','Estudio de la biblioteca'),studySelect);
   const studyPlayer=field('Mi nombre exacto en las partidas PGN','text',accountNameForImport());
   const studyEvent=field('Torneo (opcional: se usará el del PGN)');
   const studyFeedback=make('div','','academic-import-preview');
   studiesPanel.append(studyLabel,studyPlayer.wrap,studyEvent.wrap,studyFeedback);
   let available=new Map();
   async function refreshAvailable(){
     available=new Map();studySelect.replaceChildren();
     const blank=make('option','Seleccioná un estudio…');blank.value='';studySelect.append(blank);
     const lib=window.IB_STUDIO;
     if(!lib?.listLibraryItems)throw Error('La Biblioteca PGN aún no está disponible.');
     const data=await lib.listLibraryItems();
     const add=(key,label,source,id)=>{
       if(!available.has(key))available.set(key,{label,source,ids:[]});
       available.get(key).ids.push(id);
     };
     for(const x of data.locals)add(x.collectionId?'local:'+x.collectionId:'local-item:'+x.id,x.collectionName||x.name||'Estudio local','local',x.id);
     for(const x of data.remote)if(x.owner_id===session.user.id)add(x.payload?.collectionId?'cloud:'+x.payload.collectionId:'cloud-item:'+x.id,x.payload?.collectionName||x.title||'Estudio en nube','cloud',x.id);
     for(const [key,x] of available){const option=make('option',(x.source==='local'?'Local':'Nube')+' · '+x.label+' ('+x.ids.length+' partidas)');option.value=key;studySelect.append(option);}
     studyFeedback.textContent=available.size+' estudio(s) disponibles.'+(data.error?' Nube: '+data.error:'');
   }
   async function selectedGames(){
     const item=available.get(studySelect.value);
     if(!item)throw Error('Seleccioná un estudio.');
     const sources=item.source==='local'?[await window.IB_STUDIO.loadCollectionPgn(item.ids)]:await Promise.all(item.ids.map(id=>window.IB_STUDIO.getLibraryPgn('cloud',id)));
     const rows=[];
     for(const text of sources)for(const segment of splitTournamentPGN(text))rows.push(validatePGN(segment));
     if(!rows.length||rows.length>100)throw Error('Se admiten entre 1 y 100 partidas por estudio.');
     return rows.map(game=>({game,side:playerSideFor(game.headers,studyPlayer.input.value)}));
   }
   studiesPanel.append(button('Actualizar mis estudios',()=>refreshAvailable().catch(e=>notify(e.message,'err'))));
   studiesPanel.append(button('Revisar partidas',async()=>{
     try{
       const rows=await selectedGames();studyFeedback.replaceChildren();
       studyFeedback.append(make('p',rows.filter(x=>x.side).length+'/'+rows.length+' partidas reconocidas.'));
       for(const {game,side} of rows)studyFeedback.append(make('p',(game.headers.Round?'Ronda '+game.headers.Round+' · ':'')+(game.headers.White||'?')+' – '+(game.headers.Black||'?')+' · '+(side==='w'?'Blancas':side==='b'?'Negras':'No coincide el nombre'),'academic-import-row'));
     }catch(e){notify(e.message,'err');studyFeedback.textContent=e.message;}
   }));
   const share=button('Compartir estudio y análisis con mi profesor',async()=>{
     let saved=0;share.disabled=true;
     try{
       const rows=await selectedGames();
       if(rows.some(x=>!x.side))throw Error('El nombre del jugador no coincide con todas las partidas. Revisá las rondas primero.');
       const existing=new Set(games.map(g=>(g.event_name||'Sin torneo')+'|'+g.pgn.trim()));
       const pending=[];
       for(const {game,side} of rows){
         const event=studyEvent.input.value.trim()||game.headers.Event||'Sin torneo';
         const key=event+'|'+game.pgn.trim();
         if(existing.has(key))continue;
         existing.add(key);pending.push({game,side,event});
       }
       if(!pending.length){studyFeedback.textContent='El estudio ya está compartido. No se duplicaron partidas.';return;}
       if(!window.confirm('Enviar '+pending.length+' partidas y sus análisis guardados a tu expediente académico?'))return;
       for(const {game,side,event} of pending){
         const h=game.headers;
         await submitAcademicGame({title:(h.Round?'Ronda '+h.Round+' · ':'')+(h.White||'Blancas')+' – '+(h.Black||'Negras'),event_name:event,played_at:pgnDate(h.Date),pgn:game.pgn,white_name:h.White||'',black_name:h.Black||'',result:h.Result||'*',student_side:side,review:await cachedAcademicReview(game)});
         saved++;
       }
       notify(saved+' partida(s) compartidas con tu profesor.');await refresh();
     }catch(e){studyFeedback.textContent=(saved?saved+' guardadas antes del error. ':'')+e.message;notify(studyFeedback.textContent,'err');}
     finally{share.disabled=false;}
   },'btn primary');
   studiesPanel.append(share);screen.append(studiesPanel);
   studiesPanel.addEventListener('toggle',()=>{if(studiesPanel.open)refreshAvailable().catch(e=>notify(e.message,'err'));});


   const progress=make('section','','academic-panel');progress.append(make('h3','Mi rendimiento técnico'));addPerformanceGrid(progress,games);screen.append(progress);
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
function portfolioMetrics(games){
 const quality=[],loss=[],ratings=[],colors={w:0,b:0},severe=0;
 for(const game of games){
  const side=game.student_side==='b'?'b':'w';colors[side]++;
  try{
   const parsed=validatePGN(game.pgn),h=parsed.headers||{};
   if(Array.isArray(game.review?.reports)&&game.review.reports.length){
    const m=gameMetrics(parsed,game.review.reports)[side];
    if(m.complete&&Number.isFinite(m.quality)){quality.push(m.quality);loss.push(m.avg);}
   }
   const elo=Number(side==='w'?h.BlackElo:h.WhiteElo);
   const result=game.result||h.Result||'*';
   const points=result==='1/2-1/2'?.5:result===(side==='w'?'1-0':'0-1')?1:result===(side==='w'?'0-1':'1-0')?0:null;
   if(elo>0&&Number.isFinite(elo)&&points!==null)ratings.push({elo,result:points});
  }catch(error){console.warn('Partida sin métricas válidas:',error.message);}
 }
 const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
 const fide=ratings.length?fidePerformance(ratings):null;
 return {count:games.length,analyzed:quality.length,accuracy:avg(quality),acpl:avg(loss),rated:ratings.length,fide,colors};
}
function addPerformanceGrid(parent,games,{compact=false}={}){
 const m=portfolioMetrics(games),box=make('div','','academic-performance');
 const stats=[
  ['Precisión técnica',m.accuracy===null?'—':m.accuracy.toFixed(1)+'%'],
  ['ACPL promedio',m.acpl===null?'—':m.acpl.toFixed(1)+' cp'],
  ['Performance de torneo',m.fide?String(m.fide.rating):'—'],
  ['Análisis completos',m.analyzed+'/'+m.count]
 ];
 const grid=make('div','','academic-performance-grid');
 for(const [label,value] of stats){const tile=make('div','','academic-performance-tile');tile.append(make('small',label),make('strong',value));grid.append(tile);}
 box.append(grid);
 if(!compact)box.append(make('p','Performance: estimación basada en '+m.rated+' partidas con Elo de rival y resultado. No es Elo oficial ni rendimiento derivado de la precisión. Precisión y ACPL usan solamente partidas completamente analizadas.','academic-performance-note'));
 parent.append(box);
 return m;
}
function technicalSummary(game){
 const reports=game.review?.reports;if(!Array.isArray(reports)||!reports.length)return 'Sin análisis técnico compartido';
 try{const parsed=validatePGN(game.pgn);const m=gameMetrics(parsed,reports);const fmt=s=>m[s].complete?m[s].quality.toFixed(1)+'%':m[s].count?m[s].quality.toFixed(1)+'% parcial':'—';return 'Precisión del alumno ('+(game.student_side==='b'?'negras':'blancas')+'): '+fmt(game.student_side==='b'?'b':'w');}catch{return 'Informe técnico pendiente';}
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
   const toReview=submissions.filter(x=>!x.reviewed_at);
   if(toReview.length)content.append(make('p',toReview.length+' entrega(s) requieren tu revisión.','academic-alert'));
   const stats=make('div','','academic-summary');
   for(const [v,label] of [[games.length,'Partidas'],[new Set(games.map(g=>g.event_name)).size,'Torneos'],[tasks.length,'Tareas'],[submissions.length,'Entregas']]){const item=make('div','','academy-stat');item.append(make('strong',String(v)),make('span',label));stats.append(item);}content.append(stats);
   const performance=make('section','','academic-subsection');performance.append(make('h4','Resumen de performance y precisión'));addPerformanceGrid(performance,games);content.append(performance);
   const tourney=make('div','','academic-subsection');tourney.append(make('h4','Torneos y partidas'));
   const events=new Map();for(const g of games){const k=g.event_name||'Sin torneo';if(!events.has(k))events.set(k,[]);events.get(k).push(g);}
   if(!games.length)tourney.append(make('p','El alumno aún no ha compartido partidas.'));else for(const [event,rounds] of events){const grp=make('details','','academic-event');grp.append(make('summary',event+' · '+rounds.length+' partidas'));for(const g of rounds){let summary=technicalSummary(g);const row=make('div','','academic-game-row');row.append(make('strong',g.title),make('small',g.white_name+' – '+g.black_name+' · '+g.result),make('small',summary));row.append(button('Analizar en Game Review',()=>window.IB_LOAD_ACADEMIC_GAME?.(g.pgn,g.title)));grp.append(row);}addPerformanceGrid(grp,rounds);tourney.append(grp);}content.append(tourney);
   const importPanel=make('details','','academic-subsection academic-teacher-import');
   importPanel.append(make('summary','Importar torneo PGN para este alumno'));
   importPanel.append(make('p','Seleccioná el nombre con el que aparece el alumno en las cabeceras PGN. Se comprobará el color de cada ronda antes de guardarla en su cuenta.'));
   const playerName=field('Nombre exacto del jugador en PGN','text',student.name&&student.name!=='Alumno sin nombre'?student.name:''),tournamentName=field('Nombre del torneo (opcional)'),batch=field('PGN completo (varias partidas)','textarea');
   batch.input.rows=11;
   importPanel.append(playerName.wrap,tournamentName.wrap,batch.wrap);
   const output=make('div','','academic-import-preview');importPanel.append(output);
   const readRows=()=>{const pieces=splitTournamentPGN(batch.input.value);if(pieces.length>100)throw Error('Máximo 100 partidas por lote.');return pieces.map((piece,index)=>{try{const game=validatePGN(piece);return {index,game,side:playerSideFor(game.headers,playerName.input.value)};}catch(error){return {index,error:error.message};}});};
   importPanel.append(button('Previsualizar rondas',()=>{output.replaceChildren();try{const rows=readRows();if(!rows.length)throw Error('Pegá el PGN del torneo.');for(const row of rows){const h=row.game?.headers||{},text=(row.index+1)+'. '+(h.White||'?')+' – '+(h.Black||'?')+' · '+(row.side==='w'?'Blancas':row.side==='b'?'Negras':row.error||'Nombre no identificado');output.append(make('p',text,'academic-import-row'));}}catch(error){notify(error.message,'err');}}));
   importPanel.append(button('Guardar torneo del alumno',async()=>{
    const saveButton=importPanel.querySelector('.academic-teacher-import-save');let inserted=0;
    try{const rows=readRows();if(!rows.length||rows.some(row=>!row.game||!row.side))throw Error('Revisá el PGN y confirmá el nombre exacto del jugador en todas las rondas.');
     const existing=new Set(games.map(g=>g.event_name+'\\0'+g.pgn));const candidate=rows.map(row=>{const h=row.game.headers;return {row,event:tournamentName.input.value.trim()||h.Event||'Sin torneo'};});
     const fresh=candidate.filter(x=>!existing.has(x.event+'\\0'+x.row.game.pgn));
     if(!fresh.length)throw Error('Todas estas partidas ya existen en la ficha de este alumno.');
     if(!window.confirm('Se importarán '+fresh.length+' partidas nuevas para '+(student.name||'este alumno')+'. ¿Continuar?'))return;
     saveButton.disabled=true;
     try{for(const {row,event} of fresh){const h=row.game.headers;await submitAcademicGameForStudent(student.student_id,{title:(h.Round?'Ronda '+h.Round+' · ':'')+(h.White||'Blancas')+' – '+(h.Black||'Negras'),event_name:event,played_at:pgnDate(h.Date),pgn:row.game.pgn,white_name:h.White||'',black_name:h.Black||'',result:h.Result||'*',student_side:row.side,review:await cachedAcademicReview(row.game)});inserted++;}}
     finally{saveButton.disabled=false;}
     notify(inserted+' partida(s) importadas para el alumno.');await load();
    }catch(error){notify((inserted?inserted+' guardadas antes del error. ':'')+error.message,'err');}
   },'btn primary academic-teacher-import-save'));
   content.append(importPanel);
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
