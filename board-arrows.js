// Classroom board annotations: right-drag arrows, right-click square marks.
// Drawing is independent of the PGN, Stockfish engine and study editor.
export function initBoardArrows({getFen,getOrientation,isEditing}){
 const board=document.getElementById('board');
 if(!board)return null;
 const svgns='http://www.w3.org/2000/svg',arrows=new Map(),marks=new Set();
 let start=null,end=null,pointer=null,lastPosition='',preview=null;
 const squareOf=(event)=>{
   const element=document.elementFromPoint(event.clientX,event.clientY);
   if(!element||!board.contains(element))return null;
   return element.closest('.square')?.getAttribute('title')||null;
 };
 const pos=s=>{
   const file=s.charCodeAt(0)-97,rank=Number(s[1])-1;
   if(file<0||file>7||rank<0||rank>7)return null;
   const reverse=getOrientation()==='black';
   return {x:(reverse?7-file:file)*100+50,y:(reverse?rank:7-rank)*100+50};
 };
 const create=(tag,attrs,parent)=>{
   const el=document.createElementNS(svgns,tag);
   for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));
   parent.appendChild(el);return el;
 };
 const overlay=document.createElementNS(svgns,'svg');
 overlay.setAttribute('class','board-arrows');
 overlay.setAttribute('viewBox','0 0 800 800');
 overlay.setAttribute('aria-hidden','true');
 overlay.setAttribute('preserveAspectRatio','none');
 const draw=()=>{
   if(!board.contains(overlay))board.appendChild(overlay);
   overlay.replaceChildren();
   const defs=create('defs',{},overlay);
   const marker=create('marker',{id:'ib-arrow-head',viewBox:'0 0 10 10',refX:8.6,refY:5,markerWidth:4.2,markerHeight:4.2,orient:'auto-start-reverse'},defs);
   create('path',{d:'M 0 0 L 10 5 L 0 10 z',fill:'#f2b72a'},marker);
   for(const s of marks){
     const p=pos(s);if(!p)continue;
     create('rect',{x:p.x-47,y:p.y-47,width:94,height:94,fill:'rgba(225, 93, 67, 0.48)',rx:2},overlay);
   }
   const strokes=[...arrows.values()];
   if(preview&&preview.from!==preview.to)strokes.push(preview);
   for(const line of strokes){
     const a=pos(line.from),b=pos(line.to);if(!a||!b)continue;
     const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy)||1;
     const x2=b.x-dx/len*28,y2=b.y-dy/len*28;
     create('line',{x1:a.x,y1:a.y,x2,y2,stroke:'#f2b72a','stroke-width':16,'stroke-linecap':'round',opacity:.88,'marker-end':'url(#ib-arrow-head)'},overlay);
   }
 };
 const clear=()=>{arrows.clear();marks.clear();preview=null;draw();};
 const positionChanged=()=>{
   const key=getFen();
   if(key!==lastPosition){lastPosition=key;arrows.clear();marks.clear();preview=null;}
   draw();
 };
 board.addEventListener('contextmenu',e=>{if(board.contains(e.target)){e.preventDefault();}});
 board.addEventListener('pointerdown',e=>{
   if(e.button!==2||isEditing?.())return;
   const sq=squareOf(e);
   if(!sq)return;
   e.preventDefault();start=sq;end=sq;pointer=e.pointerId;
   try{board.setPointerCapture(e.pointerId);}catch{}
 });
 board.addEventListener('pointermove',e=>{
   if(start===null||e.pointerId!==pointer)return;
   const sq=squareOf(e);
   if(!sq)return;
   end=sq;preview=end!==start?{from:start,to:end}:null;draw();
 });
 const finish=e=>{
   if(start===null||e.pointerId!==pointer)return;
   e.preventDefault();
   const target=squareOf(e)||end||start;
   if(target===start){if(marks.has(start))marks.delete(start);else marks.add(start);}
   else{const key=start+target;if(arrows.has(key))arrows.delete(key);else arrows.set(key,{from:start,to:target});}
   start=null;end=null;pointer=null;preview=null;
   try{board.releasePointerCapture(e.pointerId);}catch{}
   draw();
 };
 board.addEventListener('pointerup',finish);
 board.addEventListener('pointercancel',()=>{start=null;pointer=null;preview=null;draw();});
 board.addEventListener('click',e=>{if(e.button===0&&(arrows.size||marks.size)&&!isEditing?.())clear();},true);
 // Squares are recreated each move; the persistent SVG must be re-attached.
 const observer=new MutationObserver(()=>{if(!board.contains(overlay))positionChanged();});
 observer.observe(board,{childList:true});
 positionChanged();
 return {clear,positionChanged};
}
