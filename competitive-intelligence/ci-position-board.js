import {Chess} from 'chess.js';
import {pieceSetForStyle} from '../color-contrast.js';

export function ciPositionFromLine(line=[]){
 const game=new Chess();
 let last=null;
 try{
  for(const san of line)last=game.move(san);
  return {fen:game.fen(),last: last?{from:last.from,to:last.to,san:last.san}:null,turn:game.turn(),ply:line.length};
 }catch(error){return {error:'Secuencia inválida: '+error.message};}
}
export function ciSquaresForOrientation(orientation='w'){
 const files=orientation==='b'?'hgfedcba':'abcdefgh';
 const ranks=orientation==='b'?'12345678':'87654321';
 return [...ranks].flatMap(rank=>[...files].map(file=>file+rank));
}
const symbols={w:{k:'♔',q:'♕',r:'♖',b:'♗',n:'♘',p:'♙'},b:{k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟'}};

/** Read-only board. Reuses existing piece sets and CSS board palette, never touches Game Review. */
export function initCIPositionBoard({host,orientation='w'}){
 host.innerHTML=`<div class="ci-position-heading"><strong>Posición del repertorio</strong><button id="ci-position-flip" type="button" class="btn outline">⇅ Girar</button></div>
 <div id="ci-position-board" class="ci-position-board" role="img" aria-label="Posición inicial de ajedrez"></div>
 <div id="ci-position-info" class="ci-position-info" aria-live="polite">Posición inicial · blancas juegan</div>`;
 const el=id=>host.querySelector('#'+id);
 let side=orientation,game=new Chess(),line=[],last=null;
 function render(){
  const result=ciPositionFromLine(line);
  if(result.error){el('ci-position-info').textContent=result.error;return false;}
  game=new Chess(result.fen);last=result.last;
  const squareHost=el('ci-position-board');squareHost.replaceChildren();
  const pieceSet=pieceSetForStyle(window.IB_APPEARANCE?.getPieceSet?.()||'cburnett')||'cburnett';
  const squares=ciSquaresForOrientation(side);
  for(let i=0;i<squares.length;i++){
   const sq=squares[i],p=game.get(sq);
   const cell=document.createElement('span');cell.className='ci-position-square';
   const file=sq[0],rank=Number(sq[1]);
   cell.classList.add((('abcdefgh'.indexOf(file)+rank)%2===0)?'light':'dark');
   if(last?.from===sq||last?.to===sq)cell.classList.add('last-move');
   cell.title=sq+(p?' · '+(p.color==='w'?'Blancas':'Negras')+' '+p.type:'');
   if(p){
    const img=document.createElement('img');img.src=import.meta.env.BASE_URL+'pieces/'+pieceSet+'/'+p.color+p.type.toUpperCase()+'.svg';
    img.alt=(p.color==='w'?'Blancas ':'Negras ')+p.type;img.draggable=false;
    img.onerror=()=>{img.remove();const glyph=document.createElement('span');glyph.className='ci-position-glyph';glyph.textContent=symbols[p.color][p.type];cell.append(glyph);};
    cell.append(img);
   }
   const isRank=side==='w'?file==='a':file==='h';
   const isFile=side==='w'?rank===1:rank===8;
   if(isRank){const label=document.createElement('span');label.className='ci-position-rank';label.textContent=String(rank);cell.append(label);}
   if(isFile){const label=document.createElement('span');label.className='ci-position-file';label.textContent=file;cell.append(label);}
   squareHost.append(cell);
  }
  const toMove=game.turn()==='w'?'blancas':'negras';
  el('ci-position-info').textContent=result.ply+' medias jugadas · juegan '+toMove+(last?' · última '+last.san:'');
  squareHost.setAttribute('aria-label',el('ci-position-info').textContent+'; '+result.fen);
  return true;
 }
 el('ci-position-flip').onclick=()=>{side=side==='w'?'b':'w';render();};
 render();
 return {setLine(next=[]){line=[...next];return render();},setOrientation(value){side=value==='b'?'b':'w';render();},getOrientation(){return side;}};
}
