import { Chess } from 'chess.js';

// Pure helpers for the local, unpublished editorial laboratory.
// Comparing search scores only makes sense for the SAME full FEN and search context.
export function fenKey(fen){
 if(typeof fen!=='string'||fen.trim().split(/\s+/).length<4)throw Error('Se necesita una FEN válida.');
 return fen.trim().split(/\s+/).slice(0,4).join(' ');
}
export function readSanTokens(source){
 return String(source||'').replace(/\{[^}]*\}/g,' ').replace(/\d+\.(?:\.\.)?/g,' ')
  .replace(/(?:1-0|0-1|1\/2-1\/2|\*)/g,' ').trim().split(/\s+/).filter(Boolean);
}
export function verifiedLine(moves){
 const chess=new Chess(),sans=[],fens=[chess.fen()];
 for(const san of readSanTokens(moves)){
  let result;
  try{result=chess.move(san);}catch{throw Error('Movimiento ilegal: '+san+' después de '+sans.join(' '));}
  if(!result)throw Error('Movimiento ilegal: '+san);
  sans.push(result.san);fens.push(chess.fen());
 }
 if(!sans.length)throw Error('La línea no contiene jugadas.');
 return {sans,fens};
}
export function extendLegalLine(baseMoves,ply,pv){
 const base=verifiedLine(baseMoves);
 if(!Number.isInteger(ply)||ply<0||ply>base.sans.length)throw Error('Posición de bifurcación inválida.');
 const additions=readSanTokens(pv);
 if(!additions.length)throw Error('La variante del motor está vacía.');
 const total=verifiedLine([...base.sans.slice(0,ply),...additions].join(' '));
 return {moves:total.sans.join(' '),fens:total.fens,added:total.sans.slice(ply),prefix:base.sans.slice(0,ply)};
}
export function researchChecklist(catalog,metadata,scope='all'){
 const out=[],evidence=metadata?.evidence||{},masters=metadata?.masters||{},sources=metadata?.sources||{};
 const evidenceList=Object.values(evidence);
 for(const item of catalog){
  if(scope!=='all'&&item.family!==scope)continue;
  const {fens}=verifiedLine(item.moves);
  const authored=Object.keys(metadata?.notes||{}).filter(key=>key.startsWith(item.id+'|')).map(key=>key.slice(item.id.length+1));
  const criticalPlys=new Set([...Object.keys(item.notes||{}),...authored]);
  for(const raw of criticalPlys){
   const ply=Number(raw),fen=fens[ply];
   if(!Number.isInteger(ply)||ply<0||!fen)continue;
   const direct=evidence[item.id+'|'+ply],cached=direct?.fen===fen?direct:evidenceList.find(x=>x?.fen===fen);
   const hasEngine=Boolean(cached?.complete&&Array.isArray(cached.lines)&&cached.lines.length>=2&&cached.lines.every(x=>x.depth>=16));
   const hasMasters=Boolean(masters[fen]?.result&&Array.isArray(masters[fen].result.moves));
   const hasSources=Boolean(String(sources[item.id]||'').trim());
   out.push({id:item.id,family:item.family,name:item.name,ply,fen,comment:metadata?.notes?.[item.id+'|'+ply]??item.notes?.[ply]??'',hasEngine,hasMasters,hasSources,
    missing:(hasEngine?0:1)+(hasMasters?0:1)+(hasSources?0:1)});
  }
 }
 return out;
}
export function cleanSnapshot(snapshot,fen){
 if(!snapshot||snapshot.fen!==fen||snapshot.complete!==true)throw Error('Stockfish no terminó de analizar esta posición exacta.');
 const lines=Array.isArray(snapshot.lines)?snapshot.lines:[];
 if(lines.length<2||lines.length>10)throw Error('Necesitamos al menos dos variantes completas de Stockfish.');
 const depths=lines.map(x=>Number(x.depth));
 if(depths.some(x=>!Number.isInteger(x)||x<16))throw Error('Hay variantes del motor con profundidad insuficiente.');
 const unique=new Set();
 for(const item of lines){
  const rank=Number(item.rank),pv=readSanTokens(item.san);
  if(!Number.isInteger(rank)||rank<1||unique.has(rank)||!pv.length)throw Error('La respuesta MultiPV es incompleta o duplicada.');
  unique.add(rank);
  // Legal moves are validated from the exact FEN (not from the game's initial position).
  const game=new Chess(fen);
  for(const san of pv){try{if(!game.move(san))throw Error();}catch{throw Error('La variante #'+rank+' contiene una jugada ilegal: '+san);}}
 }
 return {fen,engine:String(snapshot.engine||'Stockfish'),complete:true,depth:Math.min(...depths),
  lines:lines.map(x=>({rank:Number(x.rank),score:String(x.score).slice(0,30),depth:Number(x.depth),san:String(x.san).slice(0,600)})),
  capturedAt:new Date().toISOString()};
}
