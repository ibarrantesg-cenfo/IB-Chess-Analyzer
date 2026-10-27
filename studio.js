import { initVariationBoard } from './variation-board.js';
import { Chess } from 'chess.js';

// Local-first study tools. Persistent on this browser only; no remote sharing is implied.
const DB='ib-chess-studies-v1', STORE='studies';
const openDB=()=>new Promise((resolve,reject)=>{const req=indexedDB.open(DB,1);req.onupgradeneeded=()=>req.result.createObjectStore(STORE,{keyPath:'id'});req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);});
async function transaction(mode,fn){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,mode);const req=fn(tx.objectStore(STORE));req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);tx.oncomplete=()=>db.close();tx.onerror=()=>reject(tx.error);});}
const getAll=()=>transaction('readonly',s=>s.getAll());
const put=x=>transaction('readwrite',s=>s.put(x));
const del=id=>transaction('readwrite',s=>s.delete(id));
const el=id=>document.getElementById(id);
let active=null, selected=null, paint=false, palette='wP', alternate=null, onChange=()=>{}, notify=()=>{};
let timer=null, tree=null;
function key(){return active?.id;}
function saveSoon(){clearTimeout(timer);timer=setTimeout(()=>{if(active)put(active).catch(e=>notify('No se pudo guardar: '+e.message,'err'));},250);}
function labelMove(ply,san){return (ply%2===1?Math.ceil(ply/2)+'.':Math.ceil(ply/2)+'...')+san;}
function activeNote(ply){return active?.comments?.[ply]||'';}
function renderNotes(){const ply=selected?.move||0;el('studio-note-title').textContent=ply?('Comentario de '+labelMove(ply,selected.game.moves[ply-1]?.san||'')):'Comentario de la posición inicial';el('studio-note').value=activeNote(ply);const items=(active?.variations||[]).filter(v=>v.ply===ply);el('studio-variants').innerHTML=items.length?items.map(v=>'<div class="studio-variant"><button data-line="'+v.id+'">'+v.san.join(' ')+'</button><button aria-label="Eliminar variante" data-delete-line="'+v.id+'">×</button></div>').join(''):'<small>No hay variantes aquí.</small>';el('studio-save-status').textContent=active?'Guardado automático local':'Sin estudio guardado';}
function loadFromGame(){if(!selected?.game)return;active={id:crypto.randomUUID(),name:(selected.game.headers.White||'Blancas')+' – '+(selected.game.headers.Black||'Negras'),student:el('studio-student').value.trim()||'Sin alumno',pgn:selected.game.pgn,comments:{},variations:[],created:new Date().toISOString(),updated:new Date().toISOString()};renderNotes();}
function ensure(){if(!active)loadFromGame();return active;}
function change(){ensure().updated=new Date().toISOString();saveSoon();el('studio-save-status').textContent='Guardando en este navegador…';}
function commentAt(ply){if(!active)loadFromGame();el('studio-comment-panel').hidden=false;el('studio-comment-panel').classList.add('contextual');renderNotes();el('studio-note').focus();}
function lineFromInput(){const text=el('studio-line-input').value.trim();if(!text)return;const base=selected.positions[selected.move],c=new Chess(base),sans=[];try{for(const token of text.replace(/\d+\.(\.\.)?/g,' ').split(/\s+/).filter(Boolean)){if(['*','1-0','0-1','1/2-1/2'].includes(token))break;const move=c.move(token);if(!move)throw Error('Jugada ilegal: '+token);sans.push(move.san);}if(!sans.length)throw Error('No se encontraron jugadas');ensure().variations.push({id:crypto.randomUUID(),ply:selected.move,san:sans,fen:c.fen()});el('studio-line-input').value='';change();renderNotes();notify('Variante agregada a esta posición.');}catch(e){notify('Variante inválida: '+e.message,'err');}}
function choosePalette(x){palette=x;document.querySelectorAll('[data-piece]').forEach(b=>b.classList.toggle('picked',b.dataset.piece===x));}
function paintSquare(square){const fen=selected.positions[selected.move];const c=new Chess(fen);try{if(palette==='empty')c.remove(square);else {const side=palette[0],piece=palette[1].toLowerCase();c.remove(square);if(!c.put({type:piece,color:side},square))throw Error('Casilla no válida');}const next=c.fen();el('studio-fen').value=next;selected.positions[selected.move]=next;onChange();}catch(e){notify('Posición no válida: '+e.message,'err');}}
// Board editor only edits an isolated position until it is exported; original PGN mainline is untouched.
function insertBoardAction(){const board=el('board');board.addEventListener('click',e=>{if(!paint)return;const square=e.target.closest('.square')?.title;if(square)paintSquare(square);});}
async function refreshLibrary(){try{const rows=await getAll();rows.sort((a,b)=>b.updated.localeCompare(a.updated));el('studio-library').innerHTML='<option value="">Abrir estudio guardado…</option>'+rows.map(x=>'<option value="'+x.id+'">'+(x.student+' | '+x.name).replace(/[&<>"']/g,'')+'</option>').join('');}catch(e){notify('Almacenamiento local no disponible: '+e.message,'err');}}
function exportStudy(){if(!active)return notify('Primero guardá un estudio.','err');const blob=new Blob([JSON.stringify(active,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='IB_Estudio_'+active.student.replace(/[^a-z0-9_-]/gi,'_')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function initStudio(state,callbacks){selected=state;onChange=callbacks.render;notify=callbacks.notify;
 const parent=document.querySelector('.analysis-column');
 const panel=document.createElement('div');panel.className='panel studio-panel';panel.innerHTML=`
  <div class="panel-heading"><div><div class="eyebrow">IB CHESS ACADEMY · ESTUDIOS</div><h2>Editor y biblioteca</h2></div><span class="small-pill">LOCAL</span></div>
  <div class="studio-grid"><label>Alumno <input id="studio-student" placeholder="Nombre del alumno" autocomplete="off"/></label><label>Estudio guardado<select id="studio-library"><option value="">Abrir estudio guardado…</option></select></label></div>
  <div class="studio-actions"><button class="btn primary" id="studio-save">Guardar partida y notas</button><button class="btn outline" id="studio-export">Exportar estudio</button><label class="btn outline studio-import">Importar copia JSON<input hidden type="file" id="studio-import-json" accept=".json,application/json"/></label><button class="btn outline" id="studio-delete">Eliminar</button></div>
  <small id="studio-save-status">La biblioteca se guarda solo en este navegador. No se sincroniza entre dispositivos.</small>
  <div id="studio-comment-panel"><button type="button" id="studio-close-note" class="studio-close" aria-label="Cerrar editor">×</button><div class="studio-subtitle" id="studio-note-title">Comentario de posición</div><textarea id="studio-note" rows="3" placeholder="Escribí tus conclusiones, ideas o tareas de entrenamiento…"></textarea><div class="studio-subtitle">Agregar variante desde esta posición (SAN)</div><div class="studio-actions"><input id="studio-line-input" placeholder="Ej.: Cf3 d5 g3"/><button class="btn subtle" id="studio-add-line">Añadir variante</button></div><div id="studio-variants"></div></div>
  <details class="studio-editor"><summary>Editar posición del tablero</summary><p>Activá el editor, elegí una pieza y hacé clic en una casilla. Se edita una copia visual de la posición; no la partida original.</p><div class="studio-palette" id="studio-palette"></div><label class="studio-edit-check"><input type="checkbox" id="studio-paint"/> Activar edición por casillas</label><label>FEN editado <input id="studio-fen" readonly/></label><button class="btn outline" id="studio-copy-fen">Copiar FEN</button></details>
  <p class="studio-disclaimer">Clic derecho en una jugada: abrir su comentario. Los estudios compartidos requieren cuentas y base de datos; aún no están activados.</p>`;
 parent.append(panel);
 const pieces=[['wK','♔'],['wQ','♕'],['wR','♖'],['wB','♗'],['wN','♘'],['wP','♙'],['bK','♚'],['bQ','♛'],['bR','♜'],['bB','♝'],['bN','♞'],['bP','♟'],['empty','⌫']];
 el('studio-palette').innerHTML=pieces.map(([p,g])=>'<button type="button" title="'+p+'" data-piece="'+p+'">'+g+'</button>').join('');
 el('studio-palette').addEventListener('click',e=>{const p=e.target.closest('[data-piece]');if(p)choosePalette(p.dataset.piece);});
 choosePalette('wP');insertBoardAction();
 el('studio-paint').onchange=e=>{paint=e.target.checked;};
 el('studio-copy-fen').onclick=()=>navigator.clipboard.writeText(el('studio-fen').value);
 el('studio-note').oninput=e=>{ensure().comments[selected.move]=e.target.value;change();};
 el('studio-add-line').onclick=lineFromInput;
 el('studio-close-note').onclick=()=>el('studio-comment-panel').classList.remove('contextual');
 document.addEventListener('keydown',e=>{if(e.key==='Escape')el('studio-comment-panel').classList.remove('contextual');});
 el('studio-variants').onclick=e=>{const remove=e.target.closest('[data-delete-line]');if(remove){active.variations=active.variations.filter(v=>v.id!==remove.dataset.deleteLine);change();renderNotes();return;}const play=e.target.closest('[data-line]');if(play){const v=active.variations.find(x=>x.id===play.dataset.line);if(v)tree?.open(v);}};
 el('studio-save').onclick=async()=>{ensure().student=el('studio-student').value.trim()||'Sin alumno';change();await put(active);await refreshLibrary();notify('Estudio guardado en este navegador.');};
 el('studio-export').onclick=exportStudy;
 el('studio-import-json').onchange=async e=>{
   const file=e.target.files?.[0];if(!file)return;
   try {
     const obj=JSON.parse(await file.text());
     if(!obj || typeof obj.pgn!=='string' || typeof obj.comments!=='object' || !Array.isArray(obj.variations))throw Error('El archivo no corresponde a un estudio válido.');
     if(obj.pgn.length>3_000_000)throw Error('Archivo demasiado grande.');
     const verify=new Chess();verify.loadPgn(obj.pgn,{strict:false});
     if(!verify.history().length)throw Error('El estudio no contiene una partida.');
     const restored={id:crypto.randomUUID(),name:String(obj.name||'Estudio importado').slice(0,150),student:String(obj.student||'Sin alumno').slice(0,100),pgn:verify.pgn(),comments:Object.fromEntries(Object.entries(obj.comments).filter(([k,v])=>/^\\d+$/.test(k)&&typeof v==='string').map(([k,v])=>[k,v.slice(0,20000)])),variations:obj.variations.filter(v=>Number.isInteger(v.ply)&&Array.isArray(v.san)&&v.san.every(x=>typeof x==='string')).map(v=>({id:crypto.randomUUID(),ply:v.ply,san:v.san.slice(0,200),fen:''})),created:new Date().toISOString(),updated:new Date().toISOString()};
     await put(restored);callbacks.loadPGN(restored.pgn,'copia JSON');active=restored;el('studio-student').value=restored.student;await refreshLibrary();renderNotes();notify('Copia importada y guardada.');
   } catch(err){notify('No se pudo importar: '+err.message,'err');}
   e.target.value='';
 };

 el('studio-delete').onclick=async()=>{if(!active)return;if(!confirm('¿Eliminar este estudio guardado?'))return;await del(active.id);active=null;renderNotes();await refreshLibrary();};
 el('studio-library').onchange=async e=>{if(!e.target.value)return;const item=await transaction('readonly',s=>s.get(e.target.value));if(!item)return;callbacks.loadPGN(item.pgn,'estudio guardado');active=item;el('studio-student').value=item.student;renderNotes();};
 document.querySelector('#move-list').addEventListener('contextmenu',e=>{const b=e.target.closest('[data-ply]');if(!b)return;e.preventDefault();callbacks.jump(Number(b.dataset.ply));commentAt(Number(b.dataset.ply));});
 el('studio-comment-panel').hidden=false;
 tree=initVariationBoard(selected,{render:callbacks.renderPreview,notify,isEditing:()=>paint,save:v=>{ensure();const i=active.variations.findIndex(x=>x.id===v.id);if(i>=0)active.variations[i]=v;else active.variations.push(v);change();renderNotes();}});
 refreshLibrary();renderNotes();
 return {gameChanged(){active=null;paint=false;tree?.clear();el('studio-paint').checked=false;renderNotes();},selectionChanged(){tree?.restoreMain();if(el('studio-note')!==document.activeElement)renderNotes();el('studio-fen').value=selected.positions[selected.move]||'';}}
}
