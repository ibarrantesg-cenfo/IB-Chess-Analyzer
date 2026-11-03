import {verifiedLine,extendLegalLine,readSanTokens} from './opening-research-tools.js';
import {parsePersonalOpeningStudy} from './opening-study-import.js';

// Convert a written continuation or a full PGN into a legal branch of a study.
// The full PGN must actually reach the selected position before deviating.
export function spanishToInternationalSan(text){
 const map={C:'N',A:'B',D:'Q',T:'R',R:'K'};
 return readSanTokens(text).map(token=>{
  if(/^(O|0)-(O|0)(-(O|0))?[+#]?$/.test(token))return token.replace(/0/g,'O');
  return token.replace(/^([CADTR])(?=[a-h1-8x])/,(_,piece)=>map[piece])
    .replace(/=([CADTR])(?=[+#]?$)/g,(_,piece)=>map[piece]);
 }).join(' ');
}
export function prepareOpeningBranch(baseMoves,ply,source,mode='san'){
 const base=verifiedLine(baseMoves);
 if(!Number.isInteger(ply)||ply<0||ply>base.sans.length)throw Error('Seleccioná una posición válida del estudio.');
 const raw=String(source||'').trim();
 if(!raw)throw Error('Escribí las jugadas de la variante o cargá un PGN.');
 if(raw.length>250000)throw Error('La variante supera el límite de tamaño.');
 let continuation='';
 if(mode==='pgn'){
  const parsed=parsePersonalOpeningStudy(raw);
  const sourceLine=verifiedLine(parsed.moves);
  if(sourceLine.sans.length<=ply)throw Error('El PGN termina antes de la posición elegida. Cambiá el punto de bifurcación.');
  const prefix=sourceLine.fens[ply],wanted=base.fens[ply];
  if(prefix!==wanted)throw Error('El PGN no llega a la posición seleccionada. Debe incluir las jugadas previas del estudio antes de bifurcar.');
  continuation=sourceLine.sans.slice(ply).join(' ');
 }else if(mode==='san'){
  continuation=raw;
 }else if(mode==='san-es'){
  continuation=spanishToInternationalSan(raw);
 }else throw Error('Elegí el formato de la variante.');
 const result=extendLegalLine(baseMoves,ply,continuation);
 if(result.added.length>120)throw Error('La rama supera 120 medias jugadas. Dividila en capítulos más pequeños.');
 if(result.moves===base.sans.join(' '))throw Error('La rama es idéntica a la continuación principal. Elegí otra jugada.');
 return {...result,basePly:ply,baseFen:base.fens[ply],method:mode};
}
export function describesStudyBranch(origin,rootId){
 return origin?.parent===rootId||origin?.rootStudy===rootId;
}
export function studyRootId(catalog,id){
 const map=new Map(catalog.map(x=>[x.id,x]));
 let current=id;
 const visited=new Set();
 while(map.has(current)&&map.get(current).origin?.parent&&!visited.has(current)){
  visited.add(current);
  const parent=map.get(current).origin.parent;
  if(!map.has(parent))break;
  current=parent;
 }
 return current;
}
