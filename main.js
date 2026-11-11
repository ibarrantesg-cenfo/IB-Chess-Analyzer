import {initAcademyAnalytics} from './academy-analytics.js';
import {initAcademicHub} from './academic-hub.js';
import { initAcademy } from './academy.js';
import { accountDetails,onAccountChange,completeApprovedStudentOnboarding,myEnrollments } from './cloud.js';
import { playChessSound,soundSettings } from './chess-audio.js';
import { initPreferences } from './preferences.js';
import { findReview,saveReview,loadReviewProgress,saveReviewProgress,clearReviewProgress } from './review-cache.js';
import { Chess } from 'chess.js';
import { initStudio, inspectLibraryPgnSource } from './studio.js';
import { initLiveAnalysis } from './live-analysis.js';
import { initWorkspace } from './workspace.js';
import { initPerformance, gameMetrics } from './performance.js';
import { apparentPerformance } from './engine-performance.js';
import { initBoardAppearance } from './appearance.js';
import { initBoardArrows } from './board-arrows.js';
import { initLibraryWorkspace } from './library.js';
import { initOpeningResearch } from './opening-research.js';
import { ROUTES,sectionHref,sectionFromSearch,normalLinkClick } from './navigation-routes.js';
import { initSidebarLayout } from './sidebar-layout.js';
import './style.css';
import './theme-contrast.css';
import {initInterfaceIcons} from './interface-icons.js';

const $ = (s) => document.querySelector(s);
const state = {games:[], game:null, move:0, positions:[], evaluations:[], reports:[], worker:null, busy:false, stop:false, depth:18, mode:'lite', orientation:(localStorage.getItem('ib-board-orientation')==='black'?'black':'white'), lines:[], engineReady:false,analysisCache:new Map()};
const glyphs = {wk:'♔',wq:'♕',wr:'♖',wb:'♗',wn:'♘',wp:'♙',bk:'♚',bq:'♛',br:'♜',bb:'♝',bn:'♞',bp:'♟'};
const files='abcdefgh';
const engineLinesByGame=new WeakMap();
const openingMovesVisible=()=>document.querySelector('main.main').classList.contains('opening-study-mode');
const demo=`[Event "Demostración · Gambito de dama"]\n[Site "IB Chess Academy"]\n[Date "2026.10.27"]\n[White "Blancas"]\n[Black "Negras"]\n[Result "*"]\n\n1. d4 d5 2. c4 e6 3. Nc3 Nf6 4. Bg5 Be7 5. e3 O-O 6. Nf3 Nbd7 7. Rc1 c6 8. Bd3 dxc4 9. Bxc4 Nd5 10. Bxe7 Qxe7 *`;
function esc(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function parsePGN(text){
 const rows=inspectLibraryPgnSource(text);
 if(!rows.length)throw Error('No se encontraron partidas PGN.');
 const invalid=rows.filter(row=>!row.valid);
 if(invalid.length)throw Error('PGN inválido: '+invalid.length+' partida(s) con errores. '+invalid.slice(0,3).map(row=>'Partida '+row.index+': '+row.error).join(' | '));
 return rows.map(row=>{
  const chess=new Chess();
  chess.loadPgn(row.pgn,{strict:false});
  return {pgn:row.pgn,headers:chess.header(),moves:chess.history({verbose:true})};
 });
}
function loadText(text, source='Archivo PGN'){
 if(state.busy){notify('Detené el análisis antes de cargar otro PGN.','err');return 0;}
 let parsed;
 try{parsed=parsePGN(text);}catch(error){notify('No se importó '+source+': '+error.message,'err');return 0;}
 stopAnalysis();demoUntouched=false;savedGame=null;state.analysisCache.clear();state.games=parsed;chooseGame(0);window.IB_PERFORMANCE?.gameChanged();
 notify(parsed.length+' partida(s) importadas de '+source+'.');
 return parsed.length;
}
function chooseGame(i){window.IB_LIVE?.exitPlayback();state.previewFen=null;state.game=state.games[i];state.positions=[state.game.moves[0].before,...state.game.moves.map(move=>move.after)];state.move=0;const cached=state.analysisCache.get(i);state.evaluations=cached?.evaluations||[];state.reports=cached?.reports||[];state.lines=[];if(!cached){const current=state.game;findReview(current).then(saved=>{if(!saved)return;const idx=state.games.indexOf(current);if(idx<0)return;state.analysisCache.set(idx,saved);if(state.game===current){state.evaluations=saved.evaluations;state.reports=saved.reports;render();}window.IB_PERFORMANCE?.analysisFinished();}).catch(console.warn);}if(window.IB_STUDIO)window.IB_STUDIO.gameChanged();render();window.IB_LIVE?.positionChanged(true);window.IB_PERFORMANCE?.gameChanged();}
function currentBoard(){return new Chess(state.previewFen||state.positions[state.move]||new Chess().fen());}
function fmtEv(cp){if(cp==null)return '—'; if(Math.abs(cp)>5000)return (cp>0?'+':'−')+'M';return (cp>=0?'+':'')+(cp/100).toFixed(2);}
function bestSan(fen,uci){if(!uci||!fen||uci==='(none)')return '—';try{const c=new Chess(fen);return c.move({from:uci.slice(0,2),to:uci.slice(2,4),promotion:uci[4]||'q'}).san;}catch{return uci;}}
function lineSan(fen,pv){if(!fen||!Array.isArray(pv)||!pv.length)return '—';try{const c=new Chess(fen),steps=[];for(let i=0;i<Math.min(12,pv.length);i++){const u=pv[i],before=c.fen(),n=c.move({from:u.slice(0,2),to:u.slice(2,4),promotion:u[4]||'q'});const full=before.split(' ')[5],turn=before.split(' ')[1];steps.push((turn==='w'?full+'. ':i===0?full+'... ':'')+n.san);}return steps.join(' ');}catch{return pv.slice(0,9).join(' ');}}
function pieceMarkup(p){
 const piece=p.color.toLowerCase()+p.type.toUpperCase();
 const fallback=`<span class="piece piece-fallback ${p.color==='w'?'white-piece':'black-piece'}">${glyphs['b'+p.type]}</span>`;
 const set=window.IB_APPEARANCE?.getPieceSet()||(!window.IB_APPEARANCE?'cburnett':null);
 if(!set)return fallback;
 const path=import.meta.env.BASE_URL+'pieces/'+set+'/'+piece+'.svg';
 return `<span class="piece-image-wrap"><img class="piece-image" src="${path}" alt="${piece}" draggable="false" onerror="this.parentElement.classList.add('image-failed')"/>${fallback}</span>`;
}
function boardHTML(){const c=currentBoard(), reversed=state.orientation==='black', rankArr=reversed?[1,2,3,4,5,6,7,8]:[8,7,6,5,4,3,2,1], fileArr=reversed?[...files].reverse():[...files];let out='';const last=state.game?.moves[state.move-1];for(const r of rankArr) for(const f of fileArr){let sq=f+r,p=c.get(sq),highlight=last&&(last.from===sq||last.to===sq);out+=`<div class="square ${(files.indexOf(f)+r)%2===0?'light':'dark'} ${highlight?'highlight':''}" title="${sq}">${p?pieceMarkup(p):''}${f===fileArr[0]?`<span class="coord rank">${r}</span>`:''}${r===rankArr[7]?`<span class="coord file">${f}</span>`:''}</div>`;}return out;}
function render(){const g=state.game;if(!g)return;$('#game-select').innerHTML=state.games.map((x,i)=>`<option value="${i}" ${g===x?'selected':''}>${i+1}. ${esc(x.headers.White||'?')} – ${esc(x.headers.Black||'?')} (${esc(x.headers.Result||'*')})</option>`).join('');$('#game-meta').textContent=[g.headers.Event,g.headers.Date].filter(Boolean).join('  ·  ')||'Partida importada';$('#board').innerHTML=boardHTML();$('#move-count').textContent=`${state.move} / ${g.moves.length} medias jugadas`;$('#position-fen').textContent=state.positions[state.move];renderMoves();renderReport();drawChart();}
function engineBranchMarkup(ply,items){
 const playback=window.IB_LIVE?.playback();
 const fromCurrentBranch=state.move===ply&&playback?.fen===state.positions[ply];
 const branches=items.map(([rank,item])=>{
  const active=fromCurrentBranch&&playback.rank===rank;
  const first=item.moves[0];
  const number=first.before.split(' ')[5]+(first.color==='w'?'.':'…');
  const button=(label,index,classes,current=false)=>
   `<button type="button" class="${classes}" data-engine-ply="${ply}" data-engine-rank="${rank}" data-engine-index="${index}"${current?' aria-current="step"':''}>${esc(label)}</button>`;
  const suggestion=button(number+' '+first.san+' · '+item.score,1,'move engine-suggestion'+(active?' selected':''));
  if(!active)return suggestion;
  const continuation=item.moves.map((move,index)=>{
   const prefix=move.color==='w'||index===0?move.before.split(' ')[5]+(move.color==='w'?'. ':'… '):'';
   return button(prefix+move.san,index+1,'move engine-variation-step'+(playback.cursor===index+1?' selected':''),playback.cursor===index+1);
  }).join('');
  return suggestion+`<div class="engine-variation-continuation">${continuation}</div>
   <div class="engine-variation-continuation"><button type="button" class="move" data-engine-action="return">Volver a la línea principal</button><button type="button" class="move" data-engine-action="save">Guardar variante</button></div>`;
 }).join('');
 return `<div class="engine-move-branches" data-engine-origin="${ply}"><span class="engine-move-label" title="Evaluación desde las blancas">Sugerencias de Stockfish</span>${branches}</div>`;
}
function scrollMoveIntoView(list,node){
 if(!node)return;
 const top=node.offsetTop,bottom=top+node.offsetHeight;
 if(top<list.scrollTop)list.scrollTop=top-8;
 else if(bottom>list.scrollTop+list.clientHeight)list.scrollTop=bottom-list.clientHeight+8;
}
function receiveEngineLines(fen,items){
 if(!openingMovesVisible()||state.previewFen||state.positions[state.move]!==fen)return;
 let positions=engineLinesByGame.get(state.game);
 if(!positions){positions=new Map();engineLinesByGame.set(state.game,positions);}
 const ply=state.move;
 const previous=positions.get(ply);
 positions.set(ply,items);
 const list=$('#move-list');
 const existing=list.querySelector(`[data-engine-origin="${ply}"]`);
 const markup=engineBranchMarkup(ply,items);
 if(existing){
  const focused=document.activeElement;
  const rank=existing.contains(focused)?focused.dataset.engineRank:null;
  if(existing.outerHTML===markup)return;
  existing.outerHTML=markup;
  if(rank)list.querySelector(`[data-engine-origin="${ply}"] [data-engine-rank="${rank}"]`)?.focus({preventScroll:true});
 }else{
  const anchor=list.querySelector(`[data-ply="${ply}"]`);
  if(anchor)anchor.insertAdjacentHTML('afterend',markup);
  else if(ply===0)list.insertAdjacentHTML('afterbegin',markup);
 }
 if(!previous)scrollMoveIntoView(list,list.querySelector(`[data-engine-origin="${ply}"]`));
}
function renderMoves(){
 const positions=openingMovesVisible()?engineLinesByGame.get(state.game):null;
 const branchesAt=ply=>positions?.has(ply)?engineBranchMarkup(ply,positions.get(ply)):'';
 let html=branchesAt(0);
 for(let i=0;i<state.game.moves.length;i++){
  const m=state.game.moves[i],report=state.reports[i],ply=i+1;
  const active=state.move===ply;
  const white=m.color==='w';
  if(white||i===0||positions?.has(i))html+=`<span class="move-no">${m.before.split(' ')[5]}${white?'.':'…'}</span>`;
  html+=`<button type="button" class="move ${white?'move-white':'move-black'}${active?' selected':''}" data-ply="${ply}">${esc(m.san)}${report?`<span class="mark ${report.type}">${report.symbol}</span>`:''}</button>`;
  html+=branchesAt(ply);
 }
 const list=$('#move-list');
 list.innerHTML=html;
 const suggestion=list.querySelector(`[data-engine-origin="${state.move}"]`);
 const current=list.querySelector('[aria-current="step"]')||suggestion||list.querySelector('.move.selected');
 scrollMoveIntoView(list,current);
}
function jump(ply){const oldPly=state.move;window.IB_LIVE?.exitPlayback();state.move=Math.max(0,Math.min(state.positions.length-1,ply));if(Math.abs(state.move-oldPly)===1&&soundSettings().history){const move=state.game?.moves[Math.min(oldPly,state.move)];if(move){const type=move.flags?.includes('c')||move.flags?.includes('e')?'capture':move.flags?.includes('k')||move.flags?.includes('q')?'castle':move.promotion?'promotion':move.san?.includes('+')?'check':'move';playChessSound(type);}}state.previewFen=null;window.IB_STUDIO?.selectionChanged();render();window.IB_LIVE?.positionChanged();window.IB_OPENING_LAB?.positionChanged?.();}
function classify(loss,{isBest=false,interesting=false,brilliant=false}={}){
 if(loss>220)return {type:'blunder',label:'Error grave',symbol:'??'};
 if(loss>95)return {type:'mistake',label:'Error',symbol:'?'};
 if(loss>45)return {type:'inaccuracy',label:'Imprecisión',symbol:'?!'};
 if(brilliant&&isBest&&loss<=15)return {type:'brilliant',label:'Brillante',symbol:'!!'};
 if(interesting&&loss<=35)return {type:'interesting',label:'Jugada interesante',symbol:'!?'};
 if(isBest&&loss<=12)return {type:'best',label:'La mejor de la posición',symbol:'★'};
 if(loss<=8)return {type:'excellent',label:'Excelente',symbol:'!'};
 if(loss<=20)return {type:'verygood',label:'Muy buena',symbol:'✓'};
 return {type:'good',label:'Buena',symbol:'·'};
}
function classifyMove(loss,ply){
 const move=state.game?.moves[ply-1],before=state.positions[ply-1],best=state.evaluations[ply-1]?.best;
 let isBest=false,interesting=false,brilliant=false;
 try{
  const c=new Chess(before),candidate=best?c.move({from:best.slice(0,2),to:best.slice(2,4),promotion:best[4]||'q'}):null;
  isBest=!!candidate&&candidate.from===move.from&&candidate.to===move.to&&(candidate.promotion||'')===(move.promotion||'');
  const opening=ply<=16,nearEqual=Math.abs(state.evaluations[ply-1]?.cp||0)<300;
  const unusual=!!move.promotion||(!opening&&(move.san.includes('+')||move.san.includes('#')));
  interesting=isBest&&unusual&&nearEqual;
  // An apparent sacrifice must also be demonstrably non-losing. Never infer brilliance solely from engine agreement.
  brilliant=false;
 }catch{}
 return classify(loss,{isBest,interesting,brilliant});
}
function reviewInsight(ply,rep){
 if(!rep||ply<1)return '';
 const played=state.game?.moves[ply-1],before=state.positions[ply-1],after=state.positions[ply];
 if(!played||!before||!after)return '';
 const pre=state.evaluations[ply-1],post=state.evaluations[ply],best=bestSan(before,pre?.best);
 const c=new Chess(before),postBoard=new Chess(after);
 const phase=ply<=20?'apertura':ply<=60?'medio juego':'final';
 const pieceNames={p:'peón',n:'caballo',b:'alfil',r:'torre',q:'dama',k:'rey'};
 const piece=pieceNames[played.piece]||'pieza';
 const subject=played.san+' ('+piece+' hacia '+played.to+')';
 const player=ply%2?'blancas':'negras';
 const opponent=ply%2?'negras':'blancas';
 const evalBefore=pre?.cp,evalAfter=post?.cp,sign=ply%2?1:-1;
 const beforeForPlayer=Number.isFinite(evalBefore)?evalBefore*sign:null;
 const afterForPlayer=Number.isFinite(evalAfter)?evalAfter*sign:null;
 let observations=[];
 if(played.san.includes('#'))observations.push('concreta un jaque mate');
 else if(played.san.includes('+'))observations.push('obliga al rey rival a responder al jaque');
 if(played.captured)observations.push('captura un '+(pieceNames[played.captured]||'pieza')+' en '+played.to);
 if(played.promotion)observations.push('promociona el peón a '+(pieceNames[played.promotion]||'pieza'));
 if(played.flags?.includes('k')||played.flags?.includes('q'))observations.push('enroca y reorganiza la seguridad del rey');
 if(played.piece==='p'&&!played.captured&&!played.promotion)observations.push('modifica la estructura de peones en la columna '+played.to[0]);
 if(['n','b'].includes(played.piece)&&ply<=20)observations.push('desarrolla una pieza menor');
 if(postBoard.inCheck()&&!played.san.includes('+')&&!played.san.includes('#'))observations.push('deja al rey en jaque');
 const change=beforeForPlayer!==null&&afterForPlayer!==null?afterForPlayer-beforeForPlayer:null;
 const swing=change===null?'':' La evaluación desde '+player+' pasa de '+(beforeForPlayer/100).toFixed(2)+' a '+(afterForPlayer/100).toFixed(2)+' peones.';
 const alternative=best!=='—'&&best!==played.san?' Stockfish prefiere '+best+'; compará esa continuación con la jugada elegida.':'';
 const explanation=observations.length?subject+' '+observations.join(' y ')+'.':subject+' es una decisión de '+phase+' que debe evaluarse por su efecto sobre la actividad y las amenazas.';
 const assessment=rep.loss>95?' La pérdida estimada de '+rep.loss+' cp indica que el rival obtiene una oportunidad concreta.':rep.loss>45?' Se conservan recursos, pero la alternativa del motor preservaba mejor la posición.':rep.loss<=15?' La jugada conserva prácticamente toda la evaluación según la profundidad utilizada.':' La jugada es razonable, aunque permite una pequeña concesión.';
 return explanation+swing+assessment+alternative+' Revisá la respuesta más fuerte de '+opponent+' antes de decidir el siguiente plan.';
}
function renderReport(){const ply=state.move;let rep=state.reports[ply-1];let cp=state.evaluations[ply]?.cp;$('#evaluation').textContent=state.previewFen?'Variante / FEN':fmtEv(cp);$('#review-detail').innerHTML=state.previewFen?'<div class="hint"><strong>Variante en estudio</strong><p>Stockfish analiza esta posición en el panel de variantes en directo. Las evaluaciones del Game Review corresponden a la partida principal.</p></div>':ply===0?'<div class="hint">Seleccioná una jugada para consultar su evaluación y su explicación.</div>':rep?`<div class="review-badge ${rep.type}">${rep.symbol} ${rep.label}</div><div class="review-move">${Math.ceil(ply/2)}${ply%2?' .':' ...'} ${esc(state.game.moves[ply-1].san)}</div><p class="coach-insight">${esc(reviewInsight(ply,rep))}</p><div class="metric-row"><span>Pérdida estimada</span><strong>${rep.loss} cp</strong></div><div class="metric-row"><span>Evaluación anterior</span><strong>${fmtEv(state.evaluations[ply-1]?.cp)}</strong></div><div class="metric-row"><span>Evaluación actual</span><strong>${fmtEv(state.evaluations[ply]?.cp)}</strong></div><div class="metric-row"><span>Mejor jugada</span><strong>${esc(bestSan(state.positions[ply-1],state.evaluations[ply-1]?.best))}</strong></div><div class="mini-label">Variante recomendada (SAN)</div><div class="pv">${esc(lineSan(state.positions[ply-1],state.evaluations[ply-1]?.pv||[]))}</div>`:'<div class="hint">Esta jugada aún no está analizada. Pulsa «Analizar partida».</div>';
const counts={};state.reports.forEach(x=>{if(x)counts[x.label]=(counts[x.label]||0)+1;});$('#stats').innerHTML=Object.entries(counts).map(([label,n])=>`<div><strong>${n}</strong><span>${esc(label)}</span></div>`).join('');
 const bySide=gameMetrics(state.game,state.reports);
 const summaries=[['w','Blancas'],['b','Negras']];
 const countItems=[['★','Excelentes','best'],['✓','Buenas','good'],['?!','Imprecisiones','inaccuracy'],['?','Errores','mistake'],['??','Graves','blunder']];
 $('#chart-performance-status').textContent=bySide.w.complete&&bySide.b.complete?'Análisis completo · estimación heurística':state.busy?'Analizando '+(bySide.w.count+bySide.b.count)+' de '+state.game.moves.length+' medias jugadas…':'Análisis pendiente · completá Game Review';
 $('#chart-performance').innerHTML=summaries.map(([side,color])=>{const m=bySide[side],e=apparentPerformance(m);return `<article class="game-side-card"><div class="game-side-heading"><strong>${color} · Performance técnico</strong></div><div class="game-side-kpis"><div><small>Performance estimado · jugadas</small><strong>${e.value===null?'—':String(e.value)}</strong></div><div><small>Precisión estimada</small><strong>${m.count?m.quality.toFixed(1)+'%':'—'}</strong></div></div><p class="game-side-complete">${esc(e.reason)}</p></article>`;}).join('');
 $('#game-side-summary').innerHTML=summaries.map(([side,color])=>{
   const m=bySide[side],name=state.game.headers?.[side==='w'?'White':'Black']||color;
   const value=m.count?m.quality.toFixed(1)+'%':'—';
   const acpl=m.count?m.avg.toFixed(1)+' cp':'—';
    const estimate=apparentPerformance(m);
    const eloLabel=estimate.value===null?'—':String(estimate.value);
    const eloNote=estimate.value===null?estimate.reason:'Índice técnico convertido a escala Elo mediante una fórmula heurística no calibrada. No usa rating real.';
   const level=!m.count?'Pendiente':m.avg<15?'Muy preciso':m.avg<35?'Sólido':m.avg<65?'Irregular':'Necesita revisión';
   const progress=m.count?Math.min(100,m.quality):0;
   const completeness=m.count?(m.complete?'Análisis completo':m.count+' de '+m.totalMoves+' jugadas analizadas'):'Sin análisis';
   return `<article class="game-side-card"><div class="game-side-heading"><span>${color}</span><strong title="${esc(name)}">${esc(name)}</strong></div><div class="game-side-kpis"><div><small>Precisión estimada</small><strong>${value}</strong></div><div title="${esc(eloNote)}"><small>Performance estimado · jugadas</small><strong>${eloLabel}</strong></div><div><small>Rendimiento técnico</small><strong class="game-side-level">${level}</strong></div><div><small>Pérdida media (ACPL)</small><strong>${acpl}</strong></div></div><div class="game-side-progress" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(progress)}" aria-label="Índice técnico de ${color}"><i style="width:${progress}%"></i></div><div class="game-side-counts">${countItems.map(([symbol,label,type])=>`<span title="${label}"><b>${symbol}</b><strong>${m.counts[type]||0}</strong><small>${label}</small></span>`).join('')}</div><p class="game-side-complete">${completeness}</p></article>`;
 }).join('');
}
function drawChart(){const canvas=$('#chart'),rect=canvas.getBoundingClientRect(),dpr=devicePixelRatio||1;canvas.width=Math.max(200,rect.width)*dpr;canvas.height=105*dpr;const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);const w=canvas.width/dpr,h=canvas.height/dpr;ctx.clearRect(0,0,w,h);const colors=getComputedStyle(document.documentElement);ctx.fillStyle=colors.getPropertyValue('--ui-chart-bg').trim()||'#111c2c';ctx.fillRect(0,0,w,h);ctx.strokeStyle=colors.getPropertyValue('--ui-chart-grid').trim()||'#344359';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,h/2);ctx.lineTo(w,h/2);ctx.stroke();const n=state.positions.length;const pts=state.evaluations.map((e,i)=>e?{x: i/Math.max(1,n-1)*w,y: h/2-Math.tanh(e.cp/430)*(h/2-9)}:null);let started=false;ctx.strokeStyle=colors.getPropertyValue('--ui-accent').trim()||'#67d3b4';ctx.lineWidth=2;ctx.beginPath();pts.forEach(pt=>{if(!pt){started=false;return;}if(!started){ctx.moveTo(pt.x,pt.y);started=true}else ctx.lineTo(pt.x,pt.y)});ctx.stroke();let x=state.move/Math.max(1,n-1)*w;ctx.strokeStyle=colors.getPropertyValue('--ui-chart-cursor').trim()||'#f0bd68';ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}
function notify(msg,kind='ok'){$('#toast').textContent=msg;$('#toast').className=`toast ${kind} visible`;setTimeout(()=>$('#toast').classList.remove('visible'),4800);}
function status(msg){$('#engine-status').textContent=msg;}
function enginePath(){return `${import.meta.env.BASE_URL}engine/stockfish-19-${state.mode==='full'?'single':'lite-single'}.js`;}
function newEngine(signal=null){
 if(state.worker){state.worker.terminate();state.worker=null;}
 state.engineReady=false;
 return new Promise((resolve,reject)=>{
  let worker,finished=false;
  const fail=error=>{
   if(finished)return;
   finished=true;clearTimeout(timer);signal?.removeEventListener('abort',cancel);
   if(worker)worker.terminate();
   if(state.worker===worker)state.worker=null;
   reject(error);
  };
  const cancel=()=>fail(new Error('Carga de Stockfish cancelada.'));
  const timer=setTimeout(()=>fail(new Error('Stockfish no respondió al iniciar. Revisá los archivos del motor.')),30000);
  if(signal?.aborted){cancel();return;}
  try{worker=new Worker(enginePath());state.worker=worker;}
  catch(e){fail(e);return;}
  signal?.addEventListener('abort',cancel,{once:true});
  worker.onerror=e=>fail(new Error('Error al cargar Stockfish: '+(e.message||'WASM no disponible')));
  worker.onmessage=e=>{
   if(finished)return;
   if(String(e.data).includes('uciok')){
    finished=true;clearTimeout(timer);signal?.removeEventListener('abort',cancel);
    state.engineReady=true;worker.postMessage('setoption name Hash value 32');resolve(worker);
   }
  };
  worker.postMessage('uci');
 });
}
function evaluation(worker,fen,depth,{moveTimeMs=0,timeoutMs=120000,signal=null}={}){return new Promise((resolve,reject)=>{let latest={cp:null,best:null,pv:[],depth:0},finished=false;const finishError=error=>{if(finished)return;finished=true;clearTimeout(timer);signal?.removeEventListener('abort',abort);reject(error);};const abort=()=>finishError(new Error('Análisis cancelado.'));const timer=setTimeout(()=>finishError(new Error('Stockfish agotó el tiempo para esta posición.')),timeoutMs);if(signal?.aborted){finishError(new Error('Análisis cancelado.'));return;}signal?.addEventListener('abort',abort,{once:true});const turn=fen.split(' ')[1];worker.onmessage=e=>{const line=String(e.data);if(line.startsWith('info ')&&/\bscore (cp|mate) /.test(line)&&(!/\bmultipv\b/.test(line)||/\bmultipv 1\b/.test(line))){let match=line.match(/\bscore (cp|mate) (-?\d+)/);if(match){let val=match[1]==='cp'?Number(match[2]):Math.sign(Number(match[2]))*10000;latest.cp=turn==='w'?val:-val;latest.depth=Number(line.match(/\bdepth (\d+)/)?.[1]||0);latest.pv=line.split(' pv ')[1]?.trim().split(' ')||[];latest.best=latest.pv[0]||null;}}if(line.startsWith('bestmove')){clearTimeout(timer);if(finished)return;finished=true;signal?.removeEventListener('abort',abort);if(!Number.isFinite(latest.cp)){reject(new Error('Stockfish no devolvió una evaluación numérica de esta posición.'));return;}resolve({...latest,best:latest.best||line.split(' ')[1]});}};worker.onerror=e=>finishError(new Error('Stockfish falló durante el análisis: '+(e.message||'worker error')));worker.postMessage('position fen '+fen);worker.postMessage('go depth '+depth+(moveTimeMs?' movetime '+moveTimeMs:''));});}
function stopAnalysis(){state.stop=true;state.analysisController?.abort();if(state.worker){state.worker.terminate();state.worker=null;}$('#analyze').disabled=false;$('#cancel').disabled=true;}
async function analyze(options={}){if(state.busy||!state.game)return false;demoUntouched=false;const batch=options?.batch===true;window.IB_LIVE?.pause();state.busy=true;state.stop=false;state.analysisController=new AbortController();$('#game-select').disabled=true;$('#file-input').disabled=true;state.depth=batch?Math.max(8,Math.min(20,Number(options.depth)||14)):Number($('#depth').value);state.mode=batch?'lite':$('#engine-mode').value;$('#analyze').disabled=true;$('#cancel').disabled=false;$('#progress').value=0;state.evaluations=[];state.reports=[];render();let worker,startAt=0;const game=state.game,depth=state.depth,gameIndex=state.games.indexOf(game);
try{
 if(batch){
  try{
   const checkpoint=await loadReviewProgress(game,depth);
   if(checkpoint?.evaluations?.length){
    const restored=checkpoint.evaluations;
    while(startAt<state.positions.length&&Number.isFinite(restored[startAt]?.cp)&&
      (startAt===0||Number.isFinite(checkpoint.reports?.[startAt-1]?.loss)))startAt++;
    if(startAt){
     state.evaluations=restored.slice(0,startAt);
     state.reports=(checkpoint.reports||[]).slice(0,Math.max(0,startAt-1));
     options.onProgress?.(startAt,state.positions.length);
     status('Reanudando desde '+startAt+'/'+state.positions.length+' posiciones guardadas');
    }
   }
  }catch(err){console.warn('No se pudo cargar progreso anterior:',err);}
 }
 if(state.stop||state.analysisController.signal.aborted)return false;
 if(startAt<state.positions.length){status('Cargando Stockfish 19…');worker=await newEngine(state.analysisController.signal);worker.postMessage('ucinewgame');}
 for(let i=startAt;i<state.positions.length;i++){if(state.stop)break;status(`Analizando posición ${i+1} de ${state.positions.length} · profundidad ${state.depth}`);const result=await evaluation(worker,state.positions[i],state.depth,{moveTimeMs:batch?Number(options.moveTimeMs)||2200:0,timeoutMs:batch?Number(options.timeoutMs)||16000:120000,signal:state.analysisController.signal});if(state.stop)break;state.evaluations[i]=result;if(i>0){const prev=state.evaluations[i-1].cp,next=result.cp,sign=game.moves[i-1].color==='w'?1:-1;const raw=(prev-next)*sign;let loss=Math.max(0,Math.round(raw));state.reports[i-1]={...classifyMove(loss,i),loss};}$('#progress').value=Math.round((i+1)/state.positions.length*100);$('#progress-label').textContent=`${i+1}/${state.positions.length} posiciones`;if(batch&&typeof options.onProgress==='function'&&(i%4===0||i===state.positions.length-1))options.onProgress(i+1,state.positions.length);if(i%4===0||i===state.positions.length-1)render();
 if(batch&&((i+1)%6===0||i===state.positions.length-1)){
  try{await saveReviewProgress(game,{evaluations:[...state.evaluations],reports:[...state.reports]},depth);}
  catch(err){console.warn('No se pudo guardar progreso parcial:',err);}
 }
 await new Promise(r=>setTimeout(r,0));}if(state.stop){status('Análisis cancelado al finalizar la última posición.');return false;}if(!state.stop){if(state.reports.length!==game.moves.length||!state.reports.every(r=>Number.isFinite(r?.loss)))throw new Error('Faltan jugadas evaluadas; el análisis no está completo.');
 const complete={evaluations:[...state.evaluations],reports:[...state.reports]};
 state.analysisCache.set(gameIndex,complete);
 try{const saved=await saveReview(game,complete,depth,'stockfish19');if(!saved)throw Error('Revisión incompleta');if(batch)await clearReviewProgress(game,depth);}
 catch(err){console.warn('No se pudo guardar el análisis completo:',err);notify('Se analizó la partida, pero no se pudo guardar permanentemente: '+err.message,'err');}
 status('Análisis completado · Stockfish 19');
 if(!batch)notify('Revisión terminada. Seleccioná una jugada para ver su conclusión.');
 window.IB_PERFORMANCE?.analysisFinished();return true;}}catch(err){
 if(batch&&state.evaluations.length){
  try{await saveReviewProgress(game,{evaluations:[...state.evaluations],reports:[...state.reports]},depth);}
  catch(e){console.warn('No se pudo guardar el avance:',e);}
 }
 if(!state.stop){status('Error de Stockfish');options.onFailure?.(err.message);notify(err.message,'err');console.error(err);}
 return false;
}finally{if(worker)worker.terminate();state.worker=null;state.busy=false;state.analysisController=null;$('#game-select').disabled=false;$('#file-input').disabled=false;$('#analyze').disabled=false;$('#cancel').disabled=true;render();window.IB_LIVE?.resume();}}
function download(name,body,mime){const a=document.createElement('a'),url=URL.createObjectURL(new Blob([body],{type:mime}));a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
function csv(){if(!state.game)return;let rows=['Ply,Jugador,Jugada,EvaluacionBlancasCP,PerdidaCP,Clasificacion,MejorJugadaUCI,VarianteUCI'];state.game.moves.forEach((m,i)=>{const r=state.reports[i],b=state.evaluations[i];rows.push([i+1,i%2?'Negras':'Blancas',m.san,state.evaluations[i+1]?.cp??'',r?.loss??'',r?.label||'',b?.best||'',(b?.pv||[]).slice(0,10).join(' ')].map(s=>'"'+String(s).replaceAll('"','""')+'"').join(','));});download('IB_Chess_Review.csv','\ufeff'+rows.join('\n'),'text/csv;charset=utf-8');}
function annotated(){if(!state.game)return;const g=new Chess();g.header(...Object.entries(state.game.headers).flat());for(let i=0;i<state.game.moves.length;i++){g.move(state.game.moves[i].san);const r=state.reports[i];const notes=[r?`${r.label}; pérdida estimada ${r.loss}cp. ${comment(r)} ${reviewInsight(i+1,r)}`:'',window.IB_STUDIO?.getComment(i+1)||'',...(window.IB_STUDIO?.getVariations(i+1)||[]).map(v=>'Variante: '+v)].filter(Boolean);if(notes.length)g.setComment(notes.join(' | '));}download('IB_Chess_Review.pgn',g.pgn(),'application/x-chess-pgn');}
$('#app').innerHTML=`<div class="shell"><aside class="sidebar" id="app-sidebar" aria-label="Navegación principal"><div class="sidebar-toggle-row"><button type="button" class="sidebar-toggle" id="sidebar-toggle" aria-expanded="true" aria-controls="app-sidebar" aria-label="Contraer menú lateral"><span class="sidebar-toggle-icon" aria-hidden="true">«</span><span class="sidebar-toggle-label">Contraer menú</span></button></div><div class="brand brand-approved"><img class="brand-approved-image" src="./ib-chess-selected-logo.webp?v=6" alt="IB Chess Analyzer — caballo verde con lentes"/></div><div class="section-caption">ESPACIO DE ANÁLISIS</div><a href="?view=review" id="nav-review" class="nav active" draggable="true" title="Ctrl + clic o arrastrar para abrir en otra pestaña">♟ <span>Game Review</span></a><a href="?view=openings" id="nav-openings" class="nav" draggable="true" data-description="Aperturas y repertorios">♜ <span>Biblioteca Maestra</span></a><a href="?view=library" id="nav-library" class="nav" draggable="true" data-description="Tus partidas y estudios">▤ <span>Mis estudios</span></a><a href="?view=reports" id="nav-reports" class="nav" draggable="true" title="Ctrl + clic o arrastrar para abrir en otra pestaña">▥ <span>Rendimiento</span></a><div id="sidebar-academy-heading" class="section-caption sidebar-academy-heading" hidden>ACADEMIA Y ENTRENAMIENTO</div><a href="?view=academic" id="nav-academic" class="nav" draggable="true" title="Ctrl + clic o arrastrar para abrir en otra pestaña" hidden>▣ <span>Mi entrenamiento</span></a><a href="?view=academy" id="nav-academy" class="nav" draggable="true" title="Ctrl + clic o arrastrar para abrir en otra pestaña" hidden>▦ <span>Academia</span></a><a href="?view=academy-analytics" id="nav-academy-analytics" class="nav" draggable="true" title="Ctrl + clic o arrastrar para abrir en otra pestaña" hidden>▤ <span>Estadísticas de Academia</span></a><div class="section-caption sidebar-settings-heading">CONFIGURACIÓN</div><a href="?view=preferences" id="nav-preferences" class="nav" draggable="true" title="Ctrl + clic o arrastrar para abrir en otra pestaña">⚙ <span>Preferencias y cuenta</span></a><p class="sidebar-tab-tip">↗ Arrastrá una sección hacia otra pestaña o usá Ctrl + clic.</p><div class="sidebar-bottom"><div class="side-badge">STOCKFISH 19 · LOCAL</div><p>El motor calcula en tu dispositivo. Tus PGN no se envían a un servidor.</p><a href="https://github.com/nmrugg/stockfish.js" target="_blank" rel="noreferrer">Motor y licencia GPLv3 ↗</a></div></aside><button type="button" id="sidebar-scrim" class="sidebar-scrim" aria-label="Cerrar menú" hidden></button><main class="main"><button type="button" id="sidebar-mobile-toggle" class="sidebar-mobile-toggle" aria-controls="app-sidebar" aria-expanded="false" aria-label="Abrir navegación">☰ <span>Menú</span></button><header class="topbar"><div><div class="eyebrow">IB CHESS ACADEMY <span> / </span> LABORATORIO</div><h1>Game Review <span class="version">WEB v2.9</span></h1><p>Cargá una partida, analizala con Stockfish y guardala en Mis estudios.</p></div><div class="top-status"><span class="live-dot"></span> Sin suscripción <small>· motor en navegador</small></div></header><div class="toolbar"><label class="upload" for="file-input">↥ Subir archivo PGN<input type="file" id="file-input" accept=".pgn,.txt"></label><button class="btn subtle" id="example">Abrir partida de ejemplo</button><button type="button" class="btn outline" id="paste-pgn-toggle" aria-expanded="false" aria-controls="paste-pgn-panel">⌁ Pegar PGN</button><button type="button" class="btn outline" id="study-tools-shortcut" title="Abrir el editor de estudios, variantes y compartir">▤ Editar estudio</button><span class="toolbar-spacer"></span><label class="label-inline">Partida <select id="game-select"></select></label></div><section id="paste-pgn-panel" class="paste-pgn-panel" hidden aria-label="Importar partidas PGN desde texto"><div class="paste-pgn-header"><div><strong>Importar partidas o estudios PGN</strong><p>Pegá el PGN completo, con o sin etiquetas. Admite varias partidas en un mismo texto.</p></div><button type="button" class="btn outline" id="paste-pgn-close">Cerrar ✕</button></div><textarea id="paste-pgn-text" rows="6" spellcheck="false" placeholder='[Event "Mi estudio"]&#10;[White "Jugador 1"]&#10;[Black "Jugador 2"]&#10;&#10;1. e4 e5 2. Nf3 Nc6 ...'></textarea><div class="paste-pgn-actions"><button class="btn primary" type="button" id="paste-pgn-import">↥ Cargar PGN</button><span id="paste-pgn-status" role="status" aria-live="polite">Se importará a Game Review y quedará disponible para estudiar.</span></div></section><div class="layout"><section class="board-column"><div class="panel board-panel"><div class="board-compact-eval"><span class="live-dot"></span><span>Evaluación Stockfish</span><strong id="board-eval-value">—</strong><small id="board-eval-note">Analizá para obtener la evaluación</small></div><div class="player"><div class="avatar">♚</div><div><strong id="black-name">Negras</strong><button type="button" class="player-edit" data-side="Black" title="Editar nombre de negras" aria-label="Editar nombre de negras">✎</button><small id="game-meta">Partida importada</small></div><span class="player-tag">NEGRAS</span></div><div class="board-row"><div class="eval-bar"><div id="eval-fill"></div></div><div id="board" class="board" aria-label="Tablero de ajedrez"></div></div><div class="player"><div class="avatar">♔</div><div><strong id="white-name">Blancas</strong><button type="button" class="player-edit" data-side="White" title="Editar nombre de blancas" aria-label="Editar nombre de blancas">✎</button><small id="position-fen" class="fen">Posición inicial</small></div><span class="player-tag">BLANCAS</span></div><div class="controls"><button id="first" title="Inicio">⏮</button><button id="back" title="Anterior">◀</button><span id="move-count">0 / 0</span><button id="next" title="Siguiente">▶</button><button id="last" title="Final">⏭</button><button id="flip" title="Girar tablero" aria-label="Girar tablero 180 grados">⇅</button></div><section class="game-summary" id="game-summary" aria-label="Estadísticas individuales de la partida"><div class="game-summary-head"><strong>Informe técnico individual</strong><small>Después del análisis de Stockfish</small></div><div id="game-side-summary" class="game-summary-grid" aria-live="polite"></div><p class="game-summary-foot">Precisión: índice técnico estimado (0–100). Rendimiento: valoración descriptiva por jugadas y pérdida media; no equivale a un Elo FIDE de una partida.</p></section></div><div class="panel chart-panel"><div class="panel-heading"><div><h3>Gráfica de evaluación</h3><small>Perspectiva de las blancas · + ventaja blanca</small></div><strong id="evaluation">—</strong></div><canvas id="chart" aria-label="Gráfica de evaluación"></canvas><div class="chart-performance-heading"><strong>Performance estimado por jugadas</strong><small id="chart-performance-status">Esperando análisis completo de Stockfish…</small></div><div id="chart-performance" class="game-summary-grid" aria-live="polite"><p>Analizá la partida completa para obtener el Elo aparente de ambos jugadores.</p></div><p class="game-summary-foot">Performance orientativo calculado solo con el índice técnico de las jugadas analizadas; no utiliza el Elo real ni equivale a una estimación validada del nivel del jugador.</p></div></section><section class="analysis-column"><div class="panel review-panel"><div class="panel-heading"><div><div class="eyebrow">INFORME DE JUGADA</div><h2>Conclusión del análisis</h2></div></div><div id="review-detail" class="review-detail"></div><div id="stats" class="stats"></div><div class="export-actions"><button id="csv" class="btn outline">↓ Exportar CSV</button><button id="pgn" class="btn outline">↓ PGN comentado</button></div></div><div class="panel engine-panel"><div class="panel-heading"><div><div class="eyebrow">CENTRO DE CÁLCULO</div><h2>Análisis con Stockfish</h2></div><div class="engine-dot">●</div></div><div class="settings"><label>Motor<select id="engine-mode"><option value="lite">Stockfish 19 Lite · rápido</option><option value="full">Stockfish 19 completo · fuerte (94 MB)</option></select></label><label>Profundidad<select id="depth"><option value="12">12 · Exploración</option><option value="18" selected>18 · Detallado</option><option value="22">22 · Profundo</option><option value="26">26 · Muy profundo</option><option value="30">30 · Exhaustivo</option></select></label></div><div class="engine-actions"><button class="btn primary" id="analyze">✦ Analizar partida</button><button class="btn outline" id="cancel" disabled>Detener</button></div><progress id="progress" value="0" max="100"></progress><div class="engine-footer"><span id="engine-status">Motor listo para inicializar</span><span id="progress-label">0%</span></div></div><div class="panel moves-panel"><div class="panel-heading"><div><h2>Movimientos</h2><small>Seleccioná una jugada para revisar</small></div><span class="small-pill">PGN</span></div><div id="move-list" class="move-list"></div></div></section></div><footer>IB CHESS ACADEMY · Los comentarios y etiquetas son estimaciones educativas, no equivalen al Game Review comercial. <span>Procesamiento privado y local.</span></footer></main></div><div id="toast" class="toast"></div>`;
window.IB_SIDEBAR=initSidebarLayout();
$('#file-input').addEventListener('change',async e=>{const f=e.target.files[0];try{if(f)loadText(await f.text(),f.name);}catch(error){notify('No se pudo leer el archivo: '+error.message,'err');}finally{e.target.value='';}});$('#example').addEventListener('click',()=>loadText(demo,'demostración'));
const toolbar=$('.toolbar');
toolbar.insertAdjacentHTML('beforeend',`<div class="review-guide" aria-label="Recorrido de análisis">
 <p id="review-guide-status" role="status"></p>
 <button type="button" class="btn primary" id="review-guide-action">Cargar PGN</button>
 <a href="?view=library" id="review-guide-library" hidden>Ir a Mis estudios</a>
 <a href="?view=preferences" id="review-guide-account" hidden>Cuenta y respaldo</a>
</div>`);
let demoUntouched=true;
let savedGame=null;
const guideStatus=$('#review-guide-status');
const guideAction=$('#review-guide-action');
function hasCompleteReview(){
 return Boolean(state.game&&state.reports.length===state.game.moves.length&&state.reports.every(report=>Number.isFinite(report?.loss)));
}
function updateReviewGuide(){
 const complete=hasCompleteReview();
 const saved=savedGame===state.game;
 guideAction.disabled=state.busy||!state.game;
 guideAction.textContent=state.busy?'Analizando…':demoUntouched?'Cargar PGN':complete?'Guardar estudio':'Analizar partida';
 guideStatus.textContent=saved?'Guardado en este navegador. Para sincronizar, entrá a tu cuenta desde Mis estudios.':state.busy?'Stockfish está revisando las jugadas.':demoUntouched?'1 de 3 · Cargá tu PGN o abrí la partida de ejemplo.':complete?'3 de 3 · Guardá la partida para retomarla en Mis estudios.':'2 de 3 · La partida está lista para analizar con Stockfish.';
 $('#review-guide-library').hidden=!saved;
 $('#review-guide-account').hidden=!saved;
}
guideAction.onclick=async()=>{
 if(demoUntouched){togglePaste(true);return;}
 if(!hasCompleteReview()){await analyze();return;}
 const game=state.game;
 guideAction.disabled=true;
 try{
  if(await window.IB_STUDIO.saveCurrent())savedGame=game;
 }finally{updateReviewGuide();}
};
$('#review-guide-library').onclick=event=>{if(normalLinkClick(event)){event.preventDefault();$('#nav-library').click();}};
$('#review-guide-account').onclick=event=>{if(normalLinkClick(event)){event.preventDefault();$('#nav-preferences').click();}};
const pastePanel=$('#paste-pgn-panel'),pasteInput=$('#paste-pgn-text'),pasteButton=$('#paste-pgn-toggle');
const togglePaste=(open)=>{pastePanel.hidden=!open;pasteButton.setAttribute('aria-expanded',String(open));if(open)pasteInput.focus();else pasteButton.focus();};
pasteButton.onclick=()=>togglePaste(pastePanel.hidden);
$('#paste-pgn-close').onclick=()=>togglePaste(false);
$('#paste-pgn-import').onclick=()=>{
 const input=pasteInput.value.trim();
 if(!input){$('#paste-pgn-status').textContent='Pegá primero el texto PGN.';return;}
 const count=loadText(input,'texto pegado');
 if(!count){$('#paste-pgn-status').textContent='El PGN contiene partidas inválidas o incompletas. Revisá el mensaje de error; no se reemplazaron tus partidas actuales.';return;}
 $('#paste-pgn-status').textContent=count+' partida(s) cargadas correctamente.';
 togglePaste(false);
 guideAction.focus();
};

$('#game-select').addEventListener('change',e=>{stopAnalysis();chooseGame(Number(e.target.value));});$('#move-list').addEventListener('click',event=>{
 const action=event.target.closest('[data-engine-action]')?.dataset.engineAction;
 if(action==='return'){window.IB_LIVE.exitPlayback();return;}
 if(action==='save'){window.IB_LIVE.savePlayback();return;}
 const branch=event.target.closest('[data-engine-ply]');
 if(branch){
  const ply=Number(branch.dataset.enginePly);
  const items=engineLinesByGame.get(state.game)?.get(ply);
  if(!items)return;
  const rank=Number(branch.dataset.engineRank),index=Number(branch.dataset.engineIndex);
  jump(ply);
  window.IB_LIVE.replayLines(state.positions[ply],items,rank,index);
  const active=$('#move-list').querySelector('[aria-current="step"]');
  active?.focus({preventScroll:true});
  return;
 }
 const move=event.target.closest('[data-ply]');
 if(move)jump(Number(move.dataset.ply));
});
function stepDisplayedLine(delta){
 if(window.IB_LIVE?.isPlayingBack?.())return window.IB_LIVE.stepPlayback(delta);
 if(window.IB_STUDIO?.isVariationActive?.())return window.IB_STUDIO.stepVariation(delta);
 return false;
}
function seekDisplayedLine(last){
 if(window.IB_LIVE?.isPlayingBack?.())return window.IB_LIVE.seekPlayback(last);
 if(window.IB_STUDIO?.isVariationActive?.())return window.IB_STUDIO.seekVariation(last);
 return false;
}
$('#first').onclick=()=>{if(!seekDisplayedLine(false))jump(0);};
$('#back').onclick=()=>{if(!stepDisplayedLine(-1))jump(state.move-1);};
$('#next').onclick=()=>{if(!stepDisplayedLine(1))jump(state.move+1);};
$('#last').onclick=()=>{if(!seekDisplayedLine(true))jump(state.positions.length-1);};$('#flip').onclick=()=>{state.orientation=state.orientation==='white'?'black':'white';try{localStorage.setItem('ib-board-orientation',state.orientation);}catch{}render();};$('#analyze').onclick=analyze;$('#cancel').onclick=()=>{state.stop=true;status('Cancelando análisis…');};$('#csv').onclick=csv;$('#pgn').onclick=annotated;$('#chart').onclick=e=>{const r=e.currentTarget.getBoundingClientRect();jump(Math.round((e.clientX-r.left)/r.width*(state.positions.length-1)));};document.addEventListener('keydown',e=>{
 if(['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName)||e.ctrlKey||e.metaKey||e.altKey)return;
 if(e.key==='ArrowLeft'){e.preventDefault();if(!stepDisplayedLine(-1))jump(state.move-1);}
 if(e.key==='ArrowRight'){e.preventDefault();if(!stepDisplayedLine(1))jump(state.move+1);}
});window.addEventListener('resize',drawChart);
const g=parsePGN(demo);state.games=g;chooseGame(0);updateReviewGuide();$('#black-name').textContent=state.game.headers.Black||'Negras';$('#white-name').textContent=state.game.headers.White||'Blancas';
let liveBoardEvaluation=null;
function updateBoardEvaluation(){
 const fen=state.previewFen||state.positions[state.move];
 const focused=document.querySelector('main.main').classList.contains('opening-analysis-mode');
 const live=focused&&liveBoardEvaluation?.fen===fen?liveBoardEvaluation:null;
 const cp=state.evaluations[state.move]?.cp;
 let score=focused||state.previewFen?null:cp;
 if(live)score=live.score.includes('M')?(live.score.startsWith('+')?10000:-10000):Number(live.score)*100;
 $('#eval-fill').style.height=(score==null||!Number.isFinite(score)?50:50+Math.tanh(score/430)*46)+'%';
 $('#board-eval-value').textContent=focused?(live?.score||'—'):state.previewFen?'Variante':fmtEv(cp);
 $('#board-eval-note').textContent=focused?(live?'Profundidad '+live.depth:
  state.previewFen?'Variante del motor':'Evaluación de la posición') :
  state.previewFen?'Evaluación en el panel de variantes':cp==null?'Análisis pendiente':
  Math.abs(cp)<30?'Posición equilibrada':'Ventaja '+(cp>0?'blancas':'negras');
}
const initialRender=render;
render=function(){
 initialRender();
 updateReviewGuide();
 $('#black-name').textContent=[state.game?.headers.BlackTitle,state.game?.headers.Black||'Negras'].filter(Boolean).join(' ');
 $('#white-name').textContent=[state.game?.headers.WhiteTitle,state.game?.headers.White||'Blancas'].filter(Boolean).join(' ');
 updateBoardEvaluation();
};
render();

document.querySelectorAll('.player-edit').forEach(button=>button.addEventListener('click',async()=>{
 const side=button.dataset.side,old=state.game?.headers?.[side]||'';
 const next=window.prompt('Nombre del jugador ('+(side==='White'?'blancas':'negras')+')',old);
 if(next===null)return;const name=next.trim().slice(0,90);
 if(!name)return notify('El nombre no puede estar vacío.','err');
 const chess=new Chess();
 try{chess.loadPgn(state.game.pgn,{strict:false});const headers={...chess.header(),[side]:name};chess.setHeader(side,name);state.game.pgn=chess.pgn();state.game.headers=headers;state.analysisCache.clear();render();await window.IB_STUDIO?.updatePlayerNames();notify('Nombres guardados en el estudio y en su biblioteca correspondiente.');}
 catch(e){notify('Error al editar el jugador: '+e.message,'err');}
}));
window.IB_STUDIO=initStudio(state,{render:()=>{render();window.IB_LIVE?.positionChanged(true);},renderPreview:()=>{render();window.IB_LIVE?.positionChanged();},notify,loadPGN:loadText,jump});
document.querySelector('#study-tools-shortcut').onclick=()=>window.IB_STUDIO?.openTools();
window.IB_WORKSPACE=initWorkspace();
window.IB_APPEARANCE=initBoardAppearance({refreshPieces:()=>{if(state.game){$('#board').innerHTML=boardHTML();window.IB_ARROWS?.positionChanged();}}});
if(state.game)$('#board').innerHTML=boardHTML(); // restore saved SVG set immediately
window.IB_ARROWS=initBoardArrows({getFen:()=>state.previewFen||state.positions[state.move],getOrientation:()=>state.orientation,isEditing:()=>document.getElementById('studio-paint')?.checked});
window.IB_LIVE=initLiveAnalysis({isGameReviewBusy:()=>state.busy,getFen:()=>state.previewFen||state.positions[state.move],onPreview:(fen)=>{state.previewFen=fen;render();window.IB_OPENING_LAB?.previewChanged();window.IB_WORKSPACE?.variationChanged(true);},onLeavePreview:()=>{state.previewFen=null;render();window.IB_OPENING_LAB?.previewChanged();window.IB_WORKSPACE?.variationChanged(false);},onEvaluation(evaluation){liveBoardEvaluation=evaluation;updateBoardEvaluation();},onLines:receiveEngineLines,getEngineUrl:()=>`${import.meta.env.BASE_URL}engine/stockfish-19-lite-single.js`,notify,onSaveVariation:(moves,notes)=>{
 if(window.IB_OPENING_LAB?.isOpen?.()){window.IB_OPENING_LAB.addEngineVariation(moves,notes);return;}
 if(window.IB_STUDIO?.addEngineVariation(state.move,moves,notes))notify('Alternativa y comentario guardados en el estudio.');
}});


window.IB_OPENING_LAB=initOpeningResearch({
 state,loadPGN:loadText,jump,notify,
 getLiveSnapshot:()=>window.IB_LIVE?.snapshot()
});
window.IB_PERFORMANCE=initPerformance({state,notify,parsePGN,analyzeGame:analyze,cancelGame:stopAnalysis,jumpGame:i=>{if(state.busy)return;chooseGame(i);},getAnalyses:()=>state.analysisCache});

window.IB_OPEN_REPORT=async(pgn,source)=>{if(!loadText(pgn,source))return;document.querySelector('#nav-reports').click();for(let i=0;i<state.games.length;i++){try{const saved=await findReview(state.games[i]);if(saved)state.analysisCache.set(i,saved);}catch(e){console.warn(e);}}window.IB_PERFORMANCE?.analysisFinished();};
window.IB_LOAD_STUDY=(pgn,source)=>{if(!loadText(pgn,source))return;document.querySelector('#nav-reports').click();window.IB_PERFORMANCE?.analyzeCurrentStudy?.();};
window.IB_LIBRARY=initLibraryWorkspace({studio:window.IB_STUDIO,notify,onOpen:()=>{window.IB_WORKSPACE?.refresh();}});
const navReview=document.querySelector('#nav-review'),navLibrary=document.querySelector('#nav-library'),navReports=document.querySelector('#nav-reports');
navReview.onclick=()=>{window.IB_OPENING_LAB?.close();window.IB_ACADEMY_ANALYTICS?.close();window.IB_ACADEMIC?.close();window.IB_ACADEMY?.close();window.IB_PERFORMANCE.hide();window.IB_LIBRARY.close();};
document.querySelector('#nav-openings').onclick=(options)=>{
 window.IB_ACADEMY_ANALYTICS?.close();window.IB_ACADEMIC?.close();window.IB_ACADEMY?.close();
 window.IB_PERFORMANCE.hide();window.IB_LIBRARY.close();window.IB_OPENING_LAB?.open(options);
};
navLibrary.onclick=()=>{window.IB_OPENING_LAB?.close();window.IB_ACADEMY_ANALYTICS?.close();window.IB_ACADEMIC?.close();window.IB_ACADEMY?.close();window.IB_PERFORMANCE.hide();window.IB_LIBRARY.open();};
navReports.onclick=()=>{window.IB_OPENING_LAB?.close();window.IB_ACADEMY_ANALYTICS?.close();window.IB_ACADEMIC?.close();window.IB_ACADEMY?.close();window.IB_LIBRARY.close();window.IB_PERFORMANCE.show();navReview.classList.remove('active');navLibrary.classList.remove('active');};


const landingType=new URLSearchParams(location.hash.slice(1)).get('type');
const inviteLanding=landingType==='invite';
const recoveryLanding=landingType==='recovery'||new URLSearchParams(location.search).get('type')==='recovery';
if(inviteLanding)sessionStorage.setItem('ib-invite-activation','1');
window.IB_PREFERENCES=initPreferences(notify);
document.querySelector('#nav-preferences').onclick=()=>window.IB_PREFERENCES.open();
if(new URLSearchParams(location.search).get('solicitar')==='1'||inviteLanding||recoveryLanding)window.IB_PREFERENCES.open();

window.IB_SET_BOARD_ORIENTATION=(color)=>{state.orientation=color==='black'?'black':'white';render();window.IB_ARROWS?.positionChanged();};

window.IB_ACADEMIC=initAcademicHub({notify});
window.IB_ACADEMIC_CURRENT=()=>state.game?{pgn:state.game.pgn,title:(state.game.headers.White||'Blancas')+' – '+(state.game.headers.Black||'Negras'),event:state.game.headers.Event||'Sin torneo',review:{reports:state.reports,evaluations:state.evaluations,depth:state.depth}}:null;
window.IB_LOAD_ACADEMIC_GAME=(pgn,name)=>{loadText(pgn,name||'Partida compartida');navReview.click();};
window.IB_ACADEMY=initAcademy({notify,onBack:()=>navReview.click()});
window.IB_ACADEMY_ANALYTICS=initAcademyAnalytics({notify});
const academyNav=document.querySelector('#nav-academy');
const analyticsNav=document.querySelector('#nav-academy-analytics');
const academicNav=document.querySelector('#nav-academic');
academicNav.onclick=()=>{window.IB_OPENING_LAB?.close();window.IB_ACADEMY_ANALYTICS?.close();window.IB_ACADEMY?.close();window.IB_PERFORMANCE.hide();window.IB_LIBRARY.close();window.IB_ACADEMIC.open();navReview.classList.remove('active');navLibrary.classList.remove('active');navReports.classList.remove('active');};
academyNav.onclick=()=>{window.IB_OPENING_LAB?.close();window.IB_ACADEMY_ANALYTICS?.close();window.IB_ACADEMIC?.close();window.IB_PERFORMANCE.hide();window.IB_LIBRARY.close();window.IB_ACADEMY.show();navReview.classList.remove('active');navLibrary.classList.remove('active');navReports.classList.remove('active');};
analyticsNav.onclick=()=>{window.IB_OPENING_LAB?.close();window.IB_ACADEMIC?.close();window.IB_ACADEMY?.close();window.IB_PERFORMANCE.hide();window.IB_LIBRARY.close();window.IB_ACADEMY_ANALYTICS.show();navReview.classList.remove('active');navLibrary.classList.remove('active');navReports.classList.remove('active');};
let roleCheck=0;
async function updateAccountNavigation(){
 const check=++roleCheck;
 try{await completeApprovedStudentOnboarding().catch(e=>console.warn('Vinculación pendiente:',e.message));const account=await accountDetails();if(check!==roleCheck)return;const isTeacher=Boolean(account?.isTeacher);academyNav.hidden=!isTeacher;analyticsNav.hidden=!isTeacher;academicNav.hidden=!account||isTeacher;document.querySelector("#sidebar-academy-heading").hidden=!account;
 if(!isTeacher&&window.IB_ACADEMY){window.IB_ACADEMY.close();window.IB_ACADEMY_ANALYTICS?.close();}if(isTeacher)window.IB_ACADEMIC?.close();
 const indicator=document.querySelector('.top-status');
 indicator.title=account?(isTeacher?'Profesor autorizado: '+account.name:'Cuenta de alumno: '+account.name):'Sin sesión';
 if(account?.isTeacher){indicator.innerHTML='<span class="live-dot"></span> Profesor · Academia';}
 else if(account){try{const memberships=(await myEnrollments()).items||[];const valid=memberships.find(x=>x.state==='active'&&(!x.expires_at||new Date(x.expires_at).getTime()>Date.now()));indicator.innerHTML=valid?'<span class="live-dot"></span> Alumno · '+String(valid.plan||'Activo').replace(/[&<>]/g,''):'<span class="live-dot"></span> Sin acceso activo';}catch(e){indicator.textContent='Cuenta de alumno';}}
 else indicator.innerHTML='<span class="live-dot"></span> Sin sesión';
 }catch(e){academyNav.hidden=true;analyticsNav.hidden=true;academicNav.hidden=true;document.querySelector("#sidebar-academy-heading").hidden=true;window.IB_ACADEMY?.close();console.warn('No se pudo consultar el rol',e);}
}
// Native anchors keep drag-to-tab and Ctrl-click behavior. Ordinary clicks use in-page navigation.
const nativeHandlers=new Map();
for(const section of ROUTES){
 const nav=document.getElementById('nav-'+section);
 if(!nav)continue;
 nav.href=sectionHref(section,location.href);
 const handler=nav.onclick;
 nativeHandlers.set(section,handler);
 nav.onclick=null;
 nav.addEventListener('click',event=>{
  if(!normalLinkClick(event))return; // Let the browser handle Ctrl/cmd-click and tab-bar dragging.
  event.preventDefault();
  if(nav.hidden)return;
  handler?.call(nav,event);
  const requested=section==='openings'?window.IB_OPENING_LAB?.getCurrentStudy():null;
  const path=sectionHref(section,location.href,requested||'');
  if(location.pathname+location.search!==path)history.pushState({section},'',path);
  document.title=(section==='openings'?(window.IB_OPENING_LAB?.getCurrentTitle()||'Biblioteca Maestra'):nav.textContent.trim())+' · IB Chess Analyzer';
 });
}
function activateLocationSection(){
 const {view,study,analysis,family}=sectionFromSearch(location.search);
 const nav=document.getElementById('nav-'+view);
 if(!nav||nav.hidden){nativeHandlers.get('review')?.();return;}
 if(view==='openings'){
  nativeHandlers.get(view)?.call(nav,{study,analysis,family,ply:analysis?undefined:history.state?.openingPly??0});
 }else nativeHandlers.get(view)?.call(nav);
 document.title=(view==='openings'?(window.IB_OPENING_LAB?.getCurrentTitle()||'Biblioteca Maestra'):nav.textContent.trim())+' · IB Chess Analyzer';
}
window.addEventListener('popstate',activateLocationSection);
onAccountChange(updateAccountNavigation);
updateAccountNavigation().then(activateLocationSection).catch(error=>console.warn('No se pudo abrir la sección solicitada:',error));

initInterfaceIcons();
window.addEventListener('ib-theme-change',drawChart);
