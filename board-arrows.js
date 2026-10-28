// Smooth chessboard annotations: right-drag arrows, right-click square marks.
// SVG overlay is isolated from PGN, piece movements and Stockfish.
export function initBoardArrows({getFen,getOrientation,isEditing}){
  const board=document.getElementById('board');
  if(!board)return null;
  const NS='http://www.w3.org/2000/svg';
  const arrows=new Map(),marks=new Set();
  let start=null,lastPosition='',pointerId=null,endSquare=null,previewPoint=null,frame=0;
  const svg=(tag,attrs={},parent)=>{
    const node=document.createElementNS(NS,tag);
    for(const [key,value] of Object.entries(attrs))node.setAttribute(key,String(value));
    if(parent)parent.appendChild(node);
    return node;
  };
  const overlay=svg('svg',{class:'board-arrows',viewBox:'0 0 800 800','aria-hidden':'true',preserveAspectRatio:'none'});
  const staticLayer=svg('g',{},overlay),previewLayer=svg('g',{},overlay);
  const pos=s=>{
    if(!/^[a-h][1-8]$/.test(s||''))return null;
    const file=s.charCodeAt(0)-97,rank=Number(s[1])-1;
    const black=getOrientation()==='black';
    return {x:(black?7-file:file)*100+50,y:(black?rank:7-rank)*100+50};
  };
  const pointOf=e=>{
    const rect=board.getBoundingClientRect();
    const x=(e.clientX-rect.left)/rect.width*800;
    const y=(e.clientY-rect.top)/rect.height*800;
    if(x<0||x>800||y<0||y>800)return null;
    return {x,y};
  };
  const squareOf=e=>{
    const p=pointOf(e);if(!p)return null;
    const col=Math.min(7,Math.floor(p.x/100)),row=Math.min(7,Math.floor(p.y/100));
    const black=getOrientation()==='black';
    const file=String.fromCharCode(97+(black?7-col:col));
    return file+(black?row+1:8-row);
  };
  // Single filled SVG polygon per arrow (no marker joins or dotted seams).
  function arrowPath(a,b){
    const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);
    if(len<20)return '';
    const ux=dx/len,uy=dy/len,nx=-uy,ny=ux;
    const half=8,headHalf=23,headLength=Math.min(45,len*.40);
    const tailInset=12;
    const endX=b.x-ux*16,endY=b.y-uy*16;
    const neckX=endX-ux*headLength,neckY=endY-uy*headLength;
    const startX=a.x+ux*tailInset,startY=a.y+uy*tailInset;
    const points=[
      [startX+nx*half,startY+ny*half],
      [neckX+nx*half,neckY+ny*half],
      [neckX+nx*headHalf,neckY+ny*headHalf],
      [endX,endY],
      [neckX-nx*headHalf,neckY-ny*headHalf],
      [neckX-nx*half,neckY-ny*half],
      [startX-nx*half,startY-ny*half]
    ];
    const p=points.map(([x,y])=>x.toFixed(1)+','+y.toFixed(1));
    return 'M'+p[0]+' L'+p.slice(1).join(' L')+' Z';
  }
  const addArrow=(parent,a,b,opacity=0.9)=>{
    const d=arrowPath(a,b);
    if(d)svg('path',{d,fill:'#f2b72a',opacity,'stroke-linejoin':'round'},parent);
  };
  const paintStatic=()=>{
    staticLayer.replaceChildren();
    for(const square of marks){
      const p=pos(square);if(p)svg('rect',{x:p.x-49,y:p.y-49,width:98,height:98,rx:4,fill:'#e56d4c',opacity:.52},staticLayer);
    }
    for(const line of arrows.values()){
      const a=pos(line.from),b=pos(line.to);
      if(a&&b)addArrow(staticLayer,a,b);
    }
  };
  const paintPreview=()=>{
    frame=0;previewLayer.replaceChildren();
    if(start&&previewPoint){
      const a=pos(start);if(a)addArrow(previewLayer,a,previewPoint,.78);
    }
  };
  const requestPreview=()=>{if(!frame)frame=requestAnimationFrame(paintPreview);};
  const cancelPreview=()=>{if(frame)cancelAnimationFrame(frame);frame=0;previewPoint=null;previewLayer.replaceChildren();};
  const ensureOverlay=()=>{if(!board.contains(overlay))board.appendChild(overlay);};
  const clear=()=>{arrows.clear();marks.clear();paintStatic();cancelPreview();};
  const positionChanged=()=>{
    ensureOverlay();
    const fen=getFen();
    if(lastPosition!==fen){lastPosition=fen;arrows.clear();marks.clear();cancelPreview();}
    paintStatic();
  };
  board.addEventListener('contextmenu',e=>e.preventDefault());
  board.addEventListener('pointerdown',e=>{
    if(e.button!==2||isEditing?.())return;
    const sq=squareOf(e);if(!sq)return;
    e.preventDefault();start=sq;endSquare=sq;pointerId=e.pointerId;
    previewPoint=null;
    try{board.setPointerCapture(pointerId);}catch{}
  });
  board.addEventListener('pointermove',e=>{
    if(!start||e.pointerId!==pointerId)return;
    const point=pointOf(e);if(!point)return;
    endSquare=squareOf(e);
    previewPoint=point;requestPreview();
  });
  const finish=e=>{
    if(!start||e.pointerId!==pointerId)return;
    e.preventDefault();
    const target=squareOf(e)||endSquare||start;
    if(target===start){
      if(marks.has(start))marks.delete(start);else marks.add(start);
    }else{
      const key=start+target;
      if(arrows.has(key))arrows.delete(key);else arrows.set(key,{from:start,to:target});
    }
    start=null;endSquare=null;
    try{board.releasePointerCapture(pointerId);}catch{}
    pointerId=null;cancelPreview();paintStatic();
  };
  board.addEventListener('pointerup',finish);
  board.addEventListener('pointercancel',()=>{
    start=null;endSquare=null;pointerId=null;cancelPreview();
  });
  board.addEventListener('click',e=>{
    if(e.button===0&&(arrows.size||marks.size)&&!isEditing?.())clear();
  },true);
  // Board squares are recreated after moves. Keep the same SVG nodes and reattach only.
  const observer=new MutationObserver(()=>{
    if(!board.contains(overlay))positionChanged();
  });
  observer.observe(board,{childList:true});
  positionChanged();
  return {clear,positionChanged};
}
