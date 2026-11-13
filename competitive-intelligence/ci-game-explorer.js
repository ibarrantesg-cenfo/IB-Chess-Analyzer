import {Chess} from 'chess.js';

/** Pure game browser helpers. Metadata extracted from the original PGN, not guessed. */
export function ciGameMetadata(record){
 const board=new Chess();
 try{board.loadPgn(String(record?.pgn||''),{strict:false});}catch{return null;}
 const h=board.header(),moves=board.history();
 if(!moves.length)return null;
 const color=record.player_color;
 const rawDate=String(record.played_at||h.Date||'');
 const year=(rawDate.match(/^\d{4}/)||[])[0]||'unknown';
 const tournament=String(h.Event||record.source_name||'Evento sin identificar').trim();
 const eco=String(h.ECO||'').trim().toUpperCase()||'Sin ECO';
 const opponent=String(color==='w'?h.Black:color==='b'?h.White:'').trim()||'Rival sin identificar';
 const result=String(h.Result||'*').trim();
 const outcome=result==='1/2-1/2'?'draw':result==='*'?'unknown':color==='w'?(result==='1-0'?'win':'loss'):color==='b'?(result==='0-1'?'win':'loss'):'unknown';
 const timeControl=String(record.time_control||h.TimeControl||'').trim();
 return {id:record.id,record,year,tournament,eco,color,opponent,result,outcome,timeControl,moves:moves.length,sequence:moves.slice(0,8).join(' ')};
}
export function createCIGameIndex(records=[]){
 return records.map(ciGameMetadata).filter(Boolean);
}
export function gameFilterOptions(index){
 const values=key=>[...new Set(index.map(g=>g[key]).filter(v=>v&&v!=='unknown'))].sort((a,b)=>String(a).localeCompare(String(b),'es'));
 return {years:values('year').sort((a,b)=>Number(b)-Number(a)),tournaments:values('tournament'),ecos:values('eco'),timeControls:values('timeControl')};
}
export function filterCIGames(index,filters={}){
 const text=String(filters.query||'').trim().toLocaleLowerCase('es');
 return index.filter(g=>{
  if(filters.year&&filters.year!=='all'&&g.year!==filters.year)return false;
  if(filters.tournament&&filters.tournament!=='all'&&g.tournament!==filters.tournament)return false;
  if(filters.color&&filters.color!=='all'&&g.color!==filters.color)return false;
  if(filters.outcome&&filters.outcome!=='all'&&g.outcome!==filters.outcome)return false;
  if(filters.eco&&filters.eco!=='all'&&g.eco!==filters.eco)return false;
  if(filters.timeControl&&filters.timeControl!=='all'&&g.timeControl!==filters.timeControl)return false;
  return !text||[g.opponent,g.tournament,g.eco,g.sequence,g.year].some(x=>String(x).toLocaleLowerCase('es').includes(text));
 }).sort((a,b)=>b.year.localeCompare(a.year)||String(b.record.played_at||'').localeCompare(String(a.record.played_at||'')));
}
export function ciFilterStats(games){
 const result={total:games.length,white:0,black:0,wins:0,draws:0,losses:0,unknown:0};
 for(const g of games){if(g.color==='w')result.white++;if(g.color==='b')result.black++;if(g.outcome==='win')result.wins++;else if(g.outcome==='draw')result.draws++;else if(g.outcome==='loss')result.losses++;else result.unknown++;}
 return result;
}
