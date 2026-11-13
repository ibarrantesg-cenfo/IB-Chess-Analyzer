import {ratingFor,gameReferences,parseCIImport,analyzeCIGames} from './ci-player-intelligence.js';
import {findUniversityCandidate} from './ci-university-data.js';
import {createCIGameIndex,gameFilterOptions,filterCIGames,ciFilterStats} from './ci-game-explorer.js';
import {dossierCoverage} from './ci-dossier-coverage.js';
import {tournamentSourcesFor,olympiadScoresFor,CI_SOURCE_STATUS} from './ci-tournament-sources.js';

export function initCIPlayerProfile({host,service}){
 host.className='ci-research';host.hidden=true;
 host.innerHTML=`<div class="ci-research-header"><div><span class="eyebrow">PERFIL COMPETITIVO · EVIDENCIA Y DATOS</span><h3 id="ci-r-name">Seleccioná un rival</h3></div><button class="btn outline" type="button" id="ci-r-refresh">Actualizar estadísticas</button></div>
 <div id="ci-r-rating" class="ci-r-rating"></div><div id="ci-r-coverage" class="ci-r-coverage" role="status"></div><details class="ci-dossier-audit"><summary>Estado del expediente y próximos datos por investigar</summary><div id="ci-r-audit"></div></details>
 <section id="ci-r-events" class="ci-r-section" hidden><h4>Historial de torneos y fuentes</h4><p class="ci-subtle">Registros públicos vinculados por FIDE ID, incluso fuera del ámbito universitario. Las inscripciones no equivalen a partidas PGN. Se incluyen enlaces a planillas individuales cuando existen.</p><div id="ci-r-events-list" class="ci-r-events-list"></div></section>
 <section id="ci-r-dossier" class="ci-r-section" hidden><h4>Informe de preparación · evidencia pública</h4><div id="ci-r-dossier-body"></div></section>
 <div class="ci-r-layout"><section class="ci-r-section"><h4>Repertorio por partidas verificadas</h4><p class="ci-subtle">Se calcula únicamente a partir de los PGN completos almacenados; las referencias externas no cuentan como partidas analizadas.</p><div id="ci-r-repertoire" class="ci-r-repertoire"></div></section>
 <section class="ci-r-section"><h4>Banco de partidas PGN</h4><p class="ci-subtle">Explorá exclusivamente las partidas completas guardadas en la base privada. Los filtros no alteran el expediente.</p>
 <div class="ci-game-filters">
  <label>Buscar <input id="ci-game-query" type="search" placeholder="Rival, evento, ECO o jugadas"/></label>
  <label>Año <select id="ci-game-year"><option value="all">Todos</option></select></label>
  <label>Torneo <select id="ci-game-event"><option value="all">Todos</option></select></label>
  <label>Color <select id="ci-game-color"><option value="all">Ambos</option><option value="w">Blancas</option><option value="b">Negras</option></select></label>
  <label>Resultado <select id="ci-game-result"><option value="all">Todos</option><option value="win">Victoria</option><option value="draw">Tablas</option><option value="loss">Derrota</option><option value="unknown">Sin resultado</option></select></label>
  <label>ECO <select id="ci-game-eco"><option value="all">Todos</option></select></label>
 </div>
 <p id="ci-game-count" class="ci-r-summary" role="status"></p>
 <div id="ci-r-games" class="ci-r-games"></div></section></div>
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
  const historic=findUniversityCandidate(selected);
  for(const [type,label] of [['standard','Clásico'],['rapid','Rápidas'],['blitz','Blitz']]){
   const card=add(panel,'div','', 'ci-r-rating-card');
   const monthly=r?.[type],historicValue=historic?.ratings?.[type];
   add(card,'span',label);
   add(card,'strong',monthly!=null?String(monthly):historicValue!=null?String(historicValue):'—');
   add(card,'small',monthly!=null?'FIDE · noviembre 2026':historicValue!=null?'JUNCOS · ranking inicial octubre 2026':'Elo pendiente de verificar');
  }
  if(fid){const link=document.createElement('a');link.href='https://ratings.fide.com/profile/'+encodeURIComponent(fid);link.target='_blank';link.rel='noopener noreferrer';link.textContent='Consultar ficha FIDE oficial · '+fid;panel.append(link);}
 }
 function renderEventSources(){
  const id=selected?.fide_id;
  const tournaments=tournamentSourcesFor(id),scores=olympiadScoresFor(id);
  const panel=el('ci-r-events'),list=el('ci-r-events-list');
  list.replaceChildren();panel.hidden=!tournaments.length;
  if(!tournaments.length)return;
  const overview=add(list,'p',tournaments.length+' torneos o listas identificadas · '+scores.length+' planillas individuales enlazadas. Estos registros NO incrementan el contador de PGN almacenados.','ci-r-source-note');
  for(const event of tournaments){
   const row=add(list,'div','', 'ci-r-event');
   const title=document.createElement('a');title.textContent=event.title;title.href=event.url;title.target='_blank';title.rel='noopener noreferrer';row.append(title);
   add(row,'small',event.date+' · '+event.timeControl+' · '+CI_SOURCE_STATUS[event.status]);
  }
  if(scores.length){
   const details=document.createElement('details');details.className='ci-r-score-details';
   const summary=document.createElement('summary');summary.textContent='Olimpiada de Samarcanda: '+scores.length+' planillas individuales';details.append(summary);
   for(const game of scores){
    const row=add(details,'div','', 'ci-r-event');
    const a=document.createElement('a');a.href=game.url;a.target='_blank';a.rel='noopener noreferrer';
    a.textContent='Ronda '+game.round+' · '+game.opponent+' · '+(game.color==='w'?'Blancas':'Negras')+' · '+game.result;
    row.append(a);
    add(row,'small',game.date+' · Planilla pública; PGN no importado todavía');
   }
   list.append(details);
  }
 }
 function renderDossier(){
  const block=el('ci-r-dossier'),body=el('ci-r-dossier-body');
  body.replaceChildren();
  const isDavid=String(selected?.fide_id||'')==='6507522';
  block.hidden=!isDavid;
  if(!isDavid)return;
  const sections=[
   ['Identificación','FM David Alejandro Cabezas Solano · UCR · FIDE 6507522. Campeón Nacional Absoluto de Costa Rica 2026 (10,5/11). Subcampeón Centroamericano y del Caribe U20 2024.'],
   ['Muestra externa de aperturas','Un índice externo de 142 partidas registra 57 primeras jugadas con blancas: 26 con Cf3, 22 con d4, 6 con g3, 2 con e4 y 1 con c4. Muestra parcial: no confundir con porcentajes de todas sus partidas.'],
   ['Respuesta con negras','En la colección externa aparece Siciliana en 42 partidas de distintos colores; existen partidas concretas con ...c5 frente a 1.e4. No se ha verificado estadísticamente toda su distribución por variantes.'],
   ['Antecedente directo','Una base de partidas indexa Cabezas–Barrantes del 15 de octubre de 2026: 1.Cf3 Cf6 2.g3 g6 3.b3 Ag7. El resultado reportado es victoria de David; corroborar el PGN íntegro antes de analizar errores.'],
   ['Preparación sugerida','Si David conduce blancas, revisar sistemas Réti/Catalana con Cf3, g3, d4 y transposiciones. Si conduce negras, preparar respuesta específica a la Siciliana, sin asumir una Najdorf fija. Priorizar estudio de partidas completas y finales largos.'],
   ['Calidad de datos','El repertorio cuantitativo de esta pantalla se calcula únicamente cuando importés PGN completos y verificados. Los datos anteriores son investigación pública con sus fuentes, no partidas almacenadas ni diagnóstico del motor.']
  ];
  for(const [heading,detail] of sections){
   const section=add(body,'div','', 'ci-r-color');add(section,'h5',heading);add(section,'p',detail,'ci-subtle');
  }
  const sources=[
   ['FCA · Campeonato Nacional 2026','https://fcacostarica.com/campeonato-nacional-mayor-absoluto-y-femenino-2026/'],
   ['Chess.com · partidas públicas','https://www.chess.com/games/david-alejandro-cabezas-solano'],
   ['Base externa · 142 partidas','https://chess.com.im/db/player_profile.php?fide_id=6507522'],
   ['JUNCOS 2026 · inscripción','https://s2.chess-results.com/tnr1516373.aspx?SNode=S0&lan=21'],
   ['Olimpiada 2026 · resultados','https://ply.fun/olympiad-2026/open/players/6507522']
  ];
  const links=add(body,'div','', 'ci-r-links');
  for(const [title,url] of sources){const a=document.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=title;links.append(a);}
 }
 function renderCoverage(){
  const panel=el('ci-r-coverage');panel.replaceChildren();
  const fide=String(selected?.fide_id||'');
  const monthly=ratingFor(fide),historical=findUniversityCandidate(selected),sources=gameReferences(fide);
  const cells=[
   ['Identidad',fide?'FID identificado':'ID FIDE pendiente',Boolean(fide)],
   ['Elo',monthly?'FIDE nov. 2026':historical&&Object.keys(historical.ratings).length?'JUNCOS histórico':'Sin rating verificado',Boolean(monthly||historical&&Object.keys(historical.ratings).length)],
   ['PGN en base',records.length+' partidas completas',records.length>0],
   ['Fuentes',sources.length+' referencias consultables',sources.length>0]
  ];
  for(const [name,value,ready] of cells){
   const box=add(panel,'div','',ready?'ci-r-coverage-item ready':'ci-r-coverage-item pending');
   add(box,'span',name);add(box,'strong',value);
  }
 }
 function renderAudit(){
  const c=dossierCoverage(selected,records);
  const root=el('ci-r-audit');root.replaceChildren();
  const p=add(root,'p','PGN completos: '+c.evidence.storedPgn+' · blancas '+c.evidence.white+' / negras '+c.evidence.black+' · ECO documentados '+c.evidence.ecoKnown+' · torneos vinculados '+c.evidence.tournaments+' · planillas externas '+c.evidence.individualSheets,'ci-subtle');
  if(!c.missing.length)add(root,'p','Los campos básicos están cubiertos. Seguí ampliando la muestra de partidas y verificando fuentes.','ci-subtle');
  else{
   const list=document.createElement('ul');
   for(const item of c.missing){const li=document.createElement('li');li.textContent=item;list.append(li);}
   root.append(list);
  }
  add(root,'small','La cobertura indica existencia de evidencia, no nivel competitivo ni certeza estadística.','ci-subtle');
 }
 function renderReferences(){
  const panel=el('ci-r-links');panel.replaceChildren();
  const refs=gameReferences(selected?.fide_id);
  if(!refs.length)add(panel,'p','Sin colección de PGN localizada todavía. La ficha FIDE queda disponible arriba.','ci-subtle');
  if(refs.some(ref=>ref.kind==='tournament-pgn')){
   const callout=add(panel,'p','JUNCOS Clásico 2026: Chess-Results anuncia 10 partidas descargables del torneo. No todas corresponden necesariamente a este jugador. Descargá el PGN, importá solo partidas identificadas y verificá la procedencia.','ci-r-source-note');
  }
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
   add(block,'small','Secuencias frecuentes (hasta 8 medias jugadas)');
   showData(block,data.lines[color]);
   const c=data.byColor[color];
   add(block,'p',c.n?'Resultados registrados: '+c.wins+' V · '+c.draws+' T · '+c.losses+' D':'Sin resultados importados.','ci-subtle');
  }
 }
 function gameFilters(){
  return {query:el('ci-game-query').value,year:el('ci-game-year').value,tournament:el('ci-game-event').value,color:el('ci-game-color').value,outcome:el('ci-game-result').value,eco:el('ci-game-eco').value};
 }
 function updateGameOptions(){
  const opts=gameFilterOptions(createCIGameIndex(records));
  const fill=(id,values)=>{
   const box=el(id),previous=box.value;
   box.replaceChildren(new Option('Todos','all'));
   for(const value of values)box.add(new Option(value,value));
   box.value=values.includes(previous)?previous:'all';
  };
  fill('ci-game-year',opts.years);fill('ci-game-event',opts.tournaments);fill('ci-game-eco',opts.ecos);
 }
 function renderGames(){
  const panel=el('ci-r-games');panel.replaceChildren();
  const index=createCIGameIndex(records),filtered=filterCIGames(index,gameFilters()),stats=ciFilterStats(filtered);
  el('ci-game-count').textContent=stats.total+' de '+index.length+' partidas · '+stats.white+' blancas · '+stats.black+' negras · '+stats.wins+' V / '+stats.draws+' T / '+stats.losses+' D'+(stats.unknown?' · '+stats.unknown+' sin resultado':'');
  if(!filtered.length)return add(panel,'p',index.length?'No hay partidas que coincidan con estos filtros.':'Todavía no hay PGN completos registrados para este rival.','ci-subtle');
  for(const game of filtered.slice(0,100)){
   const row=add(panel,'div','', 'ci-r-game');
   add(row,'strong',game.tournament+' · '+game.year);
   add(row,'small',(game.color==='w'?'Blancas':'Negras')+' vs '+game.opponent+' · '+game.eco+' · '+game.result+' · '+game.moves+' medias jugadas');
   const action=document.createElement('button');action.className='btn outline';action.type='button';action.textContent='Exportar PGN';
   action.onclick=()=>{
    const blob=new Blob([game.record.pgn],{type:'application/x-chess-pgn'}),uri=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=uri;a.download='IB_CI_partida_'+String(game.id).slice(0,8)+'.pgn';a.click();setTimeout(()=>URL.revokeObjectURL(uri),1500);
   };row.append(action);
  }
  if(filtered.length>100)add(panel,'small','Mostrando 100 de '+filtered.length+' partidas filtradas.','ci-subtle');
 }
 async function refresh(){
  if(!selected)return;
  const token=++requestId;
  try{
   const games=await service.listGames(selected.id);
   if(token!==requestId)return;
   records=games;
   updateGameOptions();renderStats();renderGames();renderCoverage();renderAudit();
  }catch(error){if(token===requestId){status('No fue posible cargar partidas: '+error.message,true);records=[];updateGameOptions();renderStats();renderGames();renderCoverage();}}
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
 for(const id of ['ci-game-query','ci-game-year','ci-game-event','ci-game-color','ci-game-result','ci-game-eco'])el(id).addEventListener(id==='ci-game-query'?'input':'change',renderGames);
 return {
  async select(player){
   selected=player||null;host.hidden=!selected;records=[];if(!selected)return;
   el('ci-r-name').textContent=selected.display_name;
   el('ci-game-query').value='';for(const id of ['ci-game-year','ci-game-event','ci-game-color','ci-game-result','ci-game-eco'])el(id).value='all';
   renderRatings();renderEventSources();renderDossier();renderReferences();renderStats();renderGames();renderCoverage();renderAudit();status('Fuentes FIDE consultadas. Partidas privadas pendientes de carga.');
   await refresh();
  },
  clear(){selected=null;host.hidden=true;records=[];requestId++;}
 };
}
