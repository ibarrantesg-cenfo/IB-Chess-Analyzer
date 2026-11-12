import {getCIClient} from '../cloud.js';
import {createCIService} from './ci-service.js';
import {filterPlayers} from './ci-model.js';
import {initCIDocumentaryBoard} from './ci-document-board.js';
import {initCIPlayerProfile} from './ci-player-profile.js';
import {CI_SOURCES,UNIVERSITY_RIVALS,findUniversityCandidate,matchExistingCandidate,reconcileCandidates} from './ci-university-data.js';
import './ci-style.css';

export function initCompetitiveIntelligence({notify}){
 const main=document.querySelector('main.main'),layout=main.querySelector('.layout'),toolbar=main.querySelector('.toolbar'),tools=main.querySelector('.workspace-tools');
 const screen=document.createElement('section');screen.className='ci-screen';screen.hidden=true;
 screen.innerHTML=`<header class="ci-head"><div><span class="eyebrow">IB CHESS ACADEMY · INVESTIGACIÓN PRIVADA</span><h2>Competitive Intelligence <span class="ci-release">v2.3</span></h2><p>Inteligencia competitiva, documentación de partidas y preparación con evidencia.</p></div><button class="btn outline" id="ci-reload" type="button">↻ Actualizar</button></header>
 <div class="ci-tabs" role="tablist" aria-label="Secciones de inteligencia"><button type="button" id="ci-tab-roster" role="tab" aria-selected="true" class="active">♟ Expedientes de rivales</button><button type="button" id="ci-tab-board" role="tab" aria-selected="false" hidden>♜ Estudio documental</button></div>
 <div id="ci-status" class="ci-status" role="status"></div>
 <section id="ci-roster-screen" role="tabpanel" aria-labelledby="ci-tab-roster">
  <div class="ci-summary"><div><strong id="ci-total">0</strong><span>Rivales registrados</span></div><div><strong id="ci-priority-a">0</strong><span>Prioridad A</span></div><div><strong id="ci-selected-label">—</strong><span>Expediente activo</span></div></div>
  <div class="ci-workspace">
   <section class="ci-panel ci-roster-panel">
    <div class="ci-panel-head"><div><span class="eyebrow">REGISTRO COMPETITIVO</span><h3>Base de rivales</h3></div><button class="btn primary" id="ci-create" type="button">＋ Nuevo rival</button></div>
    <div class="ci-filters"><label>Buscar<input id="ci-search" type="search" placeholder="Nombre, alias o ID FIDE" /></label><label>Grupo<select id="ci-priority"><option value="all">Todos</option><option value="A">A</option><option value="B">B</option><option value="C">C</option></select></label></div>
    <div id="ci-players" class="ci-players"></div>
    <div class="ci-starter" id="ci-starter" hidden><strong>Investigación universitaria · JUNCOS 2026</strong><p>Registramos los participantes del circuito y conservamos sus fuentes. Esta acción verifica qué fichas faltan o necesitan actualización; no duplica los registros existentes.</p><button class="btn outline" id="ci-seed" type="button">↻ Comprobar y sincronizar rivales</button><div id="ci-seed-status" class="ci-seed-status" role="status" aria-live="polite">Consultá el estado de los jugadores universitarios.</div></div>
   </section>
   <section class="ci-panel ci-detail-panel">
    <div id="ci-summary-detail" class="ci-detail-summary"><div class="ci-detail-toolbar"><button id="ci-back-roster" class="btn outline" type="button" hidden>← Volver a rivales</button><span class="eyebrow">EXPEDIENTE ACTIVO</span></div><h3 id="ci-detail-title">Seleccioná un rival o creá uno nuevo</h3><p id="ci-detail-description">Cada ficha será el punto de entrada a sus partidas, observaciones, aperturas y documentos privados.</p><div id="ci-public-evidence" class="ci-public-evidence" hidden></div><div class="ci-actions"><button class="btn outline" type="button" id="ci-edit" hidden>Editar ficha</button><button class="btn primary" type="button" id="ci-open-board" hidden>Abrir estudio documental</button></div></div>
    <section id="ci-editor" hidden><div class="ci-panel-head"><div><span class="eyebrow">GESTIÓN DE EXPEDIENTE</span><h3 id="ci-editor-title">Nuevo rival</h3></div><button class="btn outline" type="button" id="ci-cancel">Cerrar</button></div>
     <form id="ci-form"><input type="hidden" id="ci-id"/><div class="ci-form-grid"><label>Nombre completo<input id="ci-name" required maxlength="160" autocomplete="off"/></label><label>FID · Identificador FIDE<input id="ci-fide" inputmode="numeric" placeholder="Opcional, solo números"/></label><label>Prioridad<select id="ci-priority-edit"><option value="A">A — Estratégico</option><option value="B">B — Recurrente</option><option value="C" selected>C — Seguimiento</option></select></label><label>Alias separados por coma<input id="ci-aliases" maxlength="1000"/></label></div><label>Notas iniciales<textarea id="ci-notes" rows="5" maxlength="10000" placeholder="Datos pendientes de verificar y fuente de investigación"></textarea></label><div class="ci-actions"><button class="btn primary" type="submit" id="ci-save">Guardar expediente</button><button class="btn outline" type="button" id="ci-reset">Limpiar</button><button class="btn outline" type="button" id="ci-archive" disabled>Archivar</button></div></form>
    </section>
    <div id="ci-research" hidden></div>
    <div class="ci-legend"><strong>Siglas</strong><p>RID · ID de rival &nbsp; FID · ID FIDE &nbsp; OBS · Observación &nbsp; EVD · Evidencia &nbsp; CF · Confianza &nbsp; IPR · Índice de previsibilidad.</p></div>
   </section>
  </div>
 </section>
 <section id="ci-board-screen" role="tabpanel" aria-labelledby="ci-tab-board" hidden></section>`;
 main.insertBefore(screen,main.querySelector('footer'));
 const el=id=>screen.querySelector('#'+id);
 const client=getCIClient();
 const service=client?createCIService(client):null;
 const board=service?initCIDocumentaryBoard({host:el('ci-board-screen'),service,onError:e=>console.warn('CI study',e)}):null;
 // The board initializer owns the screen markup, so insert the back control afterwards.
 el('ci-board-screen').insertAdjacentHTML('afterbegin','<div class="ci-board-back-row"><button id="ci-back-profile" type="button" class="btn outline">← Volver al expediente</button></div>');
 const profile=service?initCIPlayerProfile({host:el('ci-research'),service}):null;
 let active=false,authorized=false,players=[],chosenId='',tab='roster';
 // Browser history is the source of truth for rival and study navigation.
 function routeState(){
  const q=new URLSearchParams(location.search);
  if(q.get('view')!=='competitive-intelligence')return {playerId:'',tab:'roster'};
  return {playerId:q.get('ci_player')||'',tab:q.get('ci_tab')==='board'?'board':'roster'};
 }
 function recordRoute(playerId=chosenId,nextTab=tab){
  const url=new URL(location.href);
  url.searchParams.set('view','competitive-intelligence');
  if(playerId)url.searchParams.set('ci_player',playerId);else url.searchParams.delete('ci_player');
  if(playerId&&nextTab==='board')url.searchParams.set('ci_tab','board');else url.searchParams.delete('ci_tab');
  if(url.pathname+url.search!==location.pathname+location.search)
   history.pushState({section:'competitive-intelligence',ciPlayer:playerId,ciTab:nextTab},'',url.pathname+url.search);
 }
 const message=(text,isError=false)=>{el('ci-status').textContent=text;el('ci-status').classList.toggle('error',isError);};
 const seedMessage=(text,kind='neutral')=>{const node=el('ci-seed-status');node.textContent=text;node.dataset.kind=kind;};
 function updateSeedSummary(){
  const plan=reconcileCandidates(players);
  const complete=plan.unchanged.length;
  const unresolved=plan.adds.length+plan.updates.length;
  // The university import is a one-time onboarding action, not dashboard content.
  // Keep the manual "Nuevo rival" workflow available independently.
  el('ci-starter').hidden=unresolved===0;
  if(unresolved>0)seedMessage('En Supabase: '+complete+' de '+UNIVERSITY_RIVALS.length+' perfiles sincronizados. Faltan '+plan.adds.length+' nuevos y '+plan.updates.length+' por actualizar.');
  return plan;
 }
 function updateDetail(player){
  el('ci-selected-label').textContent=player?.display_name||'—';
  el('ci-detail-title').textContent=player?.display_name||'Seleccioná un rival o creá uno nuevo';
  el('ci-detail-description').textContent=player?'Prioridad '+player.priority+(player.fide_id?' · FIDE ID '+player.fide_id:' · Identificador FIDE pendiente')+' · Expediente privado.':'Cada ficha reúne investigación, partidas, observaciones y estudios privados sin afectar la biblioteca general.';
  el('ci-edit').hidden=!player;
  el('ci-open-board').hidden=!player;
  el('ci-tab-board').hidden=!player;
  el('ci-back-roster').hidden=!player;
  const evidence=el('ci-public-evidence');evidence.replaceChildren();
  const candidate=player?findUniversityCandidate(player):null;
  evidence.hidden=!candidate;
  if(candidate){
   const heading=document.createElement('strong');heading.textContent='Participación universitaria documentada · '+candidate.university;
   evidence.append(heading);
   const meta=document.createElement('p');
   const ratings=Object.entries(candidate.ratings).map(([mode,n])=>(mode==='standard'?'Clásico':'Blitz')+': '+n+' (oct. 2026)');
   meta.textContent=[...ratings,candidate.achievement].filter(Boolean).join(' · ')||'Participación FedeU–CENFOTEC 2026';
   evidence.append(meta);
   const caption=document.createElement('small');caption.textContent='Ratings de las listas iniciales, no Elo actual. Las fuentes no contienen por sí mismas estadísticas de repertorio.';
   evidence.append(caption);
   const links=document.createElement('div');links.className='ci-evidence-links';
   for(const key of candidate.sourceKeys){const a=document.createElement('a');a.href=CI_SOURCES[key].url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=CI_SOURCES[key].label;links.append(a);}
   evidence.append(links);
  }
 }
 function reset(){
  chosenId='';profile?.clear();if(tab==='board')switchTab('roster',false);el('ci-form').reset();el('ci-id').value='';el('ci-priority-edit').value='C';el('ci-archive').disabled=true;updateDetail(null);render();
 }
 function editNew(){
  reset();el('ci-editor-title').textContent='Nuevo rival';el('ci-editor').hidden=false;el('ci-summary-detail').hidden=true;
  el('ci-name').focus();el('ci-editor').scrollIntoView({behavior:'smooth',block:'nearest'});
  message('Nueva ficha preparada. Escribí el nombre y pulsá Guardar expediente.');
 }
 function editSelected(){
  const p=players.find(x=>x.id===chosenId);if(!p)return editNew();
  el('ci-id').value=p.id;el('ci-name').value=p.display_name||'';el('ci-fide').value=p.fide_id||'';el('ci-priority-edit').value=p.priority||'C';el('ci-aliases').value=(p.aliases||[]).join(', ');el('ci-notes').value=p.notes||'';
  el('ci-archive').disabled=false;el('ci-editor-title').textContent='Editar · '+p.display_name;el('ci-editor').hidden=false;el('ci-summary-detail').hidden=true;el('ci-name').focus();
 }
 function closeEditor(){el('ci-editor').hidden=true;el('ci-summary-detail').hidden=false;updateDetail(players.find(x=>x.id===chosenId));}
 function select(player,record=true){
  if(!player)return;
  chosenId=player.id;tab='roster';
  el('ci-roster-screen').hidden=false;el('ci-board-screen').hidden=true;
  closeEditor();updateDetail(player);render();
  void profile?.select(player);
  if(record)recordRoute(player.id,'roster');
  el('ci-detail-title').scrollIntoView({block:'start',behavior:'smooth'});
 }
 function render(){
  const list=filterPlayers(players,el('ci-search').value,el('ci-priority').value);
  el('ci-total').textContent=String(players.length);el('ci-priority-a').textContent=String(players.filter(p=>p.priority==='A').length);
  const host=el('ci-players');host.replaceChildren();
  if(!list.length){const p=document.createElement('p');p.className='ci-empty';p.textContent=players.length?'No hay coincidencias para estos filtros.':'Tu biblioteca está vacía. Usá «Nuevo rival» o incorporá la lista inicial.';host.append(p);return;}
  for(const player of list){
   const b=document.createElement('button');b.type='button';b.className='ci-person';b.classList.toggle('selected',chosenId===player.id);
   const n=document.createElement('strong'),m=document.createElement('small'),badge=document.createElement('span');
   n.textContent=player.display_name;m.textContent=player.fide_id?'FID '+player.fide_id:'FID por verificar';badge.textContent=player.priority;badge.className='ci-person-priority';
   const words=document.createElement('span');words.className='ci-person-labels';words.append(n,badge);
   b.append(words,m);b.onclick=()=>select(player);host.append(b);
  }
 }
 async function refresh(){
  if(!active||!authorized||!service)return;
  message('Actualizando biblioteca privada…');
  try{players=await service.listPlayers();if(chosenId&&!players.some(x=>x.id===chosenId)){chosenId='';await switchTab('roster',false);}board?.setPlayers(players);render();updateDetail(players.find(x=>x.id===chosenId));if(chosenId)profile?.select(players.find(x=>x.id===chosenId));else profile?.clear();updateSeedSummary();message('Base privada sincronizada. '+players.length+' expediente(s).');}
  catch(e){message('No se pudo consultar la base: '+e.message,true);}
 }
 async function switchTab(next,record=true){
  if(next==='board'&&!chosenId){message('Seleccioná un jugador de la lista antes de abrir su estudio documental.',true);return;}
  tab=next;el('ci-roster-screen').hidden=next!=='roster';el('ci-board-screen').hidden=next!=='board';
  for(const key of ['roster','board']){el('ci-tab-'+key).classList.toggle('active',key===next);el('ci-tab-'+key).setAttribute('aria-selected',String(key===next));}
  if(record)recordRoute(chosenId,next);
  if(next==='board'&&board){await board.activate();await board.selectPlayer(chosenId);}
 }
 async function show(){
  if(!service){notify('Supabase no está configurado para Competitive Intelligence.','err');return false;}
  let allowed=false;try{allowed=await service.authorized();}catch(e){console.warn('CI:',e.message);}
  if(!allowed){notify('Competitive Intelligence: acceso administrativo no habilitado.','err');return false;}
  authorized=true;active=true;screen.hidden=false;main.classList.add('ci-isolated');layout.hidden=true;toolbar.hidden=true;tools.hidden=true;
  document.querySelector('#nav-competitive-intelligence')?.classList.add('active');
  main.querySelector('.topbar h1').textContent='Competitive Intelligence';main.querySelector('.topbar p').textContent='Investigación y preparación competitiva privada.';
  await refresh();
  const requested=routeState();
  const found=players.find(p=>p.id===requested.playerId);
  if(found){
   chosenId=found.id;updateDetail(found);render();void profile?.select(found);
   await switchTab(requested.tab,false);
  }else{
   chosenId='';profile?.clear();updateDetail(null);render();
   await switchTab('roster',false);
  }
  return true;
 }
 function close(){profile?.clear();main.classList.remove('ci-isolated');if(active){layout.hidden=false;toolbar.hidden=false;tools.hidden=false;}active=false;authorized=false;screen.hidden=true;document.querySelector('#nav-competitive-intelligence')?.classList.remove('active');}
 async function canAccess(){if(!service)return false;try{return await service.authorized();}catch{return false;}}
 el('ci-tab-roster').onclick=()=>switchTab('roster');el('ci-tab-board').onclick=()=>switchTab('board');
 el('ci-back-profile').onclick=()=>switchTab('roster');
 el('ci-back-roster').onclick=()=>{
  chosenId='';profile?.clear();updateDetail(null);render();recordRoute('','roster');
  el('ci-players').scrollIntoView({block:'start',behavior:'smooth'});
 };
 el('ci-reload').onclick=refresh;el('ci-search').oninput=render;el('ci-priority').onchange=render;
 el('ci-create').onclick=editNew;el('ci-edit').onclick=editSelected;el('ci-reset').onclick=editNew;el('ci-cancel').onclick=closeEditor;
 el('ci-open-board').onclick=()=>switchTab('board');
 el('ci-form').onsubmit=async e=>{
  e.preventDefault();if(!active||!authorized)return;
  const payload={display_name:el('ci-name').value,fide_id:el('ci-fide').value,priority:el('ci-priority-edit').value,aliases:el('ci-aliases').value.split(','),notes:el('ci-notes').value};
  el('ci-save').disabled=true;
  try{const id=el('ci-id').value,duplicate=matchExistingCandidate(payload,players.filter(x=>x.id!==id));
   if(duplicate){chosenId=duplicate.id;editSelected();message('Ya existe un expediente con el mismo nombre o FIDE ID. Abrí su ficha existente para corregirla; no se creó un duplicado.',true);return;}
   const record=id?await service.updatePlayer(id,payload):await service.createPlayer(payload);
   chosenId=record.id;await refresh();closeEditor();recordRoute(record.id,'roster');message('Expediente guardado. Seleccionado: '+record.display_name+'.');}
  catch(error){message('No se pudo guardar: '+error.message,true);}finally{el('ci-save').disabled=false;}
 };
 el('ci-archive').onclick=async()=>{
  const id=el('ci-id').value;if(!id||!active||!authorized)return;
  if(!confirm('¿Archivar el expediente? No se eliminarán sus datos.'))return;
  try{await service.archivePlayer(id);chosenId='';reset();closeEditor();recordRoute('','roster');await refresh();message('Expediente archivado.');}catch(e){message(e.message,true);}
 };
 el('ci-seed').onclick=async()=>{
  if(!active||!authorized){seedMessage('No hay una sesión administradora activa. Iniciá sesión y volvé a entrar.','error');return;}
  const button=el('ci-seed');button.disabled=true;
  const label=button.textContent;
  button.textContent='Comprobando…';
  seedMessage('Consultando los expedientes privados en Supabase…');
  try{
   // Always reconcile against the latest server snapshot, never stale browser state.
   players=await service.listPlayers();
   board?.setPlayers(players);render();updateDetail(players.find(x=>x.id===chosenId));
   const plan=reconcileCandidates(players);
   if(!plan.adds.length&&!plan.updates.length){
    updateSeedSummary();
    message('Catálogo universitario comprobado: no hay registros nuevos.');
    return;
   }
   seedMessage('Encontrados '+plan.adds.length+' rivales nuevos y '+plan.updates.length+' fichas por completar.');
   if(!confirm('¿Sincronizar '+plan.adds.length+' rivales nuevos y '+plan.updates.length+' fichas existentes? Se conservarán tus notas, alias y prioridades.')){
    seedMessage('Sincronización cancelada. No se modificaron los expedientes.');return;
   }
   button.textContent='Guardando…';
   let added=0,updated=0;
   try{
    for(const row of plan.adds){await service.createPlayer(row.payload);added++;}
    for(const row of plan.updates){await service.updatePlayer(row.existing.id,row.payload);updated++;}
    await refresh();
    const result='✓ Se agregaron '+added+' jugadores, se actualizaron '+updated+' y '+plan.unchanged.length+' ya estaban al día.';
    seedMessage(result,'success');message(result);
   }catch(e){
    await refresh();
    seedMessage('Sincronización parcial: '+added+' agregados, '+updated+' actualizados. Error: '+e.message,'error');
    message('No se pudo completar la importación: '+e.message,true);
   }
  }catch(e){
   seedMessage('No se pudo comprobar la base: '+e.message,'error');
   message('Error de sincronización: '+e.message,true);
  }finally{button.disabled=false;button.textContent=label;}
 };
 return {show,close,canAccess};
}
