// IB Chess Analyzer — descriptive per-game metrics and opponent-adjusted tournament performance.
// No fabricated "estimated Elo from accuracy": only opponent ratings plus results can support TPR.
const pct=n=>Number.isFinite(n)?n.toFixed(1)+'%':'—';
const num=x=>{const n=Number(x);return Number.isFinite(n)&&n>0?n:null;};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
export function gameMetrics(game,reports){
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
  const qualityRows=rows.filter(r=>r.technical.complete);
  const quality=qualityRows.length?qualityRows.reduce((sum,r)=>sum+r.technical.quality,0)/qualityRows.length:null;
  return {rows,rated:rated.length,scored:scored.length,points,performance,allWon:rated.length&&rated.every(r=>r.result===1),allLost:rated.length&&rated.every(r=>r.result===0),quality,analyzed:qualityRows.length};
}
export function initPerformance({state,notify,analyzeGame,jumpGame,getAnalyses}){
 const left=document.querySelector('.board-column');
 const box=document.createElement('div');
 box.className='panel performance-panel';
 box.innerHTML=`
  <div class="panel-heading"><div><div class="eyebrow">ESTADÍSTICAS · IB CHESS ACADEMY</div><h2>Rendimiento y torneos</h2></div><span class="small-pill">BETA</span></div>
  <div class="perf-tabs"><button data-perf-tab="game" class="active">Esta partida</button><button data-perf-tab="tournament">Torneo</button></div>
  <div id="perf-game"></div>
  <div id="perf-tournament" hidden>
    <div class="perf-filters"><label>Jugador<select id="perf-player"></select></label><label>Evento<select id="perf-event"></select></label></div>
    <div id="perf-summary"></div>
    <div class="perf-actions"><button class="btn primary" id="perf-analyze-all">Analizar partidas de este torneo</button><button class="btn outline" id="perf-stop">Cancelar lote</button><button class="btn outline" id="perf-export">Exportar torneo CSV</button></div>
    <div id="perf-batch-state" class="perf-info">El análisis individual se conserva mientras navegás entre las partidas de este PGN.</div>
    <div id="perf-rows"></div>
  </div>
  <p class="perf-disclaimer">El índice técnico 0–100 se calcula a partir de pérdidas de centipeones, no equivale a la precisión comercial de Chess.com ni permite inferir un Elo. El rendimiento Elo de torneo se estima solo con resultados y Elo declarado de los rivales; no es una cifra oficial FIDE.</p>`;
 left.append(box);
 const $=id=>document.getElementById(id);
 let selectedPlayer='',selectedEvent='',activeTab='game',batchCancelled=false,batching=false;
 const playerList=()=>[...new Set(state.games.flatMap(g=>[g.headers?.White,g.headers?.Black]).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
 function filters(restore=true){
  const previous=selectedPlayer;
  const players=playerList();
  if(!restore||!players.includes(selectedPlayer)){
    const current=state.game?.headers||{};selectedPlayer=players.includes(current.White)?current.White:players[0]||'';
  }
  $('perf-player').innerHTML=players.map(p=>'<option value="'+esc(p)+'">'+esc(p)+'</option>').join('');
  $('perf-player').value=selectedPlayer;
  const events=[...new Set(state.games.filter(g=>playerSide(g,selectedPlayer)).map(g=>String(g.headers?.Event||'Sin evento')))];
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
  const completed=current.headers.Result&&['1-0','0-1','1/2-1/2'].includes(current.headers.Result)?current.headers.Result:'Sin resultado';
  $('perf-game').innerHTML='<div class="perf-result">'+esc(current.headers.White||'?')+' <strong>'+completed+'</strong> '+esc(current.headers.Black||'?')+'</div>'+statHTML('Blancas · '+esc(current.headers.White||'?'),m.w)+statHTML('Negras · '+esc(current.headers.Black||'?'),m.b);
 }
 function renderTournament(){
  filters();
  const t=tournamentStats(state.games,selectedPlayer,selectedEvent,getAnalyses());
  const tpr=t.rated===0?'Sin Elo rival':t.performance===null?t.allWon?'Sin valor finito (100%)':t.allLost?'Sin valor finito (0%)':'No estimable':String(t.performance);
  $('perf-summary').innerHTML='<div class="perf-tournament-grid"><div><b>'+t.points+'/'+t.scored+'</b><small>Puntos / partidas puntuadas</small></div><div><b>'+tpr+'</b><small>Rendimiento Elo estimado</small></div><div><b>'+t.rated+'</b><small>Rivales con Elo válido</small></div><div><b>'+(t.quality===null?'—':t.quality.toFixed(1))+'</b><small>Índice técnico ('+t.analyzed+'/'+t.rows.length+')</small></div></div>';
  $('perf-rows').innerHTML=t.rows.length?t.rows.map(r=>'<button class="perf-game-row" data-open-game="'+r.index+'"><span>R'+esc(r.round)+' · '+esc(r.opponent)+'</span><span>'+(r.elo??'s/Elo')+' · '+(r.result===null?'Sin resultado':r.result)+' pt · '+(r.technical.complete?r.technical.quality.toFixed(1)+'/100':'sin analizar')+'</span></button>').join(''):'<p>Este evento no contiene partidas de ese jugador.</p>';
 }
 function render(){renderGame();if(activeTab==='tournament')renderTournament();}
 box.querySelector('.perf-tabs').onclick=e=>{const b=e.target.closest('[data-perf-tab]');if(!b)return;activeTab=b.dataset.perfTab;box.querySelectorAll('[data-perf-tab]').forEach(x=>x.classList.toggle('active',x===b));$('perf-game').hidden=activeTab!=='game';$('perf-tournament').hidden=activeTab!=='tournament';render();};
 $('perf-player').onchange=e=>{selectedPlayer=e.target.value;selectedEvent='';renderTournament();};
 $('perf-event').onchange=e=>{selectedEvent=e.target.value;renderTournament();};
 $('perf-rows').onclick=e=>{const b=e.target.closest('[data-open-game]');if(b)jumpGame(Number(b.dataset.openGame));};
 $('perf-stop').onclick=()=>{batchCancelled=true;notify('Se detendrá el análisis por lotes después de la posición actual.');};
 $('perf-export').onclick=()=>{
   const t=tournamentStats(state.games,selectedPlayer,selectedEvent,getAnalyses());
   if(!t.rows.length)return notify('Este filtro no tiene partidas.');
   const q=x=>'"'+String(x??'').replaceAll('"','""')+'"';
   const rows=[['Jugador','Evento','Ronda','Rival','Elo rival','Color','Puntos','Indice tecnico','CP medio','Jugadas evaluadas','Rendimiento Elo de torneo']];
   for(const r of t.rows)rows.push([selectedPlayer,selectedEvent,r.round,r.opponent,r.elo??'',r.side==='w'?'Blancas':'Negras',r.result??'',r.technical.complete?r.technical.quality.toFixed(1):'',r.technical.complete?r.technical.avg.toFixed(1):'',r.technical.count+'/'+r.technical.totalMoves,t.performance??'No estimable']);
   const blob=new Blob(['\\ufeff'+rows.map(row=>row.map(q).join(',')).join('\\r\\n')],{type:'text/csv;charset=utf-8'});
   const link=document.createElement('a'),url=URL.createObjectURL(blob);link.href=url;link.download='IB_Torneo_'+selectedPlayer.replace(/[^a-z0-9-]/gi,'_')+'.csv';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 };

 $('perf-analyze-all').onclick=async()=>{
  if(batching)return;
  const t=tournamentStats(state.games,selectedPlayer,selectedEvent,getAnalyses());
  const pending=t.rows.filter(r=>!r.technical.complete);
  if(!pending.length)return notify('Todas las partidas seleccionadas ya están analizadas.');
  batching=true;batchCancelled=false;$('perf-analyze-all').disabled=true;
  const prior=state.games.indexOf(state.game);
  try{
    for(let i=0;i<pending.length;i++){
      if(batchCancelled)break;
      $('perf-batch-state').textContent='Analizando '+(i+1)+'/'+pending.length+' · '+pending[i].opponent;
      jumpGame(pending[i].index);
      const ok=await analyzeGame();
      if(!ok||batchCancelled)break;
      renderTournament();
    }
    $('perf-batch-state').textContent=batchCancelled?'Lote cancelado. Se conservaron las partidas completadas.':'Análisis del lote finalizado.';
  }catch(e){$('perf-batch-state').textContent='Error en lote: '+e.message;notify(e.message,'err');}
  finally{batching=false;$('perf-analyze-all').disabled=false;if(!batchCancelled&&prior>=0)jumpGame(prior);render();}
 };
 filters(false);render();
 return {render,gameChanged:render,analysisFinished:render};
}
