import { findReview } from './review-cache.js';
import { calibrationSamples,enginePerformance,apparentPerformance } from './engine-performance.js';
// IB Chess Analyzer — descriptive per-game metrics and opponent-adjusted tournament performance.
// No fabricated "estimated Elo from accuracy": only opponent ratings plus results can support TPR.
const pct=n=>Number.isFinite(n)?n.toFixed(1)+'%':'—';
const num=x=>{const n=Number(x);return Number.isFinite(n)&&n>0?n:null;};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
export function gameMetrics(game,reports){
  // Accept both a report array and the cached Game Review record.
  if(reports && !Array.isArray(reports))reports=reports.reports;
  const moves=game?.moves||[], byColor={w:{loss:[],counts:{}},b:{loss:[],counts:{}}};
  for(let i=0;i<moves.length;i++){
    const r=reports?.[i];if(!r||!Number.isFinite(r.loss))continue;
    const target=byColor[i%2===0?'w':'b'];target.loss.push(Math.max(0,r.loss));target.counts[r.type]=(target.counts[r.type]||0)+1;
  }
  const phaseRanges=[['Apertura',0,20],['Medio juego',20,60],['Final',60,Infinity]];
  const phases=color=>phaseRanges.map(([label,lo,hi])=>{const values=[];for(let i=lo;i<Math.min(hi,moves.length);i++){if((i%2===0?'w':'b')!==color)continue;const r=reports?.[i];if(r&&Number.isFinite(r.loss))values.push(Math.max(0,r.loss));}return {label,moves:values.length,avg:values.length?values.reduce((a,b)=>a+b,0)/values.length:null};});
  const info=color=>{
    const a=byColor[color].loss, count=a.length,totalMoves=moves.filter((_,i)=>(i%2===0?'w':'b')===color).length;
    const avg=a.length?a.reduce((x,y)=>x+y,0)/a.length:null;
    // Transparent, original 0–100 quality index: capped per-move loss discourages one blunder dominating everything.
    const quality=a.length?100*a.reduce((sum,x)=>sum+Math.exp(-Math.min(x,600)/150),0)/a.length:null;
    return {count,totalMoves,avg,quality,counts:byColor[color].counts,complete:a.length===totalMoves&&totalMoves>0,phases:phases(color)};
  };
  return {w:info('w'),b:info('b')};
}
const playerSide=(g,name)=>{
  const white=String(g.headers?.White||'').trim().toLocaleLowerCase(),black=String(g.headers?.Black||'').trim().toLocaleLowerCase(),n=name.trim().toLocaleLowerCase();
  return n===white?'w':n===black?'b':null;
};
const scoreFor=(result,color)=>result==='1/2-1/2'?.5:result===(color==='w'?'1-0':'0-1')?1:result===(color==='w'?'0-1':'1-0')?0:null;
// Elo logistic inversion: rating solving sum expected scores vs individual opponents.
// Scores of 0% and 100% have no finite root, so show no numeric performance.
// FIDE B.02 8.1.1 fractional-score conversion table (March 2024 regulation).
// Percentages are rounded to the nearest 1%, consistent with the table granularity.
const fideNegativeDp=[0,-7,-14,-21,-29,-36,-43,-50,-57,-65,-72,-80,-87,-95,-102,-110,-117,-125,-133,-141,-149,-158,-166,-175,-184,-193,-202,-211,-220,-230,-240,-251,-262,-273,-284,-296,-309,-322,-336,-351,-366,-383,-401,-422,-444,-470,-501,-538,-589,-677,-800];
export function fidePerformance(rated){
 if(!rated.length)return null;
 const points=rated.reduce((total,r)=>total+r.result,0),percent=Math.max(0,Math.min(100,Math.round(points/rated.length*100)));
 const avg=Math.round(rated.reduce((total,r)=>total+r.elo,0)/rated.length);
 const delta=percent>=50?-fideNegativeDp[percent-50]:fideNegativeDp[50-percent];
 return {rating:avg+delta,average:avg,percent,delta,points};
}
export function tournamentStats(games,name,event,analyses){
  const rows=[];
  for(let i=0;i<games.length;i++){
    const g=games[i],h=g.headers||{},side=playerSide(g,name);
    if(!side||String(h.Event||'Sin evento')!==event)continue;
    const result=scoreFor(h.Result,side),opponent=side==='w'?h.Black:h.White;
    const elo=num(side==='w'?h.BlackElo:h.WhiteElo);
    const m=gameMetrics(g,analyses.get(i)),technical=m[side];
    rows.push({index:i,opponent:String(opponent||'?'),elo,result,side,technical,round:h.Round||'—',date:h.Date||''});
  }
  const rated=rows.filter(r=>r.elo!==null&&r.result!==null);
  const scored=rows.filter(r=>r.result!==null),points=scored.reduce((a,r)=>a+r.result,0);
  let performance=null;
  if(rated.length){
    const actual=rated.reduce((a,r)=>a+r.result,0);
    if(actual>0&&actual<rated.length){
      let lo=0,hi=4000;
      for(let j=0;j<75;j++){
        const mid=(lo+hi)/2,expected=rated.reduce((sum,r)=>sum+1/(1+Math.pow(10,(r.elo-mid)/400)),0);
        if(expected<actual)lo=mid;else hi=mid;
      }
      performance=Math.round((lo+hi)/2);
    }
  }
  const fide=fidePerformance(rated);
  const qualityRows=rows.filter(r=>r.technical.complete);
  const quality=qualityRows.length?qualityRows.reduce((sum,r)=>sum+r.technical.quality,0)/qualityRows.length:null;
  return {rows,rated:rated.length,scored:scored.length,points,performance,fide,allWon:rated.length&&rated.every(r=>r.result===1),allLost:rated.length&&rated.every(r=>r.result===0),quality,analyzed:qualityRows.length};
}
export function initPerformance({state,notify,analyzeGame,jumpGame,getAnalyses}){
 const page=document.querySelector('main.main');
 const layout=page.querySelector('.layout'),toolbar=page.querySelector('.toolbar'),tools=page.querySelector('.workspace-tools');
 const screen=document.createElement('section');screen.className='performance-workspace';screen.hidden=true;
 screen.innerHTML='<header class="library-header"><div><div class="eyebrow">IB CHESS ACADEMY · RENDIMIENTO</div><h2>Rendimiento de eventos</h2><p>Seleccioná un estudio completo, comprobá los datos PGN y analizá sus partidas con Stockfish.</p></div></header><div class="performance-source"><label>Estudio de la biblioteca <select id="performance-study"><option value="">Elegí un estudio…</option></select></label><button type="button" class="btn outline" id="performance-reload">Actualizar estudios</button><button type="button" class="btn primary" id="performance-load">Cargar estudio</button></div><p id="performance-source-status" class="perf-info">Los estudios locales se cargan completos. Los estudios de una sola partida también están disponibles.</p>';
 page.insertBefore(screen,page.querySelector('footer'));
 const left=screen;
 const box=document.createElement('div');
 box.className='panel performance-panel';
 box.innerHTML=`
  <div class="panel-heading"><div><div class="eyebrow">ESTADÍSTICAS · IB CHESS ACADEMY</div><h2>Rendimiento y torneos</h2></div><span class="small-pill">BETA</span></div>
  <div class="perf-tabs" hidden><button data-perf-tab="game">Esta partida</button><button data-perf-tab="tournament" class="active">Torneo</button></div>
  <div id="perf-game" hidden></div>
  <div id="perf-tournament">
    <div class="perf-filters"><label>Evento del estudio<select id="perf-event"></select></label><label hidden>Jugador<select id="perf-player"></select></label></div>
    <div id="perf-study-overview"></div><div id="perf-summary" hidden></div>
    <div class="perf-actions"><button class="btn primary" id="perf-analyze-all">Analizar partidas de este torneo</button><button class="btn outline" id="perf-stop">Cancelar lote</button><button class="btn outline" id="perf-export">Exportar torneo CSV</button></div>
    <div id="perf-batch-state" class="perf-info">El análisis individual se conserva mientras navegás entre las partidas de este PGN.</div>
    <div id="perf-rows" hidden></div>
  </div>
  <p class="perf-disclaimer">El Elo aparente es una transformación heurística del índice técnico de Stockfish, sin calibración estadística ni equivalencia con rating oficial. El performance de torneo aplica la tabla Ra + dp de FIDE al Elo indicado en el PGN. Para ser un rendimiento FIDE verificable, los ratings, las partidas efectivamente jugadas y el ritmo deben proceder de datos oficiales.</p>`;
 screen.append(box);
 const $=id=>document.getElementById(id);
 let studyOptions=new Map();
 async function refreshStudies(){
  const data=await window.IB_STUDIO?.listLibraryItems();if(!data)return;
  studyOptions=new Map();const groups=new Map();
  for(const item of data.locals){const key=item.collectionId?'local-group:'+item.collectionId:'local:'+item.id;if(!groups.has(key))groups.set(key,{name:item.collectionName||item.name||'Partida',ids:[]});groups.get(key).ids.push(item.id);}
  for(const [key,group] of groups)studyOptions.set(key,{label:group.name+' ('+group.ids.length+' partidas · local)',ids:group.ids});
  for(const item of data.remote)studyOptions.set('cloud:'+item.id,{label:(item.title||'Estudio')+' (nube)',id:item.id});
  const select=$('performance-study'),previous=select.value;select.replaceChildren();const intro=document.createElement('option');intro.value='';intro.textContent='Seleccioná un estudio…';select.append(intro);
  for(const [id,item] of studyOptions){const opt=document.createElement('option');opt.value=id;opt.textContent=item.label;select.append(opt);}
  if(studyOptions.has(previous))select.value=previous;
  if(data.error)$('performance-source-status').textContent='Nube: '+data.error;
 }
 $('performance-reload').onclick=()=>refreshStudies().catch(e=>notify(e.message,'err'));
 $('performance-load').onclick=async()=>{
  const option=studyOptions.get($('performance-study').value);if(!option)return notify('Seleccioná primero un estudio.','err');
  try{ $('performance-load').disabled=true;const pgn=option.ids?await window.IB_STUDIO.loadCollectionPgn(option.ids):await window.IB_STUDIO.getLibraryPgn('cloud',option.id);
   window.IB_LOAD_STUDY?.(pgn,option.label);$('performance-source-status').textContent='Estudio cargado: '+option.label+' · análisis iniciado.';
  }catch(e){notify('No se pudo cargar el estudio: '+e.message,'err');}
  finally{$('performance-load').disabled=false;}
 };

 let selectedPlayer='',selectedEvent='',activeTab='tournament',batchCancelled=false,batching=false;
 const playerList=()=>{const count=new Map();for(const g of state.games)for(const name of [g.headers?.White,g.headers?.Black])if(name)count.set(name,(count.get(name)||0)+1);return [...count.keys()].sort((a,b)=>count.get(b)-count.get(a)||a.localeCompare(b));};
 function filters(restore=true){
  const previous=selectedPlayer;
  const players=playerList();
  if(!restore||!players.includes(selectedPlayer)){
    const current=state.game?.headers||{};selectedPlayer=players[0]||'';
  }
  $('perf-player').innerHTML=players.map(p=>'<option value="'+esc(p)+'">'+esc(p)+'</option>').join('');
  $('perf-player').value=selectedPlayer;
  const events=[...new Set(state.games.map(g=>String(g.headers?.Event||'Sin evento')))];
  if(!events.includes(selectedEvent))selectedEvent=events.includes(state.game?.headers?.Event)?state.game.headers.Event:events[0]||'';
  $('perf-event').innerHTML=events.map(e=>'<option value="'+esc(e)+'">'+esc(e)+'</option>').join('');
  $('perf-event').value=selectedEvent;
 }
 function statHTML(label,metric){
  if(!metric.count)return '<div class="perf-empty">'+label+': realizá un Game Review para obtener métricas técnicas.</div>';
  return '<div class="perf-color"><strong>'+label+'</strong><div class="perf-metrics"><span><b>'+metric.quality.toFixed(1)+'</b><small>Índice técnico /100</small></span><span><b>'+metric.avg.toFixed(1)+'</b><small>Pérdida media CP</small></span><span><b>'+metric.count+'/'+metric.totalMoves+'</b><small>Jugadas evaluadas</small></span></div><div class="perf-errors">Imprecisiones '+(metric.counts.inaccuracy||0)+' · Errores '+(metric.counts.mistake||0)+' · Graves '+(metric.counts.blunder||0)+'</div><div class="perf-phases">'+metric.phases.map(p=>'<span>'+p.label+': <b>'+(p.avg===null?'—':p.avg.toFixed(0)+' cp')+'</b></span>').join('')+'</div></div>';
 }
 function renderGame(){
  const current=state.game;if(!current)return;
  const ix=state.games.indexOf(current),m=gameMetrics(current,getAnalyses().get(ix)||state.reports);
  const reference=calibrationSamples(state.games,getAnalyses());
  const ew=enginePerformance(m.w.complete?m.w.quality:null,reference,{excludeIndex:ix,excludePlayer:String(current.headers.White||'').toLowerCase()});
  const eb=enginePerformance(m.b.complete?m.b.quality:null,reference,{excludeIndex:ix,excludePlayer:String(current.headers.Black||'').toLowerCase()});
  const aw=apparentPerformance(m.w),ab=apparentPerformance(m.b);
  const completed=current.headers.Result&&['1-0','0-1','1/2-1/2'].includes(current.headers.Result)?current.headers.Result:'Sin resultado';
  $('perf-game').innerHTML='<div class="perf-result">'+esc(current.headers.White||'?')+' <strong>'+completed+'</strong> '+esc(current.headers.Black||'?')+'</div>'+'<div class="perf-engine"><h3>Elo aparente de esta partida · Stockfish</h3><div class="perf-engine-pair"><div><b>'+(aw.value??'—')+'</b><small>Blancas · '+(aw.value?'±'+aw.spread+' orientativo':'Pendiente de análisis')+'</small></div><div><b>'+(ab.value??'—')+'</b><small>Negras · '+(ab.value?'±'+ab.spread+' orientativo':'Pendiente de análisis')+'</small></div></div><p>'+(aw.value||ab.value?'Cifra heurística inmediata derivada de las jugadas analizadas. No es Elo oficial ni estimación estadísticamente validada.':'Analizá toda la partida para obtener el Elo aparente de ambos bandos.')+'</p></div>'+statHTML('Blancas · '+esc(current.headers.White||'?'),m.w)+statHTML('Negras · '+esc(current.headers.Black||'?'),m.b);
 }
 function renderStudyOverview(){
  const event=selectedEvent;
  const games=state.games.map((g,index)=>({g,index})).filter(({g})=>!event||String(g.headers?.Event||'Sin evento')===event);
  const full=games.map(({g,index})=>({g,index,metrics:gameMetrics(g,getAnalyses().get(index))}));
  const done=full.filter(x=>x.metrics.w.complete&&x.metrics.b.complete);
  const avg=done.length?done.reduce((sum,x)=>sum+x.metrics.w.avg+x.metrics.b.avg,0)/(done.length*2):null;
  const errors=done.reduce((acc,x)=>{for(const color of ['w','b'])for(const type of ['inaccuracy','mistake','blunder'])acc[type]+=x.metrics[color].counts[type]||0;return acc;},{inaccuracy:0,mistake:0,blunder:0});
  $('perf-study-overview').innerHTML='<div class="perf-info"><strong>Balance integral del estudio · '+esc(event||'Todos los eventos')+'</strong><p>'+done.length+'/'+games.length+' partidas analizadas con Stockfish · '+(avg===null?'Pérdida media pendiente':'Pérdida media '+avg.toFixed(1)+' cp')+' · '+errors.inaccuracy+' imprecisiones · '+errors.mistake+' errores · '+errors.blunder+' graves.</p><p>El análisis cubre ambos bandos en todas las partidas del evento. Elegí un jugador más abajo para consultar su rendimiento individual.</p></div><div class="perf-study-games">'+full.map(x=>'<div class="perf-game-row"><span>'+esc(x.g.headers?.White||'?')+' – '+esc(x.g.headers?.Black||'?')+'</span><span>'+(x.metrics.w.complete&&x.metrics.b.complete?'Analizada':'Pendiente')+'</span></div>').join('')+'</div>';
 }
 function renderTournament(){
  filters();renderStudyOverview();
  const t=tournamentStats(state.games,selectedPlayer,selectedEvent,getAnalyses());
  const reference=calibrationSamples(state.games,getAnalyses());
  const estimated=t.rows.map(r=>({row:r,...enginePerformance(r.technical.complete?r.technical.quality:null,reference,{excludeIndex:r.index,excludePlayer:selectedPlayer.toLowerCase()})})).filter(r=>r.value!==null);
  const meanEstimate=estimated.length?Math.round(estimated.reduce((a,r)=>a+r.value,0)/estimated.length/5)*5:null;
  const apparent=t.rows.map(r=>apparentPerformance(r.technical)).filter(r=>r.value!==null);
  const apparentAvg=apparent.length?Math.round(apparent.reduce((a,r)=>a+r.value,0)/apparent.length/25)*25:null;
  const tpr=t.fide?String(t.fide.rating):'Sin Elo rival';
  $('perf-summary').innerHTML='<div class="perf-engine"><h3>Elo aparente del torneo · Stockfish</h3><div class="perf-engine-pair"><div><b>'+(apparentAvg??'—')+'</b><small>Media heurística de partidas</small></div><div><b>'+apparent.length+'/'+t.rows.length+'</b><small>Partidas analizadas</small></div></div><p>'+(apparentAvg===null?'Analizá las partidas para calcular el performance de juego.':'Promedio de Elo aparente de las partidas completas; no mide rating oficial.')+'</p></div><div class="perf-tournament-grid"><div><b>'+t.points+'/'+t.scored+'</b><small>Puntos / partidas puntuadas</small></div><div><b>'+tpr+'</b><small>Performance FIDE* (Ra + dp)</small></div><div><b>'+t.rated+'</b><small>Rivales con Elo válido</small></div><div><b>'+(t.quality===null?'—':t.quality.toFixed(1))+'</b><small>Índice técnico ('+t.analyzed+'/'+t.rows.length+')</small></div></div><p class="perf-info">'+(t.fide?'Ra '+t.fide.average+' · '+t.fide.percent+'% de puntuación · dp '+(t.fide.delta>=0?'+':'')+t.fide.delta+'. ':'')+'*Método de tabla FIDE; el Elo indicado por el PGN no se verifica con la lista FIDE, y partidas por incomparecencia pueden necesitar exclusión.</p>';
  const analyzed=t.rows.filter(r=>r.technical.complete);
  const avgLoss=analyzed.length?analyzed.reduce((sum,r)=>sum+r.technical.avg,0)/analyzed.length:null;
  const errorTotals=analyzed.reduce((sum,r)=>{for(const k of ['inaccuracy','mistake','blunder'])sum[k]+=(r.technical.counts[k]||0);return sum;},{inaccuracy:0,mistake:0,blunder:0});
  const headerWarnings=[];
  if(!selectedEvent||selectedEvent==='Sin evento')headerWarnings.push('Falta completar el evento en los encabezados PGN.');
  if(t.rows.some(r=>r.result===null))headerWarnings.push('Hay resultados sin completar.');
  if(t.rows.some(r=>r.round==='—'))headerWarnings.push('Faltan números de ronda.');
  if(t.rated<t.rows.length)headerWarnings.push('Falta Elo válido de uno o más rivales; el performance FIDE es parcial.');
  const conclusion=analyzed.length?(avgLoss<25?'Muy buena precisión técnica en las partidas analizadas.':avgLoss<65?'Rendimiento técnico intermedio; revisar las posiciones críticas.':'Se detectan pérdidas de evaluación considerables; conviene revisar cálculo y decisiones tácticas.'):'Todavía no hay partidas completas analizadas por Stockfish.';
  $('perf-summary').insertAdjacentHTML('beforeend','<div class="perf-info"><strong>Balance técnico del evento</strong><p>'+esc(conclusion)+'</p><p>Partidas evaluadas: '+analyzed.length+'/'+t.rows.length+' · Pérdida media: '+(avgLoss===null?'—':avgLoss.toFixed(1)+' cp')+' · Imprecisiones: '+errorTotals.inaccuracy+' · Errores: '+errorTotals.mistake+' · Graves: '+errorTotals.blunder+'</p></div>'+(headerWarnings.length?'<div class="perf-info"><strong>Datos PGN a verificar</strong><p>'+headerWarnings.map(esc).join(' · ')+'</p></div>':''));
  $('perf-rows').innerHTML=t.rows.length?t.rows.map(r=>'<button class="perf-game-row" data-open-game="'+r.index+'"><span>R'+esc(r.round)+' · '+esc(r.opponent)+'</span><span>'+(r.elo??'s/Elo')+' · '+(r.result===null?'Sin resultado':r.result)+' pt · '+(r.technical.complete?r.technical.quality.toFixed(1)+'/100':'sin analizar')+'</span></button>').join(''):'<p>Este evento no contiene partidas de ese jugador.</p>';
 }
 function render(){renderTournament();}
 box.querySelector('.perf-tabs').onclick=e=>{const b=e.target.closest('[data-perf-tab]');if(!b)return;activeTab=b.dataset.perfTab;box.querySelectorAll('[data-perf-tab]').forEach(x=>x.classList.toggle('active',x===b));$('perf-game').hidden=activeTab!=='game';$('perf-tournament').hidden=activeTab!=='tournament';render();};
 $('perf-player').onchange=e=>{selectedPlayer=e.target.value;selectedEvent='';renderTournament();};
 $('perf-event').onchange=e=>{selectedEvent=e.target.value;renderTournament();};
 $('perf-rows').onclick=e=>{const b=e.target.closest('[data-open-game]');if(b)jumpGame(Number(b.dataset.openGame));};
 $('perf-stop').onclick=()=>{batchCancelled=true;notify('Se detendrá el análisis por lotes después de la posición actual.');};
 $('perf-export').onclick=()=>{
   const t=tournamentStats(state.games,selectedPlayer,selectedEvent,getAnalyses());
   if(!t.rows.length)return notify('Este filtro no tiene partidas.');
   const q=x=>'"'+String(x??'').replaceAll('"','""')+'"';
   const rows=[['Jugador','Evento','Ronda','Rival','Elo rival','Color','Puntos','Indice tecnico','CP medio','Jugadas evaluadas','Performance con tabla FIDE (PGN no verificado)']];
   for(const r of t.rows)rows.push([selectedPlayer,selectedEvent,r.round,r.opponent,r.elo??'',r.side==='w'?'Blancas':'Negras',r.result??'',r.technical.complete?r.technical.quality.toFixed(1):'',r.technical.complete?r.technical.avg.toFixed(1):'',r.technical.count+'/'+r.technical.totalMoves,t.fide?.rating??'No estimable']);
   const blob=new Blob(['\\ufeff'+rows.map(row=>row.map(q).join(',')).join('\\r\\n')],{type:'text/csv;charset=utf-8'});
   const link=document.createElement('a'),url=URL.createObjectURL(blob);link.href=url;link.download='IB_Torneo_'+selectedPlayer.replace(/[^a-z0-9-]/gi,'_')+'.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 };

 async function analyzeEntireEvent(){
  if(batching)return;
  for(let index=0;index<state.games.length;index++){if(getAnalyses().has(index))continue;try{const saved=await findReview(state.games[index]);if(saved)getAnalyses().set(index,saved);}catch(e){console.warn(e);}}
  renderTournament();
  const games=state.games.map((g,index)=>({g,index})).filter(({g})=>!selectedEvent||String(g.headers?.Event||'Sin evento')===selectedEvent);
  const pending=games.filter(({g,index})=>{const m=gameMetrics(g,getAnalyses().get(index));return !m.w.complete||!m.b.complete;});
  if(!pending.length){$('perf-batch-state').textContent='Todas las '+games.length+' partidas del evento ya están analizadas.';renderTournament();return;}
  batching=true;batchCancelled=false;$('perf-analyze-all').disabled=true;
  const prior=state.games.indexOf(state.game);
  try{
   for(let i=0;i<pending.length;i++){
     if(batchCancelled)break;
     $('perf-batch-state').textContent='Stockfish · Partida '+(i+1)+' de '+pending.length+' · '+(pending[i].g.headers.White||'?')+' – '+(pending[i].g.headers.Black||'?');
     jumpGame(pending[i].index);
     const ok=await analyzeGame();
     if(!ok||batchCancelled)break;
     renderTournament();
   }
   $('perf-batch-state').textContent=batchCancelled?'Análisis detenido; se conservaron los resultados completos.':'Análisis integral completado: '+games.length+' partidas del evento.';
  }catch(e){$('perf-batch-state').textContent='Error: '+e.message;notify(e.message,'err');}
  finally{batching=false;$('perf-analyze-all').disabled=false;if(prior>=0)jumpGame(prior);render();}
 }
 $('perf-analyze-all').textContent='Analizar todas las partidas del evento';
 $('perf-analyze-all').onclick=analyzeEntireEvent;

 filters(false);render();
 return {render,gameChanged:render,analysisFinished:render,
 show(){screen.hidden=false;layout.hidden=true;toolbar.hidden=true;tools.hidden=true;document.querySelector('#nav-reports')?.classList.add('active');document.querySelector('.topbar h1').textContent='Rendimiento';refreshStudies().catch(e=>notify(e.message,'err'));window.scrollTo(0,0);this.selectTournament();},
 hide(){screen.hidden=true;document.querySelector('#nav-reports')?.classList.remove('active');},
 selectTournament(){activeTab='tournament';box.querySelectorAll('[data-perf-tab]').forEach(x=>x.classList.toggle('active',x.dataset.perfTab==='tournament'));$('perf-game').hidden=true;$('perf-tournament').hidden=false;filters(false);renderTournament();},
 async analyzeCurrentStudy(){
  this.selectTournament();
  if(batching)return;
  const event=selectedEvent,player=selectedPlayer;
  if(!state.games.length)return notify('Primero cargá un estudio con partidas.','err');
  await analyzeEntireEvent();
 }
 };
}
