import { cloudAvailable,getCloudSession,emailLogin,cloudLogout,cloudSave,cloudList,cloudOpen,cloudShare,cloudReviewCopy,accountDetails,saveAccountName,shareWithTeacher } from './cloud.js';
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
let timer=null, tree=null,cloudSource=null;
function key(){return active?.id;}
function saveSoon(){clearTimeout(timer);const snapshot=active?structuredClone(active):null;timer=setTimeout(()=>{if(snapshot)put(snapshot).then(()=>{if(active?.id===snapshot.id)el('studio-save-status').textContent='Guardado localmente';}).catch(e=>notify('No se pudo guardar: '+e.message,'err'));},300);}
function labelMove(ply,san){return (ply%2===1?Math.ceil(ply/2)+'.':Math.ceil(ply/2)+'...')+san;}
function activeNote(ply){return active?.comments?.[ply]||'';}
function renderDiagrams(){
  const root=el('studio-diagrams');if(!root)return;
  root.replaceChildren();
  for(const d of active?.diagrams||[]){
    const entry=document.createElement('div');entry.className='studio-diagram';
    const button=document.createElement('button');button.type='button';button.textContent=d.title||'Diagrama';button.onclick=()=>{selected.previewFen=d.fen;el('studio-fen').value=d.fen;el('studio-turn').value=d.fen.split(' ')[1];onChange();};
    const remove=document.createElement('button');remove.type='button';remove.textContent='×';remove.title='Borrar diagrama';remove.onclick=()=>{active.diagrams=active.diagrams.filter(x=>x.id!==d.id);change();renderDiagrams();};
    entry.append(button,remove);root.append(entry);
  }
}
function renderNotes(){const ply=selected?.move||0;el('studio-note-title').textContent=ply?('Comentario de '+labelMove(ply,selected.game.moves[ply-1]?.san||'')):'Comentario de la posición inicial';el('studio-note').value=activeNote(ply);const items=(active?.variations||[]).filter(v=>v.ply===ply);el('studio-variants').innerHTML=items.length?items.map(v=>'<div class="studio-variant"><button data-line="'+v.id+'">'+v.san.join(' ')+'</button><button aria-label="Eliminar variante" data-delete-line="'+v.id+'">×</button></div>').join(''):'<small>No hay variantes aquí.</small>';el('studio-save-status').textContent=active?'Guardado automático local':'Sin estudio guardado';renderDiagrams();}
function loadFromGame(){if(!selected?.game)return;active={id:crypto.randomUUID(),name:(selected.game.headers.White||'Blancas')+' – '+(selected.game.headers.Black||'Negras'),student:el('studio-student').value.trim()||'Sin alumno',pgn:selected.game.pgn,comments:{},variations:[],diagrams:[],created:new Date().toISOString(),updated:new Date().toISOString()};renderNotes();}
function ensure(){if(!active)loadFromGame();return active;}
function change(){ensure().updated=new Date().toISOString();saveSoon();el('studio-save-status').textContent='Guardando en este navegador…';}
function commentAt(ply){if(!active)loadFromGame();el('studio-comment-panel').hidden=false;el('studio-comment-panel').classList.add('contextual');renderNotes();el('studio-note').focus();}
function lineFromInput(){const text=el('studio-line-input').value.trim();if(!text)return;const base=selected.positions[selected.move],c=new Chess(base),sans=[];try{for(const token of text.replace(/\d+\.(\.\.)?/g,' ').split(/\s+/).filter(Boolean)){if(['*','1-0','0-1','1/2-1/2'].includes(token))break;const move=c.move(token);if(!move)throw Error('Jugada ilegal: '+token);sans.push(move.san);}if(!sans.length)throw Error('No se encontraron jugadas');ensure().variations.push({id:crypto.randomUUID(),ply:selected.move,san:sans,fen:c.fen()});el('studio-line-input').value='';change();renderNotes();notify('Variante agregada a esta posición.');}catch(e){notify('Variante inválida: '+e.message,'err');}}
function choosePalette(x){palette=x;document.querySelectorAll('[data-piece]').forEach(b=>b.classList.toggle('picked',b.dataset.piece===x));}
function paintSquare(square){const fen=selected.previewFen||selected.positions[selected.move];const c=new Chess(fen);try{if(palette==='empty')c.remove(square);else {const side=palette[0],piece=palette[1].toLowerCase();c.remove(square);if(!c.put({type:piece,color:side},square))throw Error('Casilla no válida');}const next=c.fen();el('studio-fen').value=next;selected.previewFen=next;el('studio-turn').value=c.turn();callbacks.renderPreview();}catch(e){notify('Posición no válida: '+e.message,'err');}}
// Board editor only edits an isolated position until it is exported; original PGN mainline is untouched.
function insertBoardAction(){const board=el('board');board.addEventListener('click',e=>{if(!paint)return;const square=e.target.closest('.square')?.title;if(square)paintSquare(square);});}
async function refreshLibrary(){try{
const rows=await getAll();rows.sort((a,b)=>String(b.updated).localeCompare(String(a.updated)));
const safe=x=>String(x||'').replace(/[&<>"']/g,'');
el('studio-library').innerHTML='<option value="">Abrir estudio guardado…</option>'+rows.map(x=>'<option value="'+safe(x.id)+'">'+safe(x.student+' | '+x.name)+'</option>').join('');
const term=(el('studio-search')?.value||'').trim().toLocaleLowerCase();
const filtered=rows.filter(x=>(x.student+' '+x.name).toLocaleLowerCase().includes(term));
const students=new Set(rows.map(x=>String(x.student||'Sin alumno').toLocaleLowerCase()));
el('studio-library-summary').textContent=rows.length+' estudios locales · '+students.size+' alumnos'+(term?' · '+filtered.length+' resultados':'');
el('studio-results').innerHTML=filtered.slice(0,40).map(x=>'<button type="button" class="studio-result" data-open-study="'+safe(x.id)+'"><strong>'+safe(x.name)+'</strong><small>'+safe(x.student)+' · '+safe(new Date(x.updated).toLocaleDateString('es-CR'))+'</small></button>').join('')||'<small>No hay estudios coincidentes.</small>';
}catch(e){notify('Almacenamiento local no disponible: '+e.message,'err');}}
function exportStudy(){if(!active)return notify('Primero guardá un estudio.','err');const blob=new Blob([JSON.stringify(active,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='IB_Estudio_'+active.student.replace(/[^a-z0-9_-]/gi,'_')+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function initStudio(state,callbacks){selected=state;onChange=callbacks.render;notify=callbacks.notify;
 const parent=document.querySelector('.analysis-column');
 const panel=document.createElement('div');panel.className='panel studio-panel';panel.innerHTML=`
  <div class="panel-heading"><div><div class="eyebrow">IB CHESS ACADEMY · ESTUDIOS</div><h2>Estudio actual</h2></div><span class="small-pill">LOCAL</span></div>
  <div class="studio-grid"><label>Alumno <input id="studio-student" placeholder="Nombre del alumno" autocomplete="off"/></label><label>Estudio guardado<select id="studio-library"><option value="">Abrir estudio guardado…</option></select></label></div>
  <div class="studio-actions"><button class="btn primary" id="studio-save">Guardar partida y notas</button><button class="btn outline" id="studio-export">Exportar estudio</button><label class="btn outline studio-import">Importar copia JSON<input hidden type="file" id="studio-import-json" accept=".json,application/json"/></label><label class="btn outline studio-import">Restaurar biblioteca<input hidden type="file" id="studio-restore-all" accept=".json,application/json"/></label><button class="btn outline" id="studio-delete">Eliminar</button></div>
  <small id="studio-save-status">La biblioteca se guarda solo en este navegador. No se sincroniza entre dispositivos.</small><details class="studio-library-collapse"><summary>▤ Administrar estudios locales</summary><div class="studio-library-tools"><input id="studio-search" placeholder="Buscar por alumno o título…" aria-label="Buscar estudios"/><div id="studio-library-summary">Biblioteca local</div><div class="studio-actions"><button class="btn outline" id="studio-backup-all">Exportar biblioteca completa</button><button class="btn outline" id="studio-copy-study">Duplicar estudio</button></div><div id="studio-results" class="studio-results"></div></div></details>
  <div id="studio-comment-panel" hidden><button type="button" id="studio-close-note" class="studio-close" aria-label="Cerrar editor">×</button><div class="studio-subtitle" id="studio-note-title">Comentario de posición</div><textarea id="studio-note" rows="3" placeholder="Escribí tus conclusiones, ideas o tareas de entrenamiento…"></textarea><div class="studio-subtitle">Agregar variante desde esta posición (SAN)</div><div class="studio-actions"><input id="studio-line-input" placeholder="Ej.: Cf3 d5 g3"/><button class="btn subtle" id="studio-add-line">Añadir variante</button></div><div id="studio-variants"></div></div>
  <details class="studio-editor"><summary>Editar posición del tablero</summary><p>Activá el editor, elegí una pieza y hacé clic en una casilla. Se edita una copia visual de la posición; no la partida original.</p><div class="studio-palette" id="studio-palette"></div><label class="studio-edit-check"><input type="checkbox" id="studio-paint"/> Activar edición por casillas</label><label>Turno de juego<select id="studio-turn"><option value="w">Blancas</option><option value="b">Negras</option></select></label><label>FEN de la posición<input id="studio-fen" spellcheck="false"/></label><div class="studio-actions"><button class="btn outline" id="studio-load-fen">Aplicar FEN</button><button class="btn outline" id="studio-current">Usar posición actual</button><button class="btn outline" id="studio-empty">Tablero con solo reyes</button><button class="btn outline" id="studio-copy-fen">Copiar FEN</button><button class="btn outline" id="studio-reset-fen">Volver a partida</button></div><div class="studio-actions"><input id="studio-diagram-title" placeholder="Nombre del diagrama (ej. Oposición)"/><button class="btn primary" id="studio-save-diagram">Guardar diagrama</button></div><div id="studio-diagrams" class="studio-diagrams"></div><small>Este editor conserva la partida original. Para que Stockfish analice una posición se requieren los dos reyes y un FEN legal.</small></details>
  <details class="studio-cloud"><summary>☁ Cuentas y estudios compartidos</summary><p id="cloud-status">Comprobando conexión…</p><div class="teacher-account"><strong id="account-role">Cuenta sin verificar</strong><div class="studio-actions"><input id="account-name" maxlength="80" placeholder="Tu nombre de alumno o profesor"/><button class="btn outline" id="account-save">Guardar perfil</button></div><small id="account-hint">El rol de profesor se concede únicamente desde Supabase.</small></div><div class="studio-actions"><code id="cloud-user-id">Sin sesión</code><button class="btn outline" id="cloud-copy-id">Copiar mi ID para compartir</button></div><p class="studio-disclaimer">El dueño de cada estudio decide a quién da acceso. Si un alumno te comparte su estudio, aparecerá en «Compartidos conmigo».</p><div class="studio-actions"><input id="cloud-email" type="email" placeholder="Correo de acceso"/><button class="btn outline" id="cloud-login">Enviar enlace de acceso</button><button class="btn outline" id="cloud-logout">Cerrar sesión</button></div><div class="studio-actions"><button class="btn primary" id="cloud-save">Subir estudio actual</button><button class="btn outline" id="cloud-refresh">Actualizar biblioteca</button></div><div class="studio-actions"><label>Biblioteca<select id="cloud-filter"><option value="all">Todos los accesibles</option><option value="shared">Compartidos conmigo</option><option value="mine">Mis estudios</option></select></label></div><select id="cloud-library"><option value="">Estudios en la nube…</option></select><div id="cloud-library-count" class="studio-disclaimer">Biblioteca sin sincronizar</div><div id="teacher-inbox" class="teacher-inbox" hidden><strong>Entregas de alumnos al profe Ian</strong><div id="teacher-inbox-list"></div></div><div class="studio-actions"><button class="btn outline" id="cloud-open">Abrir estudio</button><button class="btn primary" id="cloud-review">Enviar corrección al alumno</button></div><div class="teacher-share"><label>Profesor disponible<select id="teacher-select"><option value="">Cargando profesores…</option></select></label><button class="btn primary" id="share-to-teacher">Compartir con el profe Ian</button><p class="studio-disclaimer">Seleccioná un estudio propio que ya esté subido a la nube. Se enviará acceso de lectura al profesor seleccionado.</p></div><p>Compartir en modo lectura con un usuario autorizado (UUID de Supabase Auth):</p><div class="studio-actions"><input id="cloud-member" placeholder="ID de usuario UUID"/><button class="btn outline" id="cloud-share">Compartir estudio</button></div><p class="studio-disclaimer">Los estudios siguen protegidos por permisos de Supabase. El rol de profesor se habilita únicamente mediante configuración administrativa.</p></details><p class="studio-disclaimer">Clic derecho en una jugada: editar comentarios. Las copias locales siguen disponibles aun sin conexión.</p>`;
 parent.append(panel);
 const pieces=[['wK','♔'],['wQ','♕'],['wR','♖'],['wB','♗'],['wN','♘'],['wP','♙'],['bK','♚'],['bQ','♛'],['bR','♜'],['bB','♝'],['bN','♞'],['bP','♟'],['empty','⌫']];
 el('studio-palette').innerHTML=pieces.map(([p,g])=>'<button type="button" title="'+p+'" data-piece="'+p+'">'+g+'</button>').join('');
 el('studio-palette').addEventListener('click',e=>{const p=e.target.closest('[data-piece]');if(p)choosePalette(p.dataset.piece);});
 choosePalette('wP');insertBoardAction();
 el('studio-paint').onchange=e=>{paint=e.target.checked;if(!paint){selected.previewFen=null;callbacks.renderPreview();}};
 const setEditorFen=(fen)=>{try{const chess=new Chess(fen);selected.previewFen=chess.fen();el('studio-fen').value=chess.fen();el('studio-turn').value=chess.turn();callbacks.renderPreview();notify('Posición cargada para edición.');}catch(e){notify('FEN inválido: '+e.message,'err');}};
 el('studio-turn').onchange=e=>{const old=(selected.previewFen||selected.positions[selected.move]).split(' ');old[1]=e.target.value;old[3]='-';setEditorFen(old.join(' '));};
 el('studio-load-fen').onclick=()=>setEditorFen(el('studio-fen').value.trim());
 el('studio-current').onclick=()=>setEditorFen(selected.positions[selected.move]);
 el('studio-empty').onclick=()=>setEditorFen('k7/8/8/8/8/8/8/7K w - - 0 1');
 el('studio-save-diagram').onclick=()=>{try{
   const fen=selected.previewFen||selected.positions[selected.move];
   const validated=new Chess(fen).fen();
   ensure();active.diagrams||=[];
   active.diagrams.push({id:crypto.randomUUID(),title:el('studio-diagram-title').value.trim().slice(0,100)||'Posición de entrenamiento',fen:validated,ply:selected.move,created:new Date().toISOString()});
   el('studio-diagram-title').value='';change();renderDiagrams();notify('Diagrama guardado en el estudio.');
 }catch(e){notify('Diagrama inválido: '+e.message,'err');}};
 el('studio-reset-fen').onclick=()=>{selected.previewFen=null;paint=false;el('studio-paint').checked=false;el('studio-fen').value=selected.positions[selected.move];el('studio-turn').value=selected.positions[selected.move].split(' ')[1];callbacks.renderPreview();};
 el('studio-copy-fen').onclick=()=>navigator.clipboard.writeText(el('studio-fen').value);
 el('studio-note').oninput=e=>{ensure().comments[selected.move]=e.target.value;change();};
 el('studio-add-line').onclick=lineFromInput;
 el('studio-close-note').onclick=()=>{el('studio-comment-panel').hidden=true;el('studio-comment-panel').classList.remove('contextual');};
 document.addEventListener('keydown',e=>{if(e.key==='Escape'){el('studio-comment-panel').hidden=true;el('studio-comment-panel').classList.remove('contextual');}});
 el('studio-variants').onclick=e=>{const remove=e.target.closest('[data-delete-line]');if(remove){active.variations=active.variations.filter(v=>v.id!==remove.dataset.deleteLine);change();renderNotes();return;}const play=e.target.closest('[data-line]');if(play){const v=active.variations.find(x=>x.id===play.dataset.line);if(v)tree?.open(v);}};
 el('studio-save').onclick=async()=>{ensure().student=el('studio-student').value.trim()||'Sin alumno';change();await put(active);await refreshLibrary();notify('Estudio guardado en este navegador.');};
 el('studio-search').addEventListener('input',refreshLibrary);
 el('studio-results').addEventListener('click',async e=>{const id=e.target.closest('[data-open-study]')?.dataset.openStudy;if(!id)return;const item=await transaction('readonly',db=>db.get(id));if(!item)return;callbacks.loadPGN(item.pgn,'biblioteca');active=item;cloudSource=null;el('studio-student').value=item.student;renderNotes();el('studio-library').value=id;});
 el('studio-backup-all').onclick=async()=>{try{const rows=await getAll();if(!rows.length)return notify('Aún no hay estudios para exportar.');const contents={format:'ib-chess-library',version:1,exportedAt:new Date().toISOString(),studies:rows};const blob=new Blob([JSON.stringify(contents,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='IB_Chess_Biblioteca_'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify(rows.length+' estudios incluidos en la copia.');}catch(e){notify('Error al exportar la biblioteca: '+e.message,'err');}};
 el('studio-restore-all').onchange=async e=>{const file=e.target.files?.[0];if(!file)return;try{
if(file.size>20_000_000)throw Error('La copia supera el límite de 20 MB.');
const bundle=JSON.parse(await file.text());if(bundle?.format!=='ib-chess-library'||!Array.isArray(bundle.studies))throw Error('Formato de biblioteca no reconocido.');
if(bundle.studies.length>1500)throw Error('La copia contiene demasiados estudios.');
const entries=[];
for(const source of bundle.studies){if(!source || typeof source.pgn!=='string'||source.pgn.length>3_000_000)throw Error('PGN inválido en la copia.');
const test=new Chess();test.loadPgn(source.pgn,{strict:false});if(!test.history().length)throw Error('La copia contiene una partida vacía.');
const now=new Date().toISOString();
entries.push({id:crypto.randomUUID(),name:String(source.name||'Estudio restaurado').slice(0,150),student:String(source.student||'Sin alumno').slice(0,100),pgn:test.pgn(),comments:Object.fromEntries(Object.entries(source.comments||{}).filter(([k,v])=>/^\\d+$/.test(k)&&typeof v==='string').map(([k,v])=>[k,v.slice(0,20000)])),diagrams:Array.isArray(source.diagrams)?source.diagrams.filter(d=>typeof d.fen==='string'&&typeof d.title==='string').slice(0,200).map(d=>({id:crypto.randomUUID(),title:d.title.slice(0,100),fen:d.fen,ply:Number(d.ply)||0})):[],variations:Array.isArray(source.variations)?source.variations.filter(v=>Number.isInteger(v.ply)&&Array.isArray(v.san)&&v.san.every(z=>typeof z==='string')).map(v=>({id:crypto.randomUUID(),ply:v.ply,san:v.san.slice(0,200),fen:''})):[],created:now,updated:now});}
for(const item of entries)await put(item);
await refreshLibrary();notify(entries.length+' estudios restaurados como nuevas copias.');
}catch(err){notify('Error al restaurar: '+err.message,'err');}e.target.value='';};
 el('studio-copy-study').onclick=async()=>{try{if(!active)throw Error('Abrí un estudio primero.');const cloned={...structuredClone(active),id:crypto.randomUUID(),name:active.name+' (copia)',created:new Date().toISOString(),updated:new Date().toISOString()};await put(cloned);active=cloned;await refreshLibrary();renderNotes();notify('Copia del estudio creada.');}catch(e){notify('No se pudo duplicar: '+e.message,'err');}};
el('studio-export').onclick=exportStudy;
 el('studio-import-json').onchange=async e=>{
   const file=e.target.files?.[0];if(!file)return;
   try {
     const obj=JSON.parse(await file.text());
     if(!obj || typeof obj.pgn!=='string' || typeof obj.comments!=='object' || !Array.isArray(obj.variations))throw Error('El archivo no corresponde a un estudio válido.');
     if(obj.pgn.length>3_000_000)throw Error('Archivo demasiado grande.');
     const verify=new Chess();verify.loadPgn(obj.pgn,{strict:false});
     if(!verify.history().length)throw Error('El estudio no contiene una partida.');
     const restored={id:crypto.randomUUID(),name:String(obj.name||'Estudio importado').slice(0,150),student:String(obj.student||'Sin alumno').slice(0,100),pgn:verify.pgn(),comments:Object.fromEntries(Object.entries(obj.comments).filter(([k,v])=>/^\\d+$/.test(k)&&typeof v==='string').map(([k,v])=>[k,v.slice(0,20000)])),diagrams:Array.isArray(obj.diagrams)?obj.diagrams.filter(d=>typeof d.fen==='string'&&typeof d.title==='string').slice(0,200).map(d=>({id:crypto.randomUUID(),title:d.title.slice(0,100),fen:d.fen,ply:Number(d.ply)||0})):[],variations:obj.variations.filter(v=>Number.isInteger(v.ply)&&Array.isArray(v.san)&&v.san.every(x=>typeof x==='string')).map(v=>({id:crypto.randomUUID(),ply:v.ply,san:v.san.slice(0,200),fen:''})),created:new Date().toISOString(),updated:new Date().toISOString()};
     await put(restored);callbacks.loadPGN(restored.pgn,'copia JSON');active=restored;el('studio-student').value=restored.student;await refreshLibrary();renderNotes();notify('Copia importada y guardada.');
   } catch(err){notify('No se pudo importar: '+err.message,'err');}
   e.target.value='';
 };

 el('studio-delete').onclick=async()=>{if(!active)return;if(!confirm('¿Eliminar este estudio guardado?'))return;await del(active.id);active=null;renderNotes();await refreshLibrary();};
 el('studio-library').onchange=async e=>{if(!e.target.value)return;const item=await transaction('readonly',s=>s.get(e.target.value));if(!item)return;callbacks.loadPGN(item.pgn,'estudio guardado');active=item;el('studio-student').value=item.student;renderNotes();};
 document.querySelector('#move-list').addEventListener('contextmenu',e=>{const b=e.target.closest('[data-ply]');if(!b)return;e.preventDefault();callbacks.jump(Number(b.dataset.ply));commentAt(Number(b.dataset.ply));});
 const status=msg=>{el('cloud-status').textContent=msg;};
 if(!cloudAvailable){status('Nube sin configurar: los estudios siguen guardándose localmente.');document.querySelectorAll('.studio-cloud button,.studio-cloud input,.studio-cloud select').forEach(x=>x.disabled=true);}
 else {
   const requireLogin=async()=>{const s=await getCloudSession();if(!s)throw Error('Ingresá con el enlace enviado a tu correo.');return s;};
   let cloudRows=[];
   const drawCloudLibrary=async()=>{const session=await getCloudSession();if(!session)return;const choice=el('cloud-filter').value;const rows=cloudRows.filter(x=>choice==='all'||(choice==='mine'?x.owner_id===session.user.id:x.owner_id!==session.user.id));el('cloud-library').innerHTML='<option value="">Seleccionar estudio…</option>'+rows.map(x=>'<option value="'+x.id+'">'+(x.owner_id===session.user.id?'Mío · ':'Compartido · ')+String(x.student_label+' · '+x.title).replace(/[&<>"']/g,'')+'</option>').join('');el('cloud-library-count').textContent=rows.length+' estudio(s) en esta vista · '+cloudRows.filter(x=>x.owner_id!==session.user.id).length+' compartido(s) conmigo';
    const inbox=el('teacher-inbox'),inboxList=el('teacher-inbox-list');
    inbox.hidden=!account?.isTeacher;
    inboxList.replaceChildren();
    if(account?.isTeacher){
      const submissions=cloudRows.filter(x=>x.owner_id!==session.user.id);
      if(!submissions.length){const msg=document.createElement('p');msg.textContent='Todavía no hay estudios compartidos por alumnos.';inboxList.append(msg);}
      for(const study of submissions){
        const button=document.createElement('button');button.type='button';button.className='teacher-submission';
        const name=document.createElement('strong');name.textContent=study.student_label||'Alumno';
        const description=document.createElement('small');description.textContent=study.title||'Estudio';
        button.append(name,description);
        button.onclick=async()=>{el('cloud-filter').value='all';await drawCloudLibrary();el('cloud-library').value=study.id;el('cloud-open').click();};
        inboxList.append(button);
      }
    }};
   el('cloud-filter').onchange=drawCloudLibrary;
   let account=null;
   const show=async()=>{try{
     const session=await getCloudSession();
     status(session?'Conectado: '+session.user.email:'Ingresá tu correo y abrí el enlace de acceso.');
     if(!session){account=null;el('account-role').textContent='Sin sesión';el('cloud-user-id').textContent='Sin sesión';cloudRows=[];el('cloud-library').innerHTML='<option>Iniciá sesión primero</option>';return;}
     try{account=await accountDetails();}catch(err){account=null;el('account-hint').textContent='Falta habilitar directorio de profesores: '+err.message;}
     el('account-role').textContent=account?.isTeacher?'♔ Cuenta de profesor':account?'♙ Cuenta de alumno':'Cuentas pendientes de activación';
     el('account-name').value=account?.name||'';
     if(account)el('account-hint').textContent=account.isTeacher?'Podés revisar estudios que tus alumnos te compartan.':'Compartí los estudios propios con el profesor desde el selector inferior.';
     el('teacher-select').replaceChildren();
     for(const t of account?.teachers||[]){const opt=document.createElement('option');opt.value=t.teacher_id;opt.textContent=t.display_name;el('teacher-select').append(opt);}
     if(!account?.teachers?.length){const opt=document.createElement('option');opt.value='';opt.textContent='Profesor pendiente de habilitación';el('teacher-select').append(opt);}
     cloudRows=await cloudList();el('cloud-user-id').textContent=session.user.id;await drawCloudLibrary();
   }catch(e){status('Error nube: '+e.message);}};
   el('account-save').onclick=async()=>{try{await saveAccountName(el('account-name').value);await show();notify('Perfil actualizado.');}catch(e){notify('No se pudo guardar el perfil: '+e.message,'err');}};
   el('share-to-teacher').onclick=async()=>{
    try{
      const me=await requireLogin();
      const teacher=el('teacher-select').value;
      if(!teacher)throw Error('Todavía no hay un profesor registrado.');
      const selectedId=el('cloud-library').value;
      if(!selectedId)throw Error('Seleccioná un estudio en la biblioteca de la nube.');
      const row=cloudRows.find(x=>x.id===selectedId);
      if(!row||row.owner_id!==me.user.id)throw Error('Solo podés compartir estudios propios.');
      await shareWithTeacher(row.id,teacher);
      notify('Estudio compartido con '+(account?.teachers.find(x=>x.teacher_id===teacher)?.display_name||'el profesor')+'.');
    }catch(e){notify('No se pudo compartir: '+e.message,'err');}
   };
   el('cloud-copy-id').onclick=async()=>{try{const session=await getCloudSession();if(!session)throw Error('Iniciá sesión primero.');await navigator.clipboard.writeText(session.user.id);notify('ID de usuario copiado.');}catch(e){notify(e.message,'err');}};
   el('cloud-login').onclick=async()=>{try{const email=el('cloud-email').value.trim();if(!email.includes('@'))throw Error('Ingresá un correo válido.');await emailLogin(email);status('Revisá el correo y abrí el enlace de acceso.');}catch(e){notify(e.message,'err');}};
   el('cloud-logout').onclick=async()=>{try{await cloudLogout();await show();}catch(e){notify(e.message,'err');}};
   el('cloud-save').onclick=async()=>{try{await requireLogin();if(cloudSource?.shared&&active?.id===cloudSource.id)throw Error('El original pertenece al alumno. Usá «Enviar corrección al alumno» para crear una copia.');ensure();active.student=el('studio-student').value.trim()||active.student;await put(active);await cloudSave(active);await show();notify('Estudio sincronizado con la nube.');}catch(e){notify('No se pudo subir: '+e.message,'err');}};
   el('cloud-refresh').onclick=show;
   el('cloud-open').onclick=async()=>{try{await requireLogin();const id=el('cloud-library').value;if(!id)return;const opened=await cloudOpen(id);const study=opened.study;callbacks.loadPGN(study.pgn,'estudio compartido');active=structuredClone(study);cloudSource={id,ownerId:opened.ownerId,shared:opened.shared};el('studio-student').value=study.student||'';renderNotes();notify(opened.shared?'Estudio del alumno abierto. Los cambios locales no alteran su original.':'Estudio propio abierto desde la nube.');}catch(e){notify(e.message,'err');}};
   el('cloud-review').onclick=async()=>{try{
    await requireLogin();
    if(!account?.isTeacher)throw Error('Solo la cuenta habilitada como profesor puede devolver correcciones.');
    if(!active||!cloudSource?.shared)throw Error('Primero abrí un estudio compartido por un alumno.');
    const review=await cloudReviewCopy(active,cloudSource.ownerId);
    await put(review);active=review;cloudSource={id:review.id,ownerId:(await requireLogin()).user.id,shared:false};
    await refreshLibrary();await show();renderNotes();
    notify('Corrección creada y compartida con el alumno. Su original permanece intacto.');
   }catch(e){notify('No se pudo devolver la corrección: '+e.message,'err');}};
   el('cloud-share').onclick=async()=>{try{await requireLogin();if(!active)throw Error('Abrí primero un estudio.');const id=el('cloud-member').value.trim();if(!/^[0-9a-f-]{36}$/i.test(id))throw Error('ID de usuario inválido.');await cloudShare(active.id,id);notify('Permiso de lectura asignado al usuario.');}catch(e){notify(e.message,'err');}};
   show();
 }
 el('studio-comment-panel').hidden=true;
 tree=initVariationBoard(selected,{render:callbacks.renderPreview,notify,isEditing:()=>paint,save:v=>{ensure();const i=active.variations.findIndex(x=>x.id===v.id);if(i>=0)active.variations[i]=v;else active.variations.push(v);change();renderNotes();}});
 refreshLibrary();renderNotes();
 return {
async importLibraryPgn(text,studentLabel='Sin alumno',collectionName='Estudio importado'){
 if(typeof text!=='string'||text.length>15_000_000)throw Error('Archivo PGN demasiado grande (máximo 15 MB).');
 const clean=text.replace(/\r/g,'');
 const starts=[...clean.matchAll(/^\[Event\s+"/gm)].map(match=>match.index);
 const segments=starts.length>1?starts.map((at,i)=>clean.slice(at,starts[i+1]??clean.length)):[clean];
 if(segments.length>500)throw Error('Por seguridad, importá un máximo de 500 partidas por archivo.');
 let inserted=0,invalid=0;const collectionId=crypto.randomUUID();
 for(const segment of segments){
  try{
   const game=new Chess();game.loadPgn(segment,{strict:false});
   if(!game.history().length){invalid++;continue;}
   const header=game.header(),name=[header.White||'Blancas',header.Black||'Negras'].join(' – ');
   const now=new Date().toISOString();
   await put({id:crypto.randomUUID(),collectionId,collectionName:String(collectionName).slice(0,120),name,student:String(studentLabel||'Sin alumno').slice(0,100),pgn:game.pgn(),comments:{},variations:[],diagrams:[],created:now,updated:now});
   inserted++;
  }catch{invalid++;}
 }
 await refreshLibrary();
 return {inserted,invalid};
},
async organizeLibraryItems(ids,name){
 const label=String(name||'').trim();
 if(!label||label.length>120)throw Error('Ingresá un nombre para el estudio (máximo 120 caracteres).');
 const group=crypto.randomUUID();let changed=0;
 for(const id of ids){const entry=await transaction('readonly',store=>store.get(id));if(!entry)continue;
 entry.collectionId=group;entry.collectionName=label;entry.updated=new Date().toISOString();await put(entry);changed++;}
 await refreshLibrary();return changed;
},
async renameLibraryItem(source,id,newName){
 const label=String(newName||'').trim();if(!label||label.length>130)throw Error('Nombre inválido.');
 if(source!=='local')throw Error('Edición de estudios en nube pendiente: abrí tu copia en el editor.');
 const entry=await transaction('readonly',store=>store.get(id));if(!entry)throw Error('Partida no encontrada.');
 entry.name=label;entry.updated=new Date().toISOString();await put(entry);
 if(active?.id===id){active.name=label;renderNotes();}
 await refreshLibrary();
},
async renameLibraryCollection(ids,name){
 const label=String(name||'').trim();if(!label||label.length>120)throw Error('Nombre inválido.');
 for(const id of ids){const entry=await transaction('readonly',store=>store.get(id));if(!entry)continue;entry.collectionName=label;await put(entry);}
 await refreshLibrary();
},
async deleteLibraryItem(source,id){
 if(source==='local'){
  await del(id);if(active?.id===id)active=null;await refreshLibrary();return;
 }
 if(source==='cloud')throw Error('Eliminación en la nube deshabilitada para proteger los estudios compartidos.');
 throw Error('Origen desconocido.');
},
async listLibraryItems(){
 const locals=await getAll();
 let remote=[],error='';
 if(cloudAvailable){
  try{const session=await getCloudSession();if(session)remote=await cloudList();}
  catch(e){error=e.message;}
 }
 return {locals,remote,error};
},
async openLibraryItem(source,id){
 if(source==='local'){
  const item=await transaction('readonly',store=>store.get(id));
  if(!item)throw Error('Este estudio local ya no existe.');
  callbacks.loadPGN(item.pgn,'biblioteca local');
  active=item;cloudSource=null;el('studio-student').value=item.student||'';renderNotes();
 }else if(source==='cloud'){
  const opened=await cloudOpen(id),item=opened.study;
  callbacks.loadPGN(item.pgn,'biblioteca compartida');
  active=structuredClone(item);cloudSource={id,ownerId:opened.ownerId,shared:opened.shared};
  el('studio-student').value=item.student||'';renderNotes();
 }else throw Error('Origen desconocido.');
 return active;
},
async getLibraryPgn(source,id){
 if(source==='local'){
  const study=await transaction('readonly',store=>store.get(id));if(!study)throw Error('Estudio no disponible.');
  return study.pgn;
 }
 const result=await cloudOpen(id);return result.study.pgn;
},
async updatePlayerNames(){
 if(!selected?.game)throw Error('No hay partida abierta.');
 const study=ensure();
 if(cloudSource?.shared)throw Error('Este estudio pertenece a otro usuario. Creá una copia antes de modificarlo.');
 const game=selected.game;
 study.pgn=game.pgn;
 study.name=(game.headers.White||'Blancas')+' – '+(game.headers.Black||'Negras');
 study.updated=new Date().toISOString();
 await put(study);
 await refreshLibrary();
 renderNotes();
 return true;
},
addEngineVariation(ply,sans,summary){try{
if(selected.previewFen)throw Error('Volvé a la línea principal antes de guardar variantes del motor.');
const c=new Chess(selected.positions[ply]);const legalSans=[];
for(const m of sans){legalSans.push(c.move(m).san);}
if(!legalSans.length)throw Error('No hay jugadas que guardar.');
ensure();
const entry={id:crypto.randomUUID(),ply,san:legalSans,fen:c.fen()};
if(!active.variations.some(v=>v.ply===ply&&v.san.join(' ')===entry.san.join(' ')))active.variations.push(entry);
if(summary)active.comments[ply]=[active.comments[ply],summary].filter(Boolean).join('\n');
change();renderNotes();return true;
}catch(e){notify('No se pudo guardar la variante: '+e.message,'err');return false;}},getComment(ply){return active?.comments?.[ply]||'';},getVariations(ply){return (active?.variations||[]).filter(v=>v.ply===ply).map(v=>v.san.join(' '));},gameChanged(){active=null;cloudSource=null;paint=false;tree?.clear();el('studio-paint').checked=false;renderNotes();},selectionChanged(){tree?.restoreMain();if(el('studio-note')!==document.activeElement)renderNotes();el('studio-fen').value=selected.previewFen||selected.positions[selected.move]||'';el('studio-turn').value=(selected.previewFen||selected.positions[selected.move]||' w ').split(' ')[1];}}
}
