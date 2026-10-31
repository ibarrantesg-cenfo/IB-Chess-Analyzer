import { Chess } from 'chess.js';
import { OPENING_RESEARCH_DRAFTS } from './opening-research-data.js';

// Local-only opening research. Engine evidence NEVER promotes a chapter to verified content.
const KEY='ib-opening-research-v1';
const el=id=>document.getElementById(id);
function safeLoad(){
 try{const raw=JSON.parse(localStorage.getItem(KEY)||'{}');return {custom:Array.isArray(raw.custom)?raw.custom:[],notes:raw.notes&&typeof raw.notes==='object'?raw.notes:{},evidence:raw.evidence&&typeof raw.evidence==='object'?raw.evidence:{}};}
 catch{return {custom:[],notes:{},evidence:{}};}
}
const mk=(tag,text='',className='')=>{const x=document.createElement(tag);x.textContent=text;if(className)x.className=className;return x;};
function sanTokens(text){
 return String(text||'').replace(/\{[^}]*\}/g,' ').replace(/\d+\.(?:\.\.)?/g,' ').replace(/(?:1-0|0-1|1\/2-1\/2|\*)/g,' ').trim().split(/\s+/).filter(Boolean);
}
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
  <div class="opening-lab-actions"><button class="btn primary" id="opening-lab-open">Abrir variante en Game Review</button><button class="btn outline" id="opening-lab-export">Exportar PGN anotado</button></div>
  <div id="opening-lab-line" class="opening-lab-moves"></div>
  <p id="opening-lab-position" class="opening-lab-muted">Elegí una línea para comenzar.</p>
  <label class="opening-lab-field">Comentario editorial de la posición<textarea id="opening-lab-note" rows="4" placeholder="Qué cambia en la evaluación, qué amenaza el rival, planes con justificación..."></textarea></label>
  <div class="opening-lab-actions"><button class="btn outline" id="opening-lab-save-note">Guardar comentario local</button><button class="btn outline" id="opening-lab-capture">Guardar evaluación Stockfish</button></div>
  <div id="opening-lab-evidence" class="opening-lab-evidence">Sin evaluación guardada.</div>
  <label class="opening-lab-field">Nueva continuación desde la jugada seleccionada (SAN)<input id="opening-lab-extra" placeholder="Ej.: 11. g4 b5 12. g5"></label>
  <div class="opening-lab-actions"><button class="btn outline" id="opening-lab-add">Añadir variante propia</button><button class="btn outline" id="opening-lab-refresh">Actualizar estado</button></div>
  <p id="opening-lab-status" role="status" aria-live="polite" class="opening-lab-muted"></p>
  <a id="opening-lab-reference" target="_blank" rel="noopener noreferrer">Abrir referencia de clasificación</a>
 </div>`;
 host.append(panel);
 const data=safeLoad();
 const persist=()=>{try{localStorage.setItem(KEY,JSON.stringify(data));}catch{notify('No se pudo guardar el laboratorio en este navegador. Exportá el PGN para conservarlo.','err');}};
 const entries=()=>[...OPENING_RESEARCH_DRAFTS,...data.custom];
 let selected=OPENING_RESEARCH_DRAFTS[0]?.id;
 const pick=()=>entries().find(x=>x.id===selected);
 function currentPly(){
  return state.game?.headers?.ResearchID===selected?state.move:0;
 }
 function makePgn(draft){
  const {sans}=validateOpeningLine(draft.moves);
  const c=new Chess();
  c.header('Event','IB Chess Academy - laboratorio sin publicar','White','Plan blanco','Black','Plan negro','Result','*','ECO',draft.eco||'?','ResearchID',draft.id,'StudyStatus','BORRADOR - REVISION PENDIENTE');
  for(let ply=1;ply<=sans.length;ply++){
    c.move(sans[ply-1]);
    const note=data.notes[draft.id+'|'+ply]??draft.notes?.[ply];
    if(note)c.setComment(String(note));
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
  el('opening-lab-position').textContent=(activeIsCorrect()?'Posición '+ply+'/'+sans.length:'Variante aún no abierta')+' · FEN: '+fens[ply];
  el('opening-lab-note').value=data.notes[key]??draft.notes?.[ply]??'';
  const stored=data.evidence[key],evidence=el('opening-lab-evidence');evidence.replaceChildren();
  if(stored?.fen===fens[ply]){
   evidence.append(mk('strong','Stockfish 19 Lite · profundidad '+stored.depth+' · '+new Date(stored.capturedAt).toLocaleString('es-CR')));
   for(const line of stored.lines)evidence.append(mk('p','#'+line.rank+' · '+line.score+' · d'+line.depth+' · '+line.san));
   evidence.append(mk('small','Esta captura documenta resultados del motor en una posición concreta; no certifica explicaciones estratégicas.'));
  }else evidence.textContent='Sin evaluación MultiPV guardada para esta posición. Abrí la línea y esperá a que Stockfish complete el cálculo.';
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
 el('opening-lab-capture').onclick=()=>{
  if(!activeIsCorrect()||state.busy)return notify('Seleccioná una posición de la variante y terminá primero Game Review.','err');
  const snap=getLiveSnapshot();
  if(!snap||snap.fen!==state.positions[state.move])return notify('El motor aún no corresponde a esta posición. Esperá el análisis en directo.','err');
  if(!snap.complete||snap.depth<16||snap.lines.length<2)return notify('Esperá a que Stockfish termine con al menos dos variantes y profundidad 16.','err');
  data.evidence[selected+'|'+currentPly()]={...snap,capturedAt:new Date().toISOString()};
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
 el('opening-lab-export').onclick=()=>{
  try{
   const text=makePgn(pick()),blob=new Blob([text],{type:'application/x-chess-pgn;charset=utf-8'});
   const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='IB_Apertura_'+selected+'.pgn';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }catch(e){notify(e.message,'err');}
 };
 // Deferred refresh avoids heavy render from every engine message.
 panel.addEventListener('toggle',()=>{if(panel.open)render();});
 render();
 return {open(){panel.open=true;render();panel.scrollIntoView({behavior:'smooth',block:'start'});},refresh:render};
}
