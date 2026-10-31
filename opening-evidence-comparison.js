import {readSanTokens} from './opening-research-tools.js';

// Comparison of observations only; never an engine recommendation based on popularity.
export function compareOpeningEvidence(snapshot,masters){
 const engine=Array.isArray(snapshot?.lines)?snapshot.lines.filter(x=>Number(x.depth)>=16).slice().sort((a,b)=>a.rank-b.rank):[];
 const moves=Array.isArray(masters?.moves)?masters.moves.map(x=>({
  san:String(x.san||''),count:Number(x.white||0)+Number(x.draws||0)+Number(x.black||0),
  score:Number(x.white||0)+Number(x.draws||0)/2,averageRating:Number(x.averageRating||0)
 })).filter(x=>x.san&&Number.isFinite(x.count)&&x.count>=0):[];
 const sample=Number(masters?.white||0)+Number(masters?.draws||0)+Number(masters?.black||0);
 const best=engine[0],bestSan=readSanTokens(best?.san)[0]||'';
 const popular=moves.slice().sort((a,b)=>b.count-a.count)[0]||null;
 const bestMaster=moves.find(x=>x.san===bestSan)||null;
 const matches=Boolean(bestSan&&popular?.san===bestSan);
 return {sample:Number.isFinite(sample)?sample:0,engineBest:bestSan,engineEval:best?.score||'',
  engineDepth:best?.depth||0,mostPlayed:popular?.san||'',mostPlayedCount:popular?.count||0,
  engineBestMasterCount:bestMaster?.count||0,match:matches,hasBoth:Boolean(bestSan&&popular&&snapshot?.complete&&sample>0&&popular.count>0),
  moves: moves.sort((a,b)=>b.count-a.count)};
}
