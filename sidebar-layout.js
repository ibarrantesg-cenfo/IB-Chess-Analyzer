const KEY='ib-chess-sidebar-collapsed-v1';

export function savedSidebarPreference(storage){
 try{return storage?.getItem(KEY)==='1';}catch{return false;}
}

export function initSidebarLayout(){
 const shell=document.querySelector('.shell');
 const sidebar=document.getElementById('app-sidebar');
 const desktopToggle=document.getElementById('sidebar-toggle');
 const mobileToggle=document.getElementById('sidebar-mobile-toggle');
 const scrim=document.getElementById('sidebar-scrim');
 if(!shell||!sidebar||!desktopToggle||!mobileToggle||!scrim)return {collapse(){},expand(){}};

 const media=window.matchMedia('(max-width: 800px)');
 let collapsed=savedSidebarPreference(window.localStorage);
 let mobileOpen=false;
 const links=[...sidebar.querySelectorAll('a.nav')];
 for(const link of links){
  const label=link.querySelector('span')?.textContent?.trim()||link.textContent.trim();
  link.setAttribute('aria-label',label);
  link.setAttribute('data-tooltip',label);
  link.title=label+' · Ctrl + clic para nueva pestaña';
 }
 function apply(){
  const mobile=media.matches;
  shell.classList.toggle('sidebar-collapsed',!mobile&&collapsed);
  shell.classList.toggle('sidebar-mobile-open',mobile&&mobileOpen);
  desktopToggle.setAttribute('aria-expanded',String(mobile?mobileOpen:!collapsed));
  desktopToggle.setAttribute('aria-label',mobile?'Cerrar menú':collapsed?'Expandir menú lateral':'Contraer menú lateral');
  desktopToggle.title=mobile?'Cerrar menú':collapsed?'Expandir menú':'Contraer menú';
  const glyph=desktopToggle.querySelector('.sidebar-toggle-icon');
  if(glyph)glyph.textContent=mobile?'✕':collapsed?'»':'«';
  const label=desktopToggle.querySelector('.sidebar-toggle-label');
  if(label)label.textContent=collapsed&&!mobile?'Expandir menú':'Contraer menú';
  mobileToggle.setAttribute('aria-expanded',String(mobile&&mobileOpen));
  mobileToggle.setAttribute('aria-label',mobileOpen?'Cerrar navegación':'Abrir navegación');
  scrim.hidden=!(mobile&&mobileOpen);
 }
 function setCollapsed(next){
  collapsed=Boolean(next);
  try{window.localStorage.setItem(KEY,collapsed?'1':'0');}catch{/* Safari private mode can block storage. */}
  apply();
 }
 function closeMobile(){
  if(!mobileOpen)return;
  mobileOpen=false;apply();
 }
 desktopToggle.addEventListener('click',()=>{
  if(media.matches)closeMobile();
  else setCollapsed(!collapsed);
 });
 mobileToggle.addEventListener('click',()=>{mobileOpen=!mobileOpen;apply();});
 scrim.addEventListener('click',closeMobile);
 document.addEventListener('keydown',event=>{if(event.key==='Escape')closeMobile();});
 for(const link of links)link.addEventListener('click',event=>{
  if(event.button===0&&!event.ctrlKey&&!event.metaKey&&!event.shiftKey&&!event.altKey)closeMobile();
 });
 const onBreakpoint=()=>{mobileOpen=false;apply();};
 if(media.addEventListener)media.addEventListener('change',onBreakpoint);
 else media.addListener(onBreakpoint);
 window.addEventListener('storage',event=>{
  if(event.key!==KEY)return;
  collapsed=event.newValue==='1';apply();
 });
 apply();
 return {collapse:()=>setCollapsed(true),expand:()=>setCollapsed(false),closeMobile};
}
