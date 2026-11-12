import {Chess} from 'chess.js';

const PIECES=Object.freeze({wk:'♔',wq:'♕',wr:'♖',wb:'♗',wn:'♘',wp:'♙',bk:'♚',bq:'♛',br:'♜',bb:'♝',bn:'♞',bp:'♟'});
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function decodeDocument(record){
 try{
  const data=JSON.parse(record?.plan||'{}');
  if(data.version!==1||typeof data.pgn!=='string'||!data.notes||typeof data.notes!=='object')throw Error('Formato no reconocido');
  return {title:record.title||'Estudio',pgn:data.pgn,notes:data.notes,source:data.source||''};
 }catch{return {title:record?.title||'Estudio',pgn:'',notes:{},source:''};}
}
export function encodeDocument(data){
 return JSON.stringify({version:1,pgn:String(data.pgn||''),notes:data.notes||{},source:String(data.source||'').slice(0,2048)});
}
export function initCIDocumentaryBoard({host,service,onError}){
 host.innerHTML=`<div class="ci-board-head"><div><span class="eyebrow">LABORATORIO PRIVADO · DOCUMENTACIÓN</span><h3>Estudio documental</h3><p>Tablero independiente del Game Review. Las notas son privadas y se guardan en Competitive Intelligence.</p></div><button class="btn outline" id="ci-study-new" type="button">＋ Nuevo estudio</button></div>
 <div class="ci-study-toolbar"><label>Expediente vinculado<select id="ci-study-player"><option value="">Elegí un rival</option></select></label><label>Estudios guardados<select id="ci-study-existing"><option value="">Nuevo documento</option></select></label><button class="btn outline" type="button" id="ci-study-load">Abrir estudio</button></div>
 <div class="ci-board-layout"><div class="ci-board-side"><div class="ci-document-board" id="ci-chessboard" role="group" aria-label="Tablero de estudio documental"></div><div class="ci-board-controls"><button class="btn outline" type="button" id="ci-board-first" aria-label="Inicio">⏮</button><button class="btn outline" type="button" id="ci-board-back" aria-label="Anterior">◀</button><span id="ci-board-counter">0 / 0</span><button class="btn outline" type="button" id="ci-board-next" aria-label="Siguiente">▶</button><button class="btn outline" type="button" id="ci-board-last" aria-label="Final">⏭</button><button class="btn outline" type="button" id="ci-board-flip">Girar</button></div><div id="ci-board-message" class="ci-study-message" role="status">Elegí un rival y cargá una partida.</div></div>
 <div class="ci-board-editor"><label>Título de documento<input id="ci-study-title" maxlength="160" placeholder="Preparación contra rival / partida modelo"></label><label>Origen y referencia<input id="ci-study-source" maxlength="2048" placeholder="Torneo, fecha o URL pública"></label><label>Importar PGN<textarea rows="4" id="ci-study-pgn" placeholder="[Event &quot;Partida modelo&quot;]&#10;1. e4 e5 2. Nf3 Nc6 *"></textarea></label><div class="ci-actions"><button class="btn outline" type="button" id="ci-study-import">Cargar PGN al tablero</button><button class="btn outline" type="button" id="ci-study-export">Exportar PGN</button></div><div class="ci-study-moves" id="ci-study-moves" aria-label="Lista de jugadas"></div><label>Comentario de la posición <span id="ci-study-ply">0</span><textarea id="ci-study-note" rows="5" placeholder="Plan, estructura, idea crítica, evidencia o hipótesis..."></textarea></label><div class="ci-actions"><button class="btn primary" type="button" id="ci-study-save">Guardar documento privado</button></div></div></div>`;
 const get=id=>host.querySelector('#'+id);
 let history=[new Chess().fen()],moves=[],notes={},ply=0,orientation='w',selected=-1,recordId=null,authorized=false,working=false;
 const status=(text,error=false)=>{get('ci-board-message').textContent=text;get('ci-board-message').classList.toggle('error',error);};
 function exportCurrent(){
  const chess=new Chess();for(const san of moves)chess.move(san);return chess.pgn();
 }
 function syncNote(){notes[String(ply)]=get('ci-study-note').value;}
 function currentNote(){get('ci-study-note').value=notes[String(ply)]||'';get('ci-study-ply').textContent=String(ply);}
 function navigate(target){syncNote();ply=Math.min(moves.length,Math.max(0,target));selected=-1;render();}
 function parsePGN(value){
  const chess=new Chess();if(value.trim()){chess.loadPgn(value,{strict:false});}
  const sans=chess.history();
  const check=new Chess(),fens=[check.fen()];
  for(const san of sans){check.move(san);fens.push(check.fen());}
  return {sans,fens};
 }
 function showMoves(){
  const container=get('ci-study-moves');container.replaceChildren();
  for(let i=0;i<moves.length;i++){
   const button=document.createElement('button');button.type='button';button.className='ci-move-token';button.classList.toggle('active',ply===i+1);button.textContent=(i%2===0?Math.floor(i/2)+1+'. ':'')+moves[i];button.onclick=()=>navigate(i+1);container.append(button);
  }
  if(!moves.length)container.textContent='Sin jugadas todavía. Importá un PGN o jugá directamente sobre el tablero.';
 }
 function playMove(from,to){
  if(ply!==moves.length){status('Para agregar una jugada, primero avanzá hasta el final. Las variantes desde posiciones anteriores se incorporarán en una fase posterior.',true);return;}
  const chess=new Chess(history[ply]);let m;
  try{m=chess.move({from,to,promotion:'q'});}catch{status('Jugada no legal. Seleccioná otra pieza.',true);return;}
  if(!m){status('Jugada no legal.',true);return;}
  syncNote();moves.push(m.san);history.push(chess.fen());ply++;selected=-1;get('ci-study-pgn').value=exportCurrent();render();status('Jugada añadida al documento. Guardá para conservarla.');
 }
 function render(){
  const chess=new Chess(history[ply]);const board=get('ci-chessboard');board.replaceChildren();
  for(let row=0;row<8;row++)for(let col=0;col<8;col++){
   const file=orientation==='w'?col:7-col,rank=orientation==='w'?7-row:row;
   const square='abcdefgh'[file]+(rank+1),piece=chess.get(square);
   const cell=document.createElement('button');cell.type='button';cell.className='ci-square '+((row+col)%2?'dark':'light');cell.classList.toggle('selected',square===selected);cell.setAttribute('aria-label',square+' '+(piece?piece.color+piece.type:'vacía'));
   const glyph=document.createElement('span');glyph.className='ci-piece '+(piece?.color==='w'?'white':'black');glyph.textContent=piece?PIECES[piece.color+piece.type]:'';
   cell.append(glyph);
   if(col===0){const rankLabel=document.createElement('small');rankLabel.className='ci-rank';rankLabel.textContent=String(rank+1);cell.append(rankLabel);}
   if(row===7){const fileLabel=document.createElement('small');fileLabel.className='ci-file';fileLabel.textContent='abcdefgh'[file];cell.append(fileLabel);}
   cell.onclick=()=>{if(selected===-1){if(piece?.color===chess.turn()){selected=square;render();}return;}if(selected===square){selected=-1;render();return;}if(piece?.color===chess.turn()){selected=square;render();return;}playMove(selected,square);};
   board.append(cell);
  }
  get('ci-board-counter').textContent=ply+' / '+moves.length;
  get('ci-board-first').disabled=ply===0;get('ci-board-back').disabled=ply===0;get('ci-board-next').disabled=ply===moves.length;get('ci-board-last').disabled=ply===moves.length;
  currentNote();showMoves();
 }
 function clear(){
  recordId=null;moves=[];history=[new Chess().fen()];notes={};ply=0;selected=-1;get('ci-study-title').value='';get('ci-study-source').value='';get('ci-study-pgn').value='';render();status('Documento nuevo. No se ha guardado nada.');
 }
 function setPlayers(players){
  const picker=get('ci-study-player'),previous=picker.value;picker.replaceChildren(new Option('Elegí un rival',''));
  for(const player of players)picker.add(new Option(player.display_name,player.id));
  if(players.some(x=>x.id===previous))picker.value=previous;
 }
 async function loadList(){
  const id=get('ci-study-player').value,select=get('ci-study-existing');select.replaceChildren(new Option('Nuevo documento',''));
  if(!id||!authorized)return;
  try{const items=await service.listPreparations(id);for(const item of items)select.add(new Option(item.title,item.id));}catch(e){status('No se pudieron listar los documentos: '+e.message,true);}
 }
 get('ci-board-first').onclick=()=>navigate(0);get('ci-board-back').onclick=()=>navigate(ply-1);get('ci-board-next').onclick=()=>navigate(ply+1);get('ci-board-last').onclick=()=>navigate(moves.length);
 get('ci-board-flip').onclick=()=>{orientation=orientation==='w'?'b':'w';render();};
 get('ci-study-new').onclick=clear;
 get('ci-study-player').onchange=()=>{clear();loadList();};
 get('ci-study-load').onclick=async()=>{const id=get('ci-study-existing').value,player=get('ci-study-player').value;if(!id||!player)return status('Seleccioná un estudio existente.',true);try{const record=await service.getPreparation(id,player),doc=decodeDocument(record),parsed=parsePGN(doc.pgn);recordId=record.id;notes=doc.notes;moves=parsed.sans;history=parsed.fens;ply=0;get('ci-study-title').value=doc.title;get('ci-study-source').value=doc.source;get('ci-study-pgn').value=doc.pgn;render();status('Estudio abierto. Podés recorrerlo y actualizar los comentarios.');}catch(e){status('No se pudo abrir: '+e.message,true);}};
 get('ci-study-import').onclick=()=>{try{const parsed=parsePGN(get('ci-study-pgn').value);syncNote();moves=parsed.sans;history=parsed.fens;notes={};ply=0;selected=-1;render();status('PGN válido. '+moves.length+' medias jugadas cargadas. Guardá el documento.');}catch(e){status('PGN inválido: '+e.message,true);}};
 get('ci-study-export').onclick=()=>{const blob=new Blob([exportCurrent()],{type:'application/x-chess-pgn'});const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='IB_CI_Estudio.pgn';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 get('ci-study-save').onclick=async()=>{if(working)return;const player=get('ci-study-player').value,title=get('ci-study-title').value.trim();if(!player||!title)return status('Elegí un rival e ingresá un título antes de guardar.',true);if(!authorized)return status('Sin autorización.',true);syncNote();working=true;get('ci-study-save').disabled=true;try{const data={title,plan:encodeDocument({pgn:exportCurrent(),notes,source:get('ci-study-source').value})};const rec=recordId?await service.updatePreparation(recordId,player,data):await service.createPreparation(player,data);recordId=rec.id;await loadList();get('ci-study-existing').value=recordId;status('Estudio privado guardado en Supabase.');}catch(e){status('Error al guardar: '+e.message,true);onError?.(e);}finally{working=false;get('ci-study-save').disabled=false;}};
 render();
 return {setPlayers,async activate(){authorized=await service.authorized();if(authorized)await loadList();},selectPlayer(id){get('ci-study-player').value=id;clear();return loadList();},clear};
}
