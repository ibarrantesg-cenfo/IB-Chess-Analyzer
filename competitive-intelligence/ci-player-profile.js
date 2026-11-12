import {ratingFor,gameReferences,parseCIImport,analyzeCIGames} from './ci-player-intelligence.js';

export function initCIPlayerProfile({host,service}){
 host.className='ci-research';host.hidden=true;
 host.innerHTML=`<div class="ci-research-header"><div><span class="eyebrow">PERFIL COMPETITIVO · EVIDENCIA Y DATOS</span><h3 id="ci-r-name">Seleccioná un rival</h3></div><button class="btn outline" type="button" id="ci-r-refresh">Actualizar estadísticas</button></div>
 <div id="ci-r-rating" class="ci-r-rating"></div>
 <div class="ci-r-layout"><section class="ci-r-section"><h4>Repertorio por partidas verificadas</h4><p class="ci-subtle">Se calcula únicamente a partir de los PGN completos almacenados; las referencias externas no cuentan como partidas analizadas.</p><div id="ci-r-repertoire" class="ci-r-repertoire"></div></section>
 <section class="ci-r-section"><h4>Banco de partidas PGN</h4><div id="ci-r-games" class="ci-r-games"></div></section></div>
 <div class="ci-r-layout"><section class="ci-r-section"><h4>Importar partidas del rival</h4><p class="ci-subtle">Acepta un PGN completo o archivo con varias partidas. Verifica jugadas y que el rival coincida con los encabezados antes de guardar en tu base privada.</p>
 <label>Archivo PGN<input id="ci-r-file" type="file" accept=".pgn,.txt,text/plain,application/x-chess-pgn"/></label>
 <label>Pegar PGN<textarea id="ci-r-pgn" rows="6" placeholder="[Event &quot;Torneo&quot;]&#10;[White &quot;Jugador...&quot;]&#10;[Black &quot;Jugador...&quot;]&#10;[Result &quot;1-0&quot;]&#10;&#10;1. e4 e5 2. Nf3 Nc6 1-0"></textarea></label>
 <label>URL de procedencia (opcional)<input id="ci-r-source" type="url" placeholder="https://..."/></label>
 <div class="ci-actions"><button class="btn primary" id="ci-r-import" type="button">Verificar e importar PGN</button><button class="btn outline" id="ci-r-clear" type="button">Limpiar</button></div>
 <p id="ci-r-status" class="ci-r-status" role="status" aria-live="polite">Sin importaciones pendientes.</p>
 </section><section class="ci-r-section"><h4>Fuentes y partidas localizadas</h4><p class="ci-subtle">Colecciones públicas y torneos donde se pueden consultar las partidas. No se agregan como PGN hasta verificar sus jugadas completas.</p><div id="ci-r-links" class="ci-r-links"></div></section></div>`;
 const el=id=>host.querySelector('#'+id);
 let selected=null,records=[],busy=false,requestId=0;
 const status=(s,error=false)=>{el('ci-r-status').textContent=s;el('ci-r-status').classList.toggle('error',error);};
 const add=(parent,tag,text,cls)=>{const node=document.createElement(tag);node.textContent=text;if(cls)node.className=cls;parent.append(node);return node;};
 function renderRatings(){
  const panel=el('ci-r-rating');panel.replaceChildren();const fid=selected?.fide_id;
  const r=ratingFor(fid);
  for(const [type,label] of [['standard','Clásico'],['rapid','Rápidas'],['blitz','Blitz']]){
   const card=add(panel,'div','', 'ci-r-rating-card');
   add(card,'span',label);
   add(card,'strong',r?.[type]!=null?String(r[type]):'—');
   add(card,'small',r?'FIDE · noviembre 2026':'Pendiente de verificación FIDE');
  }
  if(fid){const link=document.createElement('a');link.href='https://ratings.fide.com/profile/'+encodeURIComponent(fid);link.target='_blank';link.rel='noopener noreferrer';link.textContent='Consultar ficha FIDE oficial · '+fid;panel.append(link);}
 }
 function renderReferences(){
  const panel=el('ci-r-links');panel.replaceChildren();
  const refs=gameReferences(selected?.fide_id);
  if(!refs.length)add(panel,'p','Sin colección de PGN localizada todavía. La ficha FIDE queda disponible arriba.','ci-subtle');
  for(const ref of refs){
   const link=document.createElement('a');link.href=ref.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=ref.label;panel.append(link);
  }
 }
 const showData=(container,entries)=>{
  if(!entries.length)return add(container,'p','Sin partidas verificadas para calcular frecuencias.','ci-subtle');
  for(const value of entries.slice(0,6)){
   const item=add(container,'div','', 'ci-r-line');
   const heading=add(item,'span',value.name);heading.title=value.name;
   add(item,'strong',String(value.n)+' / '+entries.reduce((n,v)=>n+v.n,0));
   const bar=add(item,'div','', 'ci-r-bar');const fill=add(bar,'i','');fill.style.width=(value.n/entries.reduce((n,v)=>n+v.n,0)*100).toFixed(1)+'%';
  }
 };
 function renderStats(){
  const data=analyzeCIGames(records),panel=el('ci-r-repertoire');panel.replaceChildren();
  add(panel,'p',data.valid+' PGN validados · '+data.byColor.w.n+' con blancas · '+data.byColor.b.n+' con negras'+(data.rejected?' · '+data.rejected+' registros ilegibles':''),'ci-r-summary');
  for(const [color,label] of [['w','Con blancas'],['b','Con negras']]){
   const block=add(panel,'div','', 'ci-r-color');
   add(block,'h5',label);
   add(block,'small','Primeras respuestas observadas (muestra: '+data.byColor[color].n+' partidas)');
   showData(block,data.responses[color]);
   add(block,'small','Clasificación ECO según encabezado PGN');
   showData(block,data.openings[color]);
   const c=data.byColor[color];
   add(block,'p',c.n?'Resultados registrados: '+c.wins+' V · '+c.draws+' T · '+c.losses+' D':'Sin resultados importados.','ci-subtle');
  }
 }
 function renderGames(){
  const panel=el('ci-r-games');panel.replaceChildren();
  if(!records.length)return add(panel,'p','Todavía no hay PGN completos registrados para este rival.','ci-subtle');
  for(const game of records.slice(0,60)){
   const row=add(panel,'div','', 'ci-r-game');
   const title=add(row,'strong',game.source_name||'Partida');
   add(row,'small',[(game.played_at||'Fecha desconocida'),game.player_color==='w'?'Rival blancas':'Rival negras'].join(' · '));
   const action=document.createElement('button');action.className='btn outline';action.type='button';action.textContent='Exportar PGN';
   action.onclick=()=>{
    const blob=new Blob([game.pgn],{type:'application/x-chess-pgn'});const uri=URL.createObjectURL(blob),anchor=document.createElement('a');anchor.href=uri;anchor.download='IB_CI_partida_'+String(game.id).slice(0,8)+'.pgn';anchor.click();setTimeout(()=>URL.revokeObjectURL(uri),1500);
   };row.append(action);
  }
  if(records.length>60)add(panel,'small','Mostrando 60 de '+records.length+' partidas. El análisis incluye hasta 500.','ci-subtle');
 }
 async function refresh(){
  if(!selected)return;
  const token=++requestId;
  try{
   const games=await service.listGames(selected.id);
   if(token!==requestId)return;
   records=games;
   renderStats();renderGames();
  }catch(error){if(token===requestId){status('No fue posible cargar partidas: '+error.message,true);records=[];renderStats();renderGames();}}
 }
 async function importPGN(){
  if(!selected||busy)return;
  const raw=el('ci-r-pgn').value.trim();
  if(!raw)return status('Seleccioná un archivo o pegá un PGN con encabezados White y Black.',true);
  let parsed;try{parsed=parseCIImport(raw,selected);}catch(e){return status('Archivo no válido: '+e.message,true);}
  if(!parsed.good.length)return status('No hay partidas válidas para este rival: '+parsed.rejected.map(e=>'#'+e.number+': '+e.reason).slice(0,4).join(' · '),true);
  const confirmText='Importar '+parsed.good.length+' partidas validadas a '+selected.display_name+'?'+(parsed.rejected.length?' Se omitirán '+parsed.rejected.length+' partidas inválidas.':'');
  if(!confirm(confirmText))return status('Importación cancelada.');
  busy=true;el('ci-r-import').disabled=true;
  const failures=[],source=el('ci-r-source').value.trim();let inserted=0,duplicates=0;
  try{
   for(let i=0;i<parsed.good.length;i++){
    status('Guardando partida '+(i+1)+' / '+parsed.good.length+'…');
    try{
     await service.addGame(selected.id,{...parsed.good[i],source_url:source||null});
     inserted++;
    }catch(e){
     if(/duplicate|unique|23505/i.test(e.message))duplicates++;
     else failures.push('#'+(i+1)+': '+e.message);
    }
   }
   await refresh();
   status('Importación: '+inserted+' guardadas, '+duplicates+' duplicadas, '+parsed.rejected.length+' rechazadas'+(failures.length?', '+failures.length+' errores: '+failures.slice(0,2).join(' · '):'.'),failures.length>0);
  }finally{busy=false;el('ci-r-import').disabled=false;}
 }
 el('ci-r-file').onchange=async()=>{
  const file=el('ci-r-file').files?.[0];if(!file)return;
  if(file.size>3_000_000){status('Archivo demasiado grande: máximo 3 MB.',true);return;}
  el('ci-r-pgn').value=await file.text();status('Archivo '+file.name+' cargado. Pulsá Verificar e importar PGN para continuar.');
 };
 el('ci-r-import').onclick=importPGN;
 el('ci-r-clear').onclick=()=>{el('ci-r-file').value='';el('ci-r-pgn').value='';el('ci-r-source').value='';status('Formulario limpio.');};
 el('ci-r-refresh').onclick=refresh;
 return {
  async select(player){
   selected=player||null;host.hidden=!selected;records=[];if(!selected)return;
   el('ci-r-name').textContent=selected.display_name;renderRatings();renderReferences();renderStats();renderGames();status('Fuentes FIDE consultadas. Partidas privadas pendientes de carga.');
   await refresh();
  },
  clear(){selected=null;host.hidden=true;records=[];requestId++;}
 };
}
