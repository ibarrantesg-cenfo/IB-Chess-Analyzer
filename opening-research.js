import { Chess } from 'chess.js';
import { OPENING_RESEARCH_DRAFTS } from './opening-research-data.js';
import { OPENING_RESEARCH_EXPANSION } from './opening-research-more.js';
import { queryMastersPosition } from './opening-masters.js';
import { extendLegalLine,readSanTokens,researchChecklist,cleanSnapshot } from './opening-research-tools.js';
import { buildOpeningBackup, validateOpeningBackup } from './opening-research-backup.js';
import { compareOpeningEvidence } from './opening-evidence-comparison.js';

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
 const panel=document.createElement('details');panel.className='panel opening-lab-panel';panel.id='opening-lab';
 panel.innerHTML=`<summary><strong>Biblioteca Maestra · Laboratorio de aperturas</strong><small>Variantes, Stockfish MultiPV y comentarios en borrador · solo local</small></summary>
 <div class="opening-lab-body">
  <p class="opening-lab-warning">Investigación experimental: las líneas se validan legalmente, pero sus comentarios y evaluaciones NO son teoría aprobada. Nada se publica ni se comparte automáticamente con alumnos.</p>
  <label class="opening-lab-field">Familia y variante<select id="opening-lab-choice"></select></label>
  <p id="opening-lab-aim" class="opening-lab-muted"></p>
  <div class="opening-lab-actions"><button class="btn primary" id="opening-lab-open">Abrir variante en Game Review</button><button class="btn outline" id="opening-lab-export">Exportar PGN anotado</button><button class="btn outline" id="opening-lab-export-family">Exportar familia completa</button></div>
  <div class="opening-lab-backup"><strong>Respaldo de la investigación</strong><p class="opening-lab-muted">Guardá ramas, comentarios, evaluaciones y estadísticas en un archivo JSON para no perderlas al cambiar de navegador.</p><div class="opening-lab-actions"><button class="btn outline" id="opening-lab-backup-download">Exportar respaldo completo</button><button class="btn outline" id="opening-lab-backup-import">Importar respaldo JSON</button><input type="file" accept=".json,application/json" id="opening-lab-backup-file" hidden></div></div>
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
  <label class="opening-lab-field">Nueva continuación desde la jugada seleccionada (SAN)<input id="opening-lab-extra" placeholder="Ej.: 11. g4 b5 12. g5"></label>
  <div class="opening-lab-actions"><button class="btn outline" id="opening-lab-add">Añadir variante propia</button><button class="btn outline" id="opening-lab-refresh">Actualizar estado</button></div>
  <p id="opening-lab-status" role="status" aria-live="polite" class="opening-lab-muted"></p>
  <a id="opening-lab-reference" target="_blank" rel="noopener noreferrer">Abrir referencia de clasificación</a>
 </div>`;
 host.append(panel);
 const data=safeLoad();
 const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(data));}catch{notify('No se pudo guardar el laboratorio en este navegador. Exportá el PGN para conservarlo.','err');}};
 const entries=()=>[...OPENING_RESEARCH_DRAFTS,...OPENING_RESEARCH_EXPANSION,...data.custom].sort((a,b)=>a.family.localeCompare(b.family,'es')||a.name.localeCompare(b.name,'es'));
 let selected=OPENING_RESEARCH_DRAFTS[0]?.id;
 const pick=()=>entries().find(x=>x.id===selected);
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
 function activeIsCorrect(){return state.game?.headers?.ResearchID===selected;}
 function render(){
  const draft=pick();if(!draft)return;
  renderChoices();
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
    open.onclick=()=>{selected=other.id;openAt(common+1);};
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
   showReview();
   if(!activeIsCorrect())loadPGN(makePgn(draft),'Laboratorio · '+draft.name);
   if(!activeIsCorrect())throw Error('Game Review no cargó la variante. Comprobá el PGN.');
   jump(Math.max(0,Math.min(ply,sans.length)));
   panel.open=true;render();
  }catch(e){notify('No se pudo abrir la línea: '+e.message,'err');}
 }
 el('opening-lab-choice').onchange=e=>{selected=e.target.value;render();};
 el('opening-lab-open').onclick=()=>{const {sans}=validateOpeningLine(pick().moves);openAt(sans.length);};
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
  selected=next.id;openAt(next.ply);
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
    if(entries().some(x=>validateOpeningLine(x.moves).sans.join(' ')==line.moves))throw Error('Esta línea ya existe en el laboratorio.');
    const id='pv-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
    data.custom.push({id,eco:base.eco,family:base.family,
      name:'Stockfish PV #'+rank+' · d'+candidate.depth+' · '+line.added.slice(0,3).join(' '),
      moves:line.moves,notes:{},research:'Candidata calculada por '+snapshot.engine+' a profundidad '+candidate.depth+' con evaluación '+candidate.score+' desde la perspectiva blanca. No contrastada con partidas modelo.',
      reference:base.reference,origin:{type:'engine-pv',parent:base.id,parentPly:ply,rootFen:fen,rank,depth:candidate.depth,score:candidate.score}});
    persist();selected=id;render();openAt(ply+line.added.length);
    notify('Variante PV #'+rank+' incorporada como borrador. No es teoría aprobada.');
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
 el('opening-lab-add').onclick=()=>{
  if(!activeIsCorrect())return notify('Abrí la variante base antes de introducir una bifurcación.','err');
  const base=pick(),prefix=validateOpeningLine(base.moves).sans.slice(0,currentPly());
  const additional=sanTokens(el('opening-lab-extra').value);
  if(!additional.length)return notify('Ingresá la nueva continuación en notación algebraica SAN.','err');
  try{
   const line=validateOpeningLine([...prefix,...additional].join(' ')).sans;
   if(entries().some(x=>validateOpeningLine(x.moves).sans.join(' ')===line.join(' ')))throw Error('Ya existe una variante idéntica.');
   const id='user-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8);
   const branch={id,eco:base.eco,family:base.family,name:'Variante propia · '+additional.slice(0,4).join(' '),moves:line.join(' '),notes:{},research:'Bifurcación de usuario, sin evaluación ni publicación.',reference:base.reference};
   data.custom.push(branch);persist();selected=id;el('opening-lab-extra').value='';render();openAt(line.length);
   notify('Variante legal agregada como borrador local. Validala con Stockfish.');
  }catch(e){notify('No se pudo crear la variante: '+e.message,'err');}
 };
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
 // Deferred refresh avoids heavy render from every engine message.
 panel.addEventListener('toggle',()=>{if(panel.open)render();});
 render();
 return {open(){panel.open=true;render();panel.scrollIntoView({behavior:'smooth',block:'start'});},refresh:render};
}
