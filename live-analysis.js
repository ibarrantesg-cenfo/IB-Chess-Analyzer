import { Chess } from 'chess.js';

// UCI analysis runs in its own Web Worker. Batch Game Review is a separate engine.
// No network calls or paid API are required.
export function initLiveAnalysis({getFen,getEngineUrl,notify}) {
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
    <div id="live-lines" class="live-lines" aria-live="polite"><p class="live-empty">Iniciando motor de análisis…</p></div>
    <p id="live-explanation" class="live-explanation">Las alternativas se actualizan mientras el motor calcula. Las explicaciones son heurísticas, no texto generado por un modelo de IA.</p>
    <div class="live-footer"><span id="live-depth-status">Sin evaluación</span><button class="btn outline" id="live-restart">Reiniciar motor</button></div>`;
  const enginePanel=host.querySelector('.engine-panel');
  host.insertBefore(panel,enginePanel);
  const $=id=>document.getElementById(id);
  let worker=null,ready=false,busy=false,activeFen=null,queuedFen=null,enabled=true,loading=false,sequence=0,debounce=null,paused=false;
  let lines=new Map(),bestDepth=0,failures=0;
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
  function draw(){
    const status=$('live-status');
    status.textContent=!enabled?'Pausado':paused?'Game Review activo':loading?'Cargando Stockfish':busy?'Calculando':'Listo';
    status.className='live-chip'+(busy?' live-running':'');
    $('live-depth-status').textContent=bestDepth?'Profundidad alcanzada: '+bestDepth:'Sin evaluación';
    if(!lines.size){
      $('live-lines').innerHTML='<p class="live-empty">'+(!enabled?'Activá el análisis para ver alternativas.':paused?'El motor en vivo se pausó durante Game Review.':'Esperando variantes del motor…')+'</p>';
      $('live-explanation').textContent='Stockfish evalúa la posición seleccionada. Las explicaciones son reglas educativas, no conclusiones humanas verificadas.';
      return;
    }
    const ordered=[...lines.entries()].sort((a,b)=>a[0]-b[0]);
    const host=$('live-lines');
    host.replaceChildren();
    for(const [n,item] of ordered){
      const div=document.createElement('div');div.className='live-line';
      const header=document.createElement('div');header.className='live-line-head';
      const title=document.createElement('strong');title.textContent='#'+n+' · '+item.score;
      const depth=document.createElement('span');depth.textContent='d'+item.depth;
      header.append(title,depth);
      const variation=document.createElement('div');variation.className='live-pv';variation.textContent=item.san||'Calculando…';
      const explanation=document.createElement('p');explanation.className='live-idea';explanation.textContent=idea(item.moves[0],activeFen);
      div.append(header,variation,explanation);host.append(div);
    }
    const first=lines.get(1);
    $('live-explanation').textContent=first?'La opción principal comienza con '+(first.moves[0]?.san||'—')+'. '+idea(first.moves[0],activeFen)+' Compará las otras variantes: son opciones del motor, no recomendaciones independientes del entrenador.':'Las evaluaciones están expresadas desde la perspectiva de las blancas.';
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
    const line=String(message);
    if(line==='uciok'){configure();return;}
    if(line==='readyok'){ready=true;loading=false;pump();draw();return;}
    if(line.startsWith('bestmove')){busy=false;if(queuedFen && queuedFen!==activeFen){pump();return;}draw();return;}
    if(!line.startsWith('info ')||!busy||queuedFen && queuedFen!==activeFen)return;
    const mt=line.match(/\bscore (cp|mate) (-?\d+)/),pv=line.split(' pv ')[1];
    if(!mt||!pv)return;
    const rank=Number(line.match(/\bmultipv (\d+)/)?.[1]||1),depth=Number(line.match(/\bdepth (\d+)/)?.[1]||0);
    if(rank>Number($('live-count').value))return;
    if((lines.get(rank)?.depth||0)>depth)return;
    const parsed=pvToSan(activeFen,pv.trim().split(/\s+/));
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
    stopWorker();
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
    if(!fen)return;
    debounce=setTimeout(()=>{
      if(!worker){queuedFen=fen;start();return;}
      if(force||fen!==activeFen){
        queuedFen=fen;lines.clear();bestDepth=0;draw();
        if(ready&&busy)worker.postMessage('stop');
        else pump();
      }
    },160);
  }
  $('live-enabled').onchange=e=>{enabled=e.target.checked;if(!enabled){clearTimeout(debounce);stopWorker();draw();}else update(true);};
  $('live-count').onchange=()=>{const fen=getFen();stopWorker();queuedFen=fen;start();};
  $('live-depth').onchange=()=>update(true);
  $('live-restart').onclick=()=>{queuedFen=getFen();start();};
  update(true);
  return {
    positionChanged:update,
    pause(){paused=true;clearTimeout(debounce);stopWorker();draw();},
    resume(){paused=false;update(true);},
    dispose(){clearTimeout(debounce);stopWorker();}
  };
}
