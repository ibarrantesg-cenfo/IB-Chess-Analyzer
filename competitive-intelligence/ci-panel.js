import {getCIClient} from '../cloud.js';
import {createCIService} from './ci-service.js';
import {filterPlayers} from './ci-model.js';
import {initCIDocumentaryBoard} from './ci-document-board.js';
import './ci-style.css';

const CANDIDATES=Object.freeze([
 {display_name:'David Alejandro Cabezas Solano',priority:'A'},
 {display_name:'Gerardo Alfonso Ramírez Madrid',priority:'A'},
 {display_name:'Dany José Montero Romero',priority:'A'},
 {display_name:'Juan Diego Coto Calderón',priority:'A'},
 {display_name:'Martín Eduardo Barboza Víquez',priority:'A'},
 {display_name:'Sebasthian Agüero Espinoza',priority:'B'},
 {display_name:'Luis Javier Cartín Aguilar',priority:'B'}
]);
export function initCompetitiveIntelligence({notify}){
 const main=document.querySelector('main.main'),layout=main.querySelector('.layout'),toolbar=main.querySelector('.toolbar'),tools=main.querySelector('.workspace-tools');
 const screen=document.createElement('section');screen.className='ci-screen';screen.hidden=true;
 screen.innerHTML=`<header class="ci-head"><div><span class="eyebrow">IB CHESS ACADEMY · INVESTIGACIÓN PRIVADA</span><h2>Competitive Intelligence</h2><p>Inteligencia competitiva, documentación de partidas y preparación con evidencia.</p></div><button class="btn outline" id="ci-reload" type="button">↻ Actualizar</button></header>
 <div class="ci-tabs" role="tablist" aria-label="Secciones de inteligencia"><button type="button" id="ci-tab-roster" role="tab" aria-selected="true" class="active">♟ Expedientes de rivales</button><button type="button" id="ci-tab-board" role="tab" aria-selected="false">♜ Estudio documental</button></div>
 <div id="ci-status" class="ci-status" role="status"></div>
 <section id="ci-roster-screen" role="tabpanel" aria-labelledby="ci-tab-roster">
  <div class="ci-summary"><div><strong id="ci-total">0</strong><span>Rivales registrados</span></div><div><strong id="ci-priority-a">0</strong><span>Prioridad A</span></div><div><strong id="ci-selected-label">—</strong><span>Expediente activo</span></div></div>
  <div class="ci-workspace">
   <section class="ci-panel ci-roster-panel">
    <div class="ci-panel-head"><div><span class="eyebrow">REGISTRO COMPETITIVO</span><h3>Base de rivales</h3></div><button class="btn primary" id="ci-create" type="button">＋ Nuevo rival</button></div>
    <div class="ci-filters"><label>Buscar<input id="ci-search" type="search" placeholder="Nombre, alias o ID FIDE" /></label><label>Grupo<select id="ci-priority"><option value="all">Todos</option><option value="A">A</option><option value="B">B</option><option value="C">C</option></select></label></div>
    <div id="ci-players" class="ci-players"></div>
    <div class="ci-starter"><strong>¿Comenzamos con el circuito universitario?</strong><p>Podés incorporar una lista inicial de siete candidatos. Se cargarán sin Elo, FIDE ID ni conclusiones no verificadas.</p><button class="btn outline" id="ci-seed" type="button">Incorporar candidatos iniciales</button></div>
   </section>
   <section class="ci-panel ci-detail-panel">
    <div id="ci-summary-detail" class="ci-detail-summary"><span class="eyebrow">EXPEDIENTE ACTIVO</span><h3 id="ci-detail-title">Seleccioná un rival o creá uno nuevo</h3><p id="ci-detail-description">Cada ficha será el punto de entrada a sus partidas, observaciones, aperturas y documentos privados.</p><div class="ci-actions"><button class="btn outline" type="button" id="ci-edit" hidden>Editar ficha</button><button class="btn primary" type="button" id="ci-open-board">Abrir estudio documental</button></div></div>
    <section id="ci-editor" hidden><div class="ci-panel-head"><div><span class="eyebrow">GESTIÓN DE EXPEDIENTE</span><h3 id="ci-editor-title">Nuevo rival</h3></div><button class="btn outline" type="button" id="ci-cancel">Cerrar</button></div>
     <form id="ci-form"><input type="hidden" id="ci-id"/><div class="ci-form-grid"><label>Nombre completo<input id="ci-name" required maxlength="160" autocomplete="off"/></label><label>FID · Identificador FIDE<input id="ci-fide" inputmode="numeric" placeholder="Opcional, solo números"/></label><label>Prioridad<select id="ci-priority-edit"><option value="A">A — Estratégico</option><option value="B">B — Recurrente</option><option value="C" selected>C — Seguimiento</option></select></label><label>Alias separados por coma<input id="ci-aliases" maxlength="1000"/></label></div><label>Notas iniciales<textarea id="ci-notes" rows="5" maxlength="10000" placeholder="Datos pendientes de verificar y fuente de investigación"></textarea></label><div class="ci-actions"><button class="btn primary" type="submit" id="ci-save">Guardar expediente</button><button class="btn outline" type="button" id="ci-reset">Limpiar</button><button class="btn outline" type="button" id="ci-archive" disabled>Archivar</button></div></form>
    </section>
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
 let active=false,authorized=false,players=[],chosenId='',tab='roster';
 const message=(text,isError=false)=>{el('ci-status').textContent=text;el('ci-status').classList.toggle('error',isError);};
 function updateDetail(player){
  el('ci-selected-label').textContent=player?.display_name||'—';
  el('ci-detail-title').textContent=player?.display_name||'Seleccioná un rival o creá uno nuevo';
  el('ci-detail-description').textContent=player?'Prioridad '+player.priority+(player.fide_id?' · FIDE ID '+player.fide_id:' · Identificador FIDE pendiente')+' · Expediente privado.':'Cada ficha reúne investigación, partidas, observaciones y estudios privados sin afectar la biblioteca general.';
  el('ci-edit').hidden=!player;
 }
 function reset(){
  chosenId='';el('ci-form').reset();el('ci-id').value='';el('ci-priority-edit').value='C';el('ci-archive').disabled=true;updateDetail(null);render();
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
 function select(player){chosenId=player.id;closeEditor();updateDetail(player);render();}
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
  try{players=await service.listPlayers();board?.setPlayers(players);render();updateDetail(players.find(x=>x.id===chosenId));message('Base privada sincronizada. '+players.length+' expediente(s).');}
  catch(e){message('No se pudo consultar la base: '+e.message,true);}
 }
 async function switchTab(next){
  tab=next;el('ci-roster-screen').hidden=next!=='roster';el('ci-board-screen').hidden=next!=='board';
  for(const key of ['roster','board']){el('ci-tab-'+key).classList.toggle('active',key===next);el('ci-tab-'+key).setAttribute('aria-selected',String(key===next));}
  if(next==='board'&&board){await board.activate();}
 }
 async function show(){
  if(!service){notify('Supabase no está configurado para Competitive Intelligence.','err');return false;}
  let allowed=false;try{allowed=await service.authorized();}catch(e){console.warn('CI:',e.message);}
  if(!allowed){notify('Competitive Intelligence: acceso administrativo no habilitado.','err');return false;}
  authorized=true;active=true;screen.hidden=false;layout.hidden=true;toolbar.hidden=true;tools.hidden=true;
  document.querySelector('#nav-competitive-intelligence')?.classList.add('active');
  main.querySelector('.topbar h1').textContent='Competitive Intelligence';main.querySelector('.topbar p').textContent='Investigación y preparación competitiva privada.';
  await refresh();await switchTab(tab);return true;
 }
 function close(){if(active){layout.hidden=false;toolbar.hidden=false;tools.hidden=false;}active=false;authorized=false;screen.hidden=true;document.querySelector('#nav-competitive-intelligence')?.classList.remove('active');}
 async function canAccess(){if(!service)return false;try{return await service.authorized();}catch{return false;}}
 el('ci-tab-roster').onclick=()=>switchTab('roster');el('ci-tab-board').onclick=()=>switchTab('board');
 el('ci-reload').onclick=refresh;el('ci-search').oninput=render;el('ci-priority').onchange=render;
 el('ci-create').onclick=editNew;el('ci-edit').onclick=editSelected;el('ci-reset').onclick=editNew;el('ci-cancel').onclick=closeEditor;
 el('ci-open-board').onclick=async()=>{await switchTab('board');if(chosenId)await board?.selectPlayer(chosenId);};
 el('ci-form').onsubmit=async e=>{
  e.preventDefault();if(!active||!authorized)return;
  const payload={display_name:el('ci-name').value,fide_id:el('ci-fide').value,priority:el('ci-priority-edit').value,aliases:el('ci-aliases').value.split(','),notes:el('ci-notes').value};
  el('ci-save').disabled=true;
  try{const id=el('ci-id').value,record=id?await service.updatePlayer(id,payload):await service.createPlayer(payload);
   chosenId=record.id;await refresh();closeEditor();message('Expediente guardado. Seleccionado: '+record.display_name+'.');}
  catch(error){message('No se pudo guardar: '+error.message,true);}finally{el('ci-save').disabled=false;}
 };
 el('ci-archive').onclick=async()=>{
  const id=el('ci-id').value;if(!id||!active||!authorized)return;
  if(!confirm('¿Archivar el expediente? No se eliminarán sus datos.'))return;
  try{await service.archivePlayer(id);chosenId='';reset();closeEditor();await refresh();message('Expediente archivado.');}catch(e){message(e.message,true);}
 };
 el('ci-seed').onclick=async()=>{
  if(!active||!authorized)return;
  const existing=new Set(players.map(p=>p.display_name.trim().toLowerCase()));
  const pending=CANDIDATES.filter(p=>!existing.has(p.display_name.toLowerCase()));
  if(!pending.length){message('Los siete candidatos ya aparecen en el registro.');return;}
  if(!confirm('Agregar '+pending.length+' candidatos iniciales como expedientes por investigar, sin Elo ni FIDE ID?'))return;
  el('ci-seed').disabled=true;let count=0;
  try{for(const player of pending){await service.createPlayer({...player,notes:'Candidato de seguimiento universitario. Identidad, FIDE ID, partidas y estadísticas pendientes de verificación.'});count++;}
   await refresh();message('Se incorporaron '+count+' candidatos. Revisá y completá sus fuentes.');}
  catch(e){await refresh();message('Se incorporaron '+count+'. El siguiente falló: '+e.message,true);}
  finally{el('ci-seed').disabled=false;}
 };
 return {show,close,canAccess};
}
