import { Chess } from 'chess.js';

// A separate, non-destructive variation workspace. Mainline FEN/PGN stays intact.
// Every variation is anchored to a ply of the imported game.
export function initVariationBoard(state, options) {
  let branch = null, from = null;
  const root = document.getElementById('studio-variants');
  const area = document.createElement('section');
  area.className='variation-workspace';
  area.innerHTML = '<div class="studio-subtitle">Variantes navegables</div><p class="variation-hint">Seleccioná una jugada y tocá una pieza y su destino para construir una alternativa. También podés escribir una línea SAN arriba.</p><div class="variation-toolbar"><button id="v-start" class="btn outline">⏮ Inicio</button><button id="v-prev" class="btn outline">◀</button><span id="v-progress">Sin variante</span><button id="v-next" class="btn outline">▶</button><button id="v-main" class="btn subtle">Volver a partida</button></div><div id="v-current" class="variation-line"></div>';
  root.after(area);
  const $ = id => document.getElementById(id);
  const clear = () => {branch=null;from=null;state.previewFen=null;options.render();draw();};
  const draw = () => {
    $('v-progress').textContent=branch?branch.cursor+' / '+branch.san.length:'Sin variante';
    $('v-current').textContent=branch?branch.san.map((m,i)=>i===branch.cursor-1?'【'+m+'】':m).join(' '):'';
    for(const id of ['v-start','v-prev','v-next','v-main'])$(id).disabled=!branch;
  };
  const sync = () => {
    state.previewFen=branch?.fens[branch.cursor]||null;from=null;
    options.render();draw();
  };
  const open = (entry) => {
    const base = state.positions[entry.ply];
    if (!base) return options.notify('No se encontró la posición base.','err');
    const c = new Chess(base),fens=[c.fen()],san=[];
    try { for(const move of entry.san){san.push(c.move(move).san);fens.push(c.fen());} }
    catch(e){return options.notify('Variante inválida: '+e.message,'err');}
    branch={id:entry.id,rootPly:entry.ply,san,fens,cursor:san.length};
    sync();
  };
  const selectFromSquare = sq => {
    if (options.isEditing()) return false;
    const base=branch?.fens[branch.cursor]||state.positions[state.move];
    if (!base) return false;
    let c;
    try {c=new Chess(base);} catch{return false;}
    const piece=c.get(sq);
    if (!from) {
      if(piece?.color===c.turn()){from=sq;document.querySelectorAll('.square').forEach(x=>x.classList.toggle('candidate',x.title===sq));return true;}
      return false;
    }
    if (sq===from) {from=null;document.querySelectorAll('.candidate').forEach(x=>x.classList.remove('candidate'));return true;}
    let move;
    try {move=c.move({from,to:sq,promotion:'q'});} catch {move=null;}
    if(!move){from=null;document.querySelectorAll('.candidate').forEach(x=>x.classList.remove('candidate'));options.notify('Movimiento ilegal.','err');return true;}
    if(!branch || branch.cursor<branch.san.length){
      const saved=branch?branch.san.slice(0,branch.cursor):[];
      const rootPly=branch?.rootPly??state.move;
      const rootFen=state.positions[rootPly];
      const rebuilt=new Chess(rootFen),fens=[rebuilt.fen()];
      for(const s of saved){rebuilt.move(s);fens.push(rebuilt.fen());}
      branch={id:crypto.randomUUID(),rootPly,san:saved,fens,cursor:saved.length};
    }
    branch.san.push(move.san);branch.fens.push(c.fen());branch.cursor++;
    options.save({id:branch.id,ply:branch.rootPly,san:[...branch.san],fen:branch.fens.at(-1)});
    sync();return true;
  };
  $('v-start').onclick=()=>{branch.cursor=0;sync();};
  $('v-prev').onclick=()=>{branch.cursor=Math.max(0,branch.cursor-1);sync();};
  $('v-next').onclick=()=>{branch.cursor=Math.min(branch.san.length,branch.cursor+1);sync();};
  $('v-main').onclick=clear;
  $('board').addEventListener('click',e=>{const square=e.target.closest('.square')?.title;if(square)selectFromSquare(square);});
  draw();
  return {open,clear,draw,selectFromSquare, getActive:()=>branch, restoreMain(){if(branch)clear();}};
}
