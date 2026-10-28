// Library workspace combining local IndexedDB studies and authorized Supabase studies.
// The Studio module remains the single source of truth for reads and opening games.
export function initLibraryWorkspace({studio,notify,onOpen}){
 const page=document.querySelector('main.main');
 const layout=page.querySelector('.layout');
 const home=document.querySelector('#nav-review'),nav=document.querySelector('#nav-library');
 const title=page.querySelector('.topbar h1'),description=page.querySelector('.topbar p');
 const toolbar=page.querySelector('.toolbar'),tools=page.querySelector('.workspace-tools');
 const panel=document.createElement('section');panel.className='library-workspace';panel.hidden=true;
 panel.innerHTML=`<header class="library-header"><div><div class="eyebrow">IB CHESS ACADEMY · BIBLIOTECA</div><h2>Mis partidas y estudios</h2><p>Buscá, abrí y exportá tus estudios locales o sincronizados. Los compartidos respetan los permisos de Supabase.</p></div><label class="btn primary library-upload">＋ Importar PGN a biblioteca<input type="file" id="library-import-file" accept=".pgn,.txt" multiple hidden/></label></header>
 <div class="library-toolbar"><label class="library-search-label">Buscar estudios<input id="library-query" type="search" placeholder="Jugador, título o alumno…"/></label><label>Ubicación<select id="library-origin"><option value="all">Todos</option><option value="local">Guardados en este navegador</option><option value="cloud">Guardados en la nube</option><option value="shared">Compartidos conmigo</option></select></label><button class="btn outline" id="library-refresh">↻ Actualizar</button></div>
 <div id="library-counts" class="library-counts"></div><div id="library-warning" class="library-warning" hidden></div><div id="library-items" class="library-items" aria-live="polite"></div>
 <p class="library-footnote">Local: guardado solamente en este navegador. Nube: accesible con tu cuenta. Los estudios compartidos no se pueden sobrescribir desde la biblioteca; abrilos para corregirlos mediante una copia propia.</p>`;
 page.insertBefore(panel,page.querySelector('footer'));
 const $=id=>document.getElementById(id);
 let items=[],userId=null,busy=false,visible=false;
 const str=x=>String(x??'');
 const make=(tag,cls,value)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(value!==undefined)el.textContent=value;return el;};
 const card=entry=>{
   const wrap=make('article','library-card');
   const header=make('div','library-card-head');
   header.append(make('strong','',entry.title));
   const badge=make('span','library-source '+(entry.shared?'shared':entry.source),entry.shared?'Compartido':entry.source==='cloud'?'En la nube':'Local');
   header.append(badge);wrap.append(header);
   wrap.append(make('p','library-subtitle',entry.student));
   const metadata=make('small','library-card-date',entry.date?new Date(entry.date).toLocaleDateString('es-CR'):'Sin fecha');
   wrap.append(metadata);
   const actions=make('div','library-card-actions');
   const open=make('button','btn primary','Abrir y analizar');
   const download=make('button','btn outline','Descargar PGN');
   open.onclick=async()=>{try{open.disabled=true;await studio.openLibraryItem(entry.source,entry.id);switchView(false);onOpen?.();notify('Estudio abierto en Game Review.');}
     catch(e){notify('No se pudo abrir: '+e.message,'err');}finally{open.disabled=false;}};
   download.onclick=async()=>{try{
     const pgn=await studio.getLibraryPgn(entry.source,entry.id);
     if(!pgn)throw Error('Este estudio no contiene un PGN.');
     const url=URL.createObjectURL(new Blob([pgn],{type:'application/x-chess-pgn;charset=utf-8'}));
     const a=document.createElement('a');a.href=url;a.download='IB_'+entry.title.replace(/[^a-z0-9_-]+/gi,'_').slice(0,65)+'.pgn';a.click();
     setTimeout(()=>URL.revokeObjectURL(url),1500);
   }catch(e){notify('No se pudo exportar: '+e.message,'err');}};
   actions.append(open,download);
   if(entry.source==='local'){
     const remove=make('button','btn outline library-delete','Eliminar local');
     remove.onclick=async()=>{
       if(!window.confirm('¿Eliminar este estudio guardado en este navegador? Esta acción no se puede deshacer.'))return;
       try{await studio.deleteLibraryItem('local',entry.id);notify('Estudio local eliminado.');await refresh();}
       catch(e){notify('No se pudo eliminar: '+e.message,'err');}
     };
     actions.append(remove);
   }
   wrap.append(actions);return wrap;
 };
 function render(){
  const q=$('library-query').value.trim().toLocaleLowerCase(),filter=$('library-origin').value;
  const shown=items.filter(x=>(filter==='all'||(filter==='shared'?x.shared:x.source===filter))&&(x.title+' '+x.student).toLocaleLowerCase().includes(q));
  const counts=$('library-counts');counts.replaceChildren();
  for(const [name,count] of [['Estudios',items.length],['Locales',items.filter(x=>x.source==='local').length],['En nube',items.filter(x=>x.source==='cloud').length],['Compartidos',items.filter(x=>x.shared).length]]){
    const box=make('div','library-stat');box.append(make('strong','',String(count)),make('small','',name));counts.append(box);
  }
  const root=$('library-items');root.replaceChildren();
  if(!shown.length){
    const empty=make('div','library-empty',items.length?'No encontramos estudios con estos filtros.':'Tu biblioteca está vacía. Importá un PGN y guardalo desde el editor para comenzar.');
    root.append(empty);
  }else for(const entry of shown)root.append(card(entry));
 }
 async function refresh(){
  if(busy)return;busy=true;$('library-refresh').disabled=true;
  try{
    const result=await studio.listLibraryItems();
    const account=await import('./cloud.js').then(x=>x.getCloudSession().catch(()=>null));
    userId=account?.user?.id||null;
    items=[
      ...result.locals.map(x=>({source:'local',id:x.id,title:str(x.name||'Estudio sin nombre'),student:str(x.student||'Sin alumno'),date:x.updated,shared:false})),
      ...result.remote.map(x=>({source:'cloud',id:x.id,title:str(x.title||'Estudio sin nombre'),student:str(x.student_label||'Sin alumno'),date:x.updated_at,shared:x.owner_id!==userId}))
    ].sort((a,b)=>str(b.date).localeCompare(str(a.date)));
    const warn=$('library-warning');
    warn.hidden=!result.error;warn.textContent=result.error?'No se pudo consultar la nube: '+result.error:'';
    render();
  }catch(e){notify('Error en biblioteca: '+e.message,'err');}
  finally{busy=false;$('library-refresh').disabled=false;}
 }
 function switchView(toLibrary){
  visible=toLibrary;
  panel.hidden=!toLibrary;layout.hidden=toLibrary;toolbar.hidden=toLibrary;tools.hidden=toLibrary;
  home.classList.toggle('active',!toLibrary);nav.classList.toggle('active',toLibrary);
  title.innerHTML=toLibrary?'Biblioteca PGN <span class="version">WEB v2.8</span>':'Game Review <span class="version">WEB v2.8</span>';
  description.textContent=toLibrary?'Todos tus estudios de ajedrez, organizados en un solo lugar.':'Importá una partida, explorá cada decisión y dejá que Stockfish evalúe las posiciones.';
  if(toLibrary)refresh();
  window.scrollTo?.(0,0);
 }
 home.onclick=()=>switchView(false);
 nav.onclick=()=>switchView(true);
 $('library-refresh').onclick=refresh;
 $('library-query').oninput=render;
 $('library-origin').onchange=render;
 $('library-import-file').onchange=async e=>{
   const files=[...e.target.files||[]];e.target.value='';
   if(!files.length)return;
   let added=0,invalid=0;
   for(const file of files){
     try{const result=await studio.importLibraryPgn(await file.text());added+=result.inserted;invalid+=result.invalid;}
     catch(err){invalid++;notify('No se pudo importar '+file.name+': '+err.message,'err');}
   }
   await refresh();
   notify(added+' partida(s) guardadas en biblioteca local'+(invalid?' · '+invalid+' omitidas':'')+'.');
 };
 return {refresh,open:()=>switchView(true),close:()=>switchView(false)};
}
