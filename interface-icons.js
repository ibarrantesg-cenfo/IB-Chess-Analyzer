// Stable SVG controls inherit the surrounding theme instead of OS emoji colors.
const paths={
 refresh:'M20 7v6h-6M4 17v-6h6M6 6a8 8 0 0 1 14 7M18 18a8 8 0 0 1-14-7',
 upload:'M12 16V3m-5 5 5-5 5 5M4 15v6h16v-6',download:'M12 3v13m-5-5 5 5 5-5M4 17v4h16v-4',
 plus:'M12 4v16M4 12h16',close:'m5 5 14 14M19 5 5 19',
 cloud:'M6 18a4 4 0 0 1-1-8 7 7 0 0 1 13-2 5 5 0 0 1 0 10Z',share:'M12 16V3m-5 5 5-5 5 5M4 12v9h16v-9',
 paste:'M9 4H5v17h14V4h-4M9 2h6v5H9Z',spark:'m12 3 3 6 6 3-6 3-3 6-3-6-6-3 6-3Z',
 first:'M5 5v14M19 5l-9 7 9 7Z',back:'m15 5-9 7 9 7Z',next:'m9 5 9 7-9 7Z',last:'M19 5v14M5 5l9 7-9 7Z',
 flip:'M7 4v16m-3-3 3 3 3-3M17 20V4m-3 3 3-3 3 3',
 review:'M9 3h6v4l3 3v3H6v-3l3-3ZM6 17h12M5 21h14M8 13v4m8-4v4',
 openings:'M4 3h6v18H4ZM14 3h6v18h-6M7 7h0m10 0h0',
 library:'M4 4h16v16H4ZM8 8h8M8 12h8M8 16h5',
 reports:'M4 20V4m0 16h16M8 16v-5m5 5V7m5 9V3',
 academic:'m3 7 9-4 9 4-9 4ZM6 9v7c4 3 8 3 12 0V9M21 7v8',
 academy:'M3 21V7h18v14M7 7V3h10v4M7 11h2m6 0h2M7 15h2m6 0h2M10 21v-3h4v3',
 preferences:'M9 4V2m6 20v-2M4 9H2m20 6h-2M5 5l2 2m10 10 2 2M19 5l-2 2M7 17l-2 2M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 5a7 7 0 1 1 0 14 7 7 0 0 1 0-14',
 edit:'m14 5 5 5M4 20l5-1L20 8l-5-5L4 14Z',external:'M14 3h7v7m0-7L10 14M10 3H3v18h18v-7'
};
function icon(name){
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
 for(const [key,value] of Object.entries({viewBox:'0 0 24 24',fill:'none',stroke:'currentColor','stroke-width':1.8,'stroke-linecap':'round','stroke-linejoin':'round','aria-hidden':'true',focusable:'false',class:'ui-icon'}))svg.setAttribute(key,value);
 const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',paths[name]);svg.append(path);return svg;
}
export function initInterfaceIcons(){
 for(const [id,name] of Object.entries({'nav-review':'review','nav-openings':'openings','nav-library':'library','nav-reports':'reports','nav-academic':'academic','nav-academy':'academy','nav-academy-analytics':'reports','nav-preferences':'preferences'})){
  const el=document.getElementById(id);if(!el)continue;
  for(const node of [...el.childNodes])if(node.nodeType===3)node.remove();
  el.prepend(icon(name));
 }
 for(const [id,name,label] of [['first','first','Inicio'],['back','back','Anterior'],['next','next','Siguiente'],['last','last','Final'],['flip','flip','Girar tablero'],['v-prev','back','Anterior en la variante'],['v-next','next','Siguiente en la variante']]){
  const el=document.getElementById(id);if(!el)continue;el.replaceChildren(icon(name));el.setAttribute('aria-label',label);
 }
 for(const el of document.querySelectorAll('.player-edit'))el.replaceChildren(icon('edit'));
 const external=document.getElementById('opening-lab-study-link');
 if(external){external.textContent='Abrir en otra pestaña';external.prepend(icon('external'));}
 for(const el of document.querySelectorAll('.player .avatar')){
  const black=el.closest('.player')?.querySelector('#black-name');
  const img=document.createElement('img');img.src=import.meta.env.BASE_URL+'pieces/cburnett/'+(black?'bK':'wK')+'.svg';img.alt='';img.width=28;img.height=28;
  el.replaceChildren(img);el.classList.add('chess-avatar');
 }
 const actionSelector='button,.btn,.upload,summary,summary strong';
 const glyphIcons={'♟':'review','↻':'refresh','↥':'upload','↗':'external','↓':'download','⇅':'flip','⏮':'first','◀':'back','▶':'next','⏭':'last','✎':'edit','✦':'spark','▤':'library','⌁':'paste','☁':'cloud','⇧':'share','＋':'plus'};
 const decorate=el=>{
  if(!el.matches?.(actionSelector))return;
  const text=[...el.childNodes].find(n=>n.nodeType===3&&n.textContent.trim());if(!text)return;
  const glyph=text.textContent.trimStart()[0],name=glyphIcons[glyph];if(!name)return;
  if(!el.getAttribute('aria-label')&&!text.textContent.trim().slice(1).trim())el.setAttribute('aria-label',el.title||name);
  text.textContent=text.textContent.replace(glyph,'').trimStart();el.insertBefore(icon(name),text);
 };
 document.querySelectorAll(actionSelector).forEach(decorate);
 // Newly rendered study actions get the same treatment, without replacing controls/handlers.
 const observer=new MutationObserver(records=>{
  for(const record of records){decorate(record.target);for(const node of record.addedNodes){if(node.nodeType!==1)continue;decorate(node);node.querySelectorAll(actionSelector).forEach(decorate);}}
 });
 observer.observe(document.body,{childList:true,subtree:true});
 // Explicit color identity in the board editor, independent of the UI theme.
 for(const el of document.querySelectorAll('#studio-palette [data-piece]')){
  const code=el.dataset.piece;if(code==='empty')continue;
  const img=document.createElement('img');img.src=import.meta.env.BASE_URL+'pieces/cburnett/'+code+'.svg';img.alt=code;img.width=30;img.height=30;
  el.replaceChildren(img);
 }
}
