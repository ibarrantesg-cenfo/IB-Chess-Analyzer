import { findReview } from './review-cache.js';
import { gameMetrics } from './performance.js';
import { apparentPerformance } from './engine-performance.js';
import { Chess } from 'chess.js';
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
 <div class="library-toolbar"><label class="library-search-label">Buscar estudios<input id="library-query" type="search" placeholder="Jugador, título o alumno…"/></label><label>Ubicación<select id="library-origin"><option value="all">Todos</option><option value="local">Guardados en este navegador</option><option value="cloud">Guardados en la nube</option><option value="shared">Compartidos conmigo</option></select></label><button class="btn outline" id="library-refresh">↻ Actualizar</button><button class="btn primary" id="library-sync">☁ Respaldar estudios en mi cuenta</button></div>
 <div class="library-organize"><input id="library-folder-name" placeholder="Nombre del estudio"/><button class="btn outline" id="library-select-all">Seleccionar partidas sin estudio</button><button class="btn primary" id="library-group">Crear estudio con seleccionadas</button><small id="library-selection-count">0 partidas seleccionadas</small></div><div id="library-counts" class="library-counts"></div><div id="library-back" hidden></div><div id="library-warning" class="library-warning" hidden></div><div id="library-items" class="library-items" aria-live="polite"></div>
 <p class="library-footnote">Local: guardado solamente en este navegador. Nube: accesible con tu cuenta. Solo el propietario puede eliminar un estudio de la nube. Los estudios compartidos por alumnos son de lectura y se corrigen mediante una copia propia.</p>`;
 page.insertBefore(panel,page.querySelector('footer'));
 const $=id=>document.getElementById(id);
 let items=[],userId=null,busy=false,visible=false,openGroup=null;const checked=new Set();
 const str=x=>String(x??'');
 const updateSelected=()=>{const x=$('library-selection-count');if(x)x.textContent=checked.size+' partida(s) seleccionada(s)';};
 const make=(tag,cls,value)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(value!==undefined)el.textContent=value;return el;};
 const showPreview=async entry=>{
   try{
     const pgn=await studio.getLibraryPgn(entry.source,entry.id);
     const chess=new Chess();chess.loadPgn(pgn,{strict:false});
     const history=chess.history(),headers=chess.header();
     const modal=document.createElement('div');modal.className='library-preview-backdrop';
     const inner=make('section','library-preview-modal');
     const heading=make('h3','',entry.title);
     const status=make('div','library-preview-status');
     const board=make('div','library-preview-board');
     const controls=make('div','library-preview-controls');
     const close=make('button','btn outline','Cerrar');
     close.onclick=()=>modal.remove();
     const first=make('button','btn outline','⏮'),prev=make('button','btn outline','◀'),next=make('button','btn outline','▶'),last=make('button','btn outline','⏭');
     let ply=0;const pieces={wk:'♔',wq:'♕',wr:'♖',wb:'♗',wn:'♘',wp:'♙',bk:'♚',bq:'♛',br:'♜',bb:'♝',bn:'♞',bp:'♟'};
     const renderBoard=()=>{
       const c=new Chess();
       for(let i=0;i<ply;i++)c.move(history[i]);
       board.replaceChildren();
       for(let rank=7;rank>=0;rank--)for(let file=0;file<8;file++){
         const square=String.fromCharCode(97+file)+(rank+1),piece=c.get(square);
         const cell=make('div','library-preview-square '+((rank+file)%2===0?'light':'dark'),piece?pieces[piece.color+piece.type]:'');
         board.append(cell);
       }
       status.textContent=(headers.White||'?')+' – '+(headers.Black||'?')+' · '+ply+'/'+history.length+' medias jugadas'+(ply?' · '+history[ply-1]:'');
     };
     first.onclick=()=>{ply=0;renderBoard();};
     prev.onclick=()=>{ply=Math.max(0,ply-1);renderBoard();};
     next.onclick=()=>{ply=Math.min(history.length,ply+1);renderBoard();};
     last.onclick=()=>{ply=history.length;renderBoard();};
     controls.append(first,prev,next,last,close);
     inner.append(heading,status,board,controls);
     if(entry.source==='local'){
       const form=make('div','library-header-editor');
       const fields=[['White','Blancas'],['WhiteTitle','Título blancas (GM, MI, MF, CM, etc.)'],['WhiteElo','Elo blancas'],['Black','Negras'],['BlackTitle','Título negras'],['BlackElo','Elo negras'],['Event','Evento'],['Round','Ronda']];
       const inputs={};
       for(const [key,label] of fields){const l=make('label','',label);const input=document.createElement('input');input.value=headers[key]||'';input.placeholder=label;l.append(input);form.append(l);inputs[key]=input;}
       const resultLabel=make('label','','Resultado');const result=document.createElement('select');
       for(const v of ['*','1-0','0-1','1/2-1/2']){const o=document.createElement('option');o.value=v;o.textContent=v;result.append(o);}
       result.value=headers.Result||'*';resultLabel.append(result);form.append(resultLabel);
       const save=make('button','btn primary','Guardar datos de partida');
       save.onclick=async()=>{try{save.disabled=true;const changes={};for(const [key] of fields)changes[key]=inputs[key].value;changes.Result=result.value;
        const updated=await studio.updateLibraryHeaders(entry.id,changes);heading.textContent=updated.name;await refresh();notify('Datos del PGN actualizados.');modal.remove();}
        catch(e){notify(e.message,'err');}finally{save.disabled=false;}};
       inner.append(form,save);

     }
     modal.append(inner);modal.onclick=e=>{if(e.target===modal)modal.remove();};
     document.body.append(modal);renderBoard();
   }catch(e){notify('No se pudo mostrar el tablero: '+e.message,'err');}
 };
 const reportCache=new Map();
 async function studyReport(entries){
  const fingerprint=entries.map(x=>x.id+':'+x.date).join('|');
  if(reportCache.has(fingerprint))return reportCache.get(fingerprint);
  let completed=0,qualitySum=0,qualityCount=0,played=0;const results={'1-0':0,'0-1':0,'1/2-1/2':0};const apparent=[];
  for(const entry of entries){
    try{
      const chess=new Chess();chess.loadPgn(await studio.getLibraryPgn('local',entry.id),{strict:false});
      const h=chess.header(),review=await findReview({headers:h,moves:chess.history({verbose:true})});
      if(review){
        const metrics=gameMetrics({moves:chess.history({verbose:true})},review);
        if(metrics.w.complete&&metrics.b.complete){
          completed++;
          qualitySum+=metrics.w.quality+metrics.b.quality;qualityCount+=2;for(const side of [metrics.w,metrics.b]){const estimate=apparentPerformance(side);if(Number.isFinite(estimate.value))apparent.push(estimate.value);}
        }
      }
      if(['1-0','0-1','1/2-1/2'].includes(h.Result)){played++;results[h.Result]++;}
    }catch(e){console.warn('Resumen de estudio no disponible',e);}
  }
  const result={completed,total:entries.length,quality:qualityCount?qualitySum/qualityCount:null,played,results,apparent:apparent.length?Math.round(apparent.reduce((a,b)=>a+b,0)/apparent.length):null};
  reportCache.set(fingerprint,result);return result;
 }
 const card=entry=>{
   const wrap=make('article','library-card');
   const header=make('div','library-card-head');
   header.append(make('strong','',entry.title));
   const badge=make('span','library-source '+(entry.shared?'shared':entry.source),entry.shared?'Compartido':entry.source==='cloud'?'En la nube':'Local');
   header.append(badge);wrap.append(header);
   if(entry.source==='local'){const select=make('label','library-checkbox');const check=document.createElement('input');check.type='checkbox';check.checked=checked.has(entry.id);check.onchange=()=>{if(check.checked)checked.add(entry.id);else checked.delete(entry.id);updateSelected();};select.append(check,document.createTextNode(' Seleccionar'));wrap.append(select);}
   wrap.append(make('p','library-subtitle',entry.student));
   const details=make('div','library-game-details','Leyendo datos PGN…');wrap.append(details);
   studio.getLibraryPgn(entry.source,entry.id).then(async pgn=>{
    const chess=new Chess();chess.loadPgn(pgn,{strict:false});const h=chess.header();
    const white=[h.WhiteTitle,h.White].filter(Boolean).join(' ')||'Blancas',black=[h.BlackTitle,h.Black].filter(Boolean).join(' ')||'Negras';
    details.textContent=[white+(h.WhiteElo?' ('+h.WhiteElo+')':''),'vs',black+(h.BlackElo?' ('+h.BlackElo+')':''),'·',h.Result||'*',h.Round?'· Ronda '+h.Round:''].filter(Boolean).join(' ');
    const review=await findReview({headers:h,moves:chess.history({verbose:true})});
    if(review){const m=gameMetrics({moves:chess.history({verbose:true})},review);if(m.w.complete&&m.b.complete)details.textContent+=' · Índice técnico '+((m.w.quality+m.b.quality)/2).toFixed(1)+'/100';}
   }).catch(()=>{details.textContent='Datos PGN no disponibles';});
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
   const previewButton=make('button','btn outline','Ver tablero');previewButton.onclick=()=>showPreview(entry);
   actions.append(previewButton,open,download);
   if(entry.source==='local'){
     const rename=make('button','btn outline','Editar nombre');
     rename.onclick=async()=>{const name=window.prompt('Nombre de la partida',entry.title);if(name===null)return;try{await studio.renameLibraryItem('local',entry.id,name);await refresh();}catch(e){notify(e.message,'err');}};
     actions.append(rename);
   }
   if(entry.source==='local'){
     const remove=make('button','btn outline library-delete','Eliminar local');
     remove.onclick=async()=>{
       if(!window.confirm('¿Eliminar este estudio guardado en este navegador? Esta acción no se puede deshacer.'))return;
       try{await studio.deleteLibraryItem('local',entry.id);notify('Estudio local eliminado.');await refresh();}
       catch(e){notify('No se pudo eliminar: '+e.message,'err');}
     };
     actions.append(remove);
   }
   if(entry.source==='cloud'&&!entry.shared){
     const removeCloud=make('button','btn outline library-delete','Eliminar de la nube');
     removeCloud.onclick=async()=>{
       const agreed=window.confirm('¿Eliminar definitivamente de Supabase el estudio «'+entry.title+'»? Se retirará también a las personas con quienes lo compartiste. Esta operación no se puede deshacer.');
       if(!agreed)return;
       try{
         removeCloud.disabled=true;
         const {cloudDeleteOwned}=await import('./cloud.js');
         await cloudDeleteOwned(entry.id);
         notify('Estudio eliminado de la nube.');
         await refresh();
       }catch(e){notify('No se pudo eliminar de la nube: '+e.message,'err');}
       finally{removeCloud.disabled=false;}
     };
     actions.append(removeCloud);
   }
   wrap.append(actions);return wrap;
 };
 function render(){
  const q=$('library-query').value.trim().toLocaleLowerCase(),filter=$('library-origin').value;
  const filtered=items.filter(x=>(filter==='all'||(filter==='shared'?x.shared:x.source===filter))&&(x.title+' '+x.student+' '+(x.collectionName||'')).toLocaleLowerCase().includes(q));
  const groups=new Map();
  for(const x of filtered){const key=x.collectionId?'collection:'+x.source+':'+x.collectionId:x.source+':'+x.id;if(!groups.has(key))groups.set(key,[]);groups.get(key).push(x);}
  const counts=$('library-counts');counts.replaceChildren();
  for(const [name,count] of [['Estudios',groups.size],['Partidas',items.length],['En nube',items.filter(x=>x.source==='cloud').length],['Compartidos',items.filter(x=>x.shared).length]]){
    const box=make('div','library-stat');box.append(make('strong','',String(count)),make('small','',name));counts.append(box);
  }
  const root=$('library-items');root.replaceChildren();
  const back=$('library-back');back.replaceChildren();back.hidden=!openGroup;
  if(openGroup){
    const all=items.filter(x=>x.collectionId&&('collection:'+x.source+':'+x.collectionId)===openGroup);
    if(!all.length){openGroup=null;render();return;}
    const heading=make('div','library-folder-heading');
    const previous=make('button','btn outline','← Volver');previous.onclick=()=>{openGroup=null;render();};
    const rename=make('button','btn outline','Renombrar estudio');
    rename.onclick=async()=>{const name=window.prompt('Nombre del estudio',all[0].collectionName);if(name===null)return;try{await studio.renameLibraryCollection(all.map(x=>x.id),name);await refresh();}catch(e){notify(e.message,'err');}};
    heading.append(previous,make('h3','',all[0].collectionName||'Estudio'),make('span','',all.length+' partidas'),rename);
    const analyzeStudy=make('button','btn primary','Analizar estudio completo');
    analyzeStudy.onclick=async()=>{
      try{
        analyzeStudy.disabled=true;
        const pgn=await studio.loadCollectionPgn(all.map(x=>x.id));
        if(!window.IB_LOAD_STUDY)throw Error('Módulo de rendimiento no disponible.');
        window.IB_LOAD_STUDY(pgn,all[0].collectionName||'Estudio');
        notify('Estudio cargado. Se inicia el análisis de sus partidas en Rendimiento.');
      }catch(e){notify('No se pudo analizar el estudio: '+e.message,'err');}
      finally{analyzeStudy.disabled=false;}
    };
    if(all[0].source==='local')heading.append(analyzeStudy);back.append(heading);
    const display=all.filter(x=>(filter==='all'||x.source===filter)&&(x.title+' '+(x.collectionName||'')).toLocaleLowerCase().includes(q));
    if(!display.length)root.append(make('div','library-empty','No hay partidas coincidentes.'));
    for(const entry of display)root.append(card(entry));
    return;
  }
  if(!groups.size){root.append(make('div','library-empty',items.length?'Sin resultados.':'Tu biblioteca está vacía.'));return;}
  for(const [key,entries] of groups){
    if(key.startsWith('collection:')){
      const wrap=make('article','library-card library-folder');
      const head=make('div','library-card-head');head.append(make('strong','',entries[0].collectionName||'Estudio'),make('span','library-source local',entries.length+' partidas'));
      wrap.append(head);
      const status=make('p','library-subtitle','Comprobando análisis guardados…');wrap.append(status);
      (entries[0].source==='local'?studyReport(entries):Promise.resolve(null)).then(result=>{if(!result){status.textContent='Estudio en la nube · '+entries.length+' partidas';return;}
        status.textContent=result.completed===result.total?'✓ Análisis del torneo completado · '+result.completed+'/'+result.total+' partidas':'Análisis · '+result.completed+'/'+result.total+' partidas completadas';
        if(result.quality!==null)status.textContent+=' · Índice técnico '+result.quality.toFixed(1)+'/100';
        if(result.apparent!==null)status.textContent+=' · Elo aparente '+result.apparent+' (heurístico)';
        if(result.played)status.textContent+=' · Resultados B/N/T '+result.results['1-0']+'/'+result.results['0-1']+'/'+result.results['1/2-1/2'];
        const report=make('button','btn outline','Ver informe extendido');
        report.onclick=async()=>{try{const pgn=await studio.loadCollectionPgn(entries.map(x=>x.id));window.IB_OPEN_REPORT?.(pgn,entries[0].collectionName||'Estudio');}
         catch(e){notify('No se pudo abrir el informe: '+e.message,'err');}};
        wrap.append(report);
      }).catch(()=>{status.textContent='No se pudo recuperar el resumen del análisis';});
      const open=make('button','btn primary','Abrir estudio');open.onclick=()=>{openGroup=key;render();};wrap.append(open);root.append(wrap);
    }else root.append(card(entries[0]));
  }
 }
 async function refresh(){
  if(busy)return;busy=true;$('library-refresh').disabled=true;
  try{
    const result=await studio.listLibraryItems();
    const account=await import('./cloud.js').then(x=>x.getCloudSession().catch(()=>null));
    userId=account?.user?.id||null;
    items=[
      ...result.locals.map(x=>({source:'local',id:x.id,title:str(x.name||'Estudio sin nombre'),student:str(x.student||'Sin alumno'),date:x.updated,shared:false,collectionId:x.collectionId||null,collectionName:x.collectionName||null})),
      ...result.remote.map(x=>({source:'cloud',id:x.id,title:str(x.title||'Estudio sin nombre'),student:str(x.student_label||'Sin alumno'),date:x.updated_at,shared:x.owner_id!==userId,collectionId:x.payload?.collectionId||null,collectionName:x.payload?.collectionName||null}))
    ].sort((a,b)=>str(b.date).localeCompare(str(a.date)));
    const warn=$('library-warning');
    warn.hidden=!result.error;warn.textContent=result.error?'No se pudo consultar la nube: '+result.error:'';
    render();updateSelected();
  }catch(e){notify('Error en biblioteca: '+e.message,'err');}
  finally{busy=false;$('library-refresh').disabled=false;}
 }
 function switchView(toLibrary){
  visible=toLibrary;
  panel.hidden=!toLibrary;layout.hidden=toLibrary;toolbar.hidden=toLibrary;tools.hidden=toLibrary;
  home.classList.toggle('active',!toLibrary);nav.classList.toggle('active',toLibrary);
  title.innerHTML=toLibrary?'Biblioteca PGN <span class="version">WEB v2.9</span>':'Game Review <span class="version">WEB v2.9</span>';
  description.textContent=toLibrary?'Todos tus estudios de ajedrez, organizados en un solo lugar.':'Importá una partida, explorá cada decisión y dejá que Stockfish evalúe las posiciones.';
  if(toLibrary)refresh();
  window.scrollTo?.(0,0);
 }
 home.onclick=()=>switchView(false);
 nav.onclick=()=>switchView(true);
 $('library-refresh').onclick=refresh;
 $('library-sync').onclick=async()=>{try{
  const button=$('library-sync');button.disabled=true;
  const result=await studio.syncLocalLibrary();await refresh();
  notify('Respaldo: '+result.uploaded+' estudios subidos · '+result.skipped+' existentes sin sobrescribir.'+(result.errors.length?' Errores: '+result.errors.slice(0,2).join(' | '):''));
 }catch(e){notify('No se pudo respaldar: '+e.message,'err');}finally{$('library-sync').disabled=false;}};

 $('library-select-all').onclick=()=>{for(const x of items)if(x.source==='local'&&!x.collectionId)checked.add(x.id);render();updateSelected();};
 $('library-group').onclick=async()=>{
  if(!checked.size)return notify('Seleccioná partidas locales para agrupar.','err');
  const name=$('library-folder-name').value.trim();
  try{const count=await studio.organizeLibraryItems([...checked],name);checked.clear();$('library-folder-name').value='';await refresh();updateSelected();notify(count+' partidas agrupadas en '+name+'.');}
  catch(e){notify('No se pudo agrupar: '+e.message,'err');}
 };
 $('library-query').oninput=render;
 $('library-origin').onchange=render;
 $('library-import-file').onchange=async e=>{
   const files=[...e.target.files||[]];e.target.value='';
   if(!files.length)return;
   let added=0,invalid=0;
   for(const file of files){
     try{const result=await studio.importLibraryPgn(await file.text(),'Sin alumno',file.name.replace(/\.(pgn|txt)$/i,''));added+=result.inserted;invalid+=result.invalid;}
     catch(err){invalid++;notify('No se pudo importar '+file.name+': '+err.message,'err');}
   }
   await refresh();
   notify(added+' partida(s) guardadas en biblioteca local'+(invalid?' · '+invalid+' omitidas':'')+'.');
 };
 return {refresh,open:()=>switchView(true),close:()=>switchView(false)};
}
