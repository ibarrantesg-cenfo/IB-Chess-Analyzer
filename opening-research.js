import { Chess } from 'chess.js';
import { OPENING_RESEARCH_DRAFTS } from './opening-research-data.js';
import { OPENING_RESEARCH_EXPANSION } from './opening-research-more.js';
import { queryMastersPosition } from './opening-masters.js';
import { extendLegalLine,readSanTokens,researchChecklist,cleanSnapshot } from './opening-research-tools.js';
import { buildOpeningBackup, validateOpeningBackup } from './opening-research-backup.js';
import { compareOpeningEvidence } from './opening-evidence-comparison.js';
import { parsePersonalOpeningStudy } from './opening-study-import.js';
import {prepareOpeningBranch,studyRootId,linkedStudyIds} from './opening-study-branches.js';

// Local-only opening research. Engine evidence NEVER promotes a chapter to verified content.
const KEY='ib-opening-research-v1';
const el=id=>document.getElementById(id);
function safeLoad(){
 try{const raw=JSON.parse(localStorage.getItem(KEY)||'{}');return {custom:Array.isArray(raw.custom)?raw.custom:[],notes:raw.notes&&typeof raw.notes==='object'?raw.notes:{},masters:raw.masters&&typeof raw.masters==='object'?raw.masters:{},sources:raw.sources&&typeof raw.sources==='object'?raw.sources:{},evidence:raw.evidence&&typeof raw.evidence==='object'?raw.evidence:{}};}
 catch{return {custom:[],notes:{},sources:{},masters:{},evidence:{}};}
}
const mk=(tag,text='',className='')=>{const x=document.createElement(tag);x.textContent=text;if(className)x.className=className;return x;};
const sanTokens=readSanTokens;
export function validateOpeningLine(line){
 const chess=new Chess(),sans=[],fens=[chess.fen()];
 for(const token of sanTokens(line)){
  let move;try{move=chess.move(token);}catch{throw Error('Movimiento ilegal en la línea: '+token+' (después de '+sans.join(' ')+')');}
  if(!move)throw Error('Movimiento ilegal: '+token);
  sans.push(move.san);fens.push(chess.fen());
 }
 if(!sans.length)throw Error('La línea no contiene jugadas.');
 return {sans,fens};
}
export function initOpeningResearch({state,loadPGN,jump,notify,getLiveSnapshot,showReview}){
 const host=document.querySelector('.analysis-column');
 const panel=document.createElement('section');panel.className='panel opening-lab-panel';panel.id='opening-lab';panel.hidden=true;
 panel.innerHTML=`<div class="opening-lab-title"><div><span class="eyebrow">BIBLIOTECA MAESTRA · LÍNEA ACTIVA</span><h2>Explorar y analizar</h2><p>Seleccioná una línea, recorré sus jugadas en el tablero y guardá las que necesités en un estudio propio.</p></div><a href="?view=openings" id="opening-lab-study-link" class="btn outline" target="_blank" rel="noopener noreferrer" draggable="true" title="Abrí este estudio en una pestaña independiente o arrastrá el enlace">↗ Abrir en otra pestaña</a></div>
 <div class="opening-lab-body">
  <details class="opening-lab-catalog" open><summary><strong>Explorar aperturas y estudios</strong><small id="opening-lab-catalog-count">Cargando líneas…</small></summary><div class="opening-lab-catalog-body"><label>Buscar familia, línea o defensa<input type="search" id="opening-lab-search" placeholder="Najdorf, Francesa, 6.Ag5…" /></label><p class="opening-lab-muted">Las familias y sus líneas aparecen plegadas. Abrí una para ver sus jugadas, analizarla o incorporarla a un estudio.</p><div id="opening-lab-catalog-items" class="opening-lab-catalog-items"></div></div></details>
  <details class="opening-lab-personal" id="opening-lab-new-study"><summary><strong>＋ Crear estudio personal independiente</strong><small>Desde un archivo PGN o una línea SAN</small></summary><div class="opening-lab-new-body">
   <label>Nombre del estudio<input type="text" id="opening-lab-new-name" maxlength="120" placeholder="Mi repertorio contra la Francesa"></label>
   <label>Familia / apertura<input type="text" id="opening-lab-new-family" maxlength="100" placeholder="Defensa Francesa"></label>
   <label>PGN o jugadas<textarea id="opening-lab-new-pgn" rows="5" placeholder='[Event "Estudio personal"]&#10;1. e4 e6 2. d4 d5 3. e5 *'></textarea></label>
   <label class="opening-lab-file-import">Seleccionar archivo .pgn o .txt<input type="file" id="opening-lab-new-file" accept=".pgn,.txt,text/plain,application/x-chess-pgn"></label>
   <div class="opening-lab-actions"><button type="button" class="btn primary" id="opening-lab-new-create">Guardar y abrir estudio</button></div>
   <p class="opening-lab-muted">Importa la línea principal. Los comentarios sobre ella se conservan; las variantes secundarias del archivo deben añadirse como ramas independientes.</p>
  </div></details>
  <div class="opening-lab-study-actions"><span id="opening-lab-study-type">Capítulo de investigación</span><button type="button" class="btn outline" id="opening-lab-rename" hidden>Renombrar estudio</button><button type="button" class="btn outline" id="opening-lab-delete" hidden>Eliminar estudio propio</button></div>
  <p class="opening-lab-warning">Investigación experimental: las líneas se validan legalmente, pero sus comentarios y evaluaciones NO son teoría aprobada. Nada se publica ni se comparte automáticamente con alumnos.</p>
  <label class="opening-lab-field opening-lab-picker">Saltar directamente a otra línea<select id="opening-lab-choice"></select></label>
  <p id="opening-lab-aim" class="opening-lab-muted"></p>
  <div class="opening-lab-actions opening-lab-main-actions"><button class="btn primary" id="opening-lab-open">Analizar línea en el tablero</button><button class="btn outline" id="opening-lab-copy-selected">＋ Agregar a mis estudios</button><button class="btn outline" id="opening-lab-export">Exportar PGN</button></div>
  <div class="opening-lab-backup"><strong>Respaldo de la investigación</strong><p class="opening-lab-muted">Guardá ramas, comentarios, evaluaciones y estadísticas en un archivo JSON para no perderlas al cambiar de navegador.</p><div class="opening-lab-actions"><button class="btn outline" id="opening-lab-export-family">Exportar familia PGN</button><button class="btn outline" id="opening-lab-backup-download">Exportar respaldo completo</button><button class="btn outline" id="opening-lab-backup-import">Importar respaldo JSON</button><input type="file" accept=".json,application/json" id="opening-lab-backup-file" hidden></div></div>
  <div id="opening-lab-line" class="opening-lab-moves"></div>
  <section class="opening-lab-branches"><strong>Ramas de la misma posición</strong><p class="opening-lab-muted">Compara alternativas que parten de una posición idéntica. Las evaluaciones solo aparecen si hay una captura de Stockfish guardada para cada rama.</p><div id="opening-lab-branches" class="opening-lab-branch-list"></div></section>
  <p id="opening-lab-position" class="opening-lab-muted">Elegí una línea para comenzar.</p>
  <section class="opening-lab-queue"><div class="opening-lab-queue-head"><strong>Agenda de posiciones críticas</strong><span id="opening-lab-queue-progress"></span></div><p class="opening-lab-muted">Revisá comentarios con evidencia histórica, motor y referencias editoriales. Ningún indicador equivale a aprobación.</p><div class="opening-lab-actions"><button class="btn outline" id="opening-lab-next">Ir a la siguiente posición pendiente</button></div><div id="opening-lab-queue-note" class="opening-lab-muted"></div></section>
  <label class="opening-lab-field">Comentario editorial de la posición<textarea id="opening-lab-note" rows="4" placeholder="Qué cambia en la evaluación, qué amenaza el rival, planes con justificación..."></textarea></label>
  <div class="opening-lab-actions"><button class="btn outline" id="opening-lab-save-note">Guardar comentario local</button><button class="btn outline" id="opening-lab-capture">Guardar evaluación Stockfish</button></div>
  <div id="opening-lab-evidence" class="opening-lab-evidence">Sin evaluación guardada.</div>
  <div id="opening-lab-compare" class="opening-lab-compare" aria-live="polite">Comparación pendiente de datos verificables.</div>
  <div class="opening-lab-actions"><label class="opening-lab-pv-label">PV de Stockfish<select id="opening-lab-pv-rank"><option value="1">#1</option><option value="2">#2</option><option value="3">#3</option><option value="4">#4</option><option value="5">#5</option></select></label><button class="btn outline" id="opening-lab-add-pv">Crear una rama de esta PV guardada</button></div>
  <section class="opening-lab-masters"><div class="opening-lab-actions"><strong>Partidas de maestros · evidencia histórica</strong><button class="btn outline" id="opening-lab-masters-query">Consultar Lichess Masters</button></div><p class="opening-lab-muted">Solo se consulta al pulsar el botón. Frecuencia de jugadas no significa que sean correctas ni óptimas.</p><div id="opening-lab-masters-results" class="opening-lab-masters-results">Sin consulta para esta posición.</div></section>
  <label class="opening-lab-field">Fuentes y partidas modelo de esta variante<textarea id="opening-lab-sources" rows="3" placeholder="URL de partida, autor, año o referencia bibliográfica. La fuente será revisada antes de aprobar el estudio."></textarea></label>
  <div class="opening-lab-actions"><button class="btn outline" id="opening-lab-save-sources">Guardar referencias</button></div>
  <p class="opening-lab-muted">Registro editorial privado. El laboratorio no valida automáticamente afirmaciones ni reutiliza comentarios de terceros.</p>
  <section class="opening-lab-builder" id="opening-lab-builder" aria-label="Añadir variante al estudio">
    <div class="opening-lab-builder-title"><span class="eyebrow">ÁRBOL DE VARIANTES</span><h3>＋ Añadir una variante a este estudio</h3><p>No necesitás crear otro estudio. La nueva rama quedará vinculada al capítulo y a la posición que elijás.</p></div>
    <div class="opening-lab-builder-step"><strong>1. Elegí dónde empieza la variante</strong><p id="opening-lab-branch-base">Seleccioná una jugada en el tablero o en la lista superior.</p></div>
    <div class="opening-lab-builder-step"><strong>2. Elegí cómo ingresarla</strong><select id="opening-lab-branch-mode" aria-label="Método para agregar variante"><option value="san">Escribir SAN internacional (N, B, R, Q, K)</option><option value="san-es">Escribir notación española (C, A, T, D, R)</option><option value="pgn">Pegar un PGN completo con las jugadas previas</option></select><small id="opening-lab-notation-help">SAN internacional: N=caballo, B=alfil, R=torre, Q=dama, K=rey. Ejemplo: Be7 Qd2 O-O.</small>
      <textarea id="opening-lab-extra" rows="3" spellcheck="false" placeholder="Ej.: 8... Be7 9. Qd2 O-O"></textarea>
      <label class="opening-lab-branch-import">O cargar un archivo PGN/TXT <input type="file" id="opening-lab-branch-file" accept=".pgn,.txt,application/x-chess-pgn,text/plain"></label>
      <div class="opening-lab-actions"><button type="button" class="btn outline" id="opening-lab-branch-check">✓ Revisar jugadas</button><button type="button" class="btn primary" id="opening-lab-add" disabled>Guardar rama vinculada</button></div>
      <p id="opening-lab-branch-feedback" role="status" aria-live="polite">Primero verificá las jugadas. Podés recorrer el resultado en el tablero después de guardar.</p>
    </div>
    <div class="opening-lab-builder-step"><strong>3. O utilizar Stockfish</strong><p>Calculá una posición con MultiPV y pulsá «Añadir al estudio personal» en una de sus líneas; también podés usar «Crear una rama de esta PV guardada» junto a la evaluación.</p></div>
    <div id="opening-lab-family-tree" class="opening-lab-family-tree"></div>
  </section>
  <div class="opening-lab-actions"><button class="btn outline" id="opening-lab-refresh">Actualizar estado</button></div>
  <p id="opening-lab-status" role="status" aria-live="polite" class="opening-lab-muted"></p>
  <a id="opening-lab-reference" target="_blank" rel="noopener noreferrer">Abrir referencia de clasificación</a>
 </div>`;
 host.append(panel);
 // Discovery and study analysis are independent surfaces. Technical controls stay folded.
 const explorer=document.createElement('section');explorer.className='panel opening-lab-explorer';explorer.hidden=true;
 explorer.innerHTML='<div class="opening-lab-explorer-head"><span class="eyebrow">IB CHESS ACADEMY · EXPLORAR</span><h2>Biblioteca de aperturas</h2><p>Familias plegadas, líneas organizadas y acceso directo a tus estudios.</p></div>';
 explorer.append(panel.querySelector('.opening-lab-catalog'),panel.querySelector('.opening-lab-personal'));
 host.insertBefore(explorer,panel);
 const fold=(selector,title,help)=>{
  const content=panel.querySelector(selector);if(!content)return;
  const wrap=document.createElement('details');wrap.className='opening-lab-fold';
  const summary=mk('summary',title,'opening-lab-fold-title');
  const description=mk('p',help,'opening-lab-muted');
  content.replaceWith(wrap);wrap.append(summary,description,content);
 };
 fold('.opening-lab-branches','Alternativas y transposiciones','Mostrá solo cuando necesités comparar rutas que parten de la misma posición.');
 fold('.opening-lab-builder','Crear una variante manual o desde Stockfish','Panel avanzado: pegá jugadas, importá PGN o guardá una PV del motor.');
 fold('.opening-lab-backup','Herramientas y respaldos','Exportación masiva y copia de seguridad local para proteger tu investigación.');
 fold('.opening-lab-picker','Cambiar de línea por lista','Alternativa al explorador de familias, útil cuando ya conocés el nombre.');
 const advanced=document.createElement('details');advanced.className='opening-lab-fold opening-lab-research-fold';
 const advancedSummary=mk('summary','Verificación, estadísticas y fuentes','opening-lab-fold-title');
 const advancedInfo=mk('p','Investigación adicional con Stockfish, Lichess Masters y bibliografía. Los resultados no aprueban por sí solos una variante.','opening-lab-muted');
 const researchBody=mk('div','','opening-lab-research-body');advanced.append(advancedSummary,advancedInfo,researchBody);
 const queue=el('opening-lab-queue');
 queue.before(advanced);
 const advancedNodes=[
  queue,el('opening-lab-evidence'),el('opening-lab-compare'),
  el('opening-lab-pv-rank')?.closest('.opening-lab-actions'),
  el('opening-lab-masters-results')?.closest('.opening-lab-masters'),
  el('opening-lab-sources')?.closest('.opening-lab-field'),
  el('opening-lab-save-sources')?.closest('.opening-lab-actions'),
  el('opening-lab-reference')
 ];
 for(const node of advancedNodes)if(node)researchBody.append(node);
 const data=safeLoad();
 const copyDialog=document.createElement('dialog');copyDialog.className='opening-lab-copy-dialog';
 copyDialog.innerHTML=`<div class="opening-lab-copy-heading"><div><span class="eyebrow">MIS ESTUDIOS · BIBLIOTECA PGN</span><h2>Agregar esta línea a un estudio</h2></div><button type="button" class="btn outline" id="opening-copy-close" aria-label="Cerrar">✕ Cerrar</button></div>
 <p id="opening-copy-source" class="opening-lab-copy-source"></p>
 <fieldset class="opening-lab-copy-options"><legend>¿Dónde querés guardarla?</legend><label><input type="radio" name="opening-copy-mode" value="existing" checked/> Agregar como capítulo a un estudio existente</label><label><input type="radio" name="opening-copy-mode" value="new"/> Crear un estudio nuevo con esta línea</label></fieldset>
 <label class="opening-lab-copy-field" id="opening-copy-existing-field">Seleccioná uno de tus estudios<select id="opening-copy-existing"><option value="">Cargando estudios…</option></select></label>
 <label class="opening-lab-copy-field" id="opening-copy-new-field" hidden>Nombre del estudio nuevo<input type="text" id="opening-copy-new-name" maxlength="120" placeholder="Mi repertorio de aperturas"/></label>
 <p class="opening-lab-copy-disclaimer">Se guardará como capítulo en tu <strong>Biblioteca PGN local</strong>. No modifica la línea original ni se comparte con alumnos automáticamente. Los comentarios siguen siendo borradores editoriales.</p>
 <p id="opening-copy-message" role="status" aria-live="polite"></p>
 <div class="opening-lab-copy-actions"><button type="button" class="btn outline" id="opening-copy-cancel">Cancelar</button><button type="button" class="btn primary" id="opening-copy-confirm">Guardar capítulo</button><button type="button" class="btn outline" id="opening-copy-library" hidden>Ver en Biblioteca PGN</button></div>`;
 document.body.append(copyDialog);
 let copySourceId=null,copyDestinations=[],copyVersion=0;
 const copyMode=()=>copyDialog.querySelector('input[name="opening-copy-mode"]:checked')?.value||'new';
 const copyState=()=>{
  const existing=copyMode()==='existing';
  el('opening-copy-existing-field').hidden=!existing;
  el('opening-copy-new-field').hidden=existing;
  el('opening-copy-confirm').disabled=existing?!el('opening-copy-existing').value:el('opening-copy-new-name').value.trim().length<3;
 };
 const closeCopy=()=>copyDialog.close();
 el('opening-copy-close').onclick=closeCopy;el('opening-copy-cancel').onclick=closeCopy;
 copyDialog.addEventListener('close',()=>{copyVersion++;});
 for(const input of copyDialog.querySelectorAll('input[name="opening-copy-mode"]'))input.onchange=copyState;
 el('opening-copy-existing').onchange=copyState;
 el('opening-copy-new-name').oninput=copyState;
 el('opening-copy-library').onclick=()=>{
  closeCopy();document.querySelector('#nav-library')?.click();
 };
 async function openCopyToLibrary(id){
  const source=entries().find(x=>x.id===id);
  if(!source)return notify('La línea seleccionada ya no está disponible.','err');
  copySourceId=id;
  const request=++copyVersion;
  el('opening-copy-source').textContent=(source.family||'Apertura')+' · '+source.name+' · '+(source.eco||'sin ECO');
  el('opening-copy-new-name').value=('Mi estudio · '+source.name).slice(0,120);
  el('opening-copy-message').textContent='Buscando tus estudios guardados en este navegador…';
  el('opening-copy-library').hidden=true;
  el('opening-copy-confirm').hidden=false;el('opening-copy-confirm').disabled=true;
  el('opening-copy-existing').replaceChildren(new Option('Cargando estudios…',''));
  if(!copyDialog.open)copyDialog.showModal();
  try{
   if(!window.IB_STUDIO?.listOpeningStudyDestinations)throw Error('La Biblioteca PGN no está disponible en esta versión.');
   const destinations=await window.IB_STUDIO.listOpeningStudyDestinations();
   if(request!==copyVersion||!copyDialog.open)return;
   copyDestinations=destinations;
   const select=el('opening-copy-existing');select.replaceChildren(new Option('Elegí un estudio…',''));
   for(const item of destinations){
    const option=document.createElement('option');option.value=item.id;
    option.textContent=item.title+' · '+item.count+' capítulo(s)';select.append(option);
   }
   const existingRadio=copyDialog.querySelector('input[value="existing"]');
   existingRadio.disabled=!destinations.length;
   copyDialog.querySelector('input[value="'+(destinations.length?'existing':'new')+'"]').checked=true;
   el('opening-copy-message').textContent=destinations.length?
     'Elegí un estudio para añadir una nueva línea, o creá uno nuevo.':'Todavía no hay estudios guardados. Creá uno nuevo con esta línea.';
   copyState();
  }catch(e){
   if(request!==copyVersion)return;
   copyDialog.querySelector('input[value="existing"]').disabled=true;
   copyDialog.querySelector('input[value="new"]').checked=true;copyState();
   el('opening-copy-message').textContent='No se pudo leer la biblioteca existente: '+e.message+'. Podés crear un estudio nuevo si el almacenamiento local está disponible.';
  }
 }
 el('opening-copy-confirm').onclick=async()=>{
  const source=entries().find(x=>x.id===copySourceId);
  if(!source)return;
  const selectedMode=copyMode();
  const targetId=selectedMode==='existing'?el('opening-copy-existing').value:'';
  const newStudyName=selectedMode==='new'?el('opening-copy-new-name').value.trim():'';
  const button=el('opening-copy-confirm');
  button.disabled=true;
  el('opening-copy-message').textContent='Guardando la línea en tu biblioteca…';
  try{
   if(!window.IB_STUDIO?.addOpeningLineToLibrary)throw Error('No se encontró el guardado de estudios.');
   const result=await window.IB_STUDIO.addOpeningLineToLibrary({
    pgn:makePgn(source),sourceId:source.id,lineName:source.name,
    targetId,newStudyName
   });
   el('opening-copy-message').textContent='✓ '+result.lineName+' se guardó en «'+result.collectionName+'» como capítulo independiente. Ya podés abrirlo, comentarlo o compartir tu estudio desde Biblioteca PGN.';
   el('opening-copy-confirm').hidden=true;
   el('opening-copy-library').hidden=false;
   notify('Línea agregada al estudio «'+result.collectionName+'» en Biblioteca PGN.');
  }catch(e){
   el('opening-copy-message').textContent='No se pudo guardar: '+e.message;
   copyState();notify(e.message,'err');
  }
 };
 const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(data));}catch{notify('No se pudo guardar el laboratorio en este navegador. Exportá el PGN para conservarlo.','err');}};
 const entries=()=>[...OPENING_RESEARCH_DRAFTS,...OPENING_RESEARCH_EXPANSION,...data.custom].sort((a,b)=>a.family.localeCompare(b.family,'es')||a.name.localeCompare(b.name,'es'));
 let selected=OPENING_RESEARCH_DRAFTS[0]?.id,visible=false,filterText='',branchPreview=null;
 const expandedFamilies=new Set(),expandedLines=new Set();
 const requestedId=new URLSearchParams(window.location.search).get('study');
 if(requestedId&&entries().some(x=>x.id===requestedId))selected=requestedId;
 const pick=()=>entries().find(x=>x.id===selected);
 const studyHref=id=>{
   const url=new URL(window.location.href);
   url.searchParams.delete('solicitar');url.searchParams.set('view','openings');url.searchParams.set('study',id);
   url.hash='';return url.pathname+url.search;
 };
 const invalidateBranchPreview=message=>{
   branchPreview=null;
   const button=el('opening-lab-add'),status=el('opening-lab-branch-feedback');
   if(button)button.disabled=true;
   if(status)status.textContent=message||'Revisá las jugadas antes de guardar.';
 };
 const switchStudy=(id,{push=true,openLine=true}={})=>{
   if(!entries().some(x=>x.id===id))return false;
   const changed=selected!==id;
   selected=id;
   if(changed)invalidateBranchPreview('Elegí la posición de origen y revisá las jugadas de la nueva rama.');
   if(visible)document.title=(pick()?.name||'Biblioteca Maestra')+' · IB Chess Analyzer';
   if(push&&visible){
     const url=studyHref(id);
     if(location.pathname+location.search!==url)history.pushState({view:'openings',study:id},'',url);
   }
   render();
   if(openLine&&visible)openAt(0);
   return changed;
 };
 function currentPly(){
  return state.game?.headers?.ResearchID===selected?state.move:0;
 }
 function makePgn(draft){
  const {sans}=validateOpeningLine(draft.moves);
  const c=new Chess();
  c.header('Event','IB Chess Academy - laboratorio sin publicar','White','Plan blanco','Black','Plan negro','Result','*','ECO',draft.eco||'?','ResearchID',draft.id,'StudyStatus','BORRADOR - REVISION PENDIENTE','ReferenceType','Clasificacion y estudio - no validacion tecnica');
  for(let ply=1;ply<=sans.length;ply++){
    c.move(sans[ply-1]);
    const notes=[];
    const original=data.notes[draft.id+'|'+ply]??draft.notes?.[ply];
    if(original)notes.push(String(original));
    const evidence=data.evidence[draft.id+'|'+ply];
    if(evidence?.complete&&evidence.fen===c.fen()&&evidence.lines?.length){
      notes.push('CAPTURA DE MOTOR (no equivale a teoria aprobada): '+evidence.engine+' d'+evidence.depth+'; '+evidence.lines.map(v=>'#'+v.rank+' '+v.score+' d'+v.depth+': '+v.san).join(' / '));
    }
    const masters=data.masters[c.fen()];
    if(masters?.result){
      const m=masters.result,n=m.white+m.draws+m.black;
      notes.push('ESTADISTICA HISTORICA LICHESS MASTERS: '+n+' partidas; blancas '+m.white+', tablas '+m.draws+', negras '+m.black+'. Frecuencia no implica calidad objetiva.');
    }
    if(ply===sans.length){
      const bibliography=data.sources[draft.id];
      if(bibliography)notes.push('REFERENCIAS EDITORIALES PENDIENTES DE REVISION: '+bibliography.replace(/\s+/g,' ').slice(0,1600));
    }
    if(notes.length)c.setComment(notes.join(' | '));
  }
  return c.pgn();
 }
 function renderChoices(){
  const select=el('opening-lab-choice');select.replaceChildren();
  let previous='';
  for(const d of entries()){
   if(d.family!==previous){const group=mk('optgroup');group.label=d.family;select.append(group);previous=d.family;}
   const option=mk('option',d.name);option.value=d.id;select.lastElementChild.append(option);
  }
  if(!entries().some(x=>x.id===selected))selected=entries()[0]?.id;
  select.value=selected||'';
 }
 function renderCatalog(){
  const list=el('opening-lab-catalog-items');list.replaceChildren();
  const roots=entries().filter(x=>!x.origin?.parent);
  const normalize=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  const filtered=roots.filter(x=>normalize(x.family+' '+x.name+' '+x.eco).includes(filterText));
  const groups=new Map();
  const personal=filtered.filter(x=>data.custom.some(y=>y.id===x.id));
  const editorial=filtered.filter(x=>!data.custom.some(y=>y.id===x.id));
  if(personal.length)groups.set('mine',{label:'Mis estudios de aperturas · privados',items:personal});
  for(const item of editorial){
   const key='family:'+item.family;
   if(!groups.has(key))groups.set(key,{label:item.family,items:[]});
   groups.get(key).items.push(item);
  }
  el('opening-lab-catalog-count').textContent=filtered.length+'/'+roots.length+' líneas · '+groups.size+' grupos';
  for(const [key,group] of groups){
    const family=document.createElement('details');family.className='opening-lab-catalog-family';
    family.open=expandedFamilies.has(key)||Boolean(filterText);
    const summary=mk('summary',group.label+' · '+group.items.length+' línea(s)','opening-lab-family-summary');
    const section=mk('div','','opening-lab-family-items');
    family.append(summary,section);
    for(const item of group.items){
      const line=document.createElement('details');line.className='opening-lab-catalog-line';
      line.open=expandedLines.has(item.id);
      const title=mk('summary','','opening-lab-catalog-line-head');
      title.append(mk('span',item.name),mk('small',(item.eco||'ECO pendiente')+' · '+(data.custom.some(x=>x.id===item.id)?'Estudio personal':'Borrador editorial')));
      const body=mk('div','','opening-lab-catalog-line-body');
      const sans=validateOpeningLine(item.moves).sans;
      const formatted=sans.map((san,i)=>(i%2===0?(Math.floor(i/2)+1)+'. ':'')+san).join(' ');
      body.append(mk('p',formatted,'opening-lab-catalog-line-moves'));
      body.append(mk('p',item.research||'Pendiente de validación con Stockfish y partidas modelo.','opening-lab-muted'));
      const actions=mk('div','','opening-lab-catalog-line-actions');
      const analyze=mk('button','♟ Analizar en el tablero','btn outline');analyze.type='button';
      analyze.onclick=()=>switchStudy(item.id,{openLine:true});
      const add=mk('button','＋ Agregar a mis estudios','btn primary');add.type='button';
      add.onclick=()=>openCopyToLibrary(item.id);
      const separate=document.createElement('a');separate.href=studyHref(item.id);separate.target='_blank';separate.rel='noopener noreferrer';separate.className='btn outline';separate.textContent='↗ Otra pestaña';
      actions.append(analyze,add,separate);body.append(actions);
      line.append(title,body);
      line.addEventListener('toggle',()=>{
        if(line.open)expandedLines.add(item.id);else expandedLines.delete(item.id);
      });
      section.append(line);
    }
    family.addEventListener('toggle',()=>{
      if(family.open)expandedFamilies.add(key);else expandedFamilies.delete(key);
    });
    list.append(family);
  }
  if(!filtered.length)list.append(mk('p','No se encontraron líneas con ese nombre.','opening-lab-muted'));
 }
 function activeIsCorrect(){return state.game?.headers?.ResearchID===selected;}
 function render(){
  const draft=pick();if(!draft)return;
  renderChoices();
  renderCatalog();
  const selectedStudyLink=el('opening-lab-study-link');
  selectedStudyLink.href=studyHref(selected);
  selectedStudyLink.setAttribute('aria-label','Abrir '+draft.name+' en otra pestaña');
  const ownStudy=data.custom.some(x=>x.id===selected);
  el('opening-lab-study-type').textContent=ownStudy?'Estudio personal privado · editable':'Capítulo de investigación · borrador';
  el('opening-lab-rename').hidden=!ownStudy;
  el('opening-lab-delete').hidden=!ownStudy;
  el('opening-lab-aim').textContent=(draft.eco||'')+' · Investigación: '+(draft.research||'Revisión editorial pendiente.');
  const reference=el('opening-lab-reference');reference.hidden=!draft.reference;
  if(draft.reference)reference.href=draft.reference;
  const {sans,fens}=validateOpeningLine(draft.moves),lineEl=el('opening-lab-line');
  lineEl.replaceChildren();
  sans.forEach((san,i)=>{
   const chip=mk('button',(i%2===0?(Math.floor(i/2)+1)+'. ':'')+san,'opening-lab-move');
   chip.type='button';chip.classList.toggle('selected',activeIsCorrect()&&currentPly()===i+1);
   chip.onclick=()=>openAt(i+1);lineEl.append(chip);
  });
  const ply=Math.min(currentPly(),sans.length),key=selected+'|'+ply;
  const lastLabel=ply?(Math.floor((ply-1)/2)+1)+(ply%2===0?'... ':'. ')+sans[ply-1]:'posición inicial';
  el('opening-lab-branch-base').textContent='Posición elegida: '+lastLabel+' · media jugada '+ply+' · '+(ply%2===0?'juegan blancas':'juegan negras')+'. La rama empieza AQUÍ.';
  const treeRoot=studyRootId(entries(),selected);
  const linked=data.custom.filter(x=>x.origin?.parent&&studyRootId(entries(),x.id)===treeRoot);
  const familyTree=el('opening-lab-family-tree');familyTree.replaceChildren();
  if(treeRoot!==selected){
    const back=document.createElement('button');back.type='button';back.className='btn outline';back.textContent='↩ Volver al estudio principal';back.onclick=()=>switchStudy(treeRoot,{openLine:true});familyTree.append(back);
  }
  familyTree.append(mk('strong','Ramas guardadas en este estudio: '+linked.length));
  if(!linked.length)familyTree.append(mk('p','Todavía no hay ramas personales vinculadas.','opening-lab-muted'));
  for(const item of linked){
    const row=mk('div','','opening-lab-branch-entry');
    const parent=entries().find(x=>x.id===item.origin.parent);
    const info=mk('span',item.name+' · desde '+(parent?.name||'estudio')+' · ply '+item.origin.parentPly);
    const open=document.createElement('button');open.type='button';open.className='btn outline';open.textContent='Abrir rama';
    open.onclick=()=>switchStudy(item.id,{openLine:true});
    row.append(info,open);familyTree.append(row);
  }
  const branchHost=el('opening-lab-branches');branchHost.replaceChildren();
  const related=entries().filter(other=>other.family===draft.family&&other.id!==draft.id).map(other=>{
    const otherSans=validateOpeningLine(other.moves).sans;
    let common=0;while(common<Math.min(sans.length,otherSans.length)&&sans[common]===otherSans[common])common++;
    return {other,otherSans,common};
  }).filter(x=>x.common>=5&&x.common<Math.min(sans.length,x.otherSans.length)).sort((a,b)=>b.common-a.common).slice(0,12);
  if(!related.length)branchHost.append(mk('p','Aún no se han identificado alternativas con prefijo compartido.','opening-lab-muted'));
  for(const {other,otherSans,common} of related){
    const row=mk('div','','opening-lab-branch');
    const details=mk('div','','opening-lab-branch-copy');
    const prefix=(common%2===0?(Math.floor(common/2)+1)+'. ':(Math.floor(common/2)+1)+'... ');
    details.append(mk('strong',prefix+otherSans[common]+' · '+other.name));
    details.append(mk('small','Bifurcación tras '+common+' medias jugadas · misma FEN'));
    const evidence=data.evidence[other.id+'|'+(common+1)];
    const fensOther=validateOpeningLine(other.moves).fens;
    const validEvidence=evidence?.fen===fensOther[common+1]&&evidence?.complete===true;
    details.append(mk('small',validEvidence?'Captura: '+(evidence.lines[0]?.score||'—')+' · d'+evidence.depth+' · orientación blancas':'Sin evaluación guardada de esta continuación'));
    const open=mk('button','Abrir rama','btn outline');open.type='button';
    open.onclick=()=>{switchStudy(other.id,{openLine:false});openAt(common+1);};
    row.append(details,open);branchHost.append(row);
  }
  el('opening-lab-position').textContent=(activeIsCorrect()?'Posición '+ply+'/'+sans.length:'Variante aún no abierta')+' · FEN: '+fens[ply];
  el('opening-lab-note').value=data.notes[key]??draft.notes?.[ply]??'';
  el('opening-lab-sources').value=data.sources[selected]||'';
  const masterHost=el('opening-lab-masters-results');masterHost.replaceChildren();
  const historic=data.masters[fens[ply]];
  if(!historic)masterHost.append(mk('p','Esta FEN todavía no tiene evidencia de partidas magistrales registrada.','opening-lab-muted'));
  else{
    const {result,capturedAt}=historic;
    const total=result.white+result.draws+result.black;
    masterHost.append(mk('p',total+' partidas en esta posición · consulta: '+new Date(capturedAt).toLocaleString('es-CR'),'opening-lab-muted'));
    if(!total)masterHost.append(mk('p','No se encontraron partidas en el conjunto de maestros para esta FEN.','opening-lab-muted'));
    for(const row of result.moves){
      const n=row.white+row.draws+row.black;
      masterHost.append(mk('p',row.san+' · '+n+' partida(s)'+(n?' · blancas '+((row.white+row.draws/2)*100/n).toFixed(1)+'% de puntos':'')+' · media Elo '+(row.averageRating||'—'),'opening-lab-master-move'));
    }
    if(result.games.length){
      const examples=mk('div','','opening-lab-games');
      for(const g of result.games){if(!g.id)continue;
        const link=document.createElement('a');link.href='https://explorer.lichess.org/masters/pgn/'+g.id;link.rel='noopener noreferrer';link.target='_blank';
        link.textContent='PGN maestro: '+g.white+' – '+g.black+(g.year?' · '+g.year:'');examples.append(link);
      }
      masterHost.append(examples);
    }
  }
  const stored=data.evidence[key],evidence=el('opening-lab-evidence');evidence.replaceChildren();
  if(stored?.fen===fens[ply]){
   evidence.append(mk('strong','Stockfish 19 Lite · profundidad '+stored.depth+' · '+new Date(stored.capturedAt).toLocaleString('es-CR')));
   for(const line of stored.lines)evidence.append(mk('p','#'+line.rank+' · '+line.score+' · d'+line.depth+' · '+line.san));
   evidence.append(mk('small','Esta captura documenta resultados del motor en una posición concreta; no certifica explicaciones estratégicas.'));
  }else evidence.textContent='Sin evaluación MultiPV guardada para esta posición. Abrí la línea y esperá a que Stockfish complete el cálculo.';
  const comparison=el('opening-lab-compare');comparison.replaceChildren();
  const collated=(stored?.fen===fens[ply]&&historic?.result)?compareOpeningEvidence(stored,historic.result):null;
  if(!collated?.hasBoth){
    comparison.append(mk('p','Para contrastar esta posición, guardá tanto una evaluación MultiPV de Stockfish como una consulta del Opening Explorer de maestros.','opening-lab-muted'));
  }else{
    comparison.append(mk('strong','Contraste · motor y práctica magistral'));
    comparison.append(mk('p','Stockfish #1: '+collated.engineBest+' ('+collated.engineEval+' · d'+collated.engineDepth+'). Más jugada entre maestros: '+collated.mostPlayed+' ('+collated.mostPlayedCount+' de '+collated.sample+' partidas).'));
    comparison.append(mk('p',collated.match?
      'La primera jugada del motor coincide con la más frecuente en la muestra. Esta coincidencia no demuestra que sea óptima.':
      'Las preferencias no coinciden. Es una posición candidata para investigar diferencias prácticas, cambios teóricos o limitaciones de la muestra; no implica refutación.'));
    comparison.append(mk('small','Las evaluaciones son desde las blancas. El número de partidas no reemplaza cálculo táctico; comparar siempre búsquedas en la misma posición.'));
  }
  const queue=researchChecklist(entries(),data,draft.family);
  const done=queue.filter(x=>x.missing===0).length,eng=queue.filter(x=>x.hasEngine).length,history=queue.filter(x=>x.hasMasters).length,refs=queue.filter(x=>x.hasSources).length;
  el('opening-lab-queue-progress').textContent=done+'/'+queue.length+' con 3 evidencias';
  el('opening-lab-queue-note').textContent=eng+' con Stockfish · '+history+' con partidas de maestros · '+refs+' con referencias · '+(queue.length-done)+' pendientes';
  el('opening-lab-status').textContent=entries().length+' líneas en investigación · '+Object.keys(data.evidence).length+' posiciones con evidencia local. Ninguna aprobada automáticamente.';
 }
 function openAt(ply){
  try{
   const draft=pick(),{sans}=validateOpeningLine(draft.moves);
   if(!visible)open();
   if(!activeIsCorrect())loadPGN(makePgn(draft),'Laboratorio · '+draft.name);
   if(!activeIsCorrect())throw Error('Game Review no cargó la variante. Comprobá el PGN.');
   jump(Math.max(0,Math.min(ply,sans.length)));
   panel.open=true;render();
  }catch(e){notify('No se pudo abrir la línea: '+e.message,'err');}
 }
 el('opening-lab-new-file').onchange=async()=>{
  const input=el('opening-lab-new-file'),file=input.files?.[0];if(!file)return;
  try{
    if(file.size>250000)throw Error('El archivo supera el máximo de 250 KB para un estudio.');
    const raw=await file.text();
    el('opening-lab-new-pgn').value=raw;
    if(!el('opening-lab-new-name').value.trim())el('opening-lab-new-name').value=file.name.replace(/\.(pgn|txt)$/i,'').slice(0,120);
    notify('Archivo cargado. Revisá el nombre y guardá el estudio personal.');
  }catch(e){notify(e.message,'err');}finally{input.value='';}
 };
 el('opening-lab-new-create').onclick=()=>{
  try{
    const title=el('opening-lab-new-name').value.trim(),family=el('opening-lab-new-family').value.trim();
    if(title.length<3)throw Error('Ingresá un nombre de estudio de al menos tres caracteres.');
    const result=parsePersonalOpeningStudy(el('opening-lab-new-pgn').value);
    const id='user-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9);
    const study={id,name:title,family:family||'Mis estudios personales',eco:String(result.headers.ECO||'').slice(0,12),moves:result.moves,
      research:'Estudio personal creado desde PGN. Pendiente de análisis con Stockfish.',notes:{},reference:''};
    data.custom.push(study);
    for(const [ply,note] of Object.entries(result.notes))data.notes[id+'|'+ply]=note;
    persist();
    el('opening-lab-new-name').value='';el('opening-lab-new-pgn').value='';
    el('opening-lab-new-study').open=false;
    switchStudy(id,{openLine:true});
    notify('Estudio personal creado con '+result.plyCount+' medias jugadas. Podés crear ramas y comentarios propios.');
  }catch(error){notify('No se pudo crear el estudio: '+error.message,'err');}
 };
 el('opening-lab-rename').onclick=()=>{
  const item=data.custom.find(x=>x.id===selected);if(!item)return;
  const next=window.prompt('Nuevo nombre del estudio',item.name);
  if(next===null)return;
  const name=next.trim();if(name.length<3||name.length>120)return notify('Usá un nombre de 3 a 120 caracteres.','err');
  item.name=name;persist();render();notify('Nombre del estudio actualizado.');
 };
 el('opening-lab-delete').onclick=()=>{
  const item=data.custom.find(x=>x.id===selected);if(!item)return;
  const deleting=linkedStudyIds(data.custom,item.id),removed=new Set(deleting);
  const parent=item.origin?.parent&&!removed.has(item.origin.parent)?item.origin.parent:null;
  if(!window.confirm('Se eliminará este estudio y '+(deleting.length-1)+' rama(s) dependiente(s), junto con sus notas y evaluaciones locales. Esta acción es irreversible. ¿Continuar?'))return;
  data.custom=data.custom.filter(x=>!removed.has(x.id));
  for(const key of Object.keys(data.notes))if(deleting.some(id=>key.startsWith(id+'|')))delete data.notes[key];
  for(const key of Object.keys(data.evidence))if(deleting.some(id=>key.startsWith(id+'|')))delete data.evidence[key];
  for(const id of deleting)delete data.sources[id];
  persist();
  const next=parent||entries()[0]?.id;
  if(next)switchStudy(next,{openLine:true});else render();
  notify('Estudio y sus ramas dependientes eliminados únicamente de este navegador.');
 };
 el('opening-lab-choice').onchange=e=>{switchStudy(e.target.value,{openLine:true});};
 el('opening-lab-search').addEventListener('input',e=>{filterText=e.target.value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();renderCatalog();});
 el('opening-lab-open').onclick=()=>{const {sans}=validateOpeningLine(pick().moves);openAt(sans.length);};
 el('opening-lab-copy-selected').onclick=()=>openCopyToLibrary(selected);
 el('opening-lab-refresh').onclick=render;
 el('opening-lab-save-note').onclick=()=>{
  if(!activeIsCorrect())return notify('Abrí primero la variante y seleccioná una posición.','err');
  const key=selected+'|'+currentPly(),text=el('opening-lab-note').value.trim();
  if(text.length>4000)return notify('El comentario supera 4000 caracteres.','err');
  if(text)data.notes[key]=text;else delete data.notes[key];
  persist();render();notify('Comentario guardado localmente como borrador editorial.');
 };
 el('opening-lab-masters-query').onclick=async()=>{
  const draft=pick(),ply=activeIsCorrect()?state.move:0;
  const selectedFen=validateOpeningLine(draft.moves).fens[ply],button=el('opening-lab-masters-query');
  button.disabled=true;
  const resultHost=el('opening-lab-masters-results');resultHost.textContent='Consultando partidas magistrales…';
  try{
    const result=await queryMastersPosition(selectedFen);
    data.masters[selectedFen]={result,capturedAt:new Date().toISOString(),provider:'Lichess Masters'};
    persist();render();notify('Datos de Masters registrados para esta posición. Recordá contrastarlos con Stockfish.');
  }catch(e){resultHost.textContent=e.message;notify(e.message,'err');}
  finally{button.disabled=false;}
 };
 el('opening-lab-save-sources').onclick=()=>{
  const refs=el('opening-lab-sources').value.trim();
  if(refs.length>4000)return notify('El registro de fuentes supera 4000 caracteres.','err');
  if(refs)data.sources[selected]=refs;else delete data.sources[selected];
  persist();render();notify('Referencias guardadas como borrador; se comprobarán antes de aprobar el capítulo.');
 };
 el('opening-lab-next').onclick=()=>{
  const draft=pick(),queue=researchChecklist(entries(),data,draft.family).filter(x=>x.missing>0);
  if(!queue.length){notify('Todos los puntos registrados tienen tres tipos de evidencia; aún requieren revisión de entrenador.');return;}
  let idx=queue.findIndex(x=>x.id===selected&&x.ply===currentPly());
  if(idx<0){idx=-1;}
  const next=queue[(idx+1)%queue.length];
  switchStudy(next.id,{openLine:false});openAt(next.ply);
  notify('Posición pendiente: '+next.name+'. Falta '+(!next.hasEngine?'Stockfish; ':'')+(!next.hasMasters?'partidas maestras; ':'')+(!next.hasSources?'fuentes; ':''));
 };
 el('opening-lab-add-pv').onclick=()=>{
  if(!activeIsCorrect())return notify('Abrí primero una posición del capítulo.','err');
  const base=pick(),ply=currentPly(),stored=data.evidence[selected+'|'+ply];
  if(!stored)return notify('Guardá primero el análisis MultiPV desde esta misma posición.','err');
  try{
    const fen=validateOpeningLine(base.moves).fens[ply];
    const snapshot=cleanSnapshot(stored,fen);
    const rank=Number(el('opening-lab-pv-rank').value);
    const candidate=snapshot.lines.find(x=>x.rank===rank);
    if(!candidate)throw Error('La captura no incluye la variante #'+rank+'. Seleccioná un número disponible.');
    const line=extendLegalLine(base.moves,ply,candidate.san);
    saveLinkedBranch(base,ply,{...line,baseFen:fen},{
      name:'Stockfish PV #'+rank+' · d'+candidate.depth+' · '+line.added.slice(0,3).join(' '),
      method:'engine-pv',engine:{rank,depth:candidate.depth,score:candidate.score},
      research:'Candidata calculada por '+snapshot.engine+' a profundidad '+candidate.depth+' con evaluación '+candidate.score+' para las blancas. Requiere contrastar partidas y planes.'
    });
  }catch(e){notify('No se pudo añadir la variante de Stockfish: '+e.message,'err');}
 };
 el('opening-lab-capture').onclick=()=>{
  if(!activeIsCorrect()||state.busy)return notify('Seleccioná una posición de la variante y terminá primero Game Review.','err');
  const snap=getLiveSnapshot();
  if(!snap||snap.fen!==state.positions[state.move])return notify('El motor aún no corresponde a esta posición. Esperá el análisis en directo.','err');
  let verified;
  try{verified=cleanSnapshot(snap,state.positions[state.move]);}
  catch(e){return notify(e.message,'err');}
  data.evidence[selected+'|'+currentPly()]=verified;
  persist();render();notify('Captura de Stockfish guardada. Pendiente de contraste con partidas modelo.');
 };
 const saveLinkedBranch=(base,ply,prepared,{name,method='san',research='',engine=null}={})=>{
  if(entries().some(x=>validateOpeningLine(x.moves).sans.join(' ')===prepared.moves))throw Error('Esta continuación ya existe. Abrí la rama existente en el árbol del estudio.');
  const id='user-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9);
  const root=studyRootId(entries(),base.id);
  const branch={id,eco:base.eco,family:base.family,name:(name||'Variante · '+prepared.added.slice(0,4).join(' ')).slice(0,150),
    moves:prepared.moves,notes:{},reference:base.reference,
    research:research||'Variante creada en un estudio personal. Validación editorial pendiente.',
    origin:{type:method,parent:base.id,rootStudy:root,parentPly:ply,rootFen:prepared.baseFen||validateOpeningLine(base.moves).fens[ply],
      ...(engine?{rank:engine.rank,depth:engine.depth,score:engine.score}: {})}};
  data.custom.push(branch);
  persist();
  switchStudy(id,{openLine:false});
  openAt(prepared.added.length+ply);
  notify('Variante guardada dentro del estudio. Podés volver al principal desde el árbol de ramas.');
  return id;
 };
 const checkBranch=()=>{
  try{
   if(!activeIsCorrect())throw Error('Primero abrí una línea y elegí la jugada donde querés bifurcar.');
   const base=pick(),ply=currentPly(),mode=el('opening-lab-branch-mode').value,raw=el('opening-lab-extra').value;
   const prepared=prepareOpeningBranch(base.moves,ply,raw,mode);
   if(entries().some(x=>validateOpeningLine(x.moves).sans.join(' ')===prepared.moves))throw Error('La variante ya está guardada. Buscala en el árbol del estudio.');
   branchPreview={baseId:base.id,ply,mode,raw,prepared};
   el('opening-lab-add').disabled=false;
   el('opening-lab-branch-feedback').textContent='✓ Variante legal: '+prepared.added.length+' medias jugadas desde esta posición. '+prepared.added.slice(0,12).join(' ')+(prepared.added.length>12?'…':'')+'. Ya podés guardarla.';
  }catch(e){
   invalidateBranchPreview('No se pudo validar: '+e.message);
  }
 };
 el('opening-lab-branch-check').onclick=checkBranch;
 el('opening-lab-branch-mode').onchange=e=>{
  const help=el('opening-lab-notation-help');
  if(e.target.value==='pgn'){
   el('opening-lab-extra').placeholder='[Event "Estudio"]\\n1. e4 c5 2. Nf3 …';
   help.textContent='El PGN debe incluir las jugadas desde el inicio hasta la posición seleccionada, y después la variante.';
  }else if(e.target.value==='san-es'){
   el('opening-lab-extra').placeholder='8... Ae7 9. Dd2 O-O';
   help.textContent='En español: C=caballo, A=alfil, T=torre, D=dama, R=rey. Convertiremos las letras al guardar.';
  }else{
   el('opening-lab-extra').placeholder='8... Be7 9. Qd2 O-O';
   help.textContent='SAN internacional: N=caballo, B=alfil, R=torre, Q=dama, K=rey. Ejemplo: Be7 Qd2 O-O.';
  }
  invalidateBranchPreview('Método cambiado. Revisá nuevamente las jugadas.');
 };
 el('opening-lab-extra').oninput=()=>invalidateBranchPreview('El texto cambió. Revisá nuevamente la nueva variante.');
 el('opening-lab-branch-file').onchange=async()=>{
  const input=el('opening-lab-branch-file'),file=input.files?.[0];
  if(!file)return;
  try{
   if(file.size>250000)throw Error('Archivo demasiado grande (máximo 250 KB).');
   el('opening-lab-branch-mode').value='pgn';
   el('opening-lab-extra').value=await file.text();
   invalidateBranchPreview('PGN cargado. Seleccioná Revisar jugadas y después Guardar rama vinculada.');
  }catch(e){invalidateBranchPreview(e.message);}finally{input.value='';}
 };
 el('opening-lab-add').onclick=()=>{
  try{
   const pending=branchPreview;
   if(!pending)throw Error('Primero revisá la variante.');
   if(!activeIsCorrect()||selected!==pending.baseId||currentPly()!==pending.ply||
      el('opening-lab-extra').value!==pending.raw||el('opening-lab-branch-mode').value!==pending.mode)
     throw Error('La posición o las jugadas cambiaron. Revisá la variante nuevamente.');
   const base=pick();saveLinkedBranch(base,pending.ply,pending.prepared,{method:pending.mode});
   el('opening-lab-extra').value='';
   invalidateBranchPreview('Rama guardada y vinculada a su estudio.');
  }catch(e){invalidateBranchPreview('No se pudo guardar: '+e.message);notify(e.message,'err');}
 };

 function addEngineVariation(moves,explanation=''){
   if(!visible||!activeIsCorrect()){notify('Abrí primero el estudio y elegí una posición.','err');return false;}
   try{
     const base=pick(),ply=currentPly(),rootFen=validateOpeningLine(base.moves).fens[ply];
     const engineFen=window.IB_LIVE?.snapshot?.()?.fen;
     if(engineFen!==rootFen)throw Error('La variante del motor pertenece a otra posición. Seleccioná la posición y volvé a calcular.');
     const raw=Array.isArray(moves)?moves.join(' '):String(moves||'');
     const prepared=prepareOpeningBranch(base.moves,ply,raw,'san');
     saveLinkedBranch(base,ply,prepared,{name:'Stockfish en directo · '+prepared.added.slice(0,3).join(' '),
       method:'engine-live',research:'Variante tomada de Stockfish en directo, sin aprobación editorial. '+String(explanation||'').slice(0,850)});
     return true;
   }catch(e){notify('No se pudo guardar la PV: '+e.message,'err');return false;}
 }
 function downloadPgn(text,filename){
  const blob=new Blob([text],{type:'application/x-chess-pgn;charset=utf-8'});
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(url),3000);
 }
 el('opening-lab-backup-download').onclick=()=>{
  try{
    const body=JSON.stringify(buildOpeningBackup(data),null,2);
    downloadPgn(body,'IB_Biblioteca_Maestra_Respaldo_'+new Date().toISOString().slice(0,10)+'.json');
    notify('Respaldo completo descargado; contiene los datos personales que escribiste en tus comentarios y fuentes.');
  }catch(e){notify('No se pudo exportar el respaldo: '+e.message,'err');}
 };
 el('opening-lab-backup-import').onclick=()=>el('opening-lab-backup-file').click();
 el('opening-lab-backup-file').onchange=async()=>{
  const input=el('opening-lab-backup-file'),file=input.files?.[0];
  if(!file)return;
  try{
    if(file.size>5_000_000)throw Error('El archivo supera el límite de 5 MB.');
    const imported=validateOpeningBackup(JSON.parse(await file.text()));
    if(!window.confirm('Esta acción REEMPLAZARÁ los borradores, variantes y análisis locales del laboratorio. Exportá un respaldo antes de continuar. ¿Importar '+imported.custom.length+' variantes propias?'))return;
    Object.assign(data,imported);
    persist();render();notify('Respaldo de investigación restaurado. El contenido permanece sin aprobar.');
  }catch(e){notify('No se pudo importar el respaldo: '+e.message,'err');}
  finally{input.value='';}
 };
 el('opening-lab-export-family').onclick=()=>{
  try{
    const draft=pick(),collection=entries().filter(x=>x.family===draft.family);
    const output=collection.map(makePgn).join('\n\n');
    downloadPgn(output,'IB_Aperturas_Familia_'+draft.family.replace(/[^a-zA-Z0-9]+/g,'_')+'.pgn');
    notify(collection.length+' líneas exportadas como capítulos PGN independientes. Revisión pendiente.');
  }catch(e){notify(e.message,'err');}
 };
 el('opening-lab-export').onclick=()=>{
  try{
   downloadPgn(makePgn(pick()),'IB_Apertura_'+selected+'.pgn');
  }catch(e){notify(e.message,'err');}
 };
 function open(){
  visible=true;
  panel.hidden=false;explorer.hidden=false;
  const main=document.querySelector('main.main');
  main.classList.add('opening-study-mode');
  document.querySelector('.layout').hidden=false;
  document.querySelector('.toolbar').hidden=true;
  const tools=document.querySelector('.workspace-tools');if(tools)tools.hidden=true;
  const paste=document.querySelector('#paste-pgn-panel');if(paste)paste.hidden=true;
  document.querySelector('.topbar h1').textContent='Biblioteca Maestra · Estudio individual';
  document.querySelector('.topbar p').textContent='Investigá un capítulo por vez con tu tablero, variantes de Stockfish, fuentes y comentarios propios.';
  document.querySelector('#nav-openings')?.classList.add('active');
  document.querySelector('#nav-review')?.classList.remove('active');
  document.querySelector('#nav-library')?.classList.remove('active');
  render();
  document.title=(pick()?.name||'Biblioteca Maestra')+' · IB Chess Analyzer';
  if(!activeIsCorrect())openAt(0);
  window.IB_LIVE?.positionChanged(true);
  window.scrollTo?.(0,0);
 }
 function close(){
  if(!visible)return;
  visible=false;panel.hidden=true;explorer.hidden=true;
  document.querySelector('main.main')?.classList.remove('opening-study-mode');
  document.querySelector('#nav-openings')?.classList.remove('active');
 }
 window.addEventListener('storage',event=>{
  if(event.key!==KEY)return;
  const refreshed=safeLoad();
  Object.assign(data,refreshed);
  if(visible)render();
 });
 render();
 return {open,close,isOpen:()=>visible,addEngineVariation,
  positionChanged(){if(visible){invalidateBranchPreview('Cambió la posición de origen. Revisá la variante antes de guardarla.');render();}},
  refresh:render,selectStudy:(id,options)=>switchStudy(id,{push:false,...options}),getCurrentStudy:()=>selected,getCurrentTitle:()=>pick()?.name||'Biblioteca Maestra'};
}
