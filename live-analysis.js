import { Chess } from 'chess.js';

// UCI analysis runs in its own Web Worker. Batch Game Review is a separate engine.
// No network calls or paid API are required.
export function initLiveAnalysis({getFen,getEngineUrl,notify,onSaveVariation,onPreview,onLeavePreview,onEvaluation,onLines,isGameReviewBusy=()=>false}) {
  const host=document.querySelector('.analysis-column');
  const panel=document.createElement('div');
  panel.className='panel live-analysis-panel';
  panel.innerHTML=`
    <div class="panel-heading"><div><div class="eyebrow">ANÁLISIS EN DIRECTO</div><h2>Variantes de Stockfish</h2></div><span id="live-status" class="live-chip">Inicializando</span></div>
    <div class="live-controls">
      <label class="live-toggle"><input id="live-enabled" type="checkbox" checked/> Analizar al cambiar la posición</label>
      <label>Líneas <select id="live-count"><option value="1">1</option><option value="3" selected>3</option><option value="5">5</option></select></label>
      <label>Profundidad <select id="live-depth"><option value="16">16</option><option value="20" selected>20</option><option value="24">24</option><option value="28">28</option></select></label>
    </div>
    <div id="live-playback" class="live-playback" hidden><strong data-progress>Variante</strong><p class="live-playback-hint">Estás recorriendo una variante, no la partida principal. Usá también las flechas del tablero o las teclas ← → para avanzar y retroceder sin salir de ella.</p><div class="live-playback-buttons"><button id="pv-back" class="btn outline">◀ Anterior</button><button id="pv-next" class="btn outline">Siguiente ▶</button><button id="pv-exit" class="btn subtle">↩ Volver a la partida principal</button></div></div>
    <div id="live-lines" class="live-lines" aria-live="polite"><p class="live-empty">Iniciando motor de análisis…</p></div>
    <p id="live-explanation" class="live-explanation">Las alternativas se actualizan mientras el motor calcula. Las explicaciones son heurísticas, no texto generado por un modelo de IA.</p>
    <div class="live-footer"><span id="live-depth-status">Sin evaluación</span><button class="btn outline" id="live-restart">Reiniciar motor</button></div>`;
  const enginePanel=host.querySelector('.engine-panel');
  host.insertBefore(panel,enginePanel);
  const $=id=>document.getElementById(id);
  let worker=null,ready=false,busy=false,activeFen=null,queuedFen=null,enabled=true,loading=false,sequence=0,debounce=null,paused=false;
  let lines=new Map(),bestDepth=0,failures=0,playback=null;
  // The principal variation starts expanded; alternatives can be opened independently.
  const expandedRanks=new Set();
  let liveGroupOpen=false;
  const compactScore=(kind,value,fen)=>{
    const white=fen.split(' ')[1]==='w';
    const sign=white?1:-1;
    if(kind==='mate')return (value*sign>0?'+':'−')+'M'+Math.abs(value);
    return (value*sign>=0?'+':'')+(value*sign/100).toFixed(2);
  };
  function pvToSan(fen,moves){
    const c=new Chess(fen),output=[],raw=[];
    for(let i=0;i<Math.min(moves.length,16);i++){
      const u=moves[i];
      try{
        const prior=c.fen().split(' '),m=c.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||'q'});
        output.push((prior[1]==='w'?prior[5]+'. ':i===0?prior[5]+'... ':'')+m.san);
        raw.push(m);
      }catch{break;}
    }
    return {san:output.join(' '),moves:raw};
  }
  function idea(move,fen){
    if(!move)return 'Esperando una línea legal del motor.';
    const c=new Chess(fen);
    const check=move.san.includes('+')||move.san.includes('#');
    if(move.san.includes('#'))return 'La línea comienza con una amenaza decisiva de mate.';
    if(check)return 'Empieza con jaque: obliga al rival a responder y permite ganar tiempos.';
    if(move.captured)return 'Prioriza un intercambio o captura; examiná qué pieza queda defendida después.';
    if(move.flags?.includes('k')||move.flags?.includes('q'))return 'Mejora la seguridad del rey y conecta las torres.';
    if(move.piece==='p')return 'Modifica la estructura de peones; revisá casillas débiles y rupturas centrales.';
    if(move.piece==='n'||move.piece==='b')return 'Activa una pieza menor; compará sus casillas y objetivos con las otras líneas.';
    if(move.piece==='r')return 'Busca actividad de torre; comprobá columnas abiertas y entradas a séptima fila.';
    if(move.piece==='q')return 'Reubica la dama; comprobá amenazas, desarrollo y seguridad antes de aceptarla.';
    return 'Compará la actividad y coordinación de las piezas en esta variante.';
  }
  const interpretation=(item,rank)=>{
    if(!item?.moves?.length)return 'Calculando continuación…';
    const evalWhite=item.score,whiteTurn=activeFen.split(' ')[1]==='w';
    const lead=evalWhite.includes('M')?'La evaluación indica una secuencia de mate forzado, si se mantiene la mejor defensa.':(()=>{
       const value=Number(evalWhite.replace('−','-'));
       if(!Number.isFinite(value))return 'Evaluación provisional del motor.';
       const advantage=Math.abs(value)<.35?'posición aproximadamente equilibrada':Math.abs(value)<1?'ventaja ligera':Math.abs(value)<2?'ventaja apreciable':'ventaja considerable';
       return Math.abs(value)<.35?'El motor considera la posición aproximadamente equilibrada.':'El motor estima '+advantage+' para '+(value>0?'las blancas':'las negras')+'.';
    })();
    const first=item.moves[0];
    const other=rank===1?'Es la principal elección de Stockfish a la profundidad actual.':'Es una alternativa comparada con la línea principal.';
    const capture=item.moves.filter(m=>m.captured).length,checks=item.moves.filter(m=>/[+#]/.test(m.san)).length;
    const forcing=(checks?' Incluye '+checks+' jaque(s) calculados.':'')+(capture?' Hay '+capture+' captura(s) en la continuación.':'');
    const initiative=whiteTurn?'blancas':'negras';
    return lead+' '+other+' '+idea(first,activeFen)+forcing+' El turno inicial corresponde a las '+initiative+'. La evaluación puede cambiar al profundizar.';
  };
  function playbackFen(item,index){
    const c=new Chess(playback.fen);
    for(const move of item.moves.slice(0,index))c.move({from:move.from,to:move.to,promotion:move.promotion||'q'});
    return c.fen();
  }
  function showPlayback(){
    const p=document.getElementById('live-playback');
    if(!p)return;
    if(!playback){p.hidden=true;return;}
    p.hidden=false;
    const item=lines.get(playback.rank)||playback.item;
    p.querySelector('[data-progress]').textContent='Reproduciendo variante Stockfish #'+playback.rank+' · '+playback.cursor+'/'+item.moves.length+' movimientos';
    $('pv-back').disabled=playback.cursor===0;
    $('pv-next').disabled=playback.cursor>=item.moves.length;
  }
  function enterPlayback(n,index=0,fen=activeFen,source=lines){
    const item=source.get(n);
    if(!item||(!playback&&fen!==getFen()))return;
    const snapshot=new Map(source);
    index=Math.max(0,Math.min(index,item.moves.length));
    playback={rank:n,cursor:index,item,fen};
    paused=true;clearTimeout(debounce);stopWorker(); // Freeze calculated lines while replaying.
    lines=snapshot;activeFen=playback.fen;
    onPreview?.(playbackFen(item,index),true);
    draw();showPlayback();
  }
  function changePlayback(delta){
    if(!playback)return false;
    const item=playback.item;
    playback.cursor=Math.max(0,Math.min(item.moves.length,playback.cursor+delta));
    onPreview?.(playbackFen(item,playback.cursor),true);showPlayback();
    return true;
  }
  function seekPlayback(toEnd){
    if(!playback)return false;
    playback.cursor=toEnd?playback.item.moves.length:0;
    onPreview?.(playbackFen(playback.item,playback.cursor),true);showPlayback();
    return true;
  }
  function exitPlayback(){
    if(!playback)return;
    playback=null;paused=false;onLeavePreview?.();draw();update(true);
  }
  function saveVariation(item,rank,fen){
    const notes='Stockfish, alternativa '+rank+' ('+item.score+', profundidad '+item.depth+'): '+item.san+'. '+idea(item.moves[0],fen);
    onSaveVariation?.(item.moves.map(move=>move.san),notes);
  }
  function draw(){
    const principal=lines.get(1);
    onEvaluation?.(enabled&&!paused&&!playback&&activeFen===getFen()&&principal?
      {fen:activeFen,score:principal.score,depth:principal.depth}:null);
    if(enabled&&!paused&&!playback&&activeFen===getFen()&&lines.size){
      onLines?.(activeFen,[...lines.entries()].sort(([a],[b])=>a-b));
    }
    const status=$('live-status');
    status.textContent=!enabled?'Pausado':playback?'Reproduciendo variante':paused?'Análisis pausado':loading?'Cargando Stockfish':busy?'Calculando':'Listo';
    status.className='live-chip'+(busy?' live-running':'');
    $('live-depth-status').textContent=bestDepth?'Profundidad alcanzada: '+bestDepth:'Sin evaluación';
    if(!lines.size){
      $('live-lines').innerHTML='<p class="live-empty">'+(!enabled?'Activá el análisis para ver alternativas.':paused?'El motor en vivo se pausó durante Game Review.':'Esperando variantes del motor…')+'</p>';
      $('live-explanation').textContent='Stockfish evalúa la posición seleccionada. Las explicaciones son reglas educativas, no conclusiones humanas verificadas.';
      return;
    }
    const ordered=[...lines.entries()].sort((a,b)=>a[0]-b[0]);
    const host=$('live-lines');
    const focusedRank=host.contains(document.activeElement)?document.activeElement.closest('details')?.dataset.rank:null;
    for(const card of host.querySelectorAll('details[data-rank]')){
      const rank=Number(card.dataset.rank);
      if(card.open)expandedRanks.add(rank);else expandedRanks.delete(rank);
    }
    if(host.firstElementChild?.matches('details'))liveGroupOpen=host.firstElementChild.open;
    const groupFocused=document.activeElement===host.firstElementChild?.firstElementChild;
    host.replaceChildren();
    const group=document.createElement('details');group.className='live-side-group';
    const side=document.createElement('summary');
    side.textContent=new Chess(activeFen).turn()==='w'?'Líneas para blancas':'Líneas para negras';
    group.append(side);
    group.open=liveGroupOpen;
    group.addEventListener('toggle',()=>{if(group.isConnected)liveGroupOpen=group.open;});
    host.append(group);
    for(const [n,item] of ordered){
      const card=document.createElement('details');card.className='live-line live-line-accordion';
      card.dataset.rank=String(n);
      card.open=expandedRanks.has(n);
      const header=document.createElement('summary');header.className='live-line-head';
      const suggestion=item.moves[0].san;
      header.setAttribute('aria-label','Variante Stockfish '+n+', '+suggestion+', evaluación '+item.score+', profundidad '+item.depth);
      const title=document.createElement('strong');title.textContent='#'+n+' · '+suggestion+' · '+item.score;
      const depth=document.createElement('span');depth.textContent='d'+item.depth+' · '+(n===1?'Principal':'Alternativa');
      header.append(title,depth);
      card.append(header);
      const body=document.createElement('div');body.className='live-line-body';
      const variation=document.createElement('div');variation.className='live-pv';
      let playedFen=new Chess(activeFen);
      for(let j=0;j<item.moves.length;j++){
        const m=item.moves[j],parts=playedFen.fen().split(' ');
        const prefix=parts[1]==='w'?parts[5]+'. ':j===0?parts[5]+'... ':'';
        const chip=document.createElement('button');chip.type='button';chip.className='live-move-chip';
        chip.textContent=prefix+m.san;chip.title='Reproducir hasta '+m.san;
        chip.onclick=()=>enterPlayback(n,j+1);variation.append(chip);
        try{playedFen.move({from:m.from,to:m.to,promotion:m.promotion||'q'});}catch{break;}
      }
      const explanation=document.createElement('p');explanation.className='live-idea';
      explanation.textContent=interpretation(item,n);
      const actions=document.createElement('div');actions.className='live-line-actions';
      const replay=document.createElement('button');replay.type='button';replay.className='live-replay';
      replay.textContent='▶ Reproducir en tablero';replay.onclick=()=>enterPlayback(n,0);
      const save=document.createElement('button');save.type='button';save.className='live-save-line';
      save.textContent=document.querySelector('main.main')?.classList.contains('opening-study-mode')?'＋ Guardar en este estudio':'＋ Añadir al estudio';
      save.title='Guardar esta continuación como una rama vinculada a la posición actual';
      save.onclick=()=>saveVariation(item,n,activeFen);
      actions.append(replay,save);
      body.append(variation,explanation,actions);card.append(body);
      // The engine updates continuously: preserve which lines the user opened.
      card.addEventListener('toggle',()=>{if(!card.isConnected)return;if(card.open)expandedRanks.add(n);else expandedRanks.delete(n);});
      group.append(card);
      if(focusedRank===String(n))header.focus({preventScroll:true});
    }
    if(groupFocused)side.focus({preventScroll:true});
    $('live-explanation').textContent='Evaluaciones orientativas desde las blancas. Tocá una línea para mostrar u ocultar las jugadas y sus planes; Stockfish puede cambiar de opinión al profundizar.';
  }
  function configure(){
    if(!worker)return;
    worker.postMessage('setoption name Hash value 32');
    worker.postMessage('setoption name MultiPV value '+$('live-count').value);
    worker.postMessage('isready');
  }
  function pump(){
    if(!worker||!ready||busy||!enabled||paused||!queuedFen)return;
    activeFen=queuedFen;queuedFen=null;busy=true;lines=new Map();bestDepth=0;sequence++;
    worker.postMessage('position fen '+activeFen);
    worker.postMessage('go depth '+$('live-depth').value);
    draw();
  }
  function onMessage(message){
    const line=String(message).trim();
    if(line.includes('uciok')){configure();return;}
    if(line.includes('readyok')){ready=true;loading=false;pump();draw();return;}
    if(line.startsWith('bestmove')){busy=false;if(queuedFen){pump();return;}draw();return;}
    if(!line.startsWith('info ')||!busy||(queuedFen&&queuedFen!==activeFen))return;
    const mt=line.match(/\bscore (cp|mate) (-?\d+)/),pv=line.split(' pv ')[1];
    if(!mt||!pv)return;
    const rank=Number(line.match(/\bmultipv (\d+)/)?.[1]||1),depth=Number(line.match(/\bdepth (\d+)/)?.[1]||0);
    if(rank>Number($('live-count').value))return;
    if((lines.get(rank)?.depth||0)>depth)return;
    let parsed;try{parsed=pvToSan(activeFen,pv.trim().split(/\s+/));}catch{return;}
    if(!parsed.moves.length)return;
    bestDepth=Math.max(bestDepth,depth);
    lines.set(rank,{score:compactScore(mt[1],Number(mt[2]),activeFen),san:parsed.san,moves:parsed.moves,depth});
    draw();
  }
  function stopWorker(){
    if(worker){worker.terminate();worker=null;}
    loading=false;ready=false;busy=false;activeFen=null;queuedFen=null;lines.clear();bestDepth=0;
  }
  function start(){
    if(!enabled||paused)return;
    const requestedFen=queuedFen||getFen();
    stopWorker();
    queuedFen=requestedFen;
    loading=true;draw();
    try{
      worker=new Worker(getEngineUrl());
      worker.onmessage=e=>onMessage(e.data);
      worker.onerror=e=>{
        const error=String(e?.message||'motor WASM no disponible');
        stopWorker();loading=false;draw();$('live-status').textContent='Error de motor';
        if(failures++<2)notify('Error Stockfish en vivo: '+error,'err');
      };
      worker.postMessage('uci');
    }catch(e){stopWorker();notify('No se pudo iniciar el motor en vivo: '+e.message,'err');draw();}
  }
  function update(force=false){
    if(!enabled||paused)return;
    clearTimeout(debounce);
    const fen=getFen();
    if(!fen||playback)return;
    debounce=setTimeout(()=>{
      if(!worker){queuedFen=fen;start();return;}
      if(force||fen!==activeFen){
        queuedFen=fen;lines.clear();bestDepth=0;draw();
        if(ready&&busy)worker.postMessage('stop');
        else pump();
      }
    },160);
  }
  $('pv-back').onclick=()=>changePlayback(-1);
  $('pv-next').onclick=()=>changePlayback(1);
  $('pv-exit').onclick=exitPlayback;
  $('live-enabled').onchange=e=>{enabled=e.target.checked;if(!enabled){clearTimeout(debounce);stopWorker();draw();}else update(true);};
  $('live-count').onchange=()=>{const fen=getFen();stopWorker();queuedFen=fen;start();};
  $('live-depth').onchange=()=>update(true);
  $('live-restart').onclick=()=>{if(isGameReviewBusy()){notify('Game Review está analizando la partida. El análisis en directo volverá automáticamente al terminar.','err');return;}paused=false;queuedFen=getFen();start();};
  update(true);
  return {
    positionChanged:update,
    isPlayingBack:()=>Boolean(playback),
    playback:()=>playback,
    savePlayback(){if(playback)saveVariation(playback.item,playback.rank,playback.fen);},
    replayLines(fen,items,rank,index){enterPlayback(rank,index,fen,new Map(items));},
    stepPlayback:changePlayback,
    seekPlayback,
    exitPlayback,
    pause(){if(playback)exitPlayback();paused=true;clearTimeout(debounce);stopWorker();draw();},
    resume(){paused=false;update(true);},
    snapshot(){
      return {
        engine:'Stockfish 19 Lite',fen:activeFen,depth:bestDepth,
        complete:enabled&&!paused&&!loading&&!busy&&!!activeFen&&lines.size>0,
        lines:[...lines.entries()].sort((a,b)=>a[0]-b[0]).map(([rank,item])=>({
          rank,score:item.score,depth:item.depth,san:item.san
        }))
      };
    },
    dispose(){exitPlayback();clearTimeout(debounce);stopWorker();}
  };
}
