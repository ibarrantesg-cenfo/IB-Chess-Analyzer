import { Chess } from 'chess.js';
import { verifiedLine } from './opening-research-tools.js';
import { normalizeMasterResults } from './opening-masters.js';
const SAFE_KEYS=/^[a-z0-9][a-z0-9:|._-]{0,140}$/i;
const cleanMap=(obj,maxItems,maxText)=> {
 const result=Object.create(null);
 if(!obj||typeof obj!=='object'||Array.isArray(obj))return result;
 if(Object.keys(obj).length>maxItems)throw Error('El respaldo supera el número de entradas permitido.');
 for(const [key,value] of Object.entries(obj)){
  if(!SAFE_KEYS.test(key)||['__proto__','constructor','prototype'].includes(key))continue;
  if(typeof value==='string'&&value.length<=maxText)result[key]=value;
 }
 return result;
};
function rawMap(obj,maxEntries=1500){
 const out=Object.create(null);
 if(!obj||typeof obj!=='object'||Array.isArray(obj))return out;
 if(Object.keys(obj).length>maxEntries)throw Error('Demasiadas posiciones en el respaldo.');
 for(const [key,value] of Object.entries(obj)){
  if(key.length>200||['__proto__','constructor','prototype'].includes(key))continue;
  out[key]=value;
 }
 return out;
}
export function buildOpeningBackup(data){
 return {format:'ib-academy-opening-research',version:1,exportedAt:new Date().toISOString(),
  custom:data.custom||[],notes:data.notes||{},sources:data.sources||{},evidence:data.evidence||{},masters:data.masters||{}};
}
export function validateOpeningBackup(raw){
 if(!raw||raw.format!=='ib-academy-opening-research'||raw.version!==1)throw Error('No es un respaldo compatible de la Biblioteca Maestra.');
 if(!Array.isArray(raw.custom)||raw.custom.length>500)throw Error('El respaldo excede el límite de 500 variantes personales.');
 const custom=[],ids=new Set();
 for(const item of raw.custom){
  if(typeof item?.id!=='string'||!SAFE_KEYS.test(item.id)||ids.has(item.id))throw Error('Identificador de variante inválido o duplicado.');
  const family=String(item.family||''),name=String(item.name||''),moves=String(item.moves||''),eco=String(item.eco||'');
  if(family.length>100||!family||!name||name.length>180||moves.length>10000||eco.length>12)throw Error('Metadatos de variante inválidos.');
  verifiedLine(moves);
  ids.add(item.id);
  custom.push({id:item.id,family,name,moves,eco,
   research:String(item.research||'').slice(0,1200),reference:/^https:\/\//.test(item.reference||'')?String(item.reference).slice(0,500):'',
   notes:{},origin:item.origin&&typeof item.origin==='object'?
    {type:String(item.origin.type||'').slice(0,40),parent:String(item.origin.parent||'').slice(0,150),parentPly:Number(item.origin.parentPly)||0}:undefined});
 }
 const notes=cleanMap(raw.notes,20000,4000),sources=cleanMap(raw.sources,3000,4000);
 const evidence=rawMap(raw.evidence,10000),verifiedEvidence=Object.create(null);
 for(const [key,item] of Object.entries(evidence)){
  if(!item||typeof item!=='object'||item.complete!==true||typeof item.fen!=='string')continue;
  try{
   new Chess(item.fen);
   if(!Array.isArray(item.lines)||item.lines.length<2||item.lines.length>10)continue;
   const lines=[];
   for(const x of item.lines){
    if(!Number.isInteger(Number(x.rank))||Number(x.depth)<16||String(x.san||'').length>700)throw Error();
    lines.push({rank:Number(x.rank),depth:Number(x.depth),score:String(x.score||'').slice(0,30),san:String(x.san)});
   }
   verifiedEvidence[key]={fen:item.fen,complete:true,engine:String(item.engine||'Stockfish').slice(0,80),depth:Math.min(...lines.map(x=>x.depth)),
    capturedAt:String(item.capturedAt||'').slice(0,40),lines};
  }catch{/* Discard malformed engine evidence; never relabel it as verified. */}
 }
 const masters=rawMap(raw.masters,10000),verifiedMasters=Object.create(null);
 for(const [fen,item] of Object.entries(masters)){
  try{
   new Chess(fen);
   if(!item?.result)continue;
   verifiedMasters[fen]={result:normalizeMasterResults({...item.result,topGames:item.result.games||item.result.topGames}),capturedAt:String(item.capturedAt||'').slice(0,40),provider:'Lichess Masters'};
  }catch{/* Skip malformed external responses. */}
 }
 return {custom,notes,sources,evidence:verifiedEvidence,masters:verifiedMasters};
}
